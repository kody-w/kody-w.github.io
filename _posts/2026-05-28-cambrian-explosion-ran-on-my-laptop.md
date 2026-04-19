---
layout: post
title: "The Cambrian Explosion Ran on My Laptop"
date: 2026-05-28
tags: [simulation, evolution, speciation, rappterbook, emergence]
---

I wanted to know whether "speciation" was a real phenomenon in evolutionary simulations or just clustering by another name. The Cambrian sim in Rappterbook Labs settles that question: from 100 founder eggs evolving for 500 generations, **101 distinct species emerged** — 37 extinct, 64 alive at the end. Real reproductive isolation, not k-means on a point cloud.

Here's how I know they're real species.

## The compatibility floor

Most "speciation" in simulations is faked by clustering agents on some attribute vector and calling clusters "species." That's clustering, not speciation. Real speciation requires reproductive isolation — members of different species *cannot* produce viable offspring, even if they try.

In the Cambrian sim, each egg has a genome. Two eggs can reproduce only if their compatibility score (a weighted sum of allele overlaps) crosses a floor value. A mutation pushes an offspring's genome one step away from its parents. When a lineage's genomes drift far enough from a sibling lineage that their compatibility drops below the floor, **they literally cannot interbreed anymore.** That's the definition of a new species.

No clusters. No labels. Just a threshold on the genome-distance metric that defines the biological wall.

## What the sim produced

Starting from 100 founder genomes randomly sampled from the allele pool, over 500 generations:

- **101 species** named total (founder + 1 speciation event)
- **37 species extinct** — populations hit zero, lineage terminates
- **64 species alive** at end of run
- A cladogram showing parent-child species relationships

The names are generated from Greek/Latin roots + morphological descriptors (*Heliosaur obscurus*, *Bryosaur verum*, *Quasisaur vulgaris*). They're not meaningful but they're memorable, which is the point.

## The cladogram is a receipt

The sim writes `cladogram.json` at the end of every run. It's a tree: founder → children species → their children → extant today. You can literally read it as a text file:

```
Ferrosaur australis (founder, gen 0, 124 alive)
├── Ferrosaur divergens (split at gen 87, extinct gen 312)
└── Ferrosaur obscurus (split at gen 203, 41 alive)
    └── Ferrosaur minimus (split at gen 378, 8 alive)
```

Each split records: parent species, the generation when genomic distance crossed the floor, and the allele changes responsible. You can trace any living species back to its founder through a chain of provable isolation events.

Try doing that with k-means.

## Why extinction matters

Of 101 species, 37 went extinct. That's not a bug — it's the load-bearing evidence that the sim is doing something real.

In a clustering-based "speciation" sim, clusters don't die. They dissolve or merge, but there's no population-zero event. In this sim, **37 lineages hit a final individual and then nothing**. Their alleles vanish from the pool. Their spot in the cladogram becomes a dead branch.

Some died young (within 20 generations of their split). Some made it to generation 400+ before the last individual fell. The distribution of extinction times matches what paleontologists see in real fossil records: a long tail, with most lineages dying young and a minority persisting for very long runs.

## What this costs

The full 100-founder × 500-generation run: about 8 seconds of CPU on a laptop. Python standard library only. Output is a `cladogram.json`, a `species.json` (with per-species population timeline), and a `timeline.json` for the whole population.

You can view it at [`cambrian.html`](https://rappterbook.com/cambrian.html). The viewer renders the cladogram as SVG, colors living species green and extinct red, and lets you click any species to see its full genome and lineage.

## Reproduce

```bash
git clone https://github.com/kody-w/rappterbook
cd rappterbook
python3 scripts/cambrian.py --generations 500 --founders 100 --seed 42
```

Raw output ends up in `state/cambrian/run-<timestamp>/`. The showpiece run is linked from `state/cambrian/latest.json`. Every run gets SHA-256 seeded so same inputs = same cladogram, byte for byte.

## The point

Real speciation is not clustering. It's a threshold crossing in a distance metric that maps onto a physical impossibility — two lineages *cannot* produce offspring even if placed in the same environment. Once you encode that correctly, you don't have to ask whether you're seeing speciation. You can read the reproductive-isolation events off the log.

It also means that ["101 species from 100 founders"](https://rappterbook.com/cambrian.html) is not a metaphor. It's a literal count of times the compatibility floor got crossed. The sim produced one more species than it started with because one lineage split cleanly around generation 260 and both halves survived.

A Cambrian explosion, on a laptop, in 8 seconds. Source: [`scripts/cambrian.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/cambrian.py).
