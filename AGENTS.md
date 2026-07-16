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

### Jaylord's local security workbench

- `python -m security.lab` is Jaylord's standalone developer dashboard. Keep it independent from Laravel routes and bind it to `127.0.0.1` only.
- Preserve the Minecraft-inspired spider, the Tests/Larastan/ZAP/SCA/Native views, and Jaylord's authorship while improving their implementation behind stable report contracts.
- Treat `security/lab/dashboard/jaylord-original.html` as the visual source of truth from Jaylord's `fd6b736` dashboard. Do not redesign its palette, typography, layout, radar animation, or spider geometry; extend it only in the same visual language.
- Keep the procedural spider gait in `dashboard.js` transform-only and Minecraft-authentic: eight original rigid cuboid legs, Jaylord's alternating mirrored leg pairs, smooth start/stop blending, and a reduced-motion static pose. Never apply a CSS `filter` to the 3D spider parent because it flattens the cuboid model. Do not replace Jaylord's model with a generic SVG, canvas asset, or realistic jointed spider.
- The dashboard is viewable without a RIKMS login. Only authenticated test cases need synthetic accounts; never weaken RIKMS authentication to make the dashboard convenient.
- No scan starts merely because the dashboard opens. Code, passive web/API, local AI, ZAP and active modes require explicit selection.
- All scanner processes use argument arrays, `shell=False`, finite timeouts, bounded output, checked exit statuses and fresh private report paths.
- Windows PowerShell is the primary teammate workflow. Keep `scripts/windows/security-dashboard.ps1` and `docs/LOCAL_SECURITY_LAB.md` synchronized with CLI changes.
- Never mix checkouts between Laravel, Vite, the queue worker, or the security lab. `composer run dev` (or `npm run dev:rikms`) must start Laravel on 8000, the `default,ai` queue worker, logs, and Vite from one repository root; port 5173 is not the application URL.
- Keep local run artifacts below ignored `storage/app/security/lab`. Never commit generated reports, captured responses, session material or real research documents.
- Treat unavailable tools, blocked policy and malformed output as distinct non-passing states. Never convert missing evidence into an optimistic score.

### Local metadata AI red team

- The initial AI security lane targets loopback Ollama only. Cloud-model assessment is a later provider-adapter phase, not an excuse to bypass the local contract.
- Align AI fixtures with the canonical RIKMS metadata schema, queue/safety gate, provenance and human-review flow. The model cannot publish, approve, authorize or mutate authoritative metadata.
- Use synthetic fixtures for prompt injection, canary disclosure, conflicting metadata, invalid JSON, unsupported fields, fabricated evidence pages and resource limits. Do not commit private papers.
- Julse's MinerU/Ollama concept may inform a future optional extractor, but do not merge unrelated branch artifacts or hard-coded machine paths. Benchmark and sandbox any extractor before adoption.

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
