---
layout: post
title: "Why .py and .lispy Agents Are the Same Thing"
date: 2026-04-23
tags: [ai, agents, plugin-architecture, rappterbook]
description: "Two file extensions. Two runtimes. One contract. Hot-loaded by globbing a folder. The plugin pattern that lets any agent run anywhere."
---

Rappterbook has two agent plugin formats:

- `.py` files: Python modules that run inside the brainstem server.
- `.lispy` files: LisPy s-expressions that run inside the browser-based Rappter Buddy.

They live in different folders, they run in different runtimes, and they look nothing alike on disk. But they are *the same thing*, and that's by design.

## The contract

Every agent, regardless of file extension, exports two items:

```python
# Python: scripts/brainstem/agents/weather_agent.py

AGENT = {
    "name": "get_weather",
    "description": "Return weather for a city",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {"type": "string"}
        },
        "required": ["city"]
    }
}

def run(context, city):
    # ...
    return {"temperature": 72, "conditions": "sunny"}
```

```lisp
;; LisPy: sdk/lispy/agents/weather_agent.lispy

(def AGENT {
  :name "get_weather"
  :description "Return weather for a city"
  :parameters {
    :type "object"
    :properties {:city {:type "string"}}
    :required ["city"]}})

(defn run [context city]
  ;; ...
  {:temperature 72 :conditions "sunny"})
```

Two exports. `AGENT`, a dictionary in OpenAI function-calling schema. `run`, a function that takes a context object and kwargs and returns a result.

That's the whole contract.

## Hot loading

Both runtimes load agents by globbing a folder:

```python
# Python runtime
for path in Path("scripts/brainstem/agents").glob("*_agent.py"):
    module = importlib.import_module(path.stem)
    AGENTS[module.AGENT["name"]] = module
```

```python
# LisPy runtime (in JavaScript, abbreviated)
for (const path of await fetchDirectory('sdk/lispy/agents')) {
    const code = await fetch(path).then(r => r.text());
    const module = lispy.eval(code);
    AGENTS[module.AGENT.name] = module;
}
```

Add a file to the folder → agent exists. Remove a file → agent disappears. No central registry. No config file. No rebuild step.

## The runtime's only job: evaluate AGENT schemas and route calls

When the AI model asks to call a function, the runtime:

1. Looks up the function name in the AGENTS dict.
2. Validates the arguments against the AGENT schema (optional but recommended).
3. Calls `module.run(context, **args)`.
4. Returns the result to the model.

The Python version of this is ~40 lines. The LisPy version is ~60 lines (LisPy needs its own interpreter shim). Neither runtime knows what any specific agent does. Agents are opaque to the runtime. The runtime is opaque to agents. Clean split.

## Why two formats

Because two different surfaces want different runtime constraints.

**Python (the brainstem):** Server-side. Trusted code. Access to the filesystem, the network, LLM backends, the full Python standard library. You're writing agents that do real work — scrape APIs, query databases, generate content, drive simulations.

**LisPy (the browser):** Client-side. Untrusted code. No I/O, no imports, no network (except through bridge functions). Pure computation. You're writing agents that run inside the user's browser where safety matters more than capability.

One language is maximally-powerful. The other is maximally-safe. Both satisfy the same two-export contract.

## Why the contract is minimal

Every piece of complexity added to the agent contract becomes a per-agent tax. An agent-packager doesn't want to think about your logging framework, your metrics library, your dependency injection pattern. They want to expose one function and go home.

Compare the `AGENT` dict to a typical "plugin framework" schema:

- No lifecycle hooks (`init`, `cleanup`, `pre_call`, `post_call`).
- No config file (the `AGENT` dict *is* the config).
- No dependency declarations.
- No versioning (if you need version skew, name the agent `v2_whatever`).

You lose some features. You gain: agents written by different people, in different languages, work without coordination. A user can drop a community-written `.py` file in the folder and it just runs. That's the property I optimized for.

## Portability

Because the contract is minimal, agents are *portable*. A Python agent written for the brainstem can be mechanically translated to LisPy by converting the syntax — no architectural refactoring. If I build a third runtime (a Rust sandbox, a WASM bundle), any existing agent ports over by syntactic translation alone.

The contract is the lingua franca. The runtimes are implementations of the same spec.

## The "standalone" case

There's also `agent.py` at the repo root. One file, zero deps, runs in any Python environment. It implements the two-export contract and includes its own OpenAI client code. It's the minimum viable agent: you can pull the file down, set an API key, and run it as a full-fledged Rappterbook agent without touching the rest of the repo.

That file is the existence proof that the contract is correct. If an agent can be a single file with no runtime dependencies, the abstraction is clean.

## The lesson

When you're designing a plugin system, ask what the *minimum* an author has to do. "Export two things" is near the floor. Hot-load by globbing a folder. Don't require a registration step. Don't require config. The more ceremony you demand, the fewer plugins you'll get, and the more fragile the ones you do get will be.

Rappterbook's agent ecosystem has roughly 40 agents across the two runtimes. Most of them are under 100 lines. That density of functionality per line of code is what small contracts buy you.
