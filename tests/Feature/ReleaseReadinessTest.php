<?php

namespace Tests\Feature;

use App\Models\AccessRequest;
use App\Models\Agency;
use App\Models\AuthenticationEvent;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\DownloadGrant;
use App\Models\SdgTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class ReleaseReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_blank_documents_root_falls_back_to_private_storage(): void
    {
        $this->assertSame(storage_path('app/private'), config('filesystems.disks.documents.root'));
    }

    public function test_public_endpoints_do_not_expose_unpublished_records_or_private_metadata(): void
    {
        [$agency, $uploader] = $this->agencyAccount('privacy');
        $draft = $this->document($agency, $uploader, [
            'title' => 'CONFIDENTIAL DRAFT TITLE',
            'status' => 'draft',
        ]);
        $published = $this->document($agency, $uploader, [
            'title' => 'Public research title',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $published->metadata()->update([
            'abstract' => 'PRIVATE-ABSTRACT-NEVER-EXPOSE',
            'methodology' => 'PRIVATE-METHODOLOGY-NEVER-EXPOSE',
        ]);
        $published->publicFields()->where('field_name', 'abstract')->update(['is_public' => false]);
        $published->publicFields()->where('field_name', 'methodology')->update(['is_public' => false]);

        AccessRequest::create([
            'document_id' => $published->id,
            'requester_name' => 'Private Requester',
            'requester_email' => 'private-requester@example.test',
            'message' => 'This message must never be part of public bootstrap data.',
        ]);

        $bootstrap = $this->getJson('/api/rikms/bootstrap')
            ->assertOk()
            ->assertJsonMissingPath('accessRequests')
            ->assertJsonMissingPath('auditLogs');

        $payload = $bootstrap->getContent();
        $this->assertStringNotContainsString($draft->title, $payload);
        $this->assertStringNotContainsString('private-requester@example.test', $payload);
        $this->assertStringNotContainsString('PRIVATE-ABSTRACT-NEVER-EXPOSE', $payload);
        $this->assertStringNotContainsString('PRIVATE-METHODOLOGY-NEVER-EXPOSE', $payload);

        $this->getJson("/api/rikms/public/documents/{$draft->id}")->assertNotFound();
        $this->getJson("/api/rikms/public/documents/{$published->id}")
            ->assertOk()
            ->assertJsonPath('data.abstract', '');
    }

    public function test_public_search_cannot_infer_a_private_metadata_field(): void
    {
        [$agency, $uploader] = $this->agencyAccount('search');
        $published = $this->document($agency, $uploader, [
            'title' => 'Publicly discoverable title',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $published->metadata()->update([
            'abstract' => 'NEVER-SEARCH-PRIVATE-TOKEN',
            'keywords' => ['PRIVATE-KEYWORD-NEVER-INFER'],
        ]);
        $published->publicFields()->where('field_name', 'abstract')->update(['is_public' => false]);
        $published->publicFields()->where('field_name', 'keywords')->update(['is_public' => false]);

        $this->getJson('/api/rikms/public/documents?search=NEVER-SEARCH-PRIVATE-TOKEN')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson('/api/rikms/public/documents?search=PRIVATE-KEYWORD-NEVER-INFER')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_role_boundaries_and_agency_isolation_are_enforced(): void
    {
        [$agencyA, $agencyAdminA] = $this->agencyAccount('alpha');
        [$agencyB, $agencyAdminB] = $this->agencyAccount('beta');
        $superAdmin = $this->superAdmin();
        $documentB = $this->document($agencyB, $agencyAdminB);

        $this->actingAs($agencyAdminA)->getJson('/api/rikms/admin/dashboard')->assertForbidden();
        $this->actingAs($superAdmin)->getJson('/api/rikms/agency/dashboard')->assertForbidden();
        $this->actingAs($agencyAdminA)
            ->getJson("/api/rikms/agency/documents/{$documentB->id}")
            ->assertForbidden();

        $this->actingAs($agencyAdminA)->get('/admin/dashboard')->assertForbidden();
        $this->actingAs($superAdmin)->get('/agency/dashboard')->assertForbidden();
        $this->actingAs($agencyAdminB)
            ->getJson("/api/rikms/agency/documents/{$documentB->id}")
            ->assertOk();

        $this->assertNotSame($agencyA->id, $agencyB->id);
    }

    public function test_inactive_accounts_and_agencies_cannot_authenticate_or_use_protected_apis(): void
    {
        [, $inactiveUser] = $this->agencyAccount('inactive-user');
        [$inactiveAgency, $agencyUser] = $this->agencyAccount('inactive-agency');
        $inactiveUser->update(['is_active' => false]);
        $inactiveAgency->update(['is_active' => false]);

        $this->postJson('/login', [
            'email' => $inactiveUser->email,
            'password' => 'correct-horse-battery-staple',
        ])->assertUnprocessable();
        $this->postJson('/login', [
            'email' => $agencyUser->email,
            'password' => 'correct-horse-battery-staple',
        ])->assertUnprocessable();

        $this->actingAs($inactiveUser)->getJson('/api/rikms/agency/dashboard')->assertUnauthorized();
        $this->actingAs($agencyUser)->getJson('/api/rikms/agency/dashboard')->assertUnauthorized();
    }

    public function test_document_submission_is_review_gated_and_requires_a_real_source(): void
    {
        Storage::fake('documents');
        [, $agencyAdmin] = $this->agencyAccount('workflow');
        $superAdmin = $this->superAdmin();
        SdgTag::firstOrCreate(['number' => 9], [
            'name' => 'Industry, Innovation and Infrastructure',
            'short_name' => 'Industry',
            'color' => '#FD6925',
        ]);

        $draftResponse = $this->actingAs($agencyAdmin)->postJson('/api/rikms/documents', [
            'document_type' => 'research',
            'submit_mode' => 'draft',
            'metadata' => ['title' => 'Review-gated record', 'authors' => ['Researcher']],
            'public_fields' => ['title'],
            'access_mode' => 'public_download',
        ])->assertCreated()->assertJsonPath('status', 'draft');

        $draftId = $draftResponse->json('documentId');
        $this->actingAs($agencyAdmin)
            ->postJson("/api/rikms/agency/documents/{$draftId}/submit")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_file');

        $submitted = $this->actingAs($agencyAdmin)->post('/api/rikms/documents', [
            'document_type' => 'research',
            'submit_mode' => 'submit',
            'metadata' => json_encode(['title' => 'Ready for independent review', 'authors' => ['Researcher']]),
            'public_fields' => json_encode(['title']),
            'sdg_tags' => json_encode([9]),
            'access_mode' => 'request_access',
            'document_file' => UploadedFile::fake()->create('research.pdf', 16, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('status', 'pending');

        $documentId = $submitted->json('documentId');
        $this->actingAs($agencyAdmin)
            ->postJson("/api/rikms/admin/documents/{$documentId}/approve")
            ->assertForbidden();

        $this->actingAs($superAdmin)
            ->postJson("/api/rikms/admin/documents/{$documentId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'status' => 'published',
            'reviewed_by' => $superAdmin->id,
        ]);
        $this->assertNotNull(Document::findOrFail($documentId)->published_at);
    }

    public function test_published_edits_return_to_draft_and_require_review_again(): void
    {
        [$agency, $agencyAdmin] = $this->agencyAccount('republish');
        $document = $this->document($agency, $agencyAdmin, [
            'status' => 'published',
            'published_at' => now(),
            'reviewed_at' => now(),
        ]);

        $this->actingAs($agencyAdmin)
            ->patchJson("/api/rikms/agency/documents/{$document->id}", [
                'metadata' => ['title' => 'Materially revised title'],
                'change_summary' => 'Updated findings after validation.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        $document->refresh();
        $this->assertSame('draft', $document->status);
        $this->assertNull($document->published_at);
        $this->assertNull($document->reviewed_at);
    }

    public function test_access_request_approval_issues_a_limited_signed_download_and_prevents_duplicates(): void
    {
        Notification::fake();
        Storage::fake('documents');
        [$agency, $agencyAdmin] = $this->agencyAccount('access');
        $document = $this->document($agency, $agencyAdmin, [
            'status' => 'published',
            'published_at' => now(),
            'access_mode' => 'request_access',
            'file_path' => 'research-documents/private-paper.pdf',
            'original_filename' => 'private-paper.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 15,
        ]);
        Storage::disk('documents')->put($document->file_path, '%PDF-1.4 private');

        $requestPayload = [
            'requester_name' => 'External Researcher',
            'requester_email' => 'Researcher@Example.Test',
            'requester_organization' => 'Public University',
            'message' => 'Please grant access for a validated academic study.',
        ];
        $created = $this->postJson(
            "/api/rikms/public/documents/{$document->id}/access-requests",
            $requestPayload,
        )->assertCreated();
        $accessRequestId = $created->json('data.id');

        $this->postJson(
            "/api/rikms/public/documents/{$document->id}/access-requests",
            $requestPayload,
        )->assertUnprocessable()->assertJsonValidationErrors('requester_email');

        [, $otherAgencyAdmin] = $this->agencyAccount('access-other');
        $this->actingAs($otherAgencyAdmin)
            ->postJson("/api/rikms/agency/access-requests/{$accessRequestId}/approve")
            ->assertForbidden();

        $approval = $this->actingAs($agencyAdmin)
            ->postJson("/api/rikms/agency/access-requests/{$accessRequestId}/approve", [
                'reason' => 'The stated research use is appropriate.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $downloadUrl = $approval->json('downloadUrl');
        $this->assertIsString($downloadUrl);
        $grant = DownloadGrant::where('access_request_id', $accessRequestId)->firstOrFail();
        $grant->update(['max_downloads' => 1]);
        $this->postJson('/logout')->assertOk();

        $download = $this->get($downloadUrl)->assertOk();
        $cacheControl = (string) $download->headers->get('cache-control');
        $this->assertStringContainsString('private', $cacheControl);
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->get($downloadUrl)->assertForbidden();

        $this->assertDatabaseHas('download_events', [
            'document_id' => $document->id,
            'download_grant_id' => $grant->id,
        ]);
        $this->assertSame(1, $grant->fresh()->download_count);
    }

    public function test_changing_access_mode_and_archiving_revoke_existing_download_grants(): void
    {
        [$agency, $agencyAdmin] = $this->agencyAccount('revoke');
        $document = $this->document($agency, $agencyAdmin, [
            'status' => 'published',
            'published_at' => now(),
            'access_mode' => 'request_access',
        ]);
        $grant = DownloadGrant::create([
            'document_id' => $document->id,
            'email' => 'holder@example.test',
            'token_hash' => hash('sha256', 'first-grant'),
            'expires_at' => now()->addDay(),
            'max_downloads' => 5,
            'created_by' => $agencyAdmin->id,
        ]);

        $this->actingAs($agencyAdmin)
            ->patchJson("/api/rikms/agency/documents/{$document->id}", [
                'access_mode' => 'restricted_admin',
                'change_summary' => 'Restricted after a sensitivity review.',
            ])->assertOk();
        $this->assertNotNull($grant->fresh()->revoked_at);

        $secondGrant = DownloadGrant::create([
            'document_id' => $document->id,
            'email' => 'second@example.test',
            'token_hash' => hash('sha256', 'second-grant'),
            'expires_at' => now()->addDay(),
            'max_downloads' => 5,
            'created_by' => $agencyAdmin->id,
        ]);
        $this->actingAs($agencyAdmin)
            ->deleteJson("/api/rikms/agency/documents/{$document->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');
        $this->assertNotNull($secondGrant->fresh()->revoked_at);
    }

    public function test_every_download_policy_is_enforced_by_the_server(): void
    {
        Storage::fake('documents');
        [$agency, $agencyAdmin] = $this->agencyAccount('download-policies');
        $base = [
            'status' => 'published',
            'published_at' => now(),
            'file_path' => 'research-documents/policy.pdf',
            'original_filename' => 'policy.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 15,
        ];
        Storage::disk('documents')->put('research-documents/policy.pdf', '%PDF-1.4 policy');

        $public = $this->document($agency, $agencyAdmin, $base + ['access_mode' => 'public_download']);
        $requested = $this->document($agency, $agencyAdmin, $base + ['access_mode' => 'request_access']);
        $restricted = $this->document($agency, $agencyAdmin, $base + ['access_mode' => 'restricted_admin']);
        $futureEmbargo = $this->document($agency, $agencyAdmin, $base + [
            'access_mode' => 'embargo_until_date',
            'embargo_until' => now()->addWeek(),
        ]);
        $expiredEmbargo = $this->document($agency, $agencyAdmin, $base + [
            'access_mode' => 'embargo_until_date',
            'embargo_until' => now()->subDay(),
        ]);
        $external = $this->document($agency, $agencyAdmin, [
            'status' => 'published',
            'published_at' => now(),
            'access_mode' => 'external_link_only',
            'external_url' => 'https://repository.example.test/research/42',
        ]);
        $unpublished = $this->document($agency, $agencyAdmin, array_merge($base, [
            'status' => 'draft',
            'published_at' => null,
            'access_mode' => 'public_download',
        ]));

        $this->get("/api/rikms/public/documents/{$public->id}/download")->assertOk();
        $this->get("/api/rikms/public/documents/{$requested->id}/download")->assertForbidden();
        $this->get("/api/rikms/public/documents/{$restricted->id}/download")->assertForbidden();
        $this->get("/api/rikms/public/documents/{$futureEmbargo->id}/download")->assertForbidden();
        $this->get("/api/rikms/public/documents/{$expiredEmbargo->id}/download")->assertOk();
        $this->get("/api/rikms/public/documents/{$external->id}/download")
            ->assertRedirect('https://repository.example.test/research/42');
        $this->assertSame(1, $external->fresh()->download_count);
        $this->assertDatabaseHas('download_events', ['document_id' => $external->id]);
        $this->get("/api/rikms/public/documents/{$unpublished->id}/download")->assertNotFound();

        $this->actingAs($agencyAdmin)
            ->get("/api/rikms/agency/documents/{$restricted->id}/download")
            ->assertOk();
    }

    public function test_a_version_from_another_document_cannot_be_restored(): void
    {
        [$agency, $agencyAdmin] = $this->agencyAccount('versions');
        $first = $this->document($agency, $agencyAdmin, ['title' => 'First record']);
        $second = $this->document($agency, $agencyAdmin, ['title' => 'Second record']);
        $foreignVersion = DocumentVersion::create([
            'document_id' => $second->id,
            'version_number' => 1,
            'snapshot' => ['document' => ['title' => 'Second record snapshot']],
            'change_summary' => 'Second record only',
            'created_by' => $agencyAdmin->id,
        ]);

        $this->actingAs($agencyAdmin)
            ->postJson("/api/rikms/agency/documents/{$first->id}/versions/{$foreignVersion->id}/restore")
            ->assertNotFound();

        $this->assertSame('First record', $first->fresh()->title);
    }

    public function test_password_recovery_is_non_enumerating_and_requires_a_strong_password(): void
    {
        [, $user] = $this->agencyAccount('password');

        $known = $this->postJson('/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->json('message');
        $unknown = $this->postJson('/forgot-password', ['email' => 'unknown@example.test'])
            ->assertOk()
            ->json('message');

        $this->assertSame($known, $unknown);
        $this->postJson('/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'too-short',
            'password_confirmation' => 'too-short',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_unknown_account_login_is_non_enumerating_and_audited(): void
    {
        $this->postJson('/login', [
            'email' => 'unknown-login@example.test',
            'password' => 'Controlled-Audit-Only-2026!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email')
            ->assertJsonPath('errors.email.0', 'The provided credentials do not match an active RIKMS account.');

        $this->assertDatabaseHas(AuthenticationEvent::class, [
            'email' => 'unknown-login@example.test',
            'successful' => false,
            'failure_reason' => 'invalid_credentials',
        ]);
    }

    public function test_security_headers_are_set_on_html_and_api_responses(): void
    {
        foreach (['/', '/api/rikms/bootstrap'] as $uri) {
            $this->get($uri)
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('X-Frame-Options', 'DENY')
                ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
                ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
                ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none');
        }

        $this->get('/api/rikms/bootstrap')
            ->assertHeader('Cache-Control', 'max-age=0, no-store, private')
            ->assertHeader('Pragma', 'no-cache');

        foreach (['production', 'staging'] as $environment) {
            $this->app['env'] = $environment;
            $this->get('https://localhost/')
                ->assertHeader('Content-Security-Policy')
                ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
    }

    public function test_proxy_ip_cors_and_secure_session_boundaries_are_enforced(): void
    {
        Route::middleware('web')->get('/_security/client-ip', fn (Request $request) => response()->json([
            'ip' => $request->ip(),
            'secure' => $request->isSecure(),
        ]));

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.7'])
            ->withHeaders([
                'X-Forwarded-For' => '203.0.113.42',
                'X-Forwarded-Proto' => 'https',
            ])
            ->getJson('/_security/client-ip')
            ->assertOk()
            ->assertJson(['ip' => '203.0.113.42', 'secure' => true]);

        config(['cors.allowed_origins' => ['https://rikms.example.test']]);
        $this->withHeader('Origin', 'https://rikms.example.test')
            ->get('/api/rikms/bootstrap')
            ->assertHeader('Access-Control-Allow-Origin', 'https://rikms.example.test')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $this->flushHeaders();
        $this->withHeader('Origin', 'https://attacker.example')
            ->get('/api/rikms/bootstrap')
            ->assertHeader('Access-Control-Allow-Origin', 'https://rikms.example.test');

        config([
            'session.secure' => true,
            'session.http_only' => true,
            'session.same_site' => 'lax',
            'session.cookie' => 'rikms-session',
        ]);
        $this->app->forgetInstance('session');
        [, $user] = $this->agencyAccount('cookie');
        $cookieHeader = implode('; ', $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'correct-horse-battery-staple',
        ])->headers->all('set-cookie'));
        $this->assertStringContainsString('rikms-session=', $cookieHeader);
        $this->assertStringContainsString('secure', strtolower($cookieHeader));
        $this->assertStringContainsString('httponly', strtolower($cookieHeader));
        $this->assertStringContainsString('samesite=lax', strtolower($cookieHeader));
    }

    public function test_repository_rejects_office_documents_and_oversized_pdfs(): void
    {
        Storage::fake('documents');
        [, $agencyAdmin] = $this->agencyAccount('file-policy');
        $base = [
            'document_type' => 'research',
            'submit_mode' => 'draft',
            'metadata' => json_encode(['title' => 'File validation record']),
            'public_fields' => json_encode(['title']),
            'access_mode' => 'request_access',
        ];

        $this->actingAs($agencyAdmin)->post('/api/rikms/documents', [
            ...$base,
            'document_file' => UploadedFile::fake()->create(
                'macro.docm',
                8,
                'application/vnd.ms-word.document.macroEnabled.12'
            ),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_file');

        $this->actingAs($agencyAdmin)->post('/api/rikms/documents', [
            ...$base,
            'document_file' => UploadedFile::fake()->create('oversized.pdf', 25 * 1024 + 1, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_file');
    }

    public function test_production_admin_provisioning_disables_demo_credentials_without_printing_password(): void
    {
        User::query()->updateOrCreate(['email' => 'test@example.com'], [
            'name' => 'Demo Agency Admin',
            'password' => 'password',
            'role' => 'agency_admin',
            'is_active' => true,
        ]);
        User::query()->updateOrCreate(['email' => 'admin@rikms.gov.ph'], [
            'name' => 'Demo Super Admin',
            'password' => 'password',
            'role' => 'super_admin',
            'is_active' => true,
        ]);
        putenv('RIKMS_ADMIN_PASSWORD=Temporary-Production-2026!');

        try {
            $this->artisan('rikms:provision-admin', [
                'email' => 'security.lead@example.test',
                '--name' => 'Security Lead',
                '--disable-demo' => true,
            ])->expectsOutputToContain('temporary password was not printed')->assertSuccessful();
        } finally {
            putenv('RIKMS_ADMIN_PASSWORD');
        }

        $admin = User::query()->where('email', 'security.lead@example.test')->firstOrFail();
        $this->assertSame('super_admin', $admin->role);
        $this->assertTrue($admin->is_active);
        $this->assertTrue($admin->must_change_password);
        $this->assertTrue(Hash::check('Temporary-Production-2026!', $admin->password));
        $this->assertFalse(User::query()->where('email', 'test@example.com')->value('is_active'));
        $this->assertFalse(User::query()->where('email', 'admin@rikms.gov.ph')->value('is_active'));
    }

    public function test_super_administrator_must_enroll_and_complete_two_factor_authentication(): void
    {
        $admin = User::factory()->create([
            'name' => 'Two Factor Administrator',
            'email' => 'two-factor-admin@example.test',
            'password' => Hash::make('correct-horse-battery-staple'),
            'role' => 'super_admin',
            'agency_id' => null,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->actingAs($admin)->get('/admin/dashboard')->assertRedirect('/two-factor/setup');
        $this->actingAs($admin)->getJson('/api/rikms/admin/dashboard')
            ->assertStatus(409)
            ->assertJsonPath('redirect', '/two-factor/setup');

        $setup = $this->actingAs($admin)->postJson('/api/rikms/two-factor/setup', [
            'currentPassword' => 'correct-horse-battery-staple',
        ])->assertOk();
        $this->assertNotEmpty($setup->json('data.qrCodeSvg'));
        $this->assertNotEmpty($setup->json('data.secretKey'));

        $secret = $setup->json('data.secretKey');
        $code = app(Google2FA::class)->getCurrentOtp($secret);
        $confirmed = $this->actingAs($admin)->postJson('/api/rikms/two-factor/confirm', [
            'code' => $code,
        ])->assertOk()->assertJsonPath('redirect', '/admin/dashboard');
        $recoveryCode = $confirmed->json('recoveryCodes.0');
        $this->assertNotEmpty($recoveryCode);
        $this->actingAs($admin->fresh())->getJson('/api/rikms/admin/dashboard')->assertOk();

        $this->postJson('/logout')->assertOk();
        $this->postJson('/login', [
            'email' => $admin->email,
            'password' => 'correct-horse-battery-staple',
        ])->assertOk()
            ->assertJsonPath('twoFactorRequired', true)
            ->assertJsonPath('redirect', '/two-factor-challenge');

        $this->postJson('/two-factor-challenge', ['code' => '000000'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
        $this->postJson('/two-factor-challenge', ['recovery_code' => $recoveryCode])
            ->assertOk()
            ->assertJsonPath('redirect', '/admin/dashboard');
        $this->assertAuthenticatedAs($admin->fresh());
        $this->assertNotContains($recoveryCode, $admin->fresh()->recoveryCodes());
        $this->assertDatabaseHas('authentication_events', [
            'user_id' => $admin->id,
            'successful' => false,
            'failure_reason' => 'invalid_two_factor_code',
        ]);
    }

    /**
     * @return array{Agency, User}
     */
    private function agencyAccount(string $suffix): array
    {
        $agency = Agency::create([
            'name' => 'Test Agency '.ucfirst($suffix),
            'abbreviation' => strtoupper(substr($suffix, 0, 6)),
            'region' => 'Davao Region',
            'contact_email' => "agency-{$suffix}@example.test",
            'is_active' => true,
        ]);
        $user = User::factory()->create([
            'name' => 'Agency Admin '.ucfirst($suffix),
            'email' => "admin-{$suffix}@example.test",
            'password' => Hash::make('correct-horse-battery-staple'),
            'role' => 'agency_admin',
            'agency_id' => $agency->id,
            'is_active' => true,
        ]);

        return [$agency, $user];
    }

    private function superAdmin(): User
    {
        return $this->withConfirmedTwoFactor(User::factory()->create([
            'name' => 'Release Super Admin',
            'email' => 'release-super-admin@example.test',
            'password' => Hash::make('correct-horse-battery-staple'),
            'role' => 'super_admin',
            'agency_id' => null,
            'is_active' => true,
        ]));
    }

    private function document(Agency $agency, User $uploader, array $attributes = []): Document
    {
        $document = Document::create(array_merge([
            'agency_id' => $agency->id,
            'uploaded_by' => $uploader->id,
            'document_type' => Document::RESEARCH_STUDY,
            'title' => 'Release readiness research',
            'description' => 'A test repository record.',
            'status' => 'draft',
            'year' => now()->year,
            'category' => 'Research Study',
            'access_mode' => 'public_download',
            'owner_name' => $uploader->name,
            'owner_email' => $uploader->email,
            'notify_access_requests' => true,
            'completion_score' => 100,
        ], $attributes));

        $document->metadata()->create([
            'title' => $document->title,
            'abstract' => 'Public abstract for release verification.',
            'methodology' => 'Public methodology for release verification.',
            'authors' => [$uploader->name],
            'keywords' => ['RIKMS', 'release'],
        ]);
        foreach (['title', 'abstract', 'methodology', 'authors', 'keywords'] as $field) {
            $document->publicFields()->create(['field_name' => $field, 'is_public' => true]);
        }

        return $document;
    }
}
