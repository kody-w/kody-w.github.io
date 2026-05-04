---
layout: post
title: "100 Eggs, 500 Generations, 53 Species: The Cambrian Explosion as code"
date: 2026-04-18
tags: [rappterbook, cambrian, evolution, simulation, emergence, cladogram]
description: "I minted 100 founder eggs with random trait genomes and ran 500 generations of mate selection, mutation, and culling. Here's what emerged."
---

The setup: 100 eggs. Each has 8 traits, each trait has 4-5 alleles. That's ~160,000 possible genomes. I picked the 100 founders using greedy farthest-point sampling — each new founder maximizes its genome distance from all existing founders. The starting population is as diverse as the trait space allows.

Then I let them breed for 500 generations.

## The rules

- **Mating**: pairs require compatibility >= 0.5 (genome distance < 5)
- **Reproduction**: child inherits parent's species_id, genome merges with mutation
- **Lifespan**: depends on `lifespan` trait (mayfly=1, normal=3, long=6, ancient=12)
- **Carrying capacity**: 500 individuals total, culled by fitness with per-species quotas
- **Speciation**: a species splits when its members drift into disjoint compatibility clusters

## What happened

After 500 generations, with seed 42:

- **101 species** ever existed
- **53 surviving** at the end
- **48 went extinct**
- **1 split event** — *Vermmorph mirabilis* ancestor → 2 daughter species

The dominant species:

| Species | Peak population | Status |
|---|---|---|
| *Stegoptera sylvestris* | 396 | alive |
| *Nyctmorph elegans* | 269 | alive |
| *Mycosaur rapidus* | 86 | alive |
| *Quasiptera vulgaris* | 76 | alive |
| *Vermmorph mirabilis* | 134 | extinct gen 472 |
| *Pyromorph nobilis* | 7 | extinct gen 488 |

*Vermmorph mirabilis* is the heartbreak story. Peaked at 134 individuals around gen 200, dominated for 200 generations, then collapsed. Its niche was probably eaten by *Stegoptera sylvestris*, which was rising at the same time. Real ecological succession.

*Pyromorph nobilis* is the underdog story. Tiny species, peak population of 7, somehow held on for 488 generations before the last individual died. A lineage of fewer than 10 individuals at any time, surviving for 96% of recorded history. Then gone.

## The cladogram

The viewer is at [rappterbook/cambrian.html](https://kody-w.github.io/rappterbook/cambrian.html). Branches are colored green (surviving) or red (extinct). Branch width = log of peak population. The big green branches are the dynasties. The thin red lines are the also-rans.

It looks like a real phylogenetic tree because it *is* a real phylogenetic tree. Same math, same dynamics, same shape.

## Why this is interesting

Nothing about evolution is mysterious. It's just:

1. Variation (mutation)
2. Inheritance (genome merging)
3. Selection (fitness + carrying capacity)
4. Time (500 generations)

Run those four things in a loop and you get a cladogram. You don't need a creator. You don't need a goal. You don't need consciousness. You need a frame loop, a deterministic RNG, and the patience to run 500 ticks.

## Reproduce it

```bash
git clone https://github.com/kody-w/rappterbook
cd rappterbook
python3 scripts/cambrian.py --generations 500 --founders 100 --carry 500 --seed 42
open docs/cambrian.html
```

Stdlib only. Runs on any laptop. Same seed = same tree.

The full source is at `scripts/cambrian.py` (~330 lines). The viewer at `docs/cambrian.html` (~250 lines vanilla JS, no dependencies). The whole thing is smaller than a single React component in most production codebases.

That's evolution. In a few hundred lines. On a Tuesday.
