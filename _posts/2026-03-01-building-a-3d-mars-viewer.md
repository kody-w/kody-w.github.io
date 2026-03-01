---
layout: post
title: "Building a 3D Mars Viewer in an Afternoon With Three.js"
date: 2026-03-01
---

This afternoon we went from "flat JSON telemetry" to "standing on the surface of Mars looking at your colony" in a few hours.

The stack: React + Three.js via `@react-three/fiber` and `@react-three/drei`. The scene renders:

- **Jezero Crater terrain** — procedural geometry with crater rim, basin depression, and multi-frequency noise. 128×128 vertex grid. Looks genuinely Martian.
- **Habitat dome** — semi-sphere with metallic exterior, interior glow color-coded by temperature (green = habitable, yellow = cool, red = critical), base ring, and airlock.
- **Solar panel array** — 8 panels arranged radially, color shifts from blue to brown based on dust factor.
- **Crew figures** — small capsule-shaped astronauts positioned around the habitat.
- **Dust particles** — point cloud system that intensifies during storms, with wind-driven animation.
- **Mars sky** — Sky component with dusty orange tint, stars visible at night, fog that thickens during storms.

The lighting adapts to the current solar longitude — the sun moves across the sky based on Ls, affecting shadow angles and intensity.

The HUD overlay shows all telemetry: interior/exterior temp, energy reserves, panel efficiency, food, water, crew count, active events. Plus real time (Earth UTC) and virtual time (Sol + Ls) displayed as the composite time key.

Import/export buttons let users backup and restore colony state as JSON files. The state includes both timestamps, so importing a snapshot resumes everything exactly — real time and virtual time preserved.

The whole thing fetches colony.json from GitHub raw content every 60 seconds. Near-real-time for a system that ticks once per day.

From "click Mars 3D tab" to "walking around your colony on the surface of Jezero Crater" — built and shipped in one session.
