<?php

namespace Tests\Feature;

use App\Models\SecurityScan;
use App\Models\User;
use App\Services\SecurityReportImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityAssessmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_zap_import_redacts_bearer_material_and_deduplicates_report(): void
    {
        $contents = json_encode([
            '@programName' => 'OWASP ZAP',
            'site' => [[
                '@name' => 'https://rikms-staging.v3ra.net',
                'alerts' => [[
                    'pluginid' => '10021',
                    'name' => 'Missing anti-clickjacking header',
                    'riskdesc' => 'Medium (2)',
                    'confidence' => 'High',
                    'desc' => 'Authorization: Bearer super-secret-token was observed.',
                    'solution' => '<p>Set a restrictive frame policy.</p>',
                    'cweid' => '1021',
                    'instances' => [[
                        'uri' => 'https://rikms-staging.v3ra.net/login?token=must-not-persist',
                        'method' => 'GET',
                        'param' => 'X-Frame-Options',
                    ]],
                ]],
            ]],
        ], JSON_THROW_ON_ERROR);

        $importer = resolve(SecurityReportImporter::class);
        $first = $importer->import($contents, 'zap', [
            'target_url' => 'https://rikms-staging.v3ra.net?authorization=must-not-persist',
            'target_environment' => 'staging',
            'revision' => 'rikms-app-00007-test',
        ]);
        $second = $importer->import($contents, 'zap');

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, SecurityScan::query()->count());
        $finding = $first->findings->firstOrFail();
        $this->assertSame('medium', $finding->severity);
        $this->assertSame('CWE-1021', $finding->cwe);
        $this->assertSame('https://rikms-staging.v3ra.net/', $first->target_url);
        $this->assertSame('https://rikms-staging.v3ra.net/login', $finding->endpoint);
        $this->assertStringNotContainsString('super-secret-token', (string) $finding->description);
        $this->assertStringNotContainsString('must-not-persist', (string) $finding->endpoint);
    }

    public function test_security_assessment_api_is_two_factor_admin_only_and_never_exposes_report_path(): void
    {
        $admin = $this->withConfirmedTwoFactor(User::factory()->create([
            'role' => 'super_admin',
            'agency_id' => null,
            'is_active' => true,
            'must_change_password' => false,
        ]));
        $agencyUser = User::factory()->create([
            'role' => 'agency_admin',
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $scan = resolve(SecurityReportImporter::class)->import(json_encode([
            'mode' => 'active',
            'findings' => [[
                'id' => 'AUTH-001',
                'title' => 'Authorization observation',
                'severity' => 'high',
                'observed' => 'Sanitized boundary evidence.',
                'endpoint' => '/api/rikms/admin/security',
            ]],
        ], JSON_THROW_ON_ERROR), 'rikms-native', [
            'target_url' => 'http://127.0.0.1:8000',
            'report_disk' => 'security-reports',
            'report_path' => 'private/raw/report.json',
        ]);
        $this->assertSame('active', $scan->scan_mode);
        $this->assertSame('/api/rikms/admin/security', $scan->findings->firstOrFail()->endpoint);

        $denied = $this->actingAs($agencyUser)->getJson('/api/rikms/admin/security');
        $this->assertContains($denied->status(), [401, 403]);
        $response = $this->actingAs($admin)->getJson('/api/rikms/admin/security')
            ->assertOk()
            ->assertJsonPath('data.assessment.latestScan.evidenceStored', true)
            ->assertJsonPath('data.assessment.openCounts.high', 1);
        $this->assertStringNotContainsString('private/raw/report.json', $response->getContent());
        $this->assertStringNotContainsString('reportPath', $response->getContent());
    }

    public function test_pending_private_report_is_imported_and_moved_out_of_incoming(): void
    {
        Storage::fake('security-reports');
        config(['security.reports_disk' => 'security-reports']);
        $incoming = 'incoming/staging/rikms-app-00007-test/native-report.json';
        Storage::disk('security-reports')->put($incoming, json_encode([
            'target' => 'https://rikms-staging.v3ra.net',
            'findings' => [[
                'id' => 'HDR-001',
                'title' => 'Missing security header',
                'severity' => 'medium',
                'observed' => 'Header was absent.',
            ]],
        ], JSON_THROW_ON_ERROR));

        $this->artisan('rikms:security-import-pending')->assertSuccessful();

        Storage::disk('security-reports')->assertMissing($incoming);
        $this->assertCount(1, Storage::disk('security-reports')->allFiles('processed'));
        $this->assertDatabaseHas('security_scans', [
            'provider' => 'native',
            'target_environment' => 'staging',
            'revision' => 'rikms-app-00007-test',
        ]);
    }
}
