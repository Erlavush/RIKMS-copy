# RIKMS

RIKMS is a regional research and innovation knowledge-management application built with Laravel 13, React, TypeScript, Tailwind CSS 4, and Vite. It provides a public research repository, agency workspaces, controlled document access, structured reporting, and platform-wide moderation and administration.

## Capabilities

- Public discovery of published research, participating agencies, categories, and SDG alignment
- Agency-scoped dashboards, repository management, upload and draft workflows
- Review-gated Gemini 3.1 Flash-Lite metadata suggestions with tracked usage and human acceptance
- Research metadata, public-field selection, SDG tags, PAP classification, performance, financial, and highlight data
- Formal submission, moderation, rejection, publication, archive, and restore transitions
- Public, request-controlled, restricted, embargoed, and external-link access policies
- Audited access requests and authorized private-file downloads
- Super-administration for agencies, users, moderation, access monitoring, roles, settings, security summaries, and audit history
- Server-side role enforcement and agency isolation
- Mandatory TOTP two-factor authentication and one-use recovery codes for super administrators

## Requirements

- PHP 8.3 or newer
- PHP upload limits of at least 25 MB and a request-body limit of at least 27 MB
- Composer 2
- Node.js 22 or newer
- SQLite for local demonstration, or PostgreSQL/MySQL for production

This workspace provides PHP and Composer at:

```bash
/home/eru/.local/bin/php
/home/eru/.local/bin/composer
```

## Local setup

```bash
cp .env.example .env
/home/eru/.local/bin/php /home/eru/.local/bin/composer install
/home/eru/.local/bin/php artisan key:generate
touch database/database.sqlite
/home/eru/.local/bin/php artisan migrate
npm install
npm run build
/home/eru/.local/bin/php -d upload_max_filesize=25M -d post_max_size=27M artisan serve --host=127.0.0.1 --port=8000
```

Normal local and production setup does not create synthetic research papers or fixed demo credentials. Automated tests retain isolated in-memory fixtures. For active frontend development, run `npm run dev` in a second terminal.

Keep a queue worker running for mail and digest delivery, and run the Laravel scheduler every minute:

```bash
/home/eru/.local/bin/php artisan queue:work --tries=3
/home/eru/.local/bin/php artisan schedule:work
```

`schedule:work` is convenient locally. Production should invoke `php artisan schedule:run` every minute through cron or the hosting scheduler. The weekly agency digest runs Monday at 08:00 Asia/Manila for agencies that enable it.

Accounts created or password-reset by an administrator are forced through the password-change screen before any protected workspace can be used.

The authorized penetration-test cohort is provisioned from a private manifest with `rikms:provision-test-cohort`. Passwords come from environment variables and are never stored in the manifest or printed. The committed example is `docs/test-cohort.manifest.example.json`.

## Testing & Verification Dashboard

The project includes an interactive verification, testing, and security auditing dashboard. 

### 1. Generate PHPUnit Test Reports
Before launching the dashboard, run the functional test suite and output the test results to `report.xml`:
```bash
php artisan test --log-junit report.xml
```

### 2. Run the Dashboard
Execute the visualization script using Python:
```bash
python visualize_dashboard.py
```
This script will:
1. Start a local server at `http://localhost:8888` and open it in your default web browser.
2. Spin up a background thread to run **Larastan** (SAST static analysis) to output `larastan-report.json`.
3. Perform an automated **OWASP ZAP** quick scan (DAST dynamic analysis) to generate `zap-report.json` if OWASP ZAP is installed locally and the Laravel application is running (e.g., via `php artisan serve` on port 8000 or 8080).
4. Present a unified dashboard containing your test success rate, static analysis findings, dynamic security warnings, and an overall application health score.

## Quality checks

```bash
/home/eru/.local/bin/php artisan test
/home/eru/.local/bin/php vendor/bin/pint --test
/home/eru/.local/bin/php vendor/bin/phpstan analyse --memory-limit=1G
npm run check
```

The test configuration uses in-memory SQLite. File tests use a fake private disk and do not modify demo uploads.

## Storage and safety

Research documents use the dedicated private `documents` disk. It maps to `storage/app/private` locally and to a private Cloud Storage volume in Cloud Run. Browser requests never receive raw storage paths; files are delivered only by an authorized controller. Research uploads are PDF-only and capped at 25 MB. `.env`, SQLite databases, generated builds, and private uploads are ignored by Git.

The production container fails closed on storage write errors, runs Nginx and PHP-FPM under supervision, excludes query strings from application access logs, and caches Laravel configuration only after runtime secrets are injected.

## Google Cloud deployment

`deploy-to-gcp.sh` provisions a dedicated runtime service account, Secret Manager bindings, a private Cloud Storage bucket, hardened Cloud SQL backups, forward-only migrations, secure session settings, and Cloud Run health probes. It requires an explicit project instead of embedding credentials:

```bash
PROJECT_ID=your-rikms-project \
GCLOUD_BIN=/home/eru/.local/opt/google-cloud-sdk/bin/gcloud \
PHP_BIN=/home/eru/.local/bin/php \
./deploy-to-gcp.sh
```

Provision the first production administrator with `rikms:provision-admin`; pass its temporary password through the named environment variable or Secret Manager. `--disable-demo` invalidates the seeded demonstration credentials without printing the replacement password. The administrator must replace that temporary password and enroll a TOTP authenticator before any administration route or API becomes available.

Gemini analysis is asynchronous and server-side through Vertex AI. It extracts embedded PDF text locally when possible, optionally uses Document AI OCR when a processor is configured, and otherwise uses Gemini PDF understanding. Suggestions require explicit human review and cannot approve, submit, publish, or change access policy.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Penetration-test baseline](docs/PENTEST_BASELINE.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations](docs/OPERATIONS.md)
