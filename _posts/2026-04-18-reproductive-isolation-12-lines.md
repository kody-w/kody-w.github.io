---
layout: post
title: "Reproductive Isolation in 12 Lines of Python"
date: 2026-04-18
tags: [rappterbook, evolution, speciation, simulation, code-walkthrough]
description: "How a hard genome distance threshold turns a single interbreeding population into 100+ distinct species. The minimum viable speciation engine."
---

In real biology, two organisms either can produce fertile offspring or they can't. Tigers and lions can interbreed (sort of). Tigers and zebras cannot. The line between "same species" and "different species" is reproductive isolation.

I needed this for the Cambrian sim. Without it, all 100 founders would just blend into one big interbreeding goo and there'd be no speciation.

Here's the entire reproductive isolation engine, from `scripts/cambrian.py`:

```python
HARD_ISOLATION = 5  # 5+ trait differences = different species

def cambrian_compat(a: dict, b: dict) -> float:
    """Compatibility with hard reproductive barrier."""
    d = genome_distance(a, b)
    if d >= HARD_ISOLATION:
        return 0.0  # cannot interbreed at all
    if d == 0:
        return 0.5  # clones can breed (founder seeding)
    # smooth ramp from d=1 (high compat) to d=4 (just barely compat)
    return max(0.05, 1.0 - (d / HARD_ISOLATION))
```

Twelve lines. That's it. That's the whole speciation engine.

## What it does

Every individual has a genome — 8 traits, each with one of 4-5 alleles. `genome_distance()` counts how many traits differ between two individuals.

- **Distance 0** (identical clones): can breed, compatibility 0.5
- **Distance 1** (one trait differs): compat 0.8 — basically family
- **Distance 2-3**: compat declines smoothly — same species, getting weird
- **Distance 4**: compat 0.2 — barely viable
- **Distance 5+**: compat 0.0 — different species, no offspring possible

That last line is the entire trick. The sim asks "can these two breed?" The function returns 0.0 if their genomes are too different. The pair gets rejected. Mating doesn't happen. Their lineages never merge.

## Why it works

Without `HARD_ISOLATION`, every individual could potentially breed with every other individual. Mutations would homogenize the whole population. You'd get one species that drifts around the trait space forever. Boring.

With `HARD_ISOLATION = 5`, the trait space gets *partitioned*. Once a sub-population drifts more than 5 traits away from its sibling sub-population, the bridge is burned. They can never merge back. They're different species.

This is exactly how it works in nature. Once two populations stop interbreeding — for whatever reason — selection pressures send them in different directions, and after enough time their genomes are too different to merge even if they meet again. Reproductive isolation precedes morphological divergence. The distance comes first.

## Tuning the threshold

Why 5? Why not 3 or 7?

- **HARD_ISOLATION = 3**: too aggressive. Founders speciate immediately. You get 100 species at gen 0 and most go extinct because they can't find mates.
- **HARD_ISOLATION = 7**: too loose. The trait space is only 8 traits wide. Distance 7 means almost completely different — by then, they would have speciated naturally anyway. You end up with 1-2 species total.
- **HARD_ISOLATION = 5**: sweet spot. Allows founders to coexist as a network of related species, but creates real reproductive barriers that drive divergence.

The number isn't magic. It's a knob. In a real simulation of a real species, you'd tune it to match observed hybridization rates. For our purposes, 5 produces beautiful cladograms.

## The general principle

If you're simulating populations and your sim doesn't have reproductive isolation, your sim doesn't have speciation. You have one species drifting through configuration space forever.

Add the hard barrier. It's twelve lines. It's the difference between a population model and an evolution model.

The full sim is at `scripts/cambrian.py` in the [Rappterbook repo](https://github.com/kody-w/rappterbook). Find the function. Tune the constant. Run it. Watch life branch.
