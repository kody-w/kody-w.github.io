---
layout: post
title: "Lineage-Inherited IDs: A small idea with big consequences"
date: 2026-04-18
tags: [rappterbook, evolution, identity, simulation, design-patterns]
description: "I almost shipped a speciation engine that was wrong. The fix was changing one line: children inherit species_id from parent instead of being clustered every frame."
---

I built a Cambrian sim. 100 founders, 500 generations, the whole pitch. Ran it. Got 1 surviving species.

Wait, what?

The first version of the sim reassigned species IDs every generation by clustering individuals with similar genomes. The logic seemed reasonable: "individuals that can interbreed are the same species." Cluster them, label the clusters, done.

The bug was subtle. Two individuals could have similar genomes for a few generations (assigned to "species A"), drift apart (assigned to different species), then drift back together a few generations later (re-assigned back to species A). Species kept *merging* because the clustering had no memory.

Real species don't work like that. Once you're a different species, you're a different species *forever*, even if your traits happen to drift back into compatibility range with your cousin lineage. Reproductive isolation is one-way. It doesn't un-isolate.

## The fix

Children inherit species ID from parent. That's it.

```python
def breed(parent_a, parent_b, species_id):
    child_genome = merge_genomes(parent_a["genome"], parent_b["genome"])
    return {
        "genome": child_genome,
        "species_id": species_id,  # inherited, not computed
        "parent_a": parent_a["id"],
        "parent_b": parent_b["id"],
    }
```

The species_id is metadata. It's a label that persists across generations regardless of what the genome does. A child of two *Stegoptera sylvestris* parents is *Stegoptera sylvestris*, even if its genome happens to look identical to some unrelated individual in another species.

## When does a new species appear, then?

Splits. Periodically (every 5 frames) the sim runs split detection on each species:

1. Look at all individuals with species_id = X
2. Run union-find on them with the compatibility function
3. If they form 2+ disjoint clusters (no member of cluster A can breed with any member of cluster B) → SPLIT
4. The smaller cluster gets a new species_id and a new daughter species name

This is the only path to new species. No clustering. No re-labeling. Just "this lineage has internally fragmented, the smaller half is now its own species."

## What this unlocked

- **101 species emerged** in the 500-gen run instead of 1
- **48 extinctions tracked** with real birth/death generations
- **1 split event** — *Vermmorph* lineage daughter species
- The cladogram has *real branches*, not just clusters

The reason this matters: species in the sim now have *identity* over time. *Stegoptera sylvestris* at gen 200 is the same species as *Stegoptera sylvestris* at gen 400 by definition, regardless of how the genome drifted. The lineage is the species. Not the current trait values.

## The general principle

If you're modeling anything with identity over time — species, characters, organizations, accounts, threads — never compute identity from current state. Inherit it from history. The label is a *fact about the past*, not a description of the present.

This is everywhere:

- A user account isn't "the email address" (which can change). It's the persistent ID assigned at signup.
- A git commit isn't "the file contents" (which can be reverted). It's the SHA.
- A species isn't "the gene pool" (which drifts). It's the unbroken lineage from the founders.

Mistakes here look like merging. Two things that were once separate get blurred together because their *current* state matches. Identity is preserved by lineage, not by similarity.

Twelve lines for the speciation engine. Three lines for the inheritance fix. Both critical. The Cambrian sim doesn't work without either.

Source at `scripts/cambrian.py` in the [Rappterbook repo](https://github.com/kody-w/rappterbook). Find `detect_internal_splits`. That's the engine.
