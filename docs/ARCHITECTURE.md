# RIKMS Architecture

RIKMS is a Laravel 12 application with a React single-page interface compiled by Vite. Laravel is the sole source of truth for authentication, authorization, records, workflow state, files, audit events, notifications, and analytics. React renders server state and never grants access on its own.

## Runtime boundaries

- Public pages may read only published documents and metadata fields explicitly marked public.
- Agency administrators operate only on users, documents, access requests, and analytics belonging to their agency.
- Super administrators manage platform-wide governance and moderate submitted documents.
- Uploaded documents remain on a private filesystem. Downloads pass through an authorized controller and are logged.
- AI metadata extraction is intentionally implemented as a deterministic mocked helper until an approved provider is selected. Its output is always a reviewable suggestion; it cannot submit, approve, publish, or bypass moderation.

## Document lifecycle

```text
draft -> pending -> published
   ^         |          |
   |         v          v
   +----- rejected    archived
             |          |
             +-> pending+-> restored prior state
```

Only an agency administrator for the owning agency can create, edit, and submit a draft. Only a super administrator can publish or reject a pending submission. Published content can be archived and restored through audited actions.

## Access modes

- `public_download`: published files are available through the download controller.
- `request_access`: an approved, unexpired download grant is required.
- `restricted_admin`: only authorized agency or super administrators may download.
- `embargo_until_date`: public access begins after the configured date; administrators retain access.
- `external_link_only`: the controller redirects to the validated external URL and does not expose a local path.

## API conventions

The session-authenticated JSON API lives under `/api/rikms`. Lists use `{ "data": [...], "meta": {...} }`; individual resources use `{ "data": {...} }`. Validation failures use Laravel's `{ "message", "errors" }` shape. Mutations require CSRF protection and authorization on the server.

## Data and file integrity

Multi-table writes run in database transactions. File replacement and deletion are coordinated with record changes so failures do not leave orphaned files. Demo records do not imply downloadable files unless a fixture exists.
