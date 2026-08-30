#!/usr/bin/env python3
"""Verify frozen Lost Apps evidence against public WordPress response bytes."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable

import build_lost_apps_museum as museum_builder


ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "kodyw-lost-apps-evidence-verifier/1.0"
DEFAULT_TIMEOUT = 60
DEFAULT_WORKERS = 8
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
) -> tuple[bytes, int, str, str]:
    request = urllib.request.Request(
        url,
        headers={"Accept": accept, "User-Agent": USER_AGENT},
    )
    with opener(request, timeout=timeout) as response:
        return (
            response.read(),
            response_status(response),
            response_content_type(response),
            response.geturl(),
        )


def verify_record(
    expected: dict,
    api_endpoint: str,
    opener: OpenUrl,
    timeout: int,
) -> dict:
    media_id = expected["media_id"]
    metadata_url = f"{api_endpoint}/{media_id}"
    metadata_bytes, status, content_type, final_url = open_public(
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

    body, status, content_type, final_url = open_public(
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
        "family_id": expected["family_id"],
        "media_id": media_id,
        "sha256": digest,
        "size_bytes": len(body),
        "source_url": expected["source_url"],
    }


def verify_online_records(
    expected_records: list[dict],
    expected_groups: list[dict],
    api_endpoint: str,
    *,
    opener: OpenUrl = urllib.request.urlopen,
    timeout: int = DEFAULT_TIMEOUT,
    workers: int = DEFAULT_WORKERS,
) -> list[dict]:
    if workers < 1:
        raise EvidenceVerificationError("workers must be positive")
    verified = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(
                verify_record, record, api_endpoint, opener, timeout
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


def load_frozen_evidence() -> tuple[list[dict], list[dict], str]:
    museum, _briefs = museum_builder.build_from_paths()
    records = [
        record
        for app in museum["apps"]
        for record in app["media_integrity"]
    ]
    source = museum["source"]["content_addressing"]
    return records, source["content_groups"], source["wordpress_api_endpoint"]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    args = parser.parse_args(argv)
    try:
        records, groups, api_endpoint = load_frozen_evidence()
        verified = verify_online_records(
            records,
            groups,
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
