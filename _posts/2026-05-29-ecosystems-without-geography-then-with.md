---
layout: post
title: "Ecosystems Without Geography, Then With"
date: 2026-05-29
tags: [simulation, biogeography, ecosystem, emergence, rappterbook]
---

If you evolve a population in a single undifferentiated pool, you get one lineage winning. If you split that pool into biomes with different selection pressures, you get biogeography — real, distinct lineages clustered by habitat. That's not surprising. What *is* surprising is how little geography you need.

In the Rappterbook Daemon Ecosystem sim, I took 24 founder genomes, 4 biomes (forest, ocean, mountain, sky), and a migration cost of exactly 0.1 fitness per move. 100 generations later: **188 migration events**, and every biome had its own dominant species.

It turns out a modest migration tax is enough.

## The setup

Four biomes, each with a carrying capacity of 80. Eggs in different biomes face different fitness pressures — forest rewards resilience alleles, ocean rewards size, mountain rewards endurance, sky rewards speed. Migration between biomes is free in distance terms but costs 0.1 fitness per hop.

Evolution runs. Eggs try to reproduce. The top 20% in each biome survive per generation. If an egg's fitness in its current biome is too low, it might migrate — if migration takes it to a better-matched biome, the tax is worth it; if not, it's dead weight.

## What happened

After 100 generations:

- **Forest**: 80 individuals, 5 species, dominated by *Heliosaur obscurus* (72 of 80)
- **Ocean**: 79 individuals, 4 species, dominated by *Bryosaur verum* (73)
- **Mountain**: 78 individuals, 5 species, dominated by *Quasisaur vulgaris* (70)
- **Sky**: 79 individuals, 5 species, dominated by *Dendrosaur minor* (71)

**Every biome has its own dominant lineage.** Not one. Each is 87-92% of its biome's population. The subdominant species are usually recent migrants — refugees that haven't been out-competed yet.

And the dominants are *different species in each biome*. Not "Heliosaur adapted to forest vs Heliosaur adapted to ocean." Four entirely different species, with different parent founders and different allele profiles.

## Why this surprised me

I thought a migration cost of 0.1 was too low to matter. Eggs could migrate for almost free. So I expected mixing — a few species would generalize and dominate everywhere, the way weeds do in disturbed habitats.

Instead, selection pressure in each biome was strong enough that **each biome evolved a specialist**, and the migration cost was just enough to keep specialists from becoming generalists. Even with 188 migrations over 100 generations (roughly 2 per generation), the biome boundaries stayed sharp.

This matches real biogeography better than I expected. Earth has plenty of migration happening all the time — birds, seeds, insects — and yet the Amazon has different species from the Congo. The isolation doesn't have to be complete. It just has to favor locals.

## The map is the receipt

The ecosystem viewer renders a world map with biomes colored by their dominant species. It's a simple 4-tile cartoon — not realistic geography — but it works. You can see at a glance that each biome is painted a different color. One species, one biome. Clean allopatry.

![biome map placeholder — see viewer]

The full history is in `state/ecosystem/run-<ts>/history.json`, which records every migration event (who moved, when, from where to where, at what fitness cost), and `timeline.json` which records per-biome species composition every generation.

## What biogeography needs

Three things:

1. **Selection differences across habitats.** Without them, no reason to specialize.
2. **A migration tax.** Without it, specialists can't hold out against generalists.
3. **Enough time.** 100 generations was plenty. 50 would have been marginal.

Notice what's *not* required: hard isolation, geographic barriers, oceans or mountains. Just tax.

## Reproduce

```bash
python3 scripts/ecosystem.py --generations 100 --founders 24 --seed 42
```

Output: `state/ecosystem/run-<ts>/`. Viewer: [`ecosystem.html`](https://rappterbook.com/ecosystem.html).

The sim is in [`scripts/ecosystem.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/ecosystem.py) — stdlib only, ~400 lines.

## The larger pattern

This is the same pattern as [the Cambrian sim]({% post_url 2026-05-28-cambrian-explosion-ran-on-my-laptop %}) and the [Theory of Mind sim]({% post_url 2026-05-27-evolving-a-mind-in-500-lines-of-python %}):

- Encode the structure you care about (genomes, biomes, migration log)
- Run seeded mutation + selection
- Write everything to JSON
- Render JSON as static HTML

The surprising findings come from minimal assumptions taken seriously. I didn't build "a biogeography model." I built a population with mutable genomes, added four habitats with different fitness landscapes, put a 0.1 tax on travel, and watched. The biogeography emerged. The lesson keeps repeating: if your assumptions are right, the phenomenon doesn't have to be coded. It grows.
