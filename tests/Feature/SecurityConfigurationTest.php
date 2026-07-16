<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityConfigurationTest extends TestCase
{
    /**
     * Assert that session cookies are configured securely to mitigate XSS and CSRF.
     */
    public function test_session_cookie_security_configurations(): void
    {
        $session = config('session');

        // 1. HttpOnly must be true to prevent JavaScript document.cookie access (Mitigates Session Hijacking via XSS)
        $this->assertTrue(
            $session['http_only'],
            'Security Hazard: Session cookie http_only flag is disabled! JavaScript must not access session identifier cookies.'
        );

        // 2. SameSite must be set to 'lax' or 'strict' (Mitigates CSRF attacks)
        $sameSite = strtolower($session['same_site'] ?? '');
        $this->assertTrue(
            in_array($sameSite, ['lax', 'strict'], true),
            'Security Hazard: SameSite attribute must be set to Lax or Strict to protect against Cross-Site Request Forgery.'
        );
    }

    /**
     * Assert that production configuration settings are enforced securely.
     */
    public function test_production_environment_sanity_checks(): void
    {
        // Path to the example environment configuration
        $envExamplePath = base_path('.env.example');

        if (file_exists($envExamplePath)) {
            $content = file_get_contents($envExamplePath);

            // 1. Verify APP_DEBUG defaults to false in .env.example
            $this->assertStringContainsString(
                'APP_DEBUG=false',
                $content,
                'Security Warning: .env.example should default APP_DEBUG to false so production deployments are secure by default.'
            );

            // 2. Verify SESSION_SECURE_COOKIE defaults to true in .env.example
            $this->assertStringContainsString(
                'SESSION_SECURE_COOKIE=true',
                $content,
                'Security Warning: .env.example should default SESSION_SECURE_COOKIE to true to enforce transport encryption for session cookies.'
            );
        }
    }
}
