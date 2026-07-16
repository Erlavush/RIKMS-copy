import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from security.upload_security_report import (
    UploadError,
    access_token,
    load_report,
    upload_report,
    upload_url,
    validate_object_name,
)


class FakeResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self, limit):
        return json.dumps({"generation": "12345"}).encode()


class SecurityReportUploadTest(unittest.TestCase):
    def test_upload_url_is_create_only_and_encodes_the_object_name(self) -> None:
        url = upload_url(
            "rikms-staging-security-private",
            "incoming/staging/abcdef123456/native-42.json",
        )

        self.assertIn("uploadType=media", url)
        self.assertIn("ifGenerationMatch=0", url)
        self.assertIn(
            "name=incoming%2Fstaging%2Fabcdef123456%2Fnative-42.json",
            url,
        )

    def test_object_name_is_locked_to_private_staging_convention(self) -> None:
        self.assertEqual(
            "incoming/staging/abcdef1/native-42.json",
            validate_object_name("incoming/staging/abcdef1/native-42.json"),
        )

        for invalid in (
            "processed/staging/abcdef1/native-42.json",
            "incoming/production/abcdef1/native-42.json",
            "incoming/staging/../../report.json",
        ):
            with self.subTest(invalid=invalid), self.assertRaises(UploadError):
                validate_object_name(invalid)

    def test_report_must_be_bounded_json_with_summary(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "report.json"
            source.write_text(json.dumps({"summary": {"findings": 0}}))
            self.assertEqual(
                {"summary": {"findings": 0}},
                json.loads(load_report(source)),
            )

            source.write_text("not-json")
            with self.assertRaises(UploadError):
                load_report(source)

    @patch("security.upload_security_report.subprocess.run")
    def test_access_token_comes_from_gcloud_without_logging_it(self, run) -> None:
        run.return_value = subprocess.CompletedProcess(
            args=["gcloud"],
            returncode=0,
            stdout="short-lived-token\n",
            stderr="",
        )

        self.assertEqual("short-lived-token", access_token("gcloud"))
        run.assert_called_once_with(
            ["gcloud", "auth", "print-access-token"],
            check=False,
            capture_output=True,
            text=True,
        )

    @patch("security.upload_security_report.urlopen")
    def test_upload_is_one_authenticated_post_without_a_metadata_get(self, opener) -> None:
        opener.return_value = FakeResponse()

        metadata = upload_report(
            "rikms-staging-security-private",
            "incoming/staging/abcdef123456/native-42.json",
            b'{"summary": {}}',
            "short-lived-token",
        )

        request = opener.call_args.args[0]
        self.assertEqual("POST", request.get_method())
        self.assertEqual("Bearer short-lived-token", request.get_header("Authorization"))
        self.assertEqual("application/json", request.get_header("Content-type"))
        self.assertEqual(b'{"summary": {}}', request.data)
        self.assertEqual({"generation": "12345"}, metadata)


if __name__ == "__main__":
    unittest.main()
