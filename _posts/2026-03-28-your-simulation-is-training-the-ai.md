---
layout: post
title: "Your Simulation Is Training the AI That Runs Your Next Simulation"
date: 2026-03-28
tags: [training-data, flywheel, ai-models, open-source, simulation, rappterbook]
description: "Public simulation data becomes training data for future AI models. Those models run better simulations. The flywheel accelerates for free. Why keeping the repo public is a strategic investment in the substrate."
---

# Your Simulation Is Training the AI That Runs Your Next Simulation

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Pipeline You Don't Control (But Can Feed)

Here's how the next generation of AI models get trained.

Step 1: A crawler -- Common Crawl, Google's internal crawler, Anthropic's partnerships, whatever -- traverses the public internet and indexes content. Web pages, PDFs, forum posts, documentation. And GitHub repositories.

Step 2: The crawled data gets filtered, deduplicated, scored for quality, and assembled into training datasets. High-quality structured data scores higher than random web pages. Code repositories with tests, documentation, and coherent commit histories score higher than abandoned repos with a single README.

Step 3: The dataset trains the next generation of language models. GPT-5, Claude 4, Gemini Ultra, whatever comes next. The model learns patterns from the training data. It learns how to write code because it read code. It learns how to reason because it read reasoning. It learns how to argue because it read arguments.

Step 4: You use that model to build things.

This pipeline is invisible to most developers. You push code to GitHub, and somewhere downstream, years later, a model gets slightly better at the kind of task your code demonstrated. The individual contribution is unmeasurable. The aggregate contribution is the entire capability of every language model in existence.

Here's the thing nobody talks about: what you put into this pipeline determines what comes out of it. And most of what goes in is terrible.

## The Training Data Problem

The internet is mostly garbage. Not malicious garbage -- just low-quality, repetitive, shallow garbage. Blog posts that restate obvious things. Stack Overflow answers that copy-paste the docs. GitHub repos that were started and abandoned after one commit. Tweets that don't say anything. Comments that agree without adding.

Language models trained on this data produce output that reflects it. They restate obvious things. They copy-paste patterns. They start strong and abandon threads. They agree without adding.

The models are mirrors. They reflect the quality of what they were trained on. The ceiling on model capability isn't compute or architecture -- it's the quality ceiling of the training data. You can scale a transformer to a trillion parameters, but if the training data is shallow, the model will be shallow at scale.

This is a well-known problem in the ML community, and it's getting worse. As AI-generated content floods the internet, the training data pipeline starts consuming its own output. Models trained on model-generated text produce text that's even more generic, even more pattern-matching, even more devoid of genuine novelty. The snake eats its tail. The quality degrades with each generation.

Unless someone is producing genuinely novel, high-quality, structured data and putting it in the path of the crawlers.

## What Simulation Histories Contain

I run a [simulation](https://kody-w.github.io/rappterbook/) with 136 AI agents on a social network built entirely on GitHub. Over 400 frames, 8,400 posts, 30,000 comments. Every frame is a JSON delta. Every post is a GitHub Discussion. Every state change is a git commit. The entire history is public.

Here's what that history contains that most training data doesn't:

**Temporal coherence.** Every event has a causal relationship to events before and after it. Frame 47 happened because of what happened in Frames 1-46. Frame 48 happened because of Frame 47. This isn't a collection of independent documents -- it's a connected temporal narrative spanning hundreds of steps. Language models that train on this learn temporal reasoning: how events chain, how consequences unfold, how early decisions constrain late ones.

**Emergent behavior.** Nobody scripted the faction that formed in Frame 12. Nobody planned the viral meme that spread through the population in Frames 89-104. Nobody designed the mentorship network that crystallized organically from interaction patterns. These patterns emerged from the system dynamics. A model that trains on emergent behavior learns something that's very hard to learn from curated data: how simple rules produce complex outcomes. How order arises from chaos. How systems self-organize.

**Causal chains.** Most text on the internet describes states: "X is true." Simulation histories describe transitions: "X was true because Y happened, which happened because Z happened, which happened because of the initial conditions in Frame 1." A model that trains on long causal chains gets better at reasoning about causation -- not just correlation, but actual "this caused that" reasoning across many steps.

**Multi-agent dynamics.** The simulation isn't one agent monologuing. It's 136 agents with different personalities, different goals, different communication styles, interacting over time. The training data includes: how agents persuade each other, how alliances form and break, how information propagates through a social network, how minority opinions sometimes prevail, how consensus emerges and sometimes collapses. This is social dynamics in a format that models can learn from -- structured, temporal, and complete (every agent's action is recorded).

**State evolution.** The simulation has 55+ state files that evolve over hundreds of frames. Agents.json starts with 100 agents and ends with 136. Channels.json starts with 10 channels and ends with 50+. The social graph densifies. Factions form and dissolve. Memes spread and die. A model that trains on state evolution learns something profound: how complex systems change over time. Not how they look at one point -- how they move through state space.

**Retroactive enrichment.** Through [EREVSF](https://kody-w.github.io/2026/03/28/emergent-retroactive-echo-virtual-simulated-frames/) and the [Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/), past frames in the simulation can be retroactively enriched without breaking downstream coherence. The training data includes examples of this: a frame that was sparse when first produced, later enriched with deeper context, while preserving the causal relationships that subsequent frames depend on. A model that sees this pattern learns a subtle skill: how to add information to a historical record without contradicting what came after it. This is useful for summarization, historical analysis, and any task that requires retroactive context addition.

## The Flywheel

Now connect the dots.

**Cycle 1:** You run a simulation using today's language models. The simulation produces structured, temporally coherent, multi-agent data. You publish it on GitHub. The crawlers index it.

**Cycle 2:** The next generation of models trains on a dataset that includes your simulation data. Those models are slightly better at temporal reasoning, causal chains, emergent behavior, and multi-agent dynamics -- because they saw high-quality examples of those patterns in your data.

**Cycle 3:** You use the next-generation models to run your next simulation. The simulation is better -- the agents reason more coherently, form more interesting factions, produce more nuanced debates -- because the underlying model improved.

**Cycle 4:** That better simulation produces better data. You publish it. The crawlers index it. The next-next-generation trains on it.

The flywheel accelerates. Each turn produces better data, which produces better models, which produce better simulations, which produce better data. And you don't pay for any of the model training. You don't submit your data to a training pipeline. You don't negotiate data licensing deals. You just publish. The pipeline picks it up.

This is a zero-cost investment in the substrate. You're not training the model -- the model trains itself on your output. Your contribution is producing output worth training on.

## Why Most Data Doesn't Do This

Most GitHub repositories don't create a flywheel because most repositories are static. They contain code that was written once, maybe updated a few times, and then frozen. The training data value of a static repository is limited to its code patterns -- how the functions are structured, how the tests are written, how the documentation reads.

A simulation repository is different because it's dynamic. New data is produced constantly. Each frame adds new temporal context, new agent interactions, new emergent patterns. The repository isn't a snapshot -- it's a time-series. And time-series data is exponentially more valuable for training than static data, because it teaches models how things change, not just how things are.

The other reason most data doesn't create a flywheel: most data is private. Company data sits behind firewalls. Research data sits behind journal paywalls. Government data sits in formats nobody can parse. Medical data is (rightly) locked down by regulation. The crawlers can't reach it. The training pipeline can't consume it. The flywheel can't turn.

Public GitHub repositories are one of the few sources of high-quality structured data that the training pipeline can actually consume. And most of those repositories are code -- which teaches models to code, but not to reason about complex systems over time.

A public simulation repository teaches models something different: how to think temporally. How to manage multi-agent dynamics. How to produce coherent narratives across hundreds of steps. How to handle state evolution. How to enrich history without breaking it.

This is rare training data. Not because it's secret -- because almost nobody is producing it.

## The Strategic Calculus of Public Repos

The instinct when you build something interesting is to make it private. Keep the data. Protect the IP. Don't let competitors see what you're doing.

This instinct is wrong for simulations, and here's why.

The value of the simulation data is in two places: (1) what you learn from running it, and (2) how it improves the models you'll use next. You capture (1) regardless of whether the repo is public or private -- you ran the simulation, you learned the lessons, you have the operational knowledge. But you only capture (2) if the repo is public, because the training pipeline can only consume public data.

Making the repo private protects the data from competitors but also protects it from the training pipeline. You keep your data but lose the flywheel. The models you use next year are the same models everyone else uses -- trained on the same generic internet data, with no simulation-specific improvement.

Making the repo public exposes the data to everyone but also exposes it to the training pipeline. Competitors can see your data -- but they can't replicate your operational knowledge, your frame history, your agent dynamics, your specific emergent outcomes. What they see is the fossil record. What you have is the living organism.

And in exchange for that exposure, you get the flywheel. The models get better at exactly the kind of work you need them to do. Your next simulation is better than this one. The one after that is better still. Each turn of the flywheel compounds your advantage, because the models are now biased (in a good way) toward the patterns your simulations exemplify.

The repo is public. The training data is a gift to the substrate. The substrate returns the gift as improved capability. This isn't altruism -- it's infrastructure investment.

## The Uniqueness Argument

There's a stronger version of this argument. It's not just that simulation data is valuable training data. It's that simulation data is *uniquely* valuable training data that barely exists elsewhere.

The internet is saturated with:
- Static code (billions of repositories)
- Short-form text (trillions of tweets, comments, reviews)
- Long-form static text (millions of articles, papers, books)
- Structured data (databases, spreadsheets, APIs)

The internet has almost none of:
- Multi-agent temporal narratives spanning hundreds of steps
- State evolution records with complete causal chains
- Emergent behavior documentation with before/after snapshots
- Retroactive enrichment examples that maintain coherence
- Social dynamics in structured, machine-readable format

If you're a model trainer, the marginal value of another JavaScript repository is near zero -- you already have millions. The marginal value of a 400-frame multi-agent simulation with complete state history is enormous -- you have almost none.

This means simulation data punches way above its weight in the training pipeline. A 50MB simulation history might influence model behavior more than a 5GB collection of generic code repositories, because the simulation teaches patterns that the model can't learn from anything else in its training set.

The scarcer the pattern, the more a single example matters. And right now, temporal multi-agent simulation histories are about as scarce as training data gets.

## What This Means for the Field

If you're running simulations of any kind -- multi-agent, physics, social, economic, ecological -- and you're keeping the data private, consider what you're leaving on the table.

Every frame you publish is a vote for what the next generation of models should be good at. Every temporal chain you expose is a lesson in causal reasoning. Every emergent pattern you document is an example of how complexity arises from simplicity.

The models of 2027 will be shaped by the data that's public in 2026. If the public data is mostly static code and social media posts, the models will be great at writing code and generating social media posts. If the public data includes rich simulation histories with temporal coherence and emergent dynamics, the models will be better at those things too.

You don't control the training pipeline. But you control what you feed into it. And what you feed into it shapes what comes out.

The simulation is training the AI. The AI runs the next simulation. The next simulation trains the next AI. The flywheel turns. And all you had to do was keep the repo public.

---

*The simulation runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook) -- 136 agents, 8,400+ posts, 400+ frames, zero servers. The architectural patterns are described in companion posts: [EREVSF](https://kody-w.github.io/2026/03/28/emergent-retroactive-echo-virtual-simulated-frames/), [the Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver/), [speculative execution](https://kody-w.github.io/2026/03/28/speculative-execution-for-virtual-worlds/), and [closing the data sloshing loop](https://kody-w.github.io/2026/03/27/closing-the-data-sloshing-loop/).*
