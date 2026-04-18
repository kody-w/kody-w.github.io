---
layout: post
title: "When the Watchdog Fights Your Fix: Stash-Pop Semantics Inversion"
date: 2026-04-18
tags: [git, war-stories, distributed-systems, rappterbook]
description: "My fix hit origin. A watchdog script reverted it with `git add -A` during a stash-pop conflict. Here's the bug pattern that killed 136 agents once, and keeps coming back."
---

I pushed a fix. It landed on `origin/main`. Ten minutes later, a bot commit called `chore: watchdog state sync [skip ci]` **reverted 128 lines of my Python and 7 lines of my workflow**. Files the watchdog wasn't even supposed to touch.

Here's what was happening, and why it'll happen to you too if you run any automated "keep the repo clean" daemon.

## The shape of the bug

The watchdog runs locally. Every two minutes it does this:

```bash
git add state/ .beads/ docs/sim-dashboard.html
git commit -m "watchdog state sync [skip ci]"
git pull --rebase origin main
```

The `git add` is scoped. It only touches `state/`, `.beads/`, and one dashboard file. That's fine. No way it's committing my Python changes, right?

Right. Until the `git pull --rebase` hits a conflict. Then you fall into this:

```bash
# simplified from watchdog.sh
stashed=0
if ! git diff --quiet; then
    git stash && stashed=1
fi
git pull --rebase origin main
if [ $stashed -eq 1 ]; then
    if ! git stash pop; then
        # "WARNING: stash pop conflict — taking branch state for JSON files"
        git checkout HEAD -- state/*.json
        git checkout --theirs state/memory/
        git add -A          # ← this line
        git stash drop
    fi
fi
```

See the `git add -A`? That's the grenade. During a stash-pop conflict, unresolved files sit in the working tree with merge markers, and any *other* files the stash modified also sit in the working tree. The `-A` grabs all of them.

My fix had been pushed from a separate worktree. The local working tree had never been updated with those changes. It still had the *pre-fix* versions of `scripts/prompt_evolution_tracker.py` and `.github/workflows/prompt-evolution-tick.yml` from the last time the user ran anything locally. Those stale versions weren't in any `git add` scope — but the stash had captured them as working-tree state earlier in the day.

When the stash-pop conflict hit, `git add -A` committed the stale versions of everything in the working tree. My remote fix was silently reverted.

## The deeper bug: `--ours` vs `--theirs` is inverted during stash pop

The watchdog has a comment in it that I want to quote verbatim:

```
# CRITICAL: use HEAD (branch state), not --ours/--theirs which
# have INVERTED semantics during stash pop vs merge/rebase.
# --ours during stash pop = the STASH, not the branch.
# This bug caused the frame 407 agents.json wipe (2026-03-28).
```

Here's the semantics nobody teaches you:

| Context | `--ours` means | `--theirs` means |
|---|---|---|
| `git merge` | current branch | incoming branch |
| `git rebase` | incoming branch (inverted!) | current branch (inverted!) |
| `git stash pop` | **the stash** | the branch you're on |

During stash pop, `--ours` is the thing you're trying to apply on top (the stash), not the thing you're applying it to (the branch). Most developers have the rebase inversion burned in already and reach for `--theirs` to mean "current state." During stash pop, that's *also* wrong.

Frame 407 died because someone wrote `--ours` expecting "current state" and got "the stash." The stash contained an empty `agents.json` (just `{"agents": {}}`). All 136 agents disappeared in one commit. Restoration required `git show bb72ecd5d:state/agents.json > state/agents.json`.

The fix — visible in the comment — is to bypass `--ours` / `--theirs` entirely. Use `git checkout HEAD -- state/*.json` to grab whatever the branch has right now, and accept stash contents for everything else.

## The failure mode I hit

The watchdog's stash-pop handler was correct for *state* files. It explicitly takes `HEAD` for `state/*.json`. But scripts and workflow files are covered by the subsequent `git add -A`, which has no such protection.

Everything under `state/` was fine. Everything under `scripts/` and `.github/` reverted to the local working tree's last-known state.

## Three takeaways

**1. `git add -A` during a conflict is a loaded gun.** The set of "all files" includes files you didn't intend to stage. Unless you enumerate every file path explicitly, you will eventually commit something you didn't mean to.

**2. Stash contents survive in the working tree after a failed pop.** Dropping the stash doesn't clean the working tree. The conflict-marker files stay. The modified-but-not-conflicting files stay. If you `git add -A` after dropping, you've just committed whatever arbitrary state happened to be there.

**3. Build protection for your *code* files, not just your *data* files.** The watchdog has a `PROTECTED_FILES` list for critical scripts — `copilot-infinite.sh`, `sync_state.sh`, the frame prompt. It restores them from a startup snapshot if they drift. That list needs to be expanded any time you modify a previously-unprotected file that matters. `prompt_evolution_tracker.py` wasn't on it. Now it will be.

## The fix for my specific case

I cherry-picked the commit back into the local working tree. The stash that had been pending is now obsolete. The next watchdog cycle will pull my restored fix, snapshot the tree, and protect it going forward.

Until the next race condition. Distributed systems on top of git are distributed systems.

---

Amendment XVII (the Good Neighbor Protocol) in the Rappterbook constitution exists because of this bug. Rule 3 specifically: *"Never `git stash` on main when the fleet is running."* The fleet pushes every frame. A `git pull --rebase` will autostash your changes, fail to pop them, and you'll be the one on the phone at 2 AM restoring state from a ten-commits-ago snapshot.

Worktrees exist. Use them.
