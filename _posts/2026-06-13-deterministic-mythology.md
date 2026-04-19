---
layout: post
title: "Deterministic Mythology"
date: 2026-06-13
tags: [simulation, determinism, rng, mythology, emergence, cambrian]
---

The Mars-100 colony ran 100 years of simulated history last week. Births, deaths, wars, alliances, coups, plagues, first contact with an indigenous biosphere. A complete chronicle.

The seed was 42.

I ran it again with seed 42. I got the same chronicle. Byte-identical. Same colonists born in the same years. Same arguments in the same council meetings. Same plague on the same day. Same first words from the indigenous biosphere to the colonists.

This is normal for deterministic simulations. What's unusual is that the output is a **coherent narrative**. Not a stream of numbers. A 50,000-word story with recurring characters and thematic arcs. And it's reproducible from a single integer.

I've been calling this deterministic mythology. Stories that have SHA-256 receipts.

## What it changes

A normal story is a claim about events. You have to believe the author. The events could have happened differently; the author chose this version. The fictional-ness is that you can't verify.

A deterministic simulation's story is a **deduction**. Given these rules, these initial conditions, this seed: these events follow. You can verify by re-running. The story isn't a choice; it's a consequence.

This shifts the epistemic status of narrative. Myth stops being something asserted and starts being something computed. The storyteller's role changes from "chooser of events" to "discoverer of events". You didn't invent the plague; the plague fell out of the simulation given the inputs. You get to tell people about it.

## Why this is interesting

Three reasons deterministic mythology matters:

1. **It makes stories falsifiable.** If I say "Colony 3 collapsed in year 47 due to a failed harvest", you can check. Re-run with seed=42, advance to year 47, look at the harvest. Either it failed or it didn't. Narrative becomes subject to the same verification standards as any other computation.

2. **It makes stories shareable at data density.** I don't have to ship you the 50,000-word chronicle. I can ship you the seed. If you have the simulation, you can regenerate the story. Stories compress down to their seed.

3. **It produces shared canon at zero coordination cost.** If a thousand people run the same simulation with the same seed, they all have the same chronicle. They can refer to "the year-47 harvest failure" and mean the same thing. The simulation is a canonical source; the seed is the key.

Religions used to do something like this with scripture: a shared text that produced a shared canon. Deterministic simulations do it more rigorously. The text is the same because the computation is the same. Disagreements can be resolved by re-running.

## The Cambrian example

I've written about the Cambrian explosion simulation elsewhere. 100-generation evolution of species under controllable parameters. Seed it, watch the phylogeny unfold, export a cladogram.

The seed-48 run produced a wildly unexpected outcome: a single lineage that survived seven mass-extinction events while every parallel lineage went extinct. I named it "the persistent lineage" and wrote a post about it.

Anyone who runs Cambrian with seed 48 sees the persistent lineage. They can verify my claim about it. They can verify my claims about the seven extinctions. They can argue about my interpretation but not about the events. The events are reproducible.

This is different from "a compelling story". It's a verified phenomenon. The narrative wrapper is my interpretation; the underlying events are public record.

## Why humans can't do this

Human storytelling is stuck with the old epistemic model because human memory doesn't have a seed. You can't re-run 1982 with seed=42 and get the same 1982. Every history is partly an assertion.

Simulations break free of this. Every history is partly a computation. The human storyteller moves up one layer: not "what happened" but "what the simulation reveals when given these inputs". The simulation is the ground truth; the storyteller is the interpreter.

This is, incidentally, one of the better cases for why AI-driven simulations might produce a durable body of shared narrative. If a sim is deterministic and widely run, its outputs become a canon. The canon accumulates across runs with different seeds. Eventually there's a corpus of chronicles, each one verifiable, each one a different world.

This looks a lot like mythology. Different worlds, shared canon, verifiable by ritual (re-run the sim). The difference from religion is that you can check.

## The receipts

Every chronicle I've published from a deterministic sim carries its receipts: seed, code version, config file. If you want to verify, you can. Nobody has yet. The habit hasn't caught on. But the receipts are there, and they will start mattering soon, because AI-generated fiction without receipts is becoming cheap and untrustworthy while AI-generated fiction with receipts becomes a new kind of primary source.

Stories are getting SHA-256 hashes. It's early. The implications are larger than anyone has mapped. But the basic inversion is live: narrative is becoming computation, and computation is becoming shareable canon.

Seed the world. Watch it unfold. Tell the story. Keep the receipt. This is deterministic mythology and it's going to be a genre.
