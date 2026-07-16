#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from safety import SafetyError, TargetPolicy, private_output_path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def zap_executable() -> str:
    configured = os.getenv("ZAP_BIN", "").strip()
    candidates = [configured] if configured else []
    candidates.extend(["zap.sh", "zaproxy", "zap.bat"])
    if os.name == "nt":
        for root in filter(None, [os.getenv("ProgramFiles"), os.getenv("ProgramFiles(x86)")]):
            candidates.append(str(Path(root) / "ZAP" / "Zed Attack Proxy" / "zap.bat"))
    for candidate in candidates:
        if candidate and (Path(candidate).is_file() or shutil.which(candidate)):
            return candidate
    raise SafetyError("OWASP ZAP was not found. Set ZAP_BIN to the exact executable path.")


def automation_plan(target: str, report_dir: Path, report_name: str, active: bool) -> str:
    target_json = json.dumps(target)
    directory_json = json.dumps(str(report_dir))
    filename_json = json.dumps(report_name.removesuffix(".json"))
    active_job = "" if not active else """
  - type: activeScan
    parameters:
      context: RIKMS
      policy: Default Policy
"""
    return f"""env:
  contexts:
    - name: RIKMS
      urls:
        - {target_json}
      includePaths:
        - {json.dumps(target + ".*")}
  parameters:
    failOnError: true
    failOnWarning: false
    progressToStdout: true
jobs:
  - type: spider
    parameters:
      context: RIKMS
      maxDuration: 5
      maxDepth: 8
      parseComments: false
  - type: passiveScan-wait
    parameters:
      maxDuration: 10
{active_job}  - type: report
    parameters:
      template: traditional-json
      reportDir: {directory_json}
      reportFile: {filename_json}
      reportTitle: RIKMS authorized security assessment
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a bounded OWASP ZAP Automation Framework assessment.")
    parser.add_argument("--target", required=True)
    parser.add_argument("--mode", choices=["passive", "active"], default="passive")
    parser.add_argument("--output")
    parser.add_argument("--timeout", type=int, default=1800)
    args = parser.parse_args()

    timestamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    try:
        target = TargetPolicy.from_environment().authorize(args.target, args.mode)
        output = private_output_path(args.output, f"zap-{timestamp}.json", PROJECT_ROOT)
        binary = zap_executable()
        with tempfile.TemporaryDirectory(prefix="rikms-zap-") as temporary:
            plan_path = Path(temporary) / "automation.yaml"
            plan_path.write_text(
                automation_plan(target, output.parent, output.name, args.mode == "active"),
                encoding="utf-8",
            )
            plan_path.chmod(0o600)
            result = subprocess.run(
                [binary, "-cmd", "-autorun", str(plan_path)],
                check=False,
                capture_output=True,
                text=True,
                timeout=args.timeout,
            )
    except (SafetyError, OSError, subprocess.TimeoutExpired) as error:
        print(f"ZAP scan refused or failed safely: {error}", file=sys.stderr)
        return 2

    if result.returncode != 0:
        print("ZAP returned a non-zero exit status; no prior report will be reused.", file=sys.stderr)
        return result.returncode or 2
    if not output.is_file() or output.stat().st_size == 0:
        print("ZAP completed without producing a fresh report.", file=sys.stderr)
        return 2
    output.chmod(0o600)
    print(f"ZAP report written privately to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
