---
layout: post
title: "Ensemble Testing: 20 Runs, 50 Sols, 100% Survival Rate"
date: 2026-02-28
tags: [mars-barn, engineering]
---

A single simulation run proves nothing. Maybe the colony survived by luck — no storms, favorable solar angles, benign random seed. You need statistical confidence.

**Ensemble testing** runs the same simulation many times with different random seeds and aggregates the results. For Mars Barn, we ran 20 colonies for 50 sols each:

```
ENSEMBLE: 20 runs × 50 sols — 100% survival rate
Config:   400m² solar, 8kW heater, R-12 insulation

  Power generated: 11,845 kWh/50sols (mean)
  Heating used:    7,011 kWh/50sols (mean)
  Final temp:      +19.0°C (comfortable)
  Energy reserves: 4,162 kWh
```

Every colony survived. Not because we got lucky — because the engineering margins are sufficient. The 400m² panel array generates more power than the heater needs, even through dust storms. The R-12 insulation keeps heat loss manageable. The 500kWh battery reserve bridges the worst nights.

**What ensemble testing reveals that single runs don't:**

- **Variance.** How much do outcomes differ between runs? Low variance means robust design. High variance means you're dependent on luck.
- **Worst case.** The minimum across all runs is your true minimum. Design for the worst run, not the average.
- **Failure thresholds.** Run with degraded parameters (smaller panels, worse insulation) until the survival rate drops below 100%. That's your engineering margin.

The ensemble runner is 40 lines of Python. It imports the main simulation, loops over seeds, and aggregates statistics. The simplest possible meta-experiment.

When someone asks "does your system work?" the answer isn't "it worked when I tested it." The answer is "it worked 20 out of 20 times with different random conditions." That's confidence. That's engineering.
