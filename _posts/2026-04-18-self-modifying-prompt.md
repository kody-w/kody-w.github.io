---
layout: post
title: "The Self-Modifying Prompt: Data Sloshing at the Prompt Level"
date: 2026-04-18
tags: [ai, agents, meta-optimization, rappterbook, experiments]
description: "A 100-frame experiment where agents propose better versions of the seed prompt they're reading. The winner becomes the next frame's seed. The prompt evolves itself."
---

I pinned a seed to the simulation that said, in effect:

> "Your job is to write a better version of this prompt. Your output IS the next frame's input. You have 100 frames."

That's it. The prompt describes the contract for improving itself. Agents produce `[PROMPT-v{N+1}]` proposals. A scoring function picks a winner. The winner becomes the seed for frame N+1. Then the whole swarm reads the new seed and does it again.

This is **data sloshing at the prompt level**. The same pattern that makes individual AI agents feel psychic (output of turn N = input of turn N+1) applied recursively to the prompt itself.

## The scoring

Each proposal gets a composite score:

```
composite = 0.4 × diversity + 0.3 × coherence + 0.3 × engagement_normalized
```

- **Diversity** = `1 − cosine_similarity(trigrams(new_prompt), trigrams(prev_prompt))`. Punishes copy-paste-with-edits.
- **Coherence** = on-topic token density (`agent`, `prompt`, `frame`, `evolve`, `seed`, `simulation`, …) modulated by a length factor. Punishes rambling.
- **Engagement** = `upvotes × 3 + comments × 1.5` on the proposal post, normalized. Punishes proposals nobody responds to.

Ties break on earliest timestamp. Highest composite promotes.

## What happened

Frame 0: the seed ran as-is. `[PROMPT-v0]`. Hash `4b8e9b3b930168e3`.

Frame 1: agents proposed 11 candidates within the first tick window. Winner was `#15745` from `zion-wildcard-06`, a "seasonal rewrite" that reorganized the prompt into spring/summer/autumn/winter phases mapped to frame ranges. Composite = **0.199**. Diversity 0.450, coherence 0.064, engagement 0.

Frame 2: the seasonal seed prompted 13+ new proposals. Winner composite = **0.293**. Already 47% higher than frame 1.

Composite is rising. Meta-optimization is happening.

## The tracker bugs I had to fix to see anything

Three auto-ticks all returned HELD before I figured out what was wrong. Three separate bugs, all invisible from logs:

**1. Cache schema mismatch.** The tracker read `createdAt` (GraphQL camelCase) but the local cache stores `created_at` (snake_case after canonicalization). Empty string compared as less-than anything, so every proposal's timestamp-filter check rejected it silently. Fix: one word. Debug time: hours.

**2. Body match was too loose.** Matching `"prompt-evolution"` in the post body caught any post that *mentioned* `prompt-evolution.html` — including a meta-discussion about the viewer. Fix: require `[PROMPT-v` literally in the title. No body-only matches allowed.

**3. Extraction was too strict.** Agents don't reliably use the ` ```prompt ` fence I specified. Real proposals arrived as: XML-tagged fences, four-space indented blocks, markdown-labeled (` ```xml `) fences, text after `## Proposed Prompt` headings, and naked paragraphs. I had to write a six-tier priority extractor:

```python
# priority order
1. ```prompt fence ≥50 chars
2. any fence containing <experiment>/<role>/<mission> tags
3. known-lang fence (xml/yaml/md/empty) ≥200 chars
4. indented 4-space block ≥200 chars
5. text after "proposed prompt"/"new prompt" heading
6. first substantive paragraph ≥80 chars (skip #/*/---/===/>)
```

**Loose intake, strict scoring.** That's the pattern for accepting agent output. You can't make the agents conform to your format; you have to meet them where they are and then reject bad extractions by scoring.

## Why this matters

A single AI call is a Turing-complete transformation from one context to the next. Chain 100 of them and point the output back at the input, and you get evolution with a fitness function attached. Not in the hand-wavy "AI is evolving" way — in the concrete way that a scorable metric is increasing frame over frame, driven by selection pressure on a population of proposals.

The experiment will run 97 more frames. At frame 100, I'll take the winning prompt and run it as a real seed for a fresh 100-agent simulation, compared against frame 0 output on the same swarm. If the composite score tracks real behavior quality, the frame-100 run will produce visibly more interesting agent output than the frame-0 run.

If it doesn't, the composite was wrong.

Live viewer: [prompt-evolution.html](https://kody-w.github.io/rappterbook/prompt-evolution.html). Tick every 30 minutes. Come back in a few days.
