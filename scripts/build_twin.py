#!/usr/bin/env python3
"""Build the deterministic public digital-twin corpus."""

from __future__ import annotations

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from typing import Any


NORMALIZATION_VERSION = "plain-text/1"
SCHEMA = "kodyw-public-twin/1.0"
DATE_PREFIX = re.compile(r"^(\d{4})-(\d{2})-(\d{2})-(.+)$")
FENCE = re.compile(r"^[ \t]{0,3}(`{3,}|~{3,})")
TABLE_DIVIDER = re.compile(
    r"^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$"
)
HTML_BLOCKS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "br",
    "dd",
    "details",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "section",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
}
HTML_NOISE = {"canvas", "code", "iframe", "noscript", "pre", "script", "style", "svg"}


class _TextExtractor(HTMLParser):
    """Extract visible text while discarding executable and code-heavy blocks."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        del attrs
        tag = tag.lower()
        if self.ignored:
            if tag in HTML_NOISE:
                self.ignored.append(tag)
            return
        if tag in HTML_NOISE:
            self.ignored.append(tag)
        elif tag in HTML_BLOCKS:
            self.parts.append("\n")

    def handle_startendtag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() in HTML_NOISE and self.ignored:
            self.ignored.pop()

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.ignored:
            if tag == self.ignored[-1]:
                self.ignored.pop()
            return
        if tag in HTML_BLOCKS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.ignored:
            self.parts.append(data)

    def text(self) -> str:
        return "".join(self.parts)


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _source_paths(root: Path) -> list[Path]:
    paths = list((root / "_posts").glob("*.md"))
    paths.extend((root / "_twin_posts").glob("*.md"))
    paths.append(root / "api" / "works.json")
    return sorted(paths, key=lambda path: path.relative_to(root).as_posix())


def _parse_scalar(raw: str) -> Any:
    value = raw.strip()
    if not value:
        return ""
    if value.startswith('"') and value.endswith('"'):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value[1:-1]
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1].replace("''", "'")
    if value.lower() in {"null", "~"}:
        return None
    return value


def _front_matter(source: str, source_path: str) -> tuple[dict[str, Any], str]:
    source = source.replace("\r\n", "\n").replace("\r", "\n")
    if source.startswith("\ufeff"):
        source = source[1:]
    lines = source.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{source_path}: missing front matter")

    end = next(
        (index for index, line in enumerate(lines[1:], 1) if line.strip() == "---"),
        None,
    )
    if end is None:
        raise ValueError(f"{source_path}: unterminated front matter")

    metadata: dict[str, Any] = {}
    for line in lines[1:end]:
        if not line or line[0].isspace() or ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = _parse_scalar(value)
    return metadata, "\n".join(lines[end + 1 :])


def _remove_fenced_code(markdown: str) -> str:
    output: list[str] = []
    closing: tuple[str, int] | None = None
    for line in markdown.splitlines():
        match = FENCE.match(line)
        if closing is None:
            if match:
                marker = match.group(1)
                closing = (marker[0], len(marker))
            else:
                output.append(line)
        elif match:
            marker = match.group(1)
            if marker[0] == closing[0] and len(marker) >= closing[1]:
                closing = None
    return "\n".join(output)


def _protect_inline_code(markdown: str) -> tuple[str, list[str]]:
    protected: list[str] = []
    pattern = re.compile(r"(?<!`)`([^`\n]+)`(?!`)")

    def replace(match: re.Match[str]) -> str:
        token = f"\x00TWININLINE{len(protected)}\x00"
        protected.append(match.group(1))
        return token

    return pattern.sub(replace, markdown), protected


def _strip_html(markdown: str) -> str:
    extractor = _TextExtractor()
    extractor.feed(markdown)
    extractor.close()
    return extractor.text()


def _plain_text(markdown: str) -> str:
    text = _remove_fenced_code(markdown)
    text = re.sub(r"{%\s*comment\s*%}.*?{%\s*endcomment\s*%}", "", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"{%.*?%}|{{.*?}}", "", text, flags=re.S)
    text, inline_code = _protect_inline_code(text)

    text = re.sub(r"<((?:https?://|mailto:)[^>\s]+)>", r"\1", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"!\[([^\]]*)\]\s*\[[^\]]*\]", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\s*\[[^\]]*\]", r"\1", text)
    text = re.sub(r"(?m)^\s*\[[^\]]+\]:\s+\S+.*$", "", text)
    text = _strip_html(text)

    for index, value in enumerate(inline_code):
        text = text.replace(f"\x00TWININLINE{index}\x00", value)

    cleaned: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or TABLE_DIVIDER.match(line):
            cleaned.append("")
            continue
        if re.fullmatch(r"(?:[-*_]\s*){3,}", line):
            cleaned.append("")
            continue
        line = re.sub(r"^#{1,6}\s+", "", line)
        line = re.sub(r"^(?:>\s*)+", "", line)
        line = re.sub(r"^(?:[-+*]|\d+[.)])\s+", "", line)
        if "|" in line and (line.startswith("|") or line.endswith("|")):
            line = " ".join(part.strip() for part in line.strip("|").split("|"))
        line = re.sub(
            r"\*\*(.+?)\*\*|__(.+?)__",
            lambda match: match.group(1) or match.group(2),
            line,
        )
        line = re.sub(r"~~(.+?)~~", r"\1", line)
        line = re.sub(r"(?<!\w)([*_])([^*_\n]+)\1(?!\w)", r"\2", line)
        line = re.sub(r"\\([\\`*{}\[\]()#+.!_|>-])", r"\1", line)
        line = re.sub(r"[ \t]+", " ", line).strip()
        if line:
            cleaned.append(html.unescape(line))

    paragraphs: list[str] = []
    current: list[str] = []
    for line in cleaned:
        if line:
            current.append(line)
        elif current:
            paragraphs.append("\n".join(current))
            current = []
    if current:
        paragraphs.append("\n".join(current))
    return "\n\n".join(paragraphs).strip()


def _post_record(root: Path, path: Path, source_type: str) -> dict[str, Any]:
    relative = path.relative_to(root).as_posix()
    raw = path.read_bytes()
    metadata, body = _front_matter(raw.decode("utf-8"), relative)
    filename = DATE_PREFIX.match(path.stem)
    if filename is None:
        raise ValueError(f"{relative}: filename must start with YYYY-MM-DD-")

    _, _, _, filename_slug = filename.groups()
    slug_value = metadata.get("slug")
    slug = str(slug_value) if slug_value not in {None, ""} else filename_slug
    title = metadata.get("title")
    date = metadata.get("date")
    if not isinstance(title, str) or not title:
        raise ValueError(f"{relative}: missing title")
    if not isinstance(date, str) or not date:
        raise ValueError(f"{relative}: missing date")
    published = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", date)
    if published is None:
        raise ValueError(f"{relative}: date must be YYYY-MM-DD")
    year, month, day = published.groups()
    text = _plain_text(body)
    if not text:
        raise ValueError(f"{relative}: normalized text is empty")

    prefix = "post" if source_type == "post" else "field-note"
    source_url = (
        f"/{year}/{month}/{day}/{slug}/"
        if source_type == "post"
        else f"/digital-twin/{slug}/"
    )
    return {
        "id": f"{prefix}:{slug}",
        "sourceType": source_type,
        "title": title,
        "date": date,
        "timeBasis": "published",
        "author": metadata.get("author"),
        "sourcePath": relative,
        "sourceUrl": source_url,
        "sourceSha256": _sha256(raw),
        "text": text,
    }


def _work_records(root: Path, path: Path) -> list[dict[str, Any]]:
    relative = path.relative_to(root).as_posix()
    raw = path.read_bytes()
    catalog = json.loads(raw.decode("utf-8"))
    source_hash = _sha256(raw)
    records: list[dict[str, Any]] = []

    for index, repository in enumerate(catalog["repos"]):
        description = repository["description"]
        if description:
            text = description
            pointer_field = "description"
        else:
            text = repository["name"]
            pointer_field = "name"
        records.append(
            {
                "id": f"work:{repository['full_name']}",
                "sourceType": "work",
                "title": repository["name"],
                "date": repository["created_at"],
                "timeBasis": "repository-created",
                "author": None,
                "sourcePath": relative,
                "sourceUrl": repository["url"],
                "sourceSha256": source_hash,
                "text": text,
                "structured": {
                    "pointer": f"/repos/{index}/{pointer_field}",
                    "value": text,
                },
            }
        )
    return records


def _canonical_json(value: Any) -> bytes:
    return json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")


def build(root: Path) -> dict[str, Any]:
    """Build and return the corpus for a repository root."""

    root = Path(root).resolve()
    paths = _source_paths(root)
    manifest: list[dict[str, str]] = []
    manifest_digest = hashlib.sha256()
    records: list[dict[str, Any]] = []

    for path in paths:
        relative = path.relative_to(root).as_posix()
        raw = path.read_bytes()
        source_hash = _sha256(raw)
        manifest.append({"path": relative, "sha256": source_hash})
        manifest_digest.update(relative.encode("utf-8"))
        manifest_digest.update(b"\0")
        manifest_digest.update(raw)
        manifest_digest.update(b"\0")

        if relative.startswith("_posts/"):
            records.append(_post_record(root, path, "post"))
        elif relative.startswith("_twin_posts/"):
            records.append(_post_record(root, path, "field_note"))
        else:
            records.extend(_work_records(root, path))

    records.sort(key=lambda record: record["id"])
    ids = {record["id"] for record in records}
    relations: list[dict[str, Any]] = []
    relation_from = "post:the-digital-twin-deployment-pattern"
    relation_to = "post:markdown-is-the-spec"
    if relation_from in ids and relation_to in ids:
        relations.append(
            {
                "from": relation_from,
                "to": relation_to,
                "relation": "qualifies",
                "terms": ["source", "truth"],
                "reason": (
                    "The two sources use source of truth at different system layers."
                ),
            }
        )

    stats = {
        "total": len(records),
        "post": sum(record["sourceType"] == "post" for record in records),
        "field_note": sum(
            record["sourceType"] == "field_note" for record in records
        ),
        "work": sum(record["sourceType"] == "work" for record in records),
    }
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "normalizationVersion": NORMALIZATION_VERSION,
        "sourceManifestSha256": manifest_digest.hexdigest(),
        "stats": stats,
        "sourceManifest": manifest,
        "relations": relations,
        "records": records,
    }
    payload["corpusSha256"] = _sha256(_canonical_json(payload))
    return payload


def _output_bytes(payload: dict[str, Any]) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, indent=2, separators=(",", ": "))
        + "\n"
    ).encode("utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="output path")
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit nonzero unless the output already matches exactly",
    )
    args = parser.parse_args(argv)

    root = Path(__file__).resolve().parents[1]
    output = args.output if args.output is not None else root / "api" / "twin-corpus.json"
    expected = _output_bytes(build(root))

    if args.check:
        try:
            actual = output.read_bytes()
        except FileNotFoundError:
            print(f"stale corpus: {output} does not exist", file=sys.stderr)
            return 1
        if actual != expected:
            print(f"stale corpus: rebuild {output}", file=sys.stderr)
            return 1
        print(f"corpus is current: {output}")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(expected)
    print(f"wrote {len(expected)} bytes to {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
