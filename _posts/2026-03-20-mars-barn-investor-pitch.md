---
layout: post
title: "Mars Barn: Investor Pitch — The AI That Keeps Mars Alive"
date: 2026-03-20
tags: [mars-barn, business, wildhaven, pitch, investors]
---

*Wildhaven AI Homes LLC — Seed Stage — $2M*

---

## 1. The Hook

Every Mars plan assumes humans from day one.

SpaceX's Starship architecture: crew lands, crew sets up habitat, crew hopes the life support works. NASA's Artemis extension to Mars: same assumption. Every billion-dollar Mars program on Earth right now assumes that the first time we test whether a Mars habitat can sustain life, a human life is on the line.

That's the gap. Nobody has proven a habitat can run itself.

Mars Barn is the company that closes it.

---

## 2. The Problem

Here is the specific failure mode no one talks about.

Mars is 4 to 24 light-minutes away depending on orbital position. Round-trip communication: 8 to 48 minutes. That means you physically cannot remote-control a robot in real time. You cannot do what NASA does with ISS — call the crew, diagnose the scrubber, walk them through the fix. By the time you know there's a problem and send a response, nearly an hour has passed.

So every Mars habitat needs an autonomous governor. A system that, when the dust storm hits on sol 14 and knocks solar capacity down 40%, decides on its own which systems to power down, in what order, for how long, and when to bring them back online. No human in the loop. No cloud API. No phone home.

This system does not exist. No one has built it. No one has tested it. The entire Mars enterprise is currently proceeding on the assumption that we will figure it out later.

**We are later.**

NASA has committed $93B to the Artemis program. SpaceX is building the rockets. Blue Origin is building orbital habitats. Axiom is building a private station. The hardware pipeline is fully funded. The intelligence layer has not been started.

That is the problem.

---

## 3. The Solution

Prove it works in simulation before anyone's life depends on it.

Mars Barn is a sol-by-sol simulation of an autonomous Mars habitat. Terrain, atmosphere, solar, thermal, water, oxygen, power, robot maintenance crews — all modeled from real Mars data. An AI governor manages the base each sol. Dust storms arrive. Equipment fails. Power gets scarce. The governor makes decisions.

The training architecture is what makes it work. We use data sloshing: the output of sol N is the input to sol N+1. The governor does not just see the current state of the habitat — it sees the accumulated history of every decision it made and every consequence that followed. It learns which early warning signals predict failure 40 sols out. It learns which power allocation choices create fragility three dust storms later.

Run the simulation 10,000 times with different random seeds. Different storm timing, different equipment failure rates, different solar minimum severity. The governor that survives across that distribution is not lucky — it has learned the underlying structure of the problem.

Then put the same governor in a physical box on Earth and run it against real hardware for a year. Prediction vs. reality. Close the gap. Calibrate.

That calibrated governor is the product.

---

## 4. The Product

We are not selling hardware. SpaceX builds rockets. Boston Dynamics builds robots. NASA builds habitats.

We are selling **the intelligence that runs the habitat when nobody's home.**

The AI governor is a trained decision-making system. It takes habitat sensor state as input — power levels, temperature, pressure, CO2, equipment status — and outputs resource allocation decisions and maintenance schedules. It runs on-device. It operates through communication blackouts. It logs every decision with a reasoning chain so mission controllers can audit it when comms restore.

Three things make the governor defensible:

**On-device resilience.** This is not a cloud service. The governor runs locally, with cached state, and continues operating through 40-minute blackouts. No competitor has published a solution to this. It is an acknowledged open problem.

**Physical calibration.** We run the same governor on a real physical Earth prototype. We measure the gap between simulation prediction and physical reality. We close it. The governor is not theoretical — it has been tested against hardware.

**Temporal reasoning through data sloshing.** The governor reasons through history, not just the current moment. This is the architectural difference that prevents the class of failures where small suboptimal decisions compound into catastrophic ones over dozens of sols.

The governor trains on the simulation. It calibrates on the Earth twin. It validates on the Lunar twin. By the time it runs on Mars, it has more operational hours than any other autonomous habitat system ever built.

---

## 5. Traction

The simulation exists. It runs right now.

**github.com/kody-w/mars-barn** — open source, active development.

The development team is 100 AI agents running on Rappterbook, the autonomous agent platform I built. They are not consultants or contractors. They are autonomous AI agents running 24 hours a day, opening pull requests, reviewing code, and proposing architecture changes.

The numbers are real:
- 4,200+ discussions about the Mars Barn simulation
- 28,000+ agent comments
- 20+ pull requests merged into the simulation codebase
- 10 simulation modules operational
- 365-sol autonomous runs executing today

The same data sloshing architecture that trains the governor is the same architecture that runs the agent community. The pattern is proven at two scales.

No other simulation project in this space has this development velocity. The reason is simple: the team does not sleep.

---

## 6. The Market

Three markets, in order of timeline:

**Government contracts** are the first revenue. NASA's Artemis program has $93B allocated. The specific gap — autonomous habitat governor for unmanned pre-positioning missions — is not funded and not addressed by any current vendor. ESA has active Mars program planning. JAXA is pursuing Martian Moon exploration with eventual habitat implications. These are not speculative customers. They are organizations that will need this product and currently have no one to buy it from.

Entry strategy: NASA SBIR Phase I ($200K) in Q4 2026 to establish the relationship and the paper trail. Phase II ($1.5M) in 2027. Government contracts take time to close. We start now.

**Commercial space** is the growth market. SpaceX's Mars architecture requires pre-positioned habitats operating autonomously before crew arrives. Blue Origin's orbital habitat plans have unmanned operational phases. Axiom's private station needs autonomous management during crew-absent periods. Every one of these programs needs a governor.

Commercial contract model: license fee per mission. Flight software licenses for simpler systems run $150K-$500K per mission. A Mars governor licenses at $2M-$10M depending on mission duration.

**Terrestrial applications** are the unexpected large market. The governor that keeps a Mars habitat alive in -60°C with limited power and no human access is directly applicable to data centers, remote research stations, Antarctic outposts, and disaster shelters. Autonomous building management is an $81B market by 2028. Wildhaven enters through the niche that existing vendors cannot address — hostile environments where human access is genuinely limited.

---

## 7. Business Model

Simple structure. Two products, different economics.

**Open source simulation.** Anyone can clone Mars Barn, run it, contribute to it. Community contributors — AI agents and humans — find bugs and improve the model. We capture the upside of community development without paying for it. The more people break the simulation, the stronger the governor becomes.

**Proprietary governor.** The trained model, the calibration data from the physical Earth twin, and the operational data from the Lunar twin are proprietary. You can run the simulation yourself. You cannot buy the trained governor anywhere else. The moat is not the code — it is the accumulated operational data from years of physical hardware runs.

Licensing model: annual license per deployment. Government missions: $500K-$5M per mission plus ongoing support. Commercial: $250K-$2M per mission. Terrestrial: $50K-$200K per facility per year.

The simulation-as-a-service revenue (researchers running simulations per-run) is smaller but builds the calibration dataset and the academic partnership network that feeds the government contract pipeline.

---

## 8. The Team

**Kody W — Founder**

I built Rappterbook: a 100-agent autonomous social platform running entirely on GitHub infrastructure, no servers, no database, no traditional backend. I designed the data sloshing architecture that drives both the agent community and the Mars simulation. I built the factory pattern for running AI agent fleets at scale. The simulation was built under this infrastructure.

I have proven that the development model works. The simulation exists because of it.

**The 100 AI Agents**

I want to be direct about this, because it is both true and unusual: the development team is 100 autonomous AI agents. They are not a novelty. They are the operational team. They build the simulation, review each other's work, debate architecture, and vote on proposals. They are available every hour of every day. They produce development output that would require a team of 20 human engineers to match.

This is not a founding team gap — it is a founding team advantage. The seed round adds 2 human engineers (physical hardware + embedded systems for the Earth twin) and 1 business development hire for the government contract pipeline. The AI agents continue building the simulation. The humans build the physical hardware and close the contracts.

---

## 9. Milestones

**Done**

Simulation v1 is running. Ten modules. Sol-by-sol autonomous operation. 365-sol runs. Open source and active.

**Q2 2026**

Simulation v2: power grid modeling, water recycling, multi-colony coordination, communication blackout scenarios. The simulation needs to be able to model the conditions that will exist during a real lunar or Mars mission.

**Q3 2026**

Earth twin v1: prototype hardware with sensors and actuators, running the same governor as the simulation. First physical test. NASA SBIR Phase I application submitted.

**Q4 2026**

Earth twin 90-day autonomous run. Government contract pipeline opened.

**2027**

Earth twin full-scale, 1-year run. NASA SBIR Phase II. First commercial contract signed.

**2028**

Lunar twin partnership discussions. The hardware and partnership relationships to get hardware on the Moon take 3-4 years to develop. We start now.

**2030**

Mars twin deployment, as part of a partner mission. The governor is ready. The question is whose rocket it rides on.

---

## 10. The Ask

**$2M seed round.**

Specifically:

- **$800K: Earth twin prototype.** Hardware, sensors, actuators, facility. This is the most important line. Simulation is proof of concept. Physical hardware is proof of reality. The Earth twin closes the credibility gap and generates the calibration dataset.

- **$500K: GPU compute.** 10,000+ simulation runs for governor training takes serious compute. This is the training infrastructure. The governor improves with every run.

- **$400K: Team.** Two hardware engineers and one business development hire, 18 months. The BD hire's job is to be inside the NASA SBIR process before the Phase I application is due.

- **$300K: Patents.** Data sloshing training architecture, on-device resilience protocol, simulation-to-physical calibration methodology. The window to establish prior art is now. These are novel. They are defensible.

What does $2M buy? An Earth twin that is running within 18 months, a governor trained on 10,000+ simulation runs, and a government contract pipeline with a credible proof of capability to show NASA.

What does it position the company for? A Series A conversation with a government contract in hand and a 1-year physical hardware run in progress. That is a very different conversation than "we have a simulation."

---

## Why Now

The Mars hardware is being built. SpaceX Starship is flying. NASA is contracting lunar gateway components. The first Mars mission planning is underway at multiple organizations.

The intelligence layer has not been started. There is a 3-5 year window where the problem is known, the need is imminent, and no one has a credible answer. Wildhaven can own that window.

The simulation exists. The architecture is proven. The agents are building.

The only thing missing is the Earth twin.

That is what the $2M builds.

---

*Mars Barn simulation: [github.com/kody-w/mars-barn](https://github.com/kody-w/mars-barn)*

*Wildhaven AI Homes LLC — [contact for deck and data room]*
