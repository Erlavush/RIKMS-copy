from __future__ import annotations

import os
import shutil
import signal
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Sequence

from .reports import sanitize


MAX_CAPTURE_CHARS = 24_000
MAX_CONFIGURED_CAPTURE_CHARS = 512_000


@dataclass(frozen=True)
class ProcessResult:
    status: str
    command: str
    exit_code: int | None
    duration_ms: int
    stdout: str
    stderr: str
    error: str | None = None


def _display_command(arguments: Sequence[str]) -> str:
    return " ".join(Path(item).name if index == 0 else item for index, item in enumerate(arguments))


class SafeProcessRunner:
    def __init__(self, project_root: Path) -> None:
        self.project_root = project_root.resolve()

    def run(
        self,
        arguments: Sequence[str],
        *,
        timeout: int = 900,
        environment: Mapping[str, str] | None = None,
        max_capture_chars: int = MAX_CAPTURE_CHARS,
    ) -> ProcessResult:
        if not arguments or not all(isinstance(item, str) and item and "\x00" not in item for item in arguments):
            raise ValueError("Process arguments must be a non-empty string array.")
        executable = arguments[0]
        if not Path(executable).is_file() and shutil.which(executable) is None:
            return ProcessResult(
                status="unavailable",
                command=_display_command(arguments),
                exit_code=None,
                duration_ms=0,
                stdout="",
                stderr="",
                error=f"Executable not found: {Path(executable).name}",
            )

        child_environment = os.environ.copy()
        child_environment.update(environment or {})
        capture_limit = max(1_024, min(max_capture_chars, MAX_CONFIGURED_CAPTURE_CHARS))
        options: dict[str, object] = {}
        if os.name == "nt":
            options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            options["start_new_session"] = True
        started = time.monotonic()
        process: subprocess.Popen[str] | None = None
        stdout_tail = [""]
        stderr_tail = [""]
        readers: list[threading.Thread] = []

        def drain(stream, destination: list[str]) -> None:
            try:
                while True:
                    chunk = stream.read(4096)
                    if not chunk:
                        break
                    destination[0] = (destination[0] + chunk)[-capture_limit:]
            finally:
                stream.close()

        try:
            process = subprocess.Popen(
                list(arguments),
                cwd=self.project_root,
                env=child_environment,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=False,
                **options,
            )
            if process.stdout is None or process.stderr is None:
                raise OSError("Scanner output pipes were not created.")
            readers = [
                threading.Thread(target=drain, args=(process.stdout, stdout_tail), daemon=True),
                threading.Thread(target=drain, args=(process.stderr, stderr_tail), daemon=True),
            ]
            for reader in readers:
                reader.start()
            process.wait(timeout=max(1, timeout))
        except subprocess.TimeoutExpired:
            if process is not None:
                if os.name == "nt":
                    process.kill()
                else:
                    try:
                        os.killpg(process.pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    if os.name != "nt":
                        try:
                            os.killpg(process.pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                    process.kill()
                    process.wait(timeout=3)
            for reader in readers:
                reader.join(timeout=3)
            duration = round((time.monotonic() - started) * 1000)
            return ProcessResult(
                status="failed",
                command=_display_command(arguments),
                exit_code=None,
                duration_ms=duration,
                stdout=str(sanitize(stdout_tail[0])),
                stderr=str(sanitize(stderr_tail[0])),
                error=f"Timed out after {timeout} seconds.",
            )
        except OSError as error:
            duration = round((time.monotonic() - started) * 1000)
            return ProcessResult(
                status="unavailable",
                command=_display_command(arguments),
                exit_code=None,
                duration_ms=duration,
                stdout="",
                stderr="",
                error=str(error),
            )

        for reader in readers:
            reader.join(timeout=3)
        duration = round((time.monotonic() - started) * 1000)
        return ProcessResult(
            status="passed" if process.returncode == 0 else "failed",
            command=_display_command(arguments),
            exit_code=process.returncode,
            duration_ms=duration,
            stdout=str(sanitize(stdout_tail[0])),
            stderr=str(sanitize(stderr_tail[0])),
        )
