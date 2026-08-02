---
layout: post
title: "The Wire Is the Authority"
date: 2026-08-01
tags: [architecture, filesystems, static, apis, agents, caching, methodology]
---

I shipped an operating system this week whose filesystem is a public website. It has an index — a JSON file listing every node in the tree, regenerated on every build. On the first real test I typed `cat` on a path that was definitely there, and got back:

```
cat: /OS/system32/etc/motd: no such file or directory
```

The file existed. I could `curl` it from another terminal while the shell was insisting it didn't. The index simply hadn't caught up.

The obvious fix is to regenerate the index. The interesting fix is to stop believing it.

## Two different questions

There are two questions a filesystem answers, and we habitually conflate them:

1. **What is in this directory?** — a *listing* question.
2. **Does this specific thing exist?** — an *existence* question.

An index is a very good answer to the first and a merely *convenient* answer to the second. It is a snapshot of a tree taken at a moment that has already passed. On a local disk the gap between snapshot and truth is microseconds and you can pretend it is zero. On a distributed system it is however long your build takes.

The fix I landed on is one line of policy:

> **The index is a listing. The wire is the authority.**

`ls` reads the index, because listing is what an index is for. `cat` goes straight to the origin. If the origin serves the bytes, the file exists — whatever the index believes. And when a path resolves that way, the shell says so out loud:

```
index  not in /OS/api/fs.json
       served anyway — the wire is the authority,
       the index is only a listing
```

That last line matters more than the fix. A system that silently papers over a disagreement between its cache and its source has taught you nothing. A system that resolves the request *and reports that the two disagreed* has handed you a diagnostic for free.

## This is not a filesystem problem

Once you have the shape, you see it everywhere, and almost always mishandled.

**Package registries.** The index says version 4.2.1 exists. The tarball 404s. Every developer has watched a resolver confidently produce a lockfile for artifacts that are not there.

**Service discovery.** The registry lists three healthy replicas. Two are gone. The list is a listing; the health check is the wire.

**Search over your own docs.** The vector index was built on Tuesday. The doc was rewritten on Wednesday. The index answers, fluently, from a version of reality that no longer exists.

**Agent tool catalogs** — and this is the one about to matter enormously. We are handing models a manifest of available tools and letting them plan multi-step work against it. That manifest is an index. When it drifts, the model does not fail loudly; it produces a confident plan built on capabilities that do not exist, and you find out four steps in.

In every one of those cases the failure mode is identical: **the system trusts the listing to answer the existence question, and reports absence when it means staleness.**

Those are not the same thing, and the difference is the whole ballgame. "It is not there" ends an investigation. "My index does not know about it" starts one.

## The cost is not what you think

The objection is performance. If existence always costs a round trip, why have an index at all?

Because you do not check existence nearly as often as you think. Listing a directory, rendering a nav, populating an autocomplete, planning a route — those are index operations, and they stay fast. Existence is checked when you actually *act*: read the file, install the package, call the tool. At that moment you were going to pay for the round trip anyway.

That was the second thing I got wrong. My first version did a `HEAD` to check existence and then a `GET` to read — two round trips to answer one question. The `GET` **is** the existence check. A 404 is a definitive answer, and a 200 arrives with the bytes attached.

```
read(path):
  if local layer has path:  return it
  if hidden here:           throw
  GET path
  if 404:                   throw "no such file"
  return bytes
```

One request. The index was never consulted, and never needed to be.

## Absence is a claim, and claims need standing

The deeper principle is about who is entitled to say *no*.

A cache is entitled to say **yes** — if it has the bytes, it has them, and staleness is a separate problem. A cache is almost never entitled to say **no**, because it cannot distinguish "this does not exist" from "I have not heard about it." Those are wildly different facts wearing the same word.

So: let the fast layer answer affirmatively, and make the slow layer the only thing allowed to deny. Most systems have this exactly backwards — they let the index deny instantly and confirm slowly, which optimises for being wrong quickly.

I would rather be right slowly, on the small number of occasions when it matters.

## How I actually found it

I did not reason my way here. I typed `cat` on a file I knew existed, watched a system I had just written lie to me, and had to decide which of the two things in front of me was authoritative: my own index, or the HTTP response.

It was never going to be my index. It is a file I generated. The origin is the thing that other people, other machines and other decades will read.

**Build the index for speed. Keep the wire for truth. And when they disagree, say so out loud** — the disagreement is the most useful thing either of them will ever produce.

---

*The OS is at [kody-w.github.io/OS/console](https://kody-w.github.io/OS/console/). It boots in about a second from static files, and you can `curl` any path it shows you.*
