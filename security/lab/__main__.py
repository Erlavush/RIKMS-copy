from __future__ import annotations

import argparse
import sys
from pathlib import Path

from security.safety import SafetyError

from .config import LabConfig, SCANNERS
from .server import run_dashboard


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Jaylord's local-only RIKMS security workbench.")
    parser.add_argument("--target", default="http://127.0.0.1:8000", help="Explicitly authorized application origin")
    parser.add_argument("--environment", choices=["local", "staging", "production"], default="local")
    parser.add_argument("--active", action="store_true", help="Request active mode; environment safety gates still apply")
    parser.add_argument("--port", type=int, default=8888)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--run", action="append", choices=sorted(SCANNERS), default=[], help="Scan group to run after startup")
    parser.add_argument("--revision", default="")
    parser.add_argument("--ai-url", default="http://127.0.0.1:11434")
    parser.add_argument("--ai-model", default="qwen3.5:4b")
    parser.add_argument("--ai-timeout", type=int, default=120)
    args = parser.parse_args()
    try:
        config = LabConfig.create(
            project_root=PROJECT_ROOT,
            target=args.target,
            environment=args.environment,
            scan_mode="active" if args.active else "passive",
            revision=args.revision,
            port=args.port,
            open_browser=not args.no_browser,
            initial_scans=tuple(args.run),
            ai_url=args.ai_url,
            ai_model=args.ai_model,
            ai_timeout=args.ai_timeout,
        )
        run_dashboard(config)
    except SafetyError as error:
        print(f"Security lab refused to start: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
