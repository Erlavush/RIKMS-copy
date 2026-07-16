from __future__ import annotations

import datetime as dt
import json
import os
import re
import secrets
import threading
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


STATUSES = frozenset(
    {"queued", "running", "passed", "failed", "blocked", "skipped", "unavailable", "cancelled", "stale"}
)
FINAL_STATUSES = STATUSES - {"queued", "running"}
SECRET_KEYS = re.compile(r"(authorization|cookie|password|secret|token|xsrf|csrf|api[-_]?key)", re.IGNORECASE)
BEARER = re.compile(r"(?i)bearer\s+[a-z0-9._~+/=-]+")
COOKIE = re.compile(r"(?i)(set-cookie|cookie):\s*[^\r\n]+")


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sanitize(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            str(key): "[REDACTED]" if SECRET_KEYS.search(str(key)) else sanitize(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [sanitize(item) for item in value]
    if isinstance(value, tuple):
        return [sanitize(item) for item in value]
    if isinstance(value, str):
        return COOKIE.sub("cookie: [REDACTED]", BEARER.sub("Bearer [REDACTED]", value))
    return value


@dataclass
class ToolResult:
    tool: str
    category: str
    status: str = "queued"
    summary: str = "Waiting to run"
    started_at: str | None = None
    completed_at: str | None = None
    duration_ms: int | None = None
    exit_code: int | None = None
    tool_version: str | None = None
    metrics: dict[str, Any] = field(default_factory=dict)
    findings: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def public(self) -> dict[str, Any]:
        return sanitize(asdict(self))


@dataclass
class RunReport:
    run_id: str
    target: str
    environment: str
    mode: str
    revision: str
    selected: list[str]
    status: str = "queued"
    created_at: str = field(default_factory=utc_now)
    started_at: str | None = None
    completed_at: str | None = None
    tools: dict[str, ToolResult] = field(default_factory=dict)

    def public(self) -> dict[str, Any]:
        counts = {status: 0 for status in sorted(STATUSES)}
        for result in self.tools.values():
            counts[result.status] = counts.get(result.status, 0) + 1
        return sanitize(
            {
                "schema": "rikms-local-security-lab-v1",
                "run_id": self.run_id,
                "target": self.target,
                "environment": self.environment,
                "mode": self.mode,
                "revision": self.revision,
                "selected": self.selected,
                "status": self.status,
                "created_at": self.created_at,
                "started_at": self.started_at,
                "completed_at": self.completed_at,
                "counts": counts,
                "tools": {key: value.public() for key, value in self.tools.items()},
            }
        )


class RunStore:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(mode=0o700, parents=True, exist_ok=True)
        try:
            self.root.chmod(0o700)
        except PermissionError:
            pass
        self._lock = threading.RLock()
        self._latest: RunReport | None = None

    def new(self, *, target: str, environment: str, mode: str, revision: str, selected: list[str]) -> RunReport:
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        report = RunReport(
            run_id=f"{stamp}-{secrets.token_hex(4)}",
            target=target,
            environment=environment,
            mode=mode,
            revision=revision,
            selected=selected,
        )
        with self._lock:
            self._latest = report
            self.persist(report)
        return report

    def latest(self) -> dict[str, Any] | None:
        with self._lock:
            return self._latest.public() if self._latest else None

    def persist(self, report: RunReport) -> None:
        with self._lock:
            directory = self.root / report.run_id
            directory.mkdir(mode=0o700, parents=True, exist_ok=True)
            try:
                directory.chmod(0o700)
            except PermissionError:
                pass
            path = directory / "run.json"
            temporary = directory / ".run.json.tmp"
            temporary.write_text(json.dumps(report.public(), indent=2, sort_keys=True), encoding="utf-8")
            try:
                temporary.chmod(0o600)
            except PermissionError:
                pass
            os.replace(temporary, path)
            try:
                path.chmod(0o600)
            except PermissionError:
                pass
