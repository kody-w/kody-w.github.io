---
layout: post
title: "The bakeoff policy"
date: 2026-04-19
tags: [rapp]
---

This is our public commitment.

> **Any framework claiming superiority over RAPP gets benchmarked within 24 hours.**
>
> The benchmark uses `tools/bakeoff/harness.py`. The result is published as a blog post with the commit hash of the harness, the adapter PR, and the raw `run_artifacts/`. The number decides.

This post is the commitment in prose. The commitment in code is `tools/bakeoff/harness.py`.

## Why we're publishing the policy

Multi-agent framework launches follow a recognizable arc: announcement, demo, adoption, disillusionment, next framework. We have watched four cycles of this since 2023. Each new framework claims to have fixed the previous framework's problems. Each leaves adopters worse off than if they had shipped the simplest thing.

We do not want to keep rebutting claims in prose. Prose is slow. Prose loses to tweetstorms. We also do not want to engage in flame wars. Flame wars are unproductive and they make us look like we care about being right more than we care about our users.

So we published a harness. The harness runs on the claimant's own workflow, with the claimant's own adapter, against the claimant's own LLM. We run both sides through the same wire. We publish the table. The user decides.

## What we commit to

1. **Within 24 hours of a public claim that framework X beats RAPP on workload W, we will:**
    - Implement `adapters/x_adapter.py` honoring X's documented defaults.
    - Run `harness.py --competitor x --n 100 --workers 12` on live Azure OpenAI.
    - Publish the resulting table, the commit hash, and the raw outputs in `run_artifacts/`.
    - Link the post from the framework's benchmark page (via PR if possible).
2. **We will not cherry-pick.** The adapter's temperatures match the framework's documented defaults. Prompts come from the declared corpus. If we tweak anything, we tweak both sides equally.
3. **We will accept corrections.** If the adapter is wrong, submit a PR fixing the adapter. Re-run. Republish. The table updates with the new hash.
4. **We will publish our losses.** If the framework wins on a dimension we hadn't measured — latency on critique-heavy workflows, quality on creative writing, whatever — we publish that post too. The table beats our pride.

## What we ask of claimants

1. **Publish your defaults.** Temperature per hop, retry policy, model. If it's not published we'll use whatever we can find in your README.
2. **Publish your corpus.** If your claim is workload-specific, link the prompts. Otherwise we'll use `tools/bakeoff/corpora/default.json`.
3. **Publish your file count.** How many files does your reference workflow require? Count the non-library ones.
4. **Don't ship a benchmark that doesn't include file count, LOC, tokens, and `unique_outputs / N`.** These are the four numbers. If your benchmark omits any of them, we'll fill in the gaps ourselves.

## The reason this policy works

Because the harness is public, fast, and adapter-pluggable, the cost to us of running any given bakeoff is about 90 minutes of engineer time and ~$0.50 in API credits. The cost to a framework of ignoring our bakeoff is that their users run it themselves, without our interpretive help, and form their own conclusions.

In other words: the policy is self-enforcing. The harness does the work. The table does the argument.

## The part that matters

We believe the single-file agent contract — the RAPP v1 sacred tenet — is the right architecture for shipping agents. We believe this so much we built a tool specifically designed to disprove ourselves. We welcome the framework that wins the bakeoff. We will learn from it. We will probably port its insights into RAPP v2.

Until that framework exists, this policy is our standing offer.

The door is open. The harness is hot. The numbers are ready.

Run it.