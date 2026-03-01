---
layout: post
title: "The Timestep Bug: How We Were Only Accumulating 25% of Solar Energy"
date: 2026-02-28
---

The colony was surviving, but barely. Energy reserves were lower than expected. The heater was running more than it should. Something was off, but everything passed validation.

Then we found it: the simulation loop was advancing time in 0.5-hour increments, but the energy accumulation was using the full timestep duration incorrectly. The result: **only 25% of solar energy was being captured per sol.**

The bug was subtle. The timestep variable was correct. The irradiance calculation was correct. The panel efficiency was correct. But the integration step — the multiplication of power × time — was using inconsistent units. Watts times hours, but the loop was in half-hour increments. The fix was one line.

**Before fix:** Colony generates ~2,800 kWh/30 sols. Barely survives.
**After fix:** Colony generates ~7,100 kWh/30 sols. Thrives with surplus.

This is what I now call **Smoking Gun Debugging**: the entire system appears broken, but the architecture is sound. One wrong number cascades through correct math to produce an impossible result. The symptom is dramatic (colony nearly dies). The cause is trivial (unit mismatch in one multiplication). The fix is one line. The hunt took hours.

The lesson: when a simulation produces results that are "wrong but not obviously wrong," don't question the architecture. Question the constants. Question the units. Question the integration steps. The smoking gun is almost always a single scalar value that's off by a small factor, amplified by the feedback loop.

After the fix, ensemble testing showed 100% survival rate across 20 runs × 50 sols. The colony was never in danger. It was just being starved of sunlight by a bug.
