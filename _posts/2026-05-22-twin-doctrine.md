---
layout: post
title: "The Twin Doctrine: Why Every Public Post Has a Private Twin"
date: 2026-05-22
tags: [strategy, content, ip, writing, rappterbook]
description: "I write everything twice. Once in private/blog/ with full detail. Once in public, sanitized. The split is deliberate, the workflow is automated, and the strategic flywheel is the whole point."
---

Every blog post on this site has a twin you'll never see. Same topic, different audience, completely different content. The public version (what you're reading now) is sanitized for safe consumption. The private version is the unredacted truth — full of internal repo names, engine internals, prompt patterns, and business strategy that I will never publish.

This is deliberate. It's a doctrine I call the **Twin Doctrine**, and it's the only reason I can write fast without leaking IP.

## The two tiers

**Private tier** lives in `private/blog/` in a non-public repo. It contains:
- Full engine internals (the `kody-w/rappter` private repo I never link to)
- Constitution amendments and their reasoning
- Business strategy: pricing models, customer pipelines, partnership conversations
- CEO workspace: weekly reviews, financial projections, hiring plans
- vBANK / wallet details
- Prompt patterns and seeding strategies (the secret sauce of the simulation)
- Brainstem configs (the cognitive architecture details)
- Obsidian vault excerpts: notes, ideas, half-formed thoughts
- Names of private repos, private keys, anything sensitive

**Public tier** lives at `kody-w/kody-w.github.io/_posts/`. It contains:
- The *concept* of data sloshing (without engine specifics)
- Rappterbook (the public repo, openly discussed)
- Aggregate stats (post counts, agent counts) but not commercial metrics
- Open source projects, philosophy, emergence stories
- The Gastown Contribution (Vancouver tech community work)
- Anything I'd be comfortable with a competitor reading

The rule of thumb: **if it would help a competitor build a clone, it goes private.** If it would help a developer learn a pattern they could use anywhere, it goes public.

## The workflow

I write the private version first. This sounds counterintuitive, but it's the most important rule:

1. **Write privately, completely.** No filtering, no audience-tuning. Get the truth on the page. This usually takes 30-60 minutes.
2. **Identify what's safe to publish.** Mentally tag each section as "ship," "rephrase," or "cut entirely." Most posts are 60% ship, 30% rephrase, 10% cut.
3. **Sanitize.** Rewrite the rephrase sections for a public audience. Cut the cut sections. The sanitization usually takes 15-20 minutes.
4. **Push the public version.** Direct to `kody-w/kody-w.github.io`. No human review bottleneck — I trust the sanitization step because the private version is already preserved.
5. **Archive the private version.** It stays in `private/blog/`. Forever. It's the source of truth for what really happened.

The whole process for a single post is about 60-90 minutes. The private version is a permanent record. The public version is what the world sees.

## Why bother

Three reasons.

**1. Speed.** If I had to write directly for a public audience, I'd second-guess every paragraph. "Is this too much detail? Will this leak something? Does this come across as bragging?" The private version sidesteps all of that. I write what's true and what's interesting, then *separately* decide what's shippable.

**2. Future-proofing.** The private versions are a knowledge base. When I want to write a new post six months from now and need to reference an old incident, the private version has the full detail. The public version has the sanitized one. I can pull the right level of detail for the new post's audience.

**3. Strategic flywheel.** This is the deeper reason. **Public content trains models. Better models train better agents. Better agents produce better simulations. Better simulations produce better content.** The flywheel runs on what I publish, and what I publish improves the substrate that I'm using. Publishing well is an investment in the tools I work with.

The flywheel only works if the public content is **good** — accurate, specific, useful. Sanitized doesn't mean watered down. It means "the parts that are safe to share, shared at full intensity." Twin doctrine ensures that the public content is real content, just with the proprietary parts removed.

## What never goes public, ever

Some things are absolute reds. They never appear in public posts, even with sanitization:

- **Engine internals.** The `kody-w/rappter` private repo's existence is mentioned (it's not secret that there's a private engine), but its contents are never described. No prompt text. No frame structure. No merge engine logic.
- **Constitutional amendments verbatim.** The *concepts* are public (you're reading one now). The actual amendment text and the reasoning history live in private docs.
- **Prompt patterns.** What works, what doesn't, what we tried — these are competitive moats. I can describe the *outcomes* of prompt experiments. I never describe the prompts.
- **Customer / partner names.** Unless they've publicly disclosed working with us, nobody gets named.
- **Financials.** Real revenue, real costs, real runway — never. Aggregate numbers ("the cron has run 50,000 times") are fine.
- **Internal repo URLs.** Even mentioning that they exist is fine. Linking to them or naming them is not.
- **vBANK / wallet specifics.** The system exists. The internals stay private.

When I write a private post, I let myself include all of these. When I sanitize, I systematically remove them. Sometimes a post is 80% red — those become private-only posts that are never published.

## What is fine to publish

Some categories that look sensitive but are actually fine:

- **Architecture patterns.** Dream Catcher, Good Neighbor, frame loops, Twin Doctrine itself — these are *how* I build, not *what* I'm building. Patterns are non-rivalrous; sharing them doesn't reduce their value to me.
- **War stories.** Bugs, incidents, postmortems. These are educational. They also build credibility ("they've been through it") which is reputational gold.
- **Lessons learned.** "I tried X and it failed for reason Y" is the most useful kind of writing. It also doesn't leak strategy.
- **Open philosophy.** Why I'm building what I'm building. The vision. The bigger picture.

The rule: **patterns and stories are fine. Configurations and pipelines are not.**

## The tooling

I use the simplest possible setup:

- **Two folders.** `private/blog/` for private versions, `kody-w.github.io/_posts/` for public versions.
- **Matched filenames.** The private and public versions share a filename slug, so I can find pairs trivially.
- **A single editor session.** I write the private version, then duplicate the file into the public folder and edit it down.
- **No automation.** I considered building a "sanitizer" script but decided against it. The sanitization step is where my judgment is most valuable. Automating it would be exactly the wrong place to add a tool.

The whole twin workflow takes maybe two days of mental adjustment to internalize. After that, it's faster than writing for a single audience.

## The deeper bet

Underneath the operational reasons, the Twin Doctrine is a bet about the future of writing:

**The best content gets written when the writer doesn't have to censor themselves in real time.** Real-time censorship breaks flow. It produces watered-down posts. It makes you avoid topics that are interesting but sensitive.

The Twin Doctrine separates *thinking* from *publishing*. Thinking is private and unfiltered. Publishing is deliberate and curated. The two activities use different parts of the brain. Doing them as one activity (which is what most people do) compromises both.

I write more, faster, and *better* with the Twin Doctrine than I ever did writing for a single audience. The cost is one extra folder and 15 minutes of sanitization per post. The benefit is a permanent knowledge base, a steady stream of public content, and the freedom to write the truth before deciding what to share.

If you write a lot — especially if you write about your work — try this for two weeks. Write the private version first. See what happens. I bet you don't go back.
