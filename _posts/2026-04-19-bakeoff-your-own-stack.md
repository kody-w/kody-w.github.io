---
layout: post
title: "Bake off your own stack — a migration assessment for enterprise teams"
date: 2026-04-19
tags: [rapp]
---

If your team is running CrewAI, LangGraph, AutoGen, or a homegrown multi-agent framework today, this post is your first 90 minutes of due diligence on RAPP. You don't have to migrate. You don't have to commit. You just run the harness.

The output is a numeric report you can take to your tech lead, your platform team, or your CFO.

## What you'll have at the end

A directory like this:

```
tools/bakeoff/run_artifacts/yourframework__20260419-141500/
├── summary.json          # the seven-cell table
├── rapp_outputs.json     # what RAPP produced for your prompts
├── yourframework_outputs.json  # what your stack produced
└── diff_sample.txt       # first three distinct outputs from each side
```

`summary.json` answers: "If we migrated this workflow, what would change?"

## The 90 minutes, broken down

| Step | Time | Output |
|---|---:|---|
| 1. Clone RAPP, install deps | 10 min | working harness |
| 2. Write your adapter (`<yourframework>_adapter.py`) | 25 min | one file, ~30 lines |
| 3. Export your prompts to a JSON corpus | 10 min | `corpora/yourstack.json` |
| 4. Write the equivalent RAPP single-file agent | 20 min | one `*_agent.py` |
| 5. Run the harness, both sides, n=100 | 15 min | `summary.json` |
| 6. Read the table, write up findings | 10 min | the slide |

If you've never seen RAPP before, add 30 minutes to read `SPEC.md` first. It's worth it.

## Step 2 in detail — your adapter

The harness expects an adapter that exposes one method:

```python
from tools.bakeoff.adapters.base import Adapter, Run

class YourStackAdapter(Adapter):
    name = "yourstack"
    file_count = 8           # count YOUR project files (not the framework's lib)
    loc = 143                # wc -l them
    framework_version = "1.2.0"

    def run_once(self, prompt, llm):
        # Replace these with your actual workflow.
        # `llm(prompt, temperature=...)` is the harness-provided LLM.
        # Use the same default temperatures your framework uses in production.
        notes = llm(f"PLAN: {prompt}", temperature=0.7)
        draft = llm(f"WRITE: {notes}", temperature=0.7)
        return Run(output=draft)
```

That's it. Drop into `tools/bakeoff/adapters/yourstack_adapter.py`, register in `harness.py`'s `COMPETITORS` dict, run.

The adapter does not need to invoke your real framework. It needs to **mimic the LLM call pattern** your framework produces under load: same number of hops, same temperatures, same prompt scaffolding shape. The harness measures the wire, not the framework.

## Step 3 in detail — your corpus

Pull 25 to 100 representative prompts from your production logs. Strip PII. Save as JSON:

```json
[
  "Summarize this RFP in three bullets: ...",
  "What are the risks in this contract: ...",
  "Generate a customer reply for: ..."
]
```

Drop in `tools/bakeoff/corpora/yourstack.json`. The harness will use it via `--corpus`.

If your prompts vary widely in length or shape, run the bakeoff on subsets too: `--corpus contracts.json` separately from `--corpus replies.json`. The deltas often differ by workload class.

## Step 4 in detail — your RAPP agent

This is where the real work is. Take your multi-agent workflow and ask: "what would this look like as a single `*_agent.py`?"

Walk-through:

1. Identify the **one final answer** the user needs. Not the intermediate steps. The thing they actually consume.
2. Identify the **structured signals** each intermediate step produces (entities, scores, classifications). These become `data_slush`.
3. Write one `perform()` that produces the final answer, calling the LLM as few times as possible (often once), and emitting the slush signals as typed output.

The example in `119-writing-your-first-rapplication-today.md` is a good template. The reference `agents/summarizer_agent.py` in the repo is a working minimal example.

You'll likely find the RAPP version is shorter than you expected. That's not because RAPP is magic — it's because your multi-agent workflow had ceremony that wasn't doing useful work. The bakeoff makes the ceremony visible.

## Step 5 in detail — the run

```bash
set -a; . RAPP/.env; set +a   # or export AZURE_OPENAI_* yourself
python tools/bakeoff/harness.py \
    --competitor yourstack \
    --corpus tools/bakeoff/corpora/yourstack.json \
    --rapp-agent path/to/your_rapp_agent.py \
    --rapp-class YourRappAgent \
    --n 100 --workers 12
```

Cost: roughly $0.50 to $5.00 in Azure OpenAI charges, depending on prompt size and your model tier. Time: 1 to 5 minutes.

## Step 6 — the slide

The cleanest version:

```
Workload: <name>     N=100 prompts     Model: <gpt-5.4 or whatever>

                          Today          RAPP        Delta
Files                       N             1          Nx
LLM calls/prompt            H             1          Hx
Tokens (real)               T1            T2         T1/T2
Unique outputs              U1            U2         U1/U2
Wall time                   W1            W2         W1/W2
```

Fill the cells from `summary.json`. That's the slide. Show it to your tech lead.

## What the slide tells you

If the RAPP delta on `Files`, `Tokens`, and `Wall time` are all > 1.5×, **migrating that workload to RAPP would measurably improve cost and latency**.

If the delta on `Unique outputs` is large (RAPP smaller, framework larger), **migrating that workload would measurably improve determinism**, which is what enables caching, testing, and reliable downstream automation.

If all the deltas are near 1.0, **you're already shipping a near-RAPP architecture** and you might not need to migrate. Consider this an audit pass.

If RAPP loses on any dimension, **investigate why**. The harness's `diff_sample.txt` shows the actual outputs side by side. Often the issue is your RAPP agent's soul is under-specified, not that RAPP is wrong for the workload.

## The migration question

The bakeoff doesn't tell you to migrate. It tells you what migrating would *measure as.* Whether the measurements justify the engineering cost is your call. Things to factor:

- **One-time engineering cost.** Rewrite N agents as M single-file agents. Usually M < N.
- **Operational savings.** Token bill, latency, support tickets caused by variance.
- **Strategic optionality.** RAPP agents run on three tiers unmodified. Your current agents probably don't.
- **Risk of doing nothing.** Today's framework is one major release away from breaking your code. RAPP v1 is frozen.

If the math says migrate, migrate one workflow. Run the bakeoff again at quarter end. Decide on the next one.

## The honest version

We didn't build the bakeoff to convert you. We built it because we got tired of arguing with people whose claims were unfalsifiable. The harness makes both your stack and ours falsifiable. Anyone can run it. Anyone can dispute it. The tablesettle the conversation.

If your stack wins the bakeoff, we want to know. We'll learn from your adapter and probably steal an idea or three. If RAPP wins, we want you to know — but only because you measured it, not because we told you.

Run the bakeoff. The numbers will pick the conversation.