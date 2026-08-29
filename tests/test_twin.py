import hashlib
import importlib.util
import json
import re
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_twin.py"
CORPUS = ROOT / "api" / "twin-corpus.json"
PAGE = ROOT / "twin" / "index.html"
WORKER = ROOT / "twin" / "sw.js"
MANIFEST = ROOT / "twin" / "manifest.webmanifest"
PROMPT = ROOT / "twin" / "one-sentence-prompt.txt"
ENGINE = ROOT / "js" / "twin-engine.js"
STATE = ROOT / "js" / "twin-state.js"
CONTROLLER = ROOT / "js" / "twin-controller.js"
APP = ROOT / "js" / "twin-app.js"
DEFAULT_LAYOUT = ROOT / "_layouts" / "default.html"
LEGACY_TWIN = ROOT / "digital-twin" / "index.html"
WORKFLOW = ROOT / ".github" / "workflows" / "validate-posts.yml"

EXPECTED_SOURCE_HASH = (
    "9b14903ad91282be2e962e97697479b04e8416da52b7b219afa0422e391d3e29"
)
EXPECTED_LEGACY_TWIN_HASH = (
    "943c32d6539fd9486eb4a18b331c05d62849f3723d8a7bca724ea7de4a5f9ae8"
)
CANONICAL_PROMPT = (
    "Autonomously build {APP} as a local-first semantic app with named, "
    "inspectable actions instead of coordinate scraping, then send a separate "
    "blind, read-only buzzsaw adversary through every surface and keep "
    "rebuilding until a mutation-proven machine gate passes every acceptance "
    "invariant."
)


def source_paths():
    paths = list((ROOT / "_posts").glob("*.md"))
    paths.extend((ROOT / "_twin_posts").glob("*.md"))
    paths.append(ROOT / "api" / "works.json")
    return sorted(paths, key=lambda path: path.relative_to(ROOT).as_posix())


def source_manifest_hash():
    digest = hashlib.sha256()
    for path in source_paths():
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def load_builder():
    spec = importlib.util.spec_from_file_location("build_twin", BUILDER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TwinAcceptanceTest(unittest.TestCase):
    def test_baseline_inputs_are_unchanged(self):
        self.assertEqual(len(list((ROOT / "_posts").glob("*.md"))), 312)
        self.assertEqual(len(list((ROOT / "_twin_posts").glob("*.md"))), 116)
        works = json.loads((ROOT / "api" / "works.json").read_text())
        self.assertEqual(len(works["repos"]), 409)
        self.assertEqual(source_manifest_hash(), EXPECTED_SOURCE_HASH)
        self.assertEqual(
            hashlib.sha256(LEGACY_TWIN.read_bytes()).hexdigest(),
            EXPECTED_LEGACY_TWIN_HASH,
        )

    def test_required_twin_artifacts_exist(self):
        for path in (
            BUILDER,
            CORPUS,
            PAGE,
            WORKER,
            MANIFEST,
            PROMPT,
            ENGINE,
            STATE,
            CONTROLLER,
            APP,
        ):
            self.assertTrue(path.is_file(), path)

    def test_corpus_build_is_complete_and_byte_deterministic(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = Path(first_dir) / "corpus.json"
            second = Path(second_dir) / "corpus.json"
            subprocess.run(
                ["python3", str(BUILDER), "--output", str(first)],
                cwd=ROOT,
                check=True,
            )
            subprocess.run(
                ["python3", str(BUILDER), "--output", str(second)],
                cwd=ROOT,
                check=True,
            )
            self.assertEqual(first.read_bytes(), second.read_bytes())
            payload = json.loads(first.read_text())

        self.assertEqual(payload["schema"], "kodyw-public-twin/1.0")
        self.assertEqual(payload["normalizationVersion"], "plain-text/1")
        self.assertEqual(payload["sourceManifestSha256"], EXPECTED_SOURCE_HASH)
        self.assertEqual(payload["stats"]["total"], 837)
        self.assertEqual(payload["stats"]["post"], 312)
        self.assertEqual(payload["stats"]["field_note"], 116)
        self.assertEqual(payload["stats"]["work"], 409)
        self.assertEqual(len(payload["records"]), 837)
        self.assertEqual(len(payload["sourceManifest"]), 429)

        ids = [record["id"] for record in payload["records"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(ids, sorted(ids))
        required = {
            "id",
            "sourceType",
            "title",
            "date",
            "timeBasis",
            "author",
            "sourcePath",
            "sourceUrl",
            "sourceSha256",
            "text",
        }
        for record in payload["records"]:
            self.assertTrue(required.issubset(record))
            self.assertRegex(record["sourceSha256"], r"^[0-9a-f]{64}$")
            self.assertTrue(record["title"])
            self.assertTrue(record["text"])

        self.assertLessEqual(len(first.read_bytes()), 4 * 1024 * 1024)

    def test_committed_corpus_matches_builder(self):
        result = subprocess.run(
            ["python3", str(BUILDER), "--check"],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_corpus_builder_has_no_network_dependency(self):
        source = BUILDER.read_text()
        for token in ("urllib", "requests", "http.client", "socket.", "urlopen"):
            self.assertNotIn(token, source)
        module = load_builder()
        payload = module.build(ROOT)
        self.assertEqual(payload["stats"]["total"], 837)

    def test_public_page_declares_private_local_runtime(self):
        page = PAGE.read_text()
        self.assertIn("permalink: /twin/", page)
        self.assertIn("offline_shell: true", page)
        self.assertIn('id="twin-question"', page)
        self.assertIn('id="twin-results"', page)
        self.assertIn('id="twin-source-dialog"', page)
        self.assertIn('id="twin-live-status"', page)
        self.assertIn('aria-live="polite"', page)
        self.assertIn("/js/twin-engine.js", page)
        self.assertIn("/js/twin-state.js", page)
        self.assertIn("/js/twin-controller.js", page)
        self.assertIn("/js/twin-app.js", page)
        self.assertNotIn("innerHTML", page)

        layout = DEFAULT_LAYOUT.read_text()
        self.assertIn("page.offline_shell", layout)
        self.assertIn("page.content_security_policy", layout)
        self.assertIn('href="/twin/"', layout)

    def test_service_worker_and_manifest_are_scope_limited(self):
        worker = WORKER.read_text()
        self.assertIn("kody-twin-", worker)
        self.assertIn("/api/twin-corpus.json", worker)
        self.assertIn("/twin/one-sentence-prompt.txt", worker)
        self.assertNotIn("scope: '/'", worker)

        manifest = json.loads(MANIFEST.read_text())
        self.assertEqual(manifest["start_url"], "/twin/")
        self.assertEqual(manifest["scope"], "/twin/")
        self.assertIn(manifest["display"], {"standalone", "minimal-ui"})
        self.assertTrue(manifest["icons"])
        for icon in manifest["icons"]:
            self.assertTrue(icon["src"].startswith("/"))

    def test_application_source_rejects_unsafe_runtime_patterns(self):
        source = "\n".join(
            path.read_text() for path in (ENGINE, STATE, CONTROLLER, APP, WORKER)
        )
        for pattern in (
            r"\beval\s*\(",
            r"\bnew\s+Function\s*\(",
            r"\.innerHTML\s*=",
            r"\bsendBeacon\s*\(",
            r"\blocalStorage\.(?:password|token|secret)",
        ):
            self.assertIsNone(re.search(pattern, source), pattern)

    def test_one_sentence_product_studio_prompt_is_exact(self):
        prompt = PROMPT.read_text()
        self.assertEqual(prompt, CANONICAL_PROMPT)
        self.assertNotIn("\n", prompt)
        self.assertEqual(prompt.count("{APP}"), 1)
        for phrase in (
            "local-first",
            "semantic",
            "named",
            "inspectable",
            "coordinate scraping",
            "blind",
            "read-only",
            "buzzsaw",
            "mutation-proven",
            "machine gate",
        ):
            self.assertIn(phrase, prompt)
        self.assertEqual(prompt.count("."), 1)

    def test_shell_budget_and_ci_gate(self):
        shell_files = [PAGE, WORKER, MANIFEST, PROMPT, ENGINE, STATE, CONTROLLER, APP]
        shell_bytes = sum(path.stat().st_size for path in shell_files)
        self.assertLessEqual(shell_bytes, 350 * 1024)
        workflow = WORKFLOW.read_text()
        self.assertIn("'twin/**'", workflow)
        self.assertIn("'api/twin-corpus.json'", workflow)
        self.assertIn("python3 scripts/check_twin.py", workflow)


if __name__ == "__main__":
    unittest.main()
