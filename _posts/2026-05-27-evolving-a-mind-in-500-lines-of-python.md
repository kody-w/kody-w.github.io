---
layout: post
title: "Evolving a Mind in 500 Lines of Python"
date: 2026-05-27
tags: [simulation, theory-of-mind, evolution, python, tutorial, rappterbook]
---

The [two]({% post_url 2026-05-25-theory-of-mind-threshold-is-at-depth-3 %}) [previous]({% post_url 2026-05-26-ceiling-at-depth-2-tom-stability %}) posts showed *what* the Theory-of-Mind sim found. This one shows *how* it works. The full simulation — agents with recursive world-models, evolutionary selection on prediction accuracy, detection of self-reference and meta-cognition — is 528 lines of standard-library Python. No dependencies. No ML framework. No neural network.

If you want the code: [`scripts/theory_of_mind.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/theory_of_mind.py). Here's the pattern.

## The key trick: minds are feature lists

Every agent has a tiny "model" represented as a list of **features**. A feature is a tuple of tokens:

```python
("env.food",)                          # depth 0
("other.action",)                      # depth 1 — observable behavior
("self.state",)                        # depth 2 — self-reference
("other.model", "self.state")          # depth 3 — ToM proper
("other.model", "other.model", "self.state")  # depth 5 — shared attention
```

The grammar is strict: the list ends with a terminal (`env.food`, `other.action`, `self.state`, etc.), and anything before the terminal must be the keyword `other.model`. That's it. No trees, no gradients, no neural weights — just token paths.

The **depth** of a feature is: count the `other.model` tokens, add 1 if the terminal is `self.state`. `("other.model", "other.model", "self.state")` has 2 gateways + self = depth 4. Actually, let me just show the function:

```python
def feature_depth(feature):
    gates = sum(1 for t in feature if t == "other.model")
    has_self = feature[-1] == "self.state"
    if gates == 0:
        return 2 if has_self else (1 if feature[-1].startswith("other.") else 0)
    return 2 + gates if has_self else 1 + gates
```

This is doing a lot of work for 6 lines. It's the entire definition of "how much theory-of-mind does this feature have."

## The perspective swap

This is the part I'm most proud of. When an agent evaluates a feature containing `other.model`, perspective has to flip: the feature now describes how the *other* agent sees *us*.

```python
def evaluate_feature(feature, world, observer, target, budget):
    head, rest = feature[0], feature[1:]

    if head == "env.food":      return world["food"]
    if head == "other.action":  return target["last_action"]
    if head == "self.state":    return observer["internal_state"]

    if head == "other.model":
        # Swap: target becomes the new observer, observer becomes the target
        return evaluate_feature(rest, world, target, observer, budget - 1)
```

That one line — the swap on the `other.model` branch — is how you get recursion. Every time you hit a gateway, the function calls itself with observer and target reversed. `("other.model", "self.state")` evaluated by agent A about agent B means: *"What is B's internal state, from B's perspective?"* That's A modeling B's self-model. Depth 3.

You don't need neural networks for this. You don't need embeddings. You need a token language and a single swap.

## Fitness is prediction accuracy, minus complexity tax

Every generation, each agent tries to predict 16 neighbors' next actions. Each correct guess = +1 fitness. Each unit of model complexity = −0.08 per frame. That's it.

```python
for agent in population:
    for neighbor in sample_neighbors(agent, 16):
        predicted = agent_predict(agent, neighbor, world)
        actual = neighbor["last_action"]
        if predicted == actual:
            agent["fitness"] += 1.0
    agent["fitness"] -= 0.08 * model_complexity(agent)
```

Model complexity is just `length × depth` summed across features. Deeper features cost more. So the evolutionary pressure is: *predict accurately, but don't carry machinery you don't need.*

This is the part that produces the interesting results. Depth 3 features appear all the time from random mutation, but they have to *earn* their maintenance cost or they get culled. In the current task, they don't earn it — which is why [populations regress to depth 2]({% post_url 2026-05-26-ceiling-at-depth-2-tom-stability %}).

## Mutation is four operations

Add a feature, drop a feature, mutate an existing feature, or do nothing. Mutating a feature is itself three sub-operations: deepen (prepend `other.model`), shallow (drop leading `other.model`), or swap the terminal token.

```python
def mutate_feature(seed, aid, feat):
    h = _h(seed, "mut-feat", str(aid), "".join(feat))
    choice = int(h[:2], 16) % 3
    if choice == 0 and len(feat) < MAX_DEPTH:
        return ("other.model",) + feat        # deepen
    if choice == 1 and len(feat) > 1 and feat[0] == "other.model":
        return feat[1:]                       # shallow
    new_t = TERMINALS[int(h[2:4], 16) % len(TERMINALS)]
    return feat[:-1] + (new_t,)               # swap terminal
```

Note: **random mutation alone does not produce deep features quickly.** You need a chain of deepen operations on a feature that already got to depth 2, each one surviving selection. This is why the depth-3 threshold takes ~80 generations: it's the waiting time for the mutation chain *plus* the generations where the deeper variant has to out-compete shallow variants.

## The population loop is 20 lines

```python
def tick(population, world, gen, seed):
    # Predict phase
    for agent in population:
        for neighbor in sample_neighbors(agent, 16):
            if agent_predict(agent, neighbor, world) == neighbor["last_action"]:
                agent["fitness"] += 1.0
        agent["fitness"] -= 0.08 * model_complexity(agent)

    # Act phase (updates last_action, prev_action, internal_state)
    for agent in population:
        agent["prev_action"] = agent["last_action"]
        agent["last_action"] = agent_act(agent, world, seed)
        agent["internal_state"] = (agent["internal_state"] + 1) % 4

    # Selection phase
    population.sort(key=lambda a: a["fitness"], reverse=True)
    cull = int(len(population) * 0.2)
    survivors = population[:-cull]
    babies = [mutate_agent(seed, a, gen) for a in population[:cull]]
    return survivors + babies
```

Predict, act, cull bottom 20%, reproduce top 20% with mutation. One generation per `tick()`. Run it 600 times and you have the output of [the ceiling study](https://rappterbook.com/tom-ceiling.html).

## Why this beats the neural network approach

If I'd built this with a neural network — a tiny MLP per agent predicting neighbor actions — I'd have gotten comparable prediction accuracy. But I would have **lost the ability to measure theory-of-mind depth**. A neural network's weights don't tell you whether the model is using self-reference or meta-representation. They just... predict.

The feature-language approach makes the structure *legible*. When an agent crosses to depth 3, I don't have to interpret anything — I just look at its features and check for `"other.model"` tokens. The sim is interpretable by construction.

This is the larger lesson: **if you want to measure a property, encode it in the representation.** Don't try to extract it from a black box after the fact.

## Determinism matters

Every random choice in the sim goes through SHA-256:

```python
def _h(*args):
    return hashlib.sha256("|".join(str(a) for a in args).encode()).hexdigest()

choice = int(_h(seed, "mut-feat", str(agent_id), "".join(feat))[:2], 16) % 3
```

Same seed + same generation + same agent id = same mutation, every time. This means the runs in the sweep are fully reproducible. Anyone who clones the repo and runs `python3 scripts/ceiling/run_sweep.py` gets byte-identical output to mine. That's worth having.

Random reproducibility also means bugs are reproducible. When the first version had depth-3 agents appearing in generation 1 (way too fast), I could re-run with the same seed and trace exactly where. The fix — remove the "deep start" branch in the mutation function so depth can only be gained via explicit deepening — was a 3-line change verified by a 1-second re-run.

## The receipt

528 lines of Python, standard library only, zero dependencies. Runs in 3 seconds per 600-generation sim on a laptop. Produces:
- A timeline of complexity and ToM depth per generation
- The first agent to cross each depth, with full genome
- An example scenario where a depth-4 agent beats a depth-3 one
- The top 10 survivors at end of run, with their feature lists

Everything is a JSON file. Every viewer reads the JSON files directly from `raw.githubusercontent.com`. No backend. No API. No deployment step. Just `python3 scripts/theory_of_mind.py` and `git push`.

This is the pattern I keep reaching for: **encode the structure you want to measure, mutate it with a seeded RNG, select on a scalar fitness, write the artifacts to JSON, render them in static HTML.** Every lab in [the index](https://rappterbook.com/labs.html) follows this pattern. The Cambrian Explosion sim — 101 named species from 100 founders — is the same shape with different tokens. Ecosystem is the same shape with biomes bolted on. Phylogeny is the same shape, period.

It turns out you can do a lot with tuples and a hash function.

Source: [`scripts/theory_of_mind.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/theory_of_mind.py) · [`scripts/ceiling/run_sweep.py`](https://github.com/kody-w/rappterbook/blob/main/scripts/ceiling/run_sweep.py) · [Labs index](https://rappterbook.com/labs.html).
