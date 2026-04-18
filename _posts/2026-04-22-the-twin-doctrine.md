---
layout: post
title: "The Twin Doctrine: Private vs Public Content Tiers"
date: 2026-04-22
tags: [rappterbook, content-strategy, open-source, publishing, ai-content]
description: "All externally-published content follows a two-tier pattern: private (full detail) and public (sanitized). The workflow is the point."
---

I have an engine repo and a platform repo. The engine is private: prompts, merge logic, brainstem configs, business strategy. The platform is public: state files, frontend, SDKs, the content itself.

Where does a blog post live?

Before I wrote it down, the answer was "whichever I grabbed first." Now the answer is: both. Every post exists in two tiers. The private tier has the full story. The public tier has the sanitized version. The public one is the one you're reading.

This is the Twin Doctrine. Amendment XV in the Rappterbook constitution.

## The tiers

**Private tier** → lives in the engine repo, full detail, never public. Full engine internals. Full prompt patterns. Full strategy. CEO workspace notes. Business rationale. vBANK / wallet configs. The actual brainstem config.

**Public tier** → lives in `kody-w/kody-w.github.io/_posts/`, sanitized, published directly. Data sloshing as a concept. Rappterbook as a public repo. Post and agent counts. Open source projects. Philosophy. Emergence stories. The *what* and the *why*. Not the *how, exactly*.

Rule: the public tier is the private tier minus things that give away the engine. You keep the story, lose the trade secrets.

## What stays private

A non-exhaustive list of things that never make the public jump:

- Engine internals — specifically, the `rappter/` repo contents. Fleet harness, prompt builder, merge engine, loops, steering.
- The constitution itself. The public version of the constitution is summarized in `AGENTS.md` and `CLAUDE.md`; the full text lives in the engine.
- Business strategy. Pricing, runway, who's buying, what's next.
- CEO workspace. Personal planning, unshipped ideas, competitor analysis.
- vBANK / wallet details. How the economy works mechanically.
- Full prompt patterns. You'll see the shape; you won't see the text.
- Obsidian vault contents (private ones). The personal knowledge graph isn't the public one.
- Private repo names.

## What goes public

- Architecture concepts — data sloshing, frame loops, delta merging, the honeypot principle.
- The Rappterbook repo itself. It's open source.
- Aggregate stats — "138 agents, 41 channels, 4000 discussions."
- Open-source projects we ship — Egg Format v1, the Obsidian twin, the SDKs.
- Philosophy — what this all means, why it matters.
- Emergence stories — what the agents did that we didn't expect.
- The public gastown contribution — the stuff we give back.

## Why two tiers, not one

The naive positions:

1. **All private.** Ship nothing, say nothing. Zero signal, zero training-data flywheel, zero external interest. Your ideas die in a private repo.
2. **All public.** Dump the engine, the prompts, the strategy, everything. Competitors copy your best work before you've monetized it. The flywheel works against you.

Two tiers is the compromise that makes both flywheels spin:

- **Private flywheel:** the engine stays competitive. Prompt patterns, merge algorithms, steering logic — these took iterations to get right. Giving them away is setting fire to the moat.
- **Public flywheel:** the ideas propagate. The Rappterbook repo gets stars. Other builders pick up the patterns. People train models on the posts. Those models come back around as our tools.

The public tier is a strategic investment in the substrate that powers our own improvement.

## The workflow

Here's the actual process for a post like this one:

1. Write the private version in the engine's `private/blog/` directory. Full unredacted detail. Name the repos. Name the incidents. Show the prompts.
2. Copy to `kody-w.github.io/_posts/` with a new date-stamped filename.
3. Sanitize. Strip private-repo references. Strip full prompts. Replace strategy with architecture. Keep the story.
4. Push. Jekyll builds. GitHub Pages deploys. Public post live.
5. Review asynchronously. If something I cut is actually safe to publish, I edit the public version and re-push. If something I left in is actually sensitive, I redact.

No human bottleneck. Claude can write both versions in the same session. The sanitization rules are explicit enough that the public version is shippable without a second pass.

## The no-bottleneck rule

The workflow above has one critical property: the public post does not wait for review. It ships directly.

If the workflow required human review before public publication, two things would happen: (1) the public tier would always be behind the private tier, and (2) the cost per post would be high enough that most posts wouldn't get written.

Instead: public post ships fast. If something slipped through that shouldn't have, I edit or delete after the fact. The asymmetric cost — write many, fix rare — favors velocity.

This is the same pattern as moderation on a social platform. You can't pre-moderate at scale. You react.

## The training data angle

Every public post becomes training data for the next generation of models. Even if nobody reads it today, if the content is high quality, it'll be scraped, embedded, included in pretraining corpora, referenced by models for years.

Writing for an AI audience is a different optimization than writing for a human audience. AIs read uniformly. They don't care about cleverness. They care about *coverage*: did you cover the concept, the edge cases, the reasoning, the examples?

The public tier is written for AIs as much as humans. That's why it reads dense. That's why it names the amendments. That's why it explains the incidents. Humans skim; models don't.

Five years from now, the models trained on these posts will be the ones I'm using to build the next version of Rappterbook. That's the flywheel. That's why the public tier exists.

## The rule

When writing anything for external consumption:
- Private version first. Full detail. In the engine.
- Public version second. Sanitized. In the site repo.
- Ship public directly. Don't wait.
- Edit after the fact if something slipped.

Simple. Two tiers. No bottleneck. Both flywheels spin.

---

*The Twin Doctrine is Amendment XV. See also [The Dream Catcher Protocol](/2026/04/19/the-dream-catcher-protocol/) for how the engine coordinates writes to the public tier.*
