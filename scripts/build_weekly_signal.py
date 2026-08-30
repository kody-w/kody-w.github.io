#!/usr/bin/env python3
"""Build the deterministic Weekly Signal issue and archive."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin

import yaml


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
WORKS_PATH = ROOT / "api" / "works.json"
LESSONS_PATH = ROOT / "_data" / "lost_apps_lessons.yml"
CURRENT_DATA = ROOT / "_data" / "weekly_signal.json"
ARCHIVE_DATA = ROOT / "_data" / "weekly_signal_archive.json"
CURRENT_API = ROOT / "api" / "weekly-signal.json"
ARCHIVE_API = ROOT / "api" / "weekly-signal-archive.json"
SITE_URL = "https://kody-w.github.io"
SCHEMA = "kodyw-weekly-signal/1.0"
ARCHIVE_SCHEMA = "kodyw-weekly-signal-archive/1.0"


class BuildError(RuntimeError):
    pass


def canonical_json(value: object) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)
        + "\n"
    ).encode("utf-8")


def normalize_date(value: object) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        return date.fromisoformat(value[:10])
    raise BuildError(f"unsupported date value: {value!r}")


def plain_text_summary(value: object) -> str:
    text = str(value or "")
    text = text.replace("```", "")
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"(?<!\w)\*([^*\n]+)\*(?!\w)", r"\1", text)
    text = re.sub(r"(?<!\w)_([^_\n]+)_(?!\w)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return " ".join(html.unescape(text).split())


def parse_post(path: Path) -> dict:
    source = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", source, re.S)
    if not match:
        raise BuildError(f"{path} has no front matter")
    metadata = yaml.safe_load(match.group(1)) or {}
    published = normalize_date(metadata.get("date"))
    title = str(metadata.get("title") or "").strip()
    if not title:
        raise BuildError(f"{path} has no title")
    slug = path.stem[11:]
    description = str(metadata.get("description") or "").strip()
    if not description:
        body = match.group(2)
        paragraphs = [
            " ".join(block.split())
            for block in re.split(r"\n\s*\n", body)
            if block.strip()
            and not block.lstrip().startswith(("#", ">", "```", "|", "- "))
        ]
        description = paragraphs[0] if paragraphs else title
    description = plain_text_summary(description)
    return {
        "title": title,
        "date": published.isoformat(),
        "url": f"{SITE_URL}/{published:%Y/%m/%d}/{slug}/",
        "summary": description[:360],
        "tags": metadata.get("tags") or [],
    }


def load_posts(as_of: date) -> list[dict]:
    posts = [parse_post(path) for path in sorted(POSTS_DIR.glob("*.md"))]
    return sorted(
        (post for post in posts if date.fromisoformat(post["date"]) <= as_of),
        key=lambda post: (post["date"], post["title"]),
        reverse=True,
    )


def load_works(as_of: date) -> list[dict]:
    payload = json.loads(WORKS_PATH.read_text(encoding="utf-8"))
    works = [
        work
        for work in payload.get("repos", [])
        if normalize_date(work["pushed_at"]) <= as_of and not work.get("archived")
    ]
    return sorted(
        works,
        key=lambda work: (work["pushed_at"], work["name"]),
        reverse=True,
    )


def load_lessons() -> list[dict]:
    if not LESSONS_PATH.exists():
        raise BuildError(f"missing lesson registry: {LESSONS_PATH}")
    payload = yaml.safe_load(LESSONS_PATH.read_text(encoding="utf-8")) or {}
    if payload.get("schema") != "kodyw-lost-apps-lessons/1.0":
        raise BuildError("unsupported Lost Apps lesson schema")
    lessons = payload.get("lessons")
    if not isinstance(lessons, list) or not lessons:
        raise BuildError("Lost Apps lesson registry is empty")
    return sorted(lessons, key=lambda lesson: (lesson["order"], lesson["id"]))


def absolute_url(value: str) -> str:
    return urljoin(SITE_URL.rstrip("/") + "/", value.lstrip("/"))


def default_as_of(today: date) -> date:
    return today - timedelta(days=today.weekday() + 1)


def date_range_label(start: date, end: date) -> str:
    if start.year == end.year and start.month == end.month:
        return f"{start:%B} {start.day}–{end.day}, {end.year}"
    if start.year == end.year:
        return f"{start:%B} {start.day}–{end:%B} {end.day}, {end.year}"
    return f"{start:%B} {start.day}, {start.year}–{end:%B} {end.day}, {end.year}"


def rediscovered_post(posts: list[dict], week_start: date, issue_key: str) -> dict:
    eligible = [
        post
        for post in posts
        if date.fromisoformat(post["date"]) <= week_start - timedelta(days=60)
    ]
    if not eligible:
        raise BuildError("no older article is eligible for rediscovery")
    digest = hashlib.sha256(issue_key.encode("utf-8")).hexdigest()
    return eligible[int(digest[:12], 16) % len(eligible)]


def latest_edition(posts: list[dict], week_start: date, as_of: date) -> list[dict]:
    in_week = [
        post
        for post in posts
        if week_start <= date.fromisoformat(post["date"]) <= as_of
    ]
    if not in_week:
        return []
    edition_date = in_week[0]["date"]
    return [post for post in in_week if post["date"] == edition_date]


def render_link(url: str, label: str) -> str:
    return (
        f'<a href="{html.escape(url, quote=True)}">'
        f"{html.escape(label)}</a>"
    )


def render_content(issue: dict) -> str:
    sections = issue["sections"]
    by_kind = {section["kind"]: section for section in sections}
    edition = by_kind["date-edition"]
    active = by_kind["active-work"]
    rediscovered = by_kind["rediscovered"]
    lesson = by_kind["lost-app"]
    vision = by_kind["rapp-vision"]

    article_items = ""
    if edition["items"]:
        article_items = "<ul>" + "".join(
            f"<li>{render_link(item['url'], item['title'])}"
            f"<br><small>{html.escape(item['summary'])}</small></li>"
            for item in edition["items"]
        ) + "</ul>"
    work_items = "".join(
        f"<li>{render_link(item['url'], item['name'])}"
        f" — {html.escape(item['summary'])}</li>"
        for item in active["items"]
    )
    return "".join(
        (
            f"<h1>{html.escape(issue['title'])}</h1>",
            f"<p>{html.escape(issue['excerpt'])}</p>",
            "<h2>New in the archive</h2>",
            f"<p>{html.escape(edition['summary'])}</p>{article_items}",
            "<h2>Active builds</h2>",
            f"<ul>{work_items}</ul>",
            "<h2>Rediscovered</h2>",
            f"<p>{render_link(rediscovered['url'], rediscovered['title'])}"
            f" — {html.escape(rediscovered['summary'])}</p>",
            "<h2>Lost App → clean-room lesson</h2>",
            f"<p><strong>{html.escape(lesson['historical_title'])}</strong>: "
            f"{html.escape(lesson['summary'])}</p>",
            f"<p>{render_link(lesson['lesson_url'], 'Open the rebuild lesson')} · "
            f"{render_link(lesson['demo_url'], 'Run the local demo')}</p>",
            "<h2>RAPP Vision brief</h2>",
            f"<p><strong>{html.escape(vision['hook'])}</strong></p>",
            f"<p>{html.escape(vision['episode_16x9'])}</p>",
            f"<p><em>Short:</em> {html.escape(vision['short_9x16'])}</p>",
            "<hr>",
            f"<p>{render_link(f'{SITE_URL}/newsletter/#newsletter-signup', 'Subscribe to the next Weekly Signal')}</p>",
        )
    )


def build(root: Path, as_of: date) -> dict:
    del root
    if as_of.weekday() != 6:
        raise BuildError("Weekly Signal as_of must be a Sunday")
    iso_year, iso_week, _ = as_of.isocalendar()
    issue_key = f"{iso_year}-W{iso_week:02d}"
    week_start = as_of - timedelta(days=as_of.weekday())
    posts = load_posts(as_of)
    works = load_works(as_of)
    lessons = load_lessons()
    lesson = lessons[(iso_year * 53 + iso_week) % len(lessons)]
    edition_items = latest_edition(posts, week_start, as_of)
    edition_date = (
        date.fromisoformat(edition_items[0]["date"])
        if edition_items
        else None
    )
    rediscovered = rediscovered_post(posts, week_start, issue_key)
    active_works = works[:3]
    if len(active_works) < 3:
        raise BuildError("at least three active public repositories are required")

    title = f"Weekly Signal — {date_range_label(week_start, as_of)}"
    excerpt = (
        f"{len(edition_items)} new archive item"
        f"{'' if len(edition_items) == 1 else 's'}, "
        f"{len(active_works)} active builds, and a clean-room rebuild of "
        f"{lesson['historical_title']}."
    )
    issue = {
        "schema": SCHEMA,
        "issue_id": issue_key,
        "issue_number": iso_week,
        "title": title,
        "slug": f"weekly-signal-{iso_year}-w{iso_week:02d}",
        "as_of": as_of.isoformat(),
        "week_start": week_start.isoformat(),
        "date": f"{as_of.isoformat()}T00:00:00",
        "date_gmt": f"{as_of.isoformat()}T00:00:00",
        "excerpt": excerpt,
        "stats": {
            "new_articles": len(edition_items),
            "active_builds": len(active_works),
            "lesson_id": lesson["id"],
        },
        "sections": [
            {
                "kind": "date-edition",
                "title": (
                    f"{edition_date:%B} {edition_date.day}, {edition_date.year}"
                    if edition_date
                    else "No new articles this week"
                ),
                "summary": (
                    (
                        f"The latest publication date gathers "
                        f"{len(edition_items)} article"
                        f"{'' if len(edition_items) == 1 else 's'}."
                    )
                    if edition_items
                    else "No articles were published during this completed week."
                ),
                "url": (
                    f"{SITE_URL}/newsletter/#edition-{edition_date.isoformat()}"
                    if edition_date
                    else f"{SITE_URL}/newsletter/"
                ),
                "items": edition_items,
            },
            {
                "kind": "active-work",
                "title": "Active builds",
                "summary": "The public repositories moving most recently.",
                "url": f"{SITE_URL}/work/",
                "items": [
                    {
                        "name": work["name"],
                        "url": work["url"],
                        "summary": plain_text_summary(
                            work.get("description")
                            or "Public source repository."
                        ),
                        "pushed_at": work["pushed_at"],
                    }
                    for work in active_works
                ],
            },
            {
                "kind": "rediscovered",
                "title": rediscovered["title"],
                "summary": rediscovered["summary"],
                "url": rediscovered["url"],
                "published": rediscovered["date"],
            },
            {
                "kind": "lost-app",
                "lesson_id": lesson["id"],
                "title": lesson["title"],
                "historical_title": lesson["historical_title"],
                "summary": lesson["museum_blurb"],
                "lesson_url": absolute_url(lesson["lesson_url"]),
                "demo_url": absolute_url(lesson["demo_url"]),
                "source_url": lesson["source_url"],
            },
            {
                "kind": "rapp-vision",
                "lesson_id": lesson["id"],
                **lesson["rapp_vision"],
            },
        ],
    }
    issue["content_html"] = render_content(issue)
    return issue


def load_archive(path: Path = ARCHIVE_DATA) -> dict:
    if not path.exists():
        return {"schema": ARCHIVE_SCHEMA, "issues": []}
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") != ARCHIVE_SCHEMA:
        raise BuildError("unsupported Weekly Signal archive schema")
    if not isinstance(payload.get("issues"), list):
        raise BuildError("Weekly Signal archive issues must be a list")
    return payload


def update_archive(archive: dict, issue: dict) -> dict:
    issues = [
        existing
        for existing in archive["issues"]
        if existing.get("slug") != issue["slug"]
    ]
    issues.append(issue)
    issues.sort(key=lambda item: (item["date"], item["slug"]), reverse=True)
    return {"schema": ARCHIVE_SCHEMA, "issues": issues[:52]}


def reject_backdated_current(as_of: date, path: Path = CURRENT_DATA) -> None:
    if not path.exists():
        return
    current = json.loads(path.read_text(encoding="utf-8"))
    current_as_of = date.fromisoformat(current["as_of"])
    if as_of < current_as_of:
        raise BuildError(
            f"refusing to move Weekly Signal backward from "
            f"{current_as_of.isoformat()} to {as_of.isoformat()}"
        )


def reject_incomplete_week(as_of: date, today: date) -> None:
    latest_completed = default_as_of(today)
    if as_of > latest_completed:
        raise BuildError(
            f"refusing incomplete Weekly Signal date {as_of.isoformat()}; "
            f"latest completed Sunday is {latest_completed.isoformat()}"
        )


def expected_outputs(as_of: date) -> dict[Path, bytes]:
    issue = build(ROOT, as_of)
    archive = update_archive(load_archive(), issue)
    return {
        CURRENT_DATA: canonical_json(issue),
        CURRENT_API: canonical_json(issue),
        ARCHIVE_DATA: canonical_json(archive),
        ARCHIVE_API: canonical_json(archive),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args(argv)
    try:
        today = datetime.now(timezone.utc).date()
        as_of = (
            date.fromisoformat(args.as_of)
            if args.as_of
            else default_as_of(today)
        )
        reject_incomplete_week(as_of, today)
        reject_backdated_current(as_of)
        outputs = expected_outputs(as_of)
    except (BuildError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1
    stale = [
        path
        for path, expected in outputs.items()
        if not path.exists() or path.read_bytes() != expected
    ]
    if args.check:
        if stale:
            for path in stale:
                print(f"stale Weekly Signal artifact: {path}", file=sys.stderr)
            return 1
        print(f"Weekly Signal is current: {as_of.isoformat()}")
        return 0
    for path, expected in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.read_bytes() == expected:
            continue
        path.write_bytes(expected)
        print(f"wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
