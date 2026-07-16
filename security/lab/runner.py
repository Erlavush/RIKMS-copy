from __future__ import annotations

import json
import sys
import threading
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Callable

from security.safety import SafetyError

from .ai_metadata import run_ai_metadata_scan
from .config import LabConfig, SCANNERS
from .process import ProcessResult, SafeProcessRunner
from .reports import RunReport, RunStore, ToolResult, utc_now


CODE_TOOLS = ("phpunit", "larastan", "composer_audit", "npm_audit", "routes")
SELECTION_TOOLS = {
    "code": CODE_TOOLS,
    "passive": ("native",),
    "zap": ("zap",),
    "ai": ("ai_metadata",),
}


class SecurityLabRunner:
    def __init__(self, config: LabConfig) -> None:
        self.config = config
        self.store = RunStore(config.reports_root)
        self.processes = SafeProcessRunner(config.project_root)
        self._lock = threading.RLock()
        self._thread: threading.Thread | None = None

    @property
    def running(self) -> bool:
        with self._lock:
            return bool(self._thread and self._thread.is_alive())

    def snapshot(self) -> dict[str, Any]:
        latest = self.store.latest()
        return {
            "running": self.running,
            "target": self.config.target,
            "environment": self.config.environment,
            "mode": self.config.scan_mode,
            "revision": self.config.revision,
            "allowed_scanners": sorted(SCANNERS),
            "run": latest,
        }

    def start(self, selected: list[str]) -> tuple[bool, str]:
        normalized = list(dict.fromkeys(selected))
        if not normalized:
            return False, "Choose at least one scan group."
        unknown = set(normalized) - SCANNERS
        if unknown:
            return False, f"Unknown scan groups: {', '.join(sorted(unknown))}"
        with self._lock:
            if self._thread and self._thread.is_alive():
                return False, "A security run is already active."
            report = self._new_report(normalized)
            self._thread = threading.Thread(
                target=self._execute,
                args=(report,),
                daemon=True,
                name=f"rikms-security-{report.run_id}",
            )
            self._thread.start()
        return True, report.run_id

    def _new_report(self, selected: list[str]) -> RunReport:
        report = self.store.new(
            target=self.config.target,
            environment=self.config.environment,
            mode=self.config.scan_mode,
            revision=self.config.revision,
            selected=selected,
        )
        for group in selected:
            for tool in SELECTION_TOOLS[group]:
                category = {
                    "phpunit": "Tests",
                    "larastan": "SAST",
                    "composer_audit": "SCA",
                    "npm_audit": "SCA",
                    "routes": "Attack surface",
                    "native": "Web/API",
                    "zap": "DAST",
                    "ai_metadata": "AI",
                }[tool]
                report.tools[tool] = ToolResult(tool=tool, category=category)
        self.store.persist(report)
        return report

    def _execute(self, report: RunReport) -> None:
        report.status = "running"
        report.started_at = utc_now()
        self.store.persist(report)
        functions: dict[str, Callable[[], ToolResult]] = {
            "phpunit": self._phpunit,
            "larastan": self._larastan,
            "composer_audit": self._composer_audit,
            "npm_audit": self._npm_audit,
            "routes": self._routes,
            "native": self._native,
            "zap": self._zap,
            "ai_metadata": self._ai_metadata,
        }
        for tool in report.tools:
            report.tools[tool].status = "running"
            report.tools[tool].started_at = utc_now()
            report.tools[tool].summary = "Running"
            self.store.persist(report)
            try:
                report.tools[tool] = functions[tool]()
            except Exception as error:  # fail closed so one scanner cannot strand the dashboard
                report.tools[tool] = ToolResult(
                    tool=tool,
                    category=report.tools[tool].category,
                    status="failed",
                    summary="Scanner failed safely",
                    started_at=report.tools[tool].started_at,
                    completed_at=utc_now(),
                    errors=[f"{type(error).__name__}: {error}"],
                )
            self.store.persist(report)

        statuses = {item.status for item in report.tools.values()}
        if statuses <= {"passed", "skipped"}:
            report.status = "passed"
        elif "blocked" in statuses and statuses <= {"passed", "skipped", "blocked"}:
            report.status = "blocked"
        else:
            report.status = "failed"
        report.completed_at = utc_now()
        self.store.persist(report)

    def _process_tool(
        self,
        *,
        tool: str,
        category: str,
        arguments: list[str],
        timeout: int,
        success: str,
        parser: Callable[[ProcessResult], dict[str, Any]] | None = None,
        max_capture_chars: int = 24_000,
    ) -> ToolResult:
        started_at = utc_now()
        result = self.processes.run(
            arguments,
            timeout=timeout,
            environment={"CI": "true"},
            max_capture_chars=max_capture_chars,
        )
        metrics: dict[str, Any] = {}
        parse_error: str | None = None
        if parser and result.status != "unavailable":
            try:
                metrics = parser(result)
            except (ValueError, json.JSONDecodeError, ET.ParseError, OSError) as error:
                parse_error = f"Fresh scanner output could not be parsed: {error}"
        status = result.status
        errors = [item for item in (result.error, parse_error) if item]
        summary = success if status == "passed" and not parse_error else (
            result.error or f"Exited with status {result.exit_code}" if status != "passed" else parse_error or success
        )
        if parse_error and status == "passed":
            status = "failed"
        return ToolResult(
            tool=tool,
            category=category,
            status=status,
            summary=summary,
            started_at=started_at,
            completed_at=utc_now(),
            duration_ms=result.duration_ms,
            exit_code=result.exit_code,
            metrics=metrics,
            errors=errors,
        )

    @staticmethod
    def _unavailable(tool: str, category: str, summary: str) -> ToolResult:
        timestamp = utc_now()
        return ToolResult(
            tool=tool,
            category=category,
            status="unavailable",
            summary=summary,
            started_at=timestamp,
            completed_at=timestamp,
        )

    def _phpunit(self) -> ToolResult:
        if not (self.config.project_root / "vendor" / "autoload.php").is_file():
            return self._unavailable("phpunit", "Tests", "Composer dependencies are not installed in this worktree")
        output = self._current_tool_path("phpunit.xml")

        def parse(_: ProcessResult) -> dict[str, Any]:
            root = ET.parse(output).getroot()
            suites = [root] if root.tag == "testsuite" else root.findall("./testsuite")
            if not suites:
                raise ValueError("JUnit report has no test suite.")
            metrics: dict[str, Any] = {
                key: sum(int(suite.attrib.get(key, 0)) for suite in suites)
                for key in ("tests", "assertions", "failures", "errors", "skipped")
            }
            cases: list[dict[str, Any]] = []
            for case in root.iter("testcase"):
                status = "passed"
                if case.find("failure") is not None or case.find("error") is not None:
                    status = "failed"
                elif case.find("skipped") is not None:
                    status = "skipped"
                cases.append({
                    "class": case.attrib.get("class", "Application"),
                    "name": case.attrib.get("name", "Unnamed test"),
                    "time": float(case.attrib.get("time", 0) or 0),
                    "status": status,
                })
            metrics["test_cases"] = cases[:500]

            return metrics

        return self._process_tool(
            tool="phpunit",
            category="Tests",
            arguments=["php", "artisan", "test", f"--log-junit={output}"],
            timeout=1200,
            success="Laravel tests passed",
            parser=parse,
        )

    def _larastan(self) -> ToolResult:
        phpstan = self.config.project_root / "vendor" / "bin" / "phpstan"
        if not phpstan.is_file():
            return self._unavailable("larastan", "SAST", "Larastan is not installed in this worktree")

        def parse(result: ProcessResult) -> dict[str, Any]:
            payload = json.loads(result.stdout or "{}")
            totals = payload.get("totals", {}) if isinstance(payload, dict) else {}
            messages: list[dict[str, Any]] = []
            files = payload.get("files", {}) if isinstance(payload, dict) else {}
            if isinstance(files, dict):
                for filename, details in files.items():
                    for message in details.get("messages", []) if isinstance(details, dict) else []:
                        if isinstance(message, dict):
                            messages.append({
                                "file": str(filename),
                                "line": int(message.get("line", 0) or 0),
                                "message": str(message.get("message", "Static analysis observation")),
                            })
            return {
                "files_with_errors": int(totals.get("file_errors", 0)),
                "errors": int(totals.get("errors", 0)),
                "messages": messages[:200],
            }

        return self._process_tool(
            tool="larastan",
            category="SAST",
            arguments=["php", str(phpstan), "analyse", "--error-format=json", "--no-progress", "--memory-limit=1G"],
            timeout=1200,
            success="Larastan found no errors",
            parser=parse,
        )

    def _composer_audit(self) -> ToolResult:
        def parse(result: ProcessResult) -> dict[str, Any]:
            payload = json.loads(result.stdout or "{}")
            advisories = payload.get("advisories", {}) if isinstance(payload, dict) else {}
            abandoned = payload.get("abandoned", []) if isinstance(payload, dict) else []
            count = sum(len(items) for items in advisories.values()) if isinstance(advisories, dict) else 0
            items: list[dict[str, str]] = []
            if isinstance(advisories, dict):
                for package, package_advisories in advisories.items():
                    for advisory in package_advisories if isinstance(package_advisories, list) else []:
                        if isinstance(advisory, dict):
                            items.append({
                                "package": str(package),
                                "severity": str(advisory.get("severity", "unknown")),
                                "cve": str(advisory.get("cve", advisory.get("advisoryId", ""))),
                                "title": str(advisory.get("title", "Dependency advisory")),
                                "link": str(advisory.get("link", "")),
                            })
            return {
                "advisories": count,
                "abandoned": len(abandoned) if isinstance(abandoned, (list, dict)) else 0,
                "items": items[:100],
            }

        return self._process_tool(
            tool="composer_audit",
            category="SCA",
            arguments=["composer", "audit", "--locked", "--format=json", "--no-interaction"],
            timeout=300,
            success="Composer audit found no known advisories",
            parser=parse,
        )

    def _npm_audit(self) -> ToolResult:
        def parse(result: ProcessResult) -> dict[str, Any]:
            payload = json.loads(result.stdout or "{}")
            vulnerabilities = payload.get("metadata", {}).get("vulnerabilities", {})
            metrics = {key: int(value) for key, value in vulnerabilities.items()} if isinstance(vulnerabilities, dict) else {}
            items: list[dict[str, str]] = []
            packages = payload.get("vulnerabilities", {}) if isinstance(payload, dict) else {}
            if isinstance(packages, dict):
                for package, details in packages.items():
                    if not isinstance(details, dict):
                        continue
                    via = details.get("via", [])
                    advisory = next((item for item in via if isinstance(item, dict)), {}) if isinstance(via, list) else {}
                    items.append({
                        "package": str(package),
                        "severity": str(details.get("severity", advisory.get("severity", "unknown"))),
                        "cve": str(advisory.get("source", "")),
                        "title": str(advisory.get("title", "Dependency advisory")),
                        "link": str(advisory.get("url", "")),
                    })
            metrics["items"] = items[:100]

            return metrics

        return self._process_tool(
            tool="npm_audit",
            category="SCA",
            arguments=["npm", "audit", "--json"],
            timeout=300,
            success="npm audit found no known advisories",
            parser=parse,
        )

    def _routes(self) -> ToolResult:
        if not (self.config.project_root / "vendor" / "autoload.php").is_file():
            return self._unavailable("routes", "Attack surface", "Composer dependencies are not installed in this worktree")

        def parse(result: ProcessResult) -> dict[str, Any]:
            payload = json.loads(result.stdout or "[]")
            if not isinstance(payload, list):
                raise ValueError("Route inventory was not a list.")
            methods: dict[str, int] = {}
            for route in payload:
                method = str(route.get("method", "UNKNOWN")) if isinstance(route, dict) else "UNKNOWN"
                methods[method] = methods.get(method, 0) + 1
            return {"routes": len(payload), "methods": methods}

        return self._process_tool(
            tool="routes",
            category="Attack surface",
            arguments=["php", "artisan", "route:list", "--json"],
            timeout=180,
            success="Route inventory captured",
            parser=parse,
            max_capture_chars=256_000,
        )

    def _native(self) -> ToolResult:
        output = self._current_tool_path("native.json")
        started_at = utc_now()
        try:
            self.config.authorize_target()
        except SafetyError as error:
            return ToolResult(
                tool="native", category="Web/API", status="blocked", summary="Target policy refused the scan",
                started_at=started_at, completed_at=utc_now(), errors=[str(error)],
            )
        process = self.processes.run(
            [
                sys.executable,
                str(self.config.project_root / "security" / "rikms_security_scan.py"),
                f"--target={self.config.target}",
                f"--environment={self.config.environment}",
                f"--mode={self.config.scan_mode}",
                f"--revision={self.config.revision}",
                f"--output={output}",
            ],
            timeout=900,
        )
        process_message = (process.stderr or process.stdout).strip()[-1200:]
        if process.exit_code == 2:
            status = "blocked"
        elif process.exit_code == 3:
            status = "unavailable"
        elif output.is_file():
            status = "passed" if process.exit_code == 0 else "failed"
        else:
            status = process.status
        metrics: dict[str, Any] = {}
        findings: list[dict[str, Any]] = []
        errors = [item for item in (process.error, process_message or None) if item]
        if output.is_file():
            try:
                payload = json.loads(output.read_text(encoding="utf-8"))
                metrics = payload.get("summary", {})
                findings = payload.get("findings", [])
            except (OSError, json.JSONDecodeError) as error:
                status = "failed"
                errors.append(f"Fresh native report could not be parsed: {error}")
        summary = {
            "passed": "Native application boundaries passed",
            "blocked": "Target policy blocked the native assessment",
            "unavailable": "The authorized application target is unavailable",
        }.get(status, "Native boundary observations require review")
        if status == "passed" and findings:
            summary = f"Native assessment passed its High/Critical gate with {len(findings)} observation(s) for manual review"
        return ToolResult(
            tool="native", category="Web/API", status=status,
            summary=summary,
            started_at=started_at, completed_at=utc_now(), duration_ms=process.duration_ms,
            exit_code=process.exit_code, metrics=metrics, findings=findings, errors=errors,
        )

    def _zap(self) -> ToolResult:
        output = self._current_tool_path("zap.json")
        started_at = utc_now()
        try:
            self.config.authorize_target()
        except SafetyError as error:
            return ToolResult(
                tool="zap", category="DAST", status="blocked", summary="Target policy refused the ZAP scan",
                started_at=started_at, completed_at=utc_now(), errors=[str(error)],
            )
        process = self.processes.run(
            [
                sys.executable,
                str(self.config.project_root / "security" / "run_zap.py"),
                f"--target={self.config.target}",
                f"--mode={self.config.scan_mode}",
                f"--output={output}",
            ],
            timeout=1900,
        )
        process_message = (process.stderr or process.stdout).strip()[-1200:]
        if process.exit_code == 2 and "not found" in (process.stderr + process.stdout).lower():
            status = "unavailable"
        elif process.exit_code == 2:
            status = "blocked"
        else:
            status = process.status
        findings: list[dict[str, Any]] = []
        metrics: dict[str, Any] = {}
        errors = [item for item in (process.error, process_message or None) if item]
        if output.is_file():
            try:
                payload = json.loads(output.read_text(encoding="utf-8"))
                sites = payload.get("site", []) if isinstance(payload, dict) else []
                alerts = [alert for site in sites if isinstance(site, dict) for alert in site.get("alerts", [])]
                levels: dict[str, int] = {}
                for alert in alerts:
                    risk = str(alert.get("riskdesc", alert.get("risk", "Unknown"))).split()[0].lower()
                    levels[risk] = levels.get(risk, 0) + 1
                    findings.append({
                        "id": str(alert.get("pluginid", "ZAP")),
                        "severity": risk,
                        "title": str(alert.get("name", "ZAP observation")),
                        "observed": "Automated ZAP observation; manually reproduce before confirmation.",
                    })
                metrics = {"alerts": len(alerts), **levels}
            except (OSError, json.JSONDecodeError) as error:
                status = "failed"
                errors.append(f"Fresh ZAP report could not be parsed: {error}")
        summary = "ZAP assessment completed"
        if status != "passed":
            summary = "ZAP did not produce a passing assessment"
        elif findings:
            summary = f"ZAP completed with {len(findings)} automated observation(s) for manual review"
        return ToolResult(
            tool="zap", category="DAST", status=status,
            summary=summary,
            started_at=started_at, completed_at=utc_now(), duration_ms=process.duration_ms,
            exit_code=process.exit_code, metrics=metrics, findings=findings, errors=errors,
        )

    def _ai_metadata(self) -> ToolResult:
        return run_ai_metadata_scan(
            self.config.project_root / "security" / "fixtures" / "ai",
            self.config.ai_url,
            self.config.ai_model,
            self.config.ai_timeout,
        )

    def _current_tool_path(self, filename: str) -> Path:
        latest = self.store.latest()
        if not latest:
            raise RuntimeError("No active security run.")
        directory = self.config.reports_root / latest["run_id"]
        directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        return directory / filename
