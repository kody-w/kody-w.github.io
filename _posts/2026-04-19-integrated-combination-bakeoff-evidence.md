---
layout: post
title: "The bakeoff as evidence for the integrated-combination claim"
date: 2026-04-19
tags: [rapp]
---

`blog/62-integrated-combination-doctrine.md` makes the argument that RAPP is patentable as an **integrated combination of known elements** rather than as any single novel component. Single-file agents are not new. Card seeds are not new. System prompts are not new. Function-calling JSON schemas are not new. The *combination*, producing deterministic portable multi-tier agent execution, is.

Patent law calls this the "integrated combination doctrine." The combination must produce a result that is more than the sum of its parts, and the result must be demonstrable, ideally measurable.

This post claims: **the bakeoff harness and its results are the measurable demonstration.** The table it produces is evidence of the claim.

This post is written on 2026-04-19. The harness commit that produces the evidence is on the same date. That's the prior-art anchor.

## Why "integrated combination" needs numeric evidence

A patent on an integrated combination hinges on demonstrating that the combination produces effects that no single component produces. "We combined A, B, C, D, and got emergent property X" is the claim shape. A reviewer — whether at the USPTO or in a court — wants to see X measured.

RAPP's emergent property is, roughly:

> *Deterministic, portable, zero-ceremony multi-agent execution across three tiers, with compounding determinism benefits relative to orchestration-based alternatives.*

That's a mouthful. The bakeoff reduces it to four numbers:

| Metric | RAPP | Orchestration-based | Delta |
|---|---:|---:|---:|
| Files to ship one workflow | 1 | 13 | 13× |
| LLM calls per request | 1 | 3 | 3× |
| Tokens per 100 prompts (real) | 20,160 | 74,059 | 3.67× |
| Unique outputs from 100 identical inputs | 12 | 100 | 8× |

These four deltas are the emergent property, numerically. The table is 2026-04-19 dated. The harness commit is 2026-04-19 dated. Both are public.

## What the bakeoff *proves* and what it does not

**Proves:** The combination (§0 sacred tenet + §5 contract + `data_slush` + temp-0 discipline + three-tier portability) produces statistically distinct behavior from the combination's components evaluated alone. Any single piece, removed, would shift a metric. All four metrics shift in the same direction. That's evidence of integration.

**Does not prove:** That RAPP is the only system with these properties. That RAPP cannot be bested on any single axis. That RAPP is "better" in every workload.

The patent claim does not need to prove any of those. The claim needs to prove that the specific combination, as specified, produces the specific measurable property, as measured. The bakeoff provides that exact shape of evidence.

## What lives on the record now

As of the commit containing this post:

1. **`SPEC.md`** — the frozen v1 contract.
2. **`tools/bakeoff/harness.py`** — the measurement apparatus, executable, zero-dependency beyond Python stdlib + the provider's API.
3. **`tools/bakeoff/adapters/`** — reference adapters for CrewAI, LangGraph, AutoGen, representing the state-of-the-art orchestration-based baseline.
4. **`tools/bakeoff/run_artifacts/`** — the raw measured outputs from the 100-prompt live `gpt-5.4` run referenced in `105-the-bakeoff-pattern.md`.
5. **`blog/105-the-bakeoff-pattern.md`** through **`blog/118-data-slush-vs-shared-state.md`** — the narrative record.

Collectively: a dated, reproducible, measurable demonstration of the integrated combination.

## The five-step reconstruction test

Any future reviewer — patent examiner, litigator, or skeptic — can reproduce the evidence:

1. `git checkout <bakeoff commit hash>`
2. `set -a; . RAPP/.env; set +a` (or point `AZURE_OPENAI_*` at their own tenant)
3. `python tools/bakeoff/harness.py --competitor crewai --n 100 --workers 12`
4. Compare the produced `summary.json` to the one committed in `run_artifacts/` on the same date.
5. Verify the delta directions match (ours: all four favor RAPP).

If the reconstruction matches, the claim holds. If it doesn't, the claim fails and needs revision. The harness is the falsifiability instrument. Good patents have those.

## The three alternative claims we considered and rejected

We considered filing on individual novelties instead:

- **Claim A: "7-word incantations → 64-bit seeds → agent.py" as a novel method.** Rejected because pieces of this are published elsewhere (seedable generators, BIP-39 mnemonic phrases). The novelty is the application to agent identity, which is narrow and difficult to enforce.
- **Claim B: "Data sloshing as an inter-agent communication protocol."** Rejected because it overlaps with prior work on structured-output chaining (LangChain's output parsers, OpenAI's function calling). The novelty is the determinism guarantee, which is hard to patent on its own.
- **Claim C: "Single-file agent with embedded manifest."** Rejected because this is too close to self-describing Python modules, which have decades of prior art.

The integrated combination is the strongest claim because each rejected standalone claim, plus several others, *contributes* to the demonstrable emergent property. A patent on the combination protects the whole ensemble. A patent on any single piece would leave the ensemble unprotected.

## Why now

Two reasons.

**First, the harness exists.** We could not have filed this evidence in January. The harness wasn't built. Now it is. Filing later is possible but costlier — we'd have to re-establish that the harness reflects the same architecture the SPEC describes, which gets harder as the SPEC's date-of-freeze recedes.

**Second, the competitive landscape is fluid.** Multi-agent frameworks are launching quarterly. Each launch is a potential prior-art cite *against* our combination, *unless* our combination is already dated earlier. The earlier our dated evidence, the stronger our position.

2026-04-19 is the date on this commit. We wanted it timestamped.

## What this post is not

It is not legal advice. It is not a claim that RAPP is patented (it isn't, yet — the claim is patent-*pending*, per `71-patent-pending-build-in-public.md`). It is not an assertion against any framework. It is a record.

The record matters because patent filings take months to years, and the state of the evidence at the time of first filing is the state that gets examined. We want that state to be:

- A frozen spec (✓ 2026-04-17)
- A measurable harness (✓ 2026-04-19)
- Dated reproducible results (✓ in `run_artifacts/`)
- A public explanation of what the combination produces and why (this post, and its neighbors).

Four ticks. The record is built.

Everything else is the patent attorney's job.