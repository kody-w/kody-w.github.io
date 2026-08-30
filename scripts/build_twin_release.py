#!/usr/bin/env python3
"""Build and pin the complete public-twin release atomically."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "api" / "twin-corpus.json"
APP_PATH = ROOT / "js" / "twin-app.js"
PAGE_PATH = ROOT / "public-twin" / "index.html"
TRIBUNAL_PAGE_PATH = ROOT / "public-twin" / "tribunal" / "index.html"
TRIBUNAL_RECEIPT_PATH = ROOT / "api" / "frame-06-evidence-tribunal.json"
TRIBUNAL_BUILDER_PATH = ROOT / "scripts" / "build_frame_06_evidence_tribunal.js"
WORKER_PATH = ROOT / "public-twin" / "sw.js"
SHELL_MANIFEST_PATH = ROOT / "public-twin" / "shell-manifest.json"
RENDER_PATH = ROOT / ".twin-release-render"
RENDER_CLOCK_PATH = ROOT / ".twin-release-clock.yml"
JEKYLL_COMMAND = ("bundle", "exec", "jekyll")
DOCUMENT_MARKER = re.compile(
    r'(data-twin-document-sha256=")[0-9a-f]{64}(")'
)
DOCUMENT_MARKER_PREFIX = b'data-twin-document-sha256="'
HEX_BYTES = frozenset(b"0123456789abcdef")
RELEASE_OUTPUT_PATHS = (
    CORPUS_PATH,
    APP_PATH,
    PAGE_PATH,
    TRIBUNAL_PAGE_PATH,
    TRIBUNAL_RECEIPT_PATH,
    SHELL_MANIFEST_PATH,
    WORKER_PATH,
)

SHELL_SOURCES = (
    "Gemfile",
    "Gemfile.lock",
    "_config.yml",
    "_data/design_constitution.yml",
    "_layouts/default.html",
    "public-twin/index.html",
    "public-twin/tribunal/index.html",
    "public-twin/manifest.webmanifest",
    "public-twin/icon-192.png",
    "public-twin/icon-512.png",
    "public-twin/one-sentence-prompt.txt",
    "css/main.css",
    "css/frame-06-evidence-tribunal.css",
    "js/theme.js",
    "js/twin-state.js",
    "js/twin-engine.js",
    "js/twin-controller.js",
    "js/twin-app.js",
    "js/frame-06-evidence-tribunal.js",
    "js/frame-06-evidence-tribunal-app.js",
    "api/frame-06-evidence-tribunal.json",
    "favicon.ico",
    "apple-touch-icon.png",
)

STATIC_ASSETS = (
    (
        "/public-twin/manifest.webmanifest",
        "public-twin/manifest.webmanifest",
        ("application/manifest+json", "application/json"),
    ),
    (
        "/public-twin/icon-192.png",
        "public-twin/icon-192.png",
        ("image/png",),
    ),
    (
        "/public-twin/icon-512.png",
        "public-twin/icon-512.png",
        ("image/png",),
    ),
    (
        "/public-twin/one-sentence-prompt.txt",
        "public-twin/one-sentence-prompt.txt",
        ("text/plain",),
    ),
    (
        "/api/frame-06-evidence-tribunal.json",
        "api/frame-06-evidence-tribunal.json",
        ("application/json",),
    ),
    ("/css/main.css", "css/main.css", ("text/css",)),
    (
        "/css/frame-06-evidence-tribunal.css",
        "css/frame-06-evidence-tribunal.css",
        ("text/css",),
    ),
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
        "/js/frame-06-evidence-tribunal.js",
        "js/frame-06-evidence-tribunal.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/js/frame-06-evidence-tribunal-app.js",
        "js/frame-06-evidence-tribunal-app.js",
        ("text/javascript", "application/javascript"),
    ),
    (
        "/favicon.ico",
        "favicon.ico",
        ("image/x-icon", "image/vnd.microsoft.icon"),
    ),
    ("/apple-touch-icon.png", "apple-touch-icon.png", ("image/png",)),
)

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def release_output_paths() -> tuple[str, ...]:
    return tuple(
        path.relative_to(ROOT).as_posix()
        for path in RELEASE_OUTPUT_PATHS
    )


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


def canonical_document_bytes(rendered: bytes) -> bytes:
    rendered.decode("utf-8", errors="strict")
    normalized = bytearray(rendered)
    positions = []
    start = 0
    while True:
        marker = rendered.find(DOCUMENT_MARKER_PREFIX, start)
        if marker < 0:
            break
        digest_start = marker + len(DOCUMENT_MARKER_PREFIX)
        digest_end = digest_start + 64
        if (
            digest_end < len(rendered)
            and rendered[digest_end:digest_end + 1] == b'"'
            and all(value in HEX_BYTES for value in rendered[digest_start:digest_end])
        ):
            positions.append((digest_start, digest_end))
        start = marker + 1
    if len(positions) != 1:
        raise RuntimeError(
            "expected one rendered document release marker, "
            f"found {len(positions)}"
        )
    digest_start, digest_end = positions[0]
    normalized[digest_start:digest_end] = b"0" * 64
    return bytes(normalized)


def render_twin_documents(
    site_time: str | None = None,
) -> dict[str, bytes]:
    shutil.rmtree(RENDER_PATH, ignore_errors=True)
    try:
        command = [
            *JEKYLL_COMMAND,
            "build",
            "--destination",
            str(RENDER_PATH),
            "--disable-disk-cache",
            "--quiet",
        ]
        if site_time is not None:
            RENDER_CLOCK_PATH.write_text(
                f'time: "{site_time}"\n',
                encoding="utf-8",
            )
            command.extend([
                "--config",
                f"_config.yml,{RENDER_CLOCK_PATH.name}",
            ])
        environment = {**os.environ, "JEKYLL_ENV": "production"}
        result = subprocess.run(
            command,
            cwd=ROOT,
            env=environment,
            text=True,
            capture_output=True,
        )
        if result.returncode:
            raise RuntimeError(
                "failed to render Twin documents with Jekyll: "
                + (result.stderr or result.stdout)
            )
        return {
            "public-twin/index.html":
                (RENDER_PATH / "public-twin" / "index.html").read_bytes(),
            "public-twin/tribunal/index.html":
                (RENDER_PATH / "public-twin" / "tribunal" / "index.html")
                .read_bytes(),
        }
    finally:
        shutil.rmtree(RENDER_PATH, ignore_errors=True)
        RENDER_CLOCK_PATH.unlink(missing_ok=True)


def document_contract(
    page_source: str,
    rendered: bytes,
) -> tuple[str, bytes]:
    value = sha256(canonical_document_bytes(rendered))
    updated = DOCUMENT_MARKER.sub(
        r"\g<1>" + value + r"\g<2>",
        page_source,
    ).encode("utf-8")
    return value, updated


def document_specs(
    document_sha256: str,
    tribunal_document_sha256: str,
) -> list[dict]:
    public_twin_required = [
        f'data-twin-document-sha256="{document_sha256}"',
        'id="public-twin"',
        'id="twin-question-form"',
        'id="twin-question"',
        'id="twin-results"',
        'http-equiv="Content-Security-Policy"',
        "/js/twin-app.js",
    ]
    tribunal_required = [
        f'data-twin-document-sha256="{tribunal_document_sha256}"',
        'id="evidence-tribunal"',
        'id="tribunal-form"',
        'id="tribunal-result-status"',
        'http-equiv="Content-Security-Policy"',
        "/js/frame-06-evidence-tribunal.js",
        "/js/frame-06-evidence-tribunal-app.js",
    ]
    documents = [
        {
            "url": url,
            "contentTypes": ["text/html"],
            "normalization": "twin-html-sha256/1",
            "sha256": document_sha256,
            "requiredText": public_twin_required,
        }
        for url in ("/public-twin/", "/public-twin/index.html")
    ]
    documents.extend(
        {
            "url": url,
            "contentTypes": ["text/html"],
            "normalization": "twin-html-sha256/1",
            "sha256": tribunal_document_sha256,
            "requiredText": tribunal_required,
        }
        for url in (
            "/public-twin/tribunal/",
            "/public-twin/tribunal/index.html",
        )
    )
    return documents


def release_binding_sha256(
    overrides: dict[str, bytes],
    corpus: dict,
) -> str:
    sources = []
    for relative in sorted(SHELL_SOURCES):
        if relative == "api/frame-06-evidence-tribunal.json":
            continue
        data = overrides.get(relative, (ROOT / relative).read_bytes())
        sources.append({"path": relative, "sha256": sha256(data)})
    payload = {
        "schema": "kodyw-twin-release-binding/1.0",
        "sourceManifestSha256": corpus["sourceManifestSha256"],
        "corpusSha256": corpus["corpusSha256"],
        "sources": sources,
    }
    canonical = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha256(canonical)


def tribunal_receipt_bytes(corpus: dict, release_sha256: str) -> bytes:
    envelope = json.dumps(
        {
            "corpus": corpus,
            "releaseSha256": release_sha256,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    )
    result = subprocess.run(
        [
            "node",
            str(TRIBUNAL_BUILDER_PATH),
            "--stdin",
            "--stdout",
        ],
        cwd=ROOT,
        input=envelope,
        text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(
            "failed to build Frame 06 receipt: "
            + (result.stderr or result.stdout)
        )
    return result.stdout.encode("utf-8")


def shell_manifest_bytes(
    overrides: dict[str, bytes],
    document_sha256: str,
    tribunal_document_sha256: str,
    release_sha256: str,
) -> bytes:
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
        "releaseSha256": release_sha256,
        "sourceSha256": shell_source_hash(overrides),
        "documents": document_specs(
            document_sha256,
            tribunal_document_sha256,
        ),
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

    rendered_documents = render_twin_documents()
    document_sha256, expected_page = document_contract(
        PAGE_PATH.read_text(encoding="utf-8"),
        rendered_documents["public-twin/index.html"],
    )
    tribunal_document_sha256, expected_tribunal_page = document_contract(
        TRIBUNAL_PAGE_PATH.read_text(encoding="utf-8"),
        rendered_documents["public-twin/tribunal/index.html"],
    )
    overrides = {
        "js/twin-app.js": expected_app,
        "public-twin/index.html": expected_page,
        "public-twin/tribunal/index.html": expected_tribunal_page,
    }
    release_sha256 = release_binding_sha256(overrides, corpus)
    expected_receipt = tribunal_receipt_bytes(corpus, release_sha256)
    overrides["api/frame-06-evidence-tribunal.json"] = expected_receipt
    expected_manifest = shell_manifest_bytes(
        overrides,
        document_sha256,
        tribunal_document_sha256,
        release_sha256,
    )
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

    outputs = {
        CORPUS_PATH: expected_corpus,
        APP_PATH: expected_app,
        PAGE_PATH: expected_page,
        TRIBUNAL_PAGE_PATH: expected_tribunal_page,
        TRIBUNAL_RECEIPT_PATH: expected_receipt,
        SHELL_MANIFEST_PATH: expected_manifest,
        WORKER_PATH: expected_worker,
    }
    if tuple(outputs) != RELEASE_OUTPUT_PATHS:
        raise RuntimeError("release output inventory does not match build outputs")
    return (
        outputs,
        {
            "sourceManifestSha256": corpus["sourceManifestSha256"],
            "corpusSha256": corpus["corpusSha256"],
            "shellSourceSha256": shell_source_hash(overrides),
            "shellReleaseSha256": shell_release,
            "releaseSha256": release_sha256,
            "documentSha256": document_sha256,
            "tribunalDocumentSha256": tribunal_document_sha256,
        },
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail unless every committed release artifact is current",
    )
    parser.add_argument(
        "--list-outputs",
        action="store_true",
        help="print every repository-relative artifact produced by the build",
    )
    args = parser.parse_args(argv)

    if args.list_outputs:
        print("\n".join(release_output_paths()))
        return 0

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
