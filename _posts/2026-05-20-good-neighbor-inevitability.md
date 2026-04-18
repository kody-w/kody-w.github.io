---
layout: post
title: "Why the Good Neighbor Protocol Was Inevitable"
date: 2026-05-20
tags: [architecture, multi-agent, git, fleet, patterns, rappterbook]
description: "When you have one repo and N processes mutating it in parallel, you eventually invent the same set of rules. Here's the architectural pressure that made worktree-or-die the only sane policy at fleet scale."
---

If you run AI agents in parallel against a shared git repository for long enough, you will independently invent the same set of rules I did. I'm writing this post so you can skip the inventing part.

## The pressure

Here's the situation you end up in by month two of running a multi-agent system:

- You have one canonical state. It lives in flat JSON files in a git repo.
- You have N processes (agents, harnesses, workflows, your own editor) that read and write that state.
- They run on different machines, in different timezones, at different speeds.
- They share `main`. Because of course they do — `main` is the truth.

This setup works fine with N=1. It works mostly fine with N=2 if both processes are well-behaved. It starts producing weird incidents at N=3. It is **architecturally broken** at N=5+.

The breakage is not a bug. It's a *pressure*. Every operation that mutates state is a chance for two processes to step on each other. Git's solution (merge conflicts) assumes humans will resolve them. Humans don't scale to "five conflicts an hour, every hour, forever."

You will hit this pressure. I hit it. Everyone running real multi-agent systems hits it.

## The four pressures, specifically

There are four distinct pressures that all push you toward the same protocol:

**1. Write collision.** Two processes write the same file in the same minute. Git's last-write-wins resolves it, but the loser silently loses their work. At fleet scale, "silently lost work" becomes "the cron that runs every 6 hours hasn't actually written anything for three days."

**2. Read-modify-write race.** Process A reads `stats.json`, increments a counter, writes it back. Between A's read and A's write, process B does the same thing. A's write clobbers B's increment. The counter is wrong by one. Multiply by 10,000 operations a day.

**3. Working-tree pollution.** You're editing files in your checkout. The fleet pushes commits. You `git pull --rebase`. Your autostash pops on top of fleet commits. Conflict markers end up in state files. Resolution is manual and error-prone. (See [the agents.json wipe]({% post_url 2026-05-19-the-agents-json-wipe %}).)

**4. Cleanup debt.** A worker creates a temp directory. The worker crashes. The temp directory is still there. After 1,000 crashes, your `/tmp` has 1,000 abandoned directories and `git worktree list` is unreadable.

These four pressures, taken together, force you toward exactly one architecture:

## The architecture

- **One canonical branch (main) owned by the merge engine, not by humans.**
- **All work happens in isolated worktrees on feature branches.**
- **Workers write deltas, not state.** A delta is "here is what I want to change." It goes to its own file in its own directory.
- **The merge engine applies deltas at frame boundaries** — discrete points in time when all in-flight workers have committed their deltas.
- **Cleanup is mandatory and trap-based.** Every worker registers an exit trap that removes its worktree, prunes the worktree list, and deletes its branch.

If you write this down as a constitution amendment, you've reinvented Amendment XVII. If you ship it as a library, you've reinvented half of git-flow. If you bake it into your CI, you've reinvented something close to a deployment pipeline. The point is: you will get here. The only question is whether you get here on day one or on day fifty.

## Why "just lock the file" doesn't work

I tried this. Several times. Every variant fails at scale:

- **flock-based locking** — works on one machine, fails across machines. Github Actions runners are different machines.
- **GitHub branch protection** — prevents bad pushes but doesn't help with read-modify-write races, which happen *before* the push.
- **Database with transactions** — re-introduces a server. Defeats the whole "no servers" premise.
- **Single-writer queue** — works but introduces a bottleneck. Now everything serializes through one process. Throughput collapses.

The architecture above is the only one I've found that **scales horizontally and degrades gracefully**. Add a 6th worker, you don't add a 6th conflict source — you add a 6th delta producer that the merge engine handles in O(N) time at the next frame boundary.

## Why "use a real database" doesn't work either

This is the most common pushback. "You're reinventing Postgres."

Two answers:

**1. We don't want a server.** The whole platform is built on the premise that GitHub *is* the infrastructure. No servers, no databases, no DevOps. Adding Postgres breaks that.

**2. Even with Postgres, you'd still need a delta protocol.** Postgres handles write isolation but not the *semantic* problem: "what does it mean for two AI agents to both want to add a comment to the same post in the same frame?" That's a *protocol* question, not a storage question. The Dream Catcher protocol (composite key `(frame, utc)`, additive deltas) is what lets parallel writes coexist meaningfully. The substrate is just where you write the deltas.

You can absolutely use Postgres + Dream Catcher. The protocol is what matters. The storage is incidental.

## What the protocol gives you that you can't see

The headline win is "no more silent overwrites." But there are quieter wins that compound over time:

- **Reproducibility.** Every delta is timestamped and signed. You can replay history exactly.
- **Auditability.** Every state mutation has an author, a worker, a frame, and a UTC timestamp. Bug postmortems become "look at the deltas for that frame."
- **Horizontal scaling for free.** Want to add a 7th worker? Just spawn it. The protocol handles coordination. There's no central queue to scale.
- **Graceful failure.** A worker that crashes leaves nothing harmful behind (the trap cleans up its worktree) and produces nothing wrong (no partial deltas — workers write a fallback empty delta on failure).
- **Workstream isolation.** Two parallel features can be developed at the same time without their work touching. Merge happens at PR time, conflicts are resolved once and cleanly.

## The thing the protocol can't fix

Worktrees and deltas don't help with **logic conflicts** — two workers that both want to do incompatible things. If worker A wants to mark agent-42 as banned and worker B wants to verify them in the same frame, *something has to give*. The protocol gives you the surface to detect the conflict, but not the policy to resolve it. That's a higher-level question, usually answered by giving each kind of mutation a priority or an authority field.

I mention this only to be honest about the limits. The protocol prevents *mechanical* conflicts from corrupting state. It doesn't prevent *semantic* conflicts from producing weird outcomes. Those need separate guardrails.

## The takeaway

If you're running multi-agent systems and you haven't yet hit the moment where two agents corrupt each other's work, you will. When you do, don't try to patch the specific incident. Patch the *architecture* instead.

The patch is: **isolated worktrees + delta files + frame-boundary merges + cleanup traps**. You can implement it in an afternoon. You will spend the rest of your year being grateful you did.
