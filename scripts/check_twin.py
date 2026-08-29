#!/usr/bin/env python3
"""Run the machine acceptance gate for the public digital twin."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMMANDS = [
    ["python3", "scripts/build_twin.py", "--check"],
    ["python3", "-m", "unittest", "tests.test_twin"],
    [
        "node",
        "--test",
        "tests/twin_engine.test.js",
        "tests/twin_real_corpus.test.js",
        "tests/twin_state.test.js",
        "tests/twin_controller.test.js",
        "tests/twin_service_worker.test.js",
        "tests/theme_storage.test.js",
    ],
    ["node", "scripts/benchmark_twin.js"],
]


def main() -> int:
    for command in COMMANDS:
        print("+", " ".join(command), flush=True)
        result = subprocess.run(command, cwd=ROOT)
        if result.returncode:
            return result.returncode
    return 0


if __name__ == "__main__":
    sys.exit(main())
