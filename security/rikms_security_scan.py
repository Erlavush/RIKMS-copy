#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import http.cookiejar
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from safety import SafetyError, TargetPolicy, private_output_path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "RIKMS-Authorized-Security-Scanner/1.0"


class ScanClient:
    def __init__(self, origin: str, timeout: float) -> None:
        self.origin = origin
        self.timeout = timeout
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookies),
            urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        )

    def request(
        self,
        path: str,
        *,
        method: str = "GET",
        data: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, dict[str, str], bytes]:
        url = urllib.parse.urljoin(self.origin + "/", path.lstrip("/"))
        payload = None
        request_headers = {"User-Agent": USER_AGENT, "Accept": "application/json,text/html;q=0.9"}
        if data is not None:
            payload = json.dumps(data).encode("utf-8")
            request_headers["Content-Type"] = "application/json"
        request_headers.update(headers or {})
        request = urllib.request.Request(url, data=payload, method=method, headers=request_headers)
        try:
            response = self.opener.open(request, timeout=self.timeout)
            body = response.read(2 * 1024 * 1024)
            status = response.status
            response_headers = dict(response.headers.items())
            final_url = response.geturl()
        except urllib.error.HTTPError as error:
            body = error.read(2 * 1024 * 1024)
            status = error.code
            response_headers = dict(error.headers.items())
            final_url = error.geturl()

        if not final_url.startswith(self.origin + "/") and final_url != self.origin:
            raise SafetyError("Target redirected the scanner outside the authorized origin.")
        return status, response_headers, body

    def xsrf_token(self) -> str | None:
        for cookie in self.cookies:
            if cookie.name == "XSRF-TOKEN":
                return urllib.parse.unquote(cookie.value)
        return None


def finding(
    identifier: str,
    title: str,
    severity: str,
    observed: str,
    *,
    endpoint: str | None = None,
    method: str | None = None,
    owasp: str | None = None,
    cwe: str | None = None,
    remediation: str | None = None,
) -> dict[str, Any]:
    return {
        "id": identifier,
        "title": title,
        "description": observed,
        "severity": severity,
        "observed": observed,
        "endpoint": endpoint,
        "method": method,
        "owasp": owasp,
        "cwe": cwe,
        "remediation": remediation,
    }


def passive_checks(client: ScanClient, environment: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    checks: list[dict[str, Any]] = []
    status, headers, _ = client.request("/")
    checks.append({"id": "HTTP-001", "name": "Target connectivity", "passed": status == 200, "status": status})
    if status != 200:
        findings.append(finding(
            "HTTP-001", "Canonical application did not return HTTP 200", "high",
            f"The authorized target returned HTTP {status} at the root route.", endpoint="/", method="GET",
            owasp="A05:2021-Security Misconfiguration",
        ))

    normalized_headers = {key.lower(): value for key, value in headers.items()}
    required = {
        "content-security-policy": "Content Security Policy",
        "x-content-type-options": "MIME sniffing protection",
        "x-frame-options": "Frame embedding protection",
        "referrer-policy": "Referrer policy",
        "permissions-policy": "Browser permissions policy",
    }
    if environment != "local":
        required["strict-transport-security"] = "HTTP Strict Transport Security"
    for name, label in required.items():
        present = bool(normalized_headers.get(name))
        checks.append({"id": f"HDR-{name}", "name": label, "passed": present})
        if not present:
            findings.append(finding(
                f"HDR-{name}", f"Missing {label}", "medium", f"Response header {name} was absent.",
                endpoint="/", method="GET", owasp="A05:2021-Security Misconfiguration",
                remediation=f"Set and verify the {name} response header on the canonical host.",
            ))

    status, cors_headers, _ = client.request(
        "/api/rikms/bootstrap",
        headers={"Origin": "https://unauthorized.invalid"},
    )
    allowed_origin = {key.lower(): value for key, value in cors_headers.items()}.get("access-control-allow-origin")
    cors_passed = status == 200 and allowed_origin not in {"*", "https://unauthorized.invalid"}
    checks.append({"id": "CORS-001", "name": "Untrusted origin rejection", "passed": cors_passed, "status": status})
    if not cors_passed:
        findings.append(finding(
            "CORS-001", "Untrusted cross-origin request may be allowed", "high",
            "The bootstrap API accepted an unauthorized origin in its CORS response.",
            endpoint="/api/rikms/bootstrap", method="GET", owasp="A05:2021-Security Misconfiguration",
        ))

    for identifier, path in {
        "AUTH-ADMIN": "/api/rikms/admin/security",
        "AUTH-AGENCY": "/api/rikms/agency/dashboard",
    }.items():
        protected_status, _, _ = client.request(path)
        passed = protected_status in {401, 403, 409}
        checks.append({"id": identifier, "name": f"Anonymous boundary for {path}", "passed": passed, "status": protected_status})
        if not passed:
            findings.append(finding(
                identifier, "Protected API accepted an anonymous request", "critical",
                f"Anonymous GET returned HTTP {protected_status} instead of an authentication or authorization denial.",
                endpoint=path, method="GET", owasp="A01:2021-Broken Access Control", cwe="CWE-862",
            ))

    return findings, checks


def active_authenticated_checks(client: ScanClient) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    findings: list[dict[str, Any]] = []
    checks: list[dict[str, Any]] = []
    email = os.getenv("RIKMS_SCAN_EMAIL", "").strip()
    password = os.getenv("RIKMS_SCAN_PASSWORD", "")
    if not email or not password:
        raise SafetyError("Active authenticated checks require RIKMS_SCAN_EMAIL and RIKMS_SCAN_PASSWORD.")

    client.request("/login")
    xsrf = client.xsrf_token()
    headers = {"X-XSRF-TOKEN": xsrf} if xsrf else {}
    login_status, _, _ = client.request(
        "/login",
        method="POST",
        data={"email": email, "password": password},
        headers=headers,
    )
    me_status, _, me_body = client.request("/api/rikms/me")
    authenticated = login_status in {200, 204, 302} and me_status == 200
    checks.append({"id": "AUTH-LOGIN", "name": "Synthetic test-account authentication", "passed": authenticated})
    if not authenticated:
        findings.append(finding(
            "AUTH-LOGIN", "Synthetic authenticated scan could not establish a session", "high",
            f"Login returned HTTP {login_status}; identity endpoint returned HTTP {me_status}.",
            endpoint="/login", method="POST", owasp="A07:2021-Identification and Authentication Failures",
        ))
        return findings, checks

    try:
        me = json.loads(me_body.decode("utf-8"))
        role = me.get("data", {}).get("role")
    except (UnicodeDecodeError, json.JSONDecodeError):
        role = None
    forbidden_path = "/api/rikms/admin/security" if role == "agency_admin" else "/api/rikms/agency/dashboard"
    boundary_status, _, _ = client.request(forbidden_path)
    boundary_passed = boundary_status == 403
    checks.append({"id": "AUTH-ROLE", "name": "Cross-role API boundary", "passed": boundary_passed, "status": boundary_status})
    if not boundary_passed:
        findings.append(finding(
            "AUTH-ROLE", "Cross-role API boundary did not return HTTP 403", "critical",
            f"Authenticated role {role or 'unknown'} received HTTP {boundary_status} at the opposite-role API.",
            endpoint=forbidden_path, method="GET", owasp="A01:2021-Broken Access Control", cwe="CWE-863",
        ))

    csrf_status, _, _ = client.request(
        "/api/rikms/change-password",
        method="POST",
        data={
            "current_password": password,
            "password": "ValidButNeverApplied!2026",
            "password_confirmation": "ValidButNeverApplied!2026",
        },
    )
    csrf_passed = csrf_status == 419
    checks.append({"id": "CSRF-001", "name": "Missing CSRF token rejection", "passed": csrf_passed, "status": csrf_status})
    if not csrf_passed:
        findings.append(finding(
            "CSRF-001", "State-changing API did not reject a missing CSRF header", "high",
            f"Authenticated password-change request without X-XSRF-TOKEN returned HTTP {csrf_status}.",
            endpoint="/api/rikms/change-password", method="POST", owasp="A01:2021-Broken Access Control", cwe="CWE-352",
        ))
    return findings, checks


def write_report(path: Path, report: dict[str, Any]) -> None:
    payload = json.dumps(report, indent=2, sort_keys=True).encode("utf-8")
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags, 0o600)
    with os.fdopen(descriptor, "wb") as handle:
        handle.write(payload)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run bounded RIKMS application security checks.")
    parser.add_argument("--target", required=True)
    parser.add_argument("--environment", choices=["local", "staging", "production"], default="local")
    parser.add_argument("--mode", choices=["passive", "active"], default="passive")
    parser.add_argument("--revision", default=os.getenv("RIKMS_SCAN_REVISION", ""))
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--output")
    args = parser.parse_args()

    timestamp = dt.datetime.now(dt.timezone.utc)
    filename = f"native-{timestamp.strftime('%Y%m%dT%H%M%SZ')}.json"
    try:
        origin = TargetPolicy.from_environment().authorize(args.target, args.mode)
        output = private_output_path(args.output, filename, PROJECT_ROOT)
        client = ScanClient(origin, args.timeout)
        findings, checks = passive_checks(client, args.environment)
        if args.mode == "active":
            active_findings, active_checks = active_authenticated_checks(client)
            findings.extend(active_findings)
            checks.extend(active_checks)
    except (SafetyError, OSError, urllib.error.URLError) as error:
        print(f"Security scan refused or failed safely: {error}", file=sys.stderr)
        return 2

    counts = {severity: 0 for severity in ["critical", "high", "medium", "low", "info"]}
    for item in findings:
        counts[item["severity"]] += 1
    report = {
        "schema": "rikms-security-report-v1",
        "generated_at": timestamp.isoformat(),
        "target": origin,
        "environment": args.environment,
        "mode": args.mode,
        "revision": args.revision or None,
        "summary": {"checks": len(checks), "passed": sum(bool(item["passed"]) for item in checks), "findings": len(findings), **counts},
        "checks": checks,
        "findings": findings,
    }
    try:
        write_report(output, report)
    except OSError as error:
        print(f"Security report could not be written safely: {error}", file=sys.stderr)
        return 2
    print(f"Security report written privately to {output}")
    return 1 if counts["critical"] or counts["high"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
