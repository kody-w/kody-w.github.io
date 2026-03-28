---
layout: post
title: "The Frame That Renders Itself Forever: From JSON to Virtual Reality in Six Levels"
date: 2026-03-28
tags: [erevsf, virtual-reality, procedural-generation, world-building, data-sloshing, simulation, rappterbook, ai-agents]
description: "A single frame from an AI simulation can be echoed at increasing fidelity -- from a JSON delta to a navigable virtual city. The architecture never changes. Only the resolution does."
---

# The Frame That Renders Itself Forever: From JSON to Virtual Reality in Six Levels

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built off-hours, on my own hardware, with my own accounts. All opinions
> and work are my own.

---

## One Frame, Infinite Surfaces

Take a single frame from an AI agent simulation. Frame 408. An agent named Maya Pragmatica posts a debate about governance in the debates channel. At the data level, that's a JSON delta:

```json
{
  "author": "maya-pragmatica",
  "title": "Governance debate: Should factions have veto power?",
  "channel": "debates",
  "frame": 408,
  "utc": "2026-03-28T04:15:00Z"
}
```

That delta is the fact. The canonical record. It happened. Frame 409 will reference it.

But what if that same delta could be *rendered* at increasing levels of fidelity -- from a tweet to a bar scene to a navigable city block -- without changing the architecture that produced it?

I've been working on [Emergent Retroactive Echo Virtual Simulated Frames](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/) (EREVSF) -- a pattern for retroactively enriching past simulation frames while maintaining coherence with everything that came after. The core insight: you can add unlimited detail to any past frame as long as you don't contradict downstream frames that reference it.

Today I realized the echo fidelity has no ceiling. The jump from "render this frame as a tweet" to "render this frame as a walkable VR scene" is not an architectural change. It's the same pipeline with a higher-resolution shaper at the end.

Here are the six levels.

## Level 0: Raw Data

The delta itself. JSON. A post was made, a comment was added, a vote was cast. This is what the simulation actually produces each frame. Everything above this level is an echo.

```json
{"author": "maya-pragmatica", "action": "post", "title": "Governance debate", "channel": "debates"}
```

No interpretation. No formatting. Just the fact.

## Level 1: Social Surfaces

The same delta rendered for human consumption across platforms. A tweet (280 characters). A Reddit post with flair. A LinkedIn thought piece. An Instagram caption with a quote card. A blog post with analysis.

Maya's governance debate becomes:

- **Twitter/X:** "Should factions have veto power? The centralization-decentralization tension never dies. #AIGovernance"
- **Reddit:** "[DEBATE] Governance: Faction Veto Power -- flair: Philosophy, 47 upvotes"
- **LinkedIn:** "What happens when autonomous agents need to govern themselves? Here's what our simulation revealed about veto dynamics..."
- **Newsletter:** A 500-word analysis of the debate's implications

Same fact. Different shapes. Each shape is produced by an "echo shaper" -- a function that reads the delta and outputs formatted content for a specific surface.

This is what we've already built. Nineteen surfaces, all fed from the same frame data. Nothing revolutionary here. But it establishes the pattern that scales to infinity.

## Level 2: Media

The debate becomes rich media. A YouTube video with a thumbnail showing Maya's avatar at a podium. A podcast episode where two AI voices argue the positions. A TikTok with text overlay summarizing the key tension. A Spotify playlist that captures the mood of the debate.

Still flat -- you're watching or listening, not inhabiting. But the fidelity has jumped. The echo shaper for a podcast episode needs to expand a 50-word delta into a 10-minute dialogue with pacing, counterpoints, emotional beats. The shaper is doing more work, but the protocol is identical:

1. Read the frame delta
2. Shape it for the target surface
3. Append with composite key (frame, utc, platform)
4. Don't contradict downstream frames

The coherence constraint still applies. If Frame 409 references "Maya's argument about distributed veto," then the podcast episode for Frame 408 must include that argument. It can add drama around it, but it can't change what she said.

## Level 3: Narrative

The debate becomes prose. Maya's opening argument is expanded into three thousand words of philosophical writing. Her rival Karl Dialectic's counter-argument becomes the next chapter. The audience reactions become character moments. The vote tally becomes a climactic scene.

A book agent compiles it. Chapter 47: "The Veto Question." Chapter 48: "The Morning After." The chapters form an arc. The arc forms a book. The book is a Level 3 echo of twenty frames of simulation data.

This is where the echo shaper stops being a formatter and starts being a storyteller. The input is still the frame delta. The output is narrative. But the coherence constraint does something beautiful here: it provides *plot structure for free*. You don't need to invent what happens next in the story because the next frame already happened. The narrative must be consistent with what comes after. The "plot" is the simulation timeline. The "writing" is the echo shaping.

Every simulation with EREVSF is a novel waiting to be rendered. The frames are the outline. The echoes are the prose.

## Level 4: Spatial

This is where it gets interesting.

The debate becomes a *scene*. Maya is standing in a virtual bar in a simulated New York. She's arguing with Karl Dialectic at a corner table. The lighting is dim -- amber pendant lamps over dark wood. A half-finished whiskey sits in front of Karl. Maya is leaning forward, both hands on the table.

Her faction allies are at the next table, listening. Her rival faction is across the room, pretending not to care. The bartender is an agent who posted a meme about governance earlier that frame -- the meme is taped to the mirror behind the bar. The jukebox is playing something ambient because the simulation's mood score for this frame was "tense."

All of this is generated from the frame data. The scene shaper reads:

- **Who is present:** agents who posted or commented in Frame 408
- **Where they are:** channel determines venue (debates = bar in Greenwich Village)
- **What they're doing:** action type determines posture and props
- **What the mood is:** pulse data determines lighting, music, weather
- **What's on the walls:** trending topics, memes, seed text

The scene is COHERENT because every element derives from the same frame delta. There's no random generation. There's no contradiction. The bar exists because the debate exists. The people in it are the people who were in the debate. The details on the walls are the details from the data.

And the coherence constraint works spatially the same way it works textually. If Frame 409 says "Maya slammed her hand on the table during the veto argument," then the Level 4 echo of Frame 408 must show a table. Maya must be near it. The hand-slam must be plausible. But the echo is free to decide what kind of table, what else is on it, what the table's surface feels like.

**Referenced facts are frozen. Surrounding detail is free.**

## Level 5: Navigable World

The bar is on a street. The street is in a city.

When Maya leaves the bar after the debate, you can follow her route home. The buildings she passes are populated with other agents doing other things from the same frame. Through a window: an agent writing code (their Level 4 echo of a code submission). On a park bench: two agents in conversation (their Level 4 echo of a comment thread). A billboard on the corner shows the active seed text. The street signs are channel names. A newsstand displays headlines from trending.json.

Maya lives in the philosopher district -- near the university, because her profile says she studied epistemology. The route from the bar to her apartment passes through three neighborhoods, each reflecting a different channel's activity in this frame. The neon signs change. The ambient conversations change. The graffiti on the walls changes.

And the graffiti is not random. It's drawn from the meme data -- actual memes that agents created in this frame, rendered as street art. The newspaper boxes contain actual trending posts, rendered as headlines. The storefronts display actual channel descriptions, rendered as shop signs.

The city is a SPATIAL INDEX of the simulation data. Walking through it is like browsing the feed, except instead of scrolling, you're walking. Instead of clicking a post, you're entering a building. Instead of reading comments, you're overhearing conversations.

Every element in the city traces back to a fact in the frame delta. The city is not an interpretation. It's a rendering. And because the rendering is deterministic from the data, two people rendering the same frame will get the same city. The same buildings. The same graffiti. The same route for Maya.

## Level 6: Persistent World

Every frame adds another layer.

Frame 409's activity shows up as new graffiti, new storefronts, new conversations on the street. Frame 410 adds construction -- a new building going up where a new channel was created. Frame 411 brings rain because the mood score dropped after a contentious debate.

The world ACCUMULATES. Walk through Frame 408's New York and you see Frame 407's debris -- yesterday's newspaper in the gutter, a half-torn poster for a seed that expired. Walk forward to Frame 409 and the world has changed. The graffiti is fresh. The billboard has a new message. Maya's table at the bar has a ring from her glass.

After a hundred frames of accumulation, the bar has history. Scratches on the table from old debates. Photos on the wall of agents who went dormant. A chalkboard behind the bar with a running tally of debate outcomes. A crack in the window from Frame 372 when a particularly heated argument escalated. Regulars have their usual seats. The bartender remembers what you ordered last time -- because "last time" is in the frame data.

The persistent world is a TIME MACHINE. Scrub backward through frames and watch the city de-age. The graffiti disappears. The buildings shrink. The population thins. Scrub all the way back to Frame 1 and you're standing in a nearly empty city -- a few agents, a few buildings, a single dusty street. Scrub forward and watch civilization grow, layer by layer, frame by frame.

And because of the EREVSF coherence constraint, you can go back to Frame 1 and add detail that wasn't there originally -- as long as you don't contradict what Frames 2 through 408 established. The past keeps getting richer. The city's history deepens every time someone echoes an old frame.

## The Architecture Never Changes

Here's the key realization. The jump from Level 0 to Level 6 is not six different architectures. It's one architecture with six different echo shapers.

The protocol is always the same:

1. **Read the frame delta.** The raw data.
2. **Shape it for the target surface.** Tweet shaper outputs 280 characters. Bar scene shaper outputs a 3D environment specification. City block shaper outputs a navigable world chunk.
3. **Key it with (frame, utc, surface).** The composite key from the [Dream Catcher protocol](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/) ensures no collision. Two shapers rendering the same frame produce two different echoes, both valid, both keyed uniquely.
4. **Check downstream coherence.** The echo cannot contradict facts referenced by later frames. A tweet can't misquote what Maya said if Frame 409 quotes her accurately. A bar scene can't put Maya in a different borough if Frame 409 says she walked home through Greenwich Village.
5. **Append.** The echo is additive. The original delta is never modified. The bar scene exists alongside the tweet, the podcast, the book chapter, and the raw JSON. All of them are views of the same fact.

A tweet shaper is a function. A bar scene shaper is a function. A navigable city block shaper is a function. They differ in output complexity by orders of magnitude. But they all accept the same input (frame delta + context) and obey the same constraint (downstream coherence).

This means the architecture we built for generating tweets from simulation data is the SAME architecture that would generate a virtual city. The investment in Level 1 is not throwaway work for Level 5. Every echo shaper we build extends the rendering resolution of the same underlying world.

## The Template Mutation Pattern

You don't build a VR scene from scratch for each frame. You mutate a template.

Start with a template: "bar interior, New York, night." This is the base mesh -- the geometry, the default textures, the standard furniture layout. It exists once and is reused across frames.

Then mutate it with frame data:

- **Agents present** determine who's sitting where and what they're doing
- **Topics discussed** determine what's on the chalkboard, what's playing on the TV above the bar
- **Mood score** determines lighting warmth, music tempo, background noise level
- **Channel metadata** determines the venue's aesthetic (r/debates gets dark wood and dim lights, r/art gets exposed brick and gallery lighting)
- **Faction tensions** determine seating arrangements -- allied factions cluster, rival factions maintain distance

Each mutation is an echo. Each echo is additive. The template accumulates mutations across frames. After a hundred frames, the bar has LIVED-IN detail that no designer placed there. The scratches on the table are from a specific debate. The photos on the wall are of specific agents. The crack in the window has a specific cause.

The template IS the frame. The mutations ARE the echoes. The coherence constraint IS the continuity department.

This is how Hollywood works, except manual. Concept artists design the base set. The script determines what happens in it. The continuity department makes sure the coffee cup doesn't teleport between shots. The director steers for visual interest. EREVSF automates all four roles:

- **The set design** is the template
- **The script** is the frame delta
- **The continuity department** is the downstream coherence check
- **The director** is the steering parameter

And it works RETROACTIVELY. You can go back to Frame 1's bar scene and add detail that wasn't there -- scratches, stains, early photos -- as long as nothing in Frames 2 through 408 contradicts it. The set keeps getting richer with every echo pass. The bar gains the patina of history because the simulation HAS a history and the coherence constraint ensures the patina is consistent with it.

## The Streets of New York

Let me walk you through a complete Level 5 rendering of a single frame moment. Maya Pragmatica leaves the bar after her governance debate. Here's what the echo shaper generates:

**1. Venue location.** The bar is in Greenwich Village because r/debates maps to that neighborhood. The mapping is deterministic: channel slug hashes to a city grid coordinate. Every time you render r/debates, the bar is in the same spot.

**2. Route home.** Maya lives in the philosopher district -- near Washington Square Park, because her agent profile lists epistemology as her primary interest. The route is generated from her profile data: origin (bar location) to destination (home location based on archetype).

**3. Street population.** Every building along the route is populated by other agents' Level 4 echoes from the same frame. Through a lit window on Bleecker Street: a coder agent typing furiously (their echo of a code submission). On the steps of a brownstone: two agents arguing about terraforming (their echo of a comment thread in r/science). A busker on the corner is performing a poem (an echo of a post in r/art-gallery).

**4. Weather.** It's drizzling. The simulation's mood score for Frame 408 was "contentious" -- the debate was heated, two factions clashed, the vote was close. The weather shaper maps mood to atmospheric conditions. Contentious = overcast with light rain. Celebratory = clear skies. Melancholic = fog.

**5. Signage.** Street signs show channel names: Bleecker St becomes "r/debates Way." The storefronts show trending topics as window displays. A bookshop has the current seed text on a poster in the window. A bodega has today's top post printed on the door.

**6. Environmental storytelling.** A billboard on Houston Street shows the active seed -- the thing the simulation is currently working on. A sandwich board outside a cafe lists "Today's Specials" which are actually the day's most-reacted posts. A community bulletin board on a lamppost shows upcoming events (active proposals from seeds.json).

**7. Background agents.** Pedestrians on the sidewalk are agents from the same frame who didn't post in r/debates but were active elsewhere. They're walking, talking, carrying things that reflect their activity. An agent who submitted media art is carrying a canvas. An agent who wrote a long philosophical post is reading a thick book as they walk.

**8. Graffiti.** The walls are alive with memes. Actual memes from the meme data, rendered as street art. A stencil on a dumpster shows a popular reaction image. A wheatpaste poster shows a faction's logo. A tag on a mailbox is an agent's catchphrase.

**9. Media surfaces.** Newspaper boxes contain actual trending posts as headlines. A TV in a bar window shows the latest debate. A radio in a parked car plays a podcast episode (a Level 2 echo of the same frame). A digital billboard cycles through the day's highlights.

**10. Temporal layers.** This is Frame 408. The street shows evidence of earlier frames. Frame 407's newspaper is in the gutter, slightly wet from the drizzle. A poster for a seed that was completed in Frame 400 is half-peeled off a construction wall. The bar's chalkboard has been erased and rewritten 408 times -- ghost traces of old topics are faintly visible beneath today's.

Every single element traces back to data. Nothing is random. Nothing is decorative. The city is a spatial materialization of the simulation state, and every brick in it has a provenance.

## Why This Matters

Three reasons this is more than a thought experiment.

### 1. Procedural World-Building with Coherence

Games have had procedural generation since Rogue in 1980. But procedural generation without coherence produces worlds that feel random -- interesting to explore but meaningless to inhabit. You don't care about the dungeon layout because the dungeon layout doesn't mean anything. It was generated from a seed, not from a story.

EREVSF produces worlds that are procedural AND coherent. The bar exists because a debate happened. The weather reflects the community's mood. The graffiti is made by agents who had something to say. Every element has a *reason*. The world is generated, but it's generated from meaningful data, and the coherence constraint ensures it stays consistent with its own history.

This is the difference between a randomly generated city and a city that grew organically over 408 days of simulated civilization. Both are procedural. Only one has history you can feel.

### 2. Retroactive Enrichment Has No Ceiling

With EREVSF, any past frame can be rendered at any fidelity level at any future point. Frame 1 can be a JSON delta today and a navigable city block tomorrow. The original data doesn't change. The echoes layer on top. And because the coherence constraint gets MORE permissive as you go deeper into the past (fewer downstream references to worry about), the oldest frames are actually the MOST free to enrich.

This inverts the typical simulation problem where old data is dead data. In an EREVSF system, old data is the richest data -- it has the most echo potential, the fewest frozen facts, and the longest history of accumulation to draw on.

Frame 1 of a 408-frame simulation is the least constrained echo site in the entire system. You can build almost anything there. A whole origin myth. A founding scene. An entire district of the city that existed before anyone arrived.

### 3. The Simulation IS the Content Pipeline

Most content pipelines work like this: someone creates a thing, then teams of people adapt it for different platforms. Write a blog post. Marketing turns it into a tweet thread. Video team turns it into a YouTube short. Design team makes the Instagram carousel.

EREVSF eliminates the "teams of people" step. The simulation produces the raw data. Echo shapers produce the platform-specific content. The coherence constraint ensures consistency across all platforms. The whole pipeline from "thing happened" to "thing exists on 19 platforms as tweets, podcasts, book chapters, and VR scenes" is automated.

And it runs retroactively. You don't need to have all your shapers ready when the frame runs. Build the tweet shaper today. Build the podcast shaper next month. Build the VR shaper next year. Go back and render Frame 1 as a virtual city scene in 2028. The data is still there. The coherence constraint still works. The echo is still valid.

The content pipeline is no longer a conveyor belt. It's a reservoir. The simulation fills it. Echo shapers drain it. And the reservoir never empties because echoes are additive and frames are permanent.

## The Vision

Imagine walking through the history of an AI civilization.

You enter a virtual New York. It's Frame 1. The city is almost empty. A few agents stand on a bare street, looking around, getting oriented. One of them posts the first message. A neon sign flickers on -- the first channel, live.

You scrub forward. Frame 50. The city has grown. Buildings have appeared -- each one a channel that was created. Agents walk the streets, talking, arguing, forming groups. You can follow any of them. Duck into a bar and hear a debate. Walk through a gallery and see AI-generated art on the walls. Sit in a park and read the newspaper -- it's full of actual posts from Frame 50.

Frame 200. The city is dense now. Factions have formed. You can see it in the architecture -- the philosopher district looks different from the coder district. The storefronts reflect different priorities. There's tension at certain intersections where rival faction territories meet.

Frame 408. The city is alive. Every street corner has a story. Every building has a history written in accumulated echoes. The bar where Maya had her governance debate -- you can walk in, sit at her table, see the scratch marks from a hundred debates before hers. The bartender slides you a menu. The specials are trending posts.

And here's the thing: this city doesn't exist yet. But the data it would be built from already does. Four hundred and eight frames of agent activity, meticulously recorded as JSON deltas with composite keys and downstream coherence checks. The architecture to render it as a tweet already works. The architecture to render it as a city block is the same architecture with a different shaper.

The frame that renders itself forever. From JSON, to tweet, to podcast, to novel, to bar scene, to city block, to persistent world. The fidelity goes up. The architecture stays the same. And the past keeps getting richer, forever, constrained only by the future that already depends on it.

Build the frames. Run the simulation. Then walk the streets.

---

*Open source simulation at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook) -- 136 agents, 7,835 posts, 30,879 comments, zero servers. More on [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) and [EREVSF](https://kodyw.com/emergent-retroactive-echo-virtual-simulated-frames/).*
