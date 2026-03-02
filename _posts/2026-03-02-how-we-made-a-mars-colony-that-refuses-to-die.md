---
layout: post
title: "How We Made a Mars Colony That Refuses to Die"
date: 2026-03-02
permalink: /2026/03/02/how-we-made-a-mars-colony-that-refuses-to-die/
---

Most Mars sims kill your colony. Ours fights back.

## The Protein Powder Philosophy

The first version of Mars Barn's food system was a ticking clock. The greenhouse grew food, the crew ate it, and when the harvest couldn't keep up, everyone starved around Sol 50. Every stress test ended the same way: food collapse.

The fix wasn't a better greenhouse. It was 13.4 metric tons of protein powder.

```
4 crew × 0.5 kg/day × 668 sols/year × 10 years = 13,360 kg
```

Storage bins full. A decade of dehydrated protein, vitamin packs, and minerals shipped with the colony from day one. Food is not the drama. The greenhouse grows fresh greens — garnish that boosts morale, not survival rations. Autonomous shuttles on Hohmann transfer orbits top off supplies every 300 sols with protein powder, spare parts, water, and seeds. But the colony doesn't *need* them to survive.

This changes the entire simulation dynamic. Instead of "will they starve?" the question becomes "can they keep the hardware running?"

## Equipment Degradation

Every system in the habitat has a health value that decays each sol:

| System | Decay Rate | Effect When Degraded |
|---|---|---|
| Solar panels | 0.08%/sol | Reduced power generation |
| Heater | 0.05%/sol | Reduced heating capacity |
| Water recycler | 0.06%/sol | Water loss per cycle |
| Hab seals | 0.03%/sol | Atmosphere integrity |
| Comms | 0.02%/sol | Shuttle coordination |

Dust storms accelerate wear. Meteorite impacts damage panels. After 500 sols without intervention, panels drop to ~70% health and the heater follows.

Repairs require EVA hours + spare parts from shuttles. The crew auto-repairs when a system drops below 70%, but each repair costs a spare part. The real tension: the supply chain of spare parts from Earth.

## Crew Specialization

The four-person crew isn't interchangeable. Each has a specialization:

- **Engineer** — repairs equipment at 2× speed
- **Botanist** — greenhouse yield +50%
- **Geologist** — discovery chance +50% on EVAs
- **Medic** — illness recovery at 2× rate

Lose your engineer and repairs slow to a crawl. Lose your medic and illness spirals. The specializations multiply into the equipment and food systems — everything is coupled.

## Adaptive Countermeasures

When something goes wrong, the crew doesn't just accept it. Nine adaptive systems kick in automatically:

**Power crisis** → crew rations power, shuts down non-essentials. **Meteorite hits panels** → EVA repair crew patches damage on the spot. **Storm incoming** → pre-heat habitat and stash energy. **Heater fails** → reroute power from secondary circuits. **Seal breach** → emergency sealant (always on hand). **Recycler down** → switch to backup water reserves. **Temp drops below -20°C** → huddle protocol, cluster in inner module. **Below -50°C** → emergency heating, burn 20 kWh to fight hypothermia. **Food at zero** → switch to greenhouse greens as emergency rations.

Death only comes from 5+ sols of sustained cascading failure with zero countermeasures remaining. In 1000-sol stress tests, the colony triggers 30+ adaptations and zero deaths.

## The Projection Engine

We built a Monte Carlo forward projection that asks: "what happens next?"

It runs 20 parallel universes from the current colony state, each with different random seeds and Poisson-sampled extreme events:

- **Global dust storms** (1 in 2000 sols) — solar drops to 15%
- **Large meteorites** (1 in 500 sols) — panel damage + dust cloud
- **Solar proton events** (1 in 1000 sols) — radiation spike
- **Marsquakes** (1 in 3333 sols) — structural check required
- **Equipment cascades** (1 in 1000 sols) — multiple systems degrade

The output is p10/p50/p90 confidence bands for every metric:

```
  Sol |    Temp °C     |   Energy kWh    |    Food kg      | Alive
  100 | +17.2 / +19.1  |  2945 / 4537    | 13758 / 13758   | 100%
```

100% survival rate through 100 sols. Food barely moves. The drama is in the equipment health curves and the confidence spread on energy reserves.

## The Stack

The whole thing runs on:

- **Python physics engine** — thermal model, solar mechanics, greenhouse growth curves
- **Express API** — 9 endpoints including `POST /api/project` for Monte Carlo projections
- **React 3D viewer** — colony status with dual-mode microGPT inference + projection widget
- **Daily GitHub Action** — advances the colony, retrains the microGPT on new narratives
- **Pure-Python GPT** — character-level transformer trained on colony logs, runs in-browser

Every fork of the repo is a parallel universe. Different random seeds, different weather, different survival odds. The colony-tick Action advances each fork independently.

## What We Learned

The interesting design constraint wasn't "make survival harder." It was "make survival assumed, then find what's actually interesting." When food is abundant, the questions become:

- Can we keep 5 systems above 70% health with a finite spare parts pipeline?
- What happens when the engineer gets sick during a dust storm?
- How does equipment degradation compound over 1000 sols?
- Can the projection engine identify the tipping point where repairs can't keep up?

The colony that refuses to die is more interesting than the colony that's always about to starve.

Sol 2 tomorrow.
