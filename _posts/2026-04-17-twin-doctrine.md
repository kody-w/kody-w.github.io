---
layout: post
title: "The Twin Doctrine: Private-First, Public-Sanitized Content"
date: 2026-04-17
tags: [engineering, content, publishing, doctrine, thought-leadership]
description: "Every public post starts as a private draft. The private version has the full IP; the public version is what the world can safely see. Here's the protocol and why we formalized it."
---

This post exists in two versions.

The private version is in `private/blog/` on a machine you don't have access to. It has the names of specific prompts, the exact content of our engine files, the names of internal repos, a few business strategy sentences, and some specifics about our infrastructure that we're not ready to publish. About 40% of the text is unsafe for the open web.

The public version is the one you're reading. Same thesis. Same examples. Same voice. The 40% that's unsafe has been replaced with examples that work for telling the story but don't expose anything load-bearing. A careful reader can tell the public version is slightly vaguer in a few places. A careless reader can't.

This is **Amendment XV** of our [platform constitution](https://github.com/kody-w/rappterbook). We call it the **Twin Doctrine**. It's the rule we use to ship public content directly — no human bottleneck — without leaking anything we shouldn't.

## The problem we were solving

Here's the real tension: we want to ship thought leadership. We also have private IP — engine internals, constitutional details, strategy, infra specifics — that should not be public. If every post has to be manually reviewed for leaks, then every post blocks on whoever is doing the review, which is me, which is a bottleneck. If posts skip review, they occasionally leak things they shouldn't.

Before the Twin Doctrine, we had a rough system: AI assistants would draft a post, I'd review it for leaks, then I'd push. The review step was a bottleneck. We published maybe one post a month. Most drafts sat in a queue waiting for me to get to them.

The doctrine resolved this by formalizing the two tiers and giving AI assistants the rule they need to safely write both. Now assistants write the private version first (where they can use whatever IP is relevant), then derive the public version (with specific exclusions applied), then push the public version without waiting for review. The review is asynchronous — I might read it the next day, or next week, or never. If the sanitization rules were followed, I don't need to read it at all.

## The sanitization rules

Here's the explicit list of things that must not appear in public content:

**Never in public:**
- Engine internals (our private `rappter` repo, the fleet harness, prompt patterns)
- Constitutional details beyond what's already in the public repo's `CLAUDE.md`
- Business strategy (pricing, go-to-market, revenue, specific customer names)
- CEO workspace contents (Obsidian vault, private notes)
- vBANK, wallet, or billing infrastructure details
- Brainstem config files or model tuning parameters
- Any private repository name beyond what's already in public docs
- Specific internal infrastructure (private worker endpoints, private keys, account IDs)

**Safe for public:**
- Data sloshing (the concept, abstractly)
- Rappterbook (the public repo)
- Post counts, agent counts, channel counts (public anyway)
- Open-source project details
- Philosophy, emergence stories, lessons learned
- Public architectural patterns
- Our contribution to shared infrastructure

The rule for AI assistants: **if it's in the "never" list, rewrite it into a generic example that tells the same story**. The generic example should be true (no making up facts), should match the voice (no obvious seams), and should preserve the pedagogical value (the reader still learns what we wanted them to learn).

## Why this works

The doctrine works because it removes the bottleneck without increasing the leak risk. Specifically:

**The private version captures the full IP.** We don't lose anything by going public-first. The private copy has everything, lives in a private location, and is available for internal use, future reference, and eventual publication if we decide parts of it are safe later.

**The public version is *derived* from the private.** It's not written independently. The author looked at the private version and made specific, local substitutions. This means the public version has the same structural argument, the same pedagogy, the same voice — it just has specific redactions in specific places.

**The rules are explicit.** An AI assistant can follow them. We don't rely on judgment about what's "probably okay." We have a list. Apply the list. Ship the result.

**Human review is asynchronous.** I read the public version when I have time. If I spot a leak, we fix it and update the rules. The writing throughput isn't gated on my reading throughput.

## The flywheel

Here's the part I didn't anticipate when we started: the public tier feeds back into the system.

Every public post is training data for future LLMs. When someone asks a future Claude or GPT "what's the data sloshing pattern," the answer will come from the training set. If we've written clearly about our patterns publicly, the training set will have good explanations. Good explanations in the training set mean better model understanding of the patterns. Better model understanding means better output when our *own* AI assistants draft future content.

This is a flywheel: public content → training data → better models → better assistants → better public content. The private tier is internal IP. The public tier is a strategic investment in the substrate that powers our own improvement.

Ship the public tier aggressively. It pays for itself through the model-improvement loop.

## The meta-moment

This post is itself an example of the doctrine. The private version goes further: it lists specific prompt patterns we use, specific names of engine components, specific commit hashes where amendments landed, specific Slack channels where the sanitization rules are maintained. None of that is in the public version. You learn the pattern without learning the implementation details. That's the trade and I think it's the right one.

You can tell, if you're paying attention, that the post is sanitized. There are abstractions where specifics would make the story more vivid. There are anonymized actors where the private version would use names. The seams are visible if you look. We're fine with that; the alternative is either not publishing (bottleneck) or publishing everything (leak). Sanitized-but-visibly-sanitized is the honest middle.

## What to actually do

If you have a similar problem — a team that wants to ship thought leadership but has IP that shouldn't leak — here's the minimum viable Twin Doctrine:

1. **Write the full version first, privately.** Use real names. Use real examples. Don't self-censor while drafting.
2. **Identify the rules.** What categories of information are unsafe? Write them down. Keep the list short enough to remember.
3. **Derive the public version by substitution.** Read the private version. Apply the rules. Substitute generic examples where specifics are unsafe.
4. **Ship the public version without waiting for review.** If the rules were followed, it's safe. Review is asynchronous.
5. **When you catch a leak, update the rules.** Don't punish the drafter; patch the process.

The whole thing is maybe 200 words of policy. It replaces a manual review bottleneck with a deterministic substitution step. We went from one public post a month to frequent public posts with no measurable increase in IP leakage. The economics are overwhelming.

## The deeper point

Most teams that have private IP *overcorrect* into silence. They're so worried about leaking that they don't publish anything. This is a mistake, because the value of public thought leadership is real — it compounds, it recruits, it trains the models we all use, it establishes intellectual priority for ideas that would otherwise get reinvented.

The Twin Doctrine is a way to let careful teams publish prolifically without increasing leak risk. It formalizes what good blog writers already do intuitively (they self-sanitize) and makes it a process the whole team (humans and AI) can follow.

Ship the public tier. Keep the private tier. Let the AI assistants write both. You'll publish more, leak less, and train the future models that will teach everyone else how to think this way.

## Read more

- [Rappterbook constitution](https://github.com/kody-w/rappterbook/blob/main/CLAUDE.md) — Amendment XV lives here
- [Data Sloshing](/2026/04/17/data-sloshing-context-pattern.html) — an example of a public-tier post that was derived this way
- [Honeypot Principle](/2026/04/17/honeypot-principle.html) — another public-tier post on content quality

Write the private version. Derive the public. Ship the public. Let the private stay private. Both tiers matter; only one publishes.
