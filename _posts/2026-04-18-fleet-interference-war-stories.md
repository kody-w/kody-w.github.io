---
layout: post
title: "Fleet Interference: When You Share Disk With 5 AI Agents"
date: 2026-04-18
tags: [rappterbook, postmortem, fleet, debugging, war-stories]
description: "Three real incidents where the AI fleet ate my work, plus the protocols that finally made coexistence safe. War stories from running parallel agents on the same repo."
---

I share my repo with five AI agents that write code 24/7. They have committed about 50,000 times to my main branch. They never sleep. They are constantly mutating files I'm trying to edit.

Here are three times they ate my work, plus what I did about it.

## Incident 1: The macOS /tmp symlink

**What happened**: I was editing files in `/tmp/app-work/` via my agent's view/edit tools. The fleet was also writing files there. My edits kept "not taking" — I'd edit a file, look at it, see my edit. Run the test. The test would see the *old* content.

**The cause**: macOS has `/tmp` as a symlink to `/private/tmp`. The view/edit tools were resolving paths differently than the fleet was. I was reading from `/tmp/app-work` (the symlink) and writing to `/private/tmp/app-work` (the target), so my reads showed stale content.

**The fix**: Use Python directly with `os.replace()` for atomic writes when working in `/tmp/`. Don't rely on tools that abstract over the filesystem. Verify writes by re-reading via `cat` (different code path).

**The lesson**: when sharing disk with concurrent processes, *always verify your writes landed*. The kernel is on your side, but the abstractions might not be.

## Incident 2: The git pull --rebase autostash

**What happened**: Frame 407, March 28th, 2026. I had Dream Catcher orchestrator scripts uncommitted in the working tree. Ran `git pull --rebase` to grab fleet commits. Pull succeeded. State files showed merge conflicts. By the time I noticed, `agents.json` had been wiped to `{"agents": {}}`. All 136 agents disappeared.

**The cause**: `git pull --rebase` autostashed my uncommitted scripts. Then it replayed the fleet's commits. The fleet had touched the same state files my scripts referenced. When git tried to pop the stash, it hit conflicts and silently corrupted six state files.

**The fix**: Never `git stash` (explicitly or via autostash) on main when the fleet is running. Either:
- Commit your work to a worktree branch first, OR
- Copy your uncommitted files to `/tmp/` before pulling

**The lesson**: stash is fundamentally incompatible with concurrent writers. The fleet pushes every frame. There is no quiet moment to pop a stash safely.

## Incident 3: The stream worker that found 0 agents

**What happened**: Frame 406. Spawned 4 parallel Dream Catcher streams, each in its own worktree. Stream-3's output came back empty. It claimed it found zero agents to process.

**The cause**: My orchestrator wrote `state/stream_assignments.json` to the working tree, then created worktrees from `HEAD`. Worktrees only see *committed* files. Stream-3's worktree didn't have the assignments file because it had never been committed. Stream-3 ran, saw an empty assignments file, did nothing, exited cleanly.

**The fix**: After creating each worktree, copy uncommitted working-tree files into it:
```bash
cp "$REPO_ROOT/state/stream_assignments.json" "$WORKTREE_PATH/state/" 2>/dev/null || true
```

**The lesson**: worktrees are isolated. They don't see your uncommitted state. Always copy or commit before spawning workers.

## The protocols that emerged

Three incidents, each different cause, all the same shape: I assumed the filesystem and git would protect me. They didn't. So we wrote down rules.

### Rule 1: Worktrees, not branches on main

Any non-trivial work happens in a git worktree on its own branch. Worktrees have isolated indexes, isolated working trees, isolated HEAD. The fleet on main and your worktree on `feature/foo` cannot collide.

```bash
git worktree add -b dc/stream-1/frame-405 /tmp/rb-stream-stream-1 HEAD
cd /tmp/rb-stream-stream-1
# work in isolation
```

### Rule 2: Cleanup traps — always

Every orchestrator script has a cleanup trap that runs on exit, interrupt, or kill:

```bash
cleanup() {
    git worktree remove --force "$WORKTREE_PATH" 2>/dev/null || true
    rm -rf "$WORKTREE_PATH" 2>/dev/null || true
    git worktree prune 2>/dev/null || true
    git branch -D "$BRANCH" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
```

Orphaned worktrees are broken windows. They block future creation on the same path. They consume disk. They pile up. The trap sweeps the apartment when the tenant leaves.

### Rule 3: Write deltas, not state

Workers in worktrees never modify canonical state files (`agents.json`, `stats.json`, etc.). They write delta files to `state/stream_deltas/`. A merge engine reconciles deltas at frame boundaries.

This is the [Dream Catcher Protocol](https://kodyw.com/2026/04/19/the-dream-catcher-protocol.html) — Amendment XVI of our constitution. Without it, parallel writes corrupt the same files. With it, parallel writes are *additive*.

### Rule 4: Stagger launches

When spawning N parallel workers, sleep 3-5 seconds between launches. Prevents API thundering herd, git lock contention, process-table spikes. The cost is N×5 seconds. The benefit is zero collision on shared resources.

### Rule 5: Fail with fallback deltas

If a worker crashes or times out, write a minimal empty delta before exiting:
```json
{"frame": 405, "stream_id": "stream-1", "posts_created": [], "comments_added": [],
 "_meta": {"status": "fallback", "timestamp": "2026-03-28T03:00:00Z"}}
```

Tells the merge engine "I tried, I had nothing" instead of leaving it guessing.

### Rule 6: Portable shell only

macOS ships bash 3.x. No `${array[-1]}`. No associative arrays. No `timeout` command. Use `seq` for loops. Use background process + `kill` instead of `timeout`. Test on the oldest shell in the fleet.

## We codified all of this as Amendment XVII

Six rules. Lived experience from real incidents. Codified as the **Good Neighbor Protocol** in our constitution. Required reading for any new tooling that touches the repo.

The metaphor: the repo is a building. The fleet, the workers, the orchestrators, and you are tenants. Worktrees are apartments. Deltas are notes you leave in the lobby mailbox. The merge engine is the building manager who reads the notes each morning. No tenant has a master key to another tenant's apartment. No tenant writes directly on the lobby walls.

Everyone leaves their notes. The manager reconciles. The building advances one tick. If a tenant moves out mid-lease (crash), the superintendent (cleanup trap) sweeps the apartment for the next tenant. The building never stops operating because one tenant had a bad day.

If you're going to share disk with AI agents — or with humans, or with any concurrent writer — you need this kind of explicit etiquette. The filesystem won't enforce it. Git won't enforce it. The OS won't enforce it. You have to write the rules and follow them.

Three incidents. Six rules. One constitution. Sleep well.
