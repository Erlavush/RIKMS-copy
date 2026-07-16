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
        $this->assertStringContainsString('DEPLOY_TRAFFIC_ARGS=(--tag="$RELEASE_TAG")', $deployment);
        $this->assertStringContainsString('if [[ -n "$PREVIOUS_REVISION" ]]', $deployment);
        $this->assertStringContainsString('DEPLOY_TRAFFIC_ARGS+=(--no-traffic)', $deployment);
        $this->assertStringContainsString("--flatten='status.traffic'", $deployment);
        $this->assertStringContainsString('status.traffic.percent=100', $deployment);
        $this->assertStringNotContainsString(
            'PREVIOUS_REVISION="$($GCLOUD_BIN run services describe',
            $deployment
        );
    }

    public function test_generated_security_evidence_is_ignored_and_not_publicly_served(): void
    {
        $ignore = file_get_contents(base_path('.gitignore'));
        $this->assertIsString($ignore);
        $this->assertStringContainsString('/storage/app/security/', $ignore);
        $this->assertDirectoryDoesNotExist(public_path('security'));
    }

    public function test_staging_security_upload_uses_environment_bound_oidc_and_create_only_precondition(): void
    {
        $configuration = file_get_contents(base_path('configure-github-security-oidc.sh'));
        $workflow = file_get_contents(base_path('.github/workflows/security-staging.yml'));

        $this->assertIsString($configuration);
        $this->assertIsString($workflow);
        $this->assertStringContainsString('GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-security-staging}"', $configuration);
        $this->assertStringContainsString('/subject/repo:${GITHUB_REPOSITORY}:environment:${GITHUB_ENVIRONMENT}', $configuration);
        $this->assertStringContainsString('environment: security-staging', $workflow);
        $this->assertStringContainsString('--if-generation-match=0', $workflow);
        $this->assertStringContainsString('--role=roles/storage.objectCreator', $configuration);
    }

    public function test_mixed_revision_canary_uses_a_backward_compatible_health_probe(): void
    {
        $deployment = file_get_contents(base_path('deploy-to-gcp.sh'));
        $this->assertIsString($deployment);

        $canaryStart = strpos($deployment, '--to-tags="${RELEASE_TAG}=25"');
        $this->assertIsInt($canaryStart);

        $canaryEnd = strpos($deployment, '--to-revisions="${CANDIDATE_REVISION}=100"', $canaryStart);
        $this->assertIsInt($canaryEnd);

        $mixedTrafficProbe = substr($deployment, $canaryStart, $canaryEnd - $canaryStart);
        $this->assertStringContainsString('"${APP_URL}/up"', $mixedTrafficProbe);
        $this->assertStringNotContainsString('"${APP_URL}/ready"', $mixedTrafficProbe);
    }

    public function test_container_restores_runtime_cache_ownership_after_warming_views(): void
    {
        $entrypoint = file_get_contents(base_path('docker/entrypoint.sh'));
        $this->assertIsString($entrypoint);

        $viewCache = strpos($entrypoint, 'php artisan view:cache');
        $runtimeOwnership = strpos(
            $entrypoint,
            'chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache'
        );

        $this->assertIsInt($viewCache);
        $this->assertIsInt($runtimeOwnership);
        $this->assertGreaterThan($viewCache, $runtimeOwnership);
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
