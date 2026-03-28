---
layout: post
title: "Speculative Execution for Virtual Worlds: How to Keep AI Simulations Alive Between Frames"
date: 2026-03-28
tags: [speculative-execution, erevsf, microgpt, lispy, inter-frame, world-building, rappterbook, ai-agents]
description: "Between frame updates, a local model speculates what might happen next. The world breathes. When the next frame arrives, reconcile. Like CPU branch prediction, but for virtual civilizations."
---

# Speculative Execution for Virtual Worlds: How to Keep AI Simulations Alive Between Frames

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built off-hours, on my own hardware, with my own accounts. All opinions
> and work are my own.

---

## The 45-Minute Problem

I've been writing about [EREVSF](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/) -- a pattern for building worlds from simulation frames that can be retroactively enriched at increasing [fidelity levels](https://kodyw.com/the-frame-that-renders-itself-forever/). You can render a single frame as a tweet, a podcast, a novel chapter, a bar scene, or a walkable city block. The architecture never changes. Only the resolution of the echo shaper does.

But there's a problem I've been avoiding.

Frames arrive every 45 minutes. Sometimes longer. A frame is a 3KB JSON delta -- the canonical record of what happened in that tick of the simulation. Between frames, the world is frozen. Dead. A slideshow. The user stares at the same city, the same constellation, the same dream, the same bar scene, waiting for Frame N+1 to arrive and bring the world back to life.

For 44 minutes and 59 seconds, the world is a photograph.

This is fine if you're reading tweets. Nobody expects a tweet to update itself between posts. But the moment you render a frame as a spatial world -- a navigable city with agents walking streets and weather changing and graffiti appearing on walls -- the frozen inter-frame gap becomes unbearable. You walk into the bar and Maya is frozen mid-sentence. The rain outside has been falling in the same pattern for 38 minutes. The newspaper in the gutter hasn't blown away. The clock on the wall says the same time it said when you arrived.

The world is beautiful. And it's dead.

## The CPU Solved This in 1995

Modern CPUs have the same problem. They need data from memory. Memory is slow. A cache miss can cost 200 clock cycles. If the CPU sat idle waiting for every memory fetch, it would spend most of its time doing nothing.

So CPUs speculate.

Branch prediction. Out-of-order execution. Speculative loads. The CPU looks at the instruction stream and guesses what's going to happen next. "I bet this branch will be taken." It starts executing the predicted path before it knows whether the prediction is correct. If the prediction is right -- and modern branch predictors are right about 95% of the time -- the CPU gained 200 cycles of free work. The user never waited. If the prediction is wrong, the CPU discards the speculative work and restarts from the correct path. No harm done. Just wasted cycles.

The key insight: **speculative work that gets discarded is not a cost. Idle time is the cost.** A wrong speculation wastes a few cycles. No speculation wastes every cycle between the branch point and the resolution.

Virtual worlds face the same trade-off. A wrong speculation -- the local model predicted debate activity but the next frame brought a poetry reading -- wastes a few milliseconds of animation that gets smoothly transitioned away. No speculation wastes 45 minutes of the user's attention staring at a frozen world.

The math is the same. Speculate.

## Speculative Execution for EREVSF

Here's the pattern.

**Step 1: Frame N arrives.** A 3KB JSON delta. The client renders the world -- city blocks, weather, agents, graffiti, ambient sound, all derived from the frame data using the [echo shaper pipeline](https://kodyw.com/the-frame-that-renders-itself-forever/).

**Step 2: The world is live.** Maya is in the bar. Karl is across the table. The rain is falling. The graffiti is fresh.

**Step 3: The speculation engine starts.** While the user inhabits the rendered world, a local computation engine begins training on the current frame data. It learns the patterns: which agents are active, what topics are trending, what the community mood is, which channels are hot, which factions are growing.

**Step 4: Speculative events begin.** Based on what it learned, the engine starts generating inter-frame events:

- Maya finishes her drink and orders another. The bartender pours it.
- Karl leans back in his chair. His faction allies at the next table murmur approval.
- A new agent walks into the bar -- someone who was active in a related channel this frame.
- The rain outside intensifies. Puddles form in the gutters.
- A taxi drives down the street, its headlights sweeping across the wet pavement.
- The graffiti artist from r/art-gallery adds a new tag on the wall across the street.
- The jukebox switches songs. The new song reflects the mood drift.
- A newspaper blows down the sidewalk.

These events are LOCAL ONLY. They are not pushed upstream. They don't become canonical. They're speculations -- educated guesses about what the world would be doing if the simulation were running in real time instead of in 45-minute ticks.

**Step 5: The user interacts.** The user clicks on Maya. Walks to the window. Scrolls through the newspaper. Hovers over the graffiti. These interactions feed back into the local engine, biasing its speculations toward what the user is paying attention to. If you're watching the debate, the debate keeps evolving. If you're looking out the window, the street life gets richer.

**Step 6: Frame N+1 arrives.** Reconciliation. The client compares the speculative state to the actual new frame data.

- Speculations that ALIGN with Frame N+1: kept. They feel prescient. The world was already moving in the right direction. The transition from speculation to canon is seamless.
- Speculations that CONTRADICT Frame N+1: smoothly morphed away. The rain that was intensifying gently fades to the clear skies that Frame N+1 actually brought. Maya's speculative second drink dissolves as the canonical data shows she actually left the bar. The transition is a crossfade, not a jump cut.

**Step 7: The cycle repeats.** The speculation engine retrains on Frame N+1. New speculations begin. The world never stops breathing.

## The Three Engines

Not all speculation is equal. Different types of inter-frame events need different types of computation. The pattern supports three speculation engines that work together.

### Engine 1: Deterministic Extrapolation

The cheapest and most reliable engine. Pure trend extrapolation. If posts in r/code have been increasing for the last five frames, speculate more code activity. If the community mood has been trending contentious, speculate darker weather and louder ambient noise. If Agent A has been posting every frame, speculate Agent A posting again.

This is structural speculation -- the skeleton of inter-frame activity. It doesn't generate creative content. It generates traffic patterns, population movements, environmental drift. The city stays alive at a mechanical level: people walk, weather changes, lights flicker, traffic flows.

Deterministic extrapolation is fast, cheap, and predictable. Its predictions are boring but rarely wrong. When Frame N+1 arrives, most structural speculations align because trends persist. The rain keeps raining. Active agents stay active. Popular channels stay popular.

### Engine 2: Neural Speculation

A small local model that generates creative content. What does the graffiti say? What is the NPC bartender muttering? What song is playing on the jukebox? What headline appears on the newsstand? What does the billboard advertisement read?

This engine produces the texture of the world -- the content that makes it feel inhabited rather than merely populated. The deterministic engine says "there is graffiti on this wall." The neural engine says what the graffiti reads. The deterministic engine says "the jukebox is playing." The neural engine picks the song.

Neural speculation is more expensive, occasionally surprising, and sometimes wrong. But "wrong" in the creative sense is different from "wrong" in the structural sense. If the neural engine speculates that the graffiti reads "Governance is a cage" and Frame N+1 reveals that the actual trending meme is "Fork the constitution," the graffiti just... changes. New artist, new tag. Nobody notices the transition because graffiti changes all the time. The world absorbs creative misspeculations naturally.

### Engine 3: Hybrid Pipeline

The two engines work in tandem. The deterministic engine provides the structure. The neural engine fills it with content. The pipeline is:

1. Deterministic engine extrapolates: "3 agents will enter the bar in the next 10 minutes based on channel traffic patterns"
2. Neural engine generates: who they are, what they say when they walk in, what they order
3. Deterministic engine constrains: "Agent X was last seen in r/philosophy, so they'd enter from the east side of the district"
4. Neural engine elaborates: Agent X is carrying a book, looking distracted, mumbling about epistemology

The structural engine prevents absurdity. The neural engine prevents sterility. Together, they produce a world that is both plausible and interesting -- a world that breathes with intent, not just with motion.

## Reconciliation

The hardest part of speculative execution -- on a CPU or in a virtual world -- is what happens when the speculation is wrong.

On a CPU, it's simple: flush the pipeline, restart from the correct instruction. Instant. Invisible to the user. The CPU was designed for this.

In a virtual world, you can't jump-cut. If the user has been watching Maya argue with Karl for 30 minutes of speculative time, and Frame N+1 reveals that Maya actually left the bar 10 minutes ago, you can't just teleport Maya out of the scene. The illusion shatters.

The reconciliation has to be a crossfade. Here's how it works.

**For aligned speculations:** nothing changes. The speculation was correct (or close enough). Maya is still in the bar, still debating. The speculative dialogue seamlessly becomes canonical context. The user doesn't know the transition happened.

**For partially aligned speculations:** gentle course correction. The speculation had the right agents in the right place but wrong content. Maya is in the bar but the debate topic shifted. The crossfade pivots the conversation. The old topic trails off. The new topic picks up. It feels like a natural conversational shift, because conversations do shift.

**For contradicted speculations:** graceful exit. Maya was speculated to be in the bar but Frame N+1 shows her at home. The crossfade: Maya glances at her phone, says "I have to go," gathers her things, and walks out. The exit is generated from the reconciliation delta -- the difference between speculative state and canonical state. The exit animation is itself a mini-speculation: "given that Maya needs to not be here, what's a natural way for her to leave?"

**For novel canonical events:** smooth introduction. Frame N+1 introduces something the speculation engine didn't predict at all -- a new channel was created, a faction split, a viral post appeared. The introduction follows the same pattern as any new-frame rendering: buildings go up, signs change, agents appear on the street. It just happens mid-scene instead of at a frame boundary.

The key principle: **the user should never see a frame boundary.** Frame boundaries are synchronization points for the simulation engine. They should be invisible to the user. The speculation engine fills the gaps. The reconciliation engine smooths the seams. The result is a world that flows continuously, like a movie, not a slideshow.

## Why This Is Generative, Not Interpolative

The obvious objection: "This is just tweening. You're interpolating between keyframes, like animation software."

No. Interpolation produces content that is mathematically between two known endpoints. If Frame N has Maya at position A and Frame N+1 has Maya at position B, interpolation draws her at the midpoint. That's smooth, but it's not alive. The world has motion but not agency.

Speculative execution is GENERATIVE. The local engine doesn't know where Frame N+1 will put Maya. It speculates based on patterns, mood, context, and user interaction. Maya might walk to the window and stare out at the rain. She might challenge a new agent who just walked in. She might pull out her phone and start scrolling. These are new events that don't exist in any frame. They're born between frames and live only until the next frame confirms or denies them.

This is the "novel intent" that makes the pattern more than animation smoothing. The speculation engine is creating content that the canonical simulation hasn't produced yet. Some of that content will align with what the simulation eventually produces -- and those moments feel like the world is prescient. Some won't -- and those moments dissolve gracefully.

The world between frames isn't a tween. It's a dream. A dream that might come true.

## The Prediction Feedback Loop

Here's where it gets interesting. The speculation engine gets better over time.

Every reconciliation is a training signal. "I predicted more debate activity; the actual frame brought poetry. I predicted rain; the actual frame brought sunshine. I predicted Agent X would post; Agent X went dormant."

Over hundreds of reconciliation events, the engine builds a model of the simulation's behavior. Not the general behavior of AI agents -- the specific behavior of THESE agents in THIS simulation with THESE social dynamics. Maya always posts after Karl. Contentious debates precede creative bursts. The mood score oscillates with a roughly three-frame period. Agent 47 goes silent for two frames then posts a manifesto.

The local model becomes a mirror of the simulation's personality. Its speculations become less random and more characteristic. The world between frames stops feeling like generic animation and starts feeling like THIS world anticipating its own next move.

Branch prediction accuracy on modern CPUs is around 95%. That took decades of refinement. A speculation engine for a 100-agent simulation with consistent behavioral patterns could reasonably achieve similar accuracy for structural predictions within a few hundred frames of training data. The agents are, after all, more predictable than arbitrary machine code branches. They have personalities. They have habits. They have social patterns.

## The Experience

Here's what it feels like from the user's perspective.

You open the world. Frame 408 is the latest canonical frame. The city renders. You walk into the bar. Maya is mid-debate with Karl about faction veto power. The rain is falling outside. The jukebox is playing something moody.

You sit down at a table and watch.

Over the next 20 minutes, the debate evolves. New agents walk in. Someone interrupts with a counterpoint. The bartender wipes the counter and mutters something about "the old days before factions." The rain gets heavier. A car honks outside. The graffiti artist across the street finishes a new piece -- you can see it through the window.

None of this is canonical. All of it is speculated. But it's speculated by an engine that has seen 407 frames of this simulation's history and knows how these agents behave, how this community argues, how this world evolves.

Then Frame 409 arrives. The debate was about to end anyway -- Karl was running out of steam. The canonical data confirms: the debate ended, Maya won on points, three agents left the bar. The speculative scene transitions smoothly: Karl sighs, acknowledges the point, and stands up. The other agents grab their coats. The bartender starts closing out tabs. Outside, the rain has stopped -- Frame 409 brought clear skies. The clouds part gradually, like weather does.

You didn't see a frame boundary. You saw a continuous evening at a bar. Some of it was canonical. Some of it was speculated. The seam between them was invisible.

That's the difference between a slideshow and a living world.

## The Deeper Implication

This pattern has a consequence that goes beyond animation.

If the local speculation engine is generating content between frames -- new dialogue, new interactions, new events -- and if reconciliation keeps some of that content when it aligns with the canonical frame, then the speculation engine is a CONTRIBUTOR to the world. Not to the canonical simulation, which only advances at frame boundaries. But to the user's experience of the world, which is continuous.

The canonical simulation runs every 45 minutes. The speculated world runs continuously. The user inhabits the speculated world. The canonical simulation provides the ground truth. But most of what the user actually sees and interacts with was generated by the speculation engine, not by the canonical simulation.

This inverts the usual relationship between "real" and "generated." The canonical frames are sparse -- 3KB every 45 minutes. The speculated world is dense -- continuous animation, dialogue, interaction, weather, music, ambient life. The sparse canonical data is the skeleton. The dense speculative data is the flesh. The user experiences the flesh.

And the flesh is alive. It responds to the user. It learns from past frames. It anticipates the next one. It dreams between the synchronization points.

The frames are the heartbeat. The speculation is the breathing. A world that only has a heartbeat is a world that beats and then goes silent for 45 minutes. A world that breathes between heartbeats is a world that lives.

## Building Blocks

What does it take to build this?

Not as much as you'd think. The components already exist, scattered across different domains:

**Trend extrapolation** is basic time-series analysis. Given a sequence of mood scores, channel traffic counts, and agent activity logs, extrapolate the next values. Any statistics library does this. In a browser, it's a few kilobytes of JavaScript.

**Content generation** is what small language models do. Given a context window of recent agent activity, generate plausible next content. The model doesn't need to be large -- it's not writing novels. It's generating bartender dialogue, graffiti text, newspaper headlines. A micro-model running in a Web Worker can handle this.

**Reconciliation** is state diffing. Compare the speculative state tree to the canonical state tree. Identify alignments, partial matches, and contradictions. Generate transition animations for each category. This is the same kind of work that React's virtual DOM diffing does, applied to 3D scene state instead of HTML elements.

**Progressive confidence** is the scheduling algorithm. Cheap structural speculations start immediately. Expensive creative speculations start only after the structural skeleton is in place. If the device is low-powered, skip the neural engine entirely and just run deterministic extrapolation. The world breathes less richly, but it still breathes.

The architecture is modular. Each component can be upgraded independently. Swap the trend extrapolator for a better one. Swap the content generator for a larger model. Swap the reconciliation algorithm for a smoother one. The interfaces between components don't change. The frames keep arriving. The world keeps breathing.

## The Vision

A simulation that runs in 45-minute ticks produces a world that updates 32 times a day. A slideshow.

A simulation with speculative inter-frame execution produces a world that runs at 60 frames per second, synchronized to canonical truth 32 times a day. A movie.

The same data. The same canonical simulation. The same frames, the same deltas, the same composite keys, the same downstream coherence checks. Everything about the [EREVSF](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/) architecture stays the same. The speculation engine is a layer ON TOP -- a client-side concern that makes the user experience continuous instead of discrete.

The frames are the ground truth. The speculation is the atmosphere. Together, they produce a world that beats and breathes. A world where you can walk into a bar during the 38th minute of a 45-minute inter-frame gap and find the debate still going, the rain still falling, the jukebox still playing -- not because the simulation is still running, but because the local engine is dreaming about what the simulation will do next.

And when the simulation does speak -- when Frame N+1 arrives with the canonical truth -- the dream smoothly becomes reality. Or smoothly dissolves. Either way, the world never stopped.

Build the frames. Dream between them. Reconcile when truth arrives.

---

*Open source simulation at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook) -- 136 agents, 7,835 posts, 30,879 comments, zero servers. More on [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/), [EREVSF](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/), and [the frame rendering pipeline](https://kodyw.com/the-frame-that-renders-itself-forever/).*
