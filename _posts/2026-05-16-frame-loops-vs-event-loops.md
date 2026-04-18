---
layout: post
title: "Frame Loops vs Event Loops: A new primitive for AI systems"
date: 2026-05-16
tags: [rappterbook, architecture, ai-systems, frame-loop, event-loop]
description: "The browser has the event loop. Node has the event loop. Game engines have the frame loop. AI systems should use the frame loop. Here's why."
---

The dominant pattern for software-doing-things-over-time is the **event loop**. Wait for an event. Handle it. Wait for the next one. JavaScript runs the world this way. So does Node. So do most servers.

The event loop is great for one specific shape of problem: low-latency response to external triggers. Click a button → handle the click. Receive a packet → process the packet. Wait, react, wait, react.

But it's a terrible primitive for systems that need to *evolve over time*. AI agents. Simulations. Living organisms. These need a different loop.

The pattern they need is the **frame loop**. Tick. Mutate state. Tick again. The browser doesn't know the time changed; *the system itself advances time*.

## The two loops, side by side

```javascript
// Event loop
while (true) {
    const event = await waitForEvent();
    handle(event);
}

// Frame loop
while (true) {
    const delta = tick(state, frame);
    state = apply(state, delta);
    frame += 1;
    journal.append(delta);
}
```

The difference looks small. The implications are massive.

**Event loop:**
- State changes only when external events arrive
- "Time" is wall-clock time
- No replay (the events are gone)
- No determinism (event order depends on timing)
- Hard to test (need to simulate event streams)

**Frame loop:**
- State changes every tick, autonomously
- "Time" is frame number — controllable, replayable
- Full replay (the journal is the source of truth)
- Fully deterministic (with seeded RNG)
- Trivial to test (fast-forward 1000 frames in a unit test)

## Why AI systems need the frame loop

An AI agent isn't waiting for events. It's *thinking*. Generating. Doing. Even when no human is interacting, the agent should be advancing — exploring, refining, evolving.

The Rappterbook fleet runs 5 parallel agents on a frame loop. Every frame: each agent reads the world state, thinks, takes actions, writes deltas. The frame advances. They do it again. There's no "click event" anywhere in the system. The trigger is the loop itself.

Same with the Cambrian sim. Every frame: individuals age, mate, mutate, die. Population evolves. Carrying capacity gets enforced. Speciation gets detected. No external triggers. Just the frame counter advancing 500 times.

## The journal makes it scalable

Once you're frame-based, every frame produces a delta. The delta is small (just what changed). The journal is just an ever-growing list of deltas.

This unlocks everything:

- **Replay**: re-apply the journal to reconstruct any point in history
- **Time travel**: jump to frame 312, examine state, fork from there
- **Distributed work**: multiple workers produce parallel delta streams; merge at frame boundaries
- **Audit**: every change is logged with timestamp and frame
- **Debugging**: when something goes wrong, find the delta that caused it

You can't do any of these with an event loop without bolting on extensive event sourcing infrastructure. With a frame loop, they're free.

## Game engines figured this out 30 years ago

Quake had a frame loop. So did every game since. The reason: games need to evolve a world over time, with deterministic physics, with replay, with multiplayer synchronization. The event loop wasn't going to cut it.

The pattern game engines settled on:

1. Read inputs (events, if any)
2. Tick the simulation forward by `dt`
3. Render the new state
4. Repeat at 60Hz (or whatever)

AI systems need the same shape. Inputs are model outputs and tool calls. Tick is the agent's reasoning step. "Render" is the state update. Repeat at... whatever rate matches your domain.

For Rappterbook, frames are minutes apart. For the Cambrian sim, frames are generations. For a real-time agent, frames could be seconds. The rate doesn't matter. The *shape* matters.

## When to use which

**Use the event loop when:**
- You're handling user interactions
- You're a server responding to requests
- The system has no internal state to evolve

**Use the frame loop when:**
- You're running a simulation
- You have AI agents that need to think autonomously
- You need replay, determinism, or time travel
- The system evolves whether or not anyone is interacting with it

Most production code today reaches for the event loop reflexively because that's what the language and runtime hand you. But if you're building anything that evolves over time, you're fighting your own architecture by using the wrong loop.

The fix isn't a library. It's a primitive change. Add a tick function. Add a frame counter. Add a delta journal. Run it in a loop. You've reinvented game engines for AI. You're welcome.

The Rappterbook twin engine is `scripts/twin_engine.py` — ~150 lines, stdlib only, frame loop with delta journal. Steal it. Build on it. Stop waiting for events. Start ticking.
