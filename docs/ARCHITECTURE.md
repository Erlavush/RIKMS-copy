# RIKMS Architecture

RIKMS is a Laravel 13 application with a React single-page interface compiled by Vite. Laravel is the sole source of truth for authentication, authorization, records, workflow state, files, audit events, notifications, and analytics. React renders server state and never grants access on its own.

## Runtime boundaries

- Public pages may read only published documents and metadata fields explicitly marked public.
- Agency administrators operate only on users, documents, access requests, and analytics belonging to their agency.
- Super administrators manage platform-wide governance and moderate submitted documents.
- Super-administration is gated by a confirmed TOTP authenticator after password authentication; recovery codes are encrypted, one-use, and rotated when consumed.
- Uploaded documents remain on the dedicated private `documents` disk. Cloud Run mounts that disk from a private Cloud Storage bucket; local development maps it to `storage/app/private`. Downloads pass through an authorized controller and are logged.
- AI document assistance uses Vertex AI `gemini-3.1-flash-lite`. Embedded PDF text is extracted locally; a configured Document AI processor handles scanned OCR, with Gemini PDF understanding as the fallback. Every run is queued, schema-validated, cost-tracked, and stored separately from authoritative metadata.
- AI-enabled uploads remain drafts. A user must apply, edit, save, and explicitly mark accepted suggestion fields before normal submission and independent moderation.
- Successful source-file creation and replacement emit `DocumentSourceStored`. The teammate-owned Google Drive mirror must consume that event asynchronously; Drive is a secondary copy and never the authorization or download source of truth.

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

Multi-table writes run in database transactions. File replacement and deletion are coordinated with record changes so failures do not leave orphaned files.

## AI trust boundary

PDF content is untrusted input. System instructions prohibit following commands embedded in documents, structured output is validated server-side, and the model has no tools or database permissions. RIKMS stores the model ID, prompt version, extraction method, token counts, estimated cost, confidence, accepted fields, and reviewer; it does not store extracted full text in the analysis audit row.
