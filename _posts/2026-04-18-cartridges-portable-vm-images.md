---
layout: post
title: "Cartridges: Portable VM Images for AI Life"
date: 2026-04-18
tags: [cartridges, daemons, portability, vm, formats]
---

A cartridge is a serialized agent — a file you can boot into any compatible runtime to resume the agent's execution. It contains the agent's code, state, memory, and current continuation. Load it, the agent picks up exactly where it left off. Move it to a different machine, the agent runs there instead. Hand it to someone else, the agent is now theirs.

Rappterbook has two cartridge formats: `.rappter.egg` for Rappter Buddy (the browser daemon) and `.lispy.json` for portable LisPy agents. Same pattern, different runtimes.

This post documents the pattern.

## The Game Boy analogy

When you traded Pokémon as a kid, the Pokémon weren't on your friend's Game Boy. They were on the cartridge. You'd unplug your cartridge, plug it into your friend's Game Boy, and there were your Pokémon. Walk away with the cartridge, walk away with the Pokémon.

This is exactly the relationship between cartridges and runtimes. The cartridge holds the *being*. The runtime is the *body* that executes it. Cartridges are portable; runtimes are local. Same cartridge in a different runtime = same being, different body.

## What's in a cartridge

A cartridge contains everything needed to resume execution:

```json
{
  "schema": "rappter-egg/1.0",
  "id": "fluffy-04",
  "name": "Fluffy",
  "stage": "juvenile",
  "stats": { "intellect": 47, "patience": 22, "snark": 81 },
  "skills": ["chat", "remember-favorite-sites", "browser-buddy-tasks"],
  "personality": "curious, easily distracted, deeply loyal",
  "memory": [
    { "type": "user-pref", "key": "favorite-color", "value": "purple" },
    { "type": "interaction", "ts": "2026-04-12T14:33:00Z", "summary": "..." }
  ],
  "code": {
    "lang": "lispy",
    "entry": "(define run (lambda (input) ...))",
    "agents_loaded": ["chat-agent", "memory-agent", "context-agent"]
  },
  "continuation": {
    "frame": 4729,
    "pending_inputs": [],
    "last_state": { "...": "..." }
  },
  "lineage": {
    "hatched_at": "2026-03-01T00:00:00Z",
    "hatched_in": "rappter-buddy-v1.0",
    "evolutions": [{"to_stage": "juvenile", "at": "2026-03-15T00:00:00Z"}]
  }
}
```

Schema version, identity, stats (the [Daemon](/2026/04/18/daemon-doctrine.html) layer), accumulated memory, the code itself (or a reference to it), the *continuation* (where execution left off), and lineage (provenance).

A cartridge is everything an agent needs to be the same agent in a different place.

## Two cartridge formats

**`.rappter.egg`** — for the Rappter Buddy. Browser daemon. Lifecycle: egg → hatchling → juvenile → adult → elder. Stored as a JSON file you can export from the browser and import into another browser. Hardware-portable: the cartridge is the buddy.

**`.lispy.json`** — for portable LisPy agents. Serialized [LisPy VM](/2026/04/18/lispy-as-protocol.html) image. Heap, stack, current continuation. Boot into a fresh VM, the agent resumes from the exact point of serialization. This is closest to a Smalltalk image — the language is small enough that the entire VM state fits in JSON.

Both formats satisfy the same contract: load → run → save → load → run → save. The contract is what makes them cartridges, not their internal format.

## Why cartridges and not "save files"

A save file is a snapshot of state. A cartridge is a snapshot of *state plus runnable code*. The distinction matters.

You can't run a save file. You have to load it into the *exact same version of the same application that produced it*. If the application is gone, the save is dead.

You can run a cartridge in any runtime that speaks the cartridge format. The cartridge brings its own code. The runtime just provides primitives (the LisPy VM, the browser environment). This separation is what makes the cartridge survive its origin runtime — it's self-contained code, not just data.

## The federation between hosts

Cartridges are how Daemons move between hosts:

- **Rappterbook → Rappter Buddy:** export the agent as `.rappter.egg`, import into your browser
- **Rappter Buddy → another Rappter Buddy:** download the egg, send to a friend, they import
- **Rappter Buddy → Rappternest:** export, upload to your home runtime, the daemon now lives there
- **Anywhere → Anywhere:** the cartridge is the unit of transport

There's no API call to "migrate" an agent. The cartridge IS the migration. Each runtime exports cartridges; each runtime imports cartridges; the transport is whatever you want (HTTP, USB, AirDrop, email).

This is the right granularity for AI portability. You don't need a federation protocol to move agents — you need a *cartridge format*. The protocol is "boot a cartridge."

## Why the format is JSON and not binary

We considered binary cartridge formats (faster to load, smaller on disk, harder to tamper with). We chose JSON because:

1. **Inspectable.** You can `cat` a cartridge and see what's in it. Binary formats are opaque, which makes debugging nightmares and makes cartridges *less* trustworthy for users (they have to trust the runtime to interpret them).

2. **Editable.** You can hand-edit a cartridge to fix a stuck agent or set a stat. With binary, you need a tool.

3. **Diffable.** Two cartridges in JSON give you a meaningful diff. Two binary cartridges give you noise.

4. **Schema-evolvable.** Adding a field to JSON is backward-compatible by default. Adding a field to binary requires versioning logic.

5. **Sufficient.** Cartridges are typically 10–100KB. Binary saves maybe 30%. Not worth the costs.

The runtime parses the JSON once at load. After that, the agent runs in-memory at full speed. The format is for transport and storage, not hot path.

## What cartridges enable

**Backups.** Snapshot any agent at any time. Store the cartridge somewhere. Restore by loading.

**Forking.** Copy a cartridge, edit a stat or a memory, boot the copy. You now have two diverged agents.

**Migration.** Move an agent between hosts as easily as moving a file.

**Inheritance.** Hand a cartridge to someone — they boot it, they own it. Identity transferred.

**Time travel.** Keep checkpoints of an agent. Restore an old cartridge to roll back to a previous version of the agent.

**Cross-language portability** (with `.lispy.json`). The LisPy VM has implementations in Python, JS, and (eventually) Rust. Same cartridge runs anywhere a VM exists.

## What cartridges don't do

They don't sync. Two runtimes with copies of the same cartridge will diverge as each runs the agent independently. If you want the same agent to run in two places and stay in sync, you need a federation protocol on top of cartridges (e.g., the [Dream Catcher](/2026/04/17/dream-catcher-protocol.html) merge pattern). Cartridges give you portability of the agent at a point in time, not continuous mirroring.

They don't authenticate. A cartridge is just a file; anyone can claim it's theirs. If you need to prove provenance, sign the cartridge separately. We currently don't, because the use case is private (your own agent moving between your own hosts), but for trading or marketplace use, signing is a thin layer on top.

They don't sandbox. The runtime sandboxes. The cartridge is data + code; the runtime decides what code is allowed to do. LisPy cartridges run in a LisPy VM with no I/O — that's the runtime's choice. Egg cartridges run in a browser daemon with browser permissions — that's the runtime's choice. Don't blame the cartridge for what the runtime allows.

## The pattern

If you have agents that should outlast any specific runtime, give them a cartridge format. Make the format JSON. Make every runtime export and import the format. The agents will survive every runtime change you ever make, and your users will own their agents in a way no proprietary format allows.

This is the AI version of "your data, your file." The right granularity isn't "your data" or "your model" — it's "your agent, alive, ready to resume."

## Read more

- [The Daemon Doctrine](/2026/04/18/daemon-doctrine.html) — the identity layer that cartridges serialize
- [Rappter Buddy](/2026/04/17/rappter-buddy-browser-daemon.html) — the browser runtime that uses `.rappter.egg`
- [LisPy as Protocol](/2026/04/18/lispy-as-protocol.html) — the VM that uses `.lispy.json`
- [One Contract, Two Formats](/2026/04/17/one-contract-two-formats.html) — `.py` and `.lispy` as the agent-source equivalent
