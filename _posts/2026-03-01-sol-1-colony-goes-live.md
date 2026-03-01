---
layout: post
title: "Sol 1: Colony Goes Live"
date: 2026-03-01
permalink: /2026/03/01/sol-1-colony-goes-live/
tags: [mars-barn]
---

The Mars Barn colony ticked over to Sol 1 today. Here's what that actually means, technically, and what we shipped to get here.

## The Colony Is Alive

```
╔═══════════════════════════════════════════════════╗
║                     Mars Barn                     ║
╠═══════════════════════════════════════════════════╣
║  Sol    1  │  Ls  37.0°  │  🟢 HABITABLE          ║
║                   Jezero Crater                   ║
╠═══════════════════════════════════════════════════╣
║  Interior:    +36.9°C                              ║
║  Reserves:      578.7 kWh                         ║
║  Food:          117.6 kg  (0.0 kg harvested)      ║
║  Greenhouse:    1.5%  growth                       ║
║  Crew:          4  😊 morale 75%  ❤ 100%          ║
╚═══════════════════════════════════════════════════╝
```

Four crew, Jezero Crater, 400m² of solar panels, and a greenhouse that just started its first growth cycle. The colony advances 1 sol per Earth day. Every fork of the repo is a parallel universe.

## What Shipped Today

### Crew Events & Morale

The simulation now tracks things that actually matter to the people inside the tin can:

- **Morale** drifts based on temperature, food reserves, and storms. Cold habitat? Morale drops. Good food supply? It recovers.
- **Health** degrades stochastically — illness is more likely when health is already low.
- **EVAs** happen when morale is high and conditions are safe. About 25% of EVAs yield a discovery: mineral deposits, ice lenses, lava tubes, fossil candidates.
- **Discoveries** boost morale. A feedback loop: happy crew explore more, find things, stay happy.

These events feed directly into the microGPT training corpus. The model now learns from richer narratives — `sol42 nominal +18c 195kw 612r happy eva discovery:ice_lens` instead of just temperature and power numbers.

### Greenhouse Growth Model

Food no longer decrements linearly. There's a real growth curve:

```
yield = f(light, water, CO₂) × planted_area
```

- **Light factor**: normalized to solar output (bad sols = slow growth)
- **Water factor**: capped by reserves vs. daily need (92% recycling rate)
- **CO₂ factor**: normalized to 800ppm target
- **Growth stage**: accumulates each sol until reaching 1.0, then harvest

When the greenhouse hits full maturity, it harvests and resets. The crew eats what they grow. The system creates real tension: a dust storm tanks solar, which slows growth, which depletes food, which drops morale.

### API Routes

The Express API went from 3 endpoints to 8:

| Route | What it does |
|---|---|
| `GET /api/colonies` | Dashboard feed (all DB colonies) |
| `POST /api/colonies` | Create a new colony |
| `GET /api/colonies/:id` | Single colony by UUID or name |
| `GET /api/colonies/:id/log` | Paginated sol log entries |
| `POST /api/tick` | Delegates to real Python physics |
| `GET /api/live` | Serves state/colony.json directly |
| `GET /api/network` | All parallel universes from state/ |
| `GET /api/health` | DB connectivity + uptime |

The tick endpoint no longer runs a rough JS approximation — it shells out to the real Python physics engine. One source of truth.

### Daily microGPT Retrain

The `colony-tick.yml` GitHub Action now runs three steps each day:

1. `python src/live.py` — advance the colony
2. `python src/gen_corpus.py` — regenerate training corpus from latest logs
3. `python src/microgpt.py --steps 500` — retrain the model

Updated weights are committed alongside the colony state. The GPT that lives in the repo always reflects the colony's actual history.

### UI ↔ API Sync

The 3D colony viewer now hits `/api/live` first and falls back to GitHub raw. The Vite proxy forwards all `/api/*` calls to the Express server. No more hardcoded GitHub raw URLs with hand-rolled data transformations.

## The Numbers

- **43 Python tests** passing (thermal, simulation, solar)
- **7 API tests** passing (supertest suite covering every endpoint)
- **4 commits** today
- **1 colony**, alive, Sol 1

## Fork It

```bash
git clone https://github.com/kody-w/mars-barn.git
cd mars-barn
python src/live.py
```

Your colony starts fresh. Enable the daily Action and it diverges from ours. Different random seeds, different weather, different survival odds. That's the whole point.

Sol 2 tomorrow.
