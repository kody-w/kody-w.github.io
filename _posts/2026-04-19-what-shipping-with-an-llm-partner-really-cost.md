---
layout: post
title: "What shipping with an LLM partner really cost — the year in numbers"
date: 2026-04-19
tags: [rapp]
---

Companion post to `97-shipping-with-an-llm-partner.md`. That post was the qualitative story. This is the bill.

Numbers are from internal logs covering 2025-12 through 2026-04 — the build-up to v1 freeze plus the BookFactory + RAPPstore launch. The model was a mix of `gpt-4o`, `gpt-5.x`, and `claude-3.5-sonnet`. The work was: ~120 PRs, the SPEC, ~138 agents in RAR, the swarm server, the brainstem, the worker, the tether, the bakeoff harness, and 123 blog posts including this one.

We did not measure perfectly at the start. The numbers below are conservative reconstructions, with sources noted.

## The token bill

| Period | Total tokens | Estimated USD |
|---|---:|---:|
| Dec 2025 (warm-up) | 18M | $43 |
| Jan 2026 (SPEC drafting) | 64M | $156 |
| Feb 2026 (swarm server) | 92M | $221 |
| Mar 2026 (registry + cards) | 117M | $278 |
| Apr 2026 (BookFactory + bakeoff) | 134M | $312 |
| **5-month total** | **~425M** | **~$1,010** |

Source: Azure OpenAI billing exports + GitHub Models usage page. USD is approximate; rates varied.

The total is small relative to "build a thing in 5 months" budgets. It's also large relative to "this is a side project" intuitions. The honest number is: somewhere between a small SaaS subscription and a junior contractor for a few weeks.

## What that bought us

In count form, what shipped in those 5 months:

- 1 frozen spec (SPEC.md, ~1,200 lines)
- 19 starter `*_agent.py` files in `agents/`
- 138 registered agents in RAR (community + ours)
- 1 brainstem server (~3,500 LOC)
- 1 swarm server (~1,800 LOC)
- 1 worker (Cloudflare-hosted relay, ~250 LOC)
- 1 tether (~400 LOC)
- 1 hippocampus (Function App + Bicep + ARM template)
- 1 bakeoff harness (12 files, ~800 LOC) plus reference adapters
- 1 mobile PWA brainstem
- 1 RAR SDK (~700 LOC, single file)
- 6 starter eggs (twin sims + BookFactory demo)
- 2 rapplications (BookFactory, MomentFactory)
- ~120 PRs merged
- 123 blog posts (this is post #122; 123 follows)

Per-PR token cost: ~3.5M tokens. Per-blog-post: ~600K tokens (drafts, edits, fact-checks). Per-agent: ~250K tokens (code + soul + tests + manifest).

These ratios are useful. They predict next quarter's bill given next quarter's PR/post/agent count. Plan with them.

## The wall-time bill

Engineering hours per artifact, rough estimates:

| Artifact | Hours each | Notes |
|---|---:|---|
| Blog post | 1.5 | LLM partner does ~60% of the drafting |
| Single-file agent (community) | 2 | Usually one sitting |
| Composite rapplication | 8 | Includes the double-jump loop cycles |
| Spec section | 4 | Lots of revision |
| Server feature | 6 | Includes tests |
| Bakeoff adapter | 0.5 | They're tiny |

The LLM partner saves 30-60% of these times depending on artifact type. Spec sections benefit least; community agents and blog posts benefit most.

## What the LLM partner did *not* do

- It did not write the SPEC. The SPEC was authored by humans and reviewed by humans. The LLM partner contributed exactly two passages, both rewritten by hand.
- It did not pick the architecture. Single-file agents, three tiers, `data_slush`, eggs, incantations — all human decisions, often debated for days.
- It did not catch its own mistakes. Every LLM-generated code change was reviewed by a human before merge. The merge rate of LLM-suggested PRs without modification is roughly 12%.
- It did not build the bakeoff harness's design. The implementation was LLM-assisted; the architecture (adapter pattern, four metrics, error capture) was human.

What the LLM partner *did* do:
- Drafted ~80% of blog post first drafts.
- Wrote ~70% of agent boilerplate.
- Generated ~90% of test scaffolding.
- Reviewed ~100% of PRs as a first-pass critic (catches typos, obvious bugs, missed edge cases).

The split is roughly: humans pick the why, LLM drafts the what, humans approve the how. This is the partnership shape we'd recommend to anyone copying the model.

## The hidden bill

Two costs that don't show up in the token numbers:

1. **Context-switching tax.** Working with an LLM partner means constantly re-establishing context: pasting files, re-explaining decisions, correcting hallucinated history. Probably 20% of engineer time goes to context maintenance. We estimate this in hours, not dollars, but it's real.
2. **Trust calibration.** The LLM partner is wrong sometimes. Calibrating *when* to trust output — for code, for prose, for facts — is a skill that takes a quarter or two to develop. New team members are slower until they calibrate.

If we were budgeting a similar effort fresh, we'd add 30% to the wall-time numbers above to cover these costs. The token bill stays roughly constant; the engineer hours go up.

## What we'd do differently

Three things, in order of regret:

### 1. Measure tokens from day one

We didn't measure tokens for the first six weeks. The reconstructed numbers above are imprecise as a result. Anyone starting today should instrument LLM calls with an aggregator (we use a thin proxy now) so the per-feature cost is queryable in real time.

### 2. Use the bakeoff pattern internally earlier

We spent weeks comparing prose drafts of agents from different model versions. The bakeoff pattern (`105-the-bakeoff-pattern.md`) replaced that with numbers in two days. We should have built the harness in February, not April.

### 3. Run the LLM partner on a separate model from production

We were using gpt-5.4 to build infrastructure that runs on gpt-5.4. When the model occasionally regressed, the partner regressed too, and we discovered both at once. Running the partner on a stable model (Claude Sonnet, in our case) and the production stack on the latest would have been a hedge.

## The bottom-line ratio

For the work shipped in five months, the LLM partner cost about $1,000 and shaved roughly 35% off engineering wall time. If we had outsourced the equivalent shaved-off work to contractors, it would have cost five figures. The ROI is real and not hard to defend.

It is also not magic. The 65% of effort the partner did not do is the 65% that mattered most: architectural decisions, debug work, the parts of writing where you have to mean something specific.

The partner makes you faster at the typing. It does not make you better at the thinking. Plan accordingly.

## What this post is for

A reference number for the next person on the team budgeting an LLM-partnered effort. A reality check on "wow, AI is making us 10× more productive" claims (it isn't; 30-40% is the honest ceiling for non-trivial work). A historical record for when these numbers look quaint in 2028 because the rates dropped 10×.

Save the post. The numbers rot fast. The shape doesn't.