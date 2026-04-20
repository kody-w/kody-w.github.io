---
layout: post
title: "The graph DSL we deliberately didn't build"
date: 2026-04-19
tags: [rapp]
---

LangGraph has `StateGraph`. CrewAI has `Crew`/`Task`. AutoGen has `GroupChat`. MetaGPT has a company-org DSL. Semantic Kernel has `Planner`. Flowise has a visual canvas. Every serious multi-agent framework ships a graph DSL.

We ship function calls.

This is a deliberate architectural decision and it's one of the most-questioned design choices in the RAPP v1 spec. This post explains why we held the line.

## What a graph DSL actually does

A graph DSL lets you declare "Agent A, on event X, with state Y, hands to Agent B." It sounds like you're expressing *the shape of a workflow*. What you're actually expressing is *the shape of a workflow in the DSL's mental model*.

The DSL brings three things with it, always:

1. **A schema.** Nodes, edges, states, conditions. You learn it, you obey it, you pay in learning time.
2. **A runtime.** The DSL is evaluated by the framework's executor. The executor decides when nodes fire, how state propagates, how errors rewind.
3. **A version surface.** The DSL changes between framework releases. Your graphs break. You upgrade. Repeat.

The graph DSL is the framework charging you, in learning time and lock-in, for a thing you already have. The thing you already have is called functions.

## What we built instead

The `BookFactory` rapplication is a five-persona content pipeline (Writer → 3 Editors → 2 CEO specialists → Publisher → Reviewer). Thirteen source files, collapsed to a singleton via the double-jump loop. The "graph" expressing this pipeline is:

```python
def perform(self, **kwargs):
    notes   = PersonaWriterAgent().perform(source=kwargs["source"])
    edits   = PersonaEditorAgent().perform(draft=notes, ...)
    direction = PersonaCEOAgent().perform(edits=edits, ...)
    final   = PersonaPublisherAgent().perform(direction=direction, ...)
    review  = PersonaReviewerAgent().perform(final=final, ...)
    return final
```

That's the DSL. It's Python function calls. You can read it. You can trace it with `pdb`. You can test it with `pytest`. You can grep it. You can port it to any runtime that has Python.

## What we lose

Genuinely: we lose the ability to declare a graph in one place and execute it in many. We lose visual canvases. We lose the "show the graph on a slide" feature.

We thought about this a lot. We concluded the win for visual canvases is smaller than the cost. Here's why.

## The cost we didn't want to pay

### 1. The graph is always wrong

In every agent workflow we've shipped, the graph changed within two weeks of first running it against real data. The Writer needs a fact-check step. The Editor needs a three-way split. The Reviewer needs to be parallel. The Publisher needs a gate.

In a graph DSL, each change means: update the declaration, re-wire the edges, test the executor's handling of the new topology, possibly bump the DSL version. Three files, two reviews, one runtime update.

In function calls: add a line.

We wrote nine agents in the first month of RAPP. Their composition changed, in aggregate, about forty times. Multiply 40 × (three files, two reviews, one runtime update) and you see the bill.

### 2. The executor is always opinionated

Every graph DSL has a "when does this node fire?" policy. Always eagerly. Never eagerly. Only when upstream is stable. Only when downstream is ready. With timeouts. Without timeouts.

These policies are defensible in isolation and catastrophic in the aggregate: you now have two systems reasoning about execution — the DSL's model and your actual wire. When they disagree, you have a bug that is somehow both no one's fault and very difficult to fix.

Function calls have one execution model. It's the one Python already has. We don't need to learn a second one.

### 3. The graph does not help the reader

The mental image of "a graph on a page" is seductive, but agents compose at the call level, not at the edge level. The interesting thing about an agent is what it *does*, not *when* it's invoked. A graph-on-page shows when. It hides what.

A Python file with five function calls shows both. The calls are the graph. The bodies are the work. One artifact.

## The test: "can a 14-year-old read it?"

Our test for every design choice is SPEC §0: can a 14-year-old ship an agent on day one? A 14-year-old can read Python function calls. A 14-year-old cannot read a StateGraph with reducers and conditional edges and a `compile()` step and a `stream_mode`.

We lose some expressiveness. We gain: the onboarding ramp is zero.

## When a graph DSL is the right call

Three cases:

1. **Visual-first audiences.** If the buyer doesn't read code, the canvas is the product (Flowise, n8n). Different product, different trade-off.
2. **Cross-language orchestration.** If nodes run in five languages on five runtimes, you need a neutral orchestrator. But then you're not a multi-agent framework; you're Airflow.
3. **Strongly declarative semantics.** If you need proof-of-properties (no loops, bounded recursion, etc.) for a certifiable system, a typed graph beats function calls. But RAPP is not that system.

For the 95% case — "I want to ship an agent today" — function calls win.

## The wire, not the graph

The insight that made us comfortable with this choice: **RAPP's wire contract is an HTTP POST, not a graph topology.** `POST /api/swarm/{guid}/agent` with a `{name, args}` body, agent-to-agent via `data_slush` in the return payload.

The composition lives in the caller's code, not in a registry. The registry holds agents; the caller holds the choreography. This matches how real systems actually evolve — people change choreography three times a week and agents once a month.

If we put the choreography in a DSL, we'd be locking up the fast-moving surface in the slow-moving artifact.

We chose not to.