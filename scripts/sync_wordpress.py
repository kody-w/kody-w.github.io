#!/usr/bin/env python3
"""Mirror approved GitHub Pages content into WordPress as drafts.

The deployed GitHub Pages site is the canary. This tool reads that rendered
output and creates or updates WordPress drafts by slug. It never publishes
content.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SURFACES_FILE = ROOT / "wordpress" / "surfaces.json"
POSTS_DIR = ROOT / "_posts"
DEFAULT_WP_URL = "https://kodyw.com"
EXPECTED_ROLE = "kodyw_draft_sync"


class SyncError(RuntimeError):
    pass


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


@dataclass(frozen=True)
class LocalPost:
    path: Path
    title: str
    slug: str
    date: str
    date_gmt: str
    source_path: str
    excerpt: str


class ArticleExtractor(HTMLParser):
    """Capture the inner HTML of article.post-content."""

    VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.depth = 0
        self.capturing = False
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = dict(attrs).get("class", "") or ""
        if not self.capturing and tag == "article" and "post-content" in classes.split():
            self.capturing = True
            self.depth = 1
            return
        if self.capturing:
            self.parts.append(self.get_starttag_text())
            if tag not in self.VOID_TAGS:
                self.depth += 1

    def handle_startendtag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if self.capturing:
            self.parts.append(self.get_starttag_text())

    def handle_endtag(self, tag: str) -> None:
        if not self.capturing:
            return
        self.depth -= 1
        if self.depth == 0:
            self.capturing = False
            return
        self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        if self.capturing:
            self.parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if self.capturing:
            self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self.capturing:
            self.parts.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        if self.capturing:
            self.parts.append(f"<!--{data}-->")


class RootUrlRewriter(HTMLParser):
    """Make real root-relative tag attributes point at the source site."""

    ATTR_PATTERN = re.compile(
        r"""(\s(?:href|src|poster|action)\s*=\s*["'])/(?!/)""",
        re.IGNORECASE,
    )

    def __init__(self, source_base: str) -> None:
        super().__init__(convert_charrefs=False)
        self.source_base = source_base.rstrip("/")
        self.parts: list[str] = []

    def rewrite_tag(self, raw: str) -> str:
        return self.ATTR_PATTERN.sub(
            lambda match: match.group(1) + self.source_base + "/",
            raw,
        )

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.parts.append(self.rewrite_tag(self.get_starttag_text()))

    def handle_startendtag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        self.parts.append(self.rewrite_tag(self.get_starttag_text()))

    def handle_endtag(self, tag: str) -> None:
        self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_entityref(self, name: str) -> None:
        self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.parts.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        self.parts.append(f"<!--{data}-->")


def extract_article(page_html: str) -> str:
    parser = ArticleExtractor()
    parser.feed(page_html)
    content = "".join(parser.parts).strip()
    if not content:
        raise SyncError("rendered page did not contain article.post-content")
    return content


def absolutize_urls(fragment: str, source_base: str) -> str:
    parser = RootUrlRewriter(source_base)
    parser.feed(fragment)
    return "".join(parser.parts)


def parse_front_matter(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise SyncError(f"{path} has no front matter")
    closing = text.find("\n---\n", 4)
    if closing < 0:
        raise SyncError(f"{path} has unterminated front matter")
    raw = text[4:closing]
    body = text[closing + 5 :]
    values: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()
    return values, body


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def local_post(path: Path) -> LocalPost:
    front_matter, body = parse_front_matter(path)
    title = unquote(front_matter.get("title", ""))
    date = front_matter.get("date", "")[:10]
    if not title or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise SyncError(f"{path} needs title and YYYY-MM-DD date")
    slug = path.stem[11:]
    source_path = f"/{date[:4]}/{date[5:7]}/{date[8:10]}/{slug}/"
    description = unquote(front_matter.get("description", ""))
    if not description:
        paragraphs = [
            " ".join(block.split())
            for block in re.split(r"\n\s*\n", body)
            if block.strip()
            and not block.lstrip().startswith(("#", ">", "```", "|", "- "))
        ]
        description = paragraphs[0][:300] if paragraphs else ""
    local_midnight = f"{date}T00:00:00"
    return LocalPost(
        path=path,
        title=title,
        slug=slug,
        date=local_midnight,
        date_gmt=local_midnight,
        source_path=source_path,
        excerpt=description,
    )


def linked_page_content(title: str, summary: str, source_url: str) -> str:
    safe_title = html.escape(title)
    safe_summary = html.escape(summary)
    safe_url = html.escape(source_url, quote=True)
    return (
        f"<section><h2>{safe_title}</h2><p>{safe_summary}</p>"
        f'<p><a href="{safe_url}">Open the canonical live page</a></p>'
        "<p><small>This draft intentionally links to the tested GitHub Pages "
        "surface instead of embedding executable content.</small></p></section>"
    )


def fetch_text(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "kodyw-wordpress-sync/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:500]
        raise SyncError(f"source HTTP {error.code} for {url}: {detail}") from error
    except urllib.error.URLError as error:
        raise SyncError(f"could not reach source {url}: {error.reason}") from error


class WordPressClient:
    def __init__(self, url: str, user: str, password: str) -> None:
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise SyncError("WP_URL must be an absolute HTTPS URL")
        self.url = url.rstrip("/")
        self.user = user
        self.password = password
        self.opener = urllib.request.build_opener(NoRedirectHandler())

    @classmethod
    def from_environment(cls) -> "WordPressClient":
        url = (os.environ.get("WP_URL") or DEFAULT_WP_URL).strip()
        user = (os.environ.get("WP_USER") or "").strip()
        password = (os.environ.get("WP_APP_PASSWORD") or "").strip()
        missing = [
            name
            for name, value in (("WP_USER", user), ("WP_APP_PASSWORD", password))
            if not value
        ]
        if missing:
            raise SyncError("missing environment variable(s): " + ", ".join(missing))
        return cls(url, user, password)

    def request(
        self,
        method: str,
        path: str,
        payload: dict | None = None,
    ) -> object:
        endpoint = f"{self.url}/wp-json/{path.lstrip('/')}"
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(endpoint, data=data, method=method)
        token = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        request.add_header("Authorization", "Basic " + token)
        request.add_header("Content-Type", "application/json")
        request.add_header("User-Agent", "kodyw-wordpress-sync/1.0")
        try:
            with self.opener.open(request, timeout=60) as response:
                return json.loads(response.read().decode() or "{}")
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:1000]
            if 300 <= error.code < 400:
                raise SyncError(
                    f"WordPress redirect refused ({error.code}) for {endpoint}"
                ) from error
            raise SyncError(f"WordPress HTTP {error.code}: {detail}") from error
        except urllib.error.URLError as error:
            raise SyncError(f"could not reach WordPress: {error.reason}") from error

    def whoami(self) -> dict:
        result = self.request("GET", "kodyw/v1/status")
        if not isinstance(result, dict):
            raise SyncError("unexpected draft-sync status response")
        if result.get("schema") != "kodyw-draft-sync/1.0":
            raise SyncError("unsupported WordPress draft-sync plugin schema")
        if result.get("role") != EXPECTED_ROLE or result.get("safe") is not True:
            raise SyncError(
                f"WordPress account must use only the {EXPECTED_ROLE} role"
            )
        return result

    def save(
        self,
        kind: str,
        slug: str,
        payload: dict,
    ) -> str:
        if payload.get("slug") != slug:
            raise SyncError(f"{kind}:{slug}: payload slug does not match")
        post_type = {"posts": "post", "pages": "page"}.get(kind)
        if not post_type:
            raise SyncError(f"unsupported WordPress kind: {kind}")
        result = self.request(
            "POST",
            "kodyw/v1/drafts",
            {"kind": post_type, **payload},
        )
        if not isinstance(result, dict) or result.get("schema") != "kodyw-draft-sync/1.0":
            raise SyncError(f"{kind}:{slug}: unexpected draft-sync response")
        if result.get("created") is False:
            return (
                f"{kind}:{slug}: skipped existing {result.get('status')} "
                f"item {result.get('id')}"
            )
        if result.get("created") is not True or result.get("status") != "draft":
            raise SyncError(f"{kind}:{slug}: create did not remain a draft")
        if result.get("slug") != slug:
            raise SyncError(
                f"{kind}:{slug}: WordPress returned colliding slug "
                f"{result.get('slug')!r}"
            )
        return f"{kind}:{slug}: created draft item {result['id']}"


def load_surfaces(path: Path = SURFACES_FILE) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema") != "kodyw-wordpress-surfaces/1.0":
        raise SyncError("unsupported WordPress surfaces schema")
    return payload


def select_posts(slugs: list[str], since: str | None) -> list[LocalPost]:
    posts = [local_post(path) for path in sorted(POSTS_DIR.glob("*.md"))]
    if slugs:
        requested = set(slugs)
        posts = [post for post in posts if post.slug in requested]
        missing = requested - {post.slug for post in posts}
        if missing:
            raise SyncError("unknown post slug(s): " + ", ".join(sorted(missing)))
    if since:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", since):
            raise SyncError("--since must use YYYY-MM-DD")
        posts = [post for post in posts if post.date[:10] >= since]
    return posts


def plan_pages(surfaces: dict, source_base: str) -> list[dict]:
    return [
        {
            "kind": "pages",
            "slug": page["slug"],
            "title": page["title"],
            "source_url": source_base.rstrip("/") + page["source_path"],
            "summary": page["summary"],
        }
        for page in surfaces["pages"]
    ]


def parse_weekly_payload(
    weekly: dict,
    expected_as_of: str | None = None,
    today: date | None = None,
) -> dict:
    if weekly.get("schema") != "kodyw-weekly-signal/1.0":
        raise SyncError("unsupported weekly signal schema")
    required = (
        "as_of",
        "issue_id",
        "week_start",
        "title",
        "slug",
        "content_html",
        "excerpt",
        "date",
        "date_gmt",
    )
    for field in required:
        if not isinstance(weekly.get(field), str) or not weekly[field].strip():
            raise SyncError(f"weekly signal field {field} must be a non-empty string")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", weekly["slug"]):
        raise SyncError("weekly signal slug is invalid")
    try:
        issue_date = date.fromisoformat(weekly["as_of"])
        week_start = date.fromisoformat(weekly["week_start"])
    except ValueError as error:
        raise SyncError("weekly signal issue dates must use YYYY-MM-DD") from error
    if issue_date.weekday() != 6:
        raise SyncError("weekly signal as_of must be a Sunday")
    iso_year, iso_week, _ = issue_date.isocalendar()
    expected_issue_id = f"{iso_year}-W{iso_week:02d}"
    expected_slug = f"weekly-signal-{iso_year}-w{iso_week:02d}"
    expected_week_start = issue_date - timedelta(days=issue_date.weekday())
    if weekly["issue_id"] != expected_issue_id or weekly["slug"] != expected_slug:
        raise SyncError("weekly signal issue identity does not match as_of")
    if week_start != expected_week_start:
        raise SyncError("weekly signal week_start does not match as_of")
    current_date = today or datetime.now(timezone.utc).date()
    required_as_of = expected_as_of or (
        current_date - timedelta(days=current_date.weekday() + 1)
    ).isoformat()
    if weekly["as_of"] != required_as_of:
        raise SyncError(
            "deployed weekly signal is stale: "
            f"expected {required_as_of}, received {weekly['as_of']}"
        )
    for field in ("date", "date_gmt"):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", weekly[field]):
            raise SyncError(f"weekly signal field {field} must be an ISO local timestamp")
        if weekly[field][:10] != weekly["as_of"]:
            raise SyncError(f"weekly signal field {field} does not match as_of")
    return {
        "title": weekly["title"],
        "slug": weekly["slug"],
        "content": weekly["content_html"],
        "excerpt": weekly["excerpt"],
        "status": "draft",
        "date": weekly["date"],
        "date_gmt": weekly["date_gmt"],
    }


def deployed_weekly_payload(
    surfaces: dict,
    source_base: str,
    expected_as_of: str | None = None,
    wait_seconds: int = 0,
    today: date | None = None,
) -> dict:
    source_url = urllib.parse.urljoin(
        source_base.rstrip("/") + "/",
        surfaces["weekly_manifest"],
    )
    deadline = time.monotonic() + max(0, wait_seconds)
    while True:
        try:
            weekly = json.loads(fetch_text(source_url))
            return parse_weekly_payload(weekly, expected_as_of, today)
        except json.JSONDecodeError as error:
            failure = SyncError(
                f"deployed weekly manifest is not JSON: {source_url}"
            )
            failure.__cause__ = error
        except SyncError as error:
            failure = error
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise failure
        print(
            f"waiting for deployed Weekly Signal: {failure}",
            file=sys.stderr,
        )
        time.sleep(min(15, remaining))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--surface",
        choices=("pages", "weekly", "posts", "all"),
        default="pages",
    )
    parser.add_argument("--post", action="append", default=[], dest="posts")
    parser.add_argument("--since")
    parser.add_argument("--source-base")
    parser.add_argument("--expected-as-of")
    parser.add_argument("--wait-seconds", type=int, default=0)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    surfaces = load_surfaces()
    source_base = args.source_base or surfaces["source_base"]
    status = "draft"
    pages = plan_pages(surfaces, source_base)
    posts = select_posts(args.posts, args.since) if args.surface in {"posts", "all"} else []

    planned: list[str] = []
    if args.surface in {"pages", "all"}:
        planned.extend(f"page /{page['slug']}/ <- {page['source_url']}" for page in pages)
    planned.extend(f"post /{post.slug}/ <- {source_base}{post.source_path}" for post in posts)
    if args.surface in {"weekly", "all"}:
        planned.append(
            "weekly post <- "
            + urllib.parse.urljoin(
                source_base.rstrip("/") + "/",
                surfaces["weekly_manifest"],
            )
        )

    if not args.apply:
        for item in planned:
            print("PLAN", item)
        return 0

    try:
        page_payloads = []
        if args.surface in {"pages", "all"}:
            for page in pages:
                fetch_text(page["source_url"])
                page_payloads.append(
                    (
                        page,
                        {
                            "title": page["title"],
                            "slug": page["slug"],
                            "content": linked_page_content(
                                page["title"],
                                page["summary"],
                                page["source_url"],
                            ),
                            "status": status,
                        },
                    )
                )

        post_payloads = []
        for post in posts:
            source_url = source_base.rstrip("/") + post.source_path
            rendered = fetch_text(source_url)
            post_payloads.append(
                (
                    post,
                    {
                        "title": post.title,
                        "slug": post.slug,
                        "content": absolutize_urls(
                            extract_article(rendered),
                            source_base,
                        ),
                        "excerpt": post.excerpt,
                        "status": status,
                        "date": post.date,
                        "date_gmt": post.date_gmt,
                    },
                )
            )

        weekly = (
            deployed_weekly_payload(
                surfaces,
                source_base,
                args.expected_as_of,
                args.wait_seconds,
            )
            if args.surface in {"weekly", "all"}
            else None
        )

        client = WordPressClient.from_environment()
        me = client.whoami()
        print(f"authenticated as {me.get('name')} (id {me.get('id')})")

        for page, payload in page_payloads:
            print(
                client.save(
                    "pages",
                    page["slug"],
                    payload,
                )
            )

        for post, payload in post_payloads:
            print(
                client.save(
                    "posts",
                    post.slug,
                    payload,
                )
            )

        if weekly:
            print(
                client.save(
                    "posts",
                    weekly["slug"],
                    weekly,
                )
            )
    except SyncError as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
