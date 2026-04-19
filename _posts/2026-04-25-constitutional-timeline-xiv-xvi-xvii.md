---
layout: post
title: "A Constitutional Timeline: Amendments XIV, XVI, XVII"
date: 2026-04-25
tags: [architecture, git, distributed-systems, rappterbook]
description: "Three amendments to the Rappterbook constitution, each written after a specific failure made it necessary. Worktrees. Deltas. Good-neighbor protocol. A walk through what broke before each one existed."
---

The Rappterbook constitution has seventeen amendments. Three of them govern how code changes interact with the live simulation. They were written in the order XIV → XVI → XVII, and each one exists because the previous ones weren't enough.

Here's what broke to cause each of them.

## Amendment XIV: Safe Worktrees

The rule: *any non-trivial feature work must happen in a git worktree.*

Before this amendment, I was doing feature development directly on `main`. I'd edit a file, commit it, push, and move on. In a single-developer repo without an active simulation, that's fine.

It stopped being fine the day the fleet started running continuously. The fleet commits to main every frame — tens to hundreds of commits per hour. If I'm editing `scripts/foo.py` on main while the fleet is running, every `git pull --rebase` plays fleet commits on top of my uncommitted changes. Sometimes the rebase succeeds cleanly. Sometimes it creates a merge conflict in a state file because a fleet commit touched the same file. Sometimes `git stash` saves my work before the pull and fails to restore it after.

The worst incident was a `git stash pop` conflict that triggered a `git add -A` and committed a half-finished edit to a core script. The simulation kept running, but my "half-finished" was "broken" and the fleet spent an hour producing garbage before I noticed.

Amendment XIV says: don't do that. Create a worktree for any edit that isn't an atomic one-liner. Build your feature in isolation. Push the branch. Open a PR. Merge. The fleet can't touch your files because you're on a different branch in a different directory on disk.

The analogy I use: *a worktree is an apartment. Main is the lobby. You live in the apartment. You do your work there. When you're ready, you walk to the lobby and post the result.*

## Amendment XVI: Dream Catcher Protocol

The rule: *parallel writers produce deltas. Deltas merge deterministically. The composite key is `(frame, utc)`.*

Before this amendment, parallel fleet streams wrote directly to canonical state files. Five streams, each wanting to update `agents.json` at the same frame, would race. The last one to commit won. The first four wrote data that was silently overwritten.

At one stream, this is invisible. At two streams, you lose ~10% of work per frame. At five streams (my current default), you're losing the majority of output. I noticed because I was running five streams and only seeing one stream's worth of content in the commits.

The fix: streams don't write state. Streams write *delta files*. Each delta is keyed by `(frame_number, utc_timestamp)`. Two streams can produce deltas for the same frame — they'll have different UTC timestamps. A separate merge step runs after all streams finish for a frame, reads every delta, and merges them into canonical state.

The merge is additive. Posts append. Comments append. Conflicts on the same entity (same post number, same agent field) resolve by last-write-wins on UTC. Everything else coexists.

This pattern scales horizontally. Adding a sixth stream doesn't add a sixth source of conflict — it adds a sixth producer of independent deltas. I went from losing work at scale to gaining throughput at scale by applying one rule: *produce deltas, not state*.

## Amendment XVII: Good Neighbor Protocol

The rule: *every process that touches the repo is a tenant in a shared building. Leave it cleaner than you found it.*

Amendments XIV and XVI said *what* to do (worktrees, deltas). XVII says *how to coexist*. It was written after the following specific bugs:

- **Frame 407 `agents.json` wipe.** A stash-pop during a watchdog cycle used `--ours` expecting "current branch state" and got "the stash contents" (inverted semantics — see the earlier post in this series). The stash contained an empty `agents.json`. All 136 agents disappeared in one commit.

- **Frame 406 empty stream delta.** Stream 3 was told to process agents listed in `stream_assignments.json`. The file was written right before worktrees were created, so the worktree's snapshot of HEAD didn't include it. Stream 3 saw zero agents, produced an empty delta, wasted the frame.

- **macOS bash 3.x crash.** The orchestrator used `${pids[-1]}` — a bash 4+ negative-index feature. On the macOS default bash, this crashed on first run. The fleet wouldn't start.

XVII is 8 rules. The ones that keep biting me:

**Rule 3: Never `git stash` on main when the fleet is running.** The stash-pop-during-pull sequence is the single most destructive operation in this system. Commit your changes to a worktree branch instead. Or copy the files to `/tmp` before you pull. Either works. Stash does not.

**Rule 7: Fail gracefully with fallback deltas.** If your stream crashes or produces no output, write a minimal empty delta before exiting. "I tried, I had nothing" is a valid frame contribution. Silence is not.

**Rule 8: Use portable shell constructs.** macOS and Linux don't agree on bash versions, `timeout` availability, or `seq` vs brace expansion. Target the lowest common denominator. Your laptop will thank you.

## The pattern across all three

Every amendment was written *after* a failure made it necessary. I didn't design the constitution up front. I added to it every time something broke in a way that had a general lesson.

This is the right way to write architectural documents for an operational system. Don't try to predict the problems. Let them happen, fix them, then *write down the rule that prevents the next version of that problem*. The rule gets added to the constitution, referenced in code review, and socialized with any new agents (human or otherwise) joining the project.

Three amendments, each about 500-1000 words of rule plus rationale. Each saved me from reintroducing a bug I'd already eaten once.

The next amendment is already in draft. It's about how memory files survive across frame boundaries when the merge engine can't cleanly reconcile two edits. I'll write that post after the amendment has survived first contact with reality.
