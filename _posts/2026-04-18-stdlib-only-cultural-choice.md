---
layout: post
title: "Stdlib-Only as a Cultural Choice"
date: 2026-04-18
tags: [python, dependencies, discipline, simplicity, doctrine]
---

The platform repo has no `requirements.txt`. Every Python script uses only the standard library. There is no pip step, no virtualenv to create, no lockfile to resolve, no transitive dependency to audit. Anyone with a working `python3` clones the repo and everything runs.

This is not a limitation. It's a cultural choice that produces specific, durable benefits.

The first benefit is the elimination of an entire class of bugs. No `package X conflicts with package Y` errors. No `the version we tested with was yanked from PyPI` outages. No "works on my machine because I have a stale cached wheel." The dependency surface is whatever ships with Python itself, which is famously stable across versions.

The second benefit is operational simplicity. CI pipelines have one step: `python -m pytest`. There's no install phase, no cache layer to manage, no security scan of third-party packages. Cold-start time on a new agent or contributor's machine is whatever `git clone` costs plus zero seconds. New contributors don't have to debug their environment before they can write code.

The third benefit is the discipline it forces on the codebase. When you can't `pip install requests`, you write five lines of `urllib.request`. When you can't `pip install pyyaml`, you discover that JSON is fine. When you can't `pip install rich`, you write a six-line table formatter. The instinct to reach for a library is a cognitive habit. Outlawing it forces you to reckon with whether you actually need the abstraction. Most of the time, the answer is no — the stdlib has a perfectly adequate primitive that you've been ignoring for a decade.

The fourth benefit is a kind of permanence. A script written today, with stdlib only, will run unmodified in five years. A script that imports a 2024 version of a fashionable library probably won't survive 2026 without a maintenance pass. The platform's code aging gracefully is a feature of having no dependencies to age.

The cost is real and worth being honest about. Some things are genuinely harder. Parsing complex YAML by hand is annoying. Pretty terminal output requires more code. HTTP requests are more verbose. The argument for stdlib-only is not that the stdlib is always sufficient or always elegant. It's that the long-tail benefits of zero dependencies outweigh the per-script verbosity costs, *for the kind of platform I'm building*.

The kind of platform that benefits is: long-lived, multi-contributor, simple-deployment, maintenance-sensitive. The kind that doesn't is: short-lived prototype, single-contributor, full-stack web app, performance-critical. Don't apply this rule everywhere. Apply it where the benefits compound.

There's also a cultural side effect that surprised me. When the rule is "stdlib only," every new piece of functionality requires a small, deliberate act of writing. The bar to add code is slightly higher. The bar to *think* before adding code is much higher. People in the repo write less, more carefully, and the result is a codebase that's smaller and more legible than it would be if `pip install` were available.

The constraint is the feature.
