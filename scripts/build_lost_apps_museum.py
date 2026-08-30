#!/usr/bin/env python3
"""Build deterministic Lost Apps Museum and RAPP Vision datasets."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import yaml


ROOT = Path(__file__).resolve().parents[1]
AUDIT_PATH = ROOT / "_data" / "lost_apps_audit.json"
CURATION_PATH = ROOT / "_data" / "lost_apps_curation.yml"
LESSONS_PATH = ROOT / "_data" / "lost_apps_lessons.yml"
MUSEUM_DATA_PATH = ROOT / "_data" / "lost_apps_museum.json"
MUSEUM_API_PATH = ROOT / "api" / "lost-apps-museum.json"
VISION_API_PATH = ROOT / "learnwithkody" / "rappvision" / "lost-apps-briefs.json"
AUDIT_SCHEMA = "kodyw-lost-apps/1.0"
CURATION_SCHEMA = "kodyw-lost-apps-curation/1.0"
LESSON_SCHEMA = "kodyw-lost-apps-lessons/1.0"
MUSEUM_SCHEMA = "kodyw-lost-apps-museum/1.0"
VISION_SCHEMA = "rapp-vision-production-briefs/1.0"
CONTENT_ADDRESSING_SCHEMA = "kodyw-lost-apps-content-addressing/1.0"
EXPECTED_FAMILIES = 22
EXPECTED_MEDIA_RECORDS = 96
SITE_URL = "https://kody-w.github.io"
SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")


class BuildError(RuntimeError):
    pass


def canonical_json(value: object) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
        + "\n"
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load_yaml(path: Path) -> dict:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise BuildError(f"{path} must contain a YAML mapping")
    return value


def require_nonempty(value: object, label: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise BuildError(f"{label} must not be empty")
    return text


def validate_https_url(value: object, label: str) -> str:
    url = require_nonempty(value, label)
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise BuildError(f"{label} must be an absolute HTTPS URL")
    return url


def require_slug(value: object, label: str) -> str:
    slug = require_nonempty(value, label)
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise BuildError(f"{label} must be a lowercase hyphenated slug")
    return slug


def require_site_path(value: object, label: str) -> str:
    path = require_nonempty(value, label)
    if not path.startswith("/") or path.startswith("//"):
        raise BuildError(f"{label} must be a site-relative path")
    return path


def readiness_label(value: str) -> str:
    if value.startswith("hold-"):
        return "Context only"
    if value.startswith("high"):
        return "Restoration candidate"
    return "Needs hardening"


def risk_level(risks: list[dict]) -> str:
    severity_order = {"none": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}
    highest = "none"
    for risk in risks:
        severity = require_nonempty(risk.get("severity"), "risk severity").lower()
        if severity not in severity_order:
            raise BuildError(f"unsupported risk severity: {severity}")
        if severity_order[severity] > severity_order[highest]:
            highest = severity
    return highest


def normalize_dependency(value: dict, family_id: str) -> dict:
    if not isinstance(value, dict):
        raise BuildError(f"{family_id} has a malformed dependency")
    url = require_nonempty(value.get("url"), f"{family_id} dependency URL")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise BuildError(f"{family_id} dependency has an unsupported URL")
    status = value.get("status")
    if status is not None and not isinstance(status, int):
        raise BuildError(f"{family_id} dependency status must be an integer or null")
    return {
        "purpose": require_nonempty(
            value.get("purpose"), f"{family_id} dependency purpose"
        ),
        "status": status,
        "url": url,
    }


def normalize_related_link(value: dict, label: str) -> dict:
    if not isinstance(value, dict):
        raise BuildError(f"{label} must be a mapping")
    url = require_nonempty(value.get("url"), f"{label} URL")
    parsed = urlparse(url)
    if not (
        (url.startswith("/") and not url.startswith("//"))
        or parsed.scheme == "https"
    ):
        raise BuildError(f"{label} must use a site-relative or HTTPS URL")
    return {
        "kind": "content",
        "title": require_nonempty(value.get("title"), f"{label} title"),
        "url": url,
    }


def load_lessons(payload: dict) -> dict[str, dict]:
    if payload.get("schema") != LESSON_SCHEMA:
        raise BuildError("unsupported Lost Apps lesson schema")
    lessons = payload.get("lessons")
    if not isinstance(lessons, list):
        raise BuildError("Lost Apps lesson registry must contain a list")
    result = {}
    for lesson in lessons:
        lesson_id = require_slug(lesson.get("id"), "lesson id")
        if lesson_id in result:
            raise BuildError(f"duplicate lesson id: {lesson_id}")
        result[lesson_id] = lesson
    return result


def normalize_brief(family: dict) -> dict:
    family_id = family["id"]
    value = family.get("rapp_vision")
    if not isinstance(value, dict):
        raise BuildError(f"{family_id} has no RAPP Vision brief")
    list_fields = ("scene_beats", "proof_shots", "claims_to_verify")
    brief = {
        "hook": require_nonempty(value.get("hook"), f"{family_id} hook"),
        "episode_16x9": require_nonempty(
            value.get("episode_16x9"), f"{family_id} 16:9 episode"
        ),
        "short_9x16": require_nonempty(
            value.get("short_9x16"), f"{family_id} 9:16 short"
        ),
    }
    for field in list_fields:
        items = value.get(field)
        if not isinstance(items, list) or not items:
            raise BuildError(f"{family_id} {field} must be a non-empty list")
        brief[field] = [
            require_nonempty(item, f"{family_id} {field} item") for item in items
        ]
    return brief


def verify_audit_bytes(audit: dict, audit_bytes: bytes) -> None:
    try:
        parsed = json.loads(audit_bytes)
    except (TypeError, json.JSONDecodeError) as error:
        raise BuildError("audit_bytes must contain valid JSON") from error
    if parsed != audit:
        raise BuildError("audit_bytes do not encode the supplied audit object")


def derive_content_groups(media: list[dict]) -> list[dict]:
    grouped: dict[str, dict[str, set | list]] = {}
    for record in media:
        group = grouped.setdefault(
            record["sha256"], {"family_ids": set(), "media_ids": []}
        )
        group["family_ids"].add(record["family_id"])
        group["media_ids"].append(record["media_id"])
    return [
        {
            "family_ids": sorted(group["family_ids"]),
            "media_ids": sorted(group["media_ids"]),
            "sha256": digest,
        }
        for digest, group in sorted(grouped.items())
    ]


def validate_content_addressing(
    value: object,
    family_by_media: dict[int, str],
    declared_distinct: object,
    declared_media_records: object,
) -> tuple[list[dict], list[dict]]:
    if not isinstance(value, dict):
        raise BuildError("audit content_addressing must be a mapping")
    if value.get("schema") != CONTENT_ADDRESSING_SCHEMA:
        raise BuildError("unsupported Lost Apps content-addressing schema")
    if value.get("hash_algorithm") != "sha256":
        raise BuildError("Lost Apps content addressing must use SHA-256")
    require_nonempty(value.get("captured_at"), "content-addressing capture date")
    api_endpoint = validate_https_url(
        value.get("wordpress_api_endpoint"), "content-addressing API endpoint"
    )
    if api_endpoint != "https://kodyw.com/wp-json/wp/v2/media":
        raise BuildError("content addressing uses an unexpected API endpoint")
    require_nonempty(value.get("retrieval"), "content-addressing retrieval method")
    media = value.get("media")
    groups = value.get("content_groups")
    if not isinstance(media, list) or not isinstance(groups, list):
        raise BuildError("content addressing must include media and content_groups")
    if declared_media_records != EXPECTED_MEDIA_RECORDS:
        raise BuildError(
            f"source_stats must declare exactly {EXPECTED_MEDIA_RECORDS} HTML attachments"
        )
    if len(family_by_media) != EXPECTED_MEDIA_RECORDS:
        raise BuildError(
            f"families must reference exactly {EXPECTED_MEDIA_RECORDS} media IDs"
        )
    if len(media) != EXPECTED_MEDIA_RECORDS:
        raise BuildError(
            f"content addressing must contain exactly {EXPECTED_MEDIA_RECORDS} records"
        )
    if len(media) != declared_media_records:
        raise BuildError(
            "content-addressed media count does not match source_stats.html_attachments"
        )

    normalized_media = []
    records_by_id = {}
    source_urls = set()
    for record in media:
        if not isinstance(record, dict):
            raise BuildError("content-addressed media records must be mappings")
        media_id = record.get("media_id")
        if not isinstance(media_id, int) or media_id <= 0:
            raise BuildError("content-addressed media_id must be a positive integer")
        if media_id in records_by_id:
            raise BuildError(f"duplicate content-addressed media ID: {media_id}")
        if media_id not in family_by_media:
            raise BuildError(f"unknown content-addressed media ID: {media_id}")
        family_id = require_slug(
            record.get("family_id"), f"media {media_id} family_id"
        )
        if family_id != family_by_media[media_id]:
            raise BuildError(f"media {media_id} is assigned to the wrong family")
        source_url = validate_https_url(
            record.get("source_url"), f"media {media_id} source URL"
        )
        parsed = urlparse(source_url)
        if (
            parsed.netloc != "kodyw.com"
            or not parsed.path.startswith("/wp-content/uploads/2025/03/")
        ):
            raise BuildError(f"media {media_id} source is outside the audited path")
        if source_url in source_urls:
            raise BuildError(f"duplicate content-addressed source URL: {source_url}")
        source_urls.add(source_url)
        digest = require_nonempty(record.get("sha256"), f"media {media_id} SHA-256")
        if not SHA256_PATTERN.fullmatch(digest):
            raise BuildError(f"media {media_id} has an invalid SHA-256")
        size_bytes = record.get("size_bytes")
        if not isinstance(size_bytes, int) or size_bytes <= 0:
            raise BuildError(f"media {media_id} size_bytes must be positive")
        normalized = {
            "family_id": family_id,
            "media_id": media_id,
            "sha256": digest,
            "size_bytes": size_bytes,
            "source_url": source_url,
        }
        normalized_media.append(normalized)
        records_by_id[media_id] = normalized

    if set(records_by_id) != set(family_by_media):
        missing = sorted(set(family_by_media) - set(records_by_id))
        raise BuildError(f"content addressing is missing media IDs: {missing}")
    normalized_media.sort(key=lambda item: item["media_id"])
    expected_groups = derive_content_groups(normalized_media)
    normalized_groups = []
    seen_group_hashes = set()
    for group in groups:
        if not isinstance(group, dict):
            raise BuildError("content groups must be mappings")
        digest = require_nonempty(group.get("sha256"), "content group SHA-256")
        if not SHA256_PATTERN.fullmatch(digest):
            raise BuildError("content group has an invalid SHA-256")
        if digest in seen_group_hashes:
            raise BuildError(f"duplicate content group SHA-256: {digest}")
        seen_group_hashes.add(digest)
        media_ids = group.get("media_ids")
        family_ids = group.get("family_ids")
        if not isinstance(media_ids, list) or not isinstance(family_ids, list):
            raise BuildError(f"content group {digest} is malformed")
        if not all(
            isinstance(media_id, int) and media_id > 0 for media_id in media_ids
        ):
            raise BuildError(f"content group {digest} has invalid media IDs")
        if len(media_ids) != len(set(media_ids)):
            raise BuildError(f"content group {digest} repeats media IDs")
        normalized_groups.append(
            {
                "family_ids": sorted(
                    require_slug(item, f"content group {digest} family")
                    for item in family_ids
                ),
                "media_ids": sorted(media_ids),
                "sha256": digest,
            }
        )
    normalized_groups.sort(key=lambda item: item["sha256"])
    if normalized_groups != expected_groups:
        raise BuildError("declared content groups do not match per-media hashes")

    observed_distinct = len(expected_groups)
    if value.get("byte_distinct_html") != observed_distinct:
        raise BuildError("content-addressing distinct count does not match hashes")
    if declared_distinct != observed_distinct:
        raise BuildError("source_stats distinct count does not match hashes")
    return normalized_media, expected_groups


def build_payloads(
    audit: dict, curation: dict, lessons_payload: dict, audit_bytes: bytes
) -> tuple[dict, dict]:
    verify_audit_bytes(audit, audit_bytes)
    if audit.get("schema") != AUDIT_SCHEMA:
        raise BuildError("unsupported Lost Apps audit schema")
    if curation.get("schema") != CURATION_SCHEMA:
        raise BuildError("unsupported Lost Apps curation schema")
    families = audit.get("families")
    taxonomy = audit.get("taxonomy")
    if not isinstance(families, list) or len(families) != EXPECTED_FAMILIES:
        raise BuildError(f"expected exactly {EXPECTED_FAMILIES} curated families")
    if not isinstance(taxonomy, list) or not taxonomy:
        raise BuildError("audit taxonomy must be a non-empty list")

    taxonomy_by_id = {}
    normalized_taxonomy = []
    for item in taxonomy:
        category_id = require_slug(item.get("id"), "taxonomy id")
        if category_id in taxonomy_by_id:
            raise BuildError(f"duplicate taxonomy id: {category_id}")
        normalized = {
            "description": require_nonempty(
                item.get("description"), f"{category_id} description"
            ),
            "id": category_id,
            "title": require_nonempty(item.get("title"), f"{category_id} title"),
        }
        taxonomy_by_id[category_id] = normalized
        normalized_taxonomy.append(normalized)

    lessons = load_lessons(lessons_payload)
    lesson_mappings = curation.get("lesson_mappings")
    related_by_category = curation.get("related_by_category")
    if not isinstance(lesson_mappings, dict) or not isinstance(
        related_by_category, dict
    ):
        raise BuildError("curation mappings are missing")
    if set(related_by_category) != set(taxonomy_by_id):
        raise BuildError("every taxonomy category needs one related-content link")

    seen_ids = set()
    seen_urls = set()
    seen_aliases = set()
    seen_media_ids = set()
    family_by_media = {}
    apps = []
    for position, family in enumerate(families, start=1):
        family_id = require_slug(family.get("id"), "family id")
        if family_id in seen_ids:
            raise BuildError(f"duplicate family id: {family_id}")
        seen_ids.add(family_id)
        source_url = validate_https_url(
            family.get("representative_url"), f"{family_id} representative URL"
        )
        if urlparse(source_url).netloc != "kodyw.com":
            raise BuildError(f"{family_id} source must preserve kodyw.com provenance")
        if source_url in seen_urls:
            raise BuildError(f"duplicate representative URL: {source_url}")
        seen_urls.add(source_url)

        category = require_nonempty(family.get("category"), f"{family_id} category")
        if category not in taxonomy_by_id:
            raise BuildError(f"{family_id} uses unknown category {category}")
        aliases = family.get("aliases")
        media_ids = family.get("media_ids")
        evidence = family.get("evidence")
        risks = family.get("risks")
        dependencies = family.get("dependencies")
        controls = family.get("observed_controls")
        technologies = family.get("technologies")
        acceptance_checks = family.get("acceptance_checks")
        for value, name in (
            (aliases, "aliases"),
            (media_ids, "media_ids"),
            (evidence, "evidence"),
            (risks, "risks"),
            (dependencies, "dependencies"),
            (controls, "observed_controls"),
            (technologies, "technologies"),
            (acceptance_checks, "acceptance_checks"),
        ):
            if not isinstance(value, list):
                raise BuildError(f"{family_id} {name} must be a list")
        if not aliases or not evidence or not controls or not acceptance_checks:
            raise BuildError(f"{family_id} is missing required evidence")
        normalized_aliases = [
            require_nonempty(item, f"{family_id} alias") for item in aliases
        ]
        duplicate_aliases = seen_aliases.intersection(normalized_aliases)
        if duplicate_aliases:
            raise BuildError(
                f"{family_id} reuses archived aliases: {sorted(duplicate_aliases)}"
            )
        seen_aliases.update(normalized_aliases)
        if not all(isinstance(media_id, int) and media_id > 0 for media_id in media_ids):
            raise BuildError(f"{family_id} media_ids must be positive integers")
        duplicate_media_ids = seen_media_ids.intersection(media_ids)
        if duplicate_media_ids:
            raise BuildError(
                f"{family_id} reuses WordPress media IDs: {sorted(duplicate_media_ids)}"
            )
        seen_media_ids.update(media_ids)
        family_by_media.update({media_id: family_id for media_id in media_ids})
        if family.get("safe_embed") is not False:
            raise BuildError(f"{family_id} unexpectedly permits historical embedding")

        lesson = None
        preview = {
            "kind": "record-only",
            "reason": "The verified audit does not approve the historical upload for embedding.",
        }
        related = [
            {
                "kind": "rapp-vision",
                "title": "Open the RAPP Vision production brief",
                "url": f"/lost-apps/rapp-vision/#{family_id}",
            },
            normalize_related_link(
                related_by_category[category], f"{category} related content"
            ),
        ]
        if family_id in lesson_mappings:
            lesson_id = lesson_mappings[family_id]
            if lesson_id not in lessons:
                raise BuildError(f"{family_id} maps to missing lesson {lesson_id}")
            source_lesson = lessons[lesson_id]
            if source_lesson.get("source_url") != source_url:
                raise BuildError(f"{family_id} lesson provenance does not match audit")
            lesson = {
                "demo_url": require_site_path(
                    source_lesson.get("demo_url"), f"{lesson_id} demo URL"
                ),
                "id": lesson_id,
                "lesson_url": require_site_path(
                    source_lesson.get("lesson_url"), f"{lesson_id} lesson URL"
                ),
                "title": require_nonempty(
                    source_lesson.get("title"), f"{lesson_id} title"
                ),
            }
            preview = {
                "kind": "clean-room",
                "reason": "An original local restoration is available in a strict sandbox.",
                "url": lesson["demo_url"],
            }
            related.insert(
                0,
                {
                    "kind": "lesson",
                    "title": lesson["title"],
                    "url": lesson["lesson_url"],
                },
            )

        readiness = require_nonempty(
            family.get("readiness"), f"{family_id} readiness"
        )
        app = {
            "acceptance_checks": [
                require_nonempty(item, f"{family_id} acceptance check")
                for item in acceptance_checks
            ],
            "aliases": normalized_aliases,
            "category": category,
            "category_title": taxonomy_by_id[category]["title"],
            "clean_room_prompt": require_nonempty(
                family.get("clean_room_prompt"), f"{family_id} clean-room prompt"
            ),
            "dependencies": [
                normalize_dependency(item, family_id) for item in dependencies
            ],
            "embed_notes": require_nonempty(
                family.get("embed_notes"), f"{family_id} embed notes"
            ),
            "evidence": [
                require_nonempty(item, f"{family_id} evidence") for item in evidence
            ],
            "id": family_id,
            "lesson": lesson,
            "media_ids": media_ids,
            "museum_blurb": require_nonempty(
                family.get("museum_blurb"), f"{family_id} museum blurb"
            ),
            "observed_controls": [
                require_nonempty(item, f"{family_id} observed control")
                for item in controls
            ],
            "observed_summary": require_nonempty(
                family.get("observed_summary"), f"{family_id} observed summary"
            ),
            "position": position,
            "preview": preview,
            "rapp_vision": normalize_brief(family),
            "readiness": readiness,
            "readiness_label": readiness_label(readiness),
            "related": related,
            "risk_level": risk_level(risks),
            "risks": risks,
            "source_url": source_url,
            "technologies": [
                require_nonempty(item, f"{family_id} technology")
                for item in technologies
            ],
            "title": require_nonempty(family.get("title"), f"{family_id} title"),
        }
        app["search_text"] = " ".join(
            (
                app["title"],
                " ".join(app["aliases"]),
                app["category_title"],
                app["observed_summary"],
                app["museum_blurb"],
                " ".join(app["technologies"]),
            )
        ).lower()
        apps.append(app)

    if set(lesson_mappings) - seen_ids:
        raise BuildError("curation maps an unknown family")

    source_stats = audit.get("source_stats")
    policies = audit.get("embedding_policy")
    if not isinstance(source_stats, dict) or not isinstance(policies, dict):
        raise BuildError("audit source statistics or embedding policy is missing")
    if source_stats.get("curated_application_families") != len(apps):
        raise BuildError("audit family count does not match curated records")
    media_integrity, content_groups = validate_content_addressing(
        audit.get("content_addressing"),
        family_by_media,
        source_stats.get("byte_distinct_html"),
        source_stats.get("html_attachments"),
    )
    integrity_by_family = {app["id"]: [] for app in apps}
    for record in media_integrity:
        integrity_by_family[record["family_id"]].append(record)
    for app in apps:
        app["media_integrity"] = integrity_by_family[app["id"]]
        family_urls = {record["source_url"] for record in app["media_integrity"]}
        if app["source_url"] not in family_urls:
            raise BuildError(
                f"{app['id']} representative URL has no content-addressed media record"
            )
    restored = sum(app["preview"]["kind"] == "clean-room" for app in apps)
    held = sum(app["readiness_label"] == "Context only" for app in apps)
    audit_digest = sha256_bytes(audit_bytes)
    museum = {
        "apps": apps,
        "generated_at": audit.get("generated_at"),
        "policies": policies,
        "schema": MUSEUM_SCHEMA,
        "source": {
            "audit_schema": audit["schema"],
            "audit_sha256": audit_digest,
            "content_addressing": {
                "byte_distinct_html": len(content_groups),
                "captured_at": audit["content_addressing"]["captured_at"],
                "content_groups": content_groups,
                "hash_algorithm": "sha256",
                "media_records": len(media_integrity),
                "schema": CONTENT_ADDRESSING_SCHEMA,
                "wordpress_api_endpoint": audit["content_addressing"][
                    "wordpress_api_endpoint"
                ],
            },
            "deduplication": source_stats.get("deduplication"),
            "scope": source_stats.get("scope"),
        },
        "stats": {
            "byte_distinct_html": source_stats.get("byte_distinct_html"),
            "curated_apps": len(apps),
            "historical_embeds_approved": 0,
            "html_attachments": source_stats.get("html_attachments"),
            "interactive_clean_room_restorations": restored,
            "record_only_exhibits": len(apps) - restored,
            "sensitive_context_only": held,
            "wordpress_media_reported": source_stats.get(
                "wordpress_api_reported_media"
            ),
        },
        "taxonomy": normalized_taxonomy,
    }
    briefs = {
        "briefs": [
            {
                "app_id": app["id"],
                "category": app["category"],
                "evidence": app["evidence"],
                "historical_source_url": app["source_url"],
                "hook": app["rapp_vision"]["hook"],
                "lesson_url": app["lesson"]["lesson_url"] if app["lesson"] else None,
                "production": {
                    "episode_16x9": {
                        "angle": app["rapp_vision"]["episode_16x9"],
                        "proof_shots": app["rapp_vision"]["proof_shots"],
                        "scene_beats": app["rapp_vision"]["scene_beats"],
                    },
                    "short_9x16": {
                        "angle": app["rapp_vision"]["short_9x16"],
                        "proof_shots": app["rapp_vision"]["proof_shots"][:3],
                    },
                },
                "claims_to_verify": app["rapp_vision"]["claims_to_verify"],
                "title": app["title"],
            }
            for app in apps
        ],
        "channel": {
            "id": "learnwithkody",
            "url": f"{SITE_URL}/rapp-vision/#/channel/learnwithkody",
        },
        "generated_at": audit.get("generated_at"),
        "museum_url": f"{SITE_URL}/lost-apps/",
        "schema": VISION_SCHEMA,
        "source_audit_sha256": audit_digest,
    }
    return museum, briefs


def build_from_paths() -> tuple[dict, dict]:
    audit_bytes = AUDIT_PATH.read_bytes()
    return build_payloads(
        json.loads(audit_bytes),
        load_yaml(CURATION_PATH),
        load_yaml(LESSONS_PATH),
        audit_bytes,
    )


def output_bytes() -> dict[Path, bytes]:
    museum, briefs = build_from_paths()
    museum_bytes = canonical_json(museum)
    return {
        MUSEUM_DATA_PATH: museum_bytes,
        MUSEUM_API_PATH: museum_bytes,
        VISION_API_PATH: canonical_json(briefs),
    }


def write_outputs(outputs: dict[Path, bytes], check: bool) -> None:
    stale = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(path.relative_to(ROOT).as_posix())
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    if stale:
        raise BuildError("stale generated files: " + ", ".join(stale))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if checked-in generated files differ from deterministic output",
    )
    args = parser.parse_args(argv)
    try:
        outputs = output_bytes()
        write_outputs(outputs, args.check)
    except (BuildError, json.JSONDecodeError, OSError, yaml.YAMLError) as error:
        print(f"Lost Apps build failed: {error}", file=sys.stderr)
        return 1
    verb = "verified" if args.check else "wrote"
    print(f"{verb} {len(outputs)} Lost Apps outputs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
