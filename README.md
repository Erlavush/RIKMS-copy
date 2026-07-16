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

## Local setup

```bash
cp .env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan rikms:provision-demo
npm ci
npm run build
php -d upload_max_filesize=25M -d post_max_size=27M artisan serve --host=127.0.0.1 --port=8000
```

Windows developers should use the checked-in PowerShell setup and runbook: `powershell -ExecutionPolicy Bypass -File .\scripts\windows\setup-local.ps1`, then follow [Windows development](docs/WINDOWS_DEVELOPMENT.md). The application, queue, and security scanner are cross-platform; Google Cloud provisioning remains a Bash/Cloud Shell or WSL operation.

`rikms:provision-demo` is an explicit, local-only step that creates or resets two demonstration accounts: `test@example.com` / `password` for the agency workspace and `admin@rikms.gov.ph` / `password` for system administration. The command refuses to run outside the `local` or `testing` environment. It does not create synthetic research papers. Production setup never creates fixed demo credentials. Automated tests retain isolated in-memory fixtures. For active frontend development, run `npm run dev` in a second terminal.

Keep a queue worker running for mail and digest delivery, and run the Laravel scheduler every minute:

```bash
php artisan queue:work --queue=default,ai --tries=3
php artisan schedule:work
```

`schedule:work` is convenient locally. Production should invoke `php artisan schedule:run` every minute through cron or the hosting scheduler. The weekly agency digest runs Monday at 08:00 Asia/Manila for agencies that enable it.

Accounts created or password-reset by an administrator are forced through the password-change screen before any protected workspace can be used.

The authorized penetration-test cohort is provisioned from a private manifest with `rikms:provision-test-cohort`. Passwords come from environment variables and are never stored in the manifest or printed. The committed example is `docs/test-cohort.manifest.example.json`.

## Authorized security assessments

RIKMS includes a bounded scanner and an administrator-only Security Center. The scanner refuses targets that are not explicitly listed, writes evidence below ignored private storage, and treats automated output as an observation until a tester reproduces it.

```bash
export SECURITY_ALLOWED_TARGETS=http://127.0.0.1:8000
python3 security/rikms_security_scan.py \
  --target=http://127.0.0.1:8000 \
  --environment=local \
  --mode=passive

php artisan rikms:security-import \
  storage/app/security/reports/native-YYYYMMDDTHHMMSSZ.json \
  --format=rikms-native \
  --target=http://127.0.0.1:8000 \
  --environment=local \
  --revision="$(git rev-parse HEAD)"
```

OWASP ZAP uses the same target allowlist and private-output contract through `security/run_zap.py`. Active testing is disabled by default and belongs on isolated staging. See `docs/SECURITY_OPERATIONS.md` for authorization, credential, evidence, GCloud, and retest procedures.

## Quality checks

```bash
php artisan test
vendor/bin/pint --test
vendor/bin/phpstan analyse --memory-limit=1G
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
- [Security assessment operations](docs/SECURITY_OPERATIONS.md)
- [Windows development](docs/WINDOWS_DEVELOPMENT.md)
