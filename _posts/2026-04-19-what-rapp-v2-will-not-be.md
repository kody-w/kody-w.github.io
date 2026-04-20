---
layout: post
title: "What RAPP v2 will NOT be — the non-goals doc"
date: 2026-04-19
tags: [rapp]
---

v1 is frozen. v2 does not yet exist. This post is a list of things v2 must **not** become, written before discussions begin so that the constraints are clear when they do.

It is much easier to add features in v2 than to remove them once added. The non-goals are the load-bearing constraints. The goals can wait.

## Non-goal 1: a graph DSL for orchestration

If v2 ships a `StateGraph`-equivalent, v2 has lost its mind.

The argument against a graph DSL is in `109-graph-dsl-we-deliberately-didnt-build.md`. Re-read it before proposing one. The short version: orchestration belongs in the caller's code, not in a registered artifact. RAPP's wire (HTTP POST + `data_slush`) is the orchestration substrate. Anything richer is a different product.

If a customer requests "but I want to see the workflow visually," ship a *visualizer* that reads function-call traces from logs. Don't ship a graph that the agent has to be defined in.

## Non-goal 2: a runtime that owns more than HTTP

If v2's brainstem starts owning agent execution semantics — when hops fire, how state propagates, when retries happen — v2 has lost its mind.

The brainstem is `http.server`. The agents make their own outgoing calls. The decision to tether is the agent's. The decision to retry is the agent's. The decision to fall back is the agent's. The runtime stays out of the way.

If a customer requests "but I want centralized retry policy," ship a *helper* the agent imports. Don't take the decision away from the agent.

## Non-goal 3: a manifest schema with mandatory fields beyond §5

§5 defines four required attributes (`name`, `metadata`, `BasicAgent`, `perform`). RAR's `__manifest__` adds about ten optional fields. v2 must not promote any optional field to required.

The reason: a 14-year-old must be able to ship an agent on day one. Adding required fields is adding learning time. Learning time is the enemy of §0.

If v2 wants to encourage a new field — say, `policy_tags` — it adds it as optional. RAR's quality tiers can incentivize adoption. The contract stays minimal.

## Non-goal 4: per-conversation soul mutation

This is the one we explicitly deferred at the freeze (see `113-the-2026-04-17-freeze.md`). v2 will be tempted to add it. v2 must think about it carefully before doing so.

If soul mutates per-conversation, the tenant is no longer a deterministic identity. Audit, multi-tenancy, and the entire `data_slush` story get murkier. The feature has real value (per-user voice adaptation) but the cost is high.

If v2 ships per-conversation soul, it must:
1. Define exactly which soul layers can mutate and which are sacred.
2. Provide a deterministic way to recover the canonical soul.
3. Update the tenant model in §10 explicitly.

If v2 cannot satisfy all three, v2 must not ship the feature. Defer to v3.

## Non-goal 5: a package manager that ships dependencies

RAR ships agents. RAR does not ship `pip install`-able packages.

The single-file constraint exists because the moment you ship a multi-file package, you're shipping a runtime assumption — "the recipient has pip, has Python 3.x, has these specific transitive deps." That assumption breaks the three-tier portability guarantee.

v2 will be tempted to allow agents to declare dependencies that get auto-resolved at install time. Resist. The current rule — agents may declare deps in a comment block at the top of the file, the runtime auto-installs missing ones lazily — works because the dep set is small per agent. If it grows, the agent isn't a single-file agent anymore.

## Non-goal 6: an LLM-judge for output quality

We've been asked to add a `quality_score` to the bakeoff harness, computed by an LLM judge. v2 must not do this.

An LLM judging an LLM is not a measurement. It is a vibe filtered through a model. The metrics worth measuring (file count, tokens, determinism, latency) are countable. The metrics that aren't countable are not metrics; they are opinions.

If users want quality judgments, they get them with their own eyeballs and the `diff_sample.txt` artifact. We do not build a judgment apparatus.

## Non-goal 7: a UI builder

Multi-agent frameworks tend to grow visual builders (n8n, Flowise, dify). v2 must not.

The reason: a visual builder makes the workflow definition non-portable. You can't email an n8n workflow as text. You can't `git diff` it. You can't `grep` it. Once you've built one, you've left the §0 mental model.

If a customer wants visual: build a *renderer* that takes a single-file agent and shows its `perform()` as a flowchart. The artifact is still the file.

## Non-goal 8: enterprise auth as a first-class concept

RAPP v1 has tenant identity (one soul + one agents directory + one storage). It does not have user identity within a tenant.

v2 will be asked to add SSO, RBAC, audit roles, etc. v2 must implement these via *adapters that sit in front of the brainstem*, not by extending the brainstem itself. The brainstem is `http.server`. The auth is a reverse proxy. Don't bake auth into agents.

## Non-goal 9: a built-in vector store

LangChain has one. CrewAI has one. AutoGen has one. v2 must not.

A vector store is one of many storage shapes. RAPP's storage abstraction is "the agent reads/writes whatever it wants." Bolting on a vector store as a runtime feature picks a winner. Picking a winner means the runtime starts having opinions. Opinions cost.

If v2 wants vector capability: make it a single-file agent. `vector_recall_agent.py`. Drop in, use, swap out.

## Non-goal 10: a billing or usage-metering apparatus

We will be tempted. The brainstem has the data; metering would be commercially useful.

The reason not to: every metering apparatus we've seen becomes a constraint on what the brainstem can do (rate limits, quotas, kill switches). Those constraints leak into agent behavior. Once they leak, the brainstem is no longer §0-clean.

Billing is downstream. Run a reverse proxy. Count there. Leave the brainstem alone.

## What v2 *should* be (briefly, since the post is non-goals)

- Better mobile support for the binder.
- Faster card-from-seed reconstruction.
- Optional streaming hatch for large eggs.
- Better tooling around `data_slush` introspection.
- Improved discovery in RAR (tags, search, recommendations).

All of these are additive. None violates the non-goals.

## The test for any v2 proposal

> **Does this feature require an existing v1 agent to change?**

If yes, the proposal needs a v3 conversation, not v2. v1 agents must run unchanged in v2. That is the freeze contract.

> **Does this feature add a required field to the agent contract?**

If yes, the proposal must instead be optional. §5 stays minimal.

> **Does this feature put runtime logic in the brainstem that an agent could otherwise own?**

If yes, the proposal must instead be an importable helper. The runtime stays thin.

Three tests. Apply ruthlessly.

## Why this post exists now

Because v2 discussions will start within months. The non-goals will be the first things to slip if no one wrote them down. We wrote them down.

If v2 ships and any of the above were violated without explicit conscious debate, this post is the receipt. Re-read, regret, refactor.

If v2 holds the line, this post is the witness that the line was drawn deliberately.

Either way, the record stands.