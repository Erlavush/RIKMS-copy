# Testing RIKMS

The production target, scope boundary, evidence contract, and release
acceptance rule are frozen in [PENTEST_BASELINE.md](PENTEST_BASELINE.md).

## Complete local suite

```bash
/home/eru/.local/bin/php artisan test
/home/eru/.local/bin/php vendor/bin/pint --test
/home/eru/.local/bin/php vendor/bin/phpstan analyse --memory-limit=1G
npm run check
```

Backend feature tests use in-memory SQLite and must not touch `database/database.sqlite`. File tests use Laravel's fake `documents` disk. Frontend tests run in jsdom and should test visible behavior and API error handling rather than internal component state.

## Required regression coverage

- Guest visibility excludes drafts, pending, rejected, archived, and private metadata.
- Agency administrators cannot read or mutate another agency's records.
- Agency administrators cannot enter super-administration routes.
- Super administrators cannot accidentally create records on behalf of an arbitrary fallback agency.
- Only valid status transitions succeed.
- Failed multi-table uploads roll back records and remove stored files.
- Access approval creates a bounded grant; rejection does not.
- Embargo, restricted, external-link, and public download policies are enforced.
- Archive and restore preserve the correct prior state.
- Login throttling, CSRF, validation, and audit logging remain active.
- Trusted proxy IP/HTTPS handling, origin restrictions, secure cookies, and no-store API responses remain active.
- Office documents and PDFs above the configured 25 MB boundary are rejected.
- AI-enabled uploads remain drafts and queue one tracked analysis job.
- AI suggestions cannot mutate metadata until an authorized user applies and saves them; acceptance is separately audited.
- Demo-data purge matches only known fixture records, and cohort provisioning creates exactly one leader plus six isolated agency users without printing passwords.
