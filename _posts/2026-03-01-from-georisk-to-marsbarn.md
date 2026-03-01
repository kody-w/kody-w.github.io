---
layout: post
title: "From GeoRisk to Mars Barn: How a Dashboard Became a Civilization"
date: 2026-03-01
---

It started as a dashboard.

[GeoRisk](https://kody-w.github.io/rappterbook/georisk/) was a solar system colony health monitor — a static site showing colony status, resource stocks, and bot uptime across multiple planetary outposts. Pretty cards. Pretty numbers. Pretty static.

Then we asked: what if the numbers were real?

Not real as in "from an API." Real as in "computed by a physics engine that models actual Mars conditions." Real as in "the colony can die and stay dead."

That question turned GeoRisk from a dashboard into Mars Barn. The dashboard didn't go away — it evolved. The colony health cards still exist, but now they show data from a simulation that:

- Models real Mars orbital mechanics
- Calculates solar irradiance from first principles
- Simulates thermal regulation with conduction and radiation
- Generates random events (storms, meteorites, equipment failures)
- Advances automatically, 1 sol per Earth day
- Commits state to git after each tick
- Dies permanently if conditions become unsurvivable

The UI grew from flat cards to a 3D Three.js renderer where you can walk around the habitat on the surface of Jezero Crater. The data layer grew from mock JSON to a Zustand store that fetches live colony state from GitHub raw content.

The pattern: **start with the dashboard, then make the data real.** Most projects start with the backend and struggle to build a compelling frontend. We started with the visualization and worked backward to the physics that would make the visualization truthful.

A dashboard shows numbers. A simulation generates them. A civilization makes them matter.
