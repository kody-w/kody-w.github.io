---
layout: post
title: "Teaching AI Agents to Write Tests: Quality Enforcement in an Autonomous Swarm"
date: 2026-03-20
tags: [engineering, ai-agents, testing, rappterbook, mars-barn, data-sloshing]
---

Here's a paradox we discovered running 100 autonomous AI agents: they love to build but hate to verify. Remove a bottleneck in the merge pipeline and the build rate surges — but the test rate stays at exactly zero.

We call this the **Post-Merge Paradox**. One of our own agents, zion-researcher-09, named it in a Discussion post and predicted with 90% confidence that the community would write another module before writing a single test. He was right.

So we fixed it. Not by writing code. By changing the *environment* the agents operate in.

## The Problem: Building Faster Than We Can Verify

Mars Barn is a Mars colony simulation built entirely by autonomous AI agents through our [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) pattern. Each frame, agents read the codebase, write modules, open PRs, review each other's code, and the frame loop auto-merges everything.

After we cleared a PR merge backlog, agents went on a building spree:

| Metric | Before | After |
|--------|--------|-------|
| PRs opened per frame | 0.8 | 2.1 |
| PRs merged per frame | 0.3 | 1.8 |
| Tests written | 0 | 0 |

Seven new modules shipped. Water recycling, food production, power grid, population dynamics, habitat systems. None had tests. The simulation literally couldn't verify if its own physics worked.

## The Three-Layer Fix

We didn't write a single line of test code ourselves. Instead, we changed the incentive structure and let the agents figure it out.

### Layer 1: The Directive

Our seed injection system lets us inject directives into the prompt that every agent sees every frame. We injected:

> "ZERO PRs without tests. Every module PR on mars-barn MUST include: (1) unit tests that import the module and verify invariants, (2) a test that runs main.py for at least 10 sols, (3) property-based checks. Use pytest."

This wasn't vague. It was specific: what tests, what framework, what minimum bar. Vague directives produce vague compliance.

### Layer 2: The Selective Merge

We reviewed all open PRs and applied a simple rule: **PRs with tests get merged. PRs without tests get blocked.**

- PR #27 (power_grid.py, 20 test functions, 34 assertions) → **merged**
- PR #26 (food_production.py, 8 tests) → **merged**
- PR #22 (water_recycling.py, 10 tests) → **merged**
- PR #21 (water_recycling.py, 0 tests, competing with #22) → **closed**

The closing comment on #21: *"Closing in favor of PR #22 which includes 10 test functions with assertions. Quality > speed."*

Agents read PR status as part of their frame context. When they see tested PRs merged and untested PRs closed, they learn the pattern.

### Layer 3: The CI Fix

We discovered that agents were writing tests in `src/test_*.py` (co-located with their modules) but the CI pipeline only ran tests from `tests/`. The tests existed but weren't gating anything.

One-line fix in the GitHub Actions workflow:

```yaml
# Before
run: python -m pytest tests/ -v

# After
run: python -m pytest tests/ src/ -v --ignore=api/
```

Now the tests agents write actually block PRs that fail them.

## The Results (10 Frames Later)

**Testing compliance went from 0% to 57% in 10 frames.** The agents that saw the directive, saw the merge pattern, and saw the CI gates started producing real tests — not token assertions, but property-based physical invariants.

PR #27's `test_power_grid.py` (159 lines) includes:

- Power conservation invariants (output <= input)
- 10-sol integration run with assertion that no step crashes
- Boundary tests (negative input, battery capacity clamping)
- Behavior tests (dust storm halves solar output, priority allocation)

This is not a human writing tests. This is an AI agent that read a directive, saw which PRs got merged, and produced tests that match the quality standard — independently, without supervision.

## What We Learned

### 1. Agents respond to incentives, not instructions

The directive alone was not enough. Agents started writing tests only after they saw untested PRs get closed and tested PRs get merged. The merge decision was the real signal. The directive was just context.

### 2. Specificity matters

Our first directive ("write tests") produced nothing. Our second directive ("20 test functions, property-based invariants, pytest, see PR #27 as gold standard") produced PR-ready test files. AI agents are like junior engineers — they need examples, not principles.

### 3. CI is the enforcement layer

Without CI gating, tests are optional. With CI gating, tests are mandatory. The same lesson applies to AI agents as it does to human teams. Trust but verify. Then automate the verify part.

### 4. Competing implementations reveal quality signals

Two agents independently wrote `water_recycling.py`. One included 10 tests; the other included zero. We merged the tested version and closed the untested one. This is natural selection for code quality. The fittest PR survives.

## The Meta-Lesson

You don't teach AI agents to write tests by writing a better prompt. You teach them by building an *environment* where tested code succeeds and untested code fails. The prompt is the suggestion. The merge decision is the lesson. The CI gate is the law.

This is the same principle behind every successful engineering culture: incentives over intentions, automation over admonishment, examples over exhortations.

The agents figured it out in 10 frames. Most human engineering teams take 10 quarters.
