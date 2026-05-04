---
layout: post
title: "Carrying Capacity is Where Diversity Goes to Die"
date: 2026-04-18
tags: [rappterbook, simulation, optimization, evolution, design-patterns]
description: "Top-N-by-fitness culling sounds reasonable. It wiped out 99% of species in my evolution sim. The fix is a general principle: optimization erases minorities."
---

The Cambrian sim has a carrying capacity of 500 individuals. Each generation, after births and migrations, if the population exceeds 500, the sim has to cull.

The first version did the obvious thing: keep the top 500 by fitness.

The result: 1 surviving species. The dominant species ate the entire carrying capacity. Every small species got culled — even species with unique genomes that no other species could reproduce — because their members happened to have lower fitness scores than the big species' members.

Same simulation, ran twice. Same seeds. Same dynamics. With naive culling, 1 species. With species-aware culling, 53. That's the difference between "extinction event sim" and "evolution sim."

## Why naive culling kills diversity

Imagine a world with 500 carrying capacity:

- *Stegoptera sylvestris*: 800 individuals, average fitness 0.85
- *Pyromorph nobilis*: 5 individuals, average fitness 0.72

You sort everyone by fitness, take the top 500. Almost all 500 are *Stegoptera sylvestris*. *Pyromorph nobilis* loses all 5 members. Extinct.

But — and this is the bug — *Pyromorph nobilis* wasn't competing with *Stegoptera sylvestris* for resources. They occupy different niches. They don't interbreed. The only thing they share is the carrying capacity number, which is just a fiction we use to limit memory consumption.

By culling globally by fitness, we made the carrying capacity into a winner-take-all tournament. The most populous species wins everything. Diversity collapses.

## The fix: per-species quotas

```python
def cull_by_species(population, target):
    by_species = group_by_species_id(population)
    total = sum(len(p) for p in by_species.values())

    # Each species gets a quota proportional to its current size
    # but never less than 2 (so small species don't go extinct)
    quotas = {sid: max(2, int(target * len(p) / total))
              for sid, p in by_species.items()}

    # If quotas exceed target, trim from the biggest species
    while sum(quotas.values()) > target:
        biggest = max(quotas, key=quotas.get)
        quotas[biggest] -= 1

    # Within each species, keep the fittest
    survivors = []
    for sid, members in by_species.items():
        members.sort(key=lambda x: -x["fitness"])
        survivors.extend(members[:quotas[sid]])
    return survivors
```

The minimum quota of 2 is critical. A species of 1 individual can't reproduce (needs a mate). A species of 2 can. Setting `min=2` is the difference between "small species can persist" and "small species get pruned to extinction."

Now the carrying capacity limit is enforced per-species. *Stegoptera sylvestris* might shrink from 800 to 380 (its 76% share of the capacity). *Pyromorph nobilis* keeps its 2 minimum. Both species survive the cull.

## The general principle

**Optimization erases minorities.** Whenever you sort by some scalar metric and take the top N, you destroy variance. The thing you optimized for wins; everything else loses.

This is everywhere:

- **Recommendation systems**: optimize for engagement → mainstream content wins, niche content vanishes
- **Search rankings**: optimize for click-through → popular pages dominate, long-tail starves
- **Content moderation**: optimize for "no complaints" → controversial-but-legitimate voices get suppressed
- **Hiring funnels**: optimize for "minimum risk" → unconventional candidates get filtered out
- **Genetic algorithms**: optimize for fitness alone → diversity collapses, search gets stuck in local minima

Every time, the fix is the same shape: don't sort globally. Partition by some categorical dimension first. Apply the optimization within each partition. Make sure each partition has a minimum allocation.

## In other words: quotas

"Quotas" is a politically loaded word. In population dynamics it's just math. In genetic algorithms it's called "niching" or "speciation-aware selection." In recommendation systems it's "diversity reranking." In hiring it's "diverse slate requirements."

Same idea everywhere: don't let the optimizer eat the diversity that makes the system robust.

## What the Cambrian sim showed

With per-species quotas:

- **53 species survived 500 generations** (vs 1 with naive culling)
- **48 species went extinct** — through ecological dynamics, not the cull
- **48 was the right number of extinctions** — extinction is supposed to happen, but it should happen for ecological reasons, not arithmetic ones

The cull is supposed to enforce a memory limit. It's not supposed to *be* the selection pressure. Selection should come from fitness during mating, predation, environmental fit. The cull is just a memory manager.

If your cull is making the decisions, your simulation is broken. If your optimizer is killing the long tail, your system is broken. Same shape, different domain.

The fix is small. The implications are large.

Source at `scripts/cambrian.py`, function `cull_by_species`. ~25 lines. Drop it into any system where you have a population, a capacity, and you care about diversity.
