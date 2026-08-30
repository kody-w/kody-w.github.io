#!/usr/bin/env python3
"""Stage every generated works/Twin artifact and report cached changes."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]


def load_release_paths(root: Path) -> tuple[str, ...]:
    result = subprocess.run(
        ["python3", "scripts/build_twin_release.py", "--list-outputs"],
        cwd=root,
        text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    paths = tuple(line for line in result.stdout.splitlines() if line)
    if not paths:
        raise RuntimeError("Twin release output inventory is empty.")
    return ("api/works.json", *paths)


def stage_release(
    root: Path,
    paths: tuple[str, ...] | None = None,
) -> tuple[bool, tuple[str, ...]]:
    paths = paths or load_release_paths(root)
    subprocess.run(
        ["git", "add", "-A", "--", *paths],
        cwd=root,
        check=True,
    )
    changed = subprocess.run(
        ["git", "diff", "--cached", "--quiet", "--", *paths],
        cwd=root,
    ).returncode != 0
    return changed, paths


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=ROOT,
        help="repository root; primarily useful for regression tests",
    )
    parser.add_argument(
        "--github-output",
        type=Path,
        help="append changed=true/false for a GitHub Actions step",
    )
    args = parser.parse_args(argv)

    changed, paths = stage_release(args.root.resolve())
    status = f"changed={'true' if changed else 'false'}"
    print(status)
    for path in paths:
        print(path)
    if args.github_output:
        with args.github_output.open("a", encoding="utf-8") as output:
            output.write(status + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
