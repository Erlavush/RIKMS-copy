# RIKMS-copy

RIKMS-copy is a public copy of a Laravel 12 prototype for a research and innovation knowledge management system. It includes a dashboard, repository browsing, an upload wizard, mocked AI metadata extraction, SDG tagging, access control, review flows, submission tracking, access requests, and placeholder admin pages.

## Tech Stack

- Laravel 12
- PHP 8.3-compatible application code
- SQLite for local demo data
- Blade templates
- Tailwind CSS 4
- Vite
- Minimal vanilla JavaScript

## Local Setup

Install PHP and Composer dependencies:

```bash
composer install
```

Install frontend dependencies:

```bash
npm install
```

Create the environment file and app key:

```bash
cp .env.example .env
php artisan key:generate
```

Create the SQLite database, run migrations, and seed demo data:

```bash
touch database/database.sqlite
php artisan migrate:fresh --seed
```

Build frontend assets:

```bash
npm run build
```

Run the development server:

```bash
php artisan serve
```

## Demo Login

- Email: `test@example.com`
- Password: `password`
- Role: `agency_admin`

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

## Notes

Uploaded research documents are stored on the Laravel local disk under `storage/app/private/research-documents`. AI extraction is mocked in `App\Services\AiMetadataExtractionService`; it does not auto-publish, auto-approve, or bypass review.

