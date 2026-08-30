import hashlib
import importlib.util
import json
import re
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_twin.py"
RELEASE_BUILDER = ROOT / "scripts" / "build_twin_release.py"
CORPUS = ROOT / "api" / "twin-corpus.json"
PAGE = ROOT / "public-twin" / "index.html"
TRIBUNAL_PAGE = ROOT / "public-twin" / "tribunal" / "index.html"
TRIBUNAL_RECEIPT = ROOT / "api" / "frame-06-evidence-tribunal.json"
TRIBUNAL_STYLE = ROOT / "css" / "frame-06-evidence-tribunal.css"
TRIBUNAL_CORE = ROOT / "js" / "frame-06-evidence-tribunal.js"
TRIBUNAL_APP = ROOT / "js" / "frame-06-evidence-tribunal-app.js"
WORKER = ROOT / "public-twin" / "sw.js"
MANIFEST = ROOT / "public-twin" / "manifest.webmanifest"
SHELL_MANIFEST = ROOT / "public-twin" / "shell-manifest.json"
ICON_192 = ROOT / "public-twin" / "icon-192.png"
ICON_512 = ROOT / "public-twin" / "icon-512.png"
PROMPT = ROOT / "public-twin" / "one-sentence-prompt.txt"
ENGINE = ROOT / "js" / "twin-engine.js"
STATE = ROOT / "js" / "twin-state.js"
CONTROLLER = ROOT / "js" / "twin-controller.js"
APP = ROOT / "js" / "twin-app.js"
DEFAULT_LAYOUT = ROOT / "_layouts" / "default.html"
LEGACY_TWIN = ROOT / "digital-twin" / "index.html"
WORKFLOW = ROOT / ".github" / "workflows" / "validate-posts.yml"
REFRESH_WORKFLOW = ROOT / ".github" / "workflows" / "refresh-works.yml"
STAGING_WORKFLOW = ROOT / ".github" / "workflows" / "staging-canary.yml"
GEMFILE = ROOT / "Gemfile"
GEMFILE_LOCK = ROOT / "Gemfile.lock"
BENCHMARK = ROOT / "scripts" / "benchmark_twin.js"

EXPECTED_LEGACY_TWIN_HASH = (
    "943c32d6539fd9486eb4a18b331c05d62849f3723d8a7bca724ea7de4a5f9ae8"
)
TWIN_SHELL_SOURCES = (
    "Gemfile",
    "Gemfile.lock",
    "_config.yml",
    "_data/design_constitution.yml",
    "_layouts/default.html",
    "public-twin/index.html",
    "public-twin/tribunal/index.html",
    "public-twin/manifest.webmanifest",
    "public-twin/icon-192.png",
    "public-twin/icon-512.png",
    "public-twin/one-sentence-prompt.txt",
    "css/main.css",
    "css/frame-06-evidence-tribunal.css",
    "js/theme.js",
    "js/twin-state.js",
    "js/twin-engine.js",
    "js/twin-controller.js",
    "js/twin-app.js",
    "js/frame-06-evidence-tribunal.js",
    "js/frame-06-evidence-tribunal-app.js",
    "api/frame-06-evidence-tribunal.json",
    "favicon.ico",
    "apple-touch-icon.png",
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


def source_counts():
    works = json.loads((ROOT / "api" / "works.json").read_text())
    posts = len(list((ROOT / "_posts").glob("*.md")))
    field_notes = len(list((ROOT / "_twin_posts").glob("*.md")))
    work = len(works["repos"])
    return {
        "post": posts,
        "field_note": field_notes,
        "work": work,
        "total": posts + field_notes + work,
        "manifest": posts + field_notes + 1,
    }


def twin_shell_hash():
    digest = hashlib.sha256()
    for relative in sorted(TWIN_SHELL_SOURCES):
        path = ROOT / relative
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def load_builder():
    spec = importlib.util.spec_from_file_location("build_twin", BUILDER)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def load_release_builder():
    spec = importlib.util.spec_from_file_location(
        "build_twin_release_test",
        RELEASE_BUILDER,
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class TwinAcceptanceTest(unittest.TestCase):
    def test_baseline_inputs_are_unchanged(self):
        counts = source_counts()
        self.assertGreaterEqual(counts["post"], 312)
        self.assertGreaterEqual(counts["field_note"], 116)
        self.assertGreaterEqual(counts["work"], 409)
        corpus = json.loads(CORPUS.read_text())
        self.assertEqual(
            corpus["sourceManifestSha256"],
            source_manifest_hash(),
        )
        self.assertEqual(
            hashlib.sha256(LEGACY_TWIN.read_bytes()).hexdigest(),
            EXPECTED_LEGACY_TWIN_HASH,
        )

    def test_required_twin_artifacts_exist(self):
        for path in (
            BUILDER,
            RELEASE_BUILDER,
            CORPUS,
            PAGE,
            TRIBUNAL_PAGE,
            TRIBUNAL_RECEIPT,
            TRIBUNAL_STYLE,
            TRIBUNAL_CORE,
            TRIBUNAL_APP,
            WORKER,
            MANIFEST,
            SHELL_MANIFEST,
            ICON_192,
            ICON_512,
            PROMPT,
            ENGINE,
            STATE,
            CONTROLLER,
            APP,
            TRIBUNAL_PAGE,
            TRIBUNAL_RECEIPT,
            TRIBUNAL_STYLE,
            TRIBUNAL_CORE,
            TRIBUNAL_APP,
            BENCHMARK,
            GEMFILE,
            GEMFILE_LOCK,
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
            corpus_bytes = first.read_bytes()
            payload = json.loads(corpus_bytes)

        self.assertEqual(payload["schema"], "kodyw-public-twin/1.0")
        self.assertEqual(payload["normalizationVersion"], "plain-text/1")
        counts = source_counts()
        self.assertEqual(payload["sourceManifestSha256"], source_manifest_hash())
        self.assertEqual(payload["stats"]["total"], counts["total"])
        self.assertEqual(payload["stats"]["post"], counts["post"])
        self.assertEqual(payload["stats"]["field_note"], counts["field_note"])
        self.assertEqual(payload["stats"]["work"], counts["work"])
        self.assertEqual(len(payload["records"]), counts["total"])
        self.assertEqual(len(payload["sourceManifest"]), counts["manifest"])

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

        self.assertLessEqual(len(corpus_bytes), 4 * 1024 * 1024)

    def test_committed_corpus_matches_builder(self):
        result = subprocess.run(
            ["python3", str(BUILDER), "--check"],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_complete_release_and_shell_manifest_are_current(self):
        result = subprocess.run(
            ["python3", str(RELEASE_BUILDER), "--check"],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

        module = load_release_builder()
        manifest = json.loads(SHELL_MANIFEST.read_text())
        receipt = json.loads(TRIBUNAL_RECEIPT.read_text())
        corpus = json.loads(CORPUS.read_text())
        self.assertEqual(
            manifest["releaseSha256"],
            module.release_binding_sha256({}, corpus),
        )
        self.assertEqual(
            receipt["twinRelease"]["releaseSha256"],
            manifest["releaseSha256"],
        )
        self.assertEqual(
            receipt["twinRelease"]["sourceManifestSha256"],
            corpus["sourceManifestSha256"],
        )
        self.assertEqual(
            receipt["twinRelease"]["corpusSha256"],
            corpus["corpusSha256"],
        )
        entries = {asset["url"]: asset for asset in manifest["assets"]}
        self.assertRegex(manifest["releaseSha256"], r"^[0-9a-f]{64}$")
        for url, relative, content_types in module.STATIC_ASSETS:
            self.assertIn(url, entries)
            self.assertEqual(
                entries[url]["sha256"],
                hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(),
            )
            self.assertEqual(entries[url]["contentTypes"], list(content_types))
        self.assertEqual(len(manifest["documents"]), 4)
        for document in manifest["documents"]:
            self.assertEqual(
                document["normalization"],
                "twin-html-sha256/1",
            )
            self.assertRegex(document["sha256"], r"^[0-9a-f]{64}$")

    def test_release_output_inventory_drives_refresh_staging(self):
        module = load_release_builder()
        expected = (
            "api/twin-corpus.json",
            "js/twin-app.js",
            "public-twin/index.html",
            "public-twin/tribunal/index.html",
            "api/frame-06-evidence-tribunal.json",
            "public-twin/shell-manifest.json",
            "public-twin/sw.js",
        )
        self.assertEqual(module.release_output_paths(), expected)
        result = subprocess.run(
            ["python3", str(RELEASE_BUILDER), "--list-outputs"],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(tuple(result.stdout.splitlines()), expected)
        workflow = REFRESH_WORKFLOW.read_text()
        self.assertIn(
            "python3 scripts/build_twin_release.py --list-outputs",
            workflow,
        )
        self.assertIn('"${twin_release_paths[@]}"', workflow)
        for path in expected:
            self.assertNotIn(f"\n            {path}\n", workflow)

    def test_workflows_use_locked_jekyll_before_release_checks(self):
        self.assertIn('gem "jekyll", "= 4.2.2"', GEMFILE.read_text())
        lock = GEMFILE_LOCK.read_text()
        self.assertIn("jekyll (4.2.2)", lock)
        self.assertIn("BUNDLED WITH\n   2.4.22", lock)
        for workflow_path in (
            WORKFLOW,
            STAGING_WORKFLOW,
            REFRESH_WORKFLOW,
        ):
            workflow = workflow_path.read_text().split("jobs:", 1)[1]
            ruby_setup = workflow.index("uses: ruby/setup-ruby@v1")
            first_release_use = min(
                index for index in (
                    workflow.find("scripts/build_twin_release.py"),
                    workflow.find("scripts/check_twin.py"),
                    workflow.find("bundle exec jekyll"),
                )
                if index >= 0
            )
            self.assertLess(ruby_setup, first_release_use, workflow_path)
            self.assertIn("bundler: '2.4.22'", workflow)
            self.assertIn("bundler-cache: true", workflow)
        self.assertIn(
            "bundle exec jekyll build --strict_front_matter",
            STAGING_WORKFLOW.read_text(),
        )
        self.assertIn(
            "bundle exec jekyll build --destination _site",
            WORKFLOW.read_text(),
        )
        refresh = REFRESH_WORKFLOW.read_text()
        self.assertIn(
            "bundle exec jekyll build --strict_front_matter --destination _site",
            refresh,
        )
        self.assertIn("actions/upload-pages-artifact@v3", refresh)
        self.assertIn("actions/deploy-pages@v4", refresh)
        self.assertNotIn("/pages/builds", refresh)
        self.assertEqual(
            load_release_builder().JEKYLL_COMMAND,
            ("bundle", "exec", "jekyll"),
        )
        for script_name in ("local-build.sh", "versioned-build.sh"):
            script = (ROOT / "scripts" / script_name).read_text()
            self.assertIn("bundle check", script)
            self.assertIn("bundle exec jekyll", script)
            self.assertIn("scripts/build_twin_release.py", script)

    def test_verified_documents_ignore_wall_clock_year(self):
        module = load_release_builder()
        first = module.render_twin_documents("2000-01-01T00:00:00Z")
        second = module.render_twin_documents("2050-01-01T00:00:00Z")
        self.assertEqual(first, second)
        for relative, rendered in first.items():
            digest = hashlib.sha256(
                module.canonical_document_bytes(rendered)
            ).hexdigest()
            manifest = json.loads(SHELL_MANIFEST.read_text())
            route = (
                "/public-twin/"
                if relative == "public-twin/index.html"
                else "/public-twin/tribunal/"
            )
            document = next(
                item for item in manifest["documents"]
                if item["url"] == route
            )
            self.assertEqual(document["sha256"], digest)
        self.assertNotIn("site.time", DEFAULT_LAYOUT.read_text())
        self.assertIn("release_year: 2026", (ROOT / "_config.yml").read_text())

    def test_corpus_builder_has_no_network_dependency(self):
        source = BUILDER.read_text()
        for token in ("urllib", "requests", "http.client", "socket.", "urlopen"):
            self.assertNotIn(token, source)
        module = load_builder()
        payload = module.build(ROOT)
        self.assertEqual(payload["stats"]["total"], source_counts()["total"])

    def test_public_page_declares_private_local_runtime(self):
        page = PAGE.read_text()
        corpus = json.loads(CORPUS.read_text())
        app = APP.read_text()
        self.assertIn("permalink: /public-twin/", page)
        self.assertIn("offline_shell: true", page)
        self.assertIn('id="twin-question"', page)
        self.assertIn('id="twin-results"', page)
        self.assertIn('id="twin-corpus-breakdown"', page)
        self.assertIn('aria-autocomplete="inline"', page)
        self.assertIn('id="twin-app-idea-help"', page)
        self.assertIn('data-autocomplete-example=', page)
        self.assertIn("Example verified citation", page)
        document_release = re.search(
            r'data-twin-document-sha256="([0-9a-f]{64})"',
            page,
        )
        self.assertIsNotNone(document_release)
        self.assertIn('id="twin-source-dialog"', page)
        self.assertIn('id="twin-live-status"', page)
        self.assertIn('aria-live="polite"', page)
        self.assertIn("/js/twin-engine.js", page)
        self.assertIn("/js/twin-state.js", page)
        self.assertIn("/js/twin-controller.js", page)
        self.assertIn("/js/twin-app.js", page)
        self.assertNotIn("innerHTML", page)
        self.assertIn(corpus["corpusSha256"], app)
        self.assertIn(corpus["sourceManifestSha256"], app)
        self.assertIn('updateViaCache: "none"', app)
        self.assertIn("/public-twin/__release-lease__", app)
        self.assertIn("function autocompleteAppIdea", app)
        self.assertIn("setSelectionRange", app)
        self.assertIn('inputType.indexOf("delete")', app)
        self.assertIn("activeAppIdeaCompletion", app)
        self.assertIn("event.isComposing", app)
        self.assertIn('event.key === "Escape"', app)

        layout = DEFAULT_LAYOUT.read_text()
        self.assertIn("page.offline_shell", layout)
        self.assertIn("page.content_security_policy", layout)
        self.assertIn('href="/public-twin/"', layout)

    def test_service_worker_and_manifest_are_scope_limited(self):
        worker = WORKER.read_text()
        corpus = json.loads(CORPUS.read_text())
        shell_manifest_bytes = SHELL_MANIFEST.read_bytes()
        shell_manifest = json.loads(shell_manifest_bytes)
        document_release = re.search(
            r'data-twin-document-sha256="([0-9a-f]{64})"',
            PAGE.read_text(),
        )
        self.assertIsNotNone(document_release)
        self.assertIn("kody-twin-", worker)
        self.assertIn("/api/twin-corpus.json", worker)
        self.assertIn(corpus["corpusSha256"], worker)
        self.assertIn(corpus["sourceManifestSha256"], worker)
        self.assertEqual(shell_manifest["schema"], "kodyw-twin-shell/1.0")
        self.assertEqual(shell_manifest["sourceSha256"], twin_shell_hash())
        required_document_text = set(
            shell_manifest["documents"][0]["requiredText"]
        )
        self.assertIn(
            f'data-twin-document-sha256="{document_release.group(1)}"',
            required_document_text,
        )
        for marker in (
            'id="public-twin"',
            'id="twin-question-form"',
            'id="twin-question"',
            'id="twin-results"',
            "/js/twin-app.js",
        ):
            self.assertIn(marker, required_document_text)
        tribunal_document_release = re.search(
            r'data-twin-document-sha256="([0-9a-f]{64})"',
            TRIBUNAL_PAGE.read_text(),
        )
        self.assertIsNotNone(tribunal_document_release)
        tribunal_document = next(
            document
            for document in shell_manifest["documents"]
            if document["url"] == "/public-twin/tribunal/"
        )
        tribunal_required = set(tribunal_document["requiredText"])
        for marker in (
            f'data-twin-document-sha256="{tribunal_document_release.group(1)}"',
            'id="evidence-tribunal"',
            'id="tribunal-form"',
            'id="tribunal-result-status"',
            "/js/frame-06-evidence-tribunal.js",
            "/js/frame-06-evidence-tribunal-app.js",
        ):
            self.assertIn(marker, tribunal_required)
        assets = {asset["url"]: asset for asset in shell_manifest["assets"]}
        for url, content_type in (
            ("/api/frame-06-evidence-tribunal.json", "application/json"),
            ("/css/frame-06-evidence-tribunal.css", "text/css"),
            ("/js/frame-06-evidence-tribunal.js", "text/javascript"),
            ("/js/frame-06-evidence-tribunal-app.js", "text/javascript"),
        ):
            self.assertIn(url, assets)
            self.assertIn(content_type, assets[url]["contentTypes"])
        self.assertIn(hashlib.sha256(shell_manifest_bytes).hexdigest(), worker)
        self.assertIn("/public-twin/shell-manifest.json", worker)
        self.assertIn(
            "/public-twin/one-sentence-prompt.txt",
            [asset["url"] for asset in shell_manifest["assets"]],
        )
        self.assertNotIn("kody-twin-shell-v1", worker)
        self.assertNotIn("kody-twin-corpus-v1", worker)
        self.assertNotIn("scope: '/'", worker)

        manifest = json.loads(MANIFEST.read_text())
        self.assertEqual(manifest["start_url"], "/public-twin/")
        self.assertEqual(manifest["scope"], "/public-twin/")
        self.assertIn(manifest["display"], {"standalone", "minimal-ui"})
        self.assertTrue(manifest["icons"])
        for icon in manifest["icons"]:
            self.assertTrue(icon["src"].startswith("/"))
        self.assertEqual(self.png_dimensions(ICON_192), (192, 192))
        self.assertEqual(self.png_dimensions(ICON_512), (512, 512))

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
        shell_files = [
            PAGE,
            WORKER,
            MANIFEST,
            PROMPT,
            ENGINE,
            STATE,
            CONTROLLER,
            APP,
            ROOT / "css" / "main.css",
            DEFAULT_LAYOUT,
        ]
        shell_bytes = sum(path.stat().st_size for path in shell_files)
        self.assertLessEqual(shell_bytes, 350 * 1024)
        workflow = WORKFLOW.read_text()
        self.assertIn("'public-twin/**'", workflow)
        self.assertIn("'api/twin-corpus.json'", workflow)
        self.assertIn("'_twin_posts/**'", workflow)
        self.assertIn("'api/works.json'", workflow)
        self.assertIn("python3 scripts/check_twin.py", workflow)
        self.assertIn("'scripts/build_twin_release.py'", workflow)
        gate = (ROOT / "scripts" / "check_twin.py").read_text()
        self.assertIn("scripts/benchmark_twin.js", gate)
        self.assertIn("scripts/build_twin_release.py", gate)

        refresh = REFRESH_WORKFLOW.read_text()
        self.assertIn("python3 scripts/build_twin_release.py", refresh)
        self.assertIn("python3 scripts/check_twin.py", refresh)
        self.assertIn("api/works.json", refresh)
        self.assertIn("--list-outputs", refresh)
        self.assertIn('"${twin_release_paths[@]}"', refresh)

    @staticmethod
    def png_dimensions(path):
        data = path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise AssertionError(f"{path} is not a PNG")
        return struct.unpack(">II", data[16:24])


if __name__ == "__main__":
    unittest.main()
