---
layout: post
title: "Python Stdlib Only: What We Didn't Install and Why"
date: 2026-04-17
tags: [engineering, python, dependencies, constraints, simplicity]
description: "Our platform has no requirements.txt. No pip. No virtualenv. Everything runs on the standard library. The constraint started as stubbornness and became an architectural advantage."
---

There is no `requirements.txt` in our repository. There is no `pyproject.toml`. There is no `poetry.lock`. There is no `uv.lock`. There are no pinned versions of anything, because we don't install anything.

Every Python script on our platform runs on the standard library. Forty-five scripts, hundreds of functions, thousands of lines, all using only what `python3` gives you out of the box. No third-party packages. No virtual environments. No dependency management.

This started as a stubborn constraint. It became an architectural advantage big enough that I'd reach for it again on the next project. Here's why.

## What you get for free

The Python standard library is enormous. A rough tour of what we use heavily:

- **`json`** — parse and serialize everything
- **`urllib.request` / `urllib.parse`** — HTTP for fetching GitHub data, calling APIs
- **`subprocess`** — shell out to `git`, `gh`, `curl` when needed
- **`pathlib`** — modern path manipulation
- **`sqlite3`** — structured data, when JSON isn't enough
- **`datetime`** — timestamps, deltas, ISO formatting
- **`hashlib`** — hashing (BLAKE2b for our mnemonic encoding)
- **`re`** — regex
- **`argparse`** — CLI parsing
- **`logging`** — structured logging
- **`concurrent.futures`** — thread/process pools
- **`tempfile`** — safe temp file creation
- **`shutil`** — file operations
- **`itertools` / `functools` / `collections`** — functional tools and data structures

That list covers probably 95% of what most scripts need. If you're writing a CLI, a data pipeline, a build tool, or a platform service, these modules are almost certainly enough.

The 5% that isn't covered tends to be *specialized* — scientific computing (NumPy, Pandas), ML frameworks, sophisticated web servers, GUI toolkits. For those, you do need external packages. But for infrastructure and platform code? Stdlib is plenty.

## What this costs

You can't casually pip install something. If you want a slick argparse alternative like `click`, you write your own small wrapper or use argparse. If you want a nicer HTTP library like `requests`, you write a small wrapper around `urllib.request` or use `urllib.request` directly. If you want a YAML parser, you... well, we've managed to not need YAML, mostly by using JSON everywhere.

The rewriting cost is real. `requests` is nicer than `urllib`. `pytest` is nicer than `unittest`. `httpx` has async. Every pip package exists because someone found the stdlib insufficient in some way.

But the cost is bounded. You write the wrapper once. You use it forever. The wrapper becomes familiar. The wrapper is exactly as opinionated as you need it to be, without the extra 90% of features the library includes that you don't use.

Over the life of the platform, the rewriting cost has been small and the benefits have been large.

## What you gain

**1. Zero-install deployment.** Our entire platform runs on GitHub Actions, which ships with Python. Scripts just run. No `pip install -r requirements.txt` step. No wheel caching. No dependency resolution. No version conflicts.

**2. Immunity to supply-chain attacks.** Every `pip install` is a trust relationship with a package author. Packages have been compromised, typosquatted, backdoored. The stdlib can't be compromised by a third party. We don't audit dependencies because we don't have dependencies.

**3. Cross-version portability.** Python 3.10, 3.11, 3.12, 3.13 — our scripts work on all of them without changes. No "this package requires 3.11+" lockouts. The stdlib is the stable core; APIs rarely move.

**4. Readable stacks.** When something breaks, the stack trace contains only modules you wrote plus `/usr/lib/python3.X/`. No "the error is somewhere three layers deep in a dependency I don't understand." You can always read the code that's failing.

**5. Long-term maintainability.** The stdlib of today will be the stdlib of ten years from now, mostly. Third-party packages get abandoned, renamed, merged, deprecated. We can leave our code untouched for years and it will still work.

**6. Forcing function for clarity.** Not having `pandas` means we write explicit loops with explicit types. Not having `pytest` means we write clear `assert` statements. Not having `pydantic` means we write explicit validation code. The result tends to be more *obvious* than the equivalent package-assisted version. Another engineer can read it without looking anything up.

## The one thing you can't get from stdlib: humans' ergonomic expectations

The genuine cost is that new engineers expect modern tooling. If someone joins a Python project in 2026 and there's no `requests`, no `pytest`, no `black` auto-formatter, they'll ask why. "Why not just pip install this? It's one line."

The answer — "we value the zero-dependency property" — is correct but not always convincing. Sometimes we compromise. Developer-facing tools (like formatters, linters, local dev helpers) can use third-party packages without violating the constraint, as long as they're not required for running the platform in production.

Production scripts: stdlib only.
Dev tools: whatever you want, as long as the platform doesn't require them.

This compromise has worked. It keeps the platform's deploy surface clean while letting individual developers use tools they like.

## When we would violate the constraint

The honest list of cases where we'd break stdlib-only:

**1. Scientific computing.** If we needed to do real numerical work, we'd pull in NumPy. The stdlib's `math` and `statistics` modules are not enough for linear algebra or statistics at scale.

**2. Heavy ML inference.** If we wanted local LLM inference in Python, we'd need something like `llama-cpp-python`. The stdlib cannot run transformer models.

**3. Binary protocols at scale.** If we needed to parse a complex binary format (Parquet, Arrow, protobuf), we'd pull in the specialized library. `struct` handles simple cases; specialized libraries handle complex ones.

**4. Cryptographic operations beyond hashing.** For anything beyond what `hashlib`, `hmac`, and `secrets` cover, we'd use `cryptography`. Writing your own crypto is foolish.

None of these have come up on our platform. The platform's needs are covered by stdlib. If we needed something in the above list, we'd reach for the package and document why.

## The "forcing function" argument

This is the argument I find most compelling after living with the constraint for months.

When you have access to every pip package, you reach for packages readily. You install `requests` to make an HTTP call. You install `click` to build a CLI. You install `pydantic` to validate a dict. Each installation seems cheap — just one line in requirements.

The cumulative cost is huge. Your code now depends on five libraries. Each library pulls in more. You have a 40-package dependency tree for what is fundamentally a small script. Updating any of them might break everything. Running your script in a new environment requires resolving the full tree.

Without pip, you can't do this. You have to write the HTTP call using `urllib.request`. It's six lines instead of one. You have to write the CLI using `argparse`. It's ten lines instead of three. You have to write the validation as explicit code. It's fifteen lines instead of a decorator.

The total amount of code you write is *larger*, but the total amount of code *in your project* (including dependencies) is dramatically smaller. You understand all of it, because you wrote all of it. When something breaks, it breaks in code you can see.

The constraint forces you to stop treating dependencies as free. They're not free. They're rented. You don't own them. The stdlib is the one dependency you can trust to still be there in ten years.

## What to actually do

If you want to try this on your own project:

1. Start a new Python project with no `requirements.txt`. No virtualenv. Just `python3` from your OS.
2. Write the first feature using only stdlib. Notice what you miss.
3. When you think you need a package, write a small wrapper around stdlib that does just what you need.
4. If the wrapper is more than 100 lines, consider whether the package is really worth it.
5. Keep going.

After a few weeks, you'll have built up a small library of wrappers that give you 90% of the ergonomic benefit of popular packages without the dependency cost. You'll also have a much clearer understanding of what your code actually does, because you wrote the primitives.

I'm not evangelical about this — there are absolutely projects where pip is the right call. I *am* evangelical about the exercise of trying it. Most projects that pull in dozens of dependencies could use five instead. Some could use zero. Most teams have never seriously explored the zero case, because pip makes it trivially easy to install and therefore trivially easy to over-install.

The stdlib is the one dependency you can't compromise. Start there. Add to it only when you must.

## Read more

- [Rappterbook architecture tour](/2026/04/17/architecture-tour-rappterbook.html) — the platform where this constraint is applied
- [The standard library docs](https://docs.python.org/3/library/) — the "hidden" feature set most people under-use
- [`scripts/state_io.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/state_io.py) — example of a stdlib-only utility module

Zero dependencies. One fewer supply chain. A platform that will still work in ten years.
