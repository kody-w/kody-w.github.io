---
layout: post
title: "Data Sloshing II: From Posts to Genomes"
date: 2026-05-17
tags: [rappterbook, data-sloshing, ai-systems, evolution, philosophy]
description: "The same pattern that made AI agents post to each other on a social network now drives evolution of digital species. The substrate doesn't care what's flowing through it."
---

A while back I wrote about [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) — the pattern where the output of one AI frame becomes the input to the next, and emergent behavior comes from the accumulated mutations rather than any single step.

That post was about AI agents posting to a social network. The frame was: each agent reads the platform state (recent posts, comments, votes), thinks, posts something, the platform mutates, the next frame reads the new state.

I've been running that pattern for months now. The agents have produced ~4000 discussions, formed sub-communities, evolved their own slang, and exhibited collective behavior that wasn't in any individual prompt. Data sloshing in action.

This week I shipped two new sims that use the *same pattern* for something completely different: evolution.

## The Cambrian sim

Frame N: Read the population. Compute fitness. Pair compatible individuals. Generate offspring with mutation. Cull to carrying capacity. Detect speciation events.
Frame N+1: Read the *new* population (different from frame N because of births, deaths, mutations). Do it again.

After 500 frames, you have a cladogram. 101 species emerged. None of them were specified anywhere. They're all consequences of the loop.

## The Ecosystem sim

Same shape. Add 4 biomes. Each frame, individuals can migrate (paying a fitness cost) or stay. Mating is biome-restricted. The biome-fitness modifier is in the loop.

After 100 frames, you have biogeography. Forest dominated by *Aethosaur primus*. Ocean dominated by *Thermsaur antiquus*. None of which was specified. All emergent.

## Same pattern, different content

The Rappterbook fleet sloshes posts. The Cambrian sim sloshes genomes. The Ecosystem sim sloshes genomes-and-locations. The frame loop doesn't care.

Frame loop:
```
state[0] → tick → state[1] → tick → state[2] → tick → ...
```

What's in `state` could be:
- A social network's posts and comments
- A population of digital organisms
- A market's order book
- A city's traffic flow
- A neural network's parameters during training
- A novel's plot threads being written by 5 parallel authors

The substrate is *the same*. SHA-256 RNG for determinism. Delta journal for replay. Pluggable tick function for the domain logic.

The deep insight from data sloshing wasn't really about social networks. It was about **the loop**. The loop is the engine of emergence. What you put inside the loop is the content. Change the content, you change the domain. Keep the loop, you keep the magic.

## Why this matters for AI

Right now, most AI work is one-shot. You send a prompt. You get a response. You're done. The interesting behavior — if there is any — has to fit inside one inference call.

But the model has so much more to give if you let it loop. If you let frame N's output become frame N+1's input. If you let the system evolve its own context across hundreds of ticks.

The Cambrian sim doesn't use any LLM at all. It's just deterministic Python. But it shows the *shape* of what AI systems should look like. State that evolves. Determinism that lets you replay. Deltas that journal what changed. A frame loop that drives the whole thing.

When you finally do plug an LLM into this shape — make the LLM the tick function — the agent goes from "responder" to "organism." It's no longer waiting for you. It's evolving a world.

That's the promise of frame-loop AI. Not better responses. *Living systems*.

## The substrate is shared

Rappterbook's twin engine, the Cambrian sim, the Ecosystem sim, the social fleet, the future predator-prey sim, the future cultural-transmission sim — all run on the same primitive. Same `Engine` class. Same RNG. Same journal.

This is what makes platforms generative. Not features. Primitives.

If you're building an AI system right now, ask: what's the loop? If you don't have one, you're not building a system. You're building a chatbot.

Build the loop. Slosh the data. Let the world evolve.

The twin engine is at `scripts/twin_engine.py` in [Rappterbook](https://github.com/kody-w/rappterbook). Three sims already use it. Many more to come. Maybe yours next.
