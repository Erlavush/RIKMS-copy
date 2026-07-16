from __future__ import annotations

import hmac
import json
import secrets
import threading
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from .config import LabConfig, available_port
from .runner import SecurityLabRunner
from .ui import original_css, original_page


MAX_REQUEST_BYTES = 4096


def _handler_factory(
    runner: SecurityLabRunner,
    assets: Path,
    token: str,
    origin: str,
) -> type[BaseHTTPRequestHandler]:
    allowed_hosts = {urlsplit(origin).netloc, urlsplit(origin).netloc.replace("127.0.0.1", "localhost")}

    class DashboardHandler(BaseHTTPRequestHandler):
        server_version = "RIKMSLocalSecurityLab/1.0"

        def log_message(self, format: str, *args: object) -> None:
            message = format % args
            if '"GET /api/status' in message:
                return
            print(f"[security-lab] {self.client_address[0]} {message[:500]}")

        def _allowed_request(self) -> bool:
            return self.client_address[0] in {"127.0.0.1", "::1"} and self.headers.get("Host", "") in allowed_hosts

        def _headers(self, status: int, content_type: str, length: int) -> None:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(length))
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; "
                "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; "
                "form-action 'self'",
            )
            self.end_headers()

        def _send(self, status: int, payload: bytes, content_type: str) -> None:
            self._headers(status, content_type, len(payload))
            if self.command != "HEAD":
                self.wfile.write(payload)

        def _json(self, status: int, payload: dict[str, Any]) -> None:
            self._send(status, json.dumps(payload, separators=(",", ":")).encode("utf-8"), "application/json; charset=utf-8")

        def _not_found(self) -> None:
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

        def do_HEAD(self) -> None:
            self.do_GET()

        def do_GET(self) -> None:
            if not self._allowed_request():
                self._json(HTTPStatus.FORBIDDEN, {"error": "Loopback host required"})
                return
            path = urlsplit(self.path).path
            if path == "/":
                page = original_page(token)
                self._send(HTTPStatus.OK, page.encode("utf-8"), "text/html; charset=utf-8")
            elif path == "/dashboard.css":
                self._send(HTTPStatus.OK, original_css().encode("utf-8"), "text/css; charset=utf-8")
            elif path == "/dashboard.js":
                self._send(HTTPStatus.OK, (assets / "dashboard.js").read_bytes(), "text/javascript; charset=utf-8")
            elif path == "/chart.umd.js":
                self._send(
                    HTTPStatus.OK,
                    (runner.config.project_root / "node_modules" / "chart.js" / "dist" / "chart.umd.js").read_bytes(),
                    "text/javascript; charset=utf-8",
                )
            elif path.startswith("/fonts/"):
                font = path.removeprefix("/fonts/")
                family, _, filename = font.partition("-")
                weight = filename.removesuffix(".woff2")
                if family not in {"outfit", "jetbrains"} or weight not in {"300", "400", "500", "600", "700"}:
                    self._not_found()
                    return
                package = "outfit" if family == "outfit" else "jetbrains-mono"
                source = runner.config.project_root / "node_modules" / "@fontsource" / package / "files" / f"{package}-latin-{weight}-normal.woff2"
                if not source.is_file():
                    self._not_found()
                    return
                self._send(HTTPStatus.OK, source.read_bytes(), "font/woff2")
            elif path == "/api/status":
                self._json(HTTPStatus.OK, runner.snapshot())
            elif path == "/healthz":
                self._json(HTTPStatus.OK, {"status": "ok", "scope": "loopback-only"})
            else:
                self._not_found()

        def do_POST(self) -> None:
            if not self._allowed_request():
                self._json(HTTPStatus.FORBIDDEN, {"error": "Loopback host required"})
                return
            path = urlsplit(self.path).path
            if path != "/api/run":
                self._not_found()
                return
            supplied = self.headers.get("X-RIKMS-Lab-Token", "")
            request_origin = self.headers.get("Origin", "")
            if not hmac.compare_digest(supplied, token) or request_origin != origin:
                self._json(HTTPStatus.FORBIDDEN, {"error": "Local request verification failed"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if not 1 <= length <= MAX_REQUEST_BYTES:
                self._json(HTTPStatus.BAD_REQUEST, {"error": "Invalid request size"})
                return
            try:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return
            selected = payload.get("selected", []) if isinstance(payload, dict) else []
            if not isinstance(selected, list) or not all(isinstance(item, str) for item in selected):
                self._json(HTTPStatus.BAD_REQUEST, {"error": "selected must be a string array"})
                return
            started, message = runner.start(selected)
            self._json(HTTPStatus.ACCEPTED if started else HTTPStatus.CONFLICT, {"started": started, "message": message})

    return DashboardHandler


def run_dashboard(config: LabConfig) -> None:
    port = available_port(config.host, config.port)
    origin = config.dashboard_url(port)
    token = secrets.token_urlsafe(32)
    runner = SecurityLabRunner(config)
    assets = Path(__file__).resolve().parent / "dashboard"
    server = ThreadingHTTPServer((config.host, port), _handler_factory(runner, assets, token, origin))
    server.daemon_threads = True
    print("=" * 64)
    print(" RIKMS Local Security Lab — Jaylord's Verification Dashboard")
    print(f" Dashboard: {origin}")
    print(f" Target:    {config.target} ({config.scan_mode})")
    print(" Scope:     loopback-only dashboard; scans require an explicit action")
    print("=" * 64)
    if config.open_browser:
        threading.Timer(0.35, lambda: webbrowser.open(origin)).start()
    if config.initial_scans:
        threading.Timer(0.5, lambda: runner.start(list(config.initial_scans))).start()
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\nSecurity lab stopped.")
    finally:
        server.server_close()
