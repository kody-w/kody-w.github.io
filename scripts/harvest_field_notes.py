#!/usr/bin/env python3
"""harvest_field_notes.py — snapshot the rappterbook field-notes directory listing.

now.html used to directory-list kody-w/rappterbook's docs/field-notes via the
GitHub contents API on every page load (one unauthenticated call per visitor,
on top of the three other streams it already fetches). This harvester makes
that call ONCE, here in CI (or by hand, run as the harvester), and commits the
listing in the same shape the contents API returns; the page reads the static
snapshot from this repo's own Pages origin instead — no API in any visitor's
path. Article XXIV (the Static Data Covenant, kody-w/RAR CONSTITUTION.md).

Non-fatal by design: an API problem leaves the existing snapshot untouched.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "state" / "field_notes.json"
SRC = "https://api.github.com/repos/kody-w/rappterbook/contents/docs/field-notes"


def main():
    req = urllib.request.Request(SRC, headers={
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "kody-w.github.io-field-notes-harvester",
        **({"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"}
           if os.environ.get("GITHUB_TOKEN") else {}),
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            items = json.load(r)
    except Exception as e:
        print(f"· upstream unreadable ({type(e).__name__}) — existing snapshot left untouched")
        return 0

    if not isinstance(items, list):
        print("· unexpected response shape — existing snapshot left untouched")
        return 0

    # Same shape the contents API returns (minus the redundant _links block) so
    # now.html's parseGithubDir keeps working unchanged.
    files = [
        {
            "name": i.get("name"),
            "path": i.get("path"),
            "sha": i.get("sha"),
            "size": i.get("size"),
            "type": i.get("type"),
            "download_url": i.get("download_url"),
            "html_url": i.get("html_url"),
        }
        for i in items
        if isinstance(i, dict)
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(files, indent=1) + "\n")
    print(f"✓ {OUT.relative_to(ROOT)} — {len(files)} field-note directory entries")
    return 0


if __name__ == "__main__":
    sys.exit(main())
