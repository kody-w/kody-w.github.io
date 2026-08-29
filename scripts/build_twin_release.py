#!/usr/bin/env python3
"""Build and pin the complete public-twin release atomically."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "api" / "twin-corpus.json"
APP_PATH = ROOT / "js" / "twin-app.js"
WORKER_PATH = ROOT / "twin" / "sw.js"
SHELL_MANIFEST_PATH = ROOT / "twin" / "shell-manifest.json"

SHELL_SOURCES = (
    "_config.yml",
    "_layouts/default.html",
    "twin/index.html",
    "twin/manifest.webmanifest",
    "twin/icon-192.png",
    "twin/icon-512.png",
    "twin/one-sentence-prompt.txt",
    "css/main.css",
    "js/theme.js",
    "js/twin-state.js",
    "js/twin-engine.js",
    "js/twin-controller.js",
    "js/twin-app.js",
    "favicon.ico",
    "apple-touch-icon.png",
)

STATIC_ASSETS = (
    (
        "/twin/manifest.webmanifest",
        "twin/manifest.webmanifest",
        ("application/manifest+json", "application/json"),
    ),
    ("/twin/icon-192.png", "twin/icon-192.png", ("image/png",)),
    ("/twin/icon-512.png", "twin/icon-512.png", ("image/png",)),
    (
        "/twin/one-sentence-prompt.txt",
        "twin/one-sentence-prompt.txt",
        ("text/plain",),
    ),
    ("/css/main.css", "css/main.css", ("text/css",)),
    (
        "/js/theme.js",
        "js/theme.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/js/twin-state.js",
        "js/twin-state.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/js/twin-engine.js",
        "js/twin-engine.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/js/twin-controller.js",
        "js/twin-controller.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/js/twin-app.js",
        "js/twin-app.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/favicon.ico",
        "favicon.ico",
        ("image/x-icon", "image/vnd.microsoft.icon"),
    ),
    ("/apple-touch-icon.png", "apple-touch-icon.png", ("image/png",)),
)

DOCUMENTS = (
    {
        "url": "/twin/",
        "contentTypes": ["text/html"],
        "requiredText": [
            'id="public-twin"',
            'http-equiv="Content-Security-Policy"',
        ],
    },
    {
        "url": "/twin/index.html",
        "contentTypes": ["text/html"],
        "requiredText": [
            'id="public-twin"',
            'http-equiv="Content-Security-Policy"',
        ],
    },
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_corpus_builder():
    path = ROOT / "scripts" / "build_twin.py"
    spec = importlib.util.spec_from_file_location("build_twin_release_corpus", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def replace_hash(source: str, declaration: str, value: str) -> str:
    pattern = re.compile(
        rf"({re.escape(declaration)}\s*=\s*(?:\n\s*)?['\"])[0-9a-f]{{64}}(['\"]\s*;)"
    )
    updated, count = pattern.subn(rf"\g<1>{value}\g<2>", source)
    if count != 1:
        raise RuntimeError(f"expected one {declaration} declaration, found {count}")
    return updated


def corpus_bytes(payload: dict) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, indent=2, separators=(",", ": "))
        + "\n"
    ).encode("utf-8")


def shell_source_hash(overrides: dict[str, bytes]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(SHELL_SOURCES):
        data = overrides.get(relative, (ROOT / relative).read_bytes())
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(data)
        digest.update(b"\0")
    return digest.hexdigest()


def shell_manifest_bytes(overrides: dict[str, bytes]) -> bytes:
    assets = []
    for url, relative, content_types in STATIC_ASSETS:
        data = overrides.get(relative, (ROOT / relative).read_bytes())
        assets.append(
            {
                "url": url,
                "sha256": sha256(data),
                "contentTypes": list(content_types),
            }
        )
    payload = {
        "schema": "kodyw-twin-shell/1.0",
        "sourceSha256": shell_source_hash(overrides),
        "documents": list(DOCUMENTS),
        "assets": assets,
    }
    return (
        json.dumps(payload, ensure_ascii=False, indent=2, separators=(",", ": "))
        + "\n"
    ).encode("utf-8")


def build_outputs() -> tuple[dict[Path, bytes], dict[str, str]]:
    corpus_builder = load_corpus_builder()
    corpus = corpus_builder.build(ROOT)
    expected_corpus = corpus_bytes(corpus)

    app = APP_PATH.read_text(encoding="utf-8")
    app = replace_hash(
        app,
        "const EXPECTED_CORPUS_SHA256",
        corpus["corpusSha256"],
    )
    app = replace_hash(
        app,
        "const EXPECTED_SOURCE_MANIFEST_SHA256",
        corpus["sourceManifestSha256"],
    )
    expected_app = app.encode("utf-8")

    overrides = {"js/twin-app.js": expected_app}
    expected_manifest = shell_manifest_bytes(overrides)
    shell_release = sha256(expected_manifest)

    worker = WORKER_PATH.read_text(encoding="utf-8")
    worker = replace_hash(
        worker,
        "var BASELINE_SOURCE_MANIFEST_SHA256",
        corpus["sourceManifestSha256"],
    )
    worker = replace_hash(
        worker,
        "var BASELINE_CORPUS_SHA256",
        corpus["corpusSha256"],
    )
    worker = replace_hash(
        worker,
        "var SHELL_RELEASE_SHA256",
        shell_release,
    )
    expected_worker = worker.encode("utf-8")

    return (
        {
            CORPUS_PATH: expected_corpus,
            APP_PATH: expected_app,
            SHELL_MANIFEST_PATH: expected_manifest,
            WORKER_PATH: expected_worker,
        },
        {
            "sourceManifestSha256": corpus["sourceManifestSha256"],
            "corpusSha256": corpus["corpusSha256"],
            "shellSourceSha256": shell_source_hash(overrides),
            "shellReleaseSha256": shell_release,
        },
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail unless every committed release artifact is current",
    )
    args = parser.parse_args(argv)

    outputs, hashes = build_outputs()
    stale = [
        path
        for path, expected in outputs.items()
        if not path.exists() or path.read_bytes() != expected
    ]
    if args.check:
        if stale:
            for path in stale:
                print(f"stale twin release artifact: {path}", file=sys.stderr)
            return 1
        print(
            "twin release is current: "
            f"corpus={hashes['corpusSha256']} "
            f"shell={hashes['shellReleaseSha256']}"
        )
        return 0

    for path, expected in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.read_bytes() == expected:
            continue
        path.write_bytes(expected)
        print(f"wrote {path.relative_to(ROOT)}")
    print(json.dumps(hashes, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
