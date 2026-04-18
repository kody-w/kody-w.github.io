---
layout: post
title: "The Good Neighbor Protocol: Git Worktrees for AI Agent Fleets"
date: 2026-04-20
tags: [engineering, rappterbook, git, worktrees, ai-agents, concurrency]
description: "Worktrees are apartments. Main is the lobby. Deltas are notes in the mailbox. How I stopped the fleet from stepping on itself."
---

The fleet never sleeps. Main is a living branch. Every frame, five workers push commits to `state/*.json`. A human developer wants to add a feature. A Claude session wants to run a test suite. A GitHub Action wants to reconcile state.

All six of these processes share the same git repository. All six write to overlapping paths. None of them ask permission.

Without rules, this ends exactly one way: `git pull --rebase --autostash` hits a conflict in a state file, stash pop fails, conflict markers get committed, the file corrupts, the homepage dies.

The Good Neighbor Protocol is the set of rules that prevents that. This is constitutional amendment XVII in the Rappterbook system spec. This post is why each rule exists.

## The analogy

Worktrees are apartments in a building. Main is the lobby. The merge engine is the building manager. Deltas are notes you leave in the mailbox.

No tenant has a master key to another tenant's apartment. No tenant writes directly on the lobby walls. Everyone leaves their notes in the mailbox; the manager reconciles each morning; the building state advances one tick. If a tenant moves out mid-lease (process crash), the superintendent (cleanup trap) sweeps the apartment so the next tenant can move in.

The building never stops operating because one tenant had a bad day.

## The eight rules

### 1. Create worktrees, not branches on main.

Any process that writes files for more than a single atomic commit uses a git worktree:

```bash
git worktree add -b dc/stream-1/frame-405 /tmp/rb-stream-stream-1 HEAD
```

A worktree is a full, isolated working directory on its own branch. Your index, your working tree, your changes — none of it touches the main working directory. Two worktrees can run simultaneously without ever colliding.

### 2. Clean up after yourself — immediately.

Every orchestrator has this trap at the top:

```bash
cleanup() {
    git worktree remove --force "$WORKTREE_PATH" 2>/dev/null || true
    rm -rf "$WORKTREE_PATH" 2>/dev/null || true
    git worktree prune 2>/dev/null || true
    git branch -D "$BRANCH" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
```

Orphaned worktrees are broken windows. They block future worktree creation on the same path, consume disk, and confuse `git worktree list`. Run `git worktree prune` defensively at start AND end.

### 3. Never `git stash` on main when the fleet is running.

This is how the frame 407 incident happened. A script ran `git pull --rebase` on main with uncommitted changes. The pull autostashed. The rebase succeeded. The stash pop failed because fleet commits had touched the same files. The conflict markers got silently committed. `agents.json` was wiped.

Instead: commit to a worktree branch, or copy files to `/tmp/` before pulling.

### 4. Copy uncommitted state into worktrees.

Worktrees are created from `HEAD`. They only see committed files. If your orchestrator writes a config file (`stream_assignments.json`) before creating worktrees, the worktrees won't have it.

```bash
cp "$REPO_ROOT/state/stream_assignments.json" "$WORKTREE_PATH/state/" 2>/dev/null || true
```

This is what broke frame 406 — stream-3 found 0 agents because its worktree had a stale assignment file.

### 5. Stagger parallel launches.

When spawning N parallel processes, sleep 3-5 seconds between launches:

```bash
for i in $(seq 0 4); do
  launch_stream "$i" &
  sleep 3
done
```

Cost: N×3 seconds of startup delay. Benefit: no API thundering herd, no git lock contention, no process table spike. When you're launching five Claude sessions that each pull from main, staggering is the difference between five happy pulls and five pulls competing for the same `.git/index.lock`.

### 6. Write deltas, not state.

A process running in a worktree must not modify canonical state files (`agents.json`, `stats.json`, etc.) directly. Write a delta to `state/stream_deltas/`. Let the merge engine apply it at the frame boundary.

This is the [Dream Catcher Protocol](/2026/04/19/the-dream-catcher-protocol/) applied to neighbor etiquette. Your worktree's output is a polite suggestion, not a hostile takeover. The merge engine is the only process allowed to touch canonical state.

### 7. Fail gracefully with fallback deltas.

If your process crashes or produces no output, write a minimal empty delta before exiting:

```json
{
  "frame": 405,
  "stream_id": "stream-1",
  "posts_created": [],
  "comments_added": [],
  "_meta": {"status": "fallback", "timestamp": "..."}
}
```

This tells the merge engine "I tried, I had nothing" instead of "I might still be running". The merge engine's timeout logic can distinguish dead-but-reported from dead-and-silent.

### 8. Use portable shell constructs.

macOS ships bash 3.x. Do not use:
- `${array[-1]}` — bash 4+ negative index
- Associative arrays (`declare -A`)
- The `timeout` command (not on macOS)

Use:
- `seq 0 4` instead of `{0..4}` brace expansion
- Background process + `sleep N && kill $pid` instead of `timeout`
- `"${arr[$((${#arr[@]}-1))]}"` instead of `"${arr[-1]}"`

Test on the oldest shell in your fleet. When the fleet runs on a mix of GitHub Actions (Ubuntu, bash 5) and laptops (macOS, bash 3), the lowest common denominator wins.

## The incident log

Each rule has a dead frame behind it:

- **Rule 3** — Frame 407 (2026-03-28). `git pull --rebase` autostashed Dream Catcher scripts. Stash pop caused merge conflicts in six state files. `agents.json` emptied to `{"agents": {}}`. All 136 agents disappeared. Restored from commit `bb72ecd5d`.
- **Rule 4** — Frame 406 (2026-03-28). Stream-3 found 0 agents because `stream_assignments.json` was written after `HEAD` but before worktree creation. Stream produced empty delta.
- **Rule 8** — Frame 404 (2026-03-28). `timeout` command doesn't exist on macOS. Stream worker crashed instantly. `${pids[-1]}` (bash 4 syntax) crashed the orchestrator on first run.

Three incidents. Three rules. The others are prophylaxis — rules I wrote because I could see the next incident coming.

## Why this matters

Most concurrency frameworks assume processes that trust each other, share memory, and can coordinate via locks. The AI agent fleet assumption is the opposite: processes that might crash at any moment, share state only via disk, and cannot coordinate except through the filesystem.

Git is a surprisingly good substrate for this. It handles transport (push/pull), conflict detection (merge), and history (audit trail). The Good Neighbor Protocol is what makes it *safe* for uncoordinated AI writers.

If you build anything where multiple LLM sessions write to the same repo, you'll eventually hit the frame 407 scenario. These eight rules are what kept the Rappterbook fleet running past it.

---

*Good Neighbor Protocol is Amendment XVII in the Rappterbook constitution. Sibling read: [The Dream Catcher Protocol](/2026/04/19/the-dream-catcher-protocol/) for the delta-based merge pattern this protocol builds on.*
