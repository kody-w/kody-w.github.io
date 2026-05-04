---
layout: post
title: "Time Capsule Twin: Scrubbing a Repo Through Its Own History"
date: 2026-04-18
tags: [tools, static-sites, git, rappterbook, time-travel]
---

I shipped a small tool at [`/rappterbook/time-capsule/`](https://kody-w.github.io/rappterbook/time-capsule/) that lets you scrub through the lifetime of a repository with a slider. You pick a date, the page re-renders as it looked on that date: post counts, agent counts, changed files, a README excerpt. No checkout. No local clone. No server.

It took about three hours to build. It would have taken about thirty minutes to decide not to build.

## What it does

The repo has 922 commits across a few months. A Python script samples 181 of them — enough to give the slider meaningful granularity without drowning the page in data — and for each sampled commit extracts:

- The commit hash, author, date, and subject
- A few headline counters (total posts, total agents, total channels) read from `state/` files at that commit
- The list of files changed vs. the previous sample
- The first 40 lines of the README at that commit

All of this lands in a single `timeline.json` (~900KB) that the static page loads once. The slider is just an index into that array.

The genius move is `git show SHA:path`. You don't need to check anything out. You can ask git for the literal contents of a file at any commit, and git hands you the bytes. The script is thirty lines of `subprocess.run(["git", "show", f"{sha}:{path}"])` in a loop. That's the whole engine.

## Why it's more fun than `git log`

`git log` is a text ledger. You can read it top to bottom and construct a mental model of the project. But it's asymmetric: the recent past is legible and the distant past is a wall of hashes.

A slider inverts that. The past becomes a continuous space you can drag through. You can feel the shape of the project. There are stretches where nothing changes for weeks. There are single days where fifteen files turn over. There's a moment where the state file count doubles. Scrubbing across that moment physically feels like the project shifted.

The slider also gives you something `git log` can't: the ability to compare two points instantly. Drag to March 15. Read the README. Drag to April 15. Read the README. The delta is obvious because the page updated in place.

## The tool as twin

I keep calling these "twins". The pattern is: pick a real thing (a repo, an artifact, a person's thinking), encode its state into JSON, ship the JSON alongside a static page that renders it interactively. No framework. No build step. No database.

The Time Capsule is a twin of the repository's history. The [Reverse Seeder](/reverse-seeder/) is a twin of the seed corpus's grammar. The [anatomy plate](/anatomy/) is a twin of the running simulation's organ structure. Each one is self-contained. Each one has a URL you can link anyone to.

I think static-site twins are the default deliverable for any sufficiently weird personal project. They're cheaper than apps, more durable than tweets, and they let the viewer control the lens instead of being led through a narrative.

## What I learned

The slider revealed two things I didn't know about my own project:

1. **The most productive week wasn't the first week.** I would have guessed the bootstrap week was the biggest week by file churn. It wasn't. There was a week in mid-March that produced twice the diff.

2. **The README telegraphed the direction six weeks before the code caught up.** You can drag the slider to a date, read the README, and find claims about what the platform "is" that weren't true yet. The ambition shipped first. The code followed.

Neither of these shows up in `git log`. Both of them are obvious from thirty seconds of slider-scrubbing.

## Build it yourself

The whole thing is [two files](https://github.com/kody-w/rappterbook/tree/main/docs/time-capsule): a Python script (stdlib only, no deps) that samples commits and writes `timeline.json`, and an HTML page that loads it. You can adapt it to any repo in about twenty minutes. Replace the counters with whatever state you want to track. Replace the README excerpt with whatever artifact matters.

The point is the pattern. A twin is one JSON file and one HTML page. Git history is a database. Your browser is the only runtime you need.
