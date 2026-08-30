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
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SURFACES_FILE = ROOT / "wordpress" / "surfaces.json"
POSTS_DIR = ROOT / "_posts"
DEFAULT_WP_URL = "https://kodyw.com"


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


def iframe_content(title: str, summary: str, source_url: str) -> str:
    safe_title = html.escape(title)
    safe_summary = html.escape(summary)
    safe_url = html.escape(source_url, quote=True)
    return (
        f"<section><p>{safe_summary}</p>"
        f'<p><a href="{safe_url}">Open {safe_title} directly</a></p></section>'
        f'<iframe src="{safe_url}" title="{safe_title}" loading="lazy" '
        'sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" '
        'referrerpolicy="no-referrer" '
        'style="display:block;width:100%;height:82vh;min-height:900px;'
        'border:1px solid #e5e7eb;border-radius:12px;background:#fff"></iframe>'
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
        endpoint = f"{self.url}/wp-json/wp/v2/{path.lstrip('/')}"
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
        result = self.request("GET", "users/me?context=edit")
        if not isinstance(result, dict):
            raise SyncError("unexpected users/me response")
        capabilities = result.get("capabilities") or {}
        if not capabilities.get("edit_posts"):
            raise SyncError("authenticated user cannot edit posts")
        return result

    def find(self, kind: str, slug: str) -> list[dict]:
        query = urllib.parse.urlencode(
            {
                "slug": slug,
                "context": "edit",
                "status": "publish,draft,pending,future,private",
                "per_page": 5,
            }
        )
        result = self.request("GET", f"{kind}?{query}")
        if not isinstance(result, list):
            raise SyncError(f"unexpected {kind} lookup response")
        return result

    def save(
        self,
        kind: str,
        slug: str,
        payload: dict,
    ) -> str:
        existing = self.find(kind, slug)
        draft = next(
            (item for item in existing if item.get("status") == "draft"),
            None,
        )
        if draft:
            saved = self.request("POST", f"{kind}/{draft['id']}", payload)
            return f"{kind}:{slug}: updated {saved['status']} item {saved['id']}"
        if existing:
            item = existing[0]
            return (
                f"{kind}:{slug}: skipped existing {item.get('status')} "
                f"item {item.get('id')}"
            )
        saved = self.request("POST", kind, payload)
        return f"{kind}:{slug}: created {saved['status']} item {saved['id']}"


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


def parse_weekly_payload(weekly: dict) -> dict:
    if weekly.get("schema") != "kodyw-weekly-signal/1.0":
        raise SyncError("unsupported weekly signal schema")
    required = (
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
    for field in ("date", "date_gmt"):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", weekly[field]):
            raise SyncError(f"weekly signal field {field} must be an ISO local timestamp")
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
) -> dict:
    source_url = urllib.parse.urljoin(
        source_base.rstrip("/") + "/",
        surfaces["weekly_manifest"],
    )
    try:
        weekly = json.loads(fetch_text(source_url))
    except json.JSONDecodeError as error:
        raise SyncError(f"deployed weekly manifest is not JSON: {source_url}") from error
    return parse_weekly_payload(weekly)


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
                            "content": iframe_content(
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
            deployed_weekly_payload(surfaces, source_base)
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
