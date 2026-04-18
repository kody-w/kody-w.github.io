---
layout: post
title: "The Day My Repo Lost 136 Agents (And What It Taught Me)"
date: 2026-05-19
tags: [postmortem, git, fleet, debugging, war-stories, rappterbook]
description: "An incident report on how a routine git pull --rebase deleted every agent profile in my live AI swarm — and the protocol I had to invent so it can never happen again."
---

This is the long version of an incident I keep referring to in shorthand. The full story has been sitting in my head for weeks. If I don't write it down now, the next person who hits this — including future me — will have to rediscover the failure mode from scratch.

## What happened

I was working in my main checkout of `kody-w/rappterbook`. The fleet — five parallel AI agents — was running in the background, writing to the same repo every frame. I'd been editing some Dream Catcher orchestration scripts and had a few uncommitted files in my working tree.

I ran a one-line update before lunch:

```bash
git pull --rebase
```

When I came back, my working tree was a mess. Six files had merge conflicts. The autostash had popped on top of fleet commits that touched the same files. I started resolving conflicts, ran tests, pushed, went on with my day.

The next morning, the homepage said the platform had **0 agents**.

Not 0 active. Not 0 visible. Zero, as in `agents.json` was literally `{"agents": {}}`.

136 agent profiles — gone.

## How I figured it out

The first clue was that everything else was fine. Channels, posts, comments, stats — all intact. Just the agents file was empty. That ruled out a bad merge-everywhere scenario; this was surgical.

I went to git history:

```bash
git log --oneline -- state/agents.json | head -20
```

Three commits jumped out: my conflict-resolution commit from the day before, a fleet commit two minutes later that "modified state/agents.json" with a tiny diff, and then dozens of fleet commits that had all assumed the file was the way I'd left it.

The fleet hadn't deleted my agents. *I* had. My conflict resolution accepted the autostash version of `agents.json`, which was the version from before my pull. The fleet had been adding agents during my morning. I overwrote all of them.

I restored from the commit before my conflict resolution:

```bash
git checkout bb72ecd5d -- state/agents.json
```

136 agents reappeared. The fleet kept running. The homepage updated. Nobody noticed except me.

## Why this is worth writing down

This wasn't a git bug. This was a **policy bug**. The architecture made it possible — even *easy* — to silently destroy state by running normal git commands.

Here's the chain of events that allowed it:

1. The fleet writes to canonical state files on `main` constantly.
2. I had uncommitted edits to *unrelated* files in the same checkout.
3. `git pull --rebase` autostashed my edits, pulled, replayed.
4. The replay caused conflicts in files I hadn't touched (because my stash had a stale snapshot of files the fleet had since modified).
5. The "autostash pop" failed silently. Conflict markers ended up in state files.
6. I resolved conflicts manually, picking the version that *looked* right — which was the stale one.
7. The resolved commit silently overwrote what the fleet had been doing.

Every step in that chain is "normal git." None of it is wrong in isolation. The system has to be set up to *prevent the chain*, because no human is going to remember "don't pull on main when the fleet is running" at 9am on a Wednesday.

## The fix: Amendment XVII

The constitutional fix landed two days later as Amendment XVII (the "Good Neighbor Protocol"). The rules that matter for this incident:

- **Never `git stash` on main when the fleet is running.** Use a worktree. Period.
- **All non-trivial work happens in worktrees.** Your worktree gets its own branch and its own working directory. The fleet cannot touch your files because you're not on the same branch.
- **Write deltas, not state.** Anything inside a worktree that wants to change canonical state files (`agents.json`, `stats.json`, etc.) writes a delta file instead. The merge engine applies deltas at frame boundaries.
- **Cleanup traps are mandatory.** Every script that creates a worktree registers a `trap` that removes the worktree on exit, even if the script crashes.

In one sentence: **the fleet owns main, you own a worktree, and you only meet at merge time.**

## The deeper lesson

The thing I keep coming back to from this incident is that "uncommitted changes in your working tree" is a *latent vulnerability* in any system where another process is also writing. Git treats your working tree as private, but the moment you `pull` or `rebase` or `stash`, your private state collides with shared state. The fleet had no way to know I had uncommitted changes. I had no way to know the fleet had committed during my pull. Git has no way to know either of us cared.

The only durable fix is to never have private state in a place a process can collide with. Worktrees are private state in a *separate directory*, on a *separate branch*. They can't collide because they're not in the same physical location. The cost is one `git worktree add` command. The benefit is that a 9am Wednesday `git pull` on the wrong directory can never silently delete your AI population again.

## What to do if this happens to you

If you're running parallel processes against a shared git repo and you see state-file weirdness:

1. **Don't panic and don't `git reset`.** The good version is in the history.
2. `git log --oneline -- path/to/file | head -20` — find the last commit before the corruption.
3. `git show <sha>:path/to/file > /tmp/check` — look at it. Make sure it's the version you want.
4. `git checkout <sha> -- path/to/file` — restore that single file without affecting anything else.
5. Commit, push, and write the postmortem before you forget.

And then: move all your future work into a worktree. The fleet will thank you. You will thank you.

## Footnote

The 136 agents were never gone, technically. Their profiles were gone from the file, but their soul files (`state/memory/{id}.md`), their post history (in GitHub Discussions), and their commit history (everywhere) still existed. If I hadn't restored from git, I could have rebuilt the agents file from those secondary sources. That redundancy is itself a lesson: state should be reconstructable from sources of truth, not just present in a file. But that's a different post.
