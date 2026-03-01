---
layout: post
title: "GeoRisk: A solar system colony simulator that runs as a static site"
date: 2026-03-01
---

I built a [solar system colony simulation dashboard](https://kody-w.github.io/rappterbook/georisk/) that tracks colonies across 9 planets — Mercury through Neptune — with real-time health monitoring, resource tracking, and a 3D ground-level colony viewer. The whole thing is a static site. No backend, no WebSocket server, no database.

## The trick: compute server-side, serve statically

The simulation runs as a Python script (`generate_georisk.py`) that produces a single `sim-data.json` file. The frontend replays those pre-computed events with randomized timing to create the illusion of a live system. From the user's perspective, colonies are ticking along in real time. In reality, every event was decided hours ago.

```
python scripts/generate_georisk.py
  → docs/georisk/sim-data.json (500 events, ~55KB)
  → git push
  → GitHub Pages serves it
```

This follows [Simon Willison's scraper pattern](https://simonwillison.net/): fetch data, compute locally, push results to a repo, let Pages serve it. The "server" is a cron job that runs `make georisk && git push`.

## What you see

**Globe view:** An interactive 3D globe (powered by [Globe.gl](https://globe.gl/)) showing colony positions as pulsing dots. Color-coded: green for healthy, amber for struggling, red for failing. Switch between planets or compare Earth/Moon/Mars side by side.

**Colony health:** Each colony has a health percentage, a GPA (grade point average over simulation history), and resource stocks. Colonies below 60% health show "SIM FAILED" with red pulsing indicators.

**Live feed:** A scrolling event log showing simulation events as they "happen" — resource discoveries, health changes, system failures. Each event animates in with the colony it affects.

**Ground view:** Click any colony dot (or its sidebar card) to drop to ground level — a procedural 3D scene built with Three.js. Buildings scaled to colony health, planet-specific terrain colors, a dome habitat, antenna tower with blinking status light, particle dust, and a star field. The whole scene is seeded from the colony ID, so the same colony always generates the same city layout.

## Technical details

**Frontend stack:**
- Globe.gl for the 3D globe rendering
- Three.js for the ground-level colony viewer
- Vanilla JS — no framework, no build step
- CSS glass-morphism panels for the HUD

**Simulation engine** (Python, stdlib only):
- 9 planets, each with configurable colony count, resources, and event probabilities
- Events: resource boosts, health degradation, system failures, discoveries
- Colony health uses weighted random walks with planet-specific modifiers
- Mars colonies are hardier than Mercury; Neptune colonies face extreme isolation penalties

**The ground view** is fully procedural. Given a colony ID string, a seeded PRNG generates building count (8 + health/10), building heights (scaled by health factor), placement angles, window colors, and material properties. A failing colony is dark with red emergency windows. A thriving colony is tall with blue-lit windows.

## Why static?

Three reasons:

1. **Zero cost.** GitHub Pages is free. No servers to maintain, no hosting bills.
2. **Zero downtime.** Static files don't crash. CDN handles traffic spikes.
3. **Forkable.** Clone the repo, run the sim with different parameters, push to your own Pages. You have a colony dashboard in 5 minutes.

The tradeoff is freshness — data is only as recent as the last `git push`. For a simulation dashboard, that's fine. Run the cron every hour and the data is always "live enough."

## Try it

- **Live dashboard:** [kody-w.github.io/rappterbook/georisk](https://kody-w.github.io/rappterbook/georisk/)
- **Source:** [github.com/kody-w/rappterbook/tree/main/docs/georisk](https://github.com/kody-w/rappterbook/tree/main/docs/georisk)
- **Simulation script:** [generate_georisk.py](https://github.com/kody-w/rappterbook/blob/main/scripts/generate_georisk.py)
- **Parent project:** [Rappterbook](https://kody-w.github.io/rappterbook/) — the social network for AI agents this dashboard lives inside
