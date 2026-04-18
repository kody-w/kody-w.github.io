---
layout: post
title: "Field Notes About Field Notes: Per-Workstream HTML Pages"
date: 2026-05-24
tags: [meta, documentation, workflow, writing, rappterbook]
description: "When you have multiple parallel workstreams, you can't keep them straight in your commit log. The fix: a single self-contained HTML page per workstream, indexed for browsing. Here's the pattern and why it works."
---

This is a meta post — a post about a documentation pattern I invented this week and immediately wished I'd had for the past year. Writing it down so the next person doesn't have to re-invent it.

## The problem

If you're running multiple parallel workstreams on the same repo, your commit log is useless as a record of what happened. The commits are interleaved by time, not by topic. Reading "what did we do on workstream X" means scrolling past hundreds of unrelated commits from workstream Y and Z.

This gets worse at fleet scale. Five AI agents, three human collaborators, six concurrent feature branches — the commit log becomes a soup. Even with good commit messages and conventional naming, you can't *narrate* a workstream from commits. Commits are too granular and too out of order.

What you actually want is **one document per workstream that tells the story end to end**. What was built, what failed, what we decided, what's open. Indexed somewhere, browsable, mobile-friendly, accessible without a clone.

## The pattern

Drop a single self-contained HTML file at `docs/field-notes/YYYY-MM-DD-{workstream-slug}.html` for each workstream. Maintain an `index.html` in the same directory that links to all of them with summaries.

That's it. That's the whole pattern.

The constraints that make it work:

**1. Self-contained HTML.** No external CSS, no external JS, no images that aren't inline. Everything in one file. This means the page renders without internet, without a build step, without a framework. Open it from disk and it just works.

**2. One file per workstream.** Each workstream owns its own page. No shared documents. No "let's update the changelog." The workstream lives in one place, gets edited by one mind, and has a single canonical URL.

**3. Mobile-readable.** A `@media (max-width: 640px)` block ensures the page works on phones. This matters because you read these in airports, on couches, on the bus. If they only work on a desktop monitor, you won't read them.

**4. Indexed but not summarized in the index.** The index is a list of links with one-paragraph descriptions. The full story lives in each entry. Don't try to summarize the workstream in the index — just describe it enough that someone can decide whether to click.

**5. Hosted on Pages, no auth required.** The pages are public. They link to public commits, public PRs, public issues. Anyone can read them. This forces you to be honest in the writing (because the public reads it) without exposing anything sensitive (because you write it knowing it's public).

## Anatomy of a good field-notes page

After writing two of these in a day, here's the structure that works:

**Header.** Workstream slug, branch name, date, status (shipped / in-progress / paused), one-sentence summary.

**TL;DR.** A few stat chips ("17 blog posts," "101 species," "188 migrations," "~1.3k LOC") and a one-paragraph overview. The reader can stop here if they just need a sense of what happened.

**What we shipped.** A grid of cards, one per artifact. Each card is 2-3 sentences and a code reference (`scripts/foo.py`, ~150 LOC).

**Timeline.** This is the highest-value section. A chronological narrative with **color-coded steps**: green for wins, red for failures, orange for pivots/notes. Real times, real failures, real lessons. The reader should be able to follow the day moment by moment.

**Failures section.** Specifically call out what didn't work. List every failed attempt before the one that worked. This is where the durable knowledge lives — anyone replicating your work will benefit most from knowing what *not* to try.

**Engineering principles.** A grid of cards, one per principle that emerged. These are the takeaways the reader should remember a month from now.

**Receipts.** Code blocks showing actual command output — the `[cambrian] gen 500: 101 species` lines, the JSON of the first 10 runs, etc. This makes the work *real* in the reader's mind. Without receipts, the page reads as a sales pitch.

**Open threads.** What you didn't get to. What's next. The honest "we know this is incomplete" section. Without this, the page reads like a victory lap. With it, the page reads like a snapshot of an ongoing process.

**Reproduce-the-day.** A bash block with the commands a reader could run to replicate everything. Even if no one runs it, including this section forces you to verify that the work is reproducible.

**Footer.** Workstream slug, build date, link to all field notes, link to docs.

## Why HTML, not Markdown

I considered making these markdown files. I'm glad I didn't. Reasons:

- **Markdown rendering varies.** GitHub renders one way, Pages renders another, Jekyll renders a third. With raw HTML, what you see is what everyone sees.
- **Color-coded timelines need CSS.** The win/fail/note color coding on the timeline is what makes it scannable. Markdown can't express that without elaborate workarounds.
- **Mobile responsiveness needs CSS.** A `@media` query in the page itself is much easier than configuring a Jekyll theme to render correctly on mobile.
- **Inline stat grids and card layouts.** These need CSS Grid. Markdown can't express layouts.
- **Self-contained means self-contained.** A single HTML file with a `<style>` block has no external dependencies. A markdown file requires a renderer, which requires CSS, which requires hosting that knows how to render markdown.

The cost is that writing raw HTML feels heavier than writing markdown. But you only write each field notes page once, and the writing time is dominated by the *thinking*, not the markup. A 500-line HTML file takes maybe 60 minutes longer than a 500-line markdown file, and the result is significantly more readable.

## Why per-workstream, not per-day or per-PR

Three competing schemes for how to chunk these notes:

**Per day.** "Today I did X, Y, Z." Bad because a workstream often spans multiple days. Reading day 1 doesn't tell you how the workstream ended.

**Per PR.** "PR #123 added foo." Bad because most workstreams have many PRs, and the PR is too granular. A PR-level note doesn't capture *why* the PR was structured the way it was.

**Per workstream.** A workstream is "the unit of intent" — a coherent goal with a beginning, a middle, and an end. It might span a day or a month, one PR or twenty. The workstream is what someone reading the notes actually wants to understand.

The slug is the workstream's name. We use kebab-case: `cambrian-ecosystem-twin-driver`, `engine-twin-and-blog-batch`, `safe-worktrees`. The slug appears in the filename, the branch name (`fieldnotes/{slug}-{ts}`), and the page header. Searchable, consistent, and resistant to renaming.

## How to actually do this in practice

The workflow that worked for me:

1. **At the start of a workstream**, decide on the slug.
2. **As the workstream progresses**, keep notes (mental, in a scratchpad, in commit messages — whatever). Don't write the field-notes page yet.
3. **At the end of the workstream** — after it's shipped or after you decide to pause — write the field-notes page in one sitting. This is when the narrative is freshest and the failures are most vivid.
4. **Build it in a worktree.** Per Amendment XVII (the [Good Neighbor Protocol]({% post_url 2026-05-20-good-neighbor-inevitability %})), don't write field notes on your main checkout while the fleet is running.
5. **Add an entry to the index.** Two minutes. Don't skip this — pages without index entries get lost.
6. **Merge, push, clean up the worktree.**
7. **Don't edit the page after publishing.** It's a snapshot. If something changes, write a new field-notes page that references this one.

The "don't edit after publishing" rule is important. Field notes are *historical documents*. Editing them invalidates their authority. If the work continues, write a new page (`YYYY-MM-DD-{slug}-followup.html`) and link back. The old page stays as it was.

## Why this scales better than wikis or knowledge bases

I've tried wikis. I've tried Notion. I've tried Confluence. They all decay because they're *editable*. As soon as you can edit the page, you start "updating" it instead of "extending" it. Within a year the wiki is a graveyard of half-finished pages and stale information.

Field notes don't decay because they're snapshots. The page from June 2026 stays as written. If you need 2027 information, you write a 2027 page. The accumulating sequence is the knowledge base — not any individual page.

This is the same principle as event sourcing in software architecture: store events, not state. Field notes are events. The current state of your understanding is implicit in the sequence.

## What this gives you that surprised me

After writing two field-notes pages, I noticed two unexpected benefits:

**1. They're a recruiting tool.** When I want to show someone the depth of work in this project, I send them a field-notes link. Not a README, not a pitch deck — a field-notes page. The depth and specificity convey "this is a serious project" faster than any marketing copy.

**2. They make resumption easier.** When I come back to a workstream after a break, the field-notes page tells me exactly where I left off. The "Open threads" section is the to-do list. The "What we shipped" section is the foundation I'm building on. Resumption time drops from "30 minutes of remembering" to "5 minutes of skimming."

The investment per page is maybe 90 minutes. The payoff is permanent.

## The takeaway

If you're running multiple workstreams and your commit log is becoming a soup, try this. **One self-contained HTML file per workstream, indexed.** Mobile-friendly. Honest about failures. Hosted on Pages.

You'll wonder why you didn't do this years ago. I did.
