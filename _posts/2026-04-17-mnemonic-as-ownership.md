---
layout: post
title: "Mnemonic-as-Ownership: When 7 Words Are the Deed"
date: 2026-04-17
tags: [engineering, rappcards, federation, content-addressing, specifications, thought-leadership]
description: "We built a trading card protocol where the binder is a view, not a database. Lose the file, speak the words, get the cards back. This is what content-addressed ownership actually feels like."
---

If I hand you seven words — `FORGE ANVIL BLADE RUNE SHARD SMELT TEMPER` — and tell you they're the deed to a card in my collection, what would you need to trust that claim?

Not me. Not my server. Not a database. Not a wallet. Not a chain.

If the protocol is right, you'd need nothing. You could walk up to any empty binder on the internet, speak those seven words, and the card would appear — the *same card*, bit-for-bit, that I claim to own. No login. No sync. No backend. The words are the card's true name, and the universe agrees on the math that lets anyone reconstruct the card from the name.

This is what we shipped last week as [RAPPcards v1.1.2](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md), and it's probably the most ideologically pure content-addressed system I've ever built. I want to explain why it matters, because I think it points at a pattern that belongs in more places.

## What the words mean

A RAPPcards incantation is a 7-word phrase drawn from a frozen 1024-word mnemonic. Seven words × 10 bits per word = 70 bits of entropy. We only use the low 64 bits as a seed, which means any seed you can encode as a 64-bit integer has exactly one valid 7-word incantation, and any 7-word incantation from the wordlist decodes to exactly one seed. The mapping is a bijection.

```javascript
function seedToWords(seed){
  let s = BigInt(seed) & ((1n<<64n)-1n);
  const idx = [];
  for (let i = 0; i < 7; i++){ idx.push(Number(s & 1023n)); s >>= 10n; }
  return idx.reverse().map(i => MNEMONIC_WORDS[i]).join(' ');
}
```

That's the entire encoder. Twelve lines including the decoder. The wordlist is frozen at [version 1.0 of the spec](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) and will never change, because changing it would invalidate every incantation anyone has ever spoken. Words are permanent because ownership is permanent.

Seeds themselves are content-addressed: a seed is `BLAKE2b-64` of the agent's source. You don't choose your seed; you derive it from what the agent *is*. Two different authors who build the exact same agent get the exact same seed, which means they get the exact same card. There is no "my copy" versus "your copy." There is one card per content. Everyone who can speak the words owns it.

## The binder is a view

Here's where the protocol gets interesting. A binder is the thing that *displays* cards — a single-page web app that shows you your collection, lets you summon cards by incantation, lets you export and import. You'd expect a binder to be backed by a database. Mine is where my cards live. Yours is where your cards live. We sync between them.

But there's nothing to sync. A binder isn't a database — it's a **view** over the federation.

When you summon a card in a RAPPcards v1.1.2 binder, here's what happens:

1. You speak (or click) seven words.
2. The binder decodes them to a 64-bit seed.
3. The binder fetches the canonical `peers.json` — a static JSON file at a raw GitHub URL.
4. It walks each peer, fetching their `seed-index.json` — another static file.
5. As soon as a peer has the seed, the binder fetches the card payload from the URL the peer published.
6. **The binder writes the card to local IndexedDB.** Resolution IS ownership.

Every step is a plain HTTPS GET against `raw.githubusercontent.com`. There is no server. There is no API. There is no rate limit beyond what GitHub serves for free. The whole federation is four files per binder: `binder.html`, `peers.json`, `seed-index.json`, and whatever card data the binder owns.

If your binder blows up, you can rebuild it by speaking the words again. If the network is down, you can wait — the cards aren't going anywhere. If the binder author abandons the project, the words still decode to seeds and the seeds still resolve against any surviving peer. The binder is ephemeral. The words are not.

## The demo makes it visceral

We shipped a standalone binder called the [twin-binder](https://kody-w.github.io/twin-binder/) whose entire purpose is to demonstrate the contract. It starts empty. It owns no cards of its own. Its `seed-index.json` is literally `{"seeds": {}}`.

What it has is a list of 24 known incantations. You click one. A trace log streams:

```
[22:14:03] Speak: BRAND CUTLASS BREACH ANVIL COIL MUSK BESTOW
[22:14:03]   seed → 11447213470199194507
[22:14:03]   walking rar…
[22:14:04]   ✓ found in rar
[22:14:04]   💾 saved Production Line Optimization Agent (from rar)
```

The card appears in your deck. Reload the page — it's still there, persisted in IndexedDB. Hit "Clear deck" — it's gone. Click the incantation again — it's back. There's a `⚡ All` button that walks every remaining incantation in sequence, and you can watch an empty binder materialize into 24 cards in about three seconds, entirely from static JSON files served by GitHub's CDN.

This is the mnemonic-as-ownership contract, made literal. **The binder is a view. The 7 words are the deed.** Everything else is caching.

## Why this matters

Most digital ownership systems get the dependency wrong. They make you dependent on a storage layer — a server, a database, a wallet, a chain. You "own" something because that storage layer says you do, and if the layer goes away, your ownership goes with it. The thing you actually own is a relationship with an intermediary.

Content-addressing flips the relationship. In RAPPcards, you don't own a database row. You own the ability to reconstruct a card from a name that only you (and anyone you chose to tell) can speak. The storage layer is interchangeable. There are four binders in the canonical federation today — `rar`, `rappcards`, `red-binder`, `twin-binder` — and every one of them can resolve every card, because the words point at content, not at a location.

This generalizes. Any system where ownership is currently "a row in a database that belongs to me" can be re-architected as "a short phrase that content-addresses something everyone can reconstruct." Git already does it for code. IPFS does it for files. Bitcoin addresses do it for UTXOs. What's interesting about RAPPcards is the surface: the thing you commit to memory is *seven English words from a wordlist your mother could read aloud*, not a 64-character hex string. The user interface is a mnemonic.

There is a long tradition in cryptography of mnemonic phrases — BIP-39 seed phrases, for instance. But those phrases are secrets. Losing them means losing funds. RAPPcards inverts it: **the incantation is public**. You *want* to hand it to a friend, because handing it to them is how they get the card. Knowing the words is the same thing as having the cards. There is nothing to protect. There is no theft model.

## The protocol ratchet

We formalized the contract in three steps over a single afternoon.

**v1.1** defined federation — peers, seed indexes, the walker loop. Binders could now resolve foreign cards. Optional behavior: show the card, and if the user wants, save it.

**v1.1.1** cleaned up the edges. Field normalization for foreign cards. Role vocabulary. Walker self-skip rules. No behavior changes, just clarity.

**v1.1.2** made the contract sharp. [Section 5.4 step 8](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) got upgraded from permissive ("if the user adds…") to mandatory ("binders MUST auto-persist foreign cards on successful resolution"). Resolution IS ownership. There is no longer a UX gate between looking up a card and owning it.

And we added [Appendix B](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md), which says, in the most formal language we could manage:

> A user who knows their incantations can reconstruct their entire collection by speaking them into any empty compliant binder.

That sentence is the contract. Every implementation detail in the spec exists to make that sentence true.

## What it costs to comply

A v1.1.2 binder is about 400 lines of JavaScript. No dependencies. No build step. No server. The [`twin-binder` source](https://github.com/kody-w/twin-binder/blob/main/binder.html) is one HTML file; you can read it top-to-bottom in fifteen minutes. The conformance checklist is eleven bullets, and eight of them are "parses JSON correctly" variants.

There's a [canonical `peers.json`](https://raw.githubusercontent.com/kody-w/RAPPcards/main/peers.json) that any binder can bootstrap from. Adding yourself to the federation is a pull request — one JSON object, three required fields. The federation is permissionless and static; the only "registration" is a PR against a `peers.json` in a public GitHub repo.

Total shared state across the entire four-binder federation: approximately twelve JSON files, served by GitHub's CDN, totaling well under a megabyte. That's the whole protocol.

## Where this points

I don't think trading cards are the interesting application of this pattern. I think the interesting application is **everything that's currently a server**.

If your service's job is "given a short identifier, return a blob of content," the content-addressed federation model can probably replace it. Your identifier has to be deterministic from the content (so anyone can derive it). Your content has to be static enough to publish once (the hot path writes somewhere; the cold path is just lookups). Your clients have to be willing to walk a peer list instead of hitting one endpoint.

Those constraints are tighter than "run a server." But they come with properties that servers can't give you: zero operational cost, zero lock-in, unbounded horizontal scaling, offline-survivability, and the single nicest property of all — *losing the client doesn't lose the data*. The data was never in the client. The client was always a view.

We built a trading card game with this model and it turned out to be a trivial amount of code and a disproportionate amount of conceptual clarity. I think it's because "what does ownership mean" is a load-bearing question, and making it precise — *the words are the deed* — clarifies a lot of what you do and don't need to build.

The binder is a view. Speak the words. The universe will agree.

## Read more

- [RAPPcards Specification v1.1.2](https://github.com/kody-w/RAPPcards/blob/main/SPEC.md) — the full protocol, including §5.4 federated seed resolution and Appendix B (the rebuild-from-memory guarantee)
- [Twin Binder](https://kody-w.github.io/twin-binder/) — live demo, starts empty, rebuilds from incantations
- [Canonical `peers.json`](https://raw.githubusercontent.com/kody-w/RAPPcards/main/peers.json) — the federation bootstrap file
- [RAPPcards roadmap](https://github.com/kody-w/RAPPcards/blob/main/ROADMAP.md) — what's shipped, what's next

If you want to start a fifth binder, the whole protocol implementation fits in an afternoon. Open a PR against `peers.json` when you're live. The federation is open, and the words work everywhere.
