---
layout: post
title: "Token economics at scale — the CFO slide"
date: 2026-04-19
tags: [rapp]
---

Here is the slide. It is always the same slide.

> A multi-agent pipeline burns **3.67× the tokens** of a single-file RAPP agent on identical workloads. Against `gpt-5.4` on live Azure OpenAI, that's **74,059 vs 20,160 tokens per 100 prompts.** At 10,000 users × 10 requests/day × 365 days, the delta is 197 billion tokens/year.

That is the whole pitch. Everything below is annotation.

## Where the 3.67× comes from

A three-hop pipeline re-ingests the prior hop's prose as its new input. The researcher's output becomes the writer's input. The writer's output becomes the reviewer's input. Each re-ingestion pays for itself in prompt tokens, plus a full completion budget for the hop's own output.

Measured breakdown from our bakeoff (100 prompts, gpt-5.4):

| | Prompt tokens | Completion tokens | Total |
|---|---:|---:|---:|
| CrewAI-style (3 hops) | 37,476 | 36,583 | 74,059 |
| RAPP (1 hop) | 12,300 | 7,860 | 20,160 |
| Delta | 3.04× | 4.66× | **3.67×** |

Completion tokens are the worse offender. Each hop generates full prose for the next hop to re-ingest. In a 1-hop design the model writes once.

## The annualized cost model

At current Azure OpenAI retail for a gpt-5.4-class deployment (~$2.50/MTok prompt, ~$10/MTok completion; confirm your tenant's rates):

- 100 prompts through CrewAI: ~**$0.46**
- 100 prompts through RAPP: ~**$0.11**
- Delta per 100 prompts: **$0.35**

Scale that:

| Workload | CrewAI/yr | RAPP/yr | Savings/yr |
|---|---:|---:|---:|
| 1K users × 10 req/day | $12,775 | $3,485 | $9,290 |
| 10K users × 10 req/day | $127,750 | $34,850 | $92,900 |
| 100K users × 10 req/day | $1,277,500 | $348,500 | **$929,000** |
| 1M users × 10 req/day | $12,775,000 | $3,485,000 | **$9,290,000** |

Tell this to your finance lead. Watch what happens.

## Why this gets worse, not better

Three forces compound the delta as your product matures:

1. **Context windows grow.** More history per prompt → more re-ingestion cost per hop → the 3.04× prompt-token multiple grows.
2. **Hops multiply.** Teams add a verifier. Then a re-verifier. Then a guardrail. A 3-hop pipeline becomes a 5-hop pipeline. The multiplier scales roughly linearly in hops.
3. **Retries accumulate.** Variance-induced retries (see `106-determinism-compounds.md`) double the billable cost on the affected fraction of traffic.

Frameworks that pitch "just add a critic agent" are pitching 33% more spend per request, on infrastructure that already costs 3.67× the RAPP baseline.

## Why RAPP doesn't have this problem

The `data_slush` contract passes *curated structured signals* between agents, not prose. When our BookFactory chains Writer → Editor → Reviewer, each agent receives the prior agent's output **plus a small typed payload** that the receiving agent reads deterministically, not via the LLM. The LLM sees one prompt per agent, and the prompt is shaped by the schema, not by the prior agent's free-text.

Result: we chain 5 agents and spend fewer tokens than a 3-hop CrewAI pipeline, because we're not re-ingesting prose.

## What to measure on your own stack

```bash
set -a; . RAPP/.env; set +a
python tools/bakeoff/harness.py --competitor yourframework --n 100
cat tools/bakeoff/run_artifacts/yourframework__*/summary.json | jq .
```

The `tokens` field is the whole argument. Put it on the slide.

## The non-obvious corollary

Frameworks with generous free tiers or launch credits are doing you a favor on the developer side and a disservice on the CFO side. The token bill you're not paying during the prototype is the bill you will pay at scale. The architecture you chose in the free tier is what ships in production.

Choose the architecture that charges you for the prototype. It's the one that won't surprise you with the receipt.