#!/usr/bin/env python3
"""Verify frozen Lost Apps evidence against public WordPress response bytes."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable
from urllib.parse import unquote, urlencode, urlparse

import build_lost_apps_museum as museum_builder


ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "kodyw-lost-apps-evidence-verifier/1.0"
DEFAULT_TIMEOUT = 60
DEFAULT_WORKERS = 8
EXPECTED_REPORTED_MEDIA = 193
EXPECTED_UNIQUE_MEDIA = 192
EXPECTED_HTML_MEDIA = 96
PAGE_SIZE = 100
SCOPE_DATE = "2025-03-24"
SCOPE_MIME_TYPE = "text/html"
SCOPE_HOST = "kodyw.com"
SCOPE_PATH_PREFIX = "/wp-content/uploads/2025/03/"
COLLECTION_FIELDS = "id,mime_type,source_url,date,slug"
FAMILY_BY_NORMALIZED_NAME = {
    "agent-workflow-system": "agent-workflow-system",
    "automated-actions-ui": "automated-actions",
    "complete-retroplay-console": "retroplay-console",
    "complete-retroplay-console-ios": "retroplay-console",
    "crm-questionnaire-viewer": "crm-questionnaire-viewer",
    "custom-copilot-ui": "mac-automated-actions",
    "emdr-complete": "emdr-therapy-assistant",
    "gameboy-clone": "retroplay-console",
    "improved-dashboard": "slipspace-business-dashboard",
    "index": "utility-apps-hub",
    "index_mac": "migration-assessment-copilot",
    "local-browser": "github-repository-viewer",
    "magentic-agents-ui": "magentic-copilot",
    "magentic-copilot": "magentic-copilot",
    "magnetic-agents-ui": "storytelling-workflows",
    "mermaid-viewer": "mermaid-diagram-viewer",
    "severance-refiner": "severance-refiner",
    "snake-2-game": "worm-game-deluxe",
    "splitspace": "slipspace-business-dashboard",
    "splitspace-copy": "slipspace-business-dashboard",
    "task-flow": "pomodoro-kanban-board",
    "task-tracker": "task-tracker",
    "teacher-learner": "dynamic-teaching-simulation",
    "teacher-learner-app": "teacher-learner-replay",
    "terminal-viewer": "terminal-log-visualizer",
    "workflow-executor-app": "agent-workflow-executor",
    "youtube-webcam-sync-fixed": "youtube-webcam-sync",
}
OpenUrl = Callable[..., object]


class EvidenceVerificationError(RuntimeError):
    pass


def response_status(response: object) -> int:
    status = getattr(response, "status", None)
    if status is None:
        status = response.getcode()
    return int(status)


def response_content_type(response: object) -> str:
    headers = getattr(response, "headers", None)
    if headers is None or not hasattr(headers, "get_content_type"):
        return ""
    return str(headers.get_content_type()).lower()


def open_public(
    url: str,
    accept: str,
    opener: OpenUrl,
    timeout: int,
) -> tuple[bytes, int, str, str, dict[str, str]]:
    request = urllib.request.Request(
        url,
        headers={"Accept": accept, "User-Agent": USER_AGENT},
    )
    with opener(request, timeout=timeout) as response:
        headers = {
            name: str(response.headers.get(name, ""))
            for name in ("X-WP-Total", "X-WP-TotalPages")
        }
        return (
            response.read(),
            response_status(response),
            response_content_type(response),
            response.geturl(),
            headers,
        )


def collection_url(api_endpoint: str, page: int) -> str:
    query = urlencode(
        (
            ("per_page", PAGE_SIZE),
            ("page", page),
            ("orderby", "id"),
            ("order", "asc"),
            ("_fields", COLLECTION_FIELDS),
        )
    )
    return f"{api_endpoint}?{query}"


def normalized_name(value: str, *, is_url: bool = False) -> str:
    if is_url:
        value = Path(unquote(urlparse(value).path)).name
    value = value.lower()
    if value.endswith(".html"):
        value = value[:-5]
    return re.sub(r"-\d+$", "", value)


def classify_family(metadata: dict) -> str:
    source_url = str(metadata.get("source_url") or "")
    slug = str(metadata.get("slug") or "")
    filename_key = normalized_name(source_url, is_url=True)
    slug_key = normalized_name(slug)
    filename_family = FAMILY_BY_NORMALIZED_NAME.get(filename_key)
    slug_family = FAMILY_BY_NORMALIZED_NAME.get(slug_key)
    if not filename_family or not slug_family:
        raise EvidenceVerificationError(
            f"media {metadata.get('id')} has an unmapped filename or slug"
        )
    if filename_family != slug_family:
        raise EvidenceVerificationError(
            f"media {metadata.get('id')} filename and slug map to different families"
        )
    return filename_family


def qualifies_for_audit(metadata: dict) -> bool:
    source_url = str(metadata.get("source_url") or "")
    parsed = urlparse(source_url)
    return (
        metadata.get("mime_type") == SCOPE_MIME_TYPE
        and str(metadata.get("date") or "")[:10] == SCOPE_DATE
        and parsed.scheme == "https"
        and parsed.netloc == SCOPE_HOST
        and parsed.path.startswith(SCOPE_PATH_PREFIX)
        and parsed.path.lower().endswith(".html")
    )


def positive_header(headers: dict[str, str], name: str, page: int) -> int:
    try:
        value = int(headers.get(name, ""))
    except ValueError as error:
        raise EvidenceVerificationError(
            f"collection page {page} has invalid {name}"
        ) from error
    if value < 1:
        raise EvidenceVerificationError(
            f"collection page {page} has invalid {name}"
        )
    return value


def discover_scoped_media(
    api_endpoint: str,
    source_stats: dict,
    *,
    opener: OpenUrl = urllib.request.urlopen,
    timeout: int = DEFAULT_TIMEOUT,
    expected_reported: int = EXPECTED_REPORTED_MEDIA,
    expected_unique: int = EXPECTED_UNIQUE_MEDIA,
    expected_qualifying: int = EXPECTED_HTML_MEDIA,
) -> list[dict]:
    if source_stats.get("wordpress_api_reported_media") != expected_reported:
        raise EvidenceVerificationError("frozen WordPress reported total changed")
    if source_stats.get("paginated_unique_media") != expected_unique:
        raise EvidenceVerificationError("frozen paginated unique total changed")
    if source_stats.get("html_attachments") != expected_qualifying:
        raise EvidenceVerificationError("frozen HTML attachment total changed")
    if source_stats.get("html_upload_date") != SCOPE_DATE:
        raise EvidenceVerificationError("frozen HTML scope date changed")

    all_media = []
    seen_ids = set()
    reported_total = None
    total_pages = None
    page = 1
    while total_pages is None or page <= total_pages:
        url = collection_url(api_endpoint, page)
        body, status, content_type, final_url, headers = open_public(
            url, "application/json", opener, timeout
        )
        if status != 200 or content_type != "application/json":
            raise EvidenceVerificationError(
                f"collection page {page} returned {status} {content_type}"
            )
        if final_url != url:
            raise EvidenceVerificationError(f"collection page {page} redirected")
        page_total = positive_header(headers, "X-WP-Total", page)
        page_count = positive_header(headers, "X-WP-TotalPages", page)
        if reported_total is None:
            reported_total = page_total
            total_pages = page_count
            expected_pages = (reported_total + PAGE_SIZE - 1) // PAGE_SIZE
            if total_pages != expected_pages:
                raise EvidenceVerificationError(
                    f"WordPress reported {total_pages} pages, expected {expected_pages}"
                )
        elif page_total != reported_total or page_count != total_pages:
            raise EvidenceVerificationError(
                "WordPress pagination totals changed between pages"
            )
        try:
            items = json.loads(body)
        except json.JSONDecodeError as error:
            raise EvidenceVerificationError(
                f"collection page {page} is not valid JSON"
            ) from error
        if not isinstance(items, list) or not items:
            raise EvidenceVerificationError(
                f"collection page {page} is empty or malformed"
            )
        for metadata in items:
            media_id = metadata.get("id") if isinstance(metadata, dict) else None
            if not isinstance(media_id, int) or media_id <= 0:
                raise EvidenceVerificationError(
                    f"collection page {page} has an invalid media ID"
                )
            if media_id in seen_ids:
                raise EvidenceVerificationError(
                    f"duplicate media ID {media_id} across collection pages"
                )
            seen_ids.add(media_id)
            all_media.append(metadata)
        page += 1

    if reported_total != expected_reported:
        raise EvidenceVerificationError(
            f"WordPress reported {reported_total} media, expected {expected_reported}"
        )
    if len(all_media) != expected_unique:
        raise EvidenceVerificationError(
            f"pagination returned {len(all_media)} unique media, expected {expected_unique}"
        )

    scoped = []
    for metadata in all_media:
        if not qualifies_for_audit(metadata):
            continue
        scoped.append(
            {
                "family_id": classify_family(metadata),
                "media_id": metadata["id"],
                "mime_type": metadata["mime_type"],
                "source_url": metadata["source_url"],
            }
        )
    scoped.sort(key=lambda item: item["media_id"])
    if len(scoped) != expected_qualifying:
        raise EvidenceVerificationError(
            f"collection contains {len(scoped)} qualifying HTML media, "
            f"expected {expected_qualifying}"
        )
    return scoped


def verify_record(
    expected: dict,
    canonical: dict,
    api_endpoint: str,
    opener: OpenUrl,
    timeout: int,
) -> dict:
    media_id = expected["media_id"]
    metadata_url = f"{api_endpoint}/{media_id}"
    metadata_bytes, status, content_type, final_url, _headers = open_public(
        metadata_url, "application/json", opener, timeout
    )
    if status != 200 or content_type != "application/json":
        raise EvidenceVerificationError(
            f"media {media_id} metadata returned {status} {content_type}"
        )
    if final_url != metadata_url:
        raise EvidenceVerificationError(f"media {media_id} metadata redirected")
    try:
        metadata = json.loads(metadata_bytes)
    except json.JSONDecodeError as error:
        raise EvidenceVerificationError(
            f"media {media_id} metadata is not valid JSON"
        ) from error
    if metadata.get("id") != media_id:
        raise EvidenceVerificationError(f"media {media_id} metadata ID changed")
    if metadata.get("mime_type") != "text/html":
        raise EvidenceVerificationError(
            f"media {media_id} is no longer declared text/html"
        )
    if metadata.get("source_url") != expected["source_url"]:
        raise EvidenceVerificationError(f"media {media_id} source URL changed")
    if metadata.get("source_url") != canonical["source_url"]:
        raise EvidenceVerificationError(
            f"media {media_id} detail differs from canonical collection"
        )
    if not qualifies_for_audit(metadata):
        raise EvidenceVerificationError(
            f"media {media_id} detail no longer meets audit scope"
        )
    if classify_family(metadata) != canonical["family_id"]:
        raise EvidenceVerificationError(
            f"media {media_id} detail family assignment changed"
        )

    body, status, content_type, final_url, _headers = open_public(
        expected["source_url"], "text/html", opener, timeout
    )
    if status != 200 or content_type != "text/html":
        raise EvidenceVerificationError(
            f"media {media_id} content returned {status} {content_type}"
        )
    if final_url != expected["source_url"]:
        raise EvidenceVerificationError(f"media {media_id} content redirected")
    if len(body) != expected["size_bytes"]:
        raise EvidenceVerificationError(f"media {media_id} byte size changed")
    digest = hashlib.sha256(body).hexdigest()
    if digest != expected["sha256"]:
        raise EvidenceVerificationError(f"media {media_id} SHA-256 changed")
    return {
        "family_id": canonical["family_id"],
        "media_id": media_id,
        "sha256": digest,
        "size_bytes": len(body),
        "source_url": expected["source_url"],
    }


def verify_online_records(
    expected_records: list[dict],
    expected_groups: list[dict],
    api_endpoint: str,
    canonical_records: list[dict],
    *,
    opener: OpenUrl = urllib.request.urlopen,
    timeout: int = DEFAULT_TIMEOUT,
    workers: int = DEFAULT_WORKERS,
) -> list[dict]:
    if workers < 1:
        raise EvidenceVerificationError("workers must be positive")
    expected_by_id = {record["media_id"]: record for record in expected_records}
    canonical_by_id = {record["media_id"]: record for record in canonical_records}
    if set(canonical_by_id) != set(expected_by_id):
        missing = sorted(set(expected_by_id) - set(canonical_by_id))
        extra = sorted(set(canonical_by_id) - set(expected_by_id))
        raise EvidenceVerificationError(
            f"qualifying media ID set changed; missing={missing}, extra={extra}"
        )
    for media_id, canonical in canonical_by_id.items():
        expected = expected_by_id[media_id]
        if canonical["family_id"] != expected["family_id"]:
            raise EvidenceVerificationError(
                f"media {media_id} family assignment changed"
            )
        if canonical["source_url"] != expected["source_url"]:
            raise EvidenceVerificationError(f"media {media_id} source URL changed")

    verified = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(
                verify_record,
                record,
                canonical_by_id[record["media_id"]],
                api_endpoint,
                opener,
                timeout,
            ): record["media_id"]
            for record in expected_records
        }
        for future in as_completed(futures):
            media_id = futures[future]
            try:
                verified.append(future.result())
            except Exception as error:
                if isinstance(error, EvidenceVerificationError):
                    raise
                raise EvidenceVerificationError(
                    f"media {media_id} verification failed: {error}"
                ) from error
    verified.sort(key=lambda item: item["media_id"])
    actual_groups = museum_builder.derive_content_groups(verified)
    if actual_groups != expected_groups:
        raise EvidenceVerificationError(
            "live response bytes do not reproduce the frozen content groups"
        )
    return verified


def verify_online_evidence(
    expected_records: list[dict],
    expected_groups: list[dict],
    source_stats: dict,
    api_endpoint: str,
    *,
    opener: OpenUrl = urllib.request.urlopen,
    timeout: int = DEFAULT_TIMEOUT,
    workers: int = DEFAULT_WORKERS,
    expected_reported: int = EXPECTED_REPORTED_MEDIA,
    expected_unique: int = EXPECTED_UNIQUE_MEDIA,
    expected_qualifying: int = EXPECTED_HTML_MEDIA,
) -> list[dict]:
    canonical_records = discover_scoped_media(
        api_endpoint,
        source_stats,
        opener=opener,
        timeout=timeout,
        expected_reported=expected_reported,
        expected_unique=expected_unique,
        expected_qualifying=expected_qualifying,
    )
    return verify_online_records(
        expected_records,
        expected_groups,
        api_endpoint,
        canonical_records,
        opener=opener,
        timeout=timeout,
        workers=workers,
    )


def load_frozen_evidence() -> tuple[list[dict], list[dict], dict, str]:
    museum, _briefs = museum_builder.build_from_paths()
    audit = json.loads(museum_builder.AUDIT_PATH.read_bytes())
    records = [
        record
        for app in museum["apps"]
        for record in app["media_integrity"]
    ]
    source = museum["source"]["content_addressing"]
    return (
        records,
        source["content_groups"],
        audit["source_stats"],
        source["wordpress_api_endpoint"],
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    args = parser.parse_args(argv)
    try:
        records, groups, source_stats, api_endpoint = load_frozen_evidence()
        verified = verify_online_evidence(
            records,
            groups,
            source_stats,
            api_endpoint,
            timeout=args.timeout,
            workers=args.workers,
        )
    except (
        EvidenceVerificationError,
        museum_builder.BuildError,
        OSError,
        ValueError,
    ) as error:
        print(f"Lost Apps evidence verification failed: {error}", file=sys.stderr)
        return 1
    print(
        f"verified {len(verified)} public media records and "
        f"{len(groups)} byte-distinct content groups"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
