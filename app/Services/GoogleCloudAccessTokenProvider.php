<?php

namespace App\Services;

use Google\Auth\ApplicationDefaultCredentials;
use RuntimeException;

class GoogleCloudAccessTokenProvider
{
    private ?string $accessToken = null;

    private int $expiresAt = 0;

    public function token(): string
    {
        if ($this->accessToken !== null && $this->expiresAt > time() + 60) {
            return $this->accessToken;
        }

        $credentials = ApplicationDefaultCredentials::getCredentials(
            'https://www.googleapis.com/auth/cloud-platform'
        );
        $token = $credentials->fetchAuthToken();
        $accessToken = $token['access_token'] ?? null;
        if (! is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException('Google Cloud application-default credentials did not issue an access token.');
        }

        $this->accessToken = $accessToken;
        $this->expiresAt = time() + max(300, (int) ($token['expires_in'] ?? 3600));

        return $this->accessToken;
    }
}
