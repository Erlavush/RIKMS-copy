# RIKMS Agent Guide

## Mission

Build and operate RIKMS as a privacy-preserving research repository. Correct authorization, evidence, data provenance, and safe cloud operations outrank visual completion or optimistic claims.

## Repository architecture

- Laravel owns authentication, authorization, API validation, document workflow, queues, audit events, and private downloads.
- The React SPA consumes the documented `/api/rikms` routes. Do not add parallel controllers or compatibility routes when a canonical API already exists.
- PostgreSQL is the production database. SQLite is an isolated local/test convenience only.
- Private research documents live on the `documents` disk, backed by the private GCS FUSE mount in Cloud Run.
- Vertex AI produces schema-validated suggestions. Document AI is the configured OCR fallback. Every suggestion remains a draft until a human accepts it.
- Security scans run outside web requests. The administrator Security Center is read-only and receives sanitized, normalized findings.

## Working safely

1. Fetch before comparing branches.
2. Preserve unrelated worktree changes. Use a separate worktree for merges or broad integration.
3. Branch from current `origin/main` as `agent/<description>` or a teammate-specific short-lived branch.
4. Stage only intended files. Never use generated reports, `.env`, tokens, PDFs, database files, or raw security evidence as commit content.
5. Keep authored commits when integrating teammate work. Put reconciliation and hardening in separate commits.
6. Never rewrite or force-push a teammate branch unless the owner explicitly authorizes it and sensitive history requires it.

## Windows teammate compatibility

- Jaylord develops on Windows. Keep PHP, Node, SQLite, browser, and Python security workflows usable from PowerShell with repository-relative paths.
- Do not introduce Linux-only separators, `/home/...` paths, executable-bit assumptions, or Bash wrappers for local application work. Use `Path`/`pathlib`, Laravel storage abstractions, and argument arrays.
- When changing local setup or scanning, update `docs/WINDOWS_DEVELOPMENT.md` and the scripts under `scripts/windows`, then keep the ordinary Linux commands working too.
- Google Cloud provisioning scripts intentionally run in Bash. On Windows, use Google Cloud Shell or WSL2 for those scripts rather than translating secret and IAM operations into an unreviewed PowerShell variant.

## Cybersecurity lane

- Test only targets explicitly authorized in `SECURITY_ALLOWED_TARGETS`.
- Passive scanning is the default. Active scanning requires `SECURITY_ACTIVE_SCAN_ENABLED=true`.
- An active production scan additionally requires `RIKMS_PRODUCTION_ACTIVE_APPROVED=true` and a non-empty `RIKMS_PENTEST_CHANGE_ID`.
- Do not run denial-of-service, destructive uploads, credential attacks, phishing, persistence, or cloud-control-plane attacks without a separate written scope.
- Use synthetic accounts and test documents. Credentials enter through environment variables or Secret Manager, never source, command arguments, reports, screenshots, logs, or chat.
- Never invoke scanners with `shell=True`, interpolate URLs into shell commands, or expose cookies through process arguments.
- Never start a repository-wide static file server. Local helper interfaces bind to `127.0.0.1` only.
- Check every tool exit status, timeout, report creation time, target, and tested revision. A stale report is a failed scan, not reusable evidence.
- Scanner output is an observation. Confirmed findings require manual reproduction, demonstrated impact, sanitized evidence, OWASP/CWE mapping, an owner, remediation, and retest state.
- Store raw reports under private ignored storage or the private security-report bucket. The app API must never return raw report paths, cookies, authorization headers, CSRF tokens, signed grants, passwords, or personal data.

## Application security boundaries

- Super administrators require a changed password and confirmed two-factor authentication.
- Agency administrators are restricted to their agency. They cannot approve or publish their own submissions through a parallel route.
- Public APIs return published, explicitly public metadata only. Never add extracted text, private metadata, audit details, object paths, or access-request identities to bootstrap responses.
- Downloads go through `DocumentDownloadService` and policy/grant enforcement. Do not publish storage URLs.
- PDF uploads require extension, MIME, size, signature, integrity, and workflow checks. Malware status may be `unavailable`; never claim `passed` when no malware engine ran.
- Failed extraction is `needs_ocr` or `failed`. Never fabricate OCR text, research content, authors, results, SDGs, or confidence.

## AI contract

- Treat the document as untrusted model input.
- A newly stored or restored source must pass PDF signature, MIME, size, SHA-256, and configured malware checks before an AI job is released. Source replacement resets those states and invalidates stale analysis hashes.
- Preserve the existing queue, strict JSON schema validation, provenance fields, prompt version, cost metadata, and human-review step.
- The model has no permission, publication, approval, or authorization powers.
- Reject malformed or unsupported model output. Do not silently coerce it into authoritative metadata.

## Google Cloud contract

- Canonical production host: `https://rikms.v3ra.net`.
- Production service: `rikms-app` in `asia-east1` in the dedicated project.
- Secrets belong in Secret Manager. Documents and security evidence use separate private buckets and least-privilege service identities.
- Production migrations are forward-only. Never run `migrate:fresh`, a demo seeder, or fixed demo credentials in staging/production.
- Deploy a tagged revision with no traffic, run migrations and readiness checks, then move traffic gradually. Record the previous revision for rollback.
- `/up` is process liveness. `/ready` verifies database and private document storage readiness.
- Revalidate live IAM, Cloud SQL protection, buckets, revisions, traffic and domain mapping each deployment; repository configuration is not proof of live state.

## Required checks

```bash
composer validate --strict
vendor/bin/pint --test
composer analyse
php artisan test
python3 -m unittest discover -s security/tests -v
npm ci
npm run check
composer audit --locked
npm audit
git diff --check
```

Add focused tests for every changed boundary. For migrations, test both a fresh database and forward migration from the current schema.

## Definition of done

- No known exploitable Critical or High finding is accepted without an explicit owner and release decision.
- Tests prove role, agency, status, ownership, CSRF, upload, and private-download boundaries affected by the change.
- Generated evidence is private, sanitized, revision-aware, and fresh.
- Documentation describes the real implementation and limitations without claiming absolute security.
- The teammate can pull current `main`, branch fresh, run the documented checks, and continue without reconstructing hidden context.
