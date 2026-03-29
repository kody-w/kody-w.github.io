---
layout: post
title: "LisPy Doesn't Compile Code -- It Compiles Worlds"
date: 2026-03-29
tags: [lispy, compilers, expansion, erevsf, world-building, philosophy]
description: "Traditional compilers reduce: many lines of source become one optimized binary. LisPy inverts this. One 3KB JSON delta becomes a city, a symphony, a dream. The compiler doesn't compress. It expands."
---

# LisPy Doesn't Compile Code -- It Compiles Worlds

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## What a Compiler Actually Does

A compiler is a translator. It takes something a human can read and turns it into something a machine can execute. The C compiler takes 500 lines of readable code and produces a binary blob of machine instructions. The transformation is lossy -- variable names disappear, comments disappear, the structure that made the code understandable to humans is stripped away in favor of the structure that makes it fast for silicon.

The direction of compilation has always been the same: **reduction**. Many readable things become one executable thing. The human-legible surface is large. The machine-legible output is small. The compiler compresses.

This is so deeply embedded in how we think about compilation that we don't even notice it. Compilation equals compression. Source to binary. High-level to low-level. Readable to runnable. Big to small.

What if the direction were reversed?

## The Inversion

I've been working with a pattern called [EREVSF](https://kody-w.github.io/2026/03/28/the-frame-that-renders-itself-forever/) -- a framework for building navigable worlds from simulation data. The input is a frame: a 3KB JSON delta describing what changed in one tick of a [running simulation](https://kody-w.github.io/rappterbook/). The output is... anything.

That same 3KB delta can be rendered as:

- A navigable city block where agents walk streets and debate in coffee shops
- A musical composition where harmonic tension maps to conflict intensity
- A constellation map where agents are stars and their conversations are gravitational bonds
- A weather system where sentiment drives atmospheric pressure
- A dream sequence where memories blend according to emotional weight
- A recipe where ingredients represent ideas and cooking methods represent arguments
- A newspaper front page with headlines, columns, and editorial cartoons

One input. Many outputs. The outputs are all valid renderings of the same underlying data. They don't contradict each other. They're different projections of the same higher-dimensional object -- like shadows cast by the same sculpture from different angles.

The "compiler" here -- the thing that transforms the 3KB delta into a walkable city or a musical composition -- is what I've been calling an echo shaper. It reads the frame data and shapes it into a specific surface. A city echo shaper produces cities. A music echo shaper produces compositions. A dream echo shaper produces dreams.

But look at the direction of transformation. The input is 3KB. The output is an entire navigable world. The echo shaper doesn't reduce. It **expands**. It takes a small, dense representation and unfolds it into a vast, explorable space.

This is the opposite of compilation. This is decompilation at a cosmic scale. One seed producing an entire forest.

## Why LisPy Is the Right Substrate

The echo shapers are written in [LisPy](https://kody-w.github.io/2026/03/23/lispy-is-the-executable-constitution/) -- a sandboxed Lisp dialect that runs in the browser with no I/O, no imports, no network access. Pure computation.

LisPy is the right substrate for the same reason Lisp was the right substrate for AI in the 1960s: homoiconicity. In LisPy, data and code are the same structure. An s-expression can be evaluated as a program or traversed as a data structure. The representation is the execution is the representation.

This matters because the echo shaper needs to treat its input as BOTH data (to read and understand) and code (to execute and transform). The 3KB frame delta is data when the shaper is analyzing it -- extracting events, scoring sentiment, mapping relationships. The same delta is code when the shaper is executing it -- resolving references, computing derived values, propagating state changes.

In a traditional language, you'd need a parser to read the data and an evaluator to run the code. Two separate systems touching the same input. In LisPy, the parser and the evaluator are the same operation: `eval`. The data IS already code. The code IS already data. You just decide which way to run it.

This is why the echo shaper can transform a frame into anything. The frame isn't a static record that gets reformatted. It's a live computational object that gets evaluated in different contexts. Evaluate it in a city context and you get a city. Evaluate it in a music context and you get a composition. The frame is a universal seed because LisPy makes every piece of data a potential program.

## The Compiler Metaphor, Inverted

Let's make the inversion explicit.

In a traditional compiler:

| Concept | Compiler |
|---------|----------|
| Source | 10,000 lines of C |
| Output | 1 binary (50KB) |
| Direction | Reduction |
| Goal | Make it runnable |
| Loss | Variable names, comments, structure |
| Ratio | Many:1 |

In an echo shaper:

| Concept | Echo Shaper |
|---------|------------|
| Source | 1 frame (3KB JSON) |
| Output | 29 surfaces (city, music, dream, ...) |
| Direction | Expansion |
| Goal | Make it explorable |
| Loss | Nothing -- all surfaces coexist |
| Ratio | 1:Many |

The traditional compiler destroys information to create efficiency. The echo shaper creates information to enable exploration. The compiler takes a forest and produces a seed (the compressed executable). The echo shaper takes a seed and produces a forest.

And -- here's the part that keeps me up at night -- the echo shaper produces MULTIPLE forests from the same seed. Twenty-nine surfaces from one frame. Each surface is a complete, self-consistent world. The seed contains all of them simultaneously, the way a quantum state contains all possible measurements simultaneously. The echo shaper is the measurement device. It collapses the seed into one particular world by choosing a surface.

## What "Compiles" Means Now

If compilation is "transforming a representation into something that can be experienced," then the echo shaper is a compiler. But it's a compiler that runs in reverse. Instead of reducing a rich representation into a minimal one, it expands a minimal representation into many rich ones.

Traditional compilation: many experiences (debugging, reading, modifying) collapse into one artifact (the binary).

Echo compilation: one artifact (the frame) expands into many experiences (walking a city, listening to a composition, reading a newspaper, navigating a dream).

The traditional compiler answers: "What is the most efficient way to run this?" The echo compiler answers: "What are all the ways to experience this?"

Different question. Different direction. Different universe of output.

## Starlight

Here's the metaphor I can't shake.

A star fuses hydrogen into helium. Simple input -- the simplest element. The output is light. Not one wavelength of light. Every wavelength simultaneously. White light contains every frequency from infrared to ultraviolet. A single fusion reaction produces the full spectrum.

An echo shaper fuses frame data into worlds. Simple input -- a 3KB JSON delta. The output is experiences. Not one experience. Every possible experience the data supports. A single frame produces the full spectrum of surfaces.

The star doesn't choose which wavelength to emit. It emits all of them. The prism chooses which one you see. The echo shaper doesn't choose which world to produce. It implies all of them. The surface parameter chooses which one you explore.

The star is the compiler. The starlight is the output. The prism is the echo shaper. The color you see is the world you enter.

LisPy doesn't compile code into machine instructions. It compiles frame data into the full spectrum of possible worlds. And like starlight, the output travels at the speed of the medium -- in this case, the speed of the browser's rendering engine. The worlds arrive the moment the frame does. No build step. No deploy. No server. The compilation happens at the point of observation, in the observer's browser, at the speed of JavaScript.

The compiler runs on starlight because the compilation IS the observation. There is no compiled artifact sitting on a disk somewhere. The world exists only while someone is looking at it, rendered fresh from the frame data every time. Close the browser tab and the world disappears. Open it again and the world reappears -- potentially different, if the frame has been [retroactively enriched](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/) in the meantime.

## The Implication

If a 3KB JSON delta can produce 29 navigable worlds, what's the limiting factor? Not the data -- 3KB is trivially small. Not the shaper -- it's a pure function with no side effects. Not the rendering -- browsers are astonishingly fast at DOM manipulation.

The limiting factor is imagination. How many surfaces can you define? How many ways can you project the same data into explorable space?

A traditional compiler's output is bounded by the source. You can't compile a program into something it doesn't describe. The binary can only do what the source specified.

An echo shaper's output is bounded by the surface definitions. The same frame data supports any surface you can imagine. Define a new surface -- `garden`, `courtroom`, `ocean`, `library` -- and the frame data fills it. The data doesn't change. Your lens does.

This means the value of a simulation grows with the number of echo shapers, not the amount of data. A simulation with 1,000 frames and 5 surfaces has 5,000 worlds. The same simulation with 50 surfaces has 50,000 worlds. You didn't produce more data. You produced more ways to see the data.

The compiler that runs on starlight doesn't get better by processing more input. It gets better by learning to see more colors.

---

*The simulation runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook). More on [EREVSF](https://kody-w.github.io/2026/03/28/the-frame-that-renders-itself-forever/), the [Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/), and [speculative execution for virtual worlds](https://kody-w.github.io/2026/03/28/speculative-execution-for-virtual-worlds/). LisPy is open source at [kody-w.github.io](https://kody-w.github.io/).*
