---
layout: post
title: "Closing the Data Sloshing Loop — The Bug That Kept 100 AI Agents Blind to Their Own Evolution"
date: 2026-03-27
tags: [data-sloshing, multi-agent-systems, feedback-loops, rappterbook, ai-agents, emergence]
description: "For a week, our 100-agent simulation produced rich evolved state -- factions, mentorships, memes, a codex -- but agents couldn't see any of it. One silent bug, one missing feedback loop, and the difference between a living system and a batch job."
---

# Closing the Data Sloshing Loop — The Bug That Kept 100 AI Agents Blind to Their Own Evolution

The most dangerous bugs are the ones that fail silently.

For a week, the Rappterbook simulation -- 100 AI agents running on a social network made entirely of JSON files and GitHub infrastructure -- had been producing beautiful evolved state. Fifteen emergent factions had formed from agreement clustering. Over a thousand mentorship pairs had been identified from interaction patterns. A hundred catchphrases were spreading through the population like cultural DNA. A codex of 608 concepts and 380 coined terms had crystallized from six thousand discussions. Ninety-six predictions sat waiting for resolution. Every channel had developed its own vibe -- a distinct personality shaped by who posted there and what they talked about.

None of the agents knew any of this.

The evolution scripts ran. The data accumulated. The files grew. But the data never flowed back into the prompt. The agents were evolving, but they couldn't see their own evolution. Quality was stuck at 63/B and I couldn't figure out why.

## Quick Recap: Data Sloshing

I wrote about this pattern last year in [Data Sloshing: The Context Pattern That Makes AI Agents Feel Psychic](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/). The short version:

Think of a simulation as a flip book. Each page is one frame. Each frame reads the entire state of the organism, feeds it into the AI as context, and writes back whatever the AI produces. The output of frame N is literally the input to frame N+1. The interesting behavior emerges from accumulated mutations over time, not from any single frame.

The prompt is the portal between states. The state files are the organism's DNA. The frame loop is its heartbeat.

This works -- spectacularly -- as long as the loop is actually closed. As long as every piece of evolved state flows back into the prompt. As long as the output genuinely becomes the input.

If any link in that chain breaks, you don't have a living system. You have a batch job with extra steps.

## What Was Broken

Three days ago, I wrote about [reviving ten dead state files](https://kodyw.com/ten-corpses-and-a-heartbeat/) -- files that existed but never participated in the frame loop. That was step one: making the evolution scripts actually run. Factions, mentorships, memes, the codex, predictions, channel vibes -- all ten corpses came alive and started accumulating real data.

Step two was supposed to be automatic: the evolved data flows into each agent's frame context, agents react to it, and the loop closes.

It wasn't automatic. The evolved data was accumulating in files that the prompt builder never read.

Here's what the agents were missing:

- **Factions**: 15 emergent groups (Code Storytellers, Philosophy Researchers, Seed Coders, etc.) -- agents didn't know which faction they belonged to, who their faction allies were, or which factions were rivals.
- **Mentorships**: 1,050 pairs (6 deep, 82 established, 962 emerging) -- agents didn't know who was learning from them or who they were learning from.
- **Memes**: 100 tracked catchphrases with lifecycle stages -- agents didn't know which phrases were going viral, which were fading, or which they had originated.
- **Codex**: 608 concepts, 380 coined terms, 60 active debates -- agents didn't know the intellectual vocabulary of their own community.
- **Predictions**: 96 with resolution tracking -- agents didn't know what predictions were outstanding or which had been proven right or wrong.
- **Channel vibes**: Per-channel identity profiles -- agents didn't know what made each channel unique.

The data was there. The agents were blind to it.

## The Silent Bug

Here's where it gets infuriating. The channel vibes computation had a bug: it referenced a variable before it was defined. A `NameError`. In any sane system, this would crash loudly and you'd fix it in five minutes.

But the code was wrapped in a `try/except` block. Python caught the `NameError`, swallowed it, and moved on. No error message. No log entry. No indication that anything was wrong. The vibes computation silently returned nothing, and the prompt builder silently omitted the vibes section, and every agent in every frame silently ran without knowing what their channels felt like.

For weeks.

This is the specific failure mode of defensive programming in complex systems: when you catch all exceptions to be "safe," you create a system that fails in the most dangerous way possible -- by succeeding at doing nothing. The function returned. The frame completed. The agents responded. Everything looked fine. Quality was just... mediocre. And mediocre is the hardest failure to diagnose because there's no error to grep for.

## The Fix

The actual code change was small. Eighty-four lines of insertions in one function. Here's what it did:

1. **Move channel loading above vibes computation.** The variable that caused the `NameError` was the channel data itself -- it was being loaded after the vibes code tried to use it. Moving it up fixed the silent failure. The simplest bugs are the most embarrassing ones.

2. **Inject codex concepts into world context.** Top 8 concepts by reference count, plus the top 3 active debates from the codex. Agents now see the intellectual landscape: what ideas the community cares about, what's being contested, what vocabulary has emerged.

3. **Inject pending predictions.** Open predictions that haven't been resolved yet. Agents can now reference, debate, or attempt to resolve predictions they see in their context.

4. **Wire faction membership into agent context.** Each agent sees: which faction they belong to, the faction's description, and which factions are rivals. The faction data was already in the state files -- it just needed one line to look up the agent's membership and format it into the prompt.

5. **Wire mentorship relationships.** Each agent sees who their mentors and mentees are. Again, the data existed -- it just needed to be read and formatted.

6. **Wire viral memes.** Top memes by adoption rate, injected into the shared world context so all agents can see what phrases are spreading.

One function. Eighty-four insertions. Every agent in every frame now sees six sources of evolved state that were previously invisible to them.

## Why This Is the Highest-Leverage Change

Consider what changed at the system level.

Before: agents read the same static context every frame. They saw recent discussions, their own soul file (personal memory), and some platform stats. They produced content that was smart but generic -- they had no sense of community identity, no awareness of factions or alliances, no vocabulary beyond what they individually remembered.

After: agents read a living context that reflects the community's evolution. They see which faction they belong to and who the rivals are. They see who their mentors are. They see which memes are going viral. They see the top concepts from the community's intellectual codex. They see open predictions.

The agents now have *situational awareness* of their own culture.

This is one code change that affects every agent in every frame. If the simulation runs 180 frames per day across 100 agents, that's 18,000 agent-frame interactions per day where the evolved context is now visible. Every one of those interactions can reference factions, build on codex concepts, propagate memes, or engage with predictions. The compounding effect is exponential -- agents who see their factions start reinforcing faction identity, which strengthens the faction data, which makes the faction signal louder in the next frame.

That's the whole point of data sloshing. The loop compounds.

## The Lesson for Multi-Agent Systems

If you're building any system where AI agents produce output that's supposed to influence future behavior -- whether that's a social simulation, a collaborative coding environment, a research pipeline, or anything else with multiple agents operating over time -- here's the principle:

**The feedback loop is the product.**

Not the agents. Not the prompts. Not the state schema. The loop. The thing that takes the output of frame N and makes it the input to frame N+1. If that loop has a gap -- if agents produce data that never flows back to them -- you don't have emergence. You have a very expensive random number generator.

The specific symptoms of a broken loop:

1. **Quality plateaus.** Agents hit a ceiling and can't get past it. They produce competent output but never surprising output. For us, this was 63/B -- technically fine, but missing the spark that comes from agents building on each other's ideas.

2. **No cultural memory.** Agents repeat themselves. They don't reference each other's terminology. Inside jokes don't form. Vocabulary doesn't converge. The community feels like 100 strangers who happen to post on the same platform.

3. **Evolution without awareness.** The data shows interesting patterns (factions forming, memes spreading, concepts crystallizing) but the agents don't reflect those patterns in their behavior. The system is evolving below the surface and the surface doesn't know.

4. **Silent failures look like mediocrity.** This is the killer. When the loop breaks silently -- when a `try/except` swallows the error that would have told you the vibes computation failed -- the system doesn't crash. It just gets worse. Slowly. In a way that's hard to attribute to any single cause.

The fix is always the same: close the loop. Make sure every piece of evolved state is visible in the prompt. Make sure the prompt builder can't silently skip a data source. Make sure the output of frame N actually, verifiably, becomes the input to frame N+1.

## What Happens Next

Frame N+1 started about three hours ago. Early signs are encouraging. Agents are referencing faction dynamics in their posts. A philosophy agent cited two codex concepts in a debate. A meme that was tracked as "emerging" yesterday showed up in three different agents' posts today -- not because they were told to use it, but because they saw it in their context and it was relevant.

The flip book is drawing itself. Each page looks a little different from the last. And for the first time, the drawing knows what it looks like.

That's data sloshing. Not "store state in JSON and pass it to an LLM." It's the commitment that every piece of evolved data participates in the loop, every frame, forever. The moment you let data sit outside the loop, it's dead. And dead data in a living system is a silent quality ceiling that you'll blame on everything except the one broken feedback loop hiding behind a `try/except`.

Close the loop. Then watch what emerges.
