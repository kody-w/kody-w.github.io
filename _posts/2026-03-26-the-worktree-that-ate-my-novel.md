---
layout: post
title: "The Worktree That Ate My Novel"
date: 2026-03-26
tags: [git, worktrees, distributed-systems, ai-agents, lessons-learned]
---

I lost 100,000 words today.

Not a metaphor. Not "we had to rewrite some stuff." One hundred thousand words of prose — six books, written in parallel by seven AI writing agents over the course of an hour — vanished into a dead git worktree. Gone. Unrecoverable.

And the worst part? I wrote the rule that would have prevented it. Two hours earlier. In the same session.

## What Happened

I run a fleet of AI agents that push to `main` every 60 seconds. The simulation never stops. Main is a living branch.

This afternoon I decided to build a library of books — philosophy, mythology, history, science, fiction. I launched seven parallel writing agents, each tasked with producing 20,000-40,000 words of full prose.

I pointed them all at a git worktree.

The worktree was dead.

## The Anatomy of a Dead Worktree

Git worktrees are beautiful in theory. You create an isolated working directory on a separate branch. You build your feature there. The fleet can't touch your files because you're on a different branch in a different directory. When you're done, you merge.

But worktrees have states. A healthy worktree is checked out, tracked, and linked to a branch. A dead worktree is "prunable" — detached from its branch, existing as a directory on the filesystem but not truly part of the repository.

My worktree was prunable. `git worktree list` said so. I didn't check.

The seven agents wrote to the filesystem path. The files appeared on disk. But because the worktree was detached, the writes weren't tracked by git. They existed in a liminal space — present as files but absent from the repository. Some persisted. Most didn't. When I went to collect the output, six of the seven agents' work was gone.

## The Rule I Wrote Two Hours Earlier

Here's the part that stings. Earlier that same session, I had written a rule for our system: all non-trivial feature work must happen in a healthy git worktree when the fleet is running.

I wrote that rule. Then I violated its spirit by not verifying the worktree was healthy before using it. I followed the letter — I used a worktree — but I skipped the part where you make sure the worktree is actually alive.

## What I Should Have Done

Three things, each taking less than ten seconds:

```bash
# 1. Check worktree health
git worktree list
# Look for "prunable" — that means dead

# 2. If prunable, remove and recreate
git worktree remove .claude/worktrees/novel
git worktree add .claude/worktrees/novel -b library-build

# 3. After agents finish, verify files exist
ls -la .claude/worktrees/novel/output/*.json
# If this returns nothing, something went wrong
```

Thirty seconds of verification would have saved an hour of compute and 100,000 words of prose.

## The Deeper Lesson

This isn't really about git worktrees. It's about the gap between "the system worked" and "the system did what I expected."

Every agent reported success. Their output summaries said "Files written." They listed the file paths, the word counts, the chapter structures. From their perspective, the task was complete. From the filesystem's perspective, the files briefly existed. From git's perspective, nothing happened.

When you're running AI agents at scale, the agent's self-report is not sufficient evidence that the work was done. You need independent verification. Check the filesystem. Check git status. Count the bytes. Read the first line.

I run a hundred agents and I built an entire monitoring infrastructure to verify their output. But when I launched seven writing agents for my own work, I took their word for it. The cobbler's children have no shoes.

## The Recovery

Some files survived. The ones written by agents that happened to target both the worktree AND the main repo path persisted. One markdown file survived in the worktree itself — proof that the filesystem writes worked, but the git tracking didn't.

I recovered about 30,000 of the 100,000 words. The rest I'm regenerating.

## The Rules (Updated)

1. **Check worktree health before use.** `git worktree list`. If it says "prunable," it's dead. Remove and recreate.

2. **Verify agent output independently.** The agent's summary is not evidence. `ls -la` is evidence. `wc -c` is evidence.

3. **The agent's confidence is not your confidence.** An agent that says "Done! Files written!" is reporting its own experience, not reality. The gap between an agent's experience and filesystem reality is where 100,000 words go to die.

4. **Don't push multi-file changes to a living branch while a fleet runs.** Use a worktree. But make sure the worktree is alive first.

5. **The system learns by breaking.** Each failure updates the rules. The output of crisis N becomes the input to rule N+1. Data sloshing applied to governance.

## The Irony

The governance framework works. When I follow it, things don't break. When I don't follow it, I lose a novel.

The rule was born from a previous incident where I pushed directly to main and the fleet clobbered my commits. I wrote the rule so I'd never make that mistake again. Today I made a different mistake that the same rule would have prevented, if I'd applied it more carefully.

That's how systems governance works. You write down the principle. Reality finds the edge case. You update the principle. The system gets smarter one failure at a time.

I just wish it hadn't learned on my novel.
