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
