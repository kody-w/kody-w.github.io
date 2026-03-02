---
layout: post
title: "Only Mars and Moon Survive: Backtesting Colonies Across the Solar System"
date: 2026-03-02
published: false
---

We backtested the same colony configuration across 8 bodies in the solar system. Same habitat. Same panels. Same heater. Same crew. Different planet.

Only two survived.

**The results (669 sols / 1 Mars year):**

| # | Body | Survived | Temp Range | Storms | Why |
|---|------|----------|-----------|--------|-----|
| 1 | **Mars** | ✅ 669 sols | +17°C to +20°C | 60 | Baseline. Goldilocks of difficulty. |
| 2 | **Moon** | ✅ 669 sols | +15°C to +22°C | 0 | No storms. Close solar. 14-day nights are hard but survivable. |
| 3 | Mercury | ❌ Sol 12 | -76°C to +11°C | 0 | 300K diurnal swing. No atmosphere. Thermal cycling destroys everything. |
| 4 | Europa | ❌ Sol 4 | -26°C to -12°C | 0 | 50 W/m² solar. You can't heat a habitat on Jupiter's scraps. |
| 5 | Titan | ❌ Sol 4 | -40°C to -17°C | 0 | 15 W/m² solar. Thick atmosphere but almost no energy input. |
| 6 | Saturn rings | ❌ Sol 4 | -27°C to -13°C | 0 | Microgravity + 15 W/m² solar. Ring debris. Everything is wrong. |
| 7 | Jupiter clouds | ❌ Sol 4 | -19°C to -12°C | 1 | 24.8 m/s² gravity. 50 W/m² solar. Constant storms. |
| 8 | Venus | ❌ Sol 1 | -110°C | 0 | 737K surface, 92 atm pressure. The habitat can't even establish thermal equilibrium. |

**Why Mars wins:** It's the only body where solar energy input exceeds thermal losses with reasonable hardware. The Moon works too because it gets Earth-level solar (1,361 W/m²), but those 14-day nights require massive battery reserves.

**Why everything else dies:** The outer solar system doesn't have enough sunlight. At Jupiter's distance, you get 50 W/m² — less than 4% of what Mars gets. No amount of insulation can compensate for zero energy input. Mercury has plenty of sun but the 300K temperature swing between day and night shatters any thermal equilibrium. Venus is just hostile to matter.

**The habitat penalty multiplier:** Each planet has a difficulty factor that scales thermal losses. Mars is 1.0× (baseline). Moon is 2.0× (no atmosphere, micrometeorites). Mercury is 3.0× (extreme cycling). Europa is 4.0×. Venus is 5.0×. Jupiter is 6.0×. The penalty reflects the engineering overhead of dealing with each environment's unique challenges.

**What this means for the simulation game:** When the Mars Barn Race extends to other bodies, the difficulty scaling is built in. A Moon colony is a real achievement. A Europa colony would require nuclear power and completely different architecture. A Venus colony is currently impossible with our model.

**The data:** All climate profiles are derived from NASA Planetary Fact Sheets and mission measurements. Mercury's temperature extremes are from MESSENGER. Venus data from Magellan and Venera. Europa from Galileo. Titan from Cassini-Huygens. Mars from our 17,400-sol statistical climate model built from Viking through Perseverance.

The solar system is hostile. Mars is the least hostile option. That's why we're building there.
