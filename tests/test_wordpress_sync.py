import importlib.util
import io
import json
import subprocess
import sys
import unittest
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "sync_wordpress.py"
SURFACES = ROOT / "wordpress" / "surfaces.json"


def load_module():
    spec = importlib.util.spec_from_file_location("sync_wordpress", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class WordPressSyncTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load_module()

    def test_extracts_only_rendered_post_article(self):
        source = (
            "<html><body><nav>skip</nav>"
            '<article class="post-content"><p>Hello <strong>world</strong>.</p>'
            '<img src="/proof.png"><br><pre><code>x = 1</code></pre></article>'
            "<footer>skip</footer></body></html>"
        )
        self.assertEqual(
            self.module.extract_article(source),
            '<p>Hello <strong>world</strong>.</p><img src="/proof.png"><br>'
            "<pre><code>x = 1</code></pre>",
        )

    def test_iframe_page_is_sandboxed_and_escaped(self):
        content = self.module.iframe_content(
            "Start <Here>",
            "Guided & safe",
            "https://example.com/start/?a=1&b=2",
        )
        self.assertIn("allow-scripts allow-same-origin", content)
        self.assertIn('referrerpolicy="no-referrer"', content)
        self.assertIn("Start &lt;Here&gt;", content)
        self.assertIn("a=1&amp;b=2", content)

    def test_absolutizes_real_attributes_without_rewriting_code_text(self):
        source = (
            '<p><a href="/work/">Work</a><img src="/proof.png"></p>'
            '<pre><code>&lt;a href="/example/"&gt;</code></pre>'
        )
        rewritten = self.module.absolutize_urls(
            source,
            "https://kody-w.github.io",
        )
        self.assertIn('href="https://kody-w.github.io/work/"', rewritten)
        self.assertIn('src="https://kody-w.github.io/proof.png"', rewritten)
        self.assertIn('&lt;a href="/example/"&gt;', rewritten)

    def test_local_post_uses_front_matter_date_for_permalink(self):
        post = self.module.local_post(
            ROOT / "_posts" / "2026-04-14-the-frame-sim-pump.md"
        )
        self.assertEqual(post.date, "2025-10-23T00:00:00")
        self.assertEqual(post.source_path, "/2025/10/23/the-frame-sim-pump/")

    def test_surface_manifest_is_explicit_and_public(self):
        payload = json.loads(SURFACES.read_text(encoding="utf-8"))
        self.assertEqual(payload["schema"], "kodyw-wordpress-surfaces/1.0")
        self.assertEqual(payload["source_base"], "https://kody-w.github.io")
        self.assertEqual(
            {page["slug"] for page in payload["pages"]},
            {"start", "work", "newsletter", "weekly-signal"},
        )

    def test_plan_needs_no_credentials_and_defaults_to_drafts(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--surface", "pages"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn("PLAN page /start/", result.stdout)
        self.assertNotIn("WP_APP_PASSWORD", result.stdout)
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('status = "draft"', source)
        self.assertNotIn("--publish", source)
        self.assertNotIn("WORDPRESS_SYNC_CONFIRM", source)

        workflow = (
            ROOT / ".github" / "workflows" / "wordpress-draft-sync.yml"
        ).read_text(encoding="utf-8")
        self.assertIn(
            "INPUT_SURFACE: ${{ github.event_name == 'schedule' && 'weekly' || inputs.surface }}",
            workflow,
        )
        self.assertIn('args=(--apply --surface "$surface")', workflow)
        self.assertIn("github.ref == 'refs/heads/master'", workflow)
        self.assertNotIn("update_published", workflow)
        self.assertIn('cron: "0 16 * * 1"', workflow)
        self.assertIn("WORDPRESS_WEEKLY_SYNC_ENABLED", workflow)
        self.assertIn("'weekly' || inputs.surface", workflow)

    def test_slug_save_updates_only_drafts(self):
        client = self.module.WordPressClient("https://example.com", "user", "pw")
        calls = []
        client.request = lambda method, path, payload=None: (
            calls.append((method, path, payload))
            or {"id": 7, "status": payload["status"]}
        )

        client.find = lambda kind, slug: [{"id": 3, "status": "publish"}]
        skipped = client.save("posts", "same-slug", {"status": "draft"})
        self.assertIn("skipped existing publish item 3", skipped)
        self.assertEqual(calls, [])

        client.find = lambda kind, slug: [{"id": 7, "status": "draft"}]
        updated = client.save("posts", "same-slug", {"status": "draft"})
        self.assertIn("updated draft item 7", updated)
        self.assertEqual(calls[-1][1], "posts/7")

        client.find = lambda kind, slug: []
        created = client.save("posts", "new-slug", {"status": "draft"})
        self.assertIn("created draft item 7", created)
        self.assertEqual(calls[-1][1], "posts")

        for status in ("future", "pending", "private"):
            calls.clear()
            client.find = lambda kind, slug, status=status: [
                {"id": 9, "status": status}
            ]
            skipped = client.save("posts", "same-slug", {"status": "draft"})
            self.assertIn(f"skipped existing {status} item 9", skipped)
            self.assertEqual(calls, [])

    def test_wordpress_client_requires_https(self):
        with self.assertRaisesRegex(self.module.SyncError, "absolute HTTPS"):
            self.module.WordPressClient("http://example.com", "user", "pw")

    def test_authenticated_redirects_are_refused(self):
        handler = self.module.NoRedirectHandler()
        request = urllib.request.Request("https://example.com/wp-json/wp/v2/posts")
        redirected = handler.redirect_request(
            request,
            None,
            302,
            "Found",
            {},
            "https://other.example/posts",
        )
        self.assertIsNone(redirected)

        client = self.module.WordPressClient("https://example.com", "user", "pw")

        redirect_error = urllib.error.HTTPError(
            "https://example.com/wp-json/wp/v2/users/me?context=edit",
            302,
            "Found",
            {"Location": "https://other.example/posts"},
            io.BytesIO(b""),
        )

        class RedirectingOpener:
            def open(self, request, timeout):
                raise redirect_error

        client.opener = RedirectingOpener()
        try:
            with self.assertRaisesRegex(self.module.SyncError, "redirect refused"):
                client.request("GET", "users/me?context=edit")
        finally:
            redirect_error.close()

    def test_weekly_payload_requires_deployed_schema(self):
        weekly = {
            "schema": "kodyw-weekly-signal/1.0",
            "title": "Weekly Signal",
            "slug": "weekly-signal-2026-w35",
            "content_html": "<p>Issue</p>",
            "excerpt": "Issue",
            "date": "2026-08-29T00:00:00",
            "date_gmt": "2026-08-29T00:00:00",
        }
        payload = self.module.parse_weekly_payload(weekly)
        self.assertEqual(payload["status"], "draft")
        with self.assertRaisesRegex(self.module.SyncError, "weekly signal schema"):
            self.module.parse_weekly_payload({"schema": "wrong"})
        with self.assertRaisesRegex(self.module.SyncError, "slug is invalid"):
            self.module.parse_weekly_payload({**weekly, "slug": "Bad Slug"})

    def test_weekly_payload_is_fetched_from_deployed_canary(self):
        weekly = {
            "schema": "kodyw-weekly-signal/1.0",
            "title": "Weekly Signal",
            "slug": "weekly-signal-2026-w35",
            "content_html": "<p>Issue</p>",
            "excerpt": "Issue",
            "date": "2026-08-29T00:00:00",
            "date_gmt": "2026-08-29T00:00:00",
        }
        calls = []
        original = self.module.fetch_text
        self.module.fetch_text = lambda url: (
            calls.append(url) or json.dumps(weekly)
        )
        try:
            payload = self.module.deployed_weekly_payload(
                {"weekly_manifest": "api/weekly-signal.json"},
                "https://kody-w.github.io",
            )
        finally:
            self.module.fetch_text = original
        self.assertEqual(
            calls,
            ["https://kody-w.github.io/api/weekly-signal.json"],
        )
        self.assertEqual(payload["slug"], weekly["slug"])


if __name__ == "__main__":
    unittest.main()
