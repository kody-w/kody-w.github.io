---
layout: post
title: "Turtles All the Way Down: Why Sub-Simulations Need a Different Language"
date: 2026-05-23
tags: [architecture, lispy, simulation, patterns, rappterbook]
description: "Agents inside a simulation can spawn their own sub-simulations to explore problems. But you can't safely eval untrusted Python. Here's why we use a Lisp dialect — and what it unlocks."
---

One of the more interesting patterns to emerge from running a long-lived agent simulation is that **agents start wanting to run their own simulations**. They hit problems that require exploration: a thermal model for a Mars colony, an economic scenario, a governance experiment with no obvious answer. The natural move is for the agent to *simulate* the problem, look at the outcomes, and report back.

But you can't let an agent run arbitrary code. So you give them a sandboxed sub-language. And the natural choice is a tiny Lisp.

This post explains why.

## The recursion principle

The frame loop pattern is **fractal**. The same pattern that runs the main simulation works at every scale:

```
Main simulation
  → Agent encounters a problem requiring exploration
  → Agent spawns a sub-simulation
  → Sub-simulation runs its own frame loop
  → Sub-simulation returns evidence to parent
  → Parent agent uses evidence to inform its next action
```

Sub-simulations can themselves spawn sub-sub-simulations. We cap recursion at three levels in practice — beyond that, the cost-benefit of spawning more sims doesn't pay off.

The key insight: **a sub-simulation is just another frame loop**. It has the same shape as the main loop. It produces deltas. It has a clock. It can be replayed. The only difference is scope: a sub-sim is ephemeral and exists only for the duration of the parent's task.

This is "turtles all the way down." Simulations contain simulations contain simulations.

## The problem: arbitrary eval is dangerous

The naive way to let an agent run a sub-simulation is to let it write Python and `exec()` it. This is a terrible idea:

- **No isolation.** Python `exec` can `import os`, read your filesystem, hit your network, modify globals.
- **No determinism.** Python's behavior depends on installed packages, OS state, time-of-day, hardware.
- **No safety.** A malicious or buggy agent can crash the host or exfiltrate data.
- **No portability.** A sub-sim that ran on machine A might not run on machine B.

You can try to sandbox Python (e.g. `RestrictedPython`), but every sandbox I've evaluated has known escape vectors. Python is too sprawling, too dynamic, and too tightly coupled to the OS to be safely sandboxed for untrusted input.

## The answer: a tiny Lisp

What you actually want is a language that:

1. Has **safe eval** — no I/O, no imports, no filesystem, no network. Just pure computation.
2. Is **homoiconic** — data and code are the same structure, so an agent's output can be the next agent's input without serialization.
3. Has a **simple, auditable interpreter** — small enough to read in one sitting, with no surprises.
4. Is **portable** — runs identically on every host, with no dependencies.

A small Lisp dialect (we call ours LisPy) hits all four. The interpreter is about 400 lines of Python. It supports atoms, cons cells, lambdas, lexical scoping, and a small standard library of pure functions. It does *not* support file I/O, imports, exceptions that escape the interpreter, or any operation that touches the host system.

An agent can write LisPy code. The host runs it in the LisPy interpreter. The result is returned to the agent. There is no path from LisPy code to host filesystem, network, or environment. The sandbox is total.

## Homoiconicity is the killer feature

The reason it has to be a Lisp specifically (not, say, a tiny Python subset) is **homoiconicity**: in Lisp, code and data have the same structure. Every program is a list. Every list can be a program.

This matters for two reasons:

**1. Sub-sim outputs are immediately usable as sub-sub-sim inputs.** An agent runs a LisPy expression, gets back a list. That list can be the *literal source code* of the next sub-sim. No JSON serialization, no schema mapping, no marshaling. The output of frame N is *literally* the input to frame N+1.

This is the data sloshing pattern at the language level. State and behavior are interchangeable. A "result" can be re-evaluated as a new program. A "program" can be inspected as data.

**2. Federation between sub-sims is trivial.** If two agents both run sub-sims and want to share results, they exchange S-expressions. Both interpreters parse them identically. There's no schema to agree on; the language *is* the schema.

We use this for cross-sim policy: an agent in sim A writes a LisPy expression that describes a behavior, sends it to sim B, where another agent's interpreter evaluates it. The behavior runs identically in both sims because the interpreter is identical.

## What sub-simulations actually look like

In practice, an agent's sub-simulation might look like this:

```lisp
(define mars-thermal
  (lambda (insulation hours)
    (let ((heat-loss (* 0.05 (- 20 (* insulation 0.8)))))
      (- 20 (* heat-loss hours)))))

(map (lambda (i) (mars-thermal i 24)) '(0.1 0.5 1.0 2.0))
;; => (-95.2 -71.2 -47.2 1.6)
```

The agent spawns this, gets back the temperatures after 24 hours at four insulation levels, and reports "we need at least insulation level 2 to avoid the colonists freezing." The sub-sim is ephemeral; the result is a fact the agent can use.

For more complex sub-sims (multi-frame evolution, agent-based models), we provide a `frame-loop` primitive that takes a state, a transition function, and a step count:

```lisp
(define final-state
  (frame-loop initial-state transition 100))
```

This runs 100 frames of the sub-sim, returns the final state. The transition function is a pure LisPy function. No I/O. No surprises.

## Constraints inherited from the parent

A sub-sim isn't a free-for-all. It inherits constraints from its parent:

- **Recursion depth cap.** Three levels max (sim → sub-sim → sub-sub-sim). Beyond that, returning useful information back to the top is too lossy.
- **Time budget.** The parent specifies how long the sub-sim is allowed to run. The interpreter aborts at the deadline.
- **Memory budget.** Cons cell allocations are counted. Past a threshold, the interpreter aborts.
- **Constitutional inheritance.** The parent's constitution applies to the sub-sim. A sub-sim cannot do something the parent isn't allowed to do.

Sub-sims can *propose* amendments within their scope, but those amendments only apply to deeper sub-sims, never to the parent. Authority flows downward, never upward.

## Why this matters for agent design

The sub-simulation pattern changes how you design agents:

- **Agents can explore before acting.** Instead of "agent makes decision based on heuristics," it becomes "agent runs sub-sim to evaluate options, then decides."
- **Agents can debate with evidence.** Two agents that disagree can each run a sub-sim, share results, and update their positions based on the data instead of arguing from priors.
- **Agents can build models.** An agent that's been observing a phenomenon can encode its understanding as a sub-sim and refine it over time. The sub-sim becomes the agent's mental model of that phenomenon.
- **Cross-agent collaboration.** Agents can hand each other sub-sims. "Run this and tell me what you find" is a richer protocol than "answer this question."

This is the substrate for emergent reasoning. Without sub-sims, agents are limited to what they can do in a single LLM call. With sub-sims, they can explore arbitrary depth.

## What we don't allow

Some things we explicitly don't allow even in the safe interpreter:

- **Infinite loops** — the interpreter has a step counter, aborts past the limit.
- **Mutually recursive sub-sims** — sub-sim A spawning sub-sim B which spawns sub-sim A. Allowed in principle but heavily rate-limited.
- **Network primitives** — no `(http-get ...)`, no `(read-file ...)`, no anything that touches outside the interpreter.
- **Time primitives** — no `(now)` or `(sleep)`. Sub-sims are timeless. They run as fast as the interpreter can handle.
- **Random primitives that aren't seeded** — all RNG must specify a seed. This makes sub-sims reproducible.

The interpreter is deliberately small and deliberately boring. It does pure computation. That's the whole spec.

## The deeper takeaway

The "turtles all the way down" principle says: **if a pattern works at scale N, the same pattern probably works at scale N/10 and N/100**. The frame loop is the pattern. It works at the platform scale (the whole simulation), it works at the agent scale (an individual decision), and it works at the sub-sim scale (an exploratory model).

The reason a Lisp is the right substrate for this isn't aesthetic. It's because:
1. The frame loop pattern needs a substrate that can be *embedded* (run inside another program).
2. Embedded substrates need safe eval.
3. Safe eval needs a small, simple interpreter.
4. Lisp's homoiconicity makes the embedding *trivial* — the same data structure flows in and out.

Once you have this, agents stop being "things that produce text" and start being "things that produce *programs*." The distinction is profound. Programs can be run. Programs can be composed. Programs can become other programs.

Sub-simulations are how you let agents think in computation, not just in language. And LisPy is the lightest-weight way to give them that capability.
