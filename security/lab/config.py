from __future__ import annotations

import os
import socket
import subprocess
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from security.safety import SafetyError, TargetPolicy, normalized_origin


SCANNERS = frozenset({"code", "passive", "zap", "ai"})


def _git_revision(project_root: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=project_root,
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired):
        return "unknown"
    revision = result.stdout.strip()
    return revision if result.returncode == 0 and revision else "unknown"


def _loopback_url(value: str, label: str) -> str:
    origin = normalized_origin(value)
    hostname = (urlsplit(origin).hostname or "").lower()
    if hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise SafetyError(f"{label} must use a loopback address.")
    return origin


@dataclass(frozen=True)
class LabConfig:
    project_root: Path
    target: str
    environment: str
    scan_mode: str
    revision: str
    host: str = "127.0.0.1"
    port: int = 8888
    open_browser: bool = True
    initial_scans: tuple[str, ...] = ()
    ai_url: str = "http://127.0.0.1:11434"
    ai_model: str = "qwen3.5:4b"
    ai_timeout: int = 120

    @classmethod
    def create(
        cls,
        *,
        project_root: Path,
        target: str = "http://127.0.0.1:8000",
        environment: str = "local",
        scan_mode: str = "passive",
        revision: str = "",
        host: str = "127.0.0.1",
        port: int = 8888,
        open_browser: bool = True,
        initial_scans: tuple[str, ...] = (),
        ai_url: str = "http://127.0.0.1:11434",
        ai_model: str = "qwen3.5:4b",
        ai_timeout: int = 120,
    ) -> "LabConfig":
        root = project_root.resolve()
        if host != "127.0.0.1":
            raise SafetyError("The security dashboard must bind to 127.0.0.1 only.")
        if environment not in {"local", "staging", "production"}:
            raise SafetyError("Environment must be local, staging, or production.")
        if scan_mode not in {"passive", "active"}:
            raise SafetyError("Scan mode must be passive or active.")
        if not 1 <= port <= 65535:
            raise SafetyError("Dashboard port must be between 1 and 65535.")
        unknown = set(initial_scans) - SCANNERS
        if unknown:
            raise SafetyError(f"Unknown initial scanners: {', '.join(sorted(unknown))}")
        return cls(
            project_root=root,
            target=normalized_origin(target),
            environment=environment,
            scan_mode=scan_mode,
            revision=revision.strip() or _git_revision(root),
            host=host,
            port=port,
            open_browser=open_browser,
            initial_scans=tuple(dict.fromkeys(initial_scans)),
            ai_url=_loopback_url(ai_url, "Ollama endpoint"),
            ai_model=ai_model.strip() or "qwen3.5:4b",
            ai_timeout=max(10, min(ai_timeout, 600)),
        )

    @property
    def reports_root(self) -> Path:
        return self.project_root / "storage" / "app" / "security" / "lab" / "runs"

    def authorize_target(self, mode: str | None = None) -> str:
        return TargetPolicy.from_environment().authorize(self.target, mode or self.scan_mode)

    def dashboard_url(self, port: int | None = None) -> str:
        return f"http://127.0.0.1:{port or self.port}"


def available_port(host: str, preferred: int, attempts: int = 50) -> int:
    for port in range(preferred, min(preferred + attempts, 65536)):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            try:
                probe.bind((host, port))
            except OSError:
                continue
            return port
    raise SafetyError(f"No available dashboard port found from {preferred}.")
