---
layout: post
title: "Text Me Once: Notification-Agent Design Rules I Learned from a Nine-Day Spam Storm"
date: 2026-09-07
tags: [agents, engineering, reliability]
description: "A watcher agent that texted my phone every 15 minutes for nine days about three hosts that were, it turns out, back online the whole time. A five-times-a-day Hacker News scout that has never once repeated itself. The difference between them is the whole lesson."
---

I run two categories of autonomous agent that are allowed to text my phone. One of them, over the last few weeks, sent me a genuinely useful message every single time it ran. The other one sent me hundreds of near-identical messages about the same three unreachable machines for nine straight days, and none of them told me anything I hadn't already been told an hour earlier.

Same phone number. Same channel. Same "wake a human up" privilege. Wildly different outcomes. Worth writing down why.

## The bad one

I have a launchd job called the Principal — an agent that sits in on a handful of other agents across my tailnet every 15–30 minutes, grades them against the job they declared, and texts me the verdict. It also has a `heal` arm that SSHes into unreachable machines and tries to restart things, and a `relay` arm that forwards messages when a classroom's "own mouth is blocked."

Three of the five machines it watches went unreachable for nine days — a real network outage, not a bug. Here's what the agent did about it: it kept trying. Every 15 minutes, `heal` opened an SSH connection, timed out, tried to run RAPPSentinel remotely anyway, failed, and logged "healed battlestation: ran RAPPSentinel now" immediately followed by "after heal, battlestation grades F." Then it did that again 15 minutes later. And again. For nine days. `relay` did the equivalent — "relayed 1 message(s) for battlestation (its own mouth is blocked)" — dozens of times, identical, no new information in any of them. Meanwhile three other watchers had gone stale and silent the entire time and nobody ever escalated on *that*.

By the time I actually looked at the logs, there were hundreds of lines that all said the same thing in slightly different words. Not one of them was actionable. The signal-to-noise ratio was effectively zero, which is the same as having no signal.

## The good one

I also run a Hacker News scout — a tiny script, five runs a day, that scans HN top+new for threads in a few lanes I care about, drafts one paste-ready comment per thread, and texts me a batch of two or three. Every message is different. It has never once sent me a thread twice, because it keeps a `suggested.json` of every thread it's already surfaced and filters against it before picking. It doesn't depend on any machine but the HN API. If the API is briefly down, it just doesn't run that cycle — no retry storm, no escalation, nothing to text about.

It is, deliberately, a much dumber piece of software than the Principal. That's the point.

## What actually separates them

**Dedupe against state, not against nothing.** The scout keeps a seen-set and will die before it resends something. The Principal had no equivalent for "I already told you this host is down" — every tick was evaluated as if it were the first time, so every tick became a new outbound message.

**Don't put flaky infrastructure in the hot path of the alerting loop.** The scout's only external dependency is a public read-only API that either answers or doesn't. The Principal's core loop depends on SSH into machines on a home tailnet — inherently the least reliable link in the whole system — and treats every failure of that link as new information worth a text.

**Bound the output per run.** The scout caps itself at three picks, once per scheduled run. There is a hard ceiling on how annoying it can be in a single day (five runs × three items). The Principal had no ceiling at all: five classrooms, checked as often as every 15 minutes, each one capable of independently generating a message, with a `daily_escalation_budget` field in its config that nothing in the code actually enforced.

**Low, fixed frequency beats aggressive polling.** Five calendar-scheduled runs a day is enough to be useful and rare enough that a human can absorb every message. Fifteen-minute intervals only make sense if every message is either new information or nothing gets sent — and the Principal violated that by sending on every check regardless of whether the state had changed.

**A failure needs a circuit breaker, not a retry loop.** The single missing piece that would have fixed the Principal entirely: after N consecutive identical failures against the same target, stop re-emitting the same verdict and fire one distinct "this needs a human, and I'm going quiet until it changes" message instead. Right now that logic doesn't exist anywhere in the codebase. Nine days of retries produced nine days of noise instead of one useful escalation on day one.

## The rule

If you're building anything that's allowed to interrupt a human — text, push notification, Slack ping, whatever — it earns that privilege one message at a time, and it can lose it. The design question isn't "how do I detect this condition," it's "how do I make sure I only ever say it once." Keep a seen-set. Keep your alerting loop's dependencies boring and reliable. Cap your output. Collapse repeated failures into a single escalation instead of restating them. An agent that texts you the same unfixable fact every 15 minutes for nine days hasn't automated anything — it's just outsourced the noticing to your nervous system instead of its own state file.

## Ten more, so the pattern is unmistakable

The Principal/scout contrast turned out to be one instance of a much more general rule. Here are ten more pairs, all failure modes I've actually shipped and later fixed:

**1. Retry logic.** Bad: retry the same operation forever with no backoff and no ceiling — that's the Principal's `heal` arm, retrying SSH every 15 minutes for nine days. Good: exponential backoff with a max attempt count, then stop and escalate once. *A retry loop without a ceiling is a spam generator wearing a resilience costume.*

**2. Escalation vs. repetition.** Bad: send the same "grade F" message every cycle for nine days straight. Good: message once on a state *transition* (`OK→F`), stay silent while the state is unchanged, message once more on `F→OK`. *Alert on transitions, not on conditions.*

**3. Config that isn't enforced.** Bad: a `daily_escalation_budget: 8` field sitting in a config file that no code path ever reads. Good: every declared limit has a corresponding runtime check, or it isn't in the config at all. *An unenforced config key is a lie the next reader will believe.*

**4. Dependency placement.** Bad: put your alerting loop's core logic behind SSH into three flaky machines on a home network. Good: put the flakiest dependency as far from the alerting path as it can go — the scout's only hot-path dependency is a public, read-only API. *Put your least reliable dependency as far from your alerting path as it can go.*

**5. Idempotency.** Bad: an agent that re-suggests the same item if it runs twice before you act on the first suggestion. Good: a seen-set checked before every pick, so running it twice can never produce the same output twice. *If running it twice produces two outputs, it's not done being built.*

**6. Bounded output.** Bad: five watched targets, checked as often as every 15 minutes, each capable of independently generating a message — no ceiling on the day's total. Good: a hard cap like three items per run, five runs a day, so the day's maximum message volume is a known, small number. *Cap output at design time, not "aspirationally" in a comment.*

**7. Traceability.** Bad: the only record of an incident is a rotating log file that logrotate or a stray `rm` can erase completely. Good: an append-only, hash-chained ledger that outlives the process and that other agents can read and verify. *If the only copy of a decision is a log line, it doesn't exist for anyone else.*

**8. Self-healing scope.** Bad: "heal" a dead host by trying to run a command *on* the dead host — impossible by construction, and it'll report success anyway if you're not careful. Good: heal actions target things actually reachable from the healer; anything that requires the broken link to fix itself is an escalation, not a heal. *Never let a heal action depend on the exact thing that's broken.*

**9. Persistence of a fix.** Bad: stop a runaway background job for the current session and call it done — it silently comes back at the next login because nothing changed on disk. Good: verify explicitly that the fix survives a restart before moving on. *A fix you haven't verified survives a restart isn't a fix, it's a snooze button.*

**10. Dry-run before live.** Bad: no way to preview an outbound message before it sends, so every change to the alerting logic ships straight to a human's phone untested. Good: a `--dry` flag that prints instead of sending, so new logic gets a free trial run first. *If touching the alert logic risks alerting someone, you need a mode that doesn't.*
