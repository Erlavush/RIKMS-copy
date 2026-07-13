# RIKMS

RIKMS is a regional research and innovation knowledge-management application built with Laravel 12, React, TypeScript, Tailwind CSS 4, and Vite. It provides a public research repository, agency workspaces, controlled document access, structured reporting, and platform-wide moderation and administration.

## Capabilities

- Public discovery of published research, participating agencies, categories, and SDG alignment
- Agency-scoped dashboards, repository management, upload and draft workflows
- Reviewable mocked AI metadata suggestions that never auto-submit or auto-publish
- Research metadata, public-field selection, SDG tags, PAP classification, performance, financial, and highlight data
- Formal submission, moderation, rejection, publication, archive, and restore transitions
- Public, request-controlled, restricted, embargoed, and external-link access policies
- Audited access requests and authorized private-file downloads
- Super-administration for agencies, users, moderation, access monitoring, roles, settings, security summaries, and audit history
- Server-side role enforcement and agency isolation

## Requirements

- PHP 8.3 or newer
- PHP upload limits of at least 64 MB for the documented 50 MB research-file limit
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
/home/eru/.local/bin/php artisan migrate:fresh --seed
npm install
npm run build
/home/eru/.local/bin/php -d upload_max_filesize=64M -d post_max_size=70M artisan serve --host=127.0.0.1 --port=8000
```

The seeder creates a small valid demonstration PDF on the ignored private disk, so the seeded download and access-request flows are immediately testable. For active frontend development, run `npm run dev` in a second terminal.

Keep a queue worker running for mail and digest delivery, and run the Laravel scheduler every minute:

```bash
/home/eru/.local/bin/php artisan queue:work --tries=3
/home/eru/.local/bin/php artisan schedule:work
```

`schedule:work` is convenient locally. Production should invoke `php artisan schedule:run` every minute through cron or the hosting scheduler. The weekly agency digest runs Monday at 08:00 Asia/Manila for agencies that enable it.

## Demo accounts

These credentials exist only after running the demo seeder and must never be enabled in production.

| Role | Email | Password |
|---|---|---|
| Agency administrator | `test@example.com` | `password` |
| Super administrator | `admin@rikms.gov.ph` | `password` |

Accounts created or password-reset by an administrator are forced through the password-change screen before any protected workspace can be used.

## Quality checks

```bash
/home/eru/.local/bin/php artisan test
/home/eru/.local/bin/php vendor/bin/pint --test
/home/eru/.local/bin/php vendor/bin/phpstan analyse --memory-limit=1G
npm run check
```

The test configuration uses in-memory SQLite. File tests use a fake private disk and do not modify demo uploads.

## Storage and safety

Research documents are stored on the private local disk under `storage/app/private/research-documents` in local development. Browser requests never receive raw storage paths; files are delivered only by an authorized controller. `.env`, SQLite databases, generated builds, and private uploads are ignored by Git.

AI extraction remains mocked by design. Suggestions require human review and cannot approve or publish a record.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations](docs/OPERATIONS.md)
