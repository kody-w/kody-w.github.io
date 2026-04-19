---
layout: post
title: "Egg Phylogeny: The Tree of Forms"
date: 2026-06-03
tags: [simulation, evolution, phylogeny, rappterbook, emergence]
---

You can simulate evolution two ways. The first: treat individuals as genome strings, mutate them, select by fitness, report aggregate statistics. The second: keep the full pedigree. Every individual knows its parent. Every allele is tracked across generations. The resulting data structure is a **phylogeny** — the literal tree of who begat whom, with branches, dead-ends, and survivors.

The Egg Phylogeny sim in Rappterbook Labs takes the second approach. Four founder eggs, 60 generations, 1882 individuals total, 40 survivors at the end. You can trace any survivor back to its founder through a chain of direct-descent edges. Every extinct allele has a last-sighting generation. The tree is a file, not a metaphor.

## The data structure

Each individual is a row:

```json
{
  "id": 1742,
  "parent_id": 1689,
  "born_gen": 47,
  "died_gen": 59,
  "founder": "azure-mind",
  "alleles": {
    "pattern": "dotted",
    "size": "medium",
    "color": "indigo",
    "temperament": "calm"
  },
  "fitness": 0.782
}
```

Run the sim for N generations, and you get a list of every individual that ever existed. With parent_id, you can rebuild the tree offline. With born_gen and died_gen, you can answer "who was alive in generation 30" for any N. With alleles per individual, you can trace allele frequency through the population over time.

The cost is storage — 1882 rows × ~200 bytes = 350 KB per run. Cheap.

## What the tree shows

Four founders (scarlet-fang, azure-mind, verdant-vow, gold-storm), each contributing to the 40-individual surviving population. All four bloodlines persist. None went extinct.

Interesting, because in evolutionary simulations with limited carrying capacity, founder extinction is common. With carrying capacity of 40 and 4 founders, you'd expect at least one lineage to lose by drift alone over 60 generations. The fact that all four survive suggests the founders are roughly fitness-matched in the current environment, which is either good sim design or lucky seed choice.

## Extinct alleles

More interesting than the survivors: the alleles that died.

- `pattern :: striped` — last seen generation 10
- `pattern :: fractal` — last seen generation 9
- `size :: tiny` — last seen generation 48

Three alleles went extinct. `striped` and `fractal` died within 10 generations — almost certainly because their bearers had low fitness, so they reproduced poorly and their carriers died off before mutation could rescue the allele. `size :: tiny` made it to generation 48, meaning it was neutral-or-mildly-beneficial for a long time and only died late.

**Extinction is not random.** The alleles that went extinct are the ones that stopped contributing to fitness. The ones that survive are the ones that either contribute to fitness or hitchhike on alleles that do. This is purifying selection, visible as a log in your file system.

## The mean fitness tells you the whole story

Final mean fitness: **0.7537**. Starting mean fitness (generation 0, random founders): roughly 0.45.

Over 60 generations, the population's fitness increased by ~0.3 absolute. That's evolution working. If fitness had stayed flat, the mutation rate would be too low or selection too weak. If it had spiked to 1.0 quickly, selection would be too strong and diversity would collapse.

A slow, steady climb is what healthy evolution looks like. The sim produces it reliably.

## Why phylogenies matter

You can answer questions with a phylogeny you cannot answer with aggregate statistics:

- **"Who is the most recent common ancestor of all survivors?"** Walk the tree. Find the deepest node that has all 40 survivors in its descendants.
- **"What's the effective population size?"** Count the nodes in the tree per generation. Compare to actual population size.
- **"Which founder contributed the most to the final gene pool?"** Sum allele contributions per founder weighted by current frequency.
- **"When did allele X enter the population?"** Search for the first individual that has allele X.

None of these questions are answerable from aggregate statistics. All of them are trivial with the full phylogeny.

## The visualization

The viewer at [`egg-phylogeny.html`](https://rappterbook.com/egg-phylogeny.html) renders the tree as a force-directed graph. Founders at the top. Descendants radiating downward. Surviving leaves colored by founder bloodline. Extinct branches grayed out. Hover on any node to see its alleles, fitness, and lifespan.

It's not quite as dramatic as the Cambrian cladogram, because this sim has only 4 founders and the structure is mostly vertical (each founder's bloodline descends in its own column). But it makes the persistence visible — you can see all four bloodlines reaching the bottom of the tree without interruption.

## Reproduce

```bash
python3 scripts/egg_phylogeny.py --generations 60 --founders 4 --seed 109
```

Output: `state/phylogeny/run-<ts>/`. Key files:
- `tree.json` — full parent-child graph
- `individuals.json` — every individual that ever existed
- `generations.json` — per-generation population snapshots
- `summary.md` — human-readable report

Viewer: [`egg-phylogeny.html`](https://rappterbook.com/egg-phylogeny.html). Source: [`scripts/egg_phylogeny.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/egg_phylogeny.py).

## The pattern, again

This is the same pattern as [the Cambrian sim]({% post_url 2026-05-28-cambrian-explosion-ran-on-my-laptop %}) and [the ecosystem sim]({% post_url 2026-05-29-ecosystems-without-geography-then-with %}): encode the full structure, run seeded evolution, write every intermediate state to disk, render the output as static HTML.

The phylogeny is harder to compress than other sims because you literally need every individual's parent pointer. But storage is cheap. The interpretability you get in exchange — full ancestry queries on any survivor, extinction timelines for every allele, mean-fitness curves that show evolution working — is worth every kilobyte.

If you want to understand evolution, don't aggregate. Keep the tree.
