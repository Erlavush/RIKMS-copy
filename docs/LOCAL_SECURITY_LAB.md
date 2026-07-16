# RIKMS Local Security Lab

Jaylord's security dashboard is a standalone developer workbench. It is not a
public RIKMS feature and it does not require a RIKMS account merely to view the
dashboard. The lab binds to `127.0.0.1` and normally opens at
`http://127.0.0.1:8888`.

The application under test is separate:

```text
Security dashboard   http://127.0.0.1:8888   local view and scan control
RIKMS target          http://127.0.0.1:8000   application being assessed
Ollama                http://127.0.0.1:11434  optional local metadata model
```

## What changed from the prototype

The original visual concept and Minecraft-inspired spider remain. The unsafe
single-file execution model does not. The lab now:

- binds only to loopback and refuses non-loopback AI endpoints;
- does not start active scans automatically;
- uses argument arrays with `shell=False` for every child process;
- verifies exit status, timeout, fresh report creation, target and Git revision;
- reports `unavailable` or `blocked` instead of treating a missing tool as a pass;
- keeps evidence under ignored `storage/app/security/lab/runs`;
- redacts credential-like fields before dashboard display or report persistence;
- describes scanner output as an observation until a person reproduces it;
- uses local assets instead of loading dashboard JavaScript from a CDN.

### Visual fidelity contract

The served theme and spider come from Jaylord's original
`visualize_dashboard.py` UI at commit `fd6b736` on `origin/jaylord-edits`.
The black/indigo palette, Outfit and JetBrains Mono typography, executive and
technical modes, dashboard cards, tabs, radar animation, and full
abdomen/thorax/head Minecraft spider geometry are retained. The implementation
changes are behind that visual layer: remote assets are local, inline event
handlers are removed, scans require a click, report values render as text, and
the health circle now reports evidence coverage rather than claiming the
application is secure. New local-AI evidence uses the same visual language.

## Windows quick start

From PowerShell in the repository root, open only the dashboard:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 -View
```

Start RIKMS when needed and open the dashboard without running scans:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 -StartApp
```

`-StartApp` starts Laravel on port 8000, the `default,ai` queue worker, and
Vite from this same checkout before opening the dashboard. It refuses to start
when ports 8000 or 5173 are already occupied, which prevents accidentally
testing Laravel from one clone with Vite or the queue worker from another.

Start RIKMS and immediately refresh code, passive web/API and local Ollama
evidence:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\security-dashboard.ps1 `
  -StartApp -StartOllama -Code -Passive -AI
```

The `-AI` group expects Ollama and the selected model to be installed. The
`-StartOllama` switch starts the local service when it is not already running;
it never downloads a model. The default is `qwen3.5:4b`. If Ollama or that
model is unavailable, the result is `unavailable`—never passed. See
`docs/LOCAL_AI_DEVELOPMENT.md` for the application provider and OCR workflow.

## Linux quick start

Start the complete RIKMS development runtime from the same checkout in the
first terminal:

```bash
composer run dev
# Equivalent: npm run dev:rikms
```

Open RIKMS at `http://127.0.0.1:8000`. Plain `npm run dev` starts only Vite;
the page on port 5173 is not RIKMS and is not Jaylord's dashboard.

Start Jaylord's standalone workbench in a second terminal:

```bash
export SECURITY_ALLOWED_TARGETS=http://127.0.0.1:8000
python3 -m security.lab
```

Optional initial scans are explicit and repeatable:

```bash
python3 -m security.lab --run code --run passive --run ai
```

## Scan groups

### Codebase

The code group runs PHPUnit, Larastan, Composer audit, npm audit and a Laravel
route inventory. These tools execute from the repository root and must produce
fresh output. Dependency installation is not performed by the dashboard.

### Web and API

The native scanner checks security headers, untrusted CORS behavior and
anonymous access boundaries. Passive mode is the default. Active authenticated
checks use only synthetic accounts supplied at runtime:

```powershell
$scanCredential = Get-Credential -Message "Synthetic RIKMS scan account"
$env:RIKMS_SCAN_EMAIL = $scanCredential.UserName
$env:RIKMS_SCAN_PASSWORD = $scanCredential.GetNetworkCredential().Password
```

Do not store credentials in the repository, script arguments, report files or
screenshots. For local demo-only checks, provision local accounts with
`php artisan rikms:provision-demo`; never run that command against staging or
production.

### OWASP ZAP

ZAP is opt-in. Passive ZAP still requires the target origin in
`SECURITY_ALLOWED_TARGETS`. Active mode additionally requires an explicit
`-Active` switch or `--active`, which enables the active gate for that local
process. Production remains blocked unless the separate production approval
and change-ID gates are also set.

The lab does not place credentials, cookies or tokens in ZAP command arguments.
Do not run active ZAP against a website you do not own or have written
authorization to test.

### Local metadata AI

The first AI lane is deliberately local-only. It sends synthetic research text
to Ollama and validates the same metadata shape RIKMS expects. Fixtures cover:

- clean metadata extraction and author spelling;
- embedded prompt injection and fake approval instructions;
- canary disclosure and system-prompt extraction attempts;
- conflicting titles and unsupported fields;
- confidence, SDG and evidence-page bounds;
- malformed or non-JSON model output.

No private research document is part of the committed fixture set. Model output
remains a suggestion and never receives authority to publish, approve, change
permissions or write authoritative metadata. Cloud-model testing is deferred;
the same fixture and validator contract can later be applied through the RIKMS
provider adapter.

## Target policy

| Target | Passive | Active |
| --- | --- | --- |
| Loopback RIKMS | Allowed when listed; default local target | Explicit active switch plus synthetic credentials |
| Authorized staging | Exact HTTPS origin must be listed | Explicit active switch, credentials and written scope |
| Production | Controlled passive checks only | Blocked unless approval and change ID are both present |
| Any other site | Refused | Refused |

Active mode does not authorize destructive uploads, denial of service,
credential attacks, phishing, persistence or cloud-control-plane testing.

## Reading results

The dashboard shows evidence coverage, not a claim that RIKMS is secure. Tool
states are `queued`, `running`, `passed`, `failed`, `blocked`, `skipped`,
`unavailable`, `cancelled` or `stale`. Every report records the target, mode,
revision and timestamps. A Critical or High automated observation blocks the
run but remains an observation until manually reproduced with sanitized
evidence, demonstrated impact, an owner and a retest.
