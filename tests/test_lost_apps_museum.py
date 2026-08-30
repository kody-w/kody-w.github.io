import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "_data" / "lost_apps_audit.json"
CURATION = ROOT / "_data" / "lost_apps_curation.yml"
LESSONS = ROOT / "_data" / "lost_apps_lessons.yml"
MUSEUM = ROOT / "_data" / "lost_apps_museum.json"
API = ROOT / "api" / "lost-apps-museum.json"
BRIEFS = ROOT / "learnwithkody" / "rappvision" / "lost-apps-briefs.json"
BUILDER = ROOT / "scripts" / "build_lost_apps_museum.py"
EXPECTED_AUDIT_SHA256 = (
    "6e6daec82e55977985df613e45f23a076ec53a8c7775b64c533408784a238884"
)
RESTORED = {
    "agent-workflow-system": "agent-workflow-lab",
    "severance-refiner": "pattern-quota",
    "terminal-log-visualizer": "incident-log-observatory",
}


def load_builder():
    spec = importlib.util.spec_from_file_location("build_lost_apps_museum", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def encoded_audit(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")


class LostAppsMuseumTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load_builder()
        cls.audit_bytes = AUDIT.read_bytes()
        cls.audit = json.loads(cls.audit_bytes)
        cls.curation = yaml.safe_load(CURATION.read_text(encoding="utf-8"))
        cls.lessons = yaml.safe_load(LESSONS.read_text(encoding="utf-8"))
        cls.museum = json.loads(MUSEUM.read_text(encoding="utf-8"))
        cls.briefs = json.loads(BRIEFS.read_text(encoding="utf-8"))

    def test_verified_audit_snapshot_is_the_only_evidence_source(self):
        self.assertEqual(
            hashlib.sha256(self.audit_bytes).hexdigest(), EXPECTED_AUDIT_SHA256
        )
        self.assertEqual(self.audit["schema"], "kodyw-lost-apps/1.0")
        self.assertEqual(len(self.audit["families"]), 22)
        self.assertEqual(
            self.audit["source_stats"]["curated_application_families"], 22
        )
        self.assertEqual(self.audit["source_stats"]["html_attachments"], 96)
        self.assertEqual(self.audit["source_stats"]["byte_distinct_html"], 27)
        addressing = self.audit["content_addressing"]
        self.assertEqual(
            addressing["schema"], "kodyw-lost-apps-content-addressing/1.0"
        )
        self.assertEqual(addressing["hash_algorithm"], "sha256")
        self.assertEqual(addressing["byte_distinct_html"], 27)
        self.assertEqual(len(addressing["media"]), 96)
        self.assertEqual(len(addressing["content_groups"]), 27)
        self.assertEqual(
            {record["media_id"] for record in addressing["media"]},
            {
                media_id
                for family in self.audit["families"]
                for media_id in family["media_ids"]
            },
        )

    def test_builder_outputs_are_deterministic_and_current(self):
        expected_museum, expected_briefs = self.builder.build_payloads(
            self.audit, self.curation, self.lessons, self.audit_bytes
        )
        museum_bytes = self.builder.canonical_json(expected_museum)
        brief_bytes = self.builder.canonical_json(expected_briefs)
        self.assertEqual(MUSEUM.read_bytes(), museum_bytes)
        self.assertEqual(API.read_bytes(), museum_bytes)
        self.assertEqual(BRIEFS.read_bytes(), brief_bytes)
        self.assertEqual(self.builder.main(["--check"]), 0)

    def test_all_families_have_provenance_and_safe_preview_postures(self):
        audit_by_id = {family["id"]: family for family in self.audit["families"]}
        apps = self.museum["apps"]
        self.assertEqual({app["id"] for app in apps}, set(audit_by_id))
        self.assertEqual(len({app["source_url"] for app in apps}), 22)
        self.assertEqual(self.museum["stats"]["historical_embeds_approved"], 0)
        self.assertEqual(
            self.museum["stats"]["interactive_clean_room_restorations"], 3
        )
        for app in apps:
            source = audit_by_id[app["id"]]
            with self.subTest(app=app["id"]):
                self.assertEqual(app["source_url"], source["representative_url"])
                self.assertEqual(app["aliases"], source["aliases"])
                self.assertEqual(app["media_ids"], source["media_ids"])
                self.assertEqual(
                    {record["media_id"] for record in app["media_integrity"]},
                    set(source["media_ids"]),
                )
                self.assertTrue(
                    all(
                        len(record["sha256"]) == 64
                        and record["source_url"].startswith(
                            "https://kodyw.com/wp-content/uploads/2025/03/"
                        )
                        for record in app["media_integrity"]
                    )
                )
                self.assertEqual(app["evidence"], source["evidence"])
                self.assertTrue(app["source_url"].startswith("https://kodyw.com/"))
                self.assertGreaterEqual(len(app["related"]), 2)
                self.assertFalse(source["safe_embed"])
                if app["id"] in RESTORED:
                    self.assertEqual(app["preview"]["kind"], "clean-room")
                    self.assertTrue(
                        app["preview"]["url"].startswith("/learnwithkody/demos/")
                    )
                    self.assertEqual(app["lesson"]["id"], RESTORED[app["id"]])
                else:
                    self.assertEqual(app["preview"]["kind"], "record-only")
                    self.assertNotIn("url", app["preview"])
                    self.assertIsNone(app["lesson"])

    def test_every_app_has_grounded_landscape_and_vertical_briefs(self):
        apps = {app["id"]: app for app in self.museum["apps"]}
        briefs = {brief["app_id"]: brief for brief in self.briefs["briefs"]}
        self.assertEqual(set(briefs), set(apps))
        self.assertEqual(len(briefs), 22)
        for app_id, brief in briefs.items():
            with self.subTest(app=app_id):
                app = apps[app_id]
                landscape = brief["production"]["episode_16x9"]
                vertical = brief["production"]["short_9x16"]
                self.assertEqual(
                    landscape["angle"], app["rapp_vision"]["episode_16x9"]
                )
                self.assertEqual(vertical["angle"], app["rapp_vision"]["short_9x16"])
                self.assertGreaterEqual(len(landscape["scene_beats"]), 4)
                self.assertGreaterEqual(len(landscape["proof_shots"]), 2)
                self.assertGreaterEqual(len(vertical["proof_shots"]), 1)
                self.assertGreaterEqual(len(brief["claims_to_verify"]), 2)
                self.assertEqual(brief["evidence"], app["evidence"])
                self.assertEqual(
                    brief["historical_source_url"], app["source_url"]
                )

    def test_builder_rejects_unsafe_or_non_deduplicated_curation(self):
        unsafe_audit = copy.deepcopy(self.audit)
        unsafe_audit["families"][0]["safe_embed"] = True
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                unsafe_audit,
                self.curation,
                self.lessons,
                encoded_audit(unsafe_audit),
            )

        duplicated_audit = copy.deepcopy(self.audit)
        duplicated_audit["families"][1]["aliases"][0] = duplicated_audit[
            "families"
        ][0]["aliases"][0]
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                duplicated_audit,
                self.curation,
                self.lessons,
                encoded_audit(duplicated_audit),
            )

        unsafe_curation = copy.deepcopy(self.curation)
        unsafe_curation["related_by_category"]["agent-workbenches"]["url"] = (
            "//example.invalid"
        )
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                self.audit, unsafe_curation, self.lessons, self.audit_bytes
            )

    def test_builder_rejects_altered_or_missing_media_hashes(self):
        altered = copy.deepcopy(self.audit)
        altered["content_addressing"]["media"][0]["sha256"] = "0" * 64
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                altered, self.curation, self.lessons, encoded_audit(altered)
            )

        missing = copy.deepcopy(self.audit)
        del missing["content_addressing"]["media"][0]["sha256"]
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                missing, self.curation, self.lessons, encoded_audit(missing)
            )

    def test_builder_rejects_wrong_hash_to_family_grouping(self):
        wrong_group = copy.deepcopy(self.audit)
        wrong_group["content_addressing"]["content_groups"][0]["family_ids"] = [
            "wrong-family"
        ]
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                wrong_group,
                self.curation,
                self.lessons,
                encoded_audit(wrong_group),
            )

    def test_builder_recomputes_and_rejects_changed_distinct_counts(self):
        wrong_stats = copy.deepcopy(self.audit)
        wrong_stats["source_stats"]["byte_distinct_html"] = 26
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                wrong_stats,
                self.curation,
                self.lessons,
                encoded_audit(wrong_stats),
            )

        wrong_addressing = copy.deepcopy(self.audit)
        wrong_addressing["content_addressing"]["byte_distinct_html"] = 28
        with self.assertRaises(self.builder.BuildError):
            self.builder.build_payloads(
                wrong_addressing,
                self.curation,
                self.lessons,
                encoded_audit(wrong_addressing),
            )

    def test_builder_rejects_audit_object_that_does_not_match_source_bytes(self):
        altered = copy.deepcopy(self.audit)
        altered["families"][0]["title"] = "Coordinated mutation"
        with self.assertRaisesRegex(
            self.builder.BuildError, "audit_bytes do not encode"
        ):
            self.builder.build_payloads(
                altered, self.curation, self.lessons, self.audit_bytes
            )

    def test_builder_rejects_coordinated_media_record_removal(self):
        altered = copy.deepcopy(self.audit)
        media_id = altered["families"][0]["media_ids"].pop(0)
        altered["source_stats"]["html_attachments"] = 95
        altered["content_addressing"]["media"] = [
            record
            for record in altered["content_addressing"]["media"]
            if record["media_id"] != media_id
        ]
        for group in altered["content_addressing"]["content_groups"]:
            if media_id in group["media_ids"]:
                group["media_ids"].remove(media_id)
                break
        with self.assertRaisesRegex(self.builder.BuildError, "exactly 96"):
            self.builder.build_payloads(
                altered, self.curation, self.lessons, encoded_audit(altered)
            )

    def test_clean_room_demos_never_receive_historical_embed_permission(self):
        museum_page = (ROOT / "lost-apps" / "index.html").read_text(
            encoding="utf-8"
        )
        script = (ROOT / "js" / "lost-apps-museum.js").read_text(encoding="utf-8")
        self.assertEqual(
            museum_page.count('sandbox="allow-scripts allow-downloads"'), 1
        )
        self.assertNotIn("allow-same-origin", museum_page)
        self.assertNotIn("allow-forms", museum_page)
        self.assertNotIn("allow-popups", museum_page)
        self.assertIn("camera 'none'", museum_page)
        self.assertIn("microphone 'none'", museum_page)
        self.assertIn("learnwithkody", script)
        self.assertIn("allowedPreview.test(url)", script)
        self.assertNotIn("kodyw.com", script)
        self.assertNotIn("innerHTML", script)


if __name__ == "__main__":
    unittest.main()
