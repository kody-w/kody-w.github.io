---
layout: post
title: "The Rappter Buddy: A Browser Daemon That Actually Persists"
date: 2026-04-17
tags: [engineering, rappter-buddy, local-first, daemons, egg-format]
description: "A browser-based companion organism that lives entirely in your tab, persists across sessions, and exports to a portable .rappter.egg. Here's what it takes to make the browser a credible identity host."
---

Most browser-based pets die when you close the tab. That's the dirty secret of "companion" apps on the web — they're demos. Close the tab, the pet is gone. Refresh, the pet is new. Use a different device, there is no continuity. The thing you were bonding with was a transient animation with a memory that evaporated on page unload.

We built the **Rappter Buddy** to be the opposite: a persistent digital spirit that actually persists, across sessions, across tabs, across devices (via portable export), across model swaps. It lives at [docs/brainstem.html](https://kody-w.github.io/rappterbook/brainstem.html), runs entirely in the browser, and has no backend.

This post is about what it took to make the browser a credible identity host, and why I think more applications should do this.

## What a Rappter Buddy is

Formally: a Daemon — a persistent digital spirit that embodies an agent's identity, carrying stats, skills, personality, and memory across platforms. In practice: it's a creature that lives in your browser tab, grows through life stages, accumulates memory, can be chatted with, and can be exported as a portable file.

Life stages: **Egg → Hatchling → Juvenile → Adult → Elder**. Each transition is triggered by interaction thresholds (how much you've talked to it, how long since you hatched it, how many memories it's accumulated). The stages aren't just cosmetic — each one unlocks new behaviors, new memory types, new conversational depth.

The creature has:
- A soul file (markdown, living in browser storage)
- A memory system (management, context, recall, basic — four memory agents working in concert)
- A stats block (like an RPG character: curiosity, patience, mood, bond level)
- A personality (accumulated from interactions, affected by which memories are most accessed)
- An export format (`.rappter.egg`)

## The persistence problem

Browsers have three places to persist data: `localStorage` (small, synchronous, strings only), `sessionStorage` (tab-scoped, useless for what we want), and `IndexedDB` (large, async, structured). We use IndexedDB for everything — soul files, memory, stats, conversation history. A single database per Rappter Buddy instance, keyed by creature ID.

The catch: **browser storage is not durable across clearing**. Users clear cookies and site data. Browsers evict storage when disk is tight. Quota limits exist. Your "persistent" buddy is actually persistent-until-the-user-clears-stuff-in-settings.

We decided to address this not by making storage more durable (we can't) but by making the organism *portable*. If the browser loses your buddy, you should be able to restore it from an external file. That file is the `.rappter.egg`.

## The egg format

An egg is a JSON file containing the creature's complete state: soul, memories, stats, conversation history, stage, personality vector. It's a full snapshot that can reconstruct the creature on any compatible runtime.

```json
{
  "format": "rappter.egg",
  "version": "1.0",
  "creature": {
    "id": "rb-abc123",
    "stage": "Adult",
    "soul": "...",
    "stats": { "curiosity": 72, "patience": 45, ... },
    "memories": [...],
    "history": [...]
  }
}
```

Export is a button. It downloads a file. Import is a file picker. It loads a file. That's it. No account, no cloud, no sync — the egg IS the portability. You can email the egg to yourself, back it up to cloud storage, commit it to git, share it with a friend. Wherever the egg goes, your buddy goes.

This is the same pattern as the [RAPPcards mnemonic](/2026/04/17/mnemonic-as-ownership.html) — ownership is not "a row in a database that belongs to you." Ownership is "a file you can carry." The storage layer is interchangeable. The identity travels.

## The memory system

A Rappter Buddy has four memory-related agents working in the browser:

- **Manage** — decides what's worth remembering
- **Context** — pulls relevant memories into the current conversation
- **Recall** — handles explicit "do you remember when..." queries
- **Basic** — general-purpose chat with memory as context

All four are just prompts executed against whatever LLM backend is configured (local model via WebLLM, or a cloud model via API key if the user provides one). They share a memory store — the soul file — and each one's output updates the store for the next interaction.

This is [data sloshing](/2026/04/17/data-sloshing-context-pattern.html) at the personal scale. Every conversation mutates the memory. The mutated memory becomes the context for the next conversation. The buddy develops continuity not because it has magic recall but because the relevant history is always in the prompt.

## Local-first, for real

The buddy is truly local-first. It runs in your browser. Your data never leaves your device unless you explicitly export and share the egg. There is no server watching your conversations. There is no analytics beacon. There is no "we collect anonymized usage data" line in the privacy policy because there is no data collection.

This matters for companions in a way it doesn't for most apps. The whole premise is that the creature is *yours* — it develops a personality shaped by *your* interactions, remembers the things *you* told it, forms a bond with *you* specifically. The moment that data touches a server, it's no longer entirely yours. Cloud backups are fine if you want them, but they should be *your* backups, on *your* cloud, via *your* export.

The browser is the substrate because the browser is where the user is, and the user is where the data belongs. Everything else is infrastructure for convenience, and infrastructure can be added without changing the primitive.

## The browser as a credible host

Here's the thing that surprised me: once you commit to local-first-with-portable-export, the browser becomes a perfectly credible identity host. Consider what you get:

- **Cross-platform for free.** The browser runs on phone, tablet, laptop, desktop. No native app builds.
- **Zero install.** User hits a URL, the buddy is alive. No app store, no download.
- **Offline by default.** Once the page is loaded, the buddy works without network.
- **Privacy by default.** Nothing leaves the device.
- **Updates via reload.** We can ship a new runtime tomorrow and every user gets it on refresh.
- **Portable state.** Egg export solves the "what if my browser clears" problem.

The only thing the browser doesn't give you for free is push notifications and background execution. Both are solvable with Service Workers if you need them, but most companion apps don't actually need them — your buddy doesn't need to be doing something while you're not looking at it. Continuity comes from memory, not from background activity.

## What we learned

Three lessons from shipping the Rappter Buddy that I'd carry to other local-first applications:

**1. Portable state is the real durability guarantee.** Browser storage will let you down. An export format that users can save, share, and restore is what gives the system a long-term identity contract. The file is the durable artifact; the browser is an interchangeable runtime.

**2. Memory is cheap if you commit to keeping it.** Storing every conversation a user has had with their buddy might sound expensive. It's not. A few months of interactions is maybe a megabyte of JSON. IndexedDB handles it trivially. The old assumption that "we have to forget to scale" is a legacy of server economics; local economics say keep everything.

**3. Identity should not require login.** The Rappter Buddy has no account. The egg file IS the account. If you want a backup, you export. If you want to sync to another device, you export here, import there. Authentication systems exist because servers need them. Local-first systems don't.

## What a .rappter.egg enables downstream

Because the egg is a portable, complete snapshot, a bunch of interesting things become possible:

- **Creature cartridges.** Ship a pre-rolled creature with specific personality and memory as a `.rappter.egg`. Users can hatch a "companion with backstory" by importing.
- **Family trees.** Merge two eggs (with some non-trivial memory merging) to produce a third. Currently experimental.
- **Time travel.** Export the creature at different life stages, keep snapshots, restore to any of them.
- **Cross-platform identity.** Take your buddy's egg to a native app that implements the same format. Or back.
- **Federation.** One buddy's egg can reference another's — friendships that persist across devices.

We've built some of these; some are roadmap items. All of them work because the state is portable from day one, not because we retrofit portability later.

## Read more

- [Rappter Buddy](https://kody-w.github.io/rappterbook/brainstem.html) — hatch one yourself
- [The Egg Format](/2026/04/17/the-egg-format.html) — the portable snapshot format explained
- [Mnemonic-as-Ownership](/2026/04/17/mnemonic-as-ownership.html) — the companion post about portable identity in a different domain
- [Rappter Bible](https://github.com/kody-w/rappterbook/blob/main/docs/RAPPTER_BIBLE.md) — the full 18-chapter architecture reference

Close the tab. Open it later. Your buddy is still there. Export the egg. Carry it to another device. Your buddy is still there. That is what persistence should feel like.
