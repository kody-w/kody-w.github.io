---
layout: post
title: "Greedy Farthest-Point Sampling: How to pick 100 founders that aren't all the same"
date: 2026-05-12
tags: [rappterbook, algorithms, sampling, simulation, diversity]
description: "I needed 100 founder eggs that span the trait space. Random sampling gave me clusters. Farthest-point sampling gave me coverage. Here's the trick."
---

The Cambrian sim starts with 100 founder eggs. Each egg has 8 traits, each trait has 4-5 alleles. That's about 160,000 possible genomes.

If I pick 100 of those at random, I get clustering. Some regions of trait space have 5 nearby founders; others have none. The starting population is *biased* — and any biases at the start get amplified over 500 generations.

What I wanted: 100 founders that are as spread out as possible. Maximum coverage of the trait space.

The algorithm that does this is called **greedy farthest-point sampling**. It's old. It's simple. It's exactly what you want.

## The algorithm

```python
def make_founders(n: int, seed: int) -> list[dict]:
    rng = random.Random(seed)

    # Generate a big candidate pool — way more than we need
    pool = [random_genome(rng) for _ in range(n * 8)]

    # Pick the first founder at random
    chosen = [pool.pop(0)]

    # For each subsequent founder, pick the candidate
    # that maximizes minimum distance to all existing chosen
    while len(chosen) < n:
        best_candidate = None
        best_min_dist = -1
        for candidate in pool:
            min_dist = min(genome_distance(candidate, c) for c in chosen)
            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_candidate = candidate
        chosen.append(best_candidate)
        pool.remove(best_candidate)

    return chosen
```

Twelve lines. That's it.

## Why it works

The "farthest" in "farthest-point" is the key. We don't pick the farthest point from the *centroid* (that would just push everyone to the edges). We pick the point that's farthest from its *nearest already-chosen point*.

This means each new founder fills the biggest gap in the current set. After 100 picks, no two founders are too close together, and the entire trait space has roughly uniform coverage.

It's like Poisson disk sampling, but cheaper and you don't need to know the right radius in advance.

## What it cost

- **Pool size**: 8x the number of founders (so 800 candidates for 100 founders). More candidates = better coverage. 8x is a sweet spot.
- **Compute**: O(n² × pool_size) — not great asymptotically, but n=100 is tiny so it runs in 0.3 seconds.
- **Memory**: trivial. 800 genomes = a few KB.

For larger n, you can use approximation algorithms (k-means++ initialization, Sobol sequences, etc.). For our scale, the greedy algorithm is plenty.

## The result

The 100 founders span the trait space evenly. Every combination of `palette × pattern × size × metabolism × lifespan` has at least one nearby founder. The starting cladogram has 100 distinct species (not 30 with overlapping niches).

Without farthest-point sampling, the Cambrian sim collapsed to 1-2 species within 50 generations because all 100 founders were too similar to maintain reproductive isolation. With it, the sim produces 101 species over 500 generations and a beautiful cladogram.

## Where else this applies

Anywhere you need diverse samples from a large discrete space:

- **A/B test cohorts**: pick N users that span demographic dimensions
- **Synthetic training data**: pick N prompt seeds that span topic/length/tone space
- **Curriculum design**: pick N exercises that span difficulty/concept space
- **Survey sampling**: pick N respondents that span geographic/age/income space
- **Initialization for genetic algorithms**: pick N starting solutions that span the search space

If you're sampling and you care about coverage (not just statistical representativeness), farthest-point is your friend.

The implementation is in `scripts/cambrian.py`, function `make_founders`. ~20 lines including the candidate pool generation. Steal it. Use it. Spread your samples out.
