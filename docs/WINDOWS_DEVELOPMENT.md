# RIKMS Windows Development

Jaylord's supported local workflow is Windows PowerShell from the repository root. Use PHP 8.3+, Composer 2, Node.js 22+, Git, Python 3.12, and SQLite. In the active `php.ini`, enable `fileinfo`, `mbstring`, `openssl`, `pdo_sqlite`, and `sqlite3`.

## Fresh clone or updated main

Open PowerShell in the clone and run:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
powershell -ExecutionPolicy Bypass -File .\scripts\windows\setup-local.ps1
```

The script preserves an existing `.env`, installs locked PHP and Node dependencies, creates the ignored SQLite file when absent, migrates forward, provisions the local-only demo accounts, and builds the frontend.

Start the runtime in separate PowerShell windows:

```powershell
php -d upload_max_filesize=25M -d post_max_size=27M artisan serve --host=127.0.0.1 --port=8000
php artisan queue:work --queue=default,ai --tries=3
php artisan schedule:work
npm run dev
```

These commands must all be run from the same clone. `npm run dev` starts only
Vite; never browse port 5173 as the application. RIKMS is always opened at
`http://127.0.0.1:8000`. For a single managed command that also opens Jaylord's
dashboard, use the `security-dashboard.ps1 -StartApp` workflow below.

Open `http://127.0.0.1:8000/login`. Local demo credentials are `test@example.com` / `password` and `admin@rikms.gov.ph` / `password`. They are deliberately local-only; never use them on staging or production.

## Authorized local security assessment

Jaylord's visual security workbench is independent from the RIKMS web UI and
does not require a RIKMS login to view:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 -StartApp
```

`-StartApp` starts Laravel, the `default,ai` queue worker, and Vite from this
repository, then opens the dashboard. When the dashboard exits, only the
processes it started are stopped. The script refuses occupied ports 8000 or
5173 so it cannot silently combine different clones.

To open it and explicitly refresh code, passive application and local Ollama
evidence:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 `
  -StartApp -StartOllama -Code -Passive -AI
```

The dashboard opens at `http://127.0.0.1:8888`; the RIKMS target remains at
`http://127.0.0.1:8000`. See `docs/LOCAL_SECURITY_LAB.md` for scan modes,
AI fixtures, target authorization and evidence handling.
The application-side local provider and OCR setup are documented in
`docs/LOCAL_AI_DEVELOPMENT.md`.

With the server running, a passive scan is:

```powershell
$env:SECURITY_ALLOWED_TARGETS = "http://127.0.0.1:8000"
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-scan.ps1
```

The report is permission-restricted where Windows supports it and is written below ignored `storage\app\security\reports`. Import it with:

```powershell
php artisan rikms:security-import storage\app\security\reports\native-windows.json `
  --format=rikms-native `
  --target=http://127.0.0.1:8000 `
  --environment=local `
  --revision=$(git rev-parse HEAD)
```

For an authorized staging target, set `SECURITY_ALLOWED_TARGETS` to that exact HTTPS origin first. Active mode also requires `SECURITY_ACTIVE_SCAN_ENABLED=true` plus synthetic test credentials in `RIKMS_SCAN_EMAIL` and `RIKMS_SCAN_PASSWORD`. Production active mode remains blocked unless the separate production approval and change-ID variables are present.

For OWASP ZAP, install ZAP and point to its batch launcher:

```powershell
$env:SECURITY_ALLOWED_TARGETS = "https://rikms-staging.v3ra.net"
$env:ZAP_BIN = "C:\Program Files\ZAP\Zed Attack Proxy\zap.bat"
py -3.12 security\run_zap.py --target=https://rikms-staging.v3ra.net --mode=passive
```

## Quality gate

```powershell
composer validate --strict
php vendor\bin\pint --test
php vendor\bin\phpstan analyse --memory-limit=1G
php artisan test
py -3.12 -m unittest discover -s security\tests -v
npm ci
npm run check
composer audit --locked
npm audit
git diff --check
```

## Continue after this integration merges

Do not delete unfinished work. Commit or stash it first, then start the next unit from updated `main`:

```powershell
git status
git add -p
git commit -m "WIP: preserve current security work"
git push origin jaylord-edits
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c jaylord-edits-security2
git push -u origin jaylord-edits-security2
```

Use a new short-lived branch because the integrated `main` already contains Jaylord's earlier commits plus the reconciliation work. This preserves his GitHub authorship and avoids replaying the same 23 commits.

## Google Cloud

Run `deploy-staging-to-gcp.sh`, `deploy-to-gcp.sh`, and `configure-github-security-oidc.sh` in Google Cloud Shell or WSL2. Those are deliberately reviewed Bash entrypoints for IAM, Secret Manager, Cloud SQL, buckets, migrations, canary traffic, and rollback. Do not create a separate unreviewed Windows deployment path with different security behavior.
