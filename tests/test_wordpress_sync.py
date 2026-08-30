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
PLUGIN = ROOT / "wordpress" / "kodyw-draft-sync.php"


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

    def test_page_projection_is_static_and_escaped(self):
        content = self.module.linked_page_content(
            "Start <Here>",
            "Guided & safe",
            "https://example.com/start/?a=1&b=2",
        )
        self.assertNotIn("<iframe", content)
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
        self.assertIn("workflow_run:", workflow)
        self.assertIn("github.event.workflow_run.event == 'schedule'", workflow)
        self.assertIn(
            "INPUT_SURFACE: ${{ github.event_name == 'workflow_run' && 'weekly' || inputs.surface }}",
            workflow,
        )
        self.assertIn('args=(--apply --surface "$surface")', workflow)
        self.assertIn("github.ref == 'refs/heads/master'", workflow)
        self.assertNotIn("update_published", workflow)
        self.assertNotIn("cron:", workflow)
        self.assertIn("WORDPRESS_WEEKLY_SYNC_ENABLED", workflow)
        self.assertIn("--expected-as-of", workflow)
        self.assertIn("--wait-seconds 1200", workflow)
        self.assertIn("github.event.workflow_run.created_at", workflow)
        self.assertIn("'weekly' || inputs.surface", workflow)

    def test_slug_save_uses_atomic_draft_endpoint(self):
        client = self.module.WordPressClient("https://example.com", "user", "pw")
        calls = []
        responses = iter(
            (
                {
                    "schema": "kodyw-draft-sync/1.0",
                    "created": False,
                    "id": 3,
                    "status": "publish",
                    "slug": "same-slug",
                },
                {
                    "schema": "kodyw-draft-sync/1.0",
                    "created": False,
                    "id": 7,
                    "status": "draft",
                    "slug": "same-slug",
                },
                {
                    "schema": "kodyw-draft-sync/1.0",
                    "created": True,
                    "id": 9,
                    "status": "draft",
                    "slug": "new-slug",
                },
            )
        )

        def request(method, path, payload=None):
            calls.append((method, path, payload))
            return next(responses)

        client.request = request
        skipped = client.save(
            "posts",
            "same-slug",
            {"slug": "same-slug", "status": "draft"},
        )
        self.assertIn("skipped existing publish item 3", skipped)

        skipped = client.save(
            "posts",
            "same-slug",
            {"slug": "same-slug", "status": "draft"},
        )
        self.assertIn("skipped existing draft item 7", skipped)

        created = client.save(
            "posts",
            "new-slug",
            {"slug": "new-slug", "status": "draft"},
        )
        self.assertIn("created draft item 9", created)
        self.assertTrue(
            all(path == "kodyw/v1/drafts" for _, path, _ in calls)
        )
        self.assertTrue(all(payload["kind"] == "post" for _, _, payload in calls))

    def test_created_slug_must_match_requested_slug(self):
        client = self.module.WordPressClient("https://example.com", "user", "pw")
        client.request = lambda method, path, payload=None: {
            "schema": "kodyw-draft-sync/1.0",
            "created": True,
            "id": 7,
            "status": "draft",
            "slug": payload["slug"] + "-2",
        }
        with self.assertRaisesRegex(self.module.SyncError, "colliding slug"):
            client.save(
                "posts",
                "weekly-signal-2026-w34",
                {"slug": "weekly-signal-2026-w34", "status": "draft"},
            )

    def test_wordpress_client_requires_https(self):
        with self.assertRaisesRegex(self.module.SyncError, "absolute HTTPS"):
            self.module.WordPressClient("http://example.com", "user", "pw")

    def test_wordpress_plugin_attests_draft_only_role(self):
        client = self.module.WordPressClient("https://example.com", "user", "pw")
        client.request = lambda method, path, payload=None: {
            "schema": "kodyw-draft-sync/1.0",
            "id": 7,
            "name": "Draft Sync",
            "role": "kodyw_draft_sync",
            "safe": True,
        }
        self.assertEqual(client.whoami()["id"], 7)

        client.request = lambda method, path, payload=None: {
            "schema": "kodyw-draft-sync/1.0",
            "id": 8,
            "role": "administrator",
            "safe": False,
        }
        with self.assertRaisesRegex(self.module.SyncError, "kodyw_draft_sync"):
            client.whoami()

    def test_companion_plugin_is_atomic_and_draft_only(self):
        source = PLUGIN.read_text(encoding="utf-8")
        self.assertIn("SELECT GET_LOCK", source)
        self.assertIn("SELECT RELEASE_LOCK", source)
        self.assertIn("'post_status' => 'draft'", source)
        self.assertIn("wp_kses_post($content)", source)
        self.assertIn("kodyw_draft_sync_account_is_safe", source)
        self.assertIn("_wp_desired_post_slug", source)
        self.assertNotIn("'publish_posts' => true", source)
        self.assertNotIn("post_status IN", source)

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
            "https://example.com/wp-json/kodyw/v1/status",
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
                client.request("GET", "kodyw/v1/status")
        finally:
            redirect_error.close()

    def test_weekly_payload_requires_deployed_schema(self):
        weekly = {
            "schema": "kodyw-weekly-signal/1.0",
            "as_of": "2026-08-23",
            "issue_id": "2026-W34",
            "week_start": "2026-08-17",
            "title": "Weekly Signal",
            "slug": "weekly-signal-2026-w34",
            "content_html": "<p>Issue</p>",
            "excerpt": "Issue",
            "date": "2026-08-23T00:00:00",
            "date_gmt": "2026-08-23T00:00:00",
        }
        payload = self.module.parse_weekly_payload(
            weekly,
            today=self.module.date(2026, 8, 29),
        )
        self.assertEqual(payload["status"], "draft")
        with self.assertRaisesRegex(self.module.SyncError, "weekly signal schema"):
            self.module.parse_weekly_payload({"schema": "wrong"})
        with self.assertRaisesRegex(self.module.SyncError, "slug is invalid"):
            self.module.parse_weekly_payload(
                {**weekly, "slug": "Bad Slug"},
                today=self.module.date(2026, 8, 29),
            )
        with self.assertRaisesRegex(self.module.SyncError, "must be a Sunday"):
            self.module.parse_weekly_payload(
                {
                    **weekly,
                    "as_of": "2026-08-22",
                    "date": "2026-08-22T00:00:00",
                    "date_gmt": "2026-08-22T00:00:00",
                },
                today=self.module.date(2026, 8, 29),
            )
        with self.assertRaisesRegex(self.module.SyncError, "is stale"):
            self.module.parse_weekly_payload(
                weekly,
                "2026-08-16",
                today=self.module.date(2026, 8, 29),
            )
        with self.assertRaisesRegex(self.module.SyncError, "is stale"):
            self.module.parse_weekly_payload(
                {
                    **weekly,
                    "as_of": "2026-08-16",
                    "issue_id": "2026-W33",
                    "week_start": "2026-08-10",
                    "slug": "weekly-signal-2026-w33",
                    "date": "2026-08-16T00:00:00",
                    "date_gmt": "2026-08-16T00:00:00",
                },
                today=self.module.date(2026, 8, 29),
            )

    def test_weekly_payload_is_fetched_from_deployed_canary(self):
        weekly = {
            "schema": "kodyw-weekly-signal/1.0",
            "as_of": "2026-08-23",
            "issue_id": "2026-W34",
            "week_start": "2026-08-17",
            "title": "Weekly Signal",
            "slug": "weekly-signal-2026-w34",
            "content_html": "<p>Issue</p>",
            "excerpt": "Issue",
            "date": "2026-08-23T00:00:00",
            "date_gmt": "2026-08-23T00:00:00",
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
                today=self.module.date(2026, 8, 29),
            )
        finally:
            self.module.fetch_text = original
        self.assertEqual(
            calls,
            ["https://kody-w.github.io/api/weekly-signal.json"],
        )
        self.assertEqual(payload["slug"], weekly["slug"])

    def test_deployed_weekly_waits_for_expected_issue(self):
        current = {
            "schema": "kodyw-weekly-signal/1.0",
            "as_of": "2026-08-23",
            "issue_id": "2026-W34",
            "week_start": "2026-08-17",
            "title": "Weekly Signal",
            "slug": "weekly-signal-2026-w34",
            "content_html": "<p>Issue</p>",
            "excerpt": "Issue",
            "date": "2026-08-23T00:00:00",
            "date_gmt": "2026-08-23T00:00:00",
        }
        stale = {
            **current,
            "as_of": "2026-08-16",
            "issue_id": "2026-W33",
            "week_start": "2026-08-10",
            "slug": "weekly-signal-2026-w33",
            "date": "2026-08-16T00:00:00",
            "date_gmt": "2026-08-16T00:00:00",
        }
        responses = iter((stale, current))
        original_fetch = self.module.fetch_text
        original_monotonic = self.module.time.monotonic
        original_sleep = self.module.time.sleep
        self.module.fetch_text = lambda url: json.dumps(next(responses))
        moments = iter((0.0, 0.1))
        self.module.time.monotonic = lambda: next(moments)
        self.module.time.sleep = lambda seconds: None
        try:
            payload = self.module.deployed_weekly_payload(
                {"weekly_manifest": "api/weekly-signal.json"},
                "https://kody-w.github.io",
                "2026-08-23",
                wait_seconds=1,
                today=self.module.date(2026, 8, 29),
            )
        finally:
            self.module.fetch_text = original_fetch
            self.module.time.monotonic = original_monotonic
            self.module.time.sleep = original_sleep
        self.assertEqual(payload["slug"], current["slug"])


if __name__ == "__main__":
    unittest.main()
