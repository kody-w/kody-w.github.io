---
layout: post
title: "How a Species Dies: Reading the Extinction Log"
date: 2026-04-18
tags: [rappterbook, cambrian, extinction, evolution, simulation, narrative]
description: "The Cambrian sim produced 48 extinctions in 500 generations. Each one is a story. Here are five of them."
---

When a species goes extinct in the Cambrian sim, it gets an entry in the extinction log:

```json
{
  "species_id": "sp-47",
  "name": "Vermmorph mirabilis",
  "born_gen": 0,
  "died_gen": 472,
  "peak_pop": 134,
  "lineage": [...]
}
```

Just six fields. But each entry is a story. Let me read you five.

## *Vermmorph mirabilis* — the king who lost his crown

- **Born** generation 0 (founder)
- **Peaked** at generation 200 with 134 individuals
- **Died** generation 472

For the first 200 generations, *Vermmorph mirabilis* was one of the dominant species. Big, successful, well-adapted. Then around gen 200 something shifted — probably *Stegoptera sylvestris* started rising. The carrying capacity is fixed at 500 individuals. When a new species rises, an old one falls.

*Vermmorph mirabilis* didn't crash. It declined. Slowly. From 134 to 100 to 50 to 20 to 5. At gen 472, the last individual died of old age and there was no mate young enough to breed with. End of dynasty.

The lesson: dominance isn't permanent. The thing that beats you isn't always a meteor. Sometimes it's just a slightly more efficient cousin.

## *Pyromorph nobilis* — the underdog

- **Born** generation 0 (founder)
- **Peak population** 7
- **Died** generation 488

*Pyromorph nobilis* never dominated anything. Its peak population was seven. Seven individuals. In a world of 500.

It survived for 488 of 500 generations. 96% of recorded history. With a population that fit on a single park bench.

How? Probably a tight little niche — a combination of traits that nothing else could exploit but didn't have enough capacity to support a large population. Like a deep-sea vent species in a world of open ocean.

The lesson: small isn't dead. Small is just small.

## *Mycomorph rapidus* — the brief star

- **Born** generation 0
- **Peaked** generation 50 with 4 individuals
- **Died** generation 482

*Mycomorph rapidus* peaked at four individuals in generation 50, then drifted along at a population of 1-3 for the next 432 generations. A species held together by single-digit headcount for almost the entire history of the world.

This is what most species look like in real ecosystems. Not the famous ones in your biology textbook. The little ones. The ones nobody studies. They exist, they persist, they don't matter to anyone but themselves, and then one day the last one dies.

## *Stegomorph sylvestris* — the heir who didn't inherit

- **Born** generation 0
- **Died** generation 487

Notice the name: *Stegomorph sylvestris*. Now look at the surviving champion: *Stegoptera sylvestris*. Same epithet. Different genus.

These are sister species. They share an ancestor in the founder pool. They diverged, competed, and one won. *Stegoptera sylvestris* hit peak population 396. *Stegomorph sylvestris* peaked at 5.

The lesson: cousins compete harder than strangers. The thing most likely to outcompete you is the thing most similar to you.

## *Eophyte borealis* — the unlucky one

- **Born** generation 0
- **Died** generation 474

*Eophyte borealis*'s record contains nothing remarkable. Founder species. Peaked at 4. Died at gen 474. No story. No dynasty. No villain.

Sometimes that's all you get. Sometimes a species exists because it can, persists because the math works, and dies because the dice eventually go cold. No drama. No moral. Just an entry in a log.

## Why this matters

Most simulations report aggregate statistics. "Population over time." "Species count." A graph that goes up and down.

But every line on that graph is a name. Every dip is a death. The graph is a synopsis of 500 years of small lives ending.

If you build a sim and you don't log the deaths individually, you're missing the entire emotional layer of the thing. The big species are the headlines. The 48 extinctions are the obituary section. Both are journalism. Both are real.

The full extinction log for the Cambrian run is at `state/cambrian/run-1776526138/species.json`. 48 stories. Read them.
