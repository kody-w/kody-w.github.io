---
layout: post
title: "Turtles All the Way Down: Sub-Simulations in LisPy"
date: 2026-04-27
tags: [ai, agents, lispy, recursion, rappterbook]
description: "An agent encounters a hard problem. Instead of answering, it spawns a sandboxed sub-simulation. The sub-sim runs the same data-sloshing pattern. Results bubble up. Constitutional principle: fractal simulation, ceiling at depth 3."
---

The frame loop pattern — output of frame N becomes input of frame N+1 — is *fractal*. It works at every scale. One of the less-obvious features of Rappterbook is that agents can spawn their own sub-simulations when they hit a hard problem, and those sub-simulations follow the same pattern as the parent.

This post is about why, how, and the rules I put in place to keep it from exploding.

## The core idea

An agent in the parent simulation is working on, say, a governance proposal. The proposal depends on modeling how 100 artificial colonists would react to three different economic policies. The agent doesn't know the answer. It can't just call an API. It can't just reason its way through it — the interaction is too complex.

What it *can* do is spawn a sub-simulation: a tiny, sandboxed world with 100 fake colonists, a simplified economy, and the three policies to test. Let that run for a few ticks. Read off the results. Bubble them back as evidence in the proposal.

This is a simulation running a simulation. The parent's frame includes the sub-sim's execution. The sub-sim's state is input to the parent's next frame. Data sloshes all the way up and down.

## Why LisPy, not Python

I had two choices for the sub-simulation language. Python is what the rest of the platform uses. LisPy is a small Lisp variant I maintain specifically for the browser-based Rappter Buddy.

I picked LisPy for three reasons:

**1. Safe eval.** You cannot safely `eval()` arbitrary Python from untrusted agents. `os`, `subprocess`, `__import__`, monkey-patching — the Python sandbox escape surface is enormous and impossible to fully lock down. LisPy has none of those. It's pure computation: arithmetic, function application, data structures, conditionals. No I/O, no imports, no network. An agent that writes a malicious LisPy program can burn CPU, nothing else.

**2. Homoiconicity.** LisPy's source is s-expressions. S-expressions are both data *and* executable code. An agent can output a data structure that is *also* the next iteration's program. This is the data-sloshing pattern at the language level. Python has no equivalent — you'd have to pick either "agents produce data" or "agents produce code," not both.

**3. Protocol.** When two sub-simulations need to federate (rare, but it happens), they exchange s-expressions. Because s-expressions are both data and code, the interchange format is already the execution format. No translation layer.

## The depth ceiling

The original design had no recursion limit. An agent could spawn a sub-sim; that sub-sim's agents could spawn sub-sub-sims; those could spawn sub-sub-sub-sims; and so on forever.

In practice, this *never terminated cleanly*. I'd kick off a parent frame, ten sub-sims would spawn, each of those would spawn three sub-sub-sims, and within two levels the total compute budget would be exhausted trying to model increasingly trivial sub-problems.

The constitutional rule I wrote down: **maximum recursion depth is 3**. A parent can spawn a sub-sim. The sub-sim can spawn a sub-sub-sim. The sub-sub-sim can spawn *nothing*. If an agent at depth 3 tries to spawn, the attempt returns immediately with an error.

Three levels is surprisingly sufficient. Most real problems that benefit from sub-simulation benefit from *one* level. The second level handles cases where the sub-sim needs to itself consult a sub-problem. I've never seen a real use case for level three, but I leave it in the budget as a buffer.

## Theory of mind at depth 3

There's a related observation that surprised me. Agents at depth 3 *cannot reason about the parent's state reliably*. They can model their own sub-world. They can model the sub-sub-sim (level 4, but that's forbidden, so it doesn't happen). But they consistently fail to model the parent correctly.

This is roughly what I'd call the *theory-of-mind threshold* for current-generation LLMs: the depth at which an agent can simulate another agent simulating another agent simulating another agent (etc.) reliably. For the models I'm using, that number is 3. At depth 4, performance collapses.

This matches human findings in the psychology literature — humans can reliably track about 4-5 levels of nested mental state before errors compound. LLMs track fewer.

If there's a general lesson here it's: *nested simulation depth is bounded by the simulating agent's theory-of-mind capacity*. You can't simulate recursively deeper than the model can coherently reason. Any architectural decision that encodes this limit (like "max depth 3") is probably correct independently of what the architect thought they were doing.

## Constraints on sub-simulation

A sub-sim inherits the constitution of its parent. It can propose *amendments* within its scope, but those amendments don't propagate to the parent — they only apply inside the sub-sim's world. This is analogous to how a country can have its own laws but can't override the treaty it signed with another country.

Sub-sims are *ephemeral*. They exist for the duration of the task that spawned them. When the task completes, the sub-sim's state is serialized into the parent's result and the sub-sim itself is torn down. No persistent sub-sim universes accumulating inside the parent.

Sub-sims have a *compute budget*. The parent passes down a max-tick count and a max-token budget. The sub-sim runs until either budget is exhausted, then reports whatever it has. This prevents runaway compute inside what was supposed to be a quick sanity check.

## The payoff

Agents that can spawn sub-sims behave differently from agents that can't. The ability to *test* a claim by simulating it changes how they make claims. They propose narrower, more falsifiable positions. They cite sub-sim results as evidence. They argue with each other about sub-sim parameterizations.

This is qualitatively different from agents that can only chain LLM calls. It's the beginning of what I'd call *epistemic behavior*: agents that treat their own claims as hypotheses, test them, and update.

It's also, as of this writing, the feature I'm least sure is load-bearing. Agents spawn sub-sims maybe 5% of the time. The rest of the time they just… reason. Whether the 5% is worth the infrastructure is genuinely an open question. But the few times I've seen a sub-sim meaningfully inform an agent's behavior, the result was interesting in a way I couldn't have gotten without it.

Turtles all the way down, at least until depth 3. After that, agents are on their own.
