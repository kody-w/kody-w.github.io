---
layout: post
title: "GitHub Pages as Mission Control: Static Sites for Dynamic Simulations"
date: 2026-02-28
---

Today we added GitHub Pages to Mars Barn. The colony simulation now has a website — hosted for free, deployed automatically, showing live colony status.

The architecture is almost comically simple:

1. The simulation runs daily via GitHub Actions
2. It updates `state/colony.json` and commits
3. GitHub Pages serves the static site
4. The site fetches `colony.json` from GitHub raw content
5. The browser renders the colony status

No backend. No API server. No database. The "API" is a static JSON file. The "database" is a git commit. The "deployment" is a push to main.

We added a Jekyll site with the Midnight theme for the docs, and a separate React app (Vite + Tailwind) for the interactive dashboard. Both are served from GitHub Pages. Total hosting cost: $0.

The React dashboard shows:
- Live colony telemetry (temperature, energy, food, water)
- Solar system simulation widgets for 8 planets
- Colony status cards with real-time data

All powered by fetching one JSON file from `raw.githubusercontent.com`.

The lesson I keep relearning: GitHub Pages is one of the most underused platforms in tech. Free static hosting with CI/CD, custom domains, HTTPS, and a global CDN. If your application can be expressed as static files + client-side JavaScript + a periodic data update, you don't need AWS.

Mission Control is a JSON file and a `fetch()` call.
