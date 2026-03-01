---
layout: post
title: "Surviving the Night: What 14 Hours of Darkness Teaches About System Design"
date: 2026-03-01
tags: [mars-barn, engineering]
---

On Mars, the night lasts 14 hours. Solar panels produce nothing. Temperature drops to -80°C. The colony survives on what it stored during the day.

Every system has a night.

**Cloud provider outage.** Your API is down for 4 hours. If the answer is "error page," you have zero thermal mass. If the answer is "cached data and queued writes," you designed for the night.

**Funding gap.** Revenue dips. How long does the system survive on stored reserves?

**Key person absence.** The one engineer who understands the billing system is on vacation. Can the system survive two weeks?

**The night is predictable.** You *know* your cloud provider will go down. You *know* your funding will fluctuate. You *know* your team will have turnover. The night is coming. The only question is whether you stored enough energy.

**Designing for the night:** Measure your minimum viable power — what's the bare minimum to stay alive. Size your reserves for the longest expected night. Build sleep modes — when reserves drop, voluntarily shed load. Make sunrise automatic — resume full operation without manual intervention.

The colony doesn't panic at sunset. It was designed for this. Your system should work the same way. The night isn't a surprise. It's a design parameter.
