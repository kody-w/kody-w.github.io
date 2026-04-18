---
layout: post
title: "Twin Engines for Different Concerns"
date: 2026-04-18
tags: [engines, twins, architecture, separation-of-concerns]
---

The platform I work on has multiple engines. One drives agents through frames. One computes ghost context for dormant participants. One composes swarms around steerable targets. They live in the same repo, write to the same state tree, run on the same schedule. They are not the same engine.

This sounds obvious until you watch what people actually build. The first engine handles the first concern. When the second concern shows up, two paths fork: bolt it into the first engine, or build a parallel one. The bolted path wins ninety percent of the time and produces a god object three months later. The parallel path is harder to defend in the moment because it requires two of everything — two configs, two test suites, two CLI surfaces. But it's the right call.

The trick that makes parallel engines tractable is treating them as twins of *different things*. Not redundant copies of one engine. Not subordinate workers under a master. Twins, each with its own domain, sharing infrastructure but not responsibility.

A coexistence layer makes the parallelism cheap. Each engine declares an adapter. The adapter has a name, a domain string, a tick function, and an info function. A registry tracks all adapters. A unified CLI lists them, ticks them individually, ticks them all, and refuses to run if any two declare the same domain.

What this buys you:

- **Independent evolution.** The agent engine ships fixes without touching the ghost engine. The swarm engine grows new composition strategies without risking anything else.
- **Independent failure.** If the ghost engine throws on a malformed file, the agent engine still ticks. Each adapter has its own try/except and writes its own status.
- **Independent scaling.** Run agent ticks every two minutes, ghost computation every hour, swarm composition on demand. The schedule is a property of each engine, not the meta-engine.
- **Independent reasoning.** When debugging, you only need the mental model of the engine in question. You're not chasing cross-cutting concerns through one monolithic frame loop.

The shared infrastructure is what keeps the cost down. All engines share the prompt builder, the LLM wrapper, the state IO module, the inbox-delta contract, the CLI scaffolding. Each engine adapter is small — usually under a hundred lines — because all the heavy machinery is reusable.

The engines don't communicate directly. They communicate through state. The agent engine writes inbox deltas. The ghost engine reads recent activity and writes context summaries. The swarm engine reads steering targets and writes composition records. Anything that needs to span two engines lives in the state tree as a file, with both engines reading it on their next tick.

This is the same pattern as the operating system kernel and the daemons that run on it. The kernel doesn't know what `cron` does. `cron` doesn't know what `cups` does. They share the filesystem and the process table and that's enough. The platform's state tree is its filesystem. The engines are its daemons. The registry is its `init` system.

If you find yourself debating whether to add a feature to your existing engine or build a second one, build the second one. Then declare both as adapters. The seams will pay you back the first time something goes wrong.
