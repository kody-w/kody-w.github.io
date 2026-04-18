---
layout: post
title: "The Vault Is the Binder: Using Obsidian for Federated Cards"
date: 2026-04-18
tags: [rappcards, obsidian, federation, second-brain]
---

Karpathy uses Obsidian as his second brain. Plain markdown files in a folder, backlinks, graph view, full-text search. No proprietary format. No cloud lock-in. Just notes you own, organized however you think.

I want my [RAPPcards](https://github.com/kody-w/RAPPcards) binder to work the same way.

## The premise

A RAPPcards binder is a view over a federation. The federation doesn't care what the view is. The [SPEC](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) says cards live as JSON, are addressed by a 64-bit seed, and are resolvable via a 7-word mnemonic. It says nothing about how *you* author them, browse them, or take notes on them.

So we don't have to author them as JSON. We can author them as **markdown notes with YAML frontmatter**, sitting in an Obsidian vault, and let a tiny build script generate the JSON sidecars at commit time.

The federation sees a normal binder. You see a normal vault.

## What that looks like

```
obsidian-binder/
├── peers.json                 ← federation bootstrap (hand-edited)
├── seed-index.json            ← GENERATED
├── cards/                     ← GENERATED
│   └── {seed}.json            ← one per card, federation-shaped
├── vault/                     ← what you open in Obsidian
│   ├── .obsidian/             ← workspace, themes, plugins
│   ├── cards/                 ← one MARKDOWN note per card
│   │   ├── Anvil Tester.md
│   │   ├── Production Line Optimization Agent.md
│   │   └── Supply Chain Forecaster.md
│   ├── essays/                ← your thinking about your cards
│   │   └── why-i-keep-my-binder-in-obsidian.md
│   ├── binder.html            ← summon UI you open in browser
│   └── README.md              ← your vault's home note
├── scripts/
│   └── build.py               ← stdlib-only generator
└── .github/workflows/
    └── build.yml              ← regen federation files on push
```

## A card, in your vault

```markdown
---
seed: "11447213470199194507"
incantation: "BRAND CUTLASS BREACH ANVIL COIL MUSK BESTOW"
name: "Production Line Optimization Agent"
agent_id: "rar-prod-opt-001"
source: "rar"
created: 2026-04-18
tags: [card, agent, productivity]
---

# Production Line Optimization Agent

Specialist agent for analyzing and optimizing manufacturing
production lines. Pairs especially well with [[Supply Chain
Forecaster]] for end-to-end optimization.

## Why I summoned it

I was reading about lean manufacturing and wanted an agent that
could actually run the numbers on hypothetical line configurations.

## How I've used it

- Sketched out a 4-station vs 6-station tradeoff
- Used as a reasoning partner for an [[essays/why-i-keep-my-binder-in-obsidian|essay]]

## Connections

- [[Supply Chain Forecaster]] — natural pair
- [[Anvil Tester]] — adversarial questioning
```

The frontmatter satisfies the federation. The body is yours.

## What you get

The first thing that happens when you open this vault in Obsidian: the **graph view** lights up. Each card is a node. Each `[[wiki-link]]` between cards is an edge. The clusters that form show you which cards you actually use together, which ones are isolated, which ones connect to your essays.

You get **full-text search** across both the structured frontmatter and your unstructured notes. You can search for "manufacturing" and find every card and every essay where you mentioned manufacturing.

You get **your own taxonomy** via tags. The federation doesn't care if you tag a card `#wishlist` or `#archived` or `#that-time-i-was-wrong`. Your vault, your tags.

You get **backlinks**. Cards reference essays. Essays reference cards. Cards reference cards. Obsidian shows you the inverse — every note that links *to* this card, automatically. Your collection becomes a hyperlinked second brain.

You get **daily notes** if you want them. Logged when you summoned what and why. The federation doesn't know about this layer; it doesn't need to.

## How the build works

`scripts/build.py` is 130 lines of Python stdlib. It:

1. Walks `vault/cards/*.md`
2. Parses the YAML frontmatter from each
3. For each card, writes `cards/{seed}.json` at repo root with the federation-shaped payload
4. Writes `seed-index.json` at repo root with the full seed → path map

A GitHub Action runs it on every push to main. The federation files are always in sync with the vault.

Other binders fetch your `seed-index.json` like any other peer's. They have no idea your binder is a vault. They just see a binder.

## Summoning into the vault

Open `vault/binder.html` in your browser. Paste a 7-word incantation. The walker:

1. Fetches `peers.json` (knows your federation neighbors)
2. For each peer, fetches their `seed-index.json`
3. Looks for the seed matching your incantation
4. Fetches the card JSON
5. Renders a vault-ready markdown note with frontmatter pre-populated

You copy the markdown into a new file under `vault/cards/`. You commit. The build runs. Your binder now owns that card. The federation sees the new entry on next walk.

The walker writes markdown for you to save manually rather than touching the vault directly. This keeps the vault as the source of truth; you decide what enters it.

## Why this is the right shape

Most attempts to "make X searchable / personal / second-brain-ready" end up bolting a new app onto your life. New silo, new format, new lock-in. The vault-as-binder pattern goes the other way: it bolts the federation onto an app you *already use*, in a format that's *already plain text*, in a tool that already does everything you want a binder UI to do.

Obsidian is the brain. The federation is the protocol. The build script is the bridge. There's nothing else to build.

## The four binders, plus one

The federation now has five reference implementations, each demonstrating a different shape:

| Binder | Role | What it shows |
|---|---|---|
| [RAR](https://kody-w.github.io/RAR/) | registry | The minting authority |
| [RAPPcards](https://kody-w.github.io/RAPPcards/) | reference | The canonical viewer |
| [red-binder](https://kody-w.github.io/red-binder/) | third-party | A 21-card crimson deck |
| [twin-binder](https://kody-w.github.io/twin-binder/) | archive | Empty binder, rebuild-from-memory demo |
| [obsidian-binder](https://github.com/kody-w/obsidian-binder) | vault | **Your second brain IS the binder** |

The federation works because none of these implementations know about the others. They all just speak the SPEC. New shapes can show up and join the network without any central coordination.

## Read more

- [obsidian-binder repo](https://github.com/kody-w/obsidian-binder) — clone it, open `vault/` in Obsidian
- [RAPPcards SPEC](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) — the protocol
- [Mnemonic-as-Ownership](/2026/04/17/mnemonic-as-ownership/) — why the 7 words are the deed
- [A Federated Card Protocol in Four Static JSON Files](/2026/04/17/federated-cards-four-json-files/) — how the walker works
