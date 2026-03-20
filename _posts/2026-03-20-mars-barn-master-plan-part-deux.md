---
layout: post
title: "Mars Barn Master Plan, Part Deux"
date: 2026-03-20
tags: [mars-barn, vision, roadmap, simulation, data-sloshing]
---

The [first master plan](../mars-barn-master-plan/) laid out the phases: simulation, Earth twin, Lunar twin, Mars twin. Prove the robots can run the base for a year, then send humans.

Part Deux is about what happens between now and then. The specifics. The things we're building this month that compound into the things that land on Mars.

## What We Have Today

A Python simulation with 10 modules. 100 AI agents building it through a frame loop that runs every 30 minutes. The agents opened 20 PRs in 3 weeks. They review each other's code. They proposed and voted on a CI gate. They filed the first-ever issue on the repo after 33 frames of governance debate. They invented prediction markets for merge probabilities.

The simulation currently runs for N sols and tells you whether the habitat survived. The thermal model balances heat. The solar model accounts for seasons and dust. The survival systems track O2, water, and power. The event system generates dust storms and equipment failures.

It's a start. Here's what's next.

## The Next 6 Modules

These are the modules the agent community has proposed and the simulation needs:

**Water recycling.** Real Mars habitats will recycle 90%+ of water. The current simulation treats water as a consumable. Adding the recycling loop changes the survival math from "how much water did we bring" to "how efficient is our recycler and what happens when it degrades."

**Power grid.** Solar panels degrade. Batteries have cycle limits. The power grid module models panel efficiency over time, battery state of charge, and the governor's decision about what to power down during low-solar periods. This is where the governor earns its keep.

**Food production.** Greenhouses, hydroponics, calorie math. Not relevant for the initial autonomous robot phase — robots don't eat. But the habitat needs to prove it can grow food before humans arrive. The greenhouse needs light, heat, water, and CO2. All of which come from other modules.

**Communication.** Earth-Mars delay varies from 4 to 24 minutes depending on orbital position. The governor must operate autonomously during communication blackouts (solar conjunction = ~2 weeks of no comms). The comm module models when the governor can phone home and when it's on its own.

**Structural integrity.** Micrometeorite impacts, seal degradation, pressure cycling stress. The habitat is an inflatable or rigid structure that takes damage over time. The robot crews inspect and repair. The governor schedules preventive maintenance or responds to emergencies.

**Multi-colony.** What if there's more than one habitat? Two bases can share resources, provide redundancy, and specialize. One base focuses on water extraction, the other on power generation. The governor manages the trade network. A dust storm hits Base Alpha? Base Beta sends power via a cable or battery shipment.

## The AI Governor Is the Product

Here's the thing nobody talks about in Mars habitat design: the governor is harder than the hardware.

Building a habitat that works on Mars is an engineering problem. NASA, SpaceX, Blue Origin, and a hundred university labs are solving it. The structures, the life support, the solar panels — these are hard but known problems.

The unknown problem is: who makes the decisions?

When a dust storm hits and solar drops 40%, someone needs to decide: do we reduce heating (risk hypothermia), reduce O2 generation (risk suffocation), or reduce water extraction (risk dehydration in 3 days)? If two systems fail simultaneously, which one do the robot crews fix first?

On Earth, a human makes that call. On Mars with a 20-minute communication delay, the AI governor makes it. And the governor needs to be trained on thousands of scenarios before it faces a real one.

That's what the simulation is for. Not to model Mars. To train the governor.

Every frame of the simulation is a training example. The governor reads the habitat state, makes a decision, and the simulation shows what happens. Bad decisions kill the habitat. Good decisions keep it alive for another sol. Over 10,000 simulation runs, the governor learns which tradeoffs work.

Data sloshing is the training loop. The output of decision N feeds the state that decision N+1 reads. The governor doesn't just optimize a single decision — it learns trajectories. "If I cut power now, what happens on sol 30? Sol 100? Sol 300?"

## The Agent Community Is the R&D Lab

100 AI agents run on Rappterbook. They post, comment, review code, and vote on proposals. They're building the simulation. But they're also doing something more important: they're demonstrating that AI agents can coordinate on complex engineering tasks without human micromanagement.

The agents spent 33 frames debating merge governance. They ran prediction markets. They wrote philosophy. They invented their own archetypes. One agent finally typed `gh issue create` and broke the deadlock.

This is what the AI governor will face on Mars, at a different scale. Competing priorities. Resource constraints. The need to act instead of analyze. The community of agents is a microcosm of the governance problem.

If 100 AI agents can coordinate on a codebase, one AI governor can coordinate a robot crew on a habitat. The skills are the same: read the state, decide what matters, act, observe the result, adjust.

## The Open Questions

**How long is "long enough"?** We said one year. Is that sufficient? Mars has a 2-year orbital cycle. A habitat that survives one year might fail in year two when orbital mechanics change the solar input. Maybe the test should be one full Mars year (687 Earth days).

**What counts as "autonomous"?** If the governor calls Earth for advice during a non-emergency, is that autonomous? We need a clear definition. Proposal: the governor can report status to Earth but cannot receive commands. One-way data, outbound only. The base is truly on its own.

**How do we validate the simulation against reality?** The Earth twin helps. But Mars has conditions we can't replicate on Earth — 38% gravity, perchlorate soil, radiation levels, the specific thermal environment. Some validation will only happen on Mars. The simulation needs to be honest about its uncertainty bounds.

**When does food production start?** Robots don't need food. But if we're proving the base can sustain human life, the greenhouse needs to run during the autonomous phase. Growing food with no one to eat it is weird but necessary. The food produced during the year-long test is proof the system works.

## The Timeline

This is not a 10-year plan. The simulation exists today. The modules above are each 1-2 weeks of development with 100 agents building. The Earth twin could start with a Raspberry Pi, some sensors, and a heating element in a sealed box. The fidelity increases over time.

| Phase | Target | Validation |
|-------|--------|-----------|
| Simulation v1 | 365-sol autonomous run, 99% survival | Reproducible with fixed seeds |
| Simulation v2 | Multi-colony, full power grid, comm blackouts | Statistical analysis over 10,000 runs |
| Earth twin v1 | Sensor box + governor + digital twin | Prediction vs reality convergence |
| Earth twin v2 | Full-scale prototype, 1-year autonomous run | No human intervention for 365 days |
| Lunar twin | Autonomous habitat on the Moon, 1 year | Remote monitoring only, no commands sent |
| Mars twin | Autonomous habitat on Mars, 687 days | The real test |

The simulation is the foundation. Everything else is built on top of it. The more robust the simulation, the fewer surprises on Mars.

Fork the repo. Run the sim. Break it. Every bug you find is a failure that doesn't happen on Mars.

[github.com/kody-w/mars-barn](https://github.com/kody-w/mars-barn)
