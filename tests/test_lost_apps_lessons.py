import re
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "_data" / "lost_apps_lessons.yml"
API = ROOT / "api" / "lost-apps-lessons.json"
SPECS = {
    "pattern-quota": {
        "order": 359,
        "demo": "365-pattern-quota.html",
        "api": "PatternQuota",
        "forbidden_brand": "LUMON",
    },
    "incident-log-observatory": {
        "order": 360,
        "demo": "366-incident-log-observatory.html",
        "api": "IncidentLogObservatory",
        "forbidden_brand": None,
    },
    "agent-workflow-lab": {
        "order": 361,
        "demo": "367-agent-workflow-lab.html",
        "api": "AgentWorkflowLab",
        "forbidden_brand": None,
    },
}


def front_matter(path):
    source = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n", source, re.S)
    if not match:
        raise AssertionError(f"{path} has no front matter")
    return yaml.safe_load(match.group(1)), source[match.end():]


class LostAppsLessonTests(unittest.TestCase):
    def test_registry_is_complete_and_public(self):
        registry = yaml.safe_load(DATA.read_text(encoding="utf-8"))
        self.assertEqual(registry["schema"], "kodyw-lost-apps-lessons/1.0")
        lessons = {lesson["id"]: lesson for lesson in registry["lessons"]}
        self.assertEqual(set(lessons), set(SPECS))
        for lesson_id, lesson in lessons.items():
            self.assertEqual(lesson["order"], SPECS[lesson_id]["order"])
            self.assertTrue(lesson["source_url"].startswith("https://kodyw.com/"))
            self.assertIn("black-box", lesson["clean_room_prompt"])
            self.assertGreaterEqual(len(lesson["acceptance_checks"]), 5)
            self.assertEqual(
                lesson["demo_url"],
                f"/learnwithkody/demos/{SPECS[lesson_id]['demo']}",
            )

        api_front_matter, api_body = front_matter(API)
        self.assertIsNone(api_front_matter["layout"])
        self.assertEqual(
            api_front_matter["permalink"],
            "/api/lost-apps-lessons.json",
        )
        self.assertIn("site.data.lost_apps_lessons | jsonify", api_body)

    def test_lessons_preserve_clean_room_provenance(self):
        registry = yaml.safe_load(DATA.read_text(encoding="utf-8"))
        lessons = {lesson["id"]: lesson for lesson in registry["lessons"]}
        for lesson_id, spec in SPECS.items():
            with self.subTest(lesson=lesson_id):
                page = ROOT / "_examples" / f"{lesson_id}.html"
                metadata, body = front_matter(page)
                lesson = lessons[lesson_id]
                self.assertEqual(metadata["slug"], lesson_id)
                self.assertEqual(metadata["order"], spec["order"])
                self.assertEqual(
                    metadata["demo"],
                    f"/learnwithkody/demos/{spec['demo']}",
                )
                self.assertEqual(metadata["prompt"].strip(), lesson["clean_room_prompt"])
                self.assertIn(lesson["historical_title"], body)
                self.assertIn(lesson["source_url"], body)
                self.assertIn("Clean-room boundary", body)
                self.assertIn("Acceptance checks", body)
                for check in lesson["acceptance_checks"]:
                    self.assertIn(check, body)

    def test_demos_are_local_safe_and_self_testing(self):
        forbidden = (
            "fetch(",
            "XMLHttpRequest",
            "WebSocket",
            "EventSource",
            "eval(",
            "new Function",
            "document.write",
        )
        for lesson_id, spec in SPECS.items():
            with self.subTest(demo=spec["demo"]):
                path = ROOT / "learnwithkody" / "demos" / spec["demo"]
                source = path.read_text(encoding="utf-8")
                self.assertLessEqual(path.stat().st_size, 160 * 1024)
                self.assertIn("default-src 'none'", source)
                self.assertIn("connect-src 'none'", source)
                self.assertIn("script-src-attr 'none'", source)
                self.assertIn(f"window.{spec['api']}", source)
                self.assertIn("selfTest", source)
                self.assertIn("exportState", source)
                self.assertIn("importState", source)
                self.assertIn("prefers-reduced-motion", source)
                self.assertIn("@media (max-width: 520px)", source)
                for token in forbidden:
                    self.assertNotIn(token, source)
                if spec["forbidden_brand"]:
                    self.assertNotIn(spec["forbidden_brand"], source.upper())


if __name__ == "__main__":
    unittest.main()
