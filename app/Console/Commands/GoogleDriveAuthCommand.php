<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google\Client;
use Google\Service\Drive;

class GoogleDriveAuthCommand extends Command
{
    protected $signature = 'drive:auth';
    protected $description = 'Authorize Google Drive and generate a Refresh Token';

    public function handle()
    {
        $clientId = env('GOOGLE_DRIVE_CLIENT_ID') ?: $this->ask('Enter Google Drive Client ID');
        $clientSecret = env('GOOGLE_DRIVE_CLIENT_SECRET') ?: $this->ask('Enter Google Drive Client Secret');

        if (!$clientId || !$clientSecret) {
            $this->error('Client ID and Client Secret are required!');
            return 1;
        }

        // Must be exactly http://localhost:8088 to match our local server listener
        $redirectUri = 'http://localhost:8088';

        $client = new Client();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri($redirectUri);
        $client->setAccessType('offline');
        $client->setApprovalPrompt('force');
        $client->addScope(Drive::DRIVE);

        $authUrl = $client->createAuthUrl();

        $this->info("Opening browser for authorization...");
        $this->line("If it doesn't open automatically, copy and paste this URL into your browser:");
        $this->warn($authUrl);

        // Open browser
        if (PHP_OS_FAMILY === 'Windows') {
            exec('start "" "' . str_replace('&', '^&', $authUrl) . '"');
        } elseif (PHP_OS_FAMILY === 'Darwin') {
            exec('open "' . $authUrl . '"');
        } else {
            exec('xdg-open "' . $authUrl . '"');
        }

        $this->info("Waiting for Google authorization callback on port 8088...");

        // Listen on tcp port 8088 using built-in PHP stream sockets
        $server = stream_socket_server("tcp://127.0.0.1:8088", $errno, $errstr);
        if (!$server) {
            $this->error("Failed to start local server on port 8088: $errstr ($errno)");
            return 1;
        }

        $code = null;
        $startTime = time();
        $timeout = 60; // 60 seconds

        // Set stream to non-blocking so we can loop and check timeout
        stream_set_blocking($server, false);

        while (time() - $startTime < $timeout) {
            // Check for incoming connections (using 1 second timeout)
            $clientSocket = @stream_socket_accept($server, 1);
            
            if ($clientSocket) {
                // Set client socket to blocking to read the request
                stream_set_blocking($clientSocket, true);
                $request = fread($clientSocket, 2048);

                // Parse query string to extract 'code' anywhere in the parameters
                preg_match('/[?&]code=([^&\s]+)/', $request, $matches);
                $capturedCode = isset($matches[1]) ? urldecode($matches[1]) : null;

                if ($capturedCode) {
                    $code = $capturedCode;

                    // Send HTTP response to browser
                    $responseBody = "<h1>Authorization Successful!</h1><p>You can close this tab and return to the terminal.</p>";
                    $response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: " . strlen($responseBody) . "\r\nConnection: close\r\n\r\n" . $responseBody;
                    fwrite($clientSocket, $response);
                    fclose($clientSocket);
                    break;
                } else {
                    // Send a generic response for noise/favicon requests and keep listening
                    $responseBody = "Waiting for authorization...";
                    $response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: " . strlen($responseBody) . "\r\nConnection: close\r\n\r\n" . $responseBody;
                    fwrite($clientSocket, $response);
                    fclose($clientSocket);
                }
            }

            // Sleep briefly to avoid 100% CPU usage
            usleep(100000); // 100ms
        }

        fclose($server);

        if ($code) {
            $this->info("Exchanging authorization code for tokens...");
            $tokens = $client->fetchAccessTokenWithAuthCode($code);

            if (isset($tokens['error'])) {
                $this->error("Failed to fetch token: " . json_encode($tokens));
                return 1;
            }

            $refreshToken = $tokens['refresh_token'] ?? null;

            if ($refreshToken) {
                $this->info("Successfully generated Refresh Token!");
                $this->warn($refreshToken);

                if ($this->confirm("Would you like to save this Refresh Token and configurations to your .env file?", true)) {
                    $this->updateEnvFile([
                        'GOOGLE_DRIVE_CLIENT_ID' => $clientId,
                        'GOOGLE_DRIVE_CLIENT_SECRET' => $clientSecret,
                        'GOOGLE_DRIVE_REFRESH_TOKEN' => $refreshToken,
                    ]);
                    $this->info(".env file updated successfully!");
                }
            } else {
                $this->error("No refresh token returned. Make sure to delete the app access from your Google Account settings first and try again.");
            }
        } else {
            $responseBody = "<h1>Error</h1><p>Authorization code not found in request.</p>";
            $response = "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\nContent-Length: " . strlen($responseBody) . "\r\nConnection: close\r\n\r\n" . $responseBody;
            fwrite($clientSocket, $response);
            fclose($clientSocket);
            fclose($server);
            $this->error("Failed to capture authorization code.");
        }

        return 0;
    }

    private function updateEnvFile(array $data)
    {
        $path = base_path('.env');

        if (file_exists($path)) {
            $content = file_get_contents($path);

            foreach ($data as $key => $value) {
                // If key exists, replace it
                if (preg_match("/^{$key}=/m", $content)) {
                    $content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $content);
                } else {
                    // Else append it
                    $content .= "\n{$key}={$value}";
                }
            }

            file_put_contents($path, $content);
        }
    }
}
