import copy
import hashlib
import importlib.util
import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
VERIFIER = SCRIPTS / "verify_lost_apps_evidence.py"


def load_verifier():
    sys.path.insert(0, str(SCRIPTS))
    try:
        spec = importlib.util.spec_from_file_location(
            "verify_lost_apps_evidence", VERIFIER
        )
        module = importlib.util.module_from_spec(spec)
        assert spec.loader
        spec.loader.exec_module(module)
        return module
    finally:
        sys.path.remove(str(SCRIPTS))


class FakeHeaders:
    def __init__(self, content_type, values=None):
        self.content_type = content_type
        self.values = values or {}

    def get_content_type(self):
        return self.content_type

    def get(self, name, default=None):
        return self.values.get(name, default)


class FakeResponse:
    def __init__(self, body, content_type, url, status=200, headers=None):
        self.body = body
        self.headers = FakeHeaders(content_type, headers)
        self.url = url
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body

    def geturl(self):
        return self.url


class FakeOpener:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def __call__(self, request, timeout):
        self.calls.append((request.full_url, timeout))
        return self.responses[request.full_url]


class LostAppsEvidenceVerificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.verifier = load_verifier()

    def metadata(self, media_id, filename, slug, mime_type="text/html"):
        return {
            "date": "2025-03-24T12:00:00",
            "id": media_id,
            "mime_type": mime_type,
            "slug": slug,
            "source_url": (
                "https://kodyw.com/wp-content/uploads/2025/03/" + filename
            ),
        }

    def fixture(self):
        api = "https://kodyw.com/wp-json/wp/v2/media"
        metadata = [
            self.metadata(1, "task-tracker.html", "task-tracker"),
            self.metadata(2, "task-tracker-1.html", "task-tracker-2"),
            self.metadata(3, "terminal-viewer.html", "terminal-viewer"),
        ]
        bodies = {
            1: b"<html>first</html>",
            2: b"<html>first</html>",
            3: b"<html>second</html>",
        }
        records = []
        responses = {}
        for item in metadata:
            body = bodies[item["id"]]
            records.append(
                {
                    "family_id": self.verifier.classify_family(item),
                    "media_id": item["id"],
                    "sha256": hashlib.sha256(body).hexdigest(),
                    "size_bytes": len(body),
                    "source_url": item["source_url"],
                }
            )
            detail_url = f"{api}/{item['id']}"
            responses[detail_url] = FakeResponse(
                json.dumps(item).encode("utf-8"),
                "application/json",
                detail_url,
            )
            responses[item["source_url"]] = FakeResponse(
                body, "text/html", item["source_url"]
            )

        page_headers = {"X-WP-Total": "101", "X-WP-TotalPages": "2"}
        page_one = self.verifier.collection_url(api, 1)
        page_two = self.verifier.collection_url(api, 2)
        responses[page_one] = FakeResponse(
            json.dumps(metadata[:2]).encode("utf-8"),
            "application/json",
            page_one,
            headers=page_headers,
        )
        responses[page_two] = FakeResponse(
            json.dumps(metadata[2:]).encode("utf-8"),
            "application/json",
            page_two,
            headers=page_headers,
        )
        source_stats = {
            "html_attachments": 3,
            "html_upload_date": "2025-03-24",
            "paginated_unique_media": 3,
            "wordpress_api_reported_media": 101,
        }
        groups = self.verifier.museum_builder.derive_content_groups(records)
        return {
            "api": api,
            "groups": groups,
            "metadata": metadata,
            "opener": FakeOpener(responses),
            "records": records,
            "responses": responses,
            "source_stats": source_stats,
        }

    def verify(self, fixture):
        return self.verifier.verify_online_evidence(
            fixture["records"],
            fixture["groups"],
            fixture["source_stats"],
            fixture["api"],
            opener=fixture["opener"],
            workers=1,
            expected_reported=101,
            expected_unique=3,
            expected_qualifying=3,
        )

    def replace_collection_page(self, fixture, page, items, headers=None):
        url = self.verifier.collection_url(fixture["api"], page)
        current = fixture["responses"][url]
        fixture["responses"][url] = FakeResponse(
            json.dumps(items).encode("utf-8"),
            "application/json",
            url,
            headers=headers or current.headers.values,
        )

    def test_verifier_paginates_then_queries_every_qualifying_media_id(self):
        fixture = self.fixture()
        verified = self.verify(fixture)
        self.assertEqual(verified, fixture["records"])
        self.assertEqual(len(fixture["opener"].calls), 8)
        for page in (1, 2):
            self.assertIn(
                (self.verifier.collection_url(fixture["api"], page), 60),
                fixture["opener"].calls,
            )
        for record in fixture["records"]:
            self.assertIn(
                (f"{fixture['api']}/{record['media_id']}", 60),
                fixture["opener"].calls,
            )
            self.assertIn((record["source_url"], 60), fixture["opener"].calls)

    def test_verifier_rejects_extra_qualifying_record(self):
        fixture = self.fixture()
        extra = self.metadata(4, "task-flow.html", "task-flow")
        self.replace_collection_page(
            fixture, 2, [fixture["metadata"][2], extra]
        )
        fixture["source_stats"]["paginated_unique_media"] = 4
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "qualifying HTML"
        ):
            self.verifier.verify_online_evidence(
                fixture["records"],
                fixture["groups"],
                fixture["source_stats"],
                fixture["api"],
                opener=fixture["opener"],
                workers=1,
                expected_reported=101,
                expected_unique=4,
                expected_qualifying=3,
            )

    def test_verifier_rejects_omitted_qualifying_record(self):
        fixture = self.fixture()
        replacement = self.metadata(4, "task-flow.html", "task-flow")
        self.replace_collection_page(fixture, 2, [replacement])
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "ID set changed"
        ):
            self.verify(fixture)

    def test_verifier_rejects_duplicate_id_across_pages(self):
        fixture = self.fixture()
        self.replace_collection_page(
            fixture, 2, [fixture["metadata"][1], fixture["metadata"][2]]
        )
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "duplicate media ID"
        ):
            self.verify(fixture)

    def test_verifier_rejects_pagination_total_mismatch(self):
        fixture = self.fixture()
        self.replace_collection_page(
            fixture,
            2,
            [fixture["metadata"][2]],
            headers={"X-WP-Total": "102", "X-WP-TotalPages": "2"},
        )
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError,
            "pagination totals changed",
        ):
            self.verify(fixture)

    def test_verifier_rejects_qualifying_metadata_mutation(self):
        fixture = self.fixture()
        mutated = copy.deepcopy(fixture["metadata"][2])
        mutated["mime_type"] = "text/plain"
        self.replace_collection_page(fixture, 2, [mutated])
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "qualifying HTML"
        ):
            self.verify(fixture)

    def test_verifier_rejects_family_reassignment(self):
        fixture = self.fixture()
        reassigned = copy.deepcopy(fixture["metadata"][2])
        reassigned["slug"] = "task-flow"
        reassigned["source_url"] = (
            "https://kodyw.com/wp-content/uploads/2025/03/task-flow.html"
        )
        self.replace_collection_page(fixture, 2, [reassigned])
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "family assignment changed"
        ):
            self.verify(fixture)

    def test_verifier_rejects_coordinated_url_mutation(self):
        fixture = self.fixture()
        fixture["records"][0]["source_url"] = (
            "https://kodyw.com/wp-content/uploads/2025/03/task-tracker-9.html"
        )
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "source URL changed"
        ):
            self.verify(fixture)

    def test_verifier_rejects_coordinated_size_mutation(self):
        fixture = self.fixture()
        fixture["records"][0]["size_bytes"] += 1
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "byte size changed"
        ):
            self.verify(fixture)

    def test_verifier_rejects_coordinated_hash_and_group_mutation(self):
        fixture = self.fixture()
        fixture["records"][0]["sha256"] = "0" * 64
        fixture["groups"] = self.verifier.museum_builder.derive_content_groups(
            fixture["records"]
        )
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "SHA-256 changed"
        ):
            self.verify(fixture)


if __name__ == "__main__":
    unittest.main()
