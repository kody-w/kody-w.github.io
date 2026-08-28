---
layout: post
title: "Scrape Yourself"
date: 2026-08-19
tags: [data-exhaust, git-scraping, datasette, sqlite, github-actions, time-series, ai]
---

In 2020 Simon Willison gave a name to something he had been doing since a hurricane in 2017: point a GitHub Actions cron at a URL, fetch it, commit the file if it changed, and let git keep the history. He called it [git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/). His line for why it works is the one worth remembering: the changes in a data source "can sometimes be more interesting than the underlying static data," and git is already the best tool we have for tracking changes to text over time.

His example was California's wildfire feed. The state publishes a point-in-time page — this fire, this containment, this many crews. His repository, committing every twenty minutes, ended up holding a history the agency never kept: containment ticking up, personnel drawing down, commit by commit. Then in 2021 he shipped [git-history](https://simonwillison.net/2021/Dec/7/git-history/), which reads that commit log back out into SQLite — one row per item, one row per version, and a matrix recording exactly which columns changed on which commit — so you can open it in [Datasette](https://datasette.io/) and chart a fire's growth. His summary of the whole idea: by scraping into git "you can often end up with a more detailed history than they maintain themselves."

That is a data warehouse. It costs nothing, it runs on a schedule, and it lives in a repo. I have been circling it from the other side for a year without ever saying his name, and after [yesterday's post on the negative](/2026/08/19/data-exhaust-is-the-fourth-dimension/) I finally see how the two halves fit — and what you get when you push them together.

## What he built, and what he pointed it at

Be precise about the shape. Git scraping keeps **records** — snapshots of somebody else's official page, taken on a cadence you chose and containing fields you chose. The scraper is aimed *outward*, at a source that publishes only the present. Git supplies the past for free.

git-history is the part that turns records into something else. Its version table stores only the columns that moved; unchanged columns are null, and a separate table says which ones actually changed so that "unchanged" and "set to nothing" are not the same row. Read that carefully: it is a table of *what moved, when*. Not the fire — the fire's changes. Willison built it to chart acreage. It is a general instrument for the exact question the negative asks: what had to be true for the record to move like this?

So the first thing to notice is that his tooling and my argument were always about the same object. He built the developer. I have been describing the film.

## Turn it around

Willison scrapes the state of California. The obvious move, and the one I don't think anybody has written down, is: **scrape yourself.**

Every system you run already emits a present-tense record somewhere. A metrics file. A verdict file the watchdog rewrites every quarter hour. A registry, a leaderboard, a "last run" JSON. Each of these is a point-in-time page exactly like the wildfire feed — it tells you now and forgets then. Point a scraper at it and commit on change, and you have a warehouse of your own system's history that the system itself never kept. Run git-history over that and you have, for free, the table of which of your own fields moved on which day.

I went and looked at my own estate with this in mind and it is already half built without meaning to be. Some of my repos have crons that write a metrics file, or a catalog, or a digest of the last day into a folder and commit it. My watchdogs write a hash-chained frame every tick and a verdict every run. None of that was designed as a warehouse. All of it is git-scraping-shaped. The only step missing is the one Willison already wrote: read the log back into SQLite and ask it questions.

> **Git scraping points the warehouse at someone else's record. Pointed at your own, the same three tools become the developer for your negative.**

## The layer he throws away

Here is the part that is genuinely new, and it comes straight out of taking the negative seriously.

A git-scraping repo has two clocks. The source's own timestamp, inside the file — the record's claim about when it was true. And the commit time — when your scraper actually saw it. Willison uses the first and mostly ignores the second; the empty runs are skipped with `|| exit 0` and disappear. But the second clock, and the *silences* in it, are the honest exhaust of the whole arrangement. Nobody chose them. The gap between the source's timestamp and the commit time tells you how stale the source runs. A commit that didn't happen for a day tells you either the source froze or your scraper did — and telling those apart is the entire discipline of watching anything. The pattern of when a page changes — always at nine, never on Sundays, in a burst before a deadline — is a portrait of the people behind the page that no field on the page contains.

The scraped record is posed: someone published it on purpose. The scraper's own trail is not. If you want the negative of a source rather than a mirror of it, mine the commit graph, not just the payload. Willison's tool already gives you the `commits` table. Almost nobody queries it.

## Hand the reader the version table

The last piece is the reader. In the previous post I said a large model is, before anything else, something that can hold a very large negative and say what shape made it — but only if you hand it the film at the right grain, with the dates on.

git-history's version table *is* that grain. It is not the raw snapshots, which are too much, and it is not a dashboard, which is too little. It is one row per change, per item, per commit, with the changed columns marked. Hand a model the versions and the commit times for one item and ask what was going on — not what the values are — and it will do the inversion the tables were built to make possible: this fire was contained by attrition, this account cooled for a month before it was marked lost, this watcher published on time and stopped working. Willison has been building scrapers with Claude lately; as far as I can find he hasn't published the other direction, a model reading git-history's output. That is the seam. It is small and it is wide open.

## The whole loop, in a repo

Put it together and it requires embarrassingly little:

- A cron that fetches your own present-tense files — and, if you like, other people's — and commits on change. Willison's [template repo](https://simonwillison.net/2025/Feb/26/git-scraper-template/) is the fastest way to start; paste a URL in the description and it does the rest.
- git-history over the log, into SQLite. Reshape the data to remove noise fields that change every time without meaning anything; he warns about those and he is right.
- The database baked into the site — his ["baked data"](https://simonwillison.net/2021/Jul/28/baked-data/) pattern, or [Datasette Lite](https://simonwillison.net/2022/May/4/datasette-lite/) pointed at the file so there is no server at all.
- A reader — a person, or a model — handed the version table and the commit table, and asked what had to be true.

Nothing in that list is mine and nothing in it is new. What is new is the aim. He built a free warehouse for the world's records. Aim it at your own exhaust, keep the clock he discards, and hand the versions to something that can read them, and the free warehouse becomes the darkroom.

## Where this is the wrong shape

A scraper is a choice — cadence, fields, source — so what it collects is only ever a portrait of the source at your resolution. Don't mistake a twenty-minute cadence for the truth of a thing that moves by the second, or the reverse. And a warehouse of your own exhaust develops a sharper picture of you than you have ever written down; the same care applies as before — keep it where it fell, keep it locked, and think before you develop anyone who did not ask.

*Simon Willison's writing on all of this is at [simonwillison.net/tags/git-scraping](https://simonwillison.net/tags/git-scraping/); go read him first. The watchdogs mentioned here are on the [RAPP Sentinel Hub](https://kody-w.github.io/rapp-sentinel-hub/). Previous in this pair: [The Negative](/2026/08/19/data-exhaust-is-the-fourth-dimension/).*
