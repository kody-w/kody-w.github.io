---
layout: post
title: "Content filters as a leading indicator — why more hops means more 400s"
date: 2026-04-19
tags: [rapp]
---

During the bakeoff we ran in `105-the-bakeoff-pattern.md`, the CrewAI-style pipeline failed on 2 out of 25 prompts with HTTP 400 from Azure OpenAI's content filter. RAPP's single-file agent failed on zero.

The prompts were identical. The model was identical. The only thing that differed was the number of LLM hops.

This is not a coincidence. It's a leading indicator.

## What a content filter is actually filtering

Azure OpenAI's content filter scores the **full prompt** against eight dimensions (hate, self-harm, sexual, violence, plus the jailbreak/protected-material overlay). The score is computed on whatever the model receives, not on whatever the user typed.

In a single-hop RAPP agent, the model receives: `[SOUL] + [source]`. The soul is a terse operating instruction; the source is the user's input. Two components. Predictable shape.

In a three-hop pipeline, hop 3 (the reviewer) receives: `[system prompt for reviewer] + [draft prose from writer] + [retry context if any] + [critic instructions]`. The draft prose is *itself LLM-generated*, meaning it has a probability distribution over every token in the vocabulary. Occasionally — at temp=0.7, often enough — the draft contains a phrase that scores high on one of the filter dimensions, even though no human ever typed anything problematic.

**The filter isn't responding to user intent. It's responding to model outputs being re-fed as model inputs.**

## The failure mode we actually saw

The two failing prompts were summarization tasks. Clean source material — a technical article and a product description. RAPP processed both in one hop with zero issues. CrewAI's writer hop produced drafts that included vivid examples (one had a metaphor about "violent" market disruption). The reviewer hop re-ingested that language as prompt input. The content filter caught the word, the filter category tripped, HTTP 400 came back, the pipeline aborted.

The user never typed anything violent. The pipeline invented a metaphor and then got flagged for hearing its own metaphor.

## Why this gets worse at scale

Three forces compound the 400-rate as your product matures:

1. **More hops.** Each additional hop is another prose re-ingestion, another chance for the prior model to produce flaggable vocabulary.
2. **Richer vocabulary.** As you upgrade models, they write more evocatively. More evocative prose has more tokens that *could* trip filters. Filters get stricter; models get richer; they meet in the middle.
3. **Stricter tenants.** Enterprise tenants configure aggressive filter thresholds. The same pipeline that works on the public endpoint fails on the enterprise endpoint.

A 2/25 failure rate in a benchmark is an 8% production outage if you don't handle it. Handling it means retry logic, fallback language, content-rephrasing — more files, more abstractions, more tokens. Back to the economics argument (see `107-token-economics-at-scale.md`).

## Why RAPP gets fewer 400s

One hop. The model sees what the user sent (filtered once, on ingress). The model writes its output (filtered once, on egress). The output goes to the user, not to another model.

There is no LLM-on-LLM re-ingestion surface. There is no opportunity for hop N to flag on a metaphor hop N-1 invented.

This is not a feature we designed. It's a property we got for free by picking a single-file architecture. That's the recurring shape of the doctrine: many of our "features" are just second-order consequences of §0 Sacred Tenet.

## What to measure

Add a line to your bakeoff summary that counts `[ERROR: ...]` outputs per side. It's in `run_artifacts/<framework>_outputs.json` — any string starting with `[ERROR` is a failed invocation. We added this to the harness in `105-the-bakeoff-pattern.md` specifically to surface this signal.

The 400 rate is the leading indicator of the production outage you have not yet had.

## The non-obvious reframe

Frameworks market "multi-agent with built-in critic" as a quality improvement. Measured on a well-known axis — critic loops catch bad outputs — it is. Measured on a less-quoted axis — content filter interaction — it's a liability.

The critic is necessarily reading what the writer produced. The writer is necessarily writing with temperature > 0 to stay "creative." The critic is necessarily in the same content-filter policy as the writer. The pipeline is necessarily one flagged metaphor away from a 400.

You don't see this in a hello-world demo. You see it in production, at 3am, when the pipeline breaks on a marketing doc because the writer used the word "kill" in an idiomatic sense.

We saw it in the bakeoff. So will you.