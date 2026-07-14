# Production Deployment

## Supported target

The reference production target is Google Cloud Run with PHP 8.3, Cloud SQL for PostgreSQL, Secret Manager, and a private Cloud Storage bucket mounted through Cloud Storage FUSE. SQLite and container-local document storage are development-only.

The Cloud Run runtime identity needs only:

- `roles/cloudsql.client` on the project
- `roles/secretmanager.secretAccessor` on the RIKMS secrets
- `roles/storage.objectUser` on the private RIKMS document bucket

Do not run RIKMS with the default Compute Engine service account or a project-level Editor role.

The deployment operator needs explicit Storage Admin permission while creating
and reconciling the private bucket. The script removes the bucket's legacy
project-owner/editor/viewer convenience grants; basic project roles are not
used as document-store authorization.

## Upload boundary

RIKMS accepts PDF research files up to 25 MB. The container uses `upload_max_filesize=25M`, `post_max_size=27M`, and `client_max_body_size=27M`. This leaves request overhead below Cloud Run's 32 MiB HTTP/1 request ceiling. Larger-file support requires a reviewed direct-to-object-storage upload design; increasing the Laravel validator alone is not sufficient.

## Automated release

The repository deployment script is secret-safe and idempotent for infrastructure it owns:

```bash
PROJECT_ID=your-rikms-project \
GCLOUD_BIN=/home/eru/.local/opt/google-cloud-sdk/bin/gcloud \
PHP_BIN=/home/eru/.local/bin/php \
./deploy-to-gcp.sh
```

It builds from source, deploys a least-privilege runtime, injects `APP_KEY` and `DB_PASSWORD` from Secret Manager, mounts durable private storage, configures startup/liveness probes, and executes `php artisan migrate --force` as a Cloud Run job. It never runs `migrate:fresh` or a demonstration seeder.

For a deliberate database-password rotation, pass `RIKMS_DB_PASSWORD` for one execution. Do not place that value in shell history, `.env`, source control, or CI logs.

## Production administrator

Create the initial temporary password in Secret Manager and expose it only to a one-off command/job as `RIKMS_ADMIN_PASSWORD`, then run:

```bash
php artisan rikms:provision-admin security.lead@example.gov.ph \
  --name="RIKMS Security Lead" \
  --disable-demo
```

The command does not print the password, forces replacement on first login, deletes the administrator's existing sessions, and disables the known demo accounts. The administrator is then forced to enroll and confirm TOTP before any administration route or API is usable. Remove or disable the bootstrap secret version after the password is changed.

## Release gate

Before routing traffic to a revision:

1. Run the backend suite, Pint, PHPStan, frontend checks, Composer audit, and npm audit on the exact revision.
2. Confirm `APP_ENV=production`, `APP_DEBUG=false`, trusted host/proxy values, secure encrypted database sessions, and the canonical `APP_URL`.
3. Confirm Cloud SQL automated backups, point-in-time recovery, deletion protection, and a recent restore drill.
4. Confirm the private bucket has public-access prevention and uniform bucket-level access.
5. Confirm `/up`, login, forced password change, PDF upload at the boundary, independent moderation, access approval, bounded download, and cross-agency denial.
6. Confirm the service uses the dedicated runtime identity and no secret is present in plain-text environment variables or the container image.

## Rollback

Shift traffic to the prior Cloud Run revision only when the prior code remains compatible with completed migrations. Database rollback and restore are explicit incident decisions. Restore the database and private document bucket from the same recovery point, and rotate any credentials implicated by the event.
