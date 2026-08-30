import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "public-twin" / "tribunal" / "index.html"
API = ROOT / "api" / "frame-06-evidence-tribunal.json"
CORE = ROOT / "js" / "frame-06-evidence-tribunal.js"
APP = ROOT / "js" / "frame-06-evidence-tribunal-app.js"
STYLE = ROOT / "css" / "frame-06-evidence-tribunal.css"
BUILDER = ROOT / "scripts" / "build_frame_06_evidence_tribunal.js"


class Frame06EvidenceTribunalTest(unittest.TestCase):
    def test_owned_surface_paths_and_contract_exist(self):
        for path in (PAGE, API, CORE, APP, STYLE, BUILDER):
            self.assertTrue(path.is_file(), path)

        page = PAGE.read_text()
        self.assertIn("permalink: /public-twin/tribunal/", page)
        self.assertIn("data-semantic-action=\"tribunal.run\"", page)
        self.assertIn("/js/twin-engine.js", page)
        self.assertIn("/api/frame-06-evidence-tribunal.json", page)
        self.assertNotIn("innerHTML", page)

    def test_receipt_records_supported_local_first_hearing(self):
        receipt = json.loads(API.read_text())
        self.assertEqual(receipt["schema"], "kodyw-frame-06-receipt/1.0")
        self.assertEqual(receipt["frame"], "06")
        self.assertEqual(
            receipt["topic"],
            "Kody's local-first product philosophy",
        )
        self.assertEqual(
            receipt["question"],
            "What is the source of truth?",
        )
        self.assertEqual(
            receipt["result"]["status"],
            "supported-with-challenge",
        )
        for chamber in ("answer", "evolution", "challenge"):
            self.assertEqual(
                receipt["result"]["chambers"][chamber]["status"],
                "supported",
            )

    def test_receipt_builder_and_node_contract_are_current(self):
        for command in (
            ["node", str(BUILDER), "--check"],
            [
                "node",
                "--test",
                "tests/frame_06_evidence_tribunal.test.js",
            ],
        ):
            result = subprocess.run(
                command,
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(
                result.returncode,
                0,
                result.stdout + result.stderr,
            )


if __name__ == "__main__":
    unittest.main()
