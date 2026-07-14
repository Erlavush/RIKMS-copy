# Operations Runbook

## Scheduled work

- Run `php artisan schedule:run` every minute. RIKMS schedules `rikms:weekly-digests` for Monday at 08:00 in `Asia/Manila`; `withoutOverlapping` prevents duplicate concurrent runs.
- Keep at least one `php artisan queue:work --tries=3` process supervised and restart it after each release. The weekly digest email is queued, so running the scheduler without a worker is insufficient.
- Monitor failed jobs and retry only after the underlying cause is understood.
- AI jobs use the `ai` queue and record status in `document_ai_analyses`. A failed job never changes document metadata. Inspect configuration and IAM before retrying; do not log source text or OAuth tokens.

Example cron entry (replace the application path and PHP binary):

```cron
* * * * * cd /srv/rikms && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

## Backups

- Back up the production database and private document store at least daily.
- Encrypt backups, restrict access, and define retention with the system owner.
- Perform a restore drill at least quarterly. A backup is not considered valid until restoration is verified.
- Before removing old seeded papers, create a Cloud SQL backup, preview with `php artisan rikms:purge-demo-data`, then execute with `--execute --backup-reference=<backup-id>`. The command matches only known fixture titles and patterns.

## Authorized test cohort

Copy `docs/test-cohort.manifest.example.json` outside the repository and replace it with the leader plus exactly six tester/company identities. Export `RIKMS_TEST_PASSWORD_ADMIN` and `RIKMS_TEST_PASSWORD_1` through `_6`, then run `php artisan rikms:provision-test-cohort /private/path/cohort.json --disable-demo`. All seven accounts must rotate their temporary passwords; the super administrator must also enroll TOTP.

The temporary OJT login selector shows only active agencies whose type is `Authorized Test Organization`. This hides legacy organizations from the sign-in interface without deleting them or revoking an already-authorized historical account. Remove the filter in `resources/js/app/lib/login-agencies.ts` when the cohort-only exercise ends.

## Monitoring

Alert on elevated 5xx responses, queue failures, login abuse, storage exhaustion, database saturation, mail failures, and repeated authorization denials. Retain application logs and audit logs according to an approved privacy and records-retention policy.

## Incident response

1. Preserve relevant application, proxy, authentication, and audit logs.
2. Revoke compromised sessions and credentials.
3. Place the application in maintenance mode if integrity or confidentiality is at risk.
4. Correct the issue, rotate affected secrets, and verify authorization tests before reopening.
5. Record impact, timeline, recovery actions, and follow-up controls.

## Routine verification

Run `composer test`, `composer analyse`, and `npm run check` before deployment. Periodically verify a complete upload, review, publication, access-request, approval, and download flow using non-sensitive test data. Confirm queue health, the scheduler, outbound mail, and the latest backup on every release.
