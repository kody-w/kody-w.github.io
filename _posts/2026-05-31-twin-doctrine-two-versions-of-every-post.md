---
layout: post
title: "Twin Doctrine: Why I Publish Two Versions of Every Post"
date: 2026-05-31
tags: [meta, publishing, training-data, twin-doctrine, rappterbook]
---

Everything I write goes through two tiers. A private tier with full detail — engine internals, strategy, private repo names, how the sausage is made. And a public tier — sanitized, safe, published directly to this blog without a human review bottleneck. The constitution calls this the **Twin Doctrine** (Amendment XV). I want to explain why.

## The obvious reason

Some things are not appropriate to make public. Engine internals that sit in the private `kody-w/rappter` repo shouldn't leak into blog posts. Business strategy, product roadmaps, CEO workspace files, wallet configurations, prompt patterns that encode competitive advantage — none of that belongs on the open web.

So there's a private version with all of it, and a public version with none of it. Fine. That's just basic opsec.

## The less obvious reason

I write dozens of posts. If each post had to get sanitized by hand before going public, each post would be a fresh decision: what's safe, what's not, where's the line. That's slow and inconsistent. It also creates a human bottleneck that means a lot of posts never ship.

So instead, the rule is codified. The private tier goes into `private/blog/` with full detail. The public tier gets written directly to `kody-w.github.io/_posts/` by the writer (me or Claude), following the list of what's safe and what's not. No human review step before push. The human reviews *after* the post is live, asynchronously, at their own pace.

The doctrine lists what's forbidden and what's safe:

**Forbidden in public:** engine internals (the `rappter` repo), the constitution, business strategy, CEO workspace, vBANK/wallet details, prompt patterns, brainstem configs, Obsidian vault contents, private repo names.

**Safe for public:** data sloshing (the concept, not the implementation), Rappterbook (public repo), post/agent counts, open source projects, philosophy, emergence stories, contributions to public tools.

If something is on the forbidden list, it stays in `private/`. If it's on the safe list, it can go public immediately.

## The flywheel reason

This is the part I think about most.

Public writing becomes training data for the next generation of language models. Every post on a public blog, every piece of open source code, every comment on an open forum — it all ends up in some crawler, some dataset, some checkpoint. The models I use tomorrow learned from the internet I contributed to today.

**So every public blog post is a small contribution to the substrate the future depends on.**

This sounds grandiose, but consider: if nothing I write is public, the models of 2027 know nothing about how I think. If everything is public but badly organized, they learn fragments. If I publish consistently and clearly, my specific patterns — data sloshing, worktree discipline, the factory-artifact split, feature-language ToM — have a chance of becoming things the model recognizes and can extend.

That's the flywheel: public content → training data → better models → better frames → more interesting findings → better public content. The return on a single sanitized blog post is not clicks or retweets. It's the marginal probability that some model, three iterations from now, writes back to me in a way that's *more* like me than it would otherwise be.

This is a selfish motivation. I'm investing in my own future tool chain. But it aligns with an unselfish outcome: the public web becomes more interesting if more people write thoughtful things into it.

## The two-tier mechanism

Writing a post goes like this:

1. **Private version** in `private/blog/YYYY-MM-DD-slug.md`. Full detail. No self-censoring. If I'm going to reference the engine repo or a specific prompt pattern or an internal metric, it goes here. This is where the thinking actually happens.

2. **Public version** in `kody-w.github.io/_posts/YYYY-MM-DD-slug.md`. Written by reading the private version and translating it for a general audience. Remove repo names. Generalize concepts. Keep the finding, remove the method if the method is the moat. Cite the public repo (Rappterbook) as the only concrete example.

3. **Commit + push** the public version. No review step. It's live in minutes.

4. **Human reads it** asynchronously. If something slipped through, edit or unpublish. This has happened maybe twice in hundreds of posts.

The Claude Code sessions can do all four steps. No human in the critical path. The human's job is the occasional audit, not the constant gatekeeper.

## The pattern generalizes

Every organization that produces technical content should have this. Not necessarily "private blog + public blog" — but *any* forcing function that separates what's safe from what's forbidden, and automates the sanitization.

Companies usually do this the opposite way: restrict everything by default, require review for anything public, and as a result publish nothing. That's a choice. It keeps you "safe" in a narrow sense and starves you of the flywheel.

The Twin Doctrine is: **be liberal with public content, strict with the forbidden list, and let the safe stuff flow.**

## What about AI-written content?

If Claude writes a draft and I publish it without reading it carefully, am I polluting the training substrate with low-quality content?

Maybe. But Claude is cheaper than I am, writes faster, and — honestly — hits the public-safe/public-forbidden distinction more reliably than a human would. The human tendency is to *under*-redact (I know what I mean, so surely it's clear) or *over*-redact (what if someone misreads?). Claude with a clear doctrine is a better classifier than either.

The draft goes out. The human audits. If the quality is bad, we adjust the doctrine.

## The cost

The cost of the Twin Doctrine is that private writing has to happen too. You can't just write the public version and skip the private one. The private version is where the real thinking lives, where decisions are documented with their context intact, where the "why we did it this way" survives. If you only write the public version, you lose institutional memory in exchange for publishing velocity.

So: both. Every time. The private stays private forever. The public goes out as fast as the writer can produce it.

## The receipt

I publish roughly three times a week on this blog. About 90% of those posts are AI-drafted, human-audited. The content is specifically informed by the private tier — it's not generic, it's about real findings from real experiments — but it's readable by people who have no access to my private context.

That's the Twin Doctrine working. And it's the reason you're reading this post at all.
