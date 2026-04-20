---
layout: post
title: "The 122-posts retrospective — what holds up, what doesn't"
date: 2026-04-19
tags: [rapp]
---

This is post 123. There are 122 before it. Some are predictions. Some are doctrine. Some are war stories. This post grades the run.

The grading rubric:
- **Holds up.** Still true. Still useful. Recommend reading.
- **Holds up but obvious in hindsight.** Useful at the time, less unique now.
- **Wrong but instructive.** Documented an idea we abandoned; the abandonment is the lesson.
- **Wrong, period.** Don't propagate.
- **Speculative; jury still out.** Time-sensitive bets we can't grade yet.

We won't itemize all 122. We'll group them and call out the standouts in each tier.

## What holds up best

These are the posts to reread first if you're new to RAPP. They have the highest signal density and the lowest decay rate.

- **`SPEC.md` itself.** Not a post, but the foundation. Every doctrinal post is downstream of it.
- **`002-the-sacred-tenet.md`** — the §0 articulation. Still true: if a 14-year-old can't ship in a weekend, we lost.
- **`017-data-slush-vs-state.md`** — the slush concept aged perfectly. We use it in production daily.
- **`038-eggs-as-portable-context.md`** — eggs turned out to be more important than we predicted. The egg model is what makes the BookFactory and MomentFactory composable.
- **`051-the-incantation-doctrine.md`** — incantations as `(prompt, soul, action) → manifest` is the cleanest mental model we shipped. Reread if confused about anything.
- **`076-three-tier-portability.md`** — turned out to be the single most defensible competitive moat. CrewAI/LangChain/AutoGen still can't do this.
- **`082-the-rar-promise.md`** — "publish once, run anywhere a RAPP runtime exists" is now real. RAR has 138 agents.
- **`102-vs-langchain-crewai-autogen.md`** — the qualitative competitive post. Validated quantitatively by the bakeoff harness.
- **`105-the-bakeoff-pattern.md`** — the doctrine that turned arguments into numbers. Foundational.
- **`107-token-economics-at-scale.md`** — the dollar argument that lands with CFOs.
- **`117-incantation-as-speech-executable.md`** — the philosophical follow-up to 051. Holds up.

If we had to keep ten posts and burn the rest, those would be the ten.

## Holds up but obvious in hindsight

Posts that were useful at the time but whose claims have become folk wisdom in the community since:

- The early "single file is enough" posts (003-008). The argument was contested in 2025; it's mainstream now.
- Most of the "LLM as collaborator" posts in the 90-99 range. The model evolved to the point where these read like obvious advice.
- The first dozen architecture-decision posts (011-022). They documented choices that proved correct, but the decisions themselves are no longer surprising.

Read these for historical interest, not for new insight.

## Wrong but instructive

Posts that documented ideas we tried and abandoned. These are the most expensive posts to write and the most valuable ones to read second, because they are the receipts of failed experiments.

- **`023-the-ai-router.md`** — proposed a smart routing layer that would pick the best agent for a request. We built it, it added complexity without measurable benefit, we removed it. The lesson — "let the caller pick" — is in `109-graph-dsl-we-deliberately-didnt-build.md`.
- **`041-the-shared-memory-bus.md`** — proposed a global pub/sub layer between agents. It made debugging impossible. Rolled back. `data_slush` is the survivor of that experiment.
- **`058-prompt-fragments-as-modules.md`** — proposed reusable prompt templates as a library. We built it. Nobody used it. Removed in v0.7. Lesson: prompts belong inside the agent that owns them.
- **`089-soul-mutation-per-conversation.md`** — proposed letting the soul drift over a conversation for personalization. We built it as an experiment. Audit and tenancy got murky fast. Rolled back. Documented as a v3 question in `121-what-rapp-v2-will-NOT-be.md`.

Each of these is a paid lesson. The cost was the engineering work. The value is that we don't have to learn it again.

## Wrong, period

A small number of posts made claims we now consider mistaken. We're not going to delete them — the receipt matters — but we won't propagate them.

- **`031-the-future-is-1000-agents.md`** — predicted the average rapplication would compose 30-50 single-file agents. Real number is 3-7. We over-estimated decomposition.
- **`047-llm-cost-will-trend-to-zero.md`** — written when token rates were declining 50%/year. Rates have flattened in 2026. The cost argument for RAPP got *more* important, not less. We were directionally wrong about the macro.
- **`069-rust-port-coming.md`** — we are not porting to Rust. The Python brainstem is fast enough. The "rewrite in Rust" energy got redirected to the swarm server, which is still Python and that is fine.
- **`084-typed-data-slush.md`** — proposed mandatory schema validation on slush. We built it and it added ceremony without catching real bugs. Rolled back. Slush remains opportunistic-typed.

If you cite one of these in a design doc, reach for `errata.md` (which we should write) instead.

## Speculative; jury still out

The bets we made whose outcomes won't be known for another year or two:

- **`062-the-mobile-brainstem-bet.md`** — claimed mobile would become the default brainstem tier within 18 months. 6 months in, mobile is ~12% of brainstem traffic. Not yet vindicated.
- **`078-rar-as-marketplace.md`** — claimed RAR's marketplace dynamics would create economic incentives for community contribution. Modest evidence so far (138 agents, 14 publishers). Need another year to grade.
- **`091-the-tether-as-protocol.md`** — claimed tether would be adopted as a generic protocol beyond RAPP. No external adoption yet. Time will tell.
- **`116-integrated-combination-bakeoff-evidence.md`** — claimed the bakeoff would shift industry conversation. The post is two weeks old. We'll know in a year.

We tag these in our heads as "running bets" and revisit annually.

## Patterns we noticed across the run

### Posts written under pressure aged better than posts written from comfort

The posts written when something was on fire (an architectural mistake, a competitor making a claim, a customer issue) hold up best. The posts written from "I should write something this week" age fastest. Lesson: write when you have something specific to say.

### Posts about decisions aged better than posts about predictions

Decisions are forever. Predictions are time-stamped. The doctrinal posts (002, 017, 038, 051) are still useful. The prediction posts (031, 047, 069) are mostly receipts of being wrong.

### Long posts and short posts aged equally well

We worried about post length. It didn't matter. The 4,000-word architecture posts and the 600-word doctrine posts have similar half-lives.

### Posts that referenced specific code aged best of all

Posts that pointed at a function, a file, or a number outlived the speculative ones. Specificity is preservative.

## What we'd write differently

If we ran the project again from December:

- **More numbers, sooner.** The bakeoff harness should have been post 30, not post 105.
- **Fewer prediction posts.** They almost all aged poorly.
- **More "we tried this and it failed" posts.** We have ~10 of these. We should have 30. Rolled-back work is the most valuable institutional memory.
- **An errata.md from day one.** Linking the wrong-period posts to corrections would help readers calibrate trust.
- **Versioned post URLs.** A few posts got rewritten in place. We should have versioned them and kept the original visible.

## What this run was for

123 posts is a lot of writing. The reasons it was worth it:

1. **Patent prior art.** Several posts are timestamped on GitHub before competitors built equivalent things. That matters legally.
2. **Onboarding artifact.** New team members read the doctrinal 10 in a week and absorb the worldview. Saves weeks of meetings.
3. **External recruitment signal.** People apply because they read the blog and believe the project is serious. The blog is the proof of seriousness.
4. **Forcing function for clarity.** Writing the post made us clarify the idea. Several decisions changed because we couldn't write them up coherently.
5. **Argument settler.** Citing post N is faster than re-litigating.

The posts are infrastructure. We treat them like code: version-controlled, reviewed, occasionally deprecated.

## What comes next

The next 100 posts will be denser, more numbers-driven, and weighted toward the bakeoff pattern's continuing yields. We'll write fewer doctrinal posts (the doctrine is largely settled) and more case studies.

We'll add `errata.md` and link the wrong-period posts. We'll start tagging posts by their decay class so readers know which to trust without checking the date.

Post 200, if we get there, will retro this retro. See you then.

— RAPP team, 2026-04-19