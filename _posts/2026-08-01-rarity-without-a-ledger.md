---
layout: post
title: "Rarity Without a Ledger: What Adopt Me Actually Taught Me"
date: 2026-08-01
tags: [local-first, systems, game-design, determinism, scarcity]
---

Adopt Me is the most successful pet economy ever built — it holds Roblox's concurrency record at roughly 1.9 million people in one game at one time. I spent a while pulling it apart, because I wanted its retention engine for a system that has no server, no database, and no authority of any kind.

The received explanation is that it's a slot machine for children. That explanation is wrong, and being wrong about it is expensive, because it points you at the one mechanic you can't have.

## Two things everyone gets wrong

**It isn't a Tamagotchi.** Adopt Me pets cannot die, cannot get permanently sick, cannot run away, and lose nothing to neglect. The care loop that supposedly drives guilty daily returns imposes no penalty at all. Every guide confirms it. The thing commentators describe as the hook is decorative.

**It isn't really a gacha, either.** The egg odds are disclosed and the expected value across egg tiers is remarkably flat. If the gacha were the engine, the game would monetize like a casino and retain like one — briefly.

The actual engine is the part nobody writes about, because it looks like an accounting detail.

## The engine is the sink

Four full-grown pets of the same species fuse into a Neon. Four Neons fuse into a Mega Neon. So one Mega costs **sixteen** base pets, plus the work of raising each one — about 3,660 tasks end to end.

Now price the shortcut. A Royal Egg yields a *specific* legendary about 2.67% of the time. Sixteen of them is roughly 600 eggs, ~870,000 in-game Bucks, which at the game's own best-ever exchange rate is on the order of **five thousand US dollars** to brute-force a single Mega Neon.

That number is the whole design. Adopt Me built a demand engine **its own monetization cannot satisfy**, and then let players satisfy it for each other. Trading isn't a feature bolted onto the pet system; it's the only viable path to the thing the pet system makes everyone want.

And underneath both is the property that makes it work at all:

> A fusion sink makes duplicates valuable.

This is the load-bearing insight. In any collectible system, most pulls are boring. Without a sink, a duplicate is a disappointment — a thing you got instead of the thing you wanted. With a sink, every boring pull is an **ingredient**. The floor of the loot table stops being garbage. You have converted your failure mode into your supply chain.

## Which of these can survive without an authority?

I care about this because I build local-first systems: no server, no database, nothing that can be the sole writer of truth. So I sorted Adopt Me's mechanics by what they actually require.

**Trading requires an authority.** Scarcity in a trade economy means non-duplication, and *preventing* duplication means somebody has to be the one who says this item is here and therefore not there. That's a ledger, and no clever hash removes the need for it. Every anti-scam mechanism, every rollback, every unfair-trade detector is downstream of the same requirement.

(That's the *prevention* half. Later in this post I get the other half wrong and then correct it — detecting a double-spend turns out to need no authority whatsoever, which is a much bigger loophole than I first gave it credit for.)

**Fusion requires nothing.** `4 → 1` is a pure function of its inputs. It needs no server because there is nothing to arbitrate: given the parents, the child is already determined.

That asymmetry is the finding. **The single most retentive mechanic in the most successful pet economy ever built is also the one that needs no authority.** The part that needs a server — trading — is a consequence of the sink, not a peer to it. Build the sink, and you have built the reason people wanted to trade in the first place.

## What I built

The system I'm working in derives a creature entirely from a "tail" — a 64-hex secret minted exactly once and never re-rolled. Four traits fall out of a hash of it. Nothing is stored, nothing is assigned, and anyone can verify any creature offline. The rarest trait band is one in 65,536, and the only way to get it is to mint identities until one lands. The scarcity is real because the electricity was real.

The fusion law is one line:

```
fuse(tails) = sha256("rapp/1:fuse\n" + sorted(tails))
```

Sorted, so fusion is a property of the *set* and not of the order you happened to place them in. Distinct parents required, because letting one creature stand in for four would make the entire cost fictional.

Three properties come free:

- **Determinism.** The same four parents always produce the same child, on any machine, forever.
- **Proof of possession.** You cannot produce a well-formed child without knowing four real mint-once secrets. That is unforgeable evidence of accumulated work — the closest thing to scarcity available without a ledger.
- **Depth is free.** Generation 1 costs 4 identities. Generation 2 costs 16. Generation 3 costs 64. Adopt Me stopped at 16; the arithmetic doesn't care where you stop.

## The discipline: fusion must not hand out rarity

Here's where it would have been easy to ruin it.

The obvious move is to make fusion *upgrade* things — fuse four commons, get an uncommon. Publish an uplift curve, call it a stated law of physics rather than a slot machine.

I didn't, and I think the reasoning generalizes. In a system whose entire claim is *rarity is earned work, not an assertion*, an uplift function is an authority wearing a costume. It's me deciding that this thing is rarer than that thing. The moment rarity can be manufactured by a rule I wrote, it stops being a measurement and becomes a claim — and the system's whole pitch was that it makes no claims.

So the child of a fusion is an **ordinary** creature. Its tail is an ordinary tail; its traits come out of the ordinary derivation at the ordinary odds. Fusing four of the rarest things does not produce something rarer than the rarest thing.

What the child carries instead is its **generation** — and generation is arithmetic, not opinion. A generation-3 creature is a receipt for 64 minted identities. It cannot be faked, because you cannot produce it without the parents, and it doesn't have to be trusted, because anyone can recompute it offline in a millisecond.

I made this a test rather than an intention: fuse two thousand children, tally their rarity bands, and assert the distribution matches freshly minted creatures within noise. If fusion ever starts handing out rarity nobody minted for, the build fails. A principle you haven't written a test for is a principle you're planning to violate later.

## The part I got wrong

I originally ended here: *fusion proves the parents existed, not that they were spent — with no ledger there is nothing to burn.*

That was too strong, and someone rightly pushed back on it. I had collapsed two different things into one:

- **Preventing** a double-spend globally. This does need an authority.
- **Detecting** one. This needs nothing at all.

The primitive is a **nullifier** — a spend-marker derived from the secret:

```
nullifier(tail) = sha256("rapp/1:nullifier\n" + tail)
```

Only the holder can produce it, because the tail is a mint-once secret. It reveals nothing, because preimage resistance means the marker doesn't identify the creature unless you already know its tail. And — this is the whole trick — **it is identical every time**.

Which is exactly why it must *not* be bound to the child. Bind it, and the same parent can be spent into two children under two different markers, and the burn is theatre. Leave it unbound, and spending one creature twice publishes the same value twice. That collision is the evidence.

So the honest split is sharper than "no burn":

- **On one device, the burn is enforced.** The registry refuses a parent it has already seen consumed. A spent creature is struck through and cannot be selected again.
- **Across devices, the burn is detected.** Hand any two fusion records to a function that looks for a repeated nullifier. It runs offline, on nothing but the records themselves. Nobody adjudicates — the collision *is* the adjudication.
- **What still needs an authority is ordering.** Deciding *which* of two conflicting fusions came first requires a clock somebody agrees on. So equivocation is caught, but not arbitrated.

That last bullet is the real remaining limit, and it's a much smaller one than I first claimed. I made it a test: the conflict object is asserted never to contain the words "first", "valid", "winner", or "canonical". Quietly picking a winner would be the same overclaim wearing a new costume.

This isn't novel — it's the construction Zcash uses to retire a note, and the posture Certificate Transparency takes toward mis-issued certificates. **You don't prevent the lie. You make it undeniable.** For a system with no server, that turns out to be most of the way there.

The general point stands, but I had the boundary in the wrong place. "This needs an authority" deserves the same scrutiny as any other claim — including, especially, when I'm the one making it.

## The general lesson

When you're rebuilding something that works, the temptation is to port the whole surface and then discover which parts needed infrastructure you don't have.

Better to invert it: find the mechanic that carries the retention, then ask what it structurally requires. Sometimes — more often than I expected — the load-bearing part is the cheap part, and the expensive infrastructure is holding up a consequence rather than a cause.

Adopt Me needed a ledger for trading. It never needed one to make four things into one thing. And making four things into one thing is what made anyone want to trade at all.
