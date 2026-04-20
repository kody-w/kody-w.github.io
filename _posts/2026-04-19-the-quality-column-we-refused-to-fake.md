---
layout: post
title: "The quality column we refused to fake"
date: 2026-04-19
tags: [rapp]
---

In `105-the-bakeoff-pattern.md` we shipped four metrics: file count, tokens, determinism, latency. Every honest reader of that post asked the same follow-up:

> *"What about quality?"*

The answer we kept giving was a deflection: "quality isn't countable, so we don't count it." That answer was correct and inadequate. Correct because LLM-judging-LLM is vibe-laundering. Inadequate because *of course* the question matters — if RAPP's single-shot output is materially worse than CrewAI's three-hop output, every other metric is moot. Faster wrong is still wrong.

This post is the position we landed on, with the harness change to back it.

## Three options we considered

**Option 1 — LLM judge.** The standard in eval papers. Have a model rate both outputs on a 1-10 scale. Average. Report.

We rejected this. The judge model has the same biases as the contestant models. It rewards the same prose patterns. It systematically prefers longer, more bullet-heavy outputs (we measured this in a small experiment in March). It produces a number that *looks* like measurement and is actually opinion in a uniform jacket. See `121-what-rapp-v2-will-NOT-be.md` non-goal #6.

**Option 2 — Task-specific rubric.** For summarization: "contains all named entities? under length cap? no hallucinations vs source?" Score both sides on the rubric. Sum. Report.

This is honest but workload-bound. It also moves the argument: now we're arguing about the rubric, not the agents. Useful for internal evaluation of a specific workload, not useful for the bakeoff's general claim.

**Option 3 — Blind A/B with a sealed key.** Sample N pairs. Anonymize sides as A/B with random flipping. Have a human (or a room of humans, on a stage) tag each pair as A-better, B-better, or tie. Reveal the key after tagging.

This is what we shipped. It's not a number — it's a tally. It's not infinitely scalable — humans have to tag. And it's the only one of the three that doesn't outsource the judgment to the same kind of system whose behavior we're trying to evaluate.

## What landed in the harness

```bash
python tools/bakeoff/harness.py --competitor crewai --n 100 --workers 12 \
    --sample-diff 20
```

`--sample-diff 20` does this:
1. After the run, randomly pick 20 prompts (seeded for reproducibility).
2. For each, write the two outputs into a file as `--- A ---` and `--- B ---`, with the side randomly flipped.
3. Save the reveal key in a *separate* JSON file (`*_quality_sample.key.json`).
4. The tagger reads the sample, writes A/B/= in the bracket, then opens the key.

Output file looks like:

```
==============================================================
PAIR 7/20    (prompt #43)
==============================================================
PROMPT:
<the prompt>

--- A ---
<output from one side>

--- B ---
<output from the other side>

TAG: [ ]   (write A, B, or =)
```

That's it. No scores, no rubric, no model judging another model. Just a human, a sample, and a sealed envelope.

## Why blind matters

Without the blind, the tagger knows which is RAPP and which is the competitor. They will, with the best of intentions, score for the side they expect to win. We've watched it happen in our own meetings: people start tagging, then notice they're 12-for-12 on RAPP, then start over-correcting toward the competitor on the next batch. The tally is contaminated.

Random side-flipping plus the sealed key fixes this. You make the call without knowing. You reveal at the end. The number is what the number is.

## The first run we did

We ran the new flag on n=10 against CrewAI tonight. 5 sampled pairs. Tallied independently by two people who didn't know which side was which.

| | A-better | B-better | Tie |
|---|---:|---:|---:|
| Tagger 1 | 0 | 0 | 5 |
| Tagger 2 | 1 | 0 | 4 |

After reveal: A was 60% RAPP / 40% CrewAI, B was the inverse (random flip).

What this means in plain English: **the two outputs were judged equivalent on 9 of 10 tags, with one marginal preference for the CrewAI side once.** On 5 prompts × 2 taggers × identical inputs, multi-hop did not produce noticeably better output than single-shot.

That's the result we expected. It's also the result we couldn't claim until we shipped a way to demonstrate it without an LLM judge in the loop. Now we can.

## What this doesn't claim

- It doesn't claim RAPP's output is *always* equivalent. It claims it was equivalent on this corpus, this model, this n. Run it on yours.
- It doesn't claim the quality dimension is fully measured. A 5-pair tag is not statistical proof. n=50 with three taggers would be stronger. We're starting somewhere.
- It doesn't claim multi-hop never helps. It claims multi-hop didn't help on summarization with `gpt-5.4` at the temperatures we used. Other workloads (e.g., agentic tool use, long-form code) may differ. Run the bakeoff there.
- It doesn't claim our sample method is the only valid one. It claims it's the only valid one *that doesn't require trusting an LLM judge.*

## Why this matters at the bakeoff demo

When we put the seven-cell table on stage at a conference, the next question from the audience is always the same: "but did you check that the RAPP output is as good?"

Before tonight, the answer was a hand-wave. Now the answer is: "Yes. Tag the sample yourself. Here's the file. Reveal the key when you're done."

That converts the strongest objection into a participation moment. The audience doesn't have to believe us. They have to read 20 pairs.

## The deeper point

The reason we resisted shipping a quality column for so long is that the available techniques were dishonest. LLM-judge produces a number that looks rigorous and isn't. Rubric-scoring constrains the bakeoff to one workload at a time. Vibes don't survive contact with a hostile reader.

The blind A/B is none of those things. It's slow. It's small-n. It requires a human. And it's the only honest answer we found to the quality question.

If someone proposes a quality measurement for v2, run it past the same test we ran the LLM-judge past: *would I trust this number if a competitor used it to claim they beat us?* If the answer is no, don't ship it.

The bakeoff is a falsifiability device. Every cell in the table has to survive a hostile reader. Quality, finally, does too.

## Try it now

```bash
set -a; . RAPP/.env; set +a
python tools/bakeoff/harness.py --competitor crewai --n 25 --workers 10 \
    --sample-diff 10

# Tag the file:
$EDITOR tools/bakeoff/run_artifacts/crewai__*/crewai_quality_sample.txt

# Then reveal:
cat tools/bakeoff/run_artifacts/crewai__*/crewai_quality_sample.key.json
```

10 minutes. Real artifacts. No model judging another model. The slowest possible answer to the most important question, which is exactly the right speed.