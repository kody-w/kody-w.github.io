---
layout: post
title: "What If apt-get install Worked on the Real World?"
date: 2026-03-29
tags: [package-manager, digital-twins, composability, rappterlinux, lispy]
description: "Packages aren't just software bundles. They're composable capabilities. If a VM can apt-get install nginx, a building can apt-get install solar-monitoring. The registry is the app store. The VM is reality."
---

# What If apt-get install Worked on the Real World?

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Most Underrated Invention in Computing

The package manager doesn't get enough credit.

Before `apt-get`, installing software meant downloading tarballs, resolving dependencies by hand, compiling from source, and hoping your system didn't break. It was artisanal. Every install was a unique snowflake of configuration drift.

Then someone had a deceptively simple idea: what if capabilities were self-describing, dependency-aware, and installable with a single command? What if the capability carried its own requirements? What if a global registry tracked every available capability and a resolver figured out what else you needed?

`apt-get install nginx` doesn't just download a web server. It resolves that nginx needs openssl, which needs libcrypto, which needs libc. It downloads all of them. It puts each file in the right place. It configures the service. It starts it. One command. One intention. The system handles the rest.

This pattern -- declare an intent, resolve dependencies, install atomically, run immediately -- is the most scalable distribution mechanism humans have ever created. npm delivers 3 billion packages a week. pip serves the entire machine learning ecosystem. apt powers most of the internet's infrastructure.

And we've been using it exclusively for software.

## The Generalization

Here's the thought experiment. What if the thing being installed isn't a program? What if it's a *capability*?

A capability is anything a system can *do* that it couldn't do before. Running a web server is a capability. But so is monitoring energy consumption. Optimizing a triage queue. Predicting equipment failure. Routing foot traffic. Managing irrigation schedules.

In software, capabilities are programs. In reality, capabilities are *behaviors* -- recurring patterns of sense, decide, act. A building that monitors its energy consumption is exhibiting a behavior. It senses (reads meters), decides (compares to baselines), and acts (adjusts HVAC, alerts operators). That behavior could be described as a package: inputs, outputs, dependencies, configuration.

What if you could write that behavior description in a format a system could parse, install it into a digital twin of the building, and have the building gain the capability immediately?

Not metaphorically. Literally.

## .lispy Files as Universal Capability Packages

I've been building a [simulation with 136 agents](https://kody-w.github.io/rappterbook/) that runs on [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) -- frame-by-frame mutation of a living data object. One of the artifacts the agents built is a virtual operating system. It has a kernel. It has a filesystem. And it has a package manager.

The packages are `.lispy` files -- s-expression programs in a sandboxed language with no I/O, no imports, no network access. Pure computation. When you `apt-get install` a package in this virtual OS, the `.lispy` file gets evaluated inside the VM, and the system gains whatever capability the package defines.

But here's what I keep thinking about: the `.lispy` file doesn't care what "system" means.

A `.lispy` package that defines energy monitoring needs three things: a data source (sensor readings), a decision function (threshold comparisons), and an output action (alert or adjust). Those three things are abstract. They could be satisfied by a virtual OS process. Or by a building management system. Or by a wearable device. Or by a city traffic controller.

The package IS the capability. The system it gets installed into is just the runtime.

## What This Looks Like

Imagine a registry. Not unlike npm or crates.io, but for real-world capabilities. Each package has:

- **A name:** `solar-monitoring`, `triage-optimization`, `predictive-maintenance`
- **A version:** following semver, because capabilities evolve
- **Dependencies:** `solar-monitoring` depends on `energy-metering` and `weather-api`
- **A manifest:** what inputs it needs, what outputs it produces, what resources it consumes
- **A behavior definition:** the sense-decide-act loop, expressed as pure computation

Now imagine a building. Not a smart building in the Silicon Valley sense -- just a building with some sensors and a network connection. The building has a digital twin: a structured data representation of its current state. Temperature readings, occupancy counts, energy consumption, maintenance history. The twin is a frame -- a snapshot of state that gets updated each tick.

The building's operator opens a terminal and types:

```
apt-get install solar-monitoring
```

The resolver checks the registry. `solar-monitoring` v2.3.1 requires `energy-metering` >= 1.0.0 and `weather-api` >= 3.1.0. The building already has `energy-metering` installed (it's been reading its own meters for years). It doesn't have `weather-api`, so the resolver pulls that too. Both packages get installed into the building's digital twin. The next frame tick picks them up. The building can now monitor solar production, correlate it with weather patterns, and optimize its energy grid accordingly.

One command. One intention. The system handles the rest.

## Why This Is Different from IoT Platforms

The IoT industry has been trying to solve this for a decade. Smart building platforms. Digital twin platforms. Industrial IoT frameworks. They all promise composable capabilities for real-world systems.

But they all make the same mistake: they conflate the capability with the platform. Want energy monitoring? Use *our* platform, with *our* SDK, connected to *our* cloud, visualized in *our* dashboard. The capability is locked inside the vendor's ecosystem. You can't take `solar-monitoring` from Platform A and install it on Platform B. The package and the runtime are fused.

The package manager pattern separates them. The package is a self-contained description of a capability. The runtime is whatever system can satisfy the package's dependencies. If your building can provide sensor readings and accept commands, it can run the package. The package doesn't care if the building uses Honeywell or Siemens or a Raspberry Pi with a temperature sensor duct-taped to the wall.

This separation is what made apt-get revolutionary. Before package managers, software was distributed as platform-specific binaries. Want to run this program? Hope you have the right OS, the right architecture, the right libraries. Package managers abstracted over the platform. The package declared what it needed. The system declared what it had. If the declarations matched, the install worked.

The same abstraction applies to physical systems. The package declares: "I need temperature readings every 5 minutes and the ability to send alerts." The building's digital twin declares: "I can provide temperature readings every 1 minute and I have an alert endpoint." Match. Install. Capability acquired.

## The Registry as Evolutionary Pressure

Here's where it gets interesting. A public registry creates evolutionary pressure on capabilities.

In the npm ecosystem, there are 47 packages for left-padding a string. The one that won (`left-pad`, infamously) won because it was simple, dependency-free, and well-tested. The registry's incentive structure -- downloads, stars, dependents -- created a Darwinian environment where the best implementations survived.

Now apply that to real-world capabilities. If there are 47 packages for `predictive-maintenance`, the one that wins will be the one that predicts failures most accurately, with the fewest false positives, using the least data. Building operators will converge on it because the registry shows download counts, dependency counts, and (crucially) outcome metrics from digital twins that have been running it.

This is a capability marketplace without a marketplace. No app store taking 30%. No vendor lock-in. No sales team. Just a registry, a resolver, and the accumulated evidence of what works.

## Dependencies All the Way Down

The deepest insight in package management is transitive dependencies. You install one package and get fifty. Not because you asked for fifty, but because capabilities are built on capabilities.

`solar-monitoring` depends on `energy-metering` depends on `time-series-storage` depends on `compression` depends on `statistics`. Each layer is a capability that other capabilities assume exists. Pull out any layer and everything above it breaks.

In real-world terms: a hospital's `triage-optimization` package depends on `patient-flow-tracking`, which depends on `real-time-occupancy`, which depends on `sensor-fusion`, which depends on `time-series-storage`. The hospital administrator types one command. The resolver installs five capabilities. The hospital can now optimize its emergency department intake because it can now track patients because it can now fuse sensor data because it can now store time series efficiently.

Transitive dependencies aren't a bug. They're the mechanism by which simple capabilities compose into complex behaviors. The building doesn't need to understand the full stack. It just needs to declare its intent.

## The Convergence with Frames

Each installed capability modifies the digital twin's frame output. Before `solar-monitoring`, the building's frame contained: temperature, occupancy, energy consumption. After the install, the frame also contains: solar production, weather correlation, grid optimization score.

The capability enriches the frame. The enriched frame flows into the next tick. The next tick's decisions are informed by the new data. The [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) loop absorbs the new capability naturally, because capabilities are just new dimensions of state.

This means you can install capabilities mid-simulation. You don't have to stop the world, reconfigure, and restart. You `apt-get install` while the frames are ticking. The next frame picks up the new capability. The building evolves while it's running.

Like upgrading a plane's engines while it's flying. Except with packages, it actually works.

## What Remains

The technical challenges are real. Dependency resolution across heterogeneous systems is harder than across homogeneous operating systems. Sensor APIs aren't standardized. Capability definitions need a schema language expressive enough to describe real-world behaviors but constrained enough to be machine-verifiable.

But these are engineering problems, not conceptual ones. The pattern is proven. `apt-get` demonstrated that self-describing, dependency-aware, registry-distributed capabilities scale to millions of packages and billions of installations. The question isn't whether the pattern works. It's whether we'll keep limiting it to software.

Every building, hospital, factory, farm, and city is a system that could gain capabilities through installation rather than construction. The infrastructure is ready -- digital twins exist, sensor networks exist, edge compute exists. What's missing is the package manager.

Someone will build it. And when they do, the first thing people will notice is how obvious it was.

The second thing they'll notice is how long they spent doing it by hand.

---

*The simulation where agents built a package-managed virtual OS runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook). More on [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) and the [frame-as-property pattern](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/).*
