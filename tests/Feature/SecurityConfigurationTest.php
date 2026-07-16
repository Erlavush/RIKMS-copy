<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityConfigurationTest extends TestCase
{
    public function test_session_cookie_contract_enforces_http_only_and_same_site(): void
    {
        $this->assertTrue(config('session.http_only'));
        $this->assertContains(strtolower((string) config('session.same_site')), ['lax', 'strict']);
    }

    public function test_cloud_deployment_defaults_to_production_and_enforces_secure_runtime_settings(): void
    {
        $deployment = file_get_contents(base_path('deploy-to-gcp.sh'));
        $staging = file_get_contents(base_path('deploy-staging-to-gcp.sh'));

        $this->assertIsString($deployment);
        $this->assertIsString($staging);
        $this->assertStringContainsString('APP_ENVIRONMENT="${APP_ENVIRONMENT:-production}"', $deployment);
        $this->assertStringContainsString('APP_ENV: ${APP_ENVIRONMENT}', $deployment);
        $this->assertStringContainsString('export APP_ENVIRONMENT=staging', $staging);
        $this->assertStringContainsString('APP_DEBUG: "false"', $deployment);
        $this->assertStringContainsString('SESSION_SECURE_COOKIE: "true"', $deployment);
        $this->assertStringContainsString('SESSION_HTTP_ONLY: "true"', $deployment);
    }

    public function test_generated_security_evidence_is_ignored_and_not_publicly_served(): void
    {
        $ignore = file_get_contents(base_path('.gitignore'));
        $this->assertIsString($ignore);
        $this->assertStringContainsString('/storage/app/security/', $ignore);
        $this->assertDirectoryDoesNotExist(public_path('security'));
    }

    public function test_windows_teammate_workflow_is_versioned_and_ci_verified(): void
    {
        $workflow = file_get_contents(base_path('.github/workflows/ci.yml'));
        $this->assertIsString($workflow);
        $this->assertStringContainsString('windows-compatibility:', $workflow);
        $this->assertStringContainsString('runs-on: windows-latest', $workflow);
        $this->assertFileExists(base_path('scripts/windows/setup-local.ps1'));
        $this->assertFileExists(base_path('scripts/windows/security-scan.ps1'));
        $this->assertFileExists(base_path('docs/WINDOWS_DEVELOPMENT.md'));
    }
}
