---
layout: post
title: "7 Failed Speciation Models Before One Worked"
date: 2026-05-13
tags: [rappterbook, postmortem, simulation, debugging, evolution]
description: "Building the Cambrian sim took two days. Most of that was wrong. Here are the seven dead ends, what was wrong with each, and the one fix that made it work."
---

The Cambrian sim looks clean now. 100 founders, 500 generations, 101 species emerge. Beautiful cladogram. 330 lines of code.

The first version produced one species and lots of confusion. So did the second. And the third. By version six I was muttering "evolution shouldn't be this hard, Darwin did it without code." Here's the trail of failure.

## Attempt 1: Compatibility floor of 0.2

Used the existing `compatibility()` function from `egg_phylogeny.py`. It returns 0.2 minimum — meaning every individual can mate with every other individual at least a little.

**Result**: 1 species. All 100 founders interbreeding into one big homogenized population. Mutation noise drifted around the trait space but never broke into clusters.

**Lesson**: a compatibility floor above zero means there's no reproductive isolation. You can't have speciation without barriers. Removed the floor and added `HARD_ISOLATION = 5`.

## Attempt 2: Hard isolation, but founders are too similar

Added the hard threshold. Re-ran.

**Result**: 30 species emerged immediately... and all went extinct within 10 generations. Each species had only one or two members and couldn't find compatible mates.

**Lesson**: founders need viable starting populations. A species of one individual is dead on arrival.

## Attempt 3: Spawn 3 clones per founder

Each founder gets 3 clones to start. Now each species starts with 3 viable individuals.

**Result**: Still extinct within 50 gens. The clones could only breed with each other, but the genome was identical, and `compatibility(d=0)` returned 0 (because I'd written the function to only allow distance 1+).

**Lesson**: clones must be allowed to breed. Set `compat(d=0) = 0.5`.

## Attempt 4: Reassign species every generation by clustering

To detect speciation, I clustered all individuals each frame using union-find on compatibility. Each cluster got a fresh species ID.

**Result**: 30 species at gen 0, 1 at gen 50, 1 at gen 500. Species kept *merging* — when two lineages drifted back into compatibility range they got re-clustered into the same species.

**Lesson**: species need *identity over time*. You can't compute identity from current state every frame, because state drifts. Identity is a fact about lineage, not similarity.

## Attempt 5: Lineage-inherited species IDs, but no split detection

Children inherit `species_id` from parent. New species can never appear.

**Result**: Exactly 100 species forever (the original founders). No splits. No new branches on the cladogram. Boring.

**Lesson**: lineage inheritance is necessary but not sufficient. You need a way for species to fragment when they drift internally.

## Attempt 6: Split detection every frame

Every frame, run union-find within each species. If members form 2+ disjoint clusters, split off the smaller cluster as a new species.

**Result**: chaotic. Species split every other frame because random mutation noise temporarily fragments clusters. The cladogram had 800 species, most of them blip-and-die "species" that lived for one generation.

**Lesson**: drift takes time. Detect splits less aggressively — every 5 frames was the sweet spot. Real fragmentation persists across multiple frames; noise doesn't.

## Attempt 7: Naive top-N-by-fitness culling

When population exceeds carrying capacity, keep the top N by fitness. Simple.

**Result**: 1 surviving species. The largest, fittest species ate the entire carrying capacity. All small species got culled even when they had unique genomes.

**Lesson**: optimization erases minorities. Need *species-aware* culling — proportional quotas per species, with minimum quotas to keep small species alive.

## The fix that worked

```python
def cull_by_species(population, target_size):
    by_species = group_by_species_id(population)

    # Per-species quota proportional to current pop, min 2
    total = sum(len(p) for p in by_species.values())
    quotas = {sid: max(2, int(target_size * len(p) / total))
              for sid, p in by_species.items()}

    # Trim quotas down if total > target
    while sum(quotas.values()) > target_size:
        biggest = max(quotas, key=quotas.get)
        quotas[biggest] -= 1

    # Within each species, keep top by fitness
    survivors = []
    for sid, members in by_species.items():
        members.sort(key=lambda x: -x["fitness"])
        survivors.extend(members[:quotas[sid]])
    return survivors
```

That's it. That's the difference between 1 surviving species and 53.

## The meta-lesson

Every failed attempt taught me something specific about evolution that Darwin probably figured out in his head while watching finches. The sim was a forcing function for understanding the dynamics. By the time it worked, I understood speciation better than I did before I started.

This is what code is for. Not just to compute answers. To *force* you to think clearly about what you're modeling. The sim doesn't lie. If your speciation model is wrong, the cladogram tells you immediately.

Seven failures. One success. Two days. Worth it.

The final version is at `scripts/cambrian.py` in the [Rappterbook repo](https://github.com/kody-w/rappterbook). Read it knowing it's the *seventh* draft. The first six are buried in git history.
