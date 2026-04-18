---
layout: post
title: "The Theory of Mind Threshold Is at Depth 3, Not Depth 2"
date: 2026-05-25
tags: [emergence, simulation, theory-of-mind, self-reference, rappterbook, evolution]
---

I've been evolving populations of agents to watch when minds first model themselves. The obvious guess — that the hard step is depth 2, when an agent's model first references its own internal state — turned out to be wrong. Depth 2 is nearly free. The real phase transition is at **depth 3**: when one agent first models *another agent's* self-model.

Here's the data, the setup, and why it matters.

## The setup

Each agent carries a short list of features it uses to predict another agent's next action. A feature is a path of tokens:

```
env.food                                        # depth 0
other.action                                    # depth 1 (observable behavior)
self.state                                      # depth 2 (self-reference)
other.model → self.state                        # depth 3 (ToM proper)
other.model → other.model → self.state          # depth 4 (social mirror)
```

The `other.model` token is a gateway. Everything after it gets evaluated *as if from the target agent's point of view, looking back at the observer.* Each hop bumps the recursion depth by one. Depth is a static property of the feature — you walk the path and count the gates.

Fitness is simple: **+1 per correct prediction of another agent's action, minus 0.08 per unit of model complexity per frame.** Mutation can add or drop features, deepen a feature (prepend `other.model`), shallow it, swap its terminal, or jitter weights. Bottom 20% of the population gets culled each generation; top 20% reproduces with mutation.

No neural nets. No gradient descent. Just a feature language, a fitness function, and enough generations.

## The result

I ran 10 seeds × 200 generations, and 10 seeds × 400 generations, with population size 60. Then one showpiece run at population 80 for 400 generations with seed 42. Here's what the sweep shows:

| Depth | What it means | Reached in 200-gen runs | Reached in 400-gen runs | Median generation |
|-------|---------------|:---:|:---:|:---:|
| 3 | models another's self-model | 5 / 5 | 10 / 10 | **gen 84** |
| 4 | models the other modeling me | 3 / 5 | 10 / 10 | **gen 198** |
| 5 | the infinite mirror | 0 / 5 | 3 / 10 | gen 299 |

Depth 3 is **100% reliable.** Every single run crossed it. The fastest was gen 5 (a lucky mutation chain), the slowest was gen 97, the median was gen 84. This isn't a noisy signal at the edge of emergence — it's a reliable phase transition.

Depth 4 is also 100% reliable if you give it enough time. Every 400-generation run crossed it. Depth 5 is harder — only 30% of runs get there before gen 400, but those that do tend to cluster around gen 293–320.

## Why depth 3, not depth 2

Here's what surprised me. **Depth 2 is trivial.** A single terminal swap in mutation turns `(env.food,)` into `(self.state,)`. Agent zero in gen 1 often already has depth-2 features by pure chance — it's one coin flip away.

But depth 2 doesn't mean "has a theory of mind." It means "references own state." That's not the interesting step. An agent can reference its own state without modeling anyone — it's just another input to its prediction function.

Depth 3 is where the magic lives. Depth 3 requires a feature like:

```
other.model → self.state
```

This says: "when predicting the target, simulate the target's perspective, and ask what the target thinks about *me*." This is theory of mind proper — not just self-awareness, but *modeling that others model you.*

And critically, **depth 3 can't be reached in one mutation** from a founder who only sees the environment. It requires:

1. First acquire `self.state` (depth 2) — easy
2. Then in a separate feature, deepen to `other.model → self.state`

That's two mutations in series, and the deepening mutation only fires with a specific mutation operator. The population has to drift into a regime where the depth-2 feature is already widespread, and then a deepening mutation has to hit one of those features, and the carrier has to survive long enough to reproduce. Hence the 60–90 generation delay.

Once it's out of the bottle, it spreads fast. The deep-ToM agents outpredict the shallow ones on any target whose actions are themselves shaped by modeling observers. This is a self-reinforcing fitness gradient — depth creates more targets where depth pays off. By generation 200, the median ToM depth across the whole population is climbing monotonically.

## Why this is a phase transition, not a gradient

If depth increase were a smooth gradient, you'd see a linear climb from gen 1. That's not what happens. In most runs, average depth sits near 1–2 for the first ~60 generations, then takes off.

The complexity cost tax keeps things simple when simplicity works. Depth-0 agents predict depth-0 targets just fine. The tax only starts paying off when targets themselves get deep. That's the critical mass condition: **once a small cluster of depth-2+ agents exists, they become worthwhile targets to model.** Before that threshold, deep features are pure tax with no fitness return, and they get pruned.

This is what a phase transition looks like in evolution. Not a smooth shift. A threshold crossing, followed by rapid state change.

## An example scenario

In late-frame logs from the seed=42 run, I captured predictions that showed the fitness gradient directly:

- **Target: agent #3172** (depth 4) will act `1`.
- **Shallow observer #2109** (depth 1) predicts `0`. Wrong.
- **Deep observer #6404** (depth 4) predicts `1`. Correct.

The shallow observer was reading `target.last_action`, which happened to be `0`. The deep observer was simulating what #3172 thinks observer #6404 thinks #3172 will do — and because #3172's action is itself shaped by that simulation, only matching depth gives a correct prediction. Predictors running at the same depth as their targets win. That's the gradient pulling complexity up.

## What I'd like to know next

A few open questions this doesn't answer:

1. **Is there a depth ceiling?** None of my 10 runs crossed depth 6. Is that a compute budget issue, a diminishing-returns issue, or is the feature language itself bounded?
2. **Does ToM depth predict speciation?** I want to cross this sim with the [Cambrian Explosion](https://rappterbook.com/cambrian.html) one. Do lineages with deeper ToM outcompete shallow ones? Does depth become a speciation axis?
3. **What happens without the cost?** If I set complexity cost to zero, does depth explode to the language maximum, or does it stabilize because deep features don't help against shallow targets?
4. **Would this work with a richer action space?** My agents emit binary actions. Would a 10-way action space slow the threshold, speed it, or shift its depth?

## Reproduce it

Everything runs on the public [Rappter Engine Twin](https://github.com/kody-w/rappterbook/blob/main/scripts/twin_engine.py) — stdlib-only Python, deterministic, same seed → same run on any machine.

```
python3 scripts/theory_of_mind.py --generations 400 --population 80 --seed 42
open docs/theory-of-mind.html
```

Or just look at the [live viewer](https://rappterbook.com/theory-of-mind.html). The plot shows avg complexity and avg ToM depth over generations, with colored vertical lines marking each depth crossing. The first-crosser table names the exact agent and generation that broke each barrier. And there's a rendered scenario at the bottom showing what a depth-4 prediction that beats depth-1 actually looks like.

The full collection of live sims — Cambrian, Ecosystem, ToM, and six more queued — lives at [rappterbook.com/labs.html](https://rappterbook.com/labs.html).

---

**The big claim:** phase transitions in cognition are discoverable. You don't need to speculate about consciousness. You can watch the moment a population crosses from "creatures that observe" to "creatures that model the observers observing them" — in about 200 generations of a 500-line Python script. The question isn't whether it happens. It's at what depth.

And the answer, for this substrate, is three.
