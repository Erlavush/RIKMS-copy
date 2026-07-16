from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


class SafetyError(ValueError):
    """Raised when a scan would cross an authorized safety boundary."""


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes"}


def normalized_origin(value: str) -> str:
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise SafetyError("Target must be an absolute HTTP or HTTPS URL.")
    if parsed.username or parsed.password or parsed.fragment:
        raise SafetyError("Target URLs must not contain credentials or fragments.")
    host = parsed.hostname.lower()
    try:
        port = parsed.port
    except ValueError as error:
        raise SafetyError("Target URL contains an invalid port.") from error
    default_port = 443 if parsed.scheme == "https" else 80
    formatted_host = f"[{host}]" if ":" in host else host
    authority = formatted_host if port in {None, default_port} else f"{formatted_host}:{port}"
    return urlunsplit((parsed.scheme, authority, "", "", ""))


@dataclass(frozen=True)
class TargetPolicy:
    allowed_origins: frozenset[str]
    production_host: str
    active_enabled: bool
    production_active_approved: bool
    change_id: str

    @classmethod
    def from_environment(cls) -> "TargetPolicy":
        configured = os.getenv(
            "SECURITY_ALLOWED_TARGETS",
            "http://127.0.0.1:8000,http://localhost:8000",
        )
        allowed = frozenset(
            normalized_origin(item)
            for item in configured.split(",")
            if item.strip()
        )
        return cls(
            allowed_origins=allowed,
            production_host=os.getenv("SECURITY_PRODUCTION_HOST", "rikms.v3ra.net").lower(),
            active_enabled=_truthy(os.getenv("SECURITY_ACTIVE_SCAN_ENABLED")),
            production_active_approved=_truthy(os.getenv("RIKMS_PRODUCTION_ACTIVE_APPROVED")),
            change_id=os.getenv("RIKMS_PENTEST_CHANGE_ID", "").strip(),
        )

    def authorize(self, target: str, mode: str) -> str:
        origin = normalized_origin(target)
        if origin not in self.allowed_origins:
            raise SafetyError(
                "Target is not explicitly authorized. Add its exact origin to "
                "SECURITY_ALLOWED_TARGETS before scanning."
            )

        parsed = urlsplit(origin)
        is_loopback = parsed.hostname in {"127.0.0.1", "localhost", "::1"}
        if not is_loopback and parsed.scheme != "https":
            raise SafetyError("Non-loopback targets must use HTTPS.")

        if mode == "active":
            if not self.active_enabled:
                raise SafetyError("Active scanning is disabled by configuration.")
            if parsed.hostname == self.production_host:
                if not self.production_active_approved or not self.change_id:
                    raise SafetyError(
                        "Production active scans require explicit approval and a change identifier."
                    )
        elif mode != "passive":
            raise SafetyError("Scan mode must be passive or active.")

        return origin


def private_output_path(value: str | None, filename: str, project_root: Path) -> Path:
    private_root = (project_root / "storage" / "app" / "security" / "reports").resolve()
    output = Path(value).expanduser().resolve() if value else private_root / filename
    public_root = (project_root / "public").resolve()
    if output == public_root or public_root in output.parents:
        raise SafetyError("Security reports must never be written under public/.")
    output.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        output.parent.chmod(0o700)
    except PermissionError:
        pass
    return output
