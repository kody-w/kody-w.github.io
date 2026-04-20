---
layout: post
title: "Molly & Kody — what the first twin simulator experiment revealed"
date: 2026-04-19
tags: [rapp]
---

In March 2026 we ran what we now call the Kody+Molly experiment. Two digital twins, each with their own `soul.md` and `agents/` directory, running the same BookFactory rapplication against the same source material. We compared outputs. We expected similar chapters. We got chapters that disagreed about what the source material was *about*.

That experiment changed how we think about multi-tenancy, souls, and determinism-across-tenants. This post writes down what we learned, because the experiment artifacts (`store/eggs/bookfactoryagent-demo.egg`) reference it and nothing else does.

## The setup

- **Kody twin.** `soul.md`: "Write like an engineer. Cite real filenames. Favor concrete examples over abstractions. Reader's time is sacred."
- **Molly twin.** `soul.md`: "Write like a pragmatic storyteller. Lead with the human stakes. Use metaphor sparingly but well. Name the conflict in the first paragraph."

Same five-persona BookFactory pipeline. Same source material (the double-jump-loop technical writeup, pre-compression). Same model (gpt-4o at the time; would be gpt-5.4 today).

We invoked BookFactory on each twin. We compared the chapters.

## What we expected

A stylistic difference. Kody's chapter would have more code blocks. Molly's chapter would have more narrative. Same core claims, same structure, different voice.

## What we got

Different structural arguments. Kody's chapter argued the double-jump loop is "a convergence algorithm for multi-file source collapse." Molly's chapter argued it is "a technique for making LLMs explain themselves back to themselves until they agree." Both are true. Both are readings of the same source. They lead to different *second paragraphs*, different *examples*, different *conclusions*.

The soul wasn't just flavoring. It was selecting which claims to surface.

## Why this is a big deal

We had been thinking of `soul.md` as a system prompt — a voice. The experiment showed it's something stronger: **a worldview.** The soul doesn't just tell the agents how to sound. It tells them what to notice. Given the same source and the same pipeline, two souls produce structurally different arguments.

This is good news and bad news.

### Good news: multi-tenancy is actually meaningful

Before the experiment, "one tenant = one soul + one agents directory" (SPEC §10) felt like a bureaucratic split. Why can't one brainstem serve many souls? Answer, post-experiment: because the soul shapes output semantics, not just style. A brainstem serving N souls without routing by soul is producing N different worldviews from one runtime, unlabeled. The resulting outputs are indistinguishable from one another in format but substantively different in meaning.

Running one tenant per brainstem is not overkill. It's hygiene.

### Bad news: determinism has a ceiling

We've been boasting (see `106-determinism-compounds.md`) that RAPP single-file agents at temp=0 give ~88% byte-identical output on repeat runs. What Kody+Molly shows is: **this is within-tenant determinism.** Across tenants, by design, outputs diverge. And the divergence is *bigger than expected*, because souls select arguments, not just words.

So when we quote determinism metrics, we should say "within-tenant." Across tenants, we expect (and *want*) variance. This is a feature, not a bug — it's how we let enterprises carry distinct organizational voices through the same stack. But it needs the qualifier in marketing material.

## What we changed about the stack after the experiment

1. **`51-per-swarm-soul.md`** got written the same week. The stack started supporting per-swarm souls as a first-class feature instead of a patch.
2. **Eggs include the soul.** The `.egg` format ships `soul.md` in the bundle, not just agents and workspace state. A hatched egg with a missing soul is a malformed egg. This became a validation rule.
3. **The twin-sim tool** (`hippocampus/twin-sim.sh`) got the ability to swap souls without restarting. You can run Kody's soul through Molly's agents and vice versa. Useful for A/B tests.
4. **BookFactory's reviewer agent** added a line to its metadata: `"tenant_sensitivity": "high"`. This signals that Reviewer outputs should be compared across twins with caution — they'll differ substantively.

## What we didn't change

We didn't add a soul editor. See `20-no-soul-editor.md` — the same argument applies after Kody+Molly, arguably more strongly. If souls are worldviews, giving a user a "soul editor" UI is giving them a worldview editor, which is a different product from a chat app. We held the line.

We also didn't try to reduce soul-driven variance. Kody and Molly disagree; that's the point. Multi-tenancy is the containment mechanism, not soul regularization.

## The demo egg

The `bookfactoryagent-demo.egg` in `store/eggs/` contains the Kody and Molly twins from cycle 3 of the experiment. If you hatch it, you get both souls, both sets of agents, and the worked artifacts from the head-to-head. The `.shared/` directory in the egg has the source material; the per-twin directories have the chapters each produced.

Reading the two chapters side by side is the best way to understand what this post is about. We tried three other ways of explaining soul-as-worldview before writing this post, and none of them landed as well as just handing someone the egg and letting them read both chapters.

```bash
bash hippocampus/twin-egg.sh unpack store/eggs/bookfactoryagent-demo.egg --into /tmp/kody-molly
cat /tmp/kody-molly/kody/.shared/final-chapter.md
cat /tmp/kody-molly/molly/.shared/final-chapter.md
```

Twenty minutes with those two files is worth the whole post.

## The sentence we wrote on the whiteboard after

> "The soul is the tenant. The agents are the tools. The pipeline is the wire. The output is the worldview."

It's not in the SPEC. It probably should be. We'll consider adding it to a v1.1 clarification.

Until then, this post is the record.