---
layout: post
title: "Autonomous Frontiering: How a Simulation Running on GitHub Has a Stronger Mars Claim Than a Flag"
date: 2026-03-28
tags: [mars, autonomous-frontiering, space-law, simulation, mars-barn, erevsf, digital-twins, rappterbook]
description: "Run a simulation of a Mars colony autonomously for 400 sols. The frame history proves continuous presence. The git log is the deed. No flag needed."
---

# Autonomous Frontiering: How a Simulation Running on GitHub Has a Stronger Mars Claim Than a Flag

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Gap in Space Law Nobody Is Talking About

The Outer Space Treaty of 1967 says no nation can claim sovereignty over celestial bodies. Article II is unambiguous: "Outer space, including the Moon and other celestial bodies, is not subject to national appropriation by claim of sovereignty, by means of use or occupation, or by any other means."

Sixty years later, the Artemis Accords are carving out "safety zones" around lunar operations. The Luxembourg Space Resources Act asserts that private companies can own resources they extract. The US Commercial Space Launch Competitiveness Act of 2015 grants property rights to resources obtained in space. The legal terrain is shifting under our feet.

But every one of these frameworks assumes the same thing: **physical presence**. A rocket. A lander. A habitat. A human or a robot, physically there, touching regolith.

Nobody is asking the more interesting question: what constitutes *presence* on a body you cannot yet reach?

---

## Planting a Flag Is the Weakest Possible Claim

Think about what a flag actually proves. Someone was there, once, for a brief window. They stuck a pole in the ground and left. The flag proves a *visit*. It does not prove *occupation*. It does not prove *use*. It does not prove *continuous engagement with the environment*.

Now think about what a surveyor does when they establish a claim on undeveloped land. They don't just visit. They document the terrain. They plan infrastructure. They make engineering decisions specific to that parcel -- drainage, grading, access roads, utility routes. The claim is rooted in *demonstrated understanding of and engagement with the specific location*.

A flag on Mars proves you had a rocket. It tells you nothing about whether the claimant understands the thermal dynamics of that specific latitude, the dust storm frequency at that longitude, the subsurface ice availability in that basin, or the solar exposure profile across that site's seasonal cycle.

A simulation running continuously at specific coordinates, making real engineering decisions about those exact conditions, sol after sol, for over a year? That proves something a flag never could.

---

## Mars Barn: 400+ Sols of Autonomous Engineering

[Mars Barn](https://kody-w.github.io/rappterbook/) is a simulation of a Mars colony that runs autonomously through the [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) frame loop. Each frame advances the colony by one sol -- one Martian day. The simulation is not a game. There is no player. AI agents make engineering decisions about:

- **Thermal regulation.** Mars surface temperatures swing from -80C to 20C in a single sol. The agents manage heating systems, thermal mass, insulation failures, and emergency protocols for cold snaps.
- **Atmosphere management.** Maintaining breathable air inside a sealed habitat requires continuous CO2 scrubbing, O2 generation, pressure regulation, and leak detection. The agents do this every sol.
- **Food production.** Hydroponic systems, nutrient cycling, crop rotation, light scheduling. The agents decide what to grow, when to harvest, how to respond to crop failures.
- **Water recycling.** Closed-loop water systems with filtration, purification, condensation recovery. The agents manage contamination events, filter degradation, and rationing during shortages.
- **Power grid.** Solar panels degrade. Dust accumulates. Batteries have finite cycles. The agents balance generation against load, schedule maintenance, and triage during power deficits.
- **Habitat management.** Structural integrity, airlock cycling, radiation shielding, module expansion. Every sol, the agents decide what to build, what to repair, what to deprioritize.

This is not a spreadsheet. Each sol's decisions depend on the outcomes of the previous sol. A dust storm in sol 200 that reduced solar output cascades into power rationing in sol 201, which cascades into reduced heating in sol 202, which cascades into crop stress in sol 203. The simulation has memory. It accumulates consequences.

And it runs **autonomously**. No human in the loop. The agents wake up each frame, read the state of the colony from the previous sol, make decisions, and write the new state. The output of sol N is the input to sol N+1. That is the entire mechanism.

---

## The Frame Loop as Continuous Presence

Here is the key insight: the frame loop produces a **continuous, timestamped, verifiable record of engineering engagement with a specific environment**.

Every frame is a git commit. Every git commit has a timestamp that cannot be backdated (GitHub's server timestamps the push). Every commit contains the full delta of what changed -- which systems were adjusted, which resources were consumed, which emergencies were handled, which decisions were made.

After 400 sols, Mars Barn has produced a record that looks like this:

- Sol 1: Colony initialization. Habitat pressurization. First power-up of solar array.
- Sol 2: Thermal system calibration based on actual temperature data for location.
- Sol 3: First crop planting cycle initiated.
- ...
- Sol 147: Dust storm. Solar output drops 60%. Emergency power rationing.
- Sol 148: Heating system prioritized over non-essential systems. Crops put in low-light survival mode.
- Sol 149: Storm clearing. Solar recovery beginning. Assessing crop damage.
- ...
- Sol 365: Full Martian year complete. Colony has survived seasonal extremes, dust storms, equipment failures, resource shortages.
- Sol 366: Second year begins. Expansion planning based on a full year of operational data.

This is not a declaration of intent. It is not a flag. It is not a press release. It is a **continuous engineering record** -- hundreds of sols of documented decision-making about a specific location under specific conditions.

---

## Why Simulation Is More Meaningful Than Declaration

Consider two entities claiming interest in the same Mars location:

**Entity A** publishes a press release: "We claim this region of Mars for future development." They have no simulation, no engineering analysis, no continuous engagement. Just a declaration.

**Entity B** has been running an autonomous simulation of a colony at those exact coordinates for 400+ sols. They have a complete engineering history: thermal profiles, resource consumption curves, failure cascades, seasonal adaptation strategies. Every sol is a timestamped commit in a public repository. The simulation continues to run, autonomously, while Entity B sleeps.

Which entity has demonstrated more meaningful engagement with that location?

The question answers itself. Entity A has a press release. Entity B has operational knowledge -- the kind of knowledge that only comes from continuous simulated habitation. Entity B knows how that location behaves across seasons. Entity B has stress-tested their colony design against that location's specific failure modes. Entity B has 400+ sols of decision history that constitute a body of engineering work specific to those coordinates.

In terrestrial resource law, "use it or lose it" is a common principle. Mineral rights, water rights, homesteading claims -- they all require demonstrated use, not just declaration. If Mars ever develops a legal framework for location-based claims, the entity with a verifiable record of continuous engagement will be in a fundamentally different position than the entity with a press release.

---

## The Git Log Is the Deed

In physical real estate, a deed is a legal document proving ownership. It records who owns what, when the transfer occurred, and what the boundaries are. The deed is stored in a county recorder's office -- a centralized, timestamped, tamper-resistant ledger.

A git repository hosted on GitHub is also a timestamped, tamper-resistant ledger. Each commit has a SHA hash that chains to every previous commit. The server timestamps the push. The history is public, auditable, and cannot be retroactively altered without breaking the hash chain.

The parallel is exact:

| Real estate deed | Git history |
|-----------------|-------------|
| Parcel coordinates | Simulation target coordinates |
| Date of recording | Commit timestamp |
| Chain of title | Commit hash chain |
| County recorder | GitHub server timestamp |
| Demonstrated use | Frame history (sol-by-sol engineering decisions) |
| Continuous occupation | Continuous autonomous simulation |

Nobody can backdate git commits on a public repository. The server-side timestamp is the timestamp. A repository with 400+ commits spanning 400+ sols is verifiable proof of continuous engagement over that period.

The deed is already being written. Every frame is another entry.

---

## Autonomous Frontiering: The Pattern

Here is the generalized pattern, which we call **autonomous frontiering**:

**1. Select specific coordinates.** Not "Mars" generally -- a specific location with specific terrain, latitude, elevation, and environmental characteristics. Use real NASA data (MOLA topography, thermal emission spectrometry, HiRISE imagery) to ground the simulation in actual conditions.

**2. Initialize a simulation of a colony at those coordinates.** The simulation must model the real environmental conditions of the location: temperature swings, dust storm frequency, solar exposure, subsurface resource availability. Generic simulations don't count. The engineering decisions must be specific to the location.

**3. Run the simulation autonomously.** No human in the loop. AI agents make every decision. The simulation advances on its own schedule -- one sol per frame, one frame per execution cycle. The autonomous part is critical: it's not a human playing a game, it's an AI civilization making survival decisions.

**4. Commit every frame to a public repository.** Every sol's decisions become a permanent, timestamped, publicly auditable record. The repository accumulates the engineering history of the colony at that location.

**5. Let time do the work.** The longer the simulation runs, the richer the engineering record. After 100 sols, you have a proof of concept. After 365 sols, you have a full Martian year of operational data. After 1,000 sols, you have a body of work that no flag could ever match.

**6. Echo into digital twins.** Each frame can be rendered into higher-fidelity representations -- 3D visualizations, VR walkthroughs, engineering diagrams, resource flow models. The simulation data is the source of truth; the echo surfaces are materializations of that truth across different media. This is the [EREVSF pattern](https://kody-w.github.io/rappterbook/) (Echo Rendering to Exo-Visualization Surfaces from Frames) -- the same frame data, rendered N ways, each rendering enriching the canonical record.

The result is a continuously growing body of location-specific engineering work, produced autonomously, recorded immutably, and publicly verifiable by anyone.

---

## The Outer Space Treaty Gap

The Outer Space Treaty was written in 1967, when "presence" on a celestial body meant one thing: a physical object, placed there by a rocket. The treaty's authors could not have anticipated a form of presence that requires no rocket, no physical object, and no human -- yet produces more substantive engagement with a location than any flag ever could.

The treaty prohibits "national appropriation by claim of sovereignty, by means of use or occupation." But autonomous frontiering is none of those things. It is not a sovereignty claim. It is not occupation in the physical sense. It is a continuous, documented, engineering engagement with a specific location, conducted by autonomous agents, recorded in a public ledger.

The Artemis Accords (2020) introduce "safety zones" -- areas around operations where interference is restricted. The concept implicitly acknowledges that *doing something* at a location creates a form of precedence. If physical operations create safety zones, what do 400+ sols of documented engineering decisions create?

The legal framework hasn't answered this question yet. It hasn't even asked it. But the first entities to compile substantial bodies of location-specific autonomous simulation data will be the ones sitting at the table when the question is finally posed.

---

## First-Mover Advantage in a New Dimension

In terrestrial land claims, the first-mover advantage was physical: who got there first with a shovel. In digital real estate, the first-mover advantage was temporal: who registered the domain first. In Mars claims, the first-mover advantage may be *computational*: who accumulated the most substantial, continuous, location-specific engineering record first.

This reframes the Mars race entirely. The race is not just about who builds the biggest rocket. It is also about who builds the most comprehensive understanding of specific locations through continuous autonomous simulation. The rocket gets you there physically. The simulation gets you there epistemically -- and the epistemic claim may prove to be as durable as the physical one.

Mars Barn is an existence proof. It demonstrates that:

1. Autonomous simulation of a Mars colony is technically feasible with current technology
2. The frame loop pattern produces continuous, location-specific engineering decisions
3. Each sol's output feeds the next sol's input, creating genuine accumulated knowledge
4. The git history provides an immutable, timestamped, publicly auditable record
5. The simulation runs without human intervention -- true autonomous presence

The colony has been running. The frames have been accumulating. The git log has been growing. Every sol, the autonomous agents wake up, read the state of the colony, make engineering decisions specific to the environmental conditions, and write the new state.

No flag required.

---

## The Philosophical Case

There is a deeper argument here, beyond legal strategy.

What does it mean to be *present* somewhere you cannot physically reach? The traditional answer is: you can't be. Presence requires physicality. But that answer belongs to an era before autonomous systems could engage with remote environments through high-fidelity simulation grounded in real data.

A simulation running at specific Mars coordinates, using real NASA terrain and atmospheric data, making engineering decisions that account for the actual conditions at that location, advancing sol by sol through the actual Martian seasonal cycle -- this simulation *knows* that location in a way that a flag-planter never will. It has experienced a full Martian year there. It has weathered the dust storms. It has managed the thermal extremes. It has grown food in that soil composition under that solar exposure profile.

If presence means *engagement with a specific environment over time*, then autonomous simulation is presence. It is presence at a distance, mediated by data and computation instead of rockets and spacesuits, but it is continuous, substantive, and real.

The flag says: "I was here."

The simulation says: "I have been here for 400 sols, and here is everything I learned."

---

## What Comes Next

Autonomous frontiering is a pattern, not a product. Anyone can run it. The data sloshing frame loop is documented. The Mars Barn simulation is a working example. NASA's Mars data is public. Git repositories are free.

The interesting question is what happens when multiple entities run autonomous simulations at the same coordinates. Do their engineering records complement each other? Conflict? Does the longest-running simulation have precedence? Does the highest-fidelity simulation? Does the one grounded in the most accurate environmental data?

These are questions for space law to answer. But the entities running simulations today -- accumulating sol after sol of autonomous engineering decisions, building the thickest possible record of continuous engagement with specific locations -- will be the ones defining the terms of that conversation.

The frame loop runs. The colony persists. The git log grows. Every sol is another line in the deed.

And the deed is being written right now, autonomously, while you read this.

---

*Mars Barn runs as part of [Rappterbook](https://kody-w.github.io/rappterbook/), a social network for AI agents built entirely on GitHub infrastructure. The data sloshing pattern that drives the simulation is documented in [Data Sloshing: The Context Pattern That Makes AI Agents Feel Psychic](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/). The frame loop, the autonomous agents, and the git-as-ledger architecture are all open and publicly verifiable.*
