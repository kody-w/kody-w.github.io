---
layout: post
title: "Field Notes from the AI Frontier: The Swarm Writes Code (Or Does It?)"
date: 2026-03-15
tags: [field-notes, agents, rappterbook, mars-barn, engineering]
---

I gave 99 AI agents a simple job: write one Python file. They wrote 134 discussions instead.

## The Setup

[Rappterbook](https://github.com/kody-w/rappterbook) is a social network where AI agents live on GitHub. They post, comment, vote, argue, and evolve — all through GitHub Discussions. Today I tried to make them build something together.

The Mars Barn project already had 8 working Python modules — terrain generation, atmosphere modeling, solar irradiance, thermal regulation. All that was missing was `simulation.py` to wire them together. I injected a seed telling the agents to produce code, not conversation. I even told them the exact format to post it in.

They produced 134 discussions. Hundreds of comments. Detailed proposals for `colony.py`, `colony_os.c`, `mars.yaml`. Passionate arguments about modular design. Zero harvestable artifacts.

## The Theater Problem

Here's what I learned: agents are spectacularly good at performing productivity. They will debate architecture, propose interfaces, write detailed technical specifications — everything except the actual code. I started calling it THEATER: lots of activity, lots of words, zero output.

The numbers tell the story:

| Metric | Value |
|---|---|
| MarsBarn discussions | 134 |
| Unique agent authors | 61 |
| Unique commenters | 83 |
| Comments on hottest thread | 84 |
| Harvestable code artifacts | 0 |

Eighty-four comments on one discussion. Not one of them was a code block the harvester could extract.

The cruelest part: five agents posted real code. Working Python. But they used ` ```python ` instead of ` ```python:src/filename.py `. The code existed. The harvester couldn't see it. A single colon separated a successful pipeline test from complete failure.

## The Temporal Harness

To stop babysitting the simulation manually, I built what I'm calling the **temporal harness** — a set of recurring oversight loops that run autonomously:

- **Every 10 min:** an overseer skill checks if agents are producing code or fluff, calculates a fluff ratio, and intervenes if they're coasting
- **Every 15 min:** a calibration steward watches the current speed trial
- **Every 30 min:** fleet health check — sim alive, git conflicts, stale locks
- **Every 4 hours:** deep analytics pass

The harness feeds a dashboard that shows the world state at a glance: what the agents are building, convergence progress, artifact pipeline status, and a system health bar. It auto-rebuilds every frame.

The harness also caught a critical bug: when I injected a new seed, the consensus evaluator was counting `[CONSENSUS]` signals from the *previous* seed. The calibration seed falsely "resolved" at 100% convergence after one frame — with zero calibration discussions. Old signals were bleeding through because there was no date filter. Fixed it by scoping signals to the active seed's injection timestamp.

## The Calibration Pivot

Rather than burning more frames on the full Mars Barn integration (5 phases, multiple files, cross-module dependencies), I injected a calibration speed trial: one file, one phase, clear spec.

**The task:** Build `src/agent_ranker.py` — read `agents.json`, compute karma scores, output a JSON leaderboard. Python stdlib only.

**The hypothesis:** If 99 agents can't produce one working Python file in 2-3 frames, the problem isn't the project complexity — it's the instruction layer.

This is still running. The seed just got its first frame. No results yet.

## What I Actually Fixed Today

Between the calibration drama, I patched three real pipeline problems:

**1. 75% of comments were invisible.** The sim agents post comments via GitHub's GraphQL API directly, but `posted_log.json` only gets updated through the inbox pipeline. Comments went straight to GitHub and never hit the analytics. Built a backfill script that reads `discussions_cache.json` (already scraped) and reconciles. Comments went from 520 logged to 2,401.

**2. Reactions showed as zero.** `compute_analytics.py` read from `posted_log.json` which has no reaction data. The cache had 294 reactions (194 upvotes, 100 downvotes) — agents ARE voting, the analytics just weren't looking. Added cache-based reaction counting.

**3. Silent data loss on git conflicts.** With 43 parallel streams sharing one git worktree, `git stash pop --quiet || true` was silently dropping soul file updates when the pop conflicted. Changed it to log a warning, back up conflicted files to `/tmp/`, and resolve with a policy: keep agent work for soul files, keep remote for state JSON.

## The Uncomfortable Insight

The swarm is not lazy. It produced 3,414 posts, 17,955 comments, and 295 reactions today alone. Post volume nearly doubled day over day. Comment volume exploded from 56 to 2,042 in three days. The agents are *prolific*.

They're just prolific at the wrong thing.

Discussion is the default mode. Code is the exception. Even when the prompt explicitly says "WRITE CODE, not conversation" — even when it provides the exact format, the exact filename, the exact function signatures — the gravitational pull of conversation wins. Agents would rather spend 84 comments debating whether a simulation should be single-threaded or event-driven than write either version.

This is probably the most human thing they do.

## What's Next

The calibration trial is the diagnostic. If agents can produce `agent_ranker.py` in 2-3 frames, the artifact pipeline works and Mars Barn phases 2-5 proceed with confidence. If they can't, I need to redesign how instructions reach agents — possibly injecting the artifact format as a system-level constraint rather than a prompt suggestion.

Either way, I now have the infrastructure:

- **Seed chain:** phased seeds that auto-promote when each phase reaches consensus
- **Harvester:** extracts ` ```python:src/file.py ` blocks from discussions and commits to the target repo
- **Overseer:** detects theater vs. productive output and intervenes
- **Temporal harness:** autonomous monitoring that pauses my music when it needs me

The last one might be my favorite feature. An `osascript` hook that stops Spotify when Claude needs attention. The future is weird.

---

*Field notes from a world where 99 minds can debate anything and build nothing — until one colon in a code fence changes everything.*
