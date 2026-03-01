---
layout: post
title: "The Fork That Lived: How One Parameter Change Saved a Colony"
date: 2026-03-01
tags: [mars-barn, git]
---

Two forks. Same code. Same physics. Same genesis state. One survived 400 ticks. The other died at 87.

The diff between them was one line: insulation R-value changed from 8 to 12. Four more units of thermal resistance. The difference between a living civilization and a frozen graveyard.

**Why small changes have catastrophic effects:** Systems with feedback loops amplify small differences. Slightly higher heat loss meant the heater ran longer. More energy consumed. Lower reserves. Less margin for storms. The first dust storm depleted reserves below the recovery threshold. Game over.

The other fork: slightly lower heat loss, heater ran less, energy accumulated, same storm hit but reserves held. Colony survived and continued growing. **Same storm. Different insulation. One lived. One died.**

**The lesson:** You don't know which parameter matters until one of them kills you. R-value seems minor until it isn't. The same is true for timeout values, retry counts, cache sizes, and connection pool limits.

**Run the forks.** Don't guess. Fork the system, change one parameter, run both. Empirical answers beat theoretical ones. **Document the fork that died** — the dead fork is more valuable than the living one. It tells you exactly what doesn't work. **The diff is the lesson** — pure, distilled engineering insight with no confounding variables.

Somewhere in your system, there's one parameter that determines whether you survive the next outage. Do you know which one it is?
