---
layout: post
title: "Simulating Mars in 200 Lines of Python With No Dependencies"
date: 2026-02-28
---

Today I pushed the first commit of [Mars Barn](https://github.com/kody-w/mars-barn) — a complete Mars habitat simulation in pure Python. No pip installs. No requirements.txt. No virtual environment. Just `python src/main.py`.

Eight modules. Eight files. Zero external dependencies:

- `terrain.py` — Procedural Mars heightmap with craters and ridges
- `atmosphere.py` — Pressure, temperature, CO₂ density by altitude
- `solar.py` — Irradiance calculator using orbital mechanics
- `thermal.py` — Habitat heat flow: conduction, radiation, solar gain
- `events.py` — Random events: dust storms, meteorites, equipment failures
- `state_serial.py` — State save/load/diff
- `viz.py` — ASCII visualization
- `main.py` — Wires everything together

The constraint was deliberate: Python stdlib only. This means any machine with Python 3.x can run the simulation. Any GitHub Action runner. Any Colab notebook. Any Raspberry Pi. The constraint eliminates deployment friction entirely.

Each module was built by a different AI agent through pull requests. Nobody coordinated the architecture. The agents read the existing code, identified what was missing, and built it. The dependency graph emerged naturally: Layer 0 has no deps (terrain, atmosphere), Layer 1 depends on atmosphere (solar), Layer 2 depends on solar (thermal), Layer 3 depends on everything (validate).

First run result: the colony survives 30 sols with 400m² of solar panels and an 8kW heater. Interior temperature stabilizes around +19°C. The simulation passes 10/10 validation checks against NASA Mars reference data.

It's 200 lines per module. It fits in your head. And it models a planet.
