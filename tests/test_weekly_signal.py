import importlib.util
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "build_weekly_signal.py"
CURRENT = ROOT / "api" / "weekly-signal.json"
ARCHIVE = ROOT / "api" / "weekly-signal-archive.json"
PAGE = ROOT / "weekly-signal" / "index.html"
WORKFLOW = ROOT / ".github" / "workflows" / "refresh-weekly-signal.yml"


def load_module():
    spec = importlib.util.spec_from_file_location("build_weekly_signal", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class WeeklySignalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = load_module()

    def test_issue_is_deterministic_and_complete(self):
        first = self.module.build(ROOT, date(2026, 8, 30))
        second = self.module.build(ROOT, date(2026, 8, 30))
        self.assertEqual(first, second)
        self.assertEqual(first["schema"], "kodyw-weekly-signal/1.0")
        self.assertEqual(first["slug"], "weekly-signal-2026-w35")
        self.assertEqual(
            {section["kind"] for section in first["sections"]},
            {
                "date-edition",
                "active-work",
                "rediscovered",
                "lost-app",
                "rapp-vision",
            },
        )
        lesson = next(
            section for section in first["sections"]
            if section["kind"] == "lost-app"
        )
        vision = next(
            section for section in first["sections"]
            if section["kind"] == "rapp-vision"
        )
        self.assertEqual(lesson["lesson_id"], vision["lesson_id"])
        self.assertTrue(lesson["lesson_url"].startswith("https://kody-w.github.io/"))
        self.assertNotIn('href="/', first["content_html"])
        self.assertIn("Subscribe to the next Weekly Signal", first["content_html"])

    def test_markdown_descriptions_become_plain_text(self):
        self.assertEqual(
            self.module.plain_text_summary(
                "Use *actual* [git scraping](https://example.com), `code`, "
                "and a ```prompt fence."
            ),
            "Use actual git scraping, code, and a prompt fence.",
        )

    def test_archive_replaces_same_issue_and_caps_history(self):
        issue = self.module.build(ROOT, date(2026, 8, 30))
        future = self.module.build(ROOT, date(2026, 9, 6))
        archive = {
            "schema": self.module.ARCHIVE_SCHEMA,
            "issues": [issue] * 60 + [future],
        }
        updated = self.module.update_archive(archive, issue)
        self.assertEqual(len(updated["issues"]), 2)
        self.assertEqual(updated["issues"][0]["slug"], future["slug"])
        self.assertEqual(updated["issues"][1]["slug"], issue["slug"])

    def test_backdated_current_issue_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "weekly.json"
            path.write_text(
                json.dumps({"as_of": "2026-08-23"}),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(
                self.module.BuildError,
                "refusing to move Weekly Signal backward",
            ):
                self.module.reject_backdated_current(
                    date(2026, 8, 16),
                    path,
                )

    def test_future_or_incomplete_issue_is_rejected(self):
        with self.assertRaisesRegex(
            self.module.BuildError,
            "latest completed Sunday is 2026-08-23",
        ):
            self.module.reject_incomplete_week(
                date(2026, 8, 30),
                date(2026, 8, 29),
            )

    def test_issue_date_must_be_sunday(self):
        with self.assertRaisesRegex(
            self.module.BuildError,
            "as_of must be a Sunday",
        ):
            self.module.build(ROOT, date(2026, 8, 29))

    def test_quiet_week_reports_zero_new_articles(self):
        issue = self.module.build(ROOT, date(2026, 9, 6))
        edition = next(
            section for section in issue["sections"]
            if section["kind"] == "date-edition"
        )
        self.assertEqual(issue["stats"]["new_articles"], 0)
        self.assertEqual(edition["items"], [])
        self.assertEqual(edition["title"], "No new articles this week")
        self.assertIn("0 new archive items", issue["excerpt"])

    def test_default_issue_uses_the_latest_completed_sunday(self):
        self.assertEqual(
            self.module.default_as_of(date(2026, 8, 31)),
            date(2026, 8, 30),
        )
        self.assertEqual(
            self.module.default_as_of(date(2026, 9, 1)),
            date(2026, 8, 30),
        )
        self.assertEqual(
            self.module.default_as_of(date(2026, 8, 29)),
            date(2026, 8, 23),
        )
        self.assertEqual(
            self.module.date_range_label(
                date(2026, 8, 31),
                date(2026, 9, 6),
            ),
            "August 31–September 6, 2026",
        )

    def test_committed_issue_and_archive_are_consistent(self):
        current = json.loads(CURRENT.read_text(encoding="utf-8"))
        self.assertEqual(current["schema"], self.module.SCHEMA)
        self.assertIn("content_html", current)
        archive = json.loads(ARCHIVE.read_text(encoding="utf-8"))
        self.assertEqual(archive["schema"], self.module.ARCHIVE_SCHEMA)
        self.assertEqual(
            len({issue["slug"] for issue in archive["issues"]}),
            len(archive["issues"]),
        )
        self.assertEqual(archive["issues"][0]["slug"], current["slug"])

    def test_weekly_page_and_refresh_workflow_exist(self):
        page = PAGE.read_text(encoding="utf-8")
        self.assertIn("permalink: /weekly-signal/", page)
        self.assertIn("site.data.weekly_signal", page)
        self.assertIn("site.data.weekly_signal_archive", page)
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('cron: "5 15 * * 1"', workflow)
        self.assertIn("python3 scripts/build_weekly_signal.py", workflow)
        validation = (
            ROOT / ".github" / "workflows" / "validate-posts.yml"
        ).read_text(encoding="utf-8")
        self.assertIn("scripts/build_weekly_signal.py", validation)
        self.assertIn("--check", validation)
        self.assertIn("python3 -m unittest tests.test_weekly_signal", workflow)
        self.assertIn("Co-authored-by: Copilot", workflow)
        self.assertIn("/pages/builds", workflow)


if __name__ == "__main__":
    unittest.main()
