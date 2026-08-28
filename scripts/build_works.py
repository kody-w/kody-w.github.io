#!/usr/bin/env python3
"""Build the public works catalog from GitHub's public repository API."""

from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "api" / "works.json"
OWNER = os.environ.get("WORKS_OWNER", "kody-w")
FEATURED = [
    "RAPP",
    "rapp-1",
    "RAR",
    "openrappter",
    "rappterbook",
    "localFirstTools-main",
    "rapp-vision",
    "kody2day",
    "RAPP_Store",
    "RAPP-Bible",
    "rapp-body",
    "rappter-site",
]


def github_token() -> str:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        return token
    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.stdout.strip()
    except (FileNotFoundError, subprocess.SubprocessError):
        return ""


def fetch_repositories() -> list[dict]:
    token = github_token()
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "kodyw-works-catalog/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    repositories = []
    for page in range(1, 20):
        url = (
            f"https://api.github.com/users/{OWNER}/repos"
            f"?type=owner&sort=pushed&direction=desc&per_page=100&page={page}"
        )
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                batch = json.load(response)
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:500]
            raise SystemExit(f"GitHub HTTP {error.code}: {detail}") from error
        repositories.extend(batch)
        if len(batch) < 100:
            break
    return [repo for repo in repositories if not repo.get("fork")]


def searchable(repo: dict) -> str:
    topics = " ".join(repo.get("topics") or [])
    return " ".join(
        (
            repo.get("name") or "",
            repo.get("description") or "",
            repo.get("language") or "",
            topics,
        )
    ).lower()


def category_for(repo: dict) -> str:
    value = searchable(repo)
    name = (repo.get("name") or "").lower()
    rules = [
        (
            "RAPP ecosystem",
            r"(^|[-_ ])rapp|rappter|rapterbox|^rar$|openrappter|brainstem",
        ),
        (
            "Protocols & networks",
            r"protocol|federat|network|mesh|wire|dogg|identity|ledger|frame",
        ),
        (
            "Games & simulations",
            r"game|voxel|pokemon|metaverse|nexus|simulat|world|dino|flight",
        ),
        (
            "Microsoft & enterprise",
            r"dynamics|power.?apps|power.?platform|m365|microsoft|azure|copilot.?studio|crm",
        ),
        (
            "AI & agent systems",
            r"\bai\b|agent|copilot|llm|autogen|assistant|model",
        ),
        (
            "Local-first apps",
            r"local.?first|desktop|mobile|offline|pwa|browser|static",
        ),
        (
            "Learning, media & writing",
            r"learn|education|video|vision|story|book|blog|prompt|media",
        ),
        (
            "Developer tools & data",
            r"tool|sdk|api|data|connector|wasm|code|dev|cli|library",
        ),
    ]
    if repo.get("archived"):
        return "Archive"
    for label, pattern in rules:
        if re.search(pattern, f"{name} {value}", re.IGNORECASE):
            return label
    return "Experiments & other"


def family_for(repo: dict) -> str:
    name = (repo.get("name") or "").lower()
    if name.startswith(("rappterbook", "rappterpedia")):
        return "Rappterbook"
    if name.startswith(("rbox", "rapterbox", "rappterbox")):
        return "RapterBox"
    if name.startswith("dogg"):
        return "DOGG"
    if name.startswith(("rapp", "rar", "openrapp", "brainstem")):
        return "RAPP"
    if "localfirst" in name or "local-first" in name:
        return "Local-first tools"
    if "agent" in name or "copilot" in name or name.startswith("ai"):
        return "Agents & AI"
    return category_for(repo)


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def activity_for(repo: dict, now: datetime) -> str:
    pushed = parse_time(repo["pushed_at"])
    age = (now - pushed).days
    if age <= 30:
        return "active"
    if age <= 90:
        return "recent"
    return "archive"


def normalize(repo: dict, now: datetime) -> dict:
    name = repo["name"]
    return {
        "name": name,
        "full_name": repo["full_name"],
        "description": repo.get("description") or "",
        "url": repo["html_url"],
        "homepage": repo.get("homepage") or "",
        "created_at": repo["created_at"],
        "pushed_at": repo["pushed_at"],
        "updated_at": repo["updated_at"],
        "language": repo.get("language") or "Other",
        "topics": repo.get("topics") or [],
        "stars": repo.get("stargazers_count") or 0,
        "forks": repo.get("forks_count") or 0,
        "archived": bool(repo.get("archived")),
        "template": bool(repo.get("is_template")),
        "category": category_for(repo),
        "family": family_for(repo),
        "activity": activity_for(repo, now),
        "featured_rank": FEATURED.index(name) + 1 if name in FEATURED else None,
    }


def build() -> dict:
    now = datetime.now(timezone.utc)
    repos = [normalize(repo, now) for repo in fetch_repositories()]
    repos.sort(key=lambda repo: repo["pushed_at"], reverse=True)
    repos.sort(
        key=lambda repo: (
            repo["featured_rank"] is None,
            repo["featured_rank"] or 999,
        )
    )
    unarchived = [repo for repo in repos if not repo["archived"]]
    created = sorted(parse_time(repo["created_at"]) for repo in repos)
    languages = sorted(
        {
            repo["language"]
            for repo in repos
            if repo["language"] and repo["language"] != "Other"
        }
    )
    return {
        "schema": "kodyw-public-works/1.0",
        "owner": OWNER,
        "generated_at": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": f"https://api.github.com/users/{OWNER}/repos",
        "kody2day": "https://kody-w.github.io/kody2day/",
        "stats": {
            "public_source_repos": len(repos),
            "active_30d": sum(repo["activity"] == "active" for repo in repos),
            "active_90d": sum(
                repo["activity"] in {"active", "recent"} for repo in repos
            ),
            "featured": sum(repo["featured_rank"] is not None for repo in repos),
            "archived": len(repos) - len(unarchived),
            "languages": len(languages),
            "building_since": created[0].date().isoformat() if created else None,
        },
        "languages": languages,
        "categories": sorted({repo["category"] for repo in repos}),
        "families": sorted({repo["family"] for repo in repos}),
        "repos": repos,
    }


def main() -> int:
    payload = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"wrote {OUTPUT}: {payload['stats']['public_source_repos']} public source repos, "
        f"{payload['stats']['active_90d']} active in 90 days"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
