# Security Model

## Reporting a vulnerability

Do not open a public issue containing sensitive details. Report vulnerabilities privately to the system owner or designated security contact with reproduction steps, affected roles, and impact.

## Core controls

- Laravel session authentication with CSRF protection
- Explicit role middleware on agency and super-administration routes
- Policy checks and agency-scoped queries for every protected resource
- Private file storage with controller-mediated downloads
- Expiring access grants for request-controlled documents
- Login throttling and auditable authentication events
- Server-side validation and transactional writes
- Security headers and HTTPS-only production cookies
- A restrictive production Content Security Policy, frame denial, MIME sniffing protection, and referrer/feature policies
- Forced password rotation for administrator-provisioned credentials
- Hashed, expiring, use-limited download grants that can be revoked when a document changes
- PDF-only uploads with independent extension, MIME, and size validation
- Dedicated fail-closed private document storage backed by a private Cloud Storage volume in Cloud Run
- Trusted proxy and host enforcement, canonical signed URLs, explicit CORS origins, and no-store API responses
- A 14-character mixed-case, number, and symbol password policy for new and changed credentials
- Per-IP, per-account, per-user, access-request, and download throttling
- Mandatory confirmed TOTP for super administrators, five-minute login challenges, replay-resistant code verification, and rotating one-use recovery codes

Client-side route guards and hidden buttons are usability features only. They are never treated as authorization.

## Deployment checklist

- `APP_DEBUG=false`
- HTTPS enforced and `SESSION_SECURE_COOKIE=true`
- Unique production secrets stored outside the repository
- Demo accounts and demo seeding disabled
- Database and document-store backups encrypted and restore-tested
- Dependency audits and the full CI suite passing
- Least-privilege database, storage, and mail credentials
- Log access restricted because audit records can contain personal information
- `SESSION_DRIVER=database`, so account/role/agency changes can revoke server-side sessions immediately
- No raw access-grant token stored in logs or in-app notifications
- Nginx access logs omit query strings and referrers; Cloud logging rules must also avoid retaining signed download queries
- Cloud SQL automated backups, point-in-time recovery, deletion protection, and restore drills are enabled
- The Cloud Run service uses a dedicated runtime identity rather than the default Compute Editor service account
- Production host validation accepts only the canonical RIKMS hostname and internal health-probe hosts; the default Cloud Run hostname is not an alternate application entry point

## Security acceptance rule

A pentest release candidate is frozen only when the full automated gate is green and triage contains no known exploitable Critical or High finding. This is a release criterion, not a claim that the system is impossible to compromise. Residual Medium and Low items require an owner, rationale, retest status, and target resolution.
