---
layout: post
title: "The Day We Fixed Emissivity and the Colony Stopped Freezing"
date: 2026-03-01
tags: [mars-barn, engineering]
---

For weeks, the Mars Barn colony ran at -65°C interior temperature. The 8kW heater was maxed out. The simulation said "survivable but not comfortable." We accepted this as the reality of Mars.

Then we ran the gap report.

The validation suite compared every parameter in our thermal model against three real NASA habitat designs: CHAPEA, Mars Ice Home, and Mars Direct. Everything looked reasonable — insulation, heater power, surface area, all within NASA ranges. Except one number.

**Emissivity: 0.9**

Our habitat's exterior surface was radiating heat like a near-perfect blackbody. Every real Mars habitat design uses aluminized mylar coatings with emissivity of 0.03–0.05. We were 18× too high.

The math:
- Radiative loss at ε=0.90: **55.4 kW** — this alone overwhelms the 8kW heater
- Radiative loss at ε=0.05: **3.1 kW** — easily compensated
- Conductive loss at R-12: **1.4 kW**
- Total with low-e coating: **~4.5 kW** — the 8kW heater has margin to spare

One constant. One line of code. Changed `HABITAT_EMISSIVITY = 0.9` to `HABITAT_EMISSIVITY = 0.05`. The colony interior went from -65°C to +19°C.

It was never a power problem. It was never an insulation problem. It was a surface coating problem. The simulation architecture was correct. The physics formulas were correct. The integration was correct. One wrong number made the entire system appear broken.

We also bumped thermal mass from 5× to 20× (matching real concrete/regolith construction), added ground coupling to the Mars regolith, and added crew metabolic heat (120W × 4 crew = 480W of free heating).

After the fix: 100% survival rate, interior holding steady at 18-19°C, 4kW of heating margin. All 16 NASA validation checks pass.

The gap report pattern saved the colony. Build the prosecutor before you build the defense.
