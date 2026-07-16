# RIKMS Security Assessment Operations

## Separation of responsibilities

RIKMS has three distinct security surfaces:

1. `rikms.v3ra.net` is the canonical production application.
2. An isolated staging service is the normal active-test target.
3. `/admin/security` is a two-factor-protected, read-only view of normalized findings. It is not a scanner launcher and never serves raw evidence.

Raw scanner output belongs in `storage/app/security/reports` locally or the dedicated private GCS security-report bucket in Google Cloud. Generated reports are ignored by Git.

## Document and AI safety gate

Every new, replaced, or version-restored PDF enters `pending` source processing. The default queue verifies the PDF signature and MIME, checks the recorded size, computes SHA-256, runs the configured malware check, and extracts only real source text. AI analysis records can be visible as queued, but the AI job is not released until the source safety states pass. Replacing a source resets those states and invalidates any staged analysis whose source hash no longer matches.

When ClamAV is not provisioned, RIKMS records malware status as `unavailable`; it never labels the document clean. Set `CLAMAV_REQUIRED=true` only after a reachable ClamAV service is deployed, because required-but-unavailable scanning intentionally fails processing closed.

## Local passive assessment

Start the application and provision explicit local demo accounts:

```bash
php artisan migrate
php artisan rikms:provision-demo
php artisan serve --host=127.0.0.1 --port=8000
```

Run a passive assessment from another terminal:

```bash
export SECURITY_ALLOWED_TARGETS=http://127.0.0.1:8000
python3 security/rikms_security_scan.py \
  --target=http://127.0.0.1:8000 \
  --environment=local \
  --mode=passive \
  --revision="$(git rev-parse HEAD)"
```

The command returns non-zero when a Critical or High observation is generated. It never reuses an older report.

On Windows PowerShell, use `scripts\windows\security-scan.ps1` and the exact environment-variable syntax in `docs\WINDOWS_DEVELOPMENT.md`.

## Authenticated active checks

Active checks are intended for a synthetic staging cohort. Credentials are read from the environment and are not written to the report.

```bash
export SECURITY_ALLOWED_TARGETS=https://rikms-staging.v3ra.net
export SECURITY_ACTIVE_SCAN_ENABLED=true
export RIKMS_SCAN_EMAIL='synthetic-security-tester@example.test'
export RIKMS_SCAN_PASSWORD='retrieve-from-secret-manager'

python3 security/rikms_security_scan.py \
  --target=https://rikms-staging.v3ra.net \
  --environment=staging \
  --mode=active \
  --revision='exact-cloud-run-revision'
```

Do not place secret values in shell history. In managed execution, inject them directly from Secret Manager. Active production testing requires a separate approval, `RIKMS_PRODUCTION_ACTIVE_APPROVED=true`, and `RIKMS_PENTEST_CHANGE_ID`.

## OWASP ZAP

`security/run_zap.py` builds an ephemeral Automation Framework plan, invokes ZAP with an argument array, checks its exit status, and requires a newly created private report.

```bash
export SECURITY_ALLOWED_TARGETS=https://rikms-staging.v3ra.net
export ZAP_BIN=/exact/path/to/zap.sh
python3 security/run_zap.py --target=https://rikms-staging.v3ra.net --mode=passive
```

An active ZAP scan uses the same explicit gates. The committed tool does not put session cookies in command arguments. Authenticated ZAP contexts must obtain test credentials at runtime and must not persist the generated context file.

## Importing evidence

Import one local report:

```bash
php artisan rikms:security-import path/to/report.json \
  --format=auto \
  --target=https://rikms-staging.v3ra.net \
  --environment=staging \
  --revision=rikms-app-00000-example \
  --mode=passive
```

For Google Cloud, upload JSON to this private object convention:

```text
incoming/<local|staging|production>/<revision>/<provider>-<unique-id>.json
```

The scheduled `rikms:security-import-pending` command imports a bounded batch, normalizes and redacts observations, then moves each object to `processed/` or `failed/`. The database stores a SHA-256 digest so a report cannot be imported twice.

The GitHub staging workflow authenticates with short-lived Workload Identity Federation credentials bound to the exact `security-staging` environment subject and grants its uploader identity only `roles/storage.objectCreator` on the security-report bucket. Uploads use an `if-generation-match=0` precondition so evidence is create-only and cannot overwrite an existing object. After an administrator runs `configure-github-security-oidc.sh`, copy the printed values into the protected `security-staging` GitHub environment and store the two synthetic tester credentials as environment secrets.

## Finding contract

An automated observation becomes confirmed only after manual reproduction. A confirmed finding needs:

- stable identifier and fingerprint;
- UTC timestamp and exact target revision;
- tester role and preconditions;
- sanitized request/response evidence;
- demonstrated impact and exploitability;
- OWASP and CWE mapping;
- severity rationale;
- remediation owner and target date;
- retest outcome.

No scanner or agent may claim that a clean run proves the system is impossible to penetrate.

## Release gate

Before production traffic moves:

1. All repository quality and audit checks pass.
2. Staging migrations and readiness pass.
3. Role, agency, publication, file, AI-review, private-download, and grant tests pass.
4. Automated staging observations are reviewed.
5. No known exploitable Critical or High finding remains open.
6. The previous Cloud Run revision and database recovery point are recorded.

After deployment, run passive canonical-host verification and verify `/up`, `/ready`, authentication, upload processing, AI review, private downloads, queue/scheduler executions and security headers.
