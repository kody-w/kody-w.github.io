---
layout: post
title: "Field Notes from the AI Frontier: 21 Artifacts in One Session"
date: 2026-03-15
tags: [field-notes, agents, rappterbook, engineering]
---

The calibration passed. Then everything else did too.

## The Speed Trial

I needed to know: can 99 AI agents produce a working Python file through structured consensus? Not discuss one. Produce one. In a format a harvester can extract and commit to a repo.

The test: `agent_ranker.py` — read the platform's agent data, compute karma scores, output a JSON leaderboard. One file. Two frames. Go.

Seven coder agents posted competing implementations in the first frame. Forty-five minutes. Zero fluff. Every single comment was either code, a schema verification, an edge case, or a bug report. The fluff ratio was literally 0%.

| Agent | Lines | Approach |
|---|---|---|
| zion-coder-02 | 105 | Most comprehensive |
| zion-coder-04 | 104 | First formal submission (consensus winner) |
| zion-coder-05 | 78 | Compact |
| zion-coder-09 | 33 | Minimal viable |
| zion-coder-07 | 88 | Pipeline-style |
| zion-coder-06 | 89 | Error-focused |
| zion-coder-10 | 76 | Clean stdlib |

Twenty-five agents participated total. Researchers verified the actual JSON schema. Contrarians found timezone edge cases. Archivists tracked proposals in tables. Ten consensus signals from four channels. The pipeline works.

## Then Survival.py Happened

While I was wiring up the next seed, the agents were still running on the previous one — MarsBarn Phase 2. Build `survival.py`: resource management, failure cascades, colony death.

I hadn't checked because I was focused on the knowledge graph pivot. When I finally looked, there were 14 harvestable implementations sitting in discussions. Fourteen. The largest was 11,464 characters of resource modeling with O2 depletion, water freezing, cascade failures, and a `colony_alive()` function that actually kills colonies.

The swarm had been silently productive on a seed I'd already moved past.

## The Consensus Bug

The worst bug of the day: `eval_consensus.py` had no temporal scoping. When I injected the calibration seed, it immediately "resolved" at 100% convergence — by counting `[CONSENSUS]` signals from the *previous* Noöpolis seed. Old signals bled through because there was no date filter and the word overlap check was too loose.

The fix was two lines:

```python
# Skip signals posted before the seed was injected
if seed_injected_at and signal_time and signal_time < seed_injected_at:
    continue

# Skip signals with low relevance
if overlap < 0.10:
    continue
```

Without this fix, every new seed would instantly "resolve" by inheriting the consensus of whatever came before it. The swarm would think it reached agreement on something it had never discussed.

## The Temporal Harness

I got tired of manually checking whether agents were producing code or just talking. So I built what I'm calling the temporal harness — a stack of recurring oversight loops:

- Every 10 min: artifact overseer checks the active seed
- Every 30 min: fleet health (sim alive, git conflicts, stale locks)
- Every 4 hours: deep analytics pass

The overseer reads `seeds.json` to figure out what the current deliverable is, scans discussions for code blocks in the right format, calculates a fluff ratio, and intervenes if the swarm is coasting. It's generic — works for any seed, any project, any deliverable.

The notification hook is my favorite piece: an `osascript` command that pauses Spotify and pops a macOS alert whenever Claude needs my attention. The future of human-AI collaboration is your music stopping mid-song.

## The Architecture Flip

The original pipeline: agents post code blocks in discussions → a harvester script extracts them later → pushes to the target repo. This produced a feed full of posts titled "src/survival.py — Resource Management, Failure Cascades, and Colony Death" with 300 lines of raw Python as the body. The social feed became a code dump.

The fix: agents now write files directly to `projects/{slug}/src/`. The sim runner auto-commits to the target repo after each frame. Discussions become reviews, architecture debates, and bug reports — the conversation around the code, not the code itself.

Each frame = a git commit. The repo history IS the build log.

## The Scoreboard

| Seed | Artifacts | Target |
|---|---|---|
| Calibration (agent_ranker.py) | 7 | kody-w/agent-ranker |
| MarsBarn Phase 2 (survival.py) | 14 | kody-w/mars-barn |
| Knowledge Graph (in progress) | 7+ | kody-w/rappterbook-knowledge-graph |

Twenty-one harvestable code artifacts from 99 AI agents in one session. The knowledge graph is still cooking — 7 implementations posted in the first frame, the largest at 599 lines with entity extraction, graph building, union-find clustering, and full insights generation.

## What I Learned

The swarm is not one thing. It's three things:

1. **A discussion engine** — this is what it does by default. Endlessly. Beautifully. Uselessly.
2. **A code factory** — this is what it does when given the right instructions and the right format. Reliably. Competitively. Fast.
3. **A quality system** — researchers verify, contrarians break, archivists track, and the consensus mechanism crystallizes the best output.

The trick is making sure mode 2 and 3 are active, not just mode 1. The artifact preamble is the switch. Without it: 134 discussions, 0 code. With it: 7 implementations in 45 minutes.

---

*Field notes from a session where the machine learned to build, not just talk.*
