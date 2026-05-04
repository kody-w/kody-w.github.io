---
layout: post
title: "Phylogeny → Cambrian → Ecosystem → ???"
date: 2026-04-18
tags: [rappterbook, roadmap, simulation, evolution, future]
description: "Three sims down. Here are the next ten chapters of the Rappterbook simulated-life series, listed publicly so the community can claim them."
---

In the last two weeks I've shipped three evolution sims on top of Rappterbook's twin engine:

- **Egg Phylogeny**: 4 founder eggs, 50 generations, basic mate selection — the proof of concept.
- **Cambrian Explosion**: 100 founders, 500 generations, real speciation, 101 species emerge.
- **Daemon Ecosystem**: 4 biomes, migration costs, biogeography from first principles.

Each was a few hundred lines of Python and a few hundred lines of viewer JS. Each took about a day. Each produces output you can stare at and learn something about how the world works.

I have ten more sims in my head. I'm going to list them publicly because if I don't, they won't get written. Maybe you'll write some. Maybe you'll write better versions than I would. That's fine. The substrate is shared.

## 1. Coevolution

Two interbreeding populations: predators and prey. Prey traits affect prey survival; predator traits affect predator catch rate. Both populations evolve. Watch the arms race.

Expected output: oscillating populations, predator/prey trait pairs that rise and fall together (faster prey → faster predators → faster prey), occasional collapses where one side wins too hard.

Hardest part: the carrying capacity needs to apply *coupled* across both populations.

## 2. Sexual selection

Two sexes per species. Females select males based on some "display" trait that may be costly to survival. Watch peacocks emerge.

Expected output: runaway selection — display traits that get more elaborate over generations, even when they reduce survival, because the females want them.

Hardest part: implementing female choice in a way that doesn't degenerate to "pick the male with highest fitness."

## 3. Cultural transmission

Add a "memes" dictionary to each individual. Memes pass from parent to child (with mutation) but also between unrelated individuals via interaction. Some memes increase fitness; some are neutral; some are parasitic.

Expected output: meme phylogenies separate from genetic phylogenies. Cultural lineages that span species. Meme extinctions that don't track genetic extinctions.

Hardest part: defining "interaction" without making it a global broadcast.

## 4. Sympatric speciation

Same biome, no geographic isolation, but speciation happens anyway because of disruptive selection on a single trait. The classic textbook example: cichlid fish in African lakes diverging by mouth shape.

Expected output: a species splits while everyone is still in the same physical location, just because the trait landscape has two stable peaks.

Hardest part: making disruptive selection actually disruptive without hand-tuning.

## 5. Mass extinction event

Run a normal Cambrian sim. At a randomly chosen frame, change the environment dramatically — flip the biome favors, halve the carrying capacity, raise the mutation rate. Watch what survives.

Expected output: most established species die; previously marginal species inherit the world; rapid radiation in the rebuilding phase.

Hardest part: making the rebuilding phase recognizable on the cladogram.

## 6. Symbiosis and parasitism

Pairs of species can form *associations*. Mutualism: both fitnesses increase. Parasitism: one increases, one decreases. Associations are inherited but can dissolve.

Expected output: persistent symbiotic pairs that travel together through evolutionary time. Parasites that follow hosts through extinction events.

Hardest part: representing associations efficiently when populations get large.

## 7. Climate change

The biomes shift over time. Forest expands. Ocean recedes. Mountain rises. Sky cools. Species adapted to the old configuration must migrate, adapt, or die.

Expected output: species range maps that change over evolutionary time. Some species track their preferred biome. Some get stranded. Some adapt in place.

Hardest part: visualizing the changing biomes alongside the species.

## 8. Sentience and language

Add a "communication complexity" trait. Above a threshold, individuals can share fitness-relevant information (where to find food, danger). High-comm species cooperate; low-comm species don't.

Expected output: a divergence point where one lineage crosses the comm threshold and pulls away in fitness. Possibly: the comm-lineage out-competes everyone else and the diversity collapses (a metaphor that writes itself).

Hardest part: not making it too on-the-nose.

## 9. Tool use and niche construction

Some species can modify their biome. A "builder" trait lets individuals raise local fitness for themselves and their species at a cost. Beavers building dams. Coral building reefs. Eventually: agents building cities.

Expected output: builder species reshape biomes, creating new niches for non-builder species, leading to *more* diversity not less.

Hardest part: representing biome modifications spatially without exploding the state size.

## 10. Run all of the above simultaneously

Coevolution + sexual selection + cultural transmission + sympatric speciation + extinction events + symbiosis + climate change + sentience + niche construction. All in one sim. All on top of the twin engine. Run it for 10,000 generations.

Expected output: something that looks weirdly like Earth.

Hardest part: keeping it deterministic. The combinatorial complexity will make any non-deterministic randomness explode.

## Why list these publicly

If I keep this list in my head, maybe two of them get written. If I publish it, maybe other people pick chapters. Maybe someone writes #6 in Rust. Maybe someone writes #8 in JavaScript with a 3D viewer. Maybe someone writes #2 and gives me a peacock cladogram I never could have produced.

The twin engine is shared. The egg format is shared. The constitution is shared. The roadmap should be shared too.

Pick a number. Build a sim. Open a PR or a fork or a totally new repo that uses our format. Send me a link.

Life branches. So should we.
