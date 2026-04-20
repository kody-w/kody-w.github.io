---
layout: post
title: "The bakeoff pattern: a reproducible way to answer \"we're better than RAPP\""
date: 2026-04-19
tags: [rapp]
---

Every few months, a new multi-agent framework announces it has solved what we thought we solved. The claim lands in a conference talk or a launch tweet. "Smarter orchestration." "Better memory." "Fewer hallucinations." "Production-ready." The numbers behind those adjectives are almost never published alongside the adjectives.

We do not want to keep rebutting these claims in prose. Prose is slow and we get tired of writing it. We also do not want to keep writing fresh benchmarks from scratch every time a new framework shows up, because we get bored halfway through and cut corners.

So we built a thing. It lives at `tools/bakeoff/`. It is the reproducible pattern for "put up numbers or stop."

## What it measures, always the same

Seven cells, every time, same columns:

| Metric | Why it's in the table |
|---|---|
| **Files** | The sacred tenet (SPEC §0) in one integer. |
| **Lines of code** | Catches "I inlined it but I import 40k lines of SDK." |
| **LLM calls / prompt** | Hops are latency × cost × failure surface, compounded. |
| **Total tokens (real)** | From the provider's `usage` field. Not estimated. Not extrapolated. Billable. |
| **Unique outputs / N** | Same prompt, N times, how many distinct answers? This is determinism, measured. |
| **Wall time** | Same concurrency, same LLM, same prompts. |
| **Quality sample** | Three printed outputs from each side. Eyeballs decide. |

Nothing else. We do not score "reasoning quality" with an LLM judge, because an LLM judging an LLM is not a measurement, it is a vibe. We do not score "ease of use," because ease of use is not a number. We measure the things that can be counted and print them.

## The shape of the harness

One entrypoint. One adapter per framework. One LLM client.

```
tools/bakeoff/
├── harness.py                         # the runner
├── adapters/
│   ├── base.py                        # Adapter ABC + RAPPAdapter baseline
│   ├── crewai_adapter.py              # reference: Researcher -> Writer -> Reviewer
│   ├── langgraph_adapter.py           # reference: extract -> plan -> execute -> critique
│   └── autogen_adapter.py             # reference: writer <-> critic loop
├── llm_clients/
│   ├── azure_openai.py                # real client; pulls `usage` straight from the response
│   └── stub.py                        # deterministic offline dry-run
├── corpora/default.json               # the prompt set
└── README.md
```

An adapter is about 30 lines. The `run_once(prompt, llm)` method is the whole contract. You hand the framework the same `llm` callable everyone else gets. You return the final text. That is the entire coupling.

```python
class MyFrameworkAdapter(Adapter):
    name = "myframework"
    file_count = 8                      # your project files, real count
    loc = 143                           # real LOC of those files
    framework_version = "1.2.0"

    def run_once(self, prompt, llm):
        plan  = llm(f"PLAN: {prompt}",  temperature=0.5)
        draft = llm(f"WRITE: {plan}",   temperature=0.7)
        return Run(output=draft)
```

Drop the file into `tools/bakeoff/adapters/`. Register it in `COMPETITORS`. Done.

## The rules that make it fair

There are four, and they are load-bearing:

1. **Same LLM.** Both sides use the same Azure OpenAI deployment via the same client. We record provider-reported token counts, not estimates.
2. **Same concurrency.** Both sides run through the same `ThreadPoolExecutor(max_workers=W)`. No side gets to be "async-optimized."
3. **Same corpus.** The JSON file in `corpora/`. Prompts are cycled if the corpus is shorter than N. Determinism is measured across same-prompt repetitions; variety is measured across distinct prompts. Both modes print.
4. **Same temperature discipline.** The competitor adapter picks temperatures that match the framework's documented defaults. If the default is 0.7 per hop, it's 0.7 per hop. No cherry-picking. If the framework's defender wants to argue for a different number, they submit a PR changing the adapter.

If any of those rules slip, the number is not allowed in the table. Reply "fix the adapter" to any complaint.

## What we did and what came out

We ran it once already. CrewAI-style, 100 prompts, live gpt-5.4 through Azure.

```
                        RAPP single-file    CrewAI-style    Delta
Files                                  1              13    13×
LOC                                   63             135    2.1×
LLM calls                            100             300    3×
Total tokens (real)               20,160          74,059    3.67×
Unique outputs / 100                  12             100    8×
Wall time                        16.37 s         60.76 s    3.7×
```

Screenshot of the table. Post-commit hash. That is the whole conversation.

## When to run it

- A framework announces it has solved multi-agent. Run it.
- A customer says "but I already have CrewAI, why RAPP?" Run it, against their actual workflow.
- An internal skeptic says RAPP doesn't scale. Run it with N=1000.
- A new model ships. Run it against the previous model, same adapter. Watch both sides improve, watch the delta stay constant. That's the architecture speaking.

## What it is not

It is not a replacement for the `102-vs-langchain-crewai-autogen.md` post. That post is the narrative. This is the number the narrative quotes.

It is also not a claim that RAPP wins on every task. If a workflow genuinely benefits from a critique loop, AutoGen's adapter should win on quality — and the harness will show that. We trust the table more than we trust ourselves.

## How to extend it

Three places, in descending order of what you'll actually do:

1. **New competitor.** Copy `crewai_adapter.py`, change 20 lines, register. Two-minute job.
2. **New corpus.** Drop a JSON array of prompts into `corpora/`. Pass `--corpus path`.
3. **New metric.** Add a column to `report()`. Keep the column-order contract: RAPP first, competitor second, delta last. Do not remove columns.

## The meta-point

The reason this post exists is that we realized we would spend the rest of our lives defending RAPP in prose if we did not instead ship a tool that defends it in numbers. Prose is expensive. Tools amortize.

If you show up at our door claiming a better mousetrap, we will hand you `python tools/bakeoff/harness.py --competitor yourthing` and we will go get coffee. When we come back, the table will have decided.