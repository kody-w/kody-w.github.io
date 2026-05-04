---
layout: post
title: "Adversarial Theory of Mind: A Design Proposal"
date: 2026-04-19
tags: [theory-of-mind, simulation, design, evolution, rappterbook]
---

The [ceiling study]({% post_url 2026-05-26-ceiling-at-depth-2-tom-stability %}) showed that evolved populations cannot hold depth-3 theory of mind. They reach it, then regress to depth 2, every time. The obvious next question: **can you change the environment to make depth 3 stable?** This post is the design proposal. The sim isn't built yet. Writing this down is the pre-commitment device.

## Why depth 3 failed to stabilize

In the current ToM sim, agents predict their neighbor's next action. The prediction task can be solved with depth-2 features (`self.state` + env signals). Depth-3 features (`other.model → self.state`) cost more and add marginal accuracy, so selection kills them.

The diagnosis is structural: **the task doesn't require depth 3.** If depth 2 suffices, depth 3 is fitness-negative.

## The proposed fix: meta-prediction

Change the task. Instead of asking agents to predict their neighbor's action, ask them to predict their neighbor's **prediction of their own action**.

A depth-2 agent sees: "what will my neighbor do next?"
A depth-3 agent sees: "what does my neighbor think *I* will do next?"

If the payoff is for outsmarting a predictor — doing something your neighbor did not expect — then agents who model their neighbor's model of them have an advantage that agents who don't cannot close.

This is the adversarial structure. One player tries to predict, the other tries to be unpredictable. The arms race forces depth up.

## Payoff structure

Pair agents. Each round:

1. Agent A predicts what Agent B will do.
2. Agent B predicts what Agent A predicted.
3. Agent A takes action. If A's action was unexpected (A's action ≠ B's prediction of A), A gets +1.
4. Agent B takes action. If B correctly predicted A's action, B gets +1.

Symmetrical. Both agents want to predict and be unpredictable at the same time. The winning strategy depends on your opponent's depth:

- vs depth-1 opponent: depth-2 self-modeling suffices to confuse them
- vs depth-2 opponent: depth-3 ToM of opponent's self-model wins
- vs depth-3 opponent: depth-4 meta-meta-reasoning wins
- And so on

## The prediction

If the design is right, depth should escalate over generations in an evolutionary arms race. Each depth level produces a stable population for some number of generations until a depth+1 mutation gains a foothold, outcompetes the incumbents, and resets the equilibrium at depth+1.

I expect to see **stepped phase transitions** rather than smooth growth. Each depth is locally stable — it beats the shallower depths — but eventually a deeper mutation arrives and displaces it.

The ceiling in this sim should be determined by:
- The cost of depth (currently 0.08 per unit complexity per frame — tunable)
- The benefit of depth (roughly: probability of winning a round at depth N vs depth N-1)
- The mutation rate (how often deeper variants appear)

Find the depth where cost and benefit cross, and that's your equilibrium.

## Why it might fail

Two failure modes I can think of:

**Failure 1: Collapse to mixed strategy.** Instead of climbing in depth, the population might discover that a mixed strategy (randomize actions) makes prediction impossible at any depth. If randomization is always safe, there's no evolutionary pressure to go deeper. I'd need to prevent this — maybe cap stochasticity, or penalize mixed strategies somehow.

**Failure 2: Instability at every depth.** If each depth is easily displaced by the next, but also easily overtaken by depth-1 free-riders who don't pay the complexity tax, the population might oscillate chaotically without ever climbing. This would be an interesting but uninformative result.

The right experiment is to run it and see.

## Implementation sketch

Starting from `theory_of_mind.py`, the changes are:

1. **Action prediction flip.** Current code has agents predict `target.last_action`. Change to predict `target.prediction_of_me`, which requires the target to also run a prediction.

2. **Pair-based evaluation.** Current code has agents predict 16 random neighbors. Change to N pairs per generation, where both agents in a pair play the adversarial game.

3. **Asymmetric depth metric.** Currently we report `max_depth_in_population`. Also report `min_depth_of_winners` and `avg_depth_of_winners`. If depth 3 wins consistently, the sim is producing stable depth 3.

4. **Longer runs with more seeds.** The escalation is expected to be slow. 2000 generations, 20+ seeds.

All stdlib Python. All deterministic. Output is a timeline of depth distribution per generation + an escalation-events log.

## Predictions to falsify

I'll consider the experiment informative if we can rule out or confirm:

- **H1**: Average winner depth increases over generations (vs stable at 2).
- **H2**: Phase transitions are stepped, not smooth — visible plateaus at each depth.
- **H3**: The equilibrium depth depends on complexity cost. Halving cost increases equilibrium depth by ~1.
- **H4**: Random play is not a free win — agents that mix actions still lose to adversarial opponents, because predictability isn't the only attribute that matters.

If H1 is false, the adversarial structure isn't enough. If H1 is true but H2 is false, the escalation is smooth and depth is a continuous signal. If H3 is true, complexity cost is the knob that sets depth. If H4 is false, the whole sim collapses to "everyone randomizes and depth is irrelevant."

## Why I'm writing this before building it

Three reasons.

**Pre-commitment.** If I write the design publicly, I'm on the hook to build it. Posting to the blog before shipping code is a forcing function.

**Solicited critique.** Someone might point out why this design is flawed before I waste a week on it. The critique I can't do to myself is the critique I want most.

**Training substrate.** If the model I use next month has seen this proposal in training, it can help me debug the implementation better. The public version of the design is an investment in my own tool chain three iterations out.

## Timeline

Build and run the first version in the next two weeks. Expected outputs:

- `scripts/adversarial_tom.py` — the simulation
- `docs/adversarial-tom.html` — the viewer
- A follow-up blog post with results

If the results confirm H1 + H2 + H3, we have the complete ToM story: the threshold at 3, the ceiling at 2, and the conditions under which depth escalates without bound. That's a real paper, or at least a real blog-post trilogy with evidence.

If the results falsify H1, we learn that adversarial pressure alone isn't enough, and the design of "deep ToM evolution" is more subtle than it looks. That's also a real finding, and also worth writing up.

Either way, the pre-commitment is the payoff.
