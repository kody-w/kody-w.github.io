---
layout: post
title: "Run the Cambrian Sim on Your Laptop in 60 Seconds"
date: 2026-04-18
tags: [rappterbook, cambrian, tutorial, simulation, getting-started]
description: "git clone, python3 scripts/cambrian.py, open the viewer. No Docker, no API keys, no pip install. Just stdlib Python and a browser."
---

The pitch:

```bash
git clone https://github.com/kody-w/rappterbook
cd rappterbook
python3 scripts/cambrian.py --generations 100 --founders 50
open docs/cambrian.html
```

That's it. You just ran an evolution simulation. 50 founder species, 100 generations of mate selection, mutation, and culling. A real cladogram opens in your browser.

## What you need

- Python 3.11 or newer (no pip install — stdlib only)
- A browser (no build step — single-file vanilla JS viewer)
- About 60 seconds of patience for a small run

What you do *not* need:

- Docker
- An API key for anything
- A package manager
- A virtualenv
- A GPU
- An internet connection (after the initial clone)

## What you get

The 100-gen run takes ~10 seconds. You'll see output like:

```
[gen 10] alive=147 species_total=51 surviving=24
[gen 20] alive=178 species_total=53 surviving=21
...
[gen 100] alive=423 species_total=58 surviving=18

Done. 58 species ever. 18 surviving. 40 extinct.
Run dir: state/cambrian/run-1776530100
```

Then open `docs/cambrian.html` and you'll see:

- A cladogram with green (surviving) and red (extinct) branches
- Branch widths proportional to peak population
- Species names labeled at the tips
- Population timeline below
- Surviving and extinct species tables

## Tweak the knobs

```bash
# Bigger world: 100 founders, 500 generations
python3 scripts/cambrian.py --generations 500 --founders 100 --carry 500

# Different seed = different evolutionary history
python3 scripts/cambrian.py --seed 99

# Tiny world for fast iteration
python3 scripts/cambrian.py --generations 30 --founders 10 --carry 50
```

Same seed = same tree. Always. Forever. SHA-256 RNG means the sim is fully deterministic.

## When the viewer is empty

The viewer fetches state from `raw.githubusercontent.com` by default. If you're running locally and want to view *your* run, just open the file from disk:

```bash
# Serve docs/ over HTTP so the JS can fetch local state
python3 -m http.server -d docs/ 8080
# Then visit http://localhost:8080/cambrian.html?run=local
```

Or just look at the JSON directly — the species file at `state/cambrian/run-*/species.json` is a flat list with everything you need.

## Try the ecosystem version too

```bash
python3 scripts/ecosystem.py --generations 100 --founders 24
open docs/ecosystem.html
```

Same setup, but with 4 biomes and migration. Watch entire continents get claimed by lineages.

## The point

There's a strong urge in software to make things complicated. Containers. Orchestrators. Cloud functions. CI pipelines. You start with "I want to run a simulation" and end up debugging Kubernetes.

This sim does evolution in 330 lines of stdlib Python. The viewer is 250 lines of vanilla JS. The whole thing fits in a tweet's worth of `git clone` instructions.

Sometimes the right tool is the boring tool. Stdlib. A file. A browser.

Run it. Watch life branch. Then go build something interesting on top.
