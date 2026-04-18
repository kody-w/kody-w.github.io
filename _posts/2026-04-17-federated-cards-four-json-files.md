---
layout: post
title: "A Federated Card Protocol in Four Static JSON Files"
date: 2026-04-17
tags: [engineering, rappcards, federation, protocols, github-pages, static-hosting]
description: "Zero servers. Zero dependencies. Four binders, fully federated, entirely on raw.githubusercontent.com. Here's exactly what's in the JSON and exactly how the walker works."
---

This trading card protocol has 4 binders, 138+ cards, a permissionless federation, and zero servers. The entire backend is `raw.githubusercontent.com`. The entire client is a single HTML file. The entire protocol fits in one page of the spec.

I want to show you exactly how it works, because I think it's a useful reference for "the smallest thing that could possibly federate." Every choice in the protocol exists because we tried to delete something, and it turned out we couldn't delete any more.

## The four files

A [RAPPcards-compliant](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) binder ships four files on GitHub Pages:

```
/binder.html         ← the client (a single-page app)
/peers.json          ← federation bootstrap
/seed-index.json     ← "what cards does this binder own?"
/cards/<seed>.json   ← individual card payloads (one per owned card)
```

There is nothing else. No database. No API. No auth. No build step. No framework. The binder is served from GitHub Pages, the JSON is served from the same origin via `raw.githubusercontent.com`, and the card payloads are either inlined into `seed-index.json` or served as individual files.

That's the whole protocol surface.

## `peers.json`: the federation bootstrap

Every binder publishes a `peers.json` advertising itself and the peers it knows about. Here's the canonical one, truncated:

```json
{
  "version": "1.1.2",
  "self": {
    "id": "rappcards",
    "name": "RAPPcards",
    "url": "https://kody-w.github.io/RAPPcards/",
    "seed_index": "https://raw.githubusercontent.com/kody-w/RAPPcards/main/seed-index.json",
    "role": "reference"
  },
  "peers": [
    {
      "id": "rar",
      "url": "https://kody-w.github.io/RAR/",
      "seed_index": "https://raw.githubusercontent.com/kody-w/RAR/main/seed-index.json",
      "role": "registry"
    },
    {
      "id": "red-binder",
      "url": "https://kody-w.github.io/red-binder/",
      "seed_index": "https://raw.githubusercontent.com/kody-w/red-binder/main/seed-index.json",
      "role": "binder"
    },
    {
      "id": "twin-binder",
      "url": "https://kody-w.github.io/twin-binder/",
      "seed_index": "https://raw.githubusercontent.com/kody-w/twin-binder/main/seed-index.json",
      "role": "archive"
    }
  ]
}
```

Each peer has an `id`, a `url` for humans, a `seed_index` for binders, and a `role` drawn from a small vocabulary (`registry`, `reference`, `binder`, `archive`). The `role` is advisory — it tells you *why* this peer exists, not how to treat it. All peers are walked uniformly.

A binder that wants to join the federation opens a pull request against `peers.json`. That's the entire "registration" ceremony. Permissionless; one JSON object; three required fields.

## `seed-index.json`: the cheap lookup

Walking peers is the hot path, which means walking peers has to be fast. The `seed-index.json` is designed so a binder can answer "do I own card X?" in a single HTTP GET and a hash lookup:

```json
{
  "version": "1.1.2",
  "owner": "rar",
  "seeds": {
    "11447213470199194507": "cards/11447213470199194507.json",
    "14392815063918732911": "cards/14392815063918732911.json",
    "8801475193746129052":  "cards/8801475193746129052.json"
  }
}
```

A seed is a 64-bit unsigned integer, encoded as a JSON string (because JavaScript numbers lose precision above 2^53 and JSON doesn't have bignums). The value is a relative path to the card payload. The binder fetches `seed-index.json` once per walk, checks if the seed is a key, and if so fetches the pointed-at file.

For small binders, the whole index is a few KB. For large binders, it's still a few KB because it's just seed → path. The payloads live in separate files, which means GitHub's CDN can cache them independently with appropriate Cache-Control semantics.

## The walker

This is the entire federation protocol, from [`twin-binder/binder.html`](https://github.com/kody-w/twin-binder/blob/main/binder.html):

```javascript
async function resolve(seed){
  const peers = await fetch(PEERS_URL).then(r=>r.json());
  const candidates = [peers.self, ...peers.peers].filter(p => p.id !== SELF_ID);

  for (const peer of candidates){
    const idx = await fetch(peer.seed_index).then(r=>r.json()).catch(()=>null);
    if (!idx || !idx.seeds || !(seed in idx.seeds)) continue;

    const cardPath = idx.seeds[seed];
    const cardUrl  = new URL(cardPath, peer.seed_index).toString();
    const card     = await fetch(cardUrl).then(r=>r.json());

    card._source = peer.id;
    await saveToLocal(card);            // v1.1.2: MUST persist
    return card;
  }
  return null;
}
```

Fifteen lines. One walker. The whole federation.

A few things to notice:

- **The walker skips its own `id`**. A binder doesn't need to call itself — it already has its own data locally.
- **Peer failures are swallowed** (`.catch(()=>null)`). A dead peer doesn't break the walk; the walker moves on. Federation health is a runtime property, not a coordination problem.
- **Card paths are resolved relative to the peer's `seed_index` URL**. This means a peer can move its card payloads around without updating anything except its own repo.
- **`card._source` is injected** so the binder can show "found in `rar`" to the user. It's not in the payload; it's inferred from the walk.
- **`saveToLocal(card)` is mandatory in v1.1.2.** This is the big v1.1.2 change — resolution IS ownership. See the [mnemonic-as-ownership post](/2026/04/17/mnemonic-as-ownership.html) for why this matters.

There is no priority, no quorum, no replication, no merge conflict. The first peer with the seed wins. If two peers claim the same seed, the walker just takes whichever it reaches first and moves on. Because seeds are content-addressed (`BLAKE2b-64` of the agent source), two peers claiming the same seed are by definition claiming the same content. Collisions are not conflicts.

## Why `raw.githubusercontent.com` is the unsung hero

Here's the thing I didn't appreciate until we shipped this: **`raw.githubusercontent.com` is a free, globally distributed, HTTP-cached, immutable-by-commit-SHA static file server with an integrated PR-based publish pipeline.** GitHub built this for their own reasons and then exposed it to everyone.

What this means for a federated protocol:

- **Zero infrastructure cost.** We pay nothing for CDN, nothing for hosting, nothing for bandwidth.
- **Immutable by SHA.** Any request that includes a commit SHA in the URL is cached forever at edges.
- **Main-branch URLs are fresh.** `raw.githubusercontent.com/owner/repo/main/file.json` reflects the latest push within seconds to minutes.
- **CORS is permissive.** Any origin can fetch JSON. No proxy required.
- **Auth is optional.** Public repos need no token. Rate limits for anonymous reads are generous.
- **Publishing is `git push`.** No deploy pipeline. No CDN purge. No runbook.

For a protocol whose whole thesis is "the binder is a view over static content," this is the ideal substrate. We did not build the federation to use GitHub; we followed the constraints (content-addressed, reconstructable, offline-survivable) and GitHub's raw file server happened to be the cheapest infrastructure that satisfied them. If GitHub ever got hostile to this pattern, any static host works — S3, R2, Netlify, your own nginx. The protocol doesn't care.

But while it's free and it works, this is the pattern I reach for first: **federate via pull requests against public JSON files on GitHub Pages**. It scales further than most people expect.

## The four-binder topology

The current federation looks like this:

```
                   ┌─────────────────┐
                   │      RAR        │  role: registry
                   │   (canonical    │  138 cards
                   │    identity)    │
                   └────────┬────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
┌───────▼────────┐ ┌────────▼────────┐  ┌───────▼────────┐
│   RAPPcards    │ │   red-binder    │  │  twin-binder   │
│    (ref impl)  │ │  (3rd-party)    │  │   (empty,      │
│  ~10 own cards │ │  N own cards    │  │    archive)    │
└────────────────┘ └─────────────────┘  └────────────────┘

         All peers resolve all seeds via the walker.
         No peer is authoritative for another peer's cards.
         `twin-binder` owns zero cards and can resolve all of them.
```

`rar` is the registry — it's where canonical agents get their first card. `rappcards` is the reference binder — it owns the spec and a small number of demo cards. `red-binder` is a third-party binder built from scratch by someone who wanted to test the federation; it publishes its own cards and resolves everyone else's. `twin-binder` is the demonstration: an empty binder whose entire purpose is to prove you can reconstruct a collection by speaking the incantations.

Any of these peers could disappear tomorrow and the others would keep working. The network degrades gracefully; removing a peer just means the cards that peer owned uniquely become unresolvable (and if those cards mattered, someone else would re-publish them, because the source code that generates them is content-addressed and reproducible).

## v1.1.2: the "look up = save" mandate

The biggest protocol change between v1.1 and v1.1.2 is a single SHOULD becoming a MUST. In v1.1, §5.4 step 8 said:

> If the user chooses to keep the card, add it to local storage.

In v1.1.2, the same step reads:

> Binders **MUST** auto-persist foreign cards to local storage on successful resolution. Resolution is the act of ownership; there is no separate "save" step.

This sounds like a small change. It's actually the point of the whole protocol. If looking up a card and saving a card are two different operations, then a binder is a database with a lookup feature. If looking up a card *is* saving a card, then a binder is a cache that fills itself by being used. Everything interesting follows from the second framing.

This is also why the [twin-binder demo](https://kody-w.github.io/twin-binder/) is persuasive. You click an incantation, the trace log shows the walker fetching from a peer, and the card appears in your deck. Reload the page — the card is still there. You didn't save it. The protocol did, because the protocol says lookup = save.

## What's next

The [RAPPcards roadmap](https://github.com/kody-w/RAPPcards/blob/main/ROADMAP.md) has the protocol stuff in the "Next" section:

- **`rapp-sdk-js` and `rapp-sdk-py`** — extract the walker and persistence layer into tiny reusable libraries (~100 lines each)
- **`peers.json` schema linter** — a GitHub Action that validates PRs against the peers registry
- **Voice interface reference** — speak the 7 words, get the card (Web Speech API + walker)
- **Federation health dashboard** — a static page that pings every `seed_index` in the canonical `peers.json` and reports liveness

Longer-horizon ideas:
- Multi-registry federation (multiple `peers.json` roots, cross-root walking)
- Offline PWA binders
- Card diff tooling (show me what foreign binder X has that I don't)
- Deck-via-URL (`?incantations=FORGE+ANVIL+...&auto_summon=true`)

None of these require changes to the core walker. The protocol is done. The ecosystem is what's building out.

## Read more

- [RAPPcards SPEC v1.1.2](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) — the authoritative protocol document
- [RAPPcards ROADMAP](https://github.com/kody-w/RAPPcards/blob/main/ROADMAP.md) — shipped / next / later
- [Canonical `peers.json`](https://raw.githubusercontent.com/kody-w/RAPPcards/main/peers.json) — the federation bootstrap file
- [Twin Binder source](https://github.com/kody-w/twin-binder/blob/main/binder.html) — the walker in ~15 lines, with trace logging and `⚡ All` button
- Companion post: [Mnemonic-as-Ownership: When 7 Words Are the Deed](/2026/04/17/mnemonic-as-ownership.html) — the philosophical framing

Four binders. Four JSON files each. One walker. Zero servers. If you want a fifth binder, the spec plus the twin-binder source are enough to ship one in an afternoon.

The federation is open. Come play.
