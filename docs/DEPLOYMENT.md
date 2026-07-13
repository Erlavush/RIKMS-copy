# Production Deployment

## Required services

- PHP 8.3 or newer with the extensions required by Laravel
- Composer 2
- Node.js 22 for asset builds
- PostgreSQL or MySQL for concurrent production use (SQLite is for local demonstration and tests)
- A durable private object store or persistent private filesystem
- A queue worker
- SMTP or a transactional mail provider
- HTTPS termination at the load balancer or web server
- A scheduler that invokes Laravel every minute

## Upload runtime limits

RIKMS validates research uploads up to 50 MB. Configure every layer above that limit before launch:

- PHP `upload_max_filesize=64M` and `post_max_size=70M` (or higher)
- Reverse-proxy/web-server request-body limit of at least 70 MB
- Platform/function request limit and timeout sufficient for a 50 MB upload

The repository includes `.user.ini` defaults for PHP-FPM-compatible hosts, but server and platform limits must still be verified. A too-small PHP limit rejects the request before Laravel can return its normal validation response.

## Release procedure

1. Build and test the exact revision in CI.
2. Install PHP dependencies with `composer install --no-dev --classmap-authoritative`.
3. Install frontend dependencies with `npm ci` and run `npm run build`.
4. Provide production environment variables through the deployment platform; never copy a developer `.env`.
5. Run `php artisan migrate --force` during a controlled maintenance window.
6. Run `php artisan optimize`.
7. Restart PHP workers and supervised queue workers so they load the new revision.
8. Ensure cron or the hosting scheduler invokes `php artisan schedule:run` every minute.
9. Verify `/up`, login, repository browsing, a 50 MB boundary upload, one authorized API request, scheduler execution, and queue/mail health.

## Minimum production environment

```dotenv
APP_NAME=RIKMS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://rikms.example.gov.ph
APP_TIMEZONE=Asia/Manila
LOG_LEVEL=warning
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
QUEUE_CONNECTION=database
MAIL_MAILER=smtp
```

Set database, mail, and storage credentials in the platform secret manager. RIKMS security-sensitive session revocation requires `SESSION_DRIVER=database`; do not silently replace it with file or cookie sessions. Use a unique `APP_KEY`; retain a previous key during planned rotation through `APP_PREVIOUS_KEYS`.

## Rollback

Deploy the previous application revision, restart workers, and restore a database backup only when a migration is not backward-compatible. Database rollback is an operational decision, not an automatic deploy step. Keep uploaded files and the database backup from the same recovery point.
