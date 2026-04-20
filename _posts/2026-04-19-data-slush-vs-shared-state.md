---
layout: post
title: "`data_slush` vs shared state — the determinism-preserving chain"
date: 2026-04-19
tags: [rapp]
---

Every multi-agent framework has some mechanism for passing information between agents. LangGraph has typed `State` dicts. CrewAI has `Task.output` chaining. AutoGen has conversation histories. They are all variants of one idea: **a shared container of prose that agents read and write.**

RAPP has `data_slush`, which is structurally different enough that it needs its own name. This post explains what it is, what it isn't, and why the difference matters.

## The shape

When a RAPP agent's `perform()` returns, it returns a JSON string shaped like:

```json
{
  "status": "success",
  "summary": "- The actual human-facing answer.\n- Three bullets.\n- Read this in chat.",
  "data_slush": {
    "tone": "neutral",
    "confidence": 0.87,
    "entities": ["RAPP", "gpt-5.4"],
    "bullet_count": 3
  }
}
```

The `summary` (or equivalent payload key) is what the user sees. The `data_slush` is what the **next agent** sees.

`data_slush` is always a flat-ish dict of **typed signals**. Numbers. Booleans. Short strings. Tags. Entity names. Not prose. Not paragraphs. Not "the researcher's notes."

## The rule

`data_slush` is read by the next agent's runtime *deterministically*, without an LLM in the loop. The receiving agent gets `self.context.slush = {"tone": "neutral", ...}` populated before its `perform()` runs. No language model interpreted the previous agent's output to produce this context.

This is the key property. The hop between agents is not a hop in the variance-compounding sense (see `106-determinism-compounds.md`). It's a function call that passes a typed payload.

## The contrast: shared prose state

Every other multi-agent framework, to some degree, carries prose between agents:

- LangChain chains: `RunnableSequence` pipes the text output of step N into the prompt of step N+1.
- CrewAI: `Task.output` is the writer's full prose, re-ingested by the reviewer.
- AutoGen: the `GroupChat` history is prose all the way down.
- LangGraph: `State` dicts typically carry prose fields ("the current plan", "the draft") that the next node reads into its next prompt.

In all of these, the next agent's prompt is shaped by the previous agent's prose. The previous agent's prose was sampled by an LLM. The next agent's interpretation is also sampled by an LLM. Variance compounds.

`data_slush` breaks this by construction. The previous agent emits typed facts. The next agent receives typed facts. The LLM is not asked to interpret the handoff.

## Why it preserves determinism

In a CrewAI-style 3-hop pipeline, variance compounds multiplicatively per hop (see `106-`). In a RAPP `data_slush` chain, variance compounds *only within each agent's single LLM call*. Between calls, there's no LLM.

Practical consequence from the bakeoff:

- A 3-hop CrewAI pipeline: 100 unique outputs / 100 identical prompts.
- A 5-agent RAPP chain on BookFactory: 12 unique outputs / 100 identical prompts. **Despite having 5 agents.**

More agents, less variance. That's not an accident; it's `data_slush` doing its job.

## What `data_slush` can carry

Practical field types, by frequency of use in real RAPP agents:

1. **Scalars.** `confidence: 0.87`, `urgency: "high"`, `token_estimate: 420`.
2. **Enums.** `tone: "neutral" | "terse" | "warm"`, `category: "technical" | "narrative"`.
3. **Entity lists.** `entities: ["Azure", "gpt-5.4"]`, `files_mentioned: ["agents/x.py"]`.
4. **Counts.** `bullet_count: 3`, `citation_count: 4`.
5. **Flags.** `needs_fact_check: true`, `contains_code: false`.

## What `data_slush` must not carry

Three things, by convention:

1. **Paragraphs of prose.** If the next agent needs to quote the previous one, it reads the `summary` field, not the slush. The slush is for signals, not content.
2. **LLM-generated free-text judgments.** `assessment: "This draft is mostly coherent but needs work on tone."` — this belongs in summary (human-facing) or in a dedicated `critique` payload. Not slush.
3. **Nested structures the next agent will have to LLM-interpret.** Slush should be read deterministically. If you need an LLM to make sense of it, it's not slush.

## The convention enforces itself

Here's the elegant part: `data_slush` is a convention, not a constraint. An agent author *could* stuff prose in slush. But the next agent reading that slush must handle it deterministically (no LLM), which means it has to parse whatever shape was given. In practice, this friction pushes authors toward flat typed signals naturally. The convention is self-enforcing because the deterministic-receipt rule makes slush shape visible.

## The other thing `data_slush` does

Chains work. But the slush is also **telemetry**. Every slush payload is a snapshot of what an agent thought the next agent should know. Logging slush across a chain gives you a precise trace of how the chain's collective "state" evolved, with full auditability.

We started using slush as the primary signal for our observability tooling (see `44-model-selector-race.md` for a case where slush traces caught a race condition that logs missed). It's become the first thing we check when a BookFactory run looks wrong.

## The spec status

`data_slush` is SPEC §5.4 and §24 (`24-data-slush-spec.md`). It is required for any agent that participates in a chain and recommended for any agent at all. The registry does not enforce it, but runtime chain composition assumes it.

## The reason the name stuck

We called it slush because it's warm and imprecise around the edges — it's not a strict type, it's not a formal protocol, it's a pile of signals. Someone made fun of the word. The word stuck. It's too late to rename it.

"Structured inter-agent signal channel with deterministic receipt semantics" is what it is. `data_slush` is what we call it. The SPEC is the contract.

## The short version for a whiteboard

- Prose between agents = variance compounds.
- Typed signals between agents = variance stays local.
- `data_slush` is the typed-signal channel.
- Deterministic receipt is what makes it a channel, not just a convention.

That's the post.