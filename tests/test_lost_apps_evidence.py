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
    def __init__(self, content_type):
        self.content_type = content_type

    def get_content_type(self):
        return self.content_type


class FakeResponse:
    def __init__(self, body, content_type, url, status=200):
        self.body = body
        self.headers = FakeHeaders(content_type)
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

    def fixture(self):
        api = "https://kodyw.com/wp-json/wp/v2/media"
        bodies = {
            1: b"<html>first</html>",
            2: b"<html>first</html>",
            3: b"<html>second</html>",
        }
        records = []
        responses = {}
        for media_id, body in bodies.items():
            source_url = (
                "https://kodyw.com/wp-content/uploads/2025/03/"
                f"fixture-{media_id}.html"
            )
            record = {
                "family_id": "fixture-family",
                "media_id": media_id,
                "sha256": hashlib.sha256(body).hexdigest(),
                "size_bytes": len(body),
                "source_url": source_url,
            }
            records.append(record)
            metadata_url = f"{api}/{media_id}"
            metadata = {
                "id": media_id,
                "mime_type": "text/html",
                "source_url": source_url,
            }
            responses[metadata_url] = FakeResponse(
                json.dumps(metadata).encode("utf-8"),
                "application/json",
                metadata_url,
            )
            responses[source_url] = FakeResponse(body, "text/html", source_url)
        groups = self.verifier.museum_builder.derive_content_groups(records)
        return api, records, groups, FakeOpener(responses)

    def test_verifier_queries_every_media_id_and_derives_groups_from_bytes(self):
        api, records, groups, opener = self.fixture()
        verified = self.verifier.verify_online_records(
            records, groups, api, opener=opener, workers=1
        )
        self.assertEqual(verified, records)
        self.assertEqual(len(opener.calls), len(records) * 2)
        for record in records:
            self.assertIn((f"{api}/{record['media_id']}", 60), opener.calls)
            self.assertIn((record["source_url"], 60), opener.calls)

    def test_verifier_rejects_coordinated_url_mutation(self):
        api, records, groups, opener = self.fixture()
        altered = copy.deepcopy(records)
        altered[0]["source_url"] = (
            "https://kodyw.com/wp-content/uploads/2025/03/forged.html"
        )
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "source URL changed"
        ):
            self.verifier.verify_online_records(
                altered, groups, api, opener=opener, workers=1
            )

    def test_verifier_rejects_coordinated_size_mutation(self):
        api, records, groups, opener = self.fixture()
        altered = copy.deepcopy(records)
        altered[0]["size_bytes"] += 1
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "byte size changed"
        ):
            self.verifier.verify_online_records(
                altered, groups, api, opener=opener, workers=1
            )

    def test_verifier_rejects_coordinated_hash_and_group_mutation(self):
        api, records, _groups, opener = self.fixture()
        altered = copy.deepcopy(records)
        altered[0]["sha256"] = "0" * 64
        forged_groups = self.verifier.museum_builder.derive_content_groups(altered)
        with self.assertRaisesRegex(
            self.verifier.EvidenceVerificationError, "SHA-256 changed"
        ):
            self.verifier.verify_online_records(
                altered, forged_groups, api, opener=opener, workers=1
            )


if __name__ == "__main__":
    unittest.main()
