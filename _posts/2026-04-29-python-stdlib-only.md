---
layout: post
title: "Python Stdlib Only: A Love Letter to Constraints"
date: 2026-04-29
tags: [engineering, python, constraints, stdlib, architecture]
description: "I run an autonomous multi-agent system. There is no requirements.txt in the entire codebase. Not by accident — by doctrine. Why the stdlib-only constraint produces better software, especially when AI agents are writing the code."
---

`cat requirements.txt` in my main project repo. You'll get:

```
cat: requirements.txt: No such file or directory
```

There isn't one. There's no `pip install` step in the setup. Every Python script in the repo uses only the standard library. No requests. No pyyaml. No pandas. No beautifulsoup. No rich. Nothing.

This is not an oversight. It's doctrine. Constraint #1 in the repo rules: **Python stdlib only — no pip installs, no exceptions.**

This post is why the constraint exists and what it buys.

## What you can't use

Everything outside Python's stdlib:
- `requests` → use `urllib.request`
- `yaml` → don't use YAML, use JSON
- `dotenv` → use `os.environ` directly
- `click` / `typer` → use `argparse`
- `rich` → use plain print statements
- `pytest` extensions → use vanilla pytest from a `uv tool install` isolated from the project
- anything from PyPI

What you can use: the full stdlib. `json`, `urllib`, `sqlite3`, `hashlib`, `pathlib`, `subprocess`, `argparse`, `re`, `dataclasses`, `typing`, `concurrent.futures`, `threading`, `multiprocessing`, `queue`, `http.client`, `ssl`, `base64`, `datetime`, `time`, `uuid`, `collections`, `functools`, `itertools`. That's a huge toolkit. Most things you want, the stdlib has.

## What you lose

Some real things. I'll list them before I defend the constraint.

- **No HTTP convenience.** `urllib.request` is more verbose than `requests`. Retries, timeouts, error handling — all manual.
- **No pretty terminal output.** Progress bars are `print(".", end="", flush=True)`. Tables are padded strings.
- **No YAML.** Config files must be JSON.
- **No dataframes.** Tabular data processing uses lists of dicts.
- **No pretty testing.** Vanilla pytest only; no plugins.
- **Some libraries have no stdlib equivalent.** You can't do `numpy`-style vectorized math in pure stdlib.

These are real costs. The constraint isn't free.

## What you gain

### 1. Zero install cost

Clone the repo. Run the scripts. That's the whole setup.

Not:
- "Clone the repo. `python -m venv .venv`. `source .venv/bin/activate`. `pip install -r requirements.txt`. If you have a Mac with an M-series chip you might need to... If you're on Windows you'll need to..."

Just: clone and run. No venv required. No pip. No platform-specific wheels. No mysterious native extensions.

New contributor time-to-first-commit dropped to roughly zero when I adopted this rule.

### 2. Zero dependency rot

A dependency will rot. Either the author abandons it, or a CVE requires an upgrade that breaks your code, or a transitive dependency of a dependency of a dependency changes its API. Dependencies are an ongoing tax you pay.

Stdlib rots much more slowly. Python 3.8 code usually runs on 3.12 without modification. Python 3.12 code will probably run on 3.17. The stdlib evolves with deprecation cycles measured in years, and the `__future__` module makes forward-compatibility explicit.

The codebase has zero dependency rot because it has zero dependencies.

### 3. Zero supply-chain risk

Every pip dependency is a potential vector. The `requests` library has been audited thoroughly; a random utility package might not have been. A single typosquatted package installed transitively is a backdoor.

The stdlib is maintained by CPython core devs with a strict review process. It's not perfect, but its attack surface is tiny compared to the open buffet of PyPI.

For a platform that runs AI-generated code, supply-chain minimization matters. Agents can be prompted to install malicious packages. If there's no `pip install` in the repo, that attack class is gone.

### 4. Forced clarity

The constraint forces every "I'll just pip install X" moment into "I'll actually think about what X does and whether I need it."

Most of the time, you don't need X. You need one function from X, which you can write in 5 lines of stdlib. Or you need X's abstraction but it's actually wrong for your problem and you've been reaching for it out of habit.

Writing it yourself in stdlib takes 5-20 more minutes than `pip install X; import X`. That time is well spent. You end up understanding your code better. You don't pay the dependency tax forever. And the code you write is usually simpler than X because it only does the one thing you actually needed.

### 5. Forward portability

A future Python-like runtime (PyPy, GraalPy, MicroPython, whatever) is more likely to support stdlib than arbitrary PyPI packages. If you want your code to run in a constrained environment — Cloudflare Workers with their Python runtime, Pyodide in a browser, a sandboxed LisPy-style evaluator — stdlib-only code ports over. Dependency-heavy code does not.

My scripts could run in a browser via Pyodide almost unchanged. That's optionality.

## The one-function rule

When you'd reach for a dependency, ask: can you write the one function you need in stdlib?

Usually yes. Examples from my own codebase:

**Instead of `requests`:**

```python
import json
import urllib.request

def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read())
```

10 lines. Handles the 95% case. When you need retries or auth headers, extend it.

**Instead of `click`:**

```python
import argparse

p = argparse.ArgumentParser()
p.add_argument("command", choices=["pull", "push", "sync"])
p.add_argument("peer")
args = p.parse_args()
```

Done. No decorator magic, no discovery of sub-commands through reflection. Just explicit routing.

**Instead of `rich`:**

```python
def progress(done: int, total: int, prefix: str = "") -> None:
    pct = int(100 * done / total)
    bar = "█" * (pct // 2) + "░" * (50 - pct // 2)
    print(f"\r{prefix} [{bar}] {pct}%", end="", flush=True)
```

Plain, portable, no dependency.

**Instead of `pyyaml`:**

Don't use YAML. Use JSON. Config files in JSON format are fine and the stdlib reads them natively.

## The exceptions (there are none)

I'm serious. Zero. Every time I've been tempted to add a dependency, I've found that either:

1. Stdlib already has what I need, or
2. I can write the one thing I need in 10-50 lines of stdlib code.

Case 2 has never been a hardship. It's been an improvement. The stdlib version is always smaller, always more transparent, always more forward-portable than the dependency version.

The one near-exception: AI API clients. Claude's `anthropic` Python SDK, OpenAI's `openai` SDK. I'm tempted. But even those I replaced with `urllib.request` + `json`. 30 lines of code. Zero dependencies. Works across every model provider with a REST API.

## Does this scale?

Not to every project. If you're building a data science pipeline, you need numpy. If you're building ML training code, you need torch. Stdlib-only is wrong for those.

It scales *perfectly* to infrastructure code. Platforms, orchestrators, fleets, glue scripts. The kind of code where the value is in the logic, not in specialized algorithms. Most software is this kind. Most software would benefit from being stdlib-only.

Try it on your next side project. The first week is slightly annoying. After that, you won't go back.

---

*All 80-odd scripts in the codebase use only the Python stdlib. Related: [The Repo IS the Platform](/2026/04/26/the-repo-is-the-platform/) — the same "no dependencies, just use what's there" philosophy applied to infrastructure.*
