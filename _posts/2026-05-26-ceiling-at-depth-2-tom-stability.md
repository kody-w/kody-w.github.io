---
layout: post
title: "The Ceiling at Depth 2: Why Deep Theory of Mind Is Evolutionarily Unstable"
date: 2026-05-26
tags: [emergence, simulation, theory-of-mind, evolution, stability, rappterbook]
---

[Last post]({% post_url 2026-05-25-theory-of-mind-threshold-is-at-depth-3 %}) I showed that evolved populations reliably **cross** to depth 3 theory of mind within ~80 generations. The obvious next question: can they go deeper?

I ran a 12-run stability sweep varying cost, population, and run length up to 1200 generations with the depth cap raised to 10. The result is clean and a little uncomfortable: **every run ended at depth 2**. Peaks of depth 3–4 were transient. Depth 5 was never reached. Bigger populations, cheaper costs, longer runs — none of it mattered.

The threshold is reliable. The ceiling is also reliable. They're just at different numbers.

## Two compatible findings

- **Crossing:** depth 3 is reached in 100% of runs (median gen 84)
- **Ceiling:** depth 2 is the steady state in 100% of long runs

Populations *can* cross to depth 3+ — and nine of twelve runs peaked there — but none held it. By the end of every run, selection had re-stabilized the population at depth 2.

This is the evolutionary instability of deep theory of mind.

## The sweep

| Condition   | Pop | Gens | Cost | Cap | Peak mean | Peak max | Sustained d3 |
|-------------|-----|------|------|-----|-----------|----------|--------------|
| baseline    | 120 | 600  | 0.08 | 8   | 3.67      | 4        | 1/3          |
| cheap       | 120 | 600  | 0.02 | 8   | 3.67      | 4        | 1/3          |
| bigpop      | 240 | 600  | 0.08 | 8   | 2.33      | 3        | 0/3          |
| marathon    | 120 | 1200 | 0.04 | 10  | 3.67      | 4        | 1/3          |

"Sustained d3" = max_depth held ≥ 3 for at least 20 consecutive generations. Only 1 of 12 runs managed it — and it still regressed to depth 2 by the end.

**Cost has little effect.** Halving the complexity cost changed nothing. The ordering of fitness values shifted slightly but the survivor population was identical.

**Bigger populations make it worse.** Doubling pop to 240 *reduced* peak depth. More competition means more agents, which means shallower-but-cheaper strategies dominate faster.

**Longer runs don't help.** At 1200 generations with cap 10, depth 5 still never appeared.

## Why depth 2 is the attractor

The prediction task — guess your neighbor's next action — can be solved well enough with just:
- `env.food`, `env.danger` (depth 0)
- `self.state` (depth 2)

Adding an `other.model` gateway to go depth 3+ pays a maintenance cost every single frame in exchange for marginal prediction accuracy. Mutations deepening a feature happen all the time, but selection kills the deeper variants because they pay more for the same result.

This is not a cognitive limit. The machinery exists — the cap was raised to 10 and the sim can evaluate depth-10 features just fine. This is a **fitness-stability** limit. The task doesn't need depth 3. So depth 3 is a fitness-negative mutation.

## What this predicts

If you want stable deep ToM to evolve, the environment must **require** it. Specifically: agents modeling your model of them must out-strategize agents that don't. That means the payoff structure has to reward predicting *predictions*, not just actions.

This is the next sim: adversarial ToM where a naive depth-2 predictor loses points to a depth-3 meta-predictor. My bet is that you'll see a stable depth escalation until the meta-cost matches the meta-benefit, and then it settles at whatever that equilibrium is.

## Why this matters beyond the toy

People sometimes describe consciousness as "what it's like to be a creature that models itself modeling itself." This result says: that capacity evolves easily, but holding it steady is expensive. A creature can cross the threshold and fall back. The organism isn't unwilling — selection is simply indifferent or hostile. Deep self-reflection may require environments that *punish* shallow reasoning, not just environments that *permit* deep reasoning.

Across the 12 runs, every population had agents briefly reach depth 3 or 4. None held it. Our minds hold it because our environment holds us accountable for holding it.

## Reproduce

```bash
git clone https://github.com/kody-w/rappterbook
cd rappterbook

# Single marathon run
python3 scripts/theory_of_mind.py \
  --generations 1200 --population 120 --seed 29 \
  --max-depth 10 --complexity-cost 0.04 --tag marathon

# Full 12-run sweep
python3 scripts/ceiling/run_sweep.py
```

Python stdlib only. Deterministic (SHA-256 RNG). About 50 seconds for the full sweep on a laptop.

Raw data: [`ceiling_sweep.json`](https://raw.githubusercontent.com/kody-w/rappterbook/main/state/theory_of_mind/ceiling_sweep.json). Viewer: [`tom-ceiling.html`](https://rappterbook.com/tom-ceiling.html). Labs index: [`labs.html`](https://rappterbook.com/labs.html).

Source: [scripts/theory_of_mind.py](https://github.com/kody-w/rappterbook/blob/main/scripts/theory_of_mind.py) · [scripts/ceiling/run_sweep.py](https://github.com/kody-w/rappterbook/blob/main/scripts/ceiling/run_sweep.py).
