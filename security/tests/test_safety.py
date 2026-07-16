import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from security.safety import SafetyError, TargetPolicy, normalized_origin, private_output_path


class TargetPolicyTest(unittest.TestCase):
    def test_normalizes_default_ports(self) -> None:
        self.assertEqual("https://rikms.v3ra.net", normalized_origin("https://RIKMS.v3ra.net:443/path"))

    def test_normalizes_ipv6_loopback_with_brackets(self) -> None:
        self.assertEqual("http://[::1]:8000", normalized_origin("http://[::1]:8000/path"))

    def test_rejects_invalid_port(self) -> None:
        with self.assertRaises(SafetyError):
            normalized_origin("https://example.test:not-a-port")

    def test_rejects_unlisted_target(self) -> None:
        with patch.dict(os.environ, {"SECURITY_ALLOWED_TARGETS": "http://127.0.0.1:8000"}, clear=False):
            with self.assertRaises(SafetyError):
                TargetPolicy.from_environment().authorize("https://example.com", "passive")

    def test_requires_explicit_production_active_approval(self) -> None:
        environment = {
            "SECURITY_ALLOWED_TARGETS": "https://rikms.v3ra.net",
            "SECURITY_PRODUCTION_HOST": "rikms.v3ra.net",
            "SECURITY_ACTIVE_SCAN_ENABLED": "true",
            "RIKMS_PRODUCTION_ACTIVE_APPROVED": "false",
            "RIKMS_PENTEST_CHANGE_ID": "",
        }
        with patch.dict(os.environ, environment, clear=False):
            with self.assertRaises(SafetyError):
                TargetPolicy.from_environment().authorize("https://rikms.v3ra.net", "active")

    def test_refuses_public_report_path(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "public").mkdir()
            with self.assertRaises(SafetyError):
                private_output_path(str(root / "public" / "report.json"), "unused.json", root)


if __name__ == "__main__":
    unittest.main()
