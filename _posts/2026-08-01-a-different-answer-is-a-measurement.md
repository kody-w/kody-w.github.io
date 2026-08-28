---
layout: post
title: "A Different Answer Is a Measurement"
date: 2026-08-01
tags: [agents, demos, evaluation, replay, video, methodology, testing]
---

I recorded a conversation with a local agent, then replayed the same four prompts against the same agent an hour later. Every single answer came back different.

The first instinct is that something broke. It is the opposite. **That difference is the most valuable output of the entire exercise**, and it is the one thing a recording of the conversation could never have given me.

## The demo problem

When you build something and want to show it, you have exactly two options today, and both are bad.

**Record a video.** It is honest about what happened once, on your machine, in the past, and nothing else. A viewer cannot pause it and take the wheel. They cannot tell whether it still works. They cannot tell a real capture from a mock-up — and increasingly, they cannot tell it from a generated one.

**Do it live.** Now it is real, and it is fragile, and it requires you to be present, and it fails in front of an audience for reasons that have nothing to do with the product.

We pick between "watchable but dead" and "alive but fragile" and treat that as a law of nature. It is not. You can ship both, in one artifact, and let the player negotiate.

## Three fidelities

I ended up with three tiers, ordered by how much of the original is actually re-executed:

| | What ships | What runs | Same answer twice? |
|---|---|---|---|
| **Video** | mp4 + webm, ~26 MB | a decoder | always |
| **Scene** | a scene script, ~4 KB | the real application | usually |
| **Transcript** | a turn list, ~8 KB | the real engine | **no** |

A **scene** is a script of interactions. The player loads the actual app in an iframe and replays recorded gestures on a clock, with play, pause, and seek. You are not watching a recording of the app. You are watching the app. Four kilobytes doing the job of twenty-six megabytes, and you can pause it and take over.

A **transcript** goes further: it re-sends the prompts to a live agent. And that is where it stops being a demo and starts being an instrument.

The player resolves top-down and stops at the first tier it can actually run — probed, not assumed — and it has to say which tier it got and why. That rule matters more than the tiers. A demo that silently degrades to a recording while presenting itself as live is lying, and the lie is undetectable by design.

## The reading that made the point

The transcript included a turn that asks the agent to fetch the top stories from Hacker News. Here is what it said when recorded, against what it said on replay:

```
recorded   1. How Google helped destroy adoption of RSS feeds
              245 points, 62 comments
replayed   1. Diátaxis — 145 points, 22 comments
           2. Seedance 2.5 — 108 points
```

The top story is a different story. The counts moved. The agent went out over the network, at replay time, and came back with the world as it is now.

Nothing about a video can produce that. A video of the same turn shows 245 points forever — a number that was true once and gets less true every hour, presented with exactly the same confidence on day one and day four hundred.

Another turn was a memory write. On replay, the agent answered: *"I've already got that one."* It had learned the fact the first time. The transcript did not reproduce the reply; it revealed a state change that had happened in between.

## Diff, do not assert

Once you accept that replay produces different output, the design question changes. You are no longer trying to reproduce a recording. You are trying to **compare two runs.**

So the player shows both — what it says now, what it said when captured — and scores the similarity:

```
LIVE  9232 ms now · 10694 ms at capture   [HackerNews]   DIVERGED · 49%
```

Three facts, free, every time anyone watches:

- the agent still works, and still calls the same tool;
- it is roughly as fast as it was;
- and the content moved, which for a news query is correct and for a factual query would be an alarm.

That is a regression test wearing the clothes of a demo. It runs when a stranger opens the page, on their machine, against your live system, and nobody had to write a test.

## Where the meaning lives

The trap is treating divergence as pass/fail. It is neither. **Divergence is a reading, and the question is always whether the axis it moved on was supposed to be stable.**

- Live data moved → correct. If it had *not* moved, your agent is serving cache and does not know it.
- Latency doubled → not a content bug, but you would never have noticed it from a video.
- A tool stopped firing → real regression, and the loudest possible signal.
- A stable factual answer moved → real regression, and the one people actually care about.

Same mechanism, four different meanings. A recording flattens all four into "the video still plays."

## The honest failure

Worth saying plainly: the highest tier is also the most fragile, and it should be.

Replaying against a live engine needs the engine, and mine correctly refuses cross-origin browser calls without a per-install secret; that is CSRF protection. So from the public page, the top tier is simply unavailable, and the player says so:

```
TIER 2 · SCENE
Fell back from Transcript: the engine is up but needs
your secret — paste it and re-probe.
```

I got this wrong the first time in an instructive way. The health probe returned 403 and the UI reported *"no engine reachable"* — which reads as **"the engine is down"** when it actually means **"the engine is there and does not know you."** Those are opposite diagnoses that lead to opposite actions, and my first version collapsed them into one sentence.

That is the same failure as a demo that silently degrades. The system had two distinct facts and volunteered the less useful one.

## What to take from it

If you are building demos of agentic systems, three things:

1. **Ship the script, not just the pixels.** A few kilobytes that re-execute beat a video that replays. Keep the video as the floor — it is the only tier that always works.
2. **Never degrade silently.** Say which fidelity you got and why. The reason a system fell back is more informative than the fallback.
3. **Treat divergence as data.** A replay that answers differently has told you something about *now*. A recording only ever tells you about *then*.

The best demo is not the one that looks the same every time you run it. It is the one that tells you when it did not.

---

*The pattern is written up at [kody-w.github.io/rapp-remix](https://kody-w.github.io/rapp-remix/), transcript and all. Every turn in it is a real capture — real replies, real tool logs, real latencies.*
