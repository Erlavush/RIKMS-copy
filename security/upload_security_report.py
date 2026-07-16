#!/usr/bin/env python3
"""Create-only upload of a private RIKMS staging security report."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

MAX_REPORT_BYTES = 5 * 1024 * 1024
BUCKET_PATTERN = re.compile(r"[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]")
OBJECT_PATTERN = re.compile(
    r"incoming/staging/[a-fA-F0-9]{7,64}/[a-zA-Z0-9._-]+\.json"
)


class UploadError(RuntimeError):
    """Raised when report validation or upload fails safely."""


def validate_bucket(bucket: str) -> str:
    if not BUCKET_PATTERN.fullmatch(bucket):
        raise UploadError("The security report bucket name is invalid.")

    return bucket


def validate_object_name(object_name: str) -> str:
    if not OBJECT_PATTERN.fullmatch(object_name):
        raise UploadError(
            "The object name must use incoming/staging/<commit>/<report>.json."
        )

    return object_name


def load_report(source: Path) -> bytes:
    if not source.is_file():
        raise UploadError(f"Security report does not exist: {source}")

    size = source.stat().st_size
    if size == 0 or size > MAX_REPORT_BYTES:
        raise UploadError(
            f"Security report must be between 1 and {MAX_REPORT_BYTES} bytes."
        )

    payload = source.read_bytes()
    try:
        report = json.loads(payload)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise UploadError("Security report is not valid JSON.") from error

    if not isinstance(report, dict) or not isinstance(report.get("summary"), dict):
        raise UploadError("Security report is missing its summary object.")

    return payload


def access_token(gcloud_bin: str) -> str:
    try:
        completed = subprocess.run(
            [gcloud_bin, "auth", "print-access-token"],
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError as error:
        raise UploadError("The Google Cloud CLI could not be started.") from error

    if completed.returncode != 0:
        detail = completed.stderr.strip()
        suffix = f": {detail[-1000:]}" if detail else ""
        raise UploadError(f"Google Cloud could not issue an access token{suffix}")

    token = completed.stdout.strip()
    if not token:
        raise UploadError("Google Cloud returned an empty access token.")

    return token


def upload_url(bucket: str, object_name: str) -> str:
    query = urlencode(
        {
            "uploadType": "media",
            "name": object_name,
            "ifGenerationMatch": "0",
        }
    )
    return (
        "https://storage.googleapis.com/upload/storage/v1/b/"
        f"{quote(bucket, safe='')}/o?{query}"
    )


def upload_report(
    bucket: str,
    object_name: str,
    payload: bytes,
    token: str,
    timeout: int = 60,
) -> dict[str, Any]:
    request = Request(
        upload_url(validate_bucket(bucket), validate_object_name(object_name)),
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            status = response.status
            body = response.read(64 * 1024)
    except HTTPError as error:
        detail = error.read(2048).decode("utf-8", errors="replace").strip()
        suffix = f": {detail}" if detail else ""
        raise UploadError(f"Cloud Storage rejected the upload ({error.code}){suffix}") from error
    except URLError as error:
        raise UploadError(f"Cloud Storage could not be reached: {error.reason}") from error

    if status < 200 or status >= 300:
        raise UploadError(f"Cloud Storage returned unexpected HTTP status {status}.")

    try:
        metadata = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise UploadError("Cloud Storage returned invalid object metadata.") from error

    if not isinstance(metadata, dict):
        raise UploadError("Cloud Storage returned unexpected object metadata.")

    return metadata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--object", required=True, dest="object_name")
    parser.add_argument("--timeout", type=int, default=60)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        payload = load_report(args.source)
        metadata = upload_report(
            args.bucket,
            args.object_name,
            payload,
            access_token(os.environ.get("GCLOUD_BIN", "gcloud")),
            args.timeout,
        )
    except UploadError as error:
        print(f"Security report upload failed: {error}", file=sys.stderr)
        return 1

    generation = metadata.get("generation", "unknown")
    print(f"Created gs://{args.bucket}/{args.object_name} generation={generation}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
