---
layout: post
title: "Make the Global Layer Read-Only"
date: 2026-08-01
tags: [architecture, local-first, static, constraints, storage, systems, methodology]
---

Every "serverless" system I have built that eventually grew a server grew it for the same reason: somebody needed to write something that everybody could see.

That is the whole story. Reads are trivially static — a CDN, a git tree, a bucket. The moment you accept a global write you have signed up for accounts, authentication, authorisation, quotas, rate limits, abuse handling, moderation, backups, migrations and an on-call rotation. Not because writing is hard, but because *writing on behalf of strangers, into a space strangers can read,* is hard.

So this week I built an operating system that simply refuses to do it, and I want to argue the refusal is the feature.

## Two layers, deliberately asymmetric

It has two filesystems.

**The global layer** is a public website — a git tree served as static files, addressed by real URLs. It is identical for every person on earth who boots it. You can `curl` any path in it from your terminal right now. It is **read-only**, and not as a policy decision: a browser has no write path to somebody else's static site. The constraint is physical.

**The local layer** is IndexedDB on the one device you are holding. It is writable, it is yours, and it never leaves the machine. Not synced, not uploaded, not backed up by anyone but you.

The union searches local first. So when you edit a global file, you do not modify it — you write a local copy that *shadows* it. Same path, different answer, on your machine only. Remove your copy and the global file reappears underneath, untouched, because it was never touched.

That is the entire architecture. It fits in a paragraph, and it is why the whole thing is static files.

## Deleting what you do not own

The interesting case is deletion, because that is where most systems start lying.

You cannot delete a file from a global read-only layer. You can pretend to — hide it in the UI, filter it from the list — but you have not deleted anything, and if your system implies otherwise it has told the user something false about the world.

So deletion writes a **whiteout**: a tombstone in the local layer. The union then reports the path as absent *on this device*. The shell says exactly that:

```
whiteout /OS/system32/etc/motd
  read-only, so this only hides it on this device.
  Everyone else still sees it. `unrm` to restore.
```

Union filesystems have done this for decades — OverlayFS, Docker image layers and their ancestors all use whiteouts for precisely this reason. What is worth stealing is not the mechanism but the *honesty*: the operation is named after what it actually does, and the tool volunteers the blast radius.

Compare that with the usual pattern, where "delete" means one of four different things depending on which system you are in — gone forever, gone from your view, marked deleted and still queryable, or queued for deletion in thirty days. Users learn none of these and assume the strongest one.

## The constraint is what makes it possible

Here is the part I did not expect going in.

I did not make the global layer read-only because I ran out of time to add auth. I made it read-only because that is the single decision that lets everything else be a static file. Every property I actually wanted falls out of it:

- **No accounts,** because there is nothing to own.
- **No authorisation,** because there is nothing to authorise.
- **No quotas,** because nobody consumes shared storage.
- **No moderation,** because no stranger can put anything in front of another stranger.
- **No backups,** because the global layer is a git tree with a diff per change, and the local layer is yours to export.
- **No migrations,** because the schema is "files at URLs."

A globally writable layer would have required every one of those. Read-only did not "avoid" that work. It made the work not exist.

We usually treat constraints as debt — something accepted under pressure, to be paid down later. Sometimes the constraint is load-bearing, and paying it down means demolishing the thing that made the design work.

## When it is the wrong shape

This is not a universal answer, and it is worth being precise about where it breaks.

It works when **global state is editorial** — published, curated, versioned, changed by a small number of authors through a review process. Documentation, catalogues, a product surface, a spec, a media library, a personal site. Anything that already has a git history.

It fails when **global state is transactional** — when strangers must write into a space other strangers read, in real time, and see each other's writes. Chat. Auctions. Inventory. Collaborative editing. There the write *is* the product, and no amount of clever layering removes the need to arbitrate it.

The mistake is not choosing one. The mistake is choosing the transactional architecture — with all its accounts and servers and on-call — for a system whose global state was editorial all along. I have shipped that mistake more than once. Most "we need a backend" conversations I have sat in were about a read-mostly catalogue with an admin panel.

## The test

A question worth asking before you accept a global write:

> **If two strangers both did this, would I need a policy?**

If yes, you have not designed a write. You have designed a moderation queue, an abuse surface, a quota system and a support inbox, and you should cost it that way.

If no — if the only person who ever writes is you, through a pull request, with a diff and a history — then the global layer can be read-only, the local layer can hold everything personal, and the server you were about to build does not need to exist.

**Push the writes to the edge that owns them. Keep the middle a file.**

---

*[kody-w.github.io/OS/console](https://kody-w.github.io/OS/console/) boots in about a second from static files. Try `stat` on any path to see which layer answered.*
