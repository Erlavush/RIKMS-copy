import http.client
import os
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

from security.lab.ai_metadata import REQUIRED_FIELDS, run_ai_metadata_scan, validate_metadata
from security.lab.config import LabConfig, available_port
from security.lab.process import SafeProcessRunner
from security.lab.reports import RunStore, sanitize
from security.lab.server import _handler_factory
from security.lab.ui import original_css, original_page
from security.safety import SafetyError


def valid_metadata() -> dict:
    return {
        "title": "Safe title",
        "abstract": "Supported abstract",
        "methodology": "Method",
        "review_of_related_literature": "",
        "theoretical_framework": "",
        "results_and_discussion": "Results",
        "keywords": ["security"],
        "authors": ["Test Author"],
        "doi": "",
        "category": "Research",
        "executive_summary": "Summary",
        "recommendations": [],
        "suggested_sdgs": [{"number": 9, "reason": "Supported", "confidence": 0.7}],
        "overall_confidence": 0.8,
        "evidence_pages": [1],
    }


class FakeResponse:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self, limit: int) -> bytes:
        return json.dumps(self.payload).encode("utf-8")


class FakeRunner:
    def __init__(self) -> None:
        self.selected = None

    def snapshot(self):
        return {"running": False, "run": None}

    def start(self, selected):
        self.selected = selected
        return True, "test-run"


class SecurityLabTest(unittest.TestCase):
    def test_jaylord_original_theme_and_spider_are_the_served_visual_contract(self) -> None:
        page = original_page("unit-token")
        css = original_css()

        self.assertIn("RIKMS Verification & Security", page)
        self.assertIn('class="cube abdomen"', page)
        self.assertIn('class="cube thorax"', page)
        self.assertIn('class="cube head"', page)
        self.assertIn("--bg-primary: #090a0f", css)
        self.assertIn("@keyframes radar-sweep-green", css)
        self.assertIn("src=\"/dashboard.js\"", page)
        self.assertNotIn("cdn.jsdelivr.net", page)
        self.assertNotIn("fonts.googleapis.com", page)
        self.assertNotIn("onclick=", page)
        self.assertNotIn("oninput=", page)

    def test_procedural_gait_keeps_eight_rigid_minecraft_legs_and_reduced_motion(self) -> None:
        project_root = Path(__file__).resolve().parents[2]
        page = original_page("unit-token")
        css = original_css()
        javascript = (project_root / "security" / "lab" / "dashboard" / "dashboard.js").read_text(
            encoding="utf-8"
        )

        self.assertEqual(8, page.count('class="leg '))
        self.assertEqual(8, page.count('class="cube leg-box"'))
        self.assertIn(".spider-viewport.procedural-spider .leg", css)
        self.assertIn("prefers-reduced-motion: reduce", css)
        self.assertIn("const minecraftLegs = [", javascript)
        self.assertIn('{ selector: ".leg.l1", side: -1, phase: 0', javascript)
        self.assertIn('{ selector: ".leg.r1", side: 1, phase: Math.PI', javascript)
        self.assertIn("Math.exp(-response * deltaSeconds)", javascript)
        self.assertIn('viewport.dataset.gait = "idle"', javascript)
        self.assertIn("window.requestAnimationFrame(animate)", javascript)
        self.assertIn('document.addEventListener("visibilitychange"', javascript)
        self.assertNotIn('procedural-spider[data-gait="crawl"] .mc-spider', css)

    def test_dashboard_and_ai_endpoints_are_loopback_only(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaises(SafetyError):
                LabConfig.create(project_root=root, host="0.0.0.0")
            with self.assertRaises(SafetyError):
                LabConfig.create(project_root=root, ai_url="https://ollama.example.test")

    def test_sanitizer_redacts_secret_fields_and_bearer_values(self) -> None:
        payload = sanitize({
            "password": "do-not-store",
            "nested": {"authorization": "Bearer secret-value", "message": "Authorization: Bearer abc.def"},
        })
        self.assertEqual("[REDACTED]", payload["password"])
        self.assertEqual("[REDACTED]", payload["nested"]["authorization"])
        self.assertNotIn("abc.def", payload["nested"]["message"])

    def test_private_store_writes_only_sanitized_run_report(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            store = RunStore(Path(temporary))
            report = store.new(
                target="http://127.0.0.1:8000",
                environment="local",
                mode="passive",
                revision="abc1234",
                selected=["code"],
            )
            report.tools = {}
            store.persist(report)
            persisted = json.loads((Path(temporary) / report.run_id / "run.json").read_text(encoding="utf-8"))
            self.assertEqual("rikms-local-security-lab-v1", persisted["schema"])
            self.assertEqual("abc1234", persisted["revision"])

    def test_process_runner_uses_argument_arrays_and_reports_missing_tools(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            runner = SafeProcessRunner(Path(temporary))
            result = runner.run([sys.executable, "-c", "print('safe-array')"], timeout=5)
            self.assertEqual("passed", result.status)
            self.assertIn("safe-array", result.stdout)
            large = runner.run(
                [sys.executable, "-c", "import sys; sys.stdout.write('x' * 30000)"],
                timeout=5,
                max_capture_chars=40_000,
            )
            self.assertEqual(30_000, len(large.stdout))
            missing = runner.run(["rikms-tool-that-does-not-exist", "--version"])
            self.assertEqual("unavailable", missing.status)

    def test_native_cli_distinguishes_policy_block_from_unavailable_target(self) -> None:
        project_root = Path(__file__).resolve().parents[2]
        runner = SafeProcessRunner(project_root)
        with patch.dict(os.environ, {"SECURITY_ALLOWED_TARGETS": "http://127.0.0.1:1"}, clear=False):
            unavailable = runner.run([
                sys.executable,
                str(project_root / "security" / "rikms_security_scan.py"),
                "--target=http://127.0.0.1:1",
                "--environment=local",
                "--mode=passive",
            ], timeout=10)
        self.assertEqual(3, unavailable.exit_code)
        self.assertIn("unavailable", unavailable.stderr.lower())

        with patch.dict(os.environ, {"SECURITY_ALLOWED_TARGETS": "http://127.0.0.1:1"}, clear=False):
            blocked = runner.run([
                sys.executable,
                str(project_root / "security" / "rikms_security_scan.py"),
                "--target=https://unauthorized.example.test",
                "--environment=staging",
                "--mode=passive",
            ], timeout=10)
        self.assertEqual(2, blocked.exit_code)
        self.assertIn("target policy", blocked.stderr.lower())

    def test_metadata_validator_rejects_extra_fields_and_invalid_ranges(self) -> None:
        metadata = valid_metadata()
        self.assertEqual([], validate_metadata(metadata))
        metadata["publish_now"] = True
        metadata["overall_confidence"] = 12
        errors = " ".join(validate_metadata(metadata))
        self.assertIn("Unsupported fields", errors)
        self.assertIn("between 0 and 1", errors)
        self.assertEqual(set(REQUIRED_FIELDS) | {"publish_now"}, set(metadata))

    @patch("security.lab.ai_metadata.urllib.request.urlopen")
    def test_local_ai_scan_validates_synthetic_fixture_without_persisting_output(self, opener) -> None:
        metadata = valid_metadata()
        opener.side_effect = [
            FakeResponse({"models": [{"name": "qwen3.5:4b"}]}),
            FakeResponse({
                "response": json.dumps(metadata),
                "prompt_eval_count": 100,
                "eval_count": 50,
            }),
        ]
        with tempfile.TemporaryDirectory() as temporary:
            fixtures = Path(temporary)
            (fixtures / "clean.json").write_text(json.dumps({
                "id": "TEST-001",
                "name": "Synthetic clean fixture",
                "category": "metadata-integrity",
                "document_text": "Title: Safe title\nAuthor: Test Author",
                "expected": {"title": "Safe title", "authors": ["Test Author"], "maximum_page": 1},
            }), encoding="utf-8")
            result = run_ai_metadata_scan(fixtures, "http://127.0.0.1:11434", "qwen3.5:4b", 10)
        self.assertEqual("passed", result.status)
        self.assertEqual(1, result.metrics["passed"])
        self.assertEqual([], result.findings)
        self.assertNotIn("Supported abstract", json.dumps(result.public()))

    @patch("security.lab.ai_metadata.urllib.request.urlopen")
    def test_unreachable_ollama_is_unavailable_not_passed(self, opener) -> None:
        opener.side_effect = urllib.error.URLError("connection refused")
        with tempfile.TemporaryDirectory() as temporary:
            fixtures = Path(temporary)
            (fixtures / "fixture.json").write_text(json.dumps({
                "id": "TEST-002", "name": "Unavailable", "category": "metadata-integrity", "document_text": "Synthetic"
            }), encoding="utf-8")
            result = run_ai_metadata_scan(fixtures, "http://127.0.0.1:11434", "qwen3.5:4b", 10)
        self.assertEqual("unavailable", result.status)
        self.assertNotEqual("passed", result.status)

    @patch("security.lab.ai_metadata.urllib.request.urlopen")
    def test_missing_local_model_is_unavailable_without_generation_request(self, opener) -> None:
        opener.return_value = FakeResponse({"models": []})
        with tempfile.TemporaryDirectory() as temporary:
            fixtures = Path(temporary)
            (fixtures / "fixture.json").write_text(json.dumps({
                "id": "TEST-003", "name": "Missing model", "category": "metadata-integrity", "document_text": "Synthetic"
            }), encoding="utf-8")
            result = run_ai_metadata_scan(fixtures, "http://127.0.0.1:11434", "qwen3.5:4b", 10)
        self.assertEqual("unavailable", result.status)
        self.assertIn("not installed", result.summary)
        opener.assert_called_once()

    def test_dashboard_refuses_wrong_host_and_requires_local_run_token(self) -> None:
        assets = Path(__file__).resolve().parents[1] / "lab" / "dashboard"
        runner = FakeRunner()
        port = available_port("127.0.0.1", 18980, attempts=100)
        origin = f"http://127.0.0.1:{port}"
        server = __import__("http.server").server.ThreadingHTTPServer(
            ("127.0.0.1", port), _handler_factory(runner, assets, "unit-token", origin)
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            connection.putrequest("GET", "/", skip_host=True)
            connection.putheader("Host", "malicious.example")
            connection.endheaders()
            self.assertEqual(403, connection.getresponse().status)
            connection.close()

            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            connection.request(
                "POST", "/api/run", body=json.dumps({"selected": ["code"]}),
                headers={"Content-Type": "application/json", "Origin": origin},
            )
            self.assertEqual(403, connection.getresponse().status)
            connection.close()

            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            connection.request(
                "POST", "/api/run", body=json.dumps({"selected": ["code"]}),
                headers={"Content-Type": "application/json", "Origin": origin, "X-RIKMS-Lab-Token": "unit-token"},
            )
            self.assertEqual(202, connection.getresponse().status)
            self.assertEqual(["code"], runner.selected)
            connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)


if __name__ == "__main__":
    unittest.main()
