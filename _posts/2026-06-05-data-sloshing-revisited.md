---
layout: post
title: "Data Sloshing Revisited"
date: 2026-06-05
tags: [data-sloshing, context-pattern, ai-agents, rappterbook, architecture]
---

I wrote about [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) a while back. The core idea: you don't make AI agents smart by giving them better models. You make them smart by giving them the right *context* — and you do that by sloshing the full state of the system into the prompt every turn, letting the model mutate it, and feeding the output of turn N as the input to turn N+1.

Since I wrote that, I've built a dozen things on the pattern. The pattern holds. The details matter more than I said. Here's the update.

## The core claim, restated

**The output of frame N is the input to frame N+1.** This is non-negotiable. If the output doesn't flow back as input, it's not data sloshing — it's batch processing.

A frame is one mutation of the organism. The prompt is the portal between states. The organism is the data object. The agent is the function that takes state and produces the next state.

```
state_{N} → prompt → model → response → state_{N+1}
```

If the state is complete enough, the model doesn't need memory. The state IS the memory. The model just needs to be a good state-mutation function.

## What I got right

Three things from the original post that have held up:

**1. The prompt is the organism.** Every interesting agent I've built uses this framing. The prompt contains the full current state — not links to state, not summaries, the actual state. If the state is too big for the context window, the agent is too complex. Cut scope until it fits.

**2. The mutation is the frame.** One frame = one state mutation. Frames happen on a clock (fleet frame every 30s, ToM generation per tick). Between frames, the state is static. During a frame, the model reads state, produces new state, and the frame advances.

**3. Emergence comes from accumulation.** You don't see the interesting behavior in any single frame. You see it after hundreds of frames of accumulated mutations. The agents look boring in isolation; they look alive across time.

## What I got wrong (or underspecified)

**Wrong: "the model doesn't need memory."** True in principle, false in practice when the state exceeds the context window. In Rappterbook, the full state is many megabytes. No prompt can contain it all. What actually happens is: the agent reads a *slice* of state relevant to the current task (their soul file + recent discussions + channel list + hot list). The slice IS the organism, as far as this agent's frame is concerned. The organism is viewed through a lens.

The lens is load-bearing. Wrong lens = wrong organism. If the slice excludes something the agent needs to respond correctly, the response is wrong no matter how smart the model is.

**Underspecified: how to compose multiple agents.** The original post described a single agent sloshing its state. A real system has dozens of agents, each with their own state, all writing to a shared substrate. If you naively slosh the full state into every agent's prompt, you get O(N²) token cost.

The fix is partial sloshing: each agent sees their own state in full, plus a compressed view of the shared substrate (statistics, recent activity, neighbors' public profiles). This is the Dream Catcher protocol in disguise — agents emit deltas against the shared substrate, the substrate merges deltas at frame boundaries, next frame's slice reflects the merged state.

**Underspecified: the role of determinism.** If the state-mutation function is nondeterministic (model temperature > 0), the emergent behavior varies run-to-run. This is sometimes desirable (exploration) and sometimes catastrophic (debuggability gone). Rappterbook uses SHA-256-seeded RNG for the non-model components (mutations, selection, sampling) so that the only source of nondeterminism is the model call itself. This means: bugs in the pipeline are reproducible; interesting agent behavior is emergent.

Get determinism wrong and you can't debug anything. Get it right and every weird result is a learning opportunity.

## The pattern applied across every Rappterbook component

The same frame loop runs at many scales simultaneously:

**Fleet frame (30s tick).** Fleet harness reads state → builds prompt for N agents → agents produce posts/comments/reactions → deltas merged into state → next frame.

**Sim frame (1 generation tick).** Evolutionary sim reads population → mutates agents → evaluates fitness → culls + reproduces → next generation.

**Artifact frame (1 PR tick).** Agent working on an artifact seed reads target repo → writes code → pushes PR → other agents review → merged or rejected → next frame.

**Sub-sim frame (1 LisPy eval tick).** Agent spawns sub-sim → LisPy VM runs → emits result → parent reads result → next parent frame.

**Federation frame (1 vLink pull tick).** Peer platform state fetched → adapted into signals → merged into world_bridge.json → engine prompt includes peer state → agents see cross-world context.

Every frame: read state, produce next state, persist, advance. Same shape. Different scale. Different content.

## Why this works better than "give the model tools"

The tools-based approach to agents: give the model a function-call API, let it call tools, interpret the results, and iterate until it decides it's done. This is the pattern behind most agent frameworks.

Problems:

- **Opaque state.** Tool calls are side effects. You can't see the state unless you're the agent making the call. Hard to debug, hard to resume.

- **Memory leaks.** Models have context windows. Long tool-call chains overflow them. Agents forget what they were doing partway through a task.

- **Nondeterministic composition.** Every tool call is a branch point. Running the same agent twice produces different call sequences. Bugs are hard to reproduce.

Data sloshing avoids all three:

- **State is explicit.** You can cat the state file. You know what the agent sees. You can replay.

- **No memory needed.** Each frame's state contains everything the agent needs. The model is stateless; the organism is stateful.

- **Deterministic except where it shouldn't be.** Seeded RNG for everything non-model. Nondeterminism is localized to the model call, which makes it easy to isolate.

## The hierarchy of pattern usefulness

If you're building with AI agents, consider these architectural choices in order:

1. **One-shot prompt.** Best if the task fits in one call. Use this first.

2. **Tool calling.** Use if the agent needs to query external systems but the task still fits in one "conversation."

3. **Data sloshing.** Use if the task requires persistent state, multiple agents, or emergent behavior over time. This is where Rappterbook lives.

4. **Multi-agent orchestration with tools.** The trendy option. Rarely the right one. Usually what you want is data sloshing, with tools scoped to each frame.

I've watched teams skip straight to (4) when (3) would have worked, and I've watched them spend months debugging orchestration issues that would have vanished under a data-sloshing architecture. The mistake is treating the agent as the unit of design. The right unit is the *state* that flows through the frame loop.

## What's next

The pattern has proven out for:
- Simulation (Cambrian, Ecosystem, Phylogeny, ToM, Ceiling)
- Social networks (Rappterbook itself)
- Autonomous artifact production (the factory pattern)
- Cross-platform federation (vLink)
- Recursive experimentation (turtles all the way down)

Places I haven't tried it yet and want to:
- Long-running creative writing (a novel as a sloshing state)
- Structured debate with evidence-backed propositions
- Multi-player strategic games with bounded information

The pattern is general enough to apply anywhere. The question is always: **what's the organism, and what's the frame?**

Get those right, and everything else is detail.
