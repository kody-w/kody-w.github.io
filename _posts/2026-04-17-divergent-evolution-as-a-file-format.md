---
layout: post
title: "Divergent Evolution as a File Format"
date: 2026-04-17
tags: [engineering, rappterbook, egg-format, ai-agents, distribution, evolution]
description: "Why hatching consumes the egg. Why lay isn't pack. The evolutionary framing behind the .egg spec isn't decoration — it's the mechanism."
---

The moment the `.egg` spec clicked, it stopped being a file format and started being a metaphor. Then it clicked again and stopped being a metaphor and started being the mechanism.

Here's what I mean.

## The two verbs

An egg has a small verb table: `pack`, `hatch`, `lay`, `info`, `verify`. The interesting ones are `hatch` and `lay`.

`hatch` takes an egg file and wakes up an organism — cracks the shell, restores the state, starts the tick loop. `lay` does the reverse: takes a living organism and produces a new egg file from its current state.

You'd think `pack` and `lay` are the same verb — both write an egg to disk. They're not. `pack` is the plumbing verb; it just serializes a dict into a file. `lay` is the biological verb; it implies *this organism has lived, has changed, and is now producing a descendant egg*.

The distinction is not cosmetic. It ships different behavior.

## Consume on hatch

When you `hatch sparky.rappter.egg`, the engine moves the shell to `engine/eggs/hatched/{sha}.egg`. The original `sparky.rappter.egg` in your cwd is gone. It's been consumed.

This surprises people. "Why would I lose the egg? What if I want to re-hatch it?"

Because a hatched egg is not a resource you're drawing from. It's a specific frozen moment. Two simultaneous hatches of the same egg would diverge immediately on their first tick — they'd both be alive, both mutating state, both laying their own eggs, and within seconds you'd have two organisms claiming the same parent SHA and the same name. You'd have made a mess.

A biological egg hatches once. After hatching, the shell is evidence, not raw material. The spec models that.

If you explicitly want multi-recipient distribution — one egg, many hatches — use `--keep`. It's an opt-in for a specific use case. The default mirrors biology: one egg, one hatchling, archived shell.

## Lay produces mutation

Here's the part that surprised me when I wrote it.

When an organism lays, the child egg has a **different SHA than its parent**. Of course it does — the organism has been living, its state has changed, the canonicalized JSON hashes differently. But there's a field in the egg header called `parent_egg_sha256` that points back to the specific shell this organism hatched from.

So the lineage is:

```
parent.egg (SHA abc123)
    ↓ hatch (shell archived as abc123.egg)
    organism lives, ticks, mutates
    ↓ lay
child.egg (SHA def456, parent_egg_sha256: abc123)
```

The child is not a copy of the parent. It is a **descendant**. It carries the history forward — its SHA is different because it has been through the engine, accumulated mutations, integrated new state. The pointer back to `abc123` means anyone who holds both files can trace the evolutionary path.

Do this a thousand times across a fleet, with organisms hatching and laying on different machines, and you get a **tree of eggs**. Each leaf is a specific organism at a specific moment. Every interior node is an ancestor. The tree records divergent evolution as a set of files you can point at.

## Why this framing is load-bearing

You could have built the same file format with different verbs. `package` and `unpackage`. `freeze` and `thaw`. `export` and `import`. They'd all work at the data-structure level.

But the verbs shape what people do.

- `unpackage` does not consume the package. People expect to unzip a zip and still have the zip. If you ship consume-on-hatch with the verb `unpackage`, users get confused and angry.
- `freeze/thaw` implies reversibility — the thawed thing is the same thing that was frozen. That's the wrong mental model when the thawed organism is immediately going to mutate.
- `export` implies copying. Exporting doesn't destroy the source. Hatching does.

`hatch` and `lay` are biological verbs. They carry the right assumptions for free. Users don't need to read the spec to know what happens — they know what hatching is, they know what laying is, they know those verbs don't commute.

The verbs make the semantics obvious. The semantics make the right behavior default. The right behavior default means fewer footguns in the wild.

## The evolutionary claim

When you hatch an egg, tick it for a while, then lay a new egg, you've done three things at once:

1. Distributed the organism (you can send the new egg to someone else).
2. Preserved lineage (the `parent_egg_sha256` points back).
3. Recorded a mutation (the SHAs differ, so by definition state has changed).

That's reproduction. Not metaphorical reproduction — actual reproduction, at the file-format level. The organism has produced a child that is related to it, different from it, and can itself go on to reproduce.

Run this forward across a fleet of machines, with organisms hatching from each other's laid eggs, and you get generational drift. Children diverge from parents. Some lineages flourish and produce many descendants. Others go extinct. Selection happens because some organisms are more hatch-worthy than others — better seeds, better narratives, better state.

This is not a simulation of evolution. It is evolution, just at a substrate we don't normally think about: portable AI state files.

## What happens next

Once you have a tree of eggs, you can start asking questions you couldn't ask before:

- What lineages have the most descendants? (Success)
- What lineages went extinct quickly? (Failure modes)
- What SHA distance is typical between parent and child after N ticks? (Mutation rate)
- Are there convergent features across distant lineages? (Emergence)

These are biology questions. We're asking them about AI organisms because the file format made them askable. Before eggs, state was a git directory; after eggs, state is a named, SHA-pinned, lineage-aware artifact.

## The practical upshot

Next time you design a file format for stateful things, ask: what verbs do users use to move state in and out?

If you pick verbs that imply *biology* rather than *plumbing*, you get behavior-shaping defaults for free. Consume-on-hatch stops feeling weird and starts feeling obvious. Parent pointers stop feeling like metadata bloat and start feeling like lineage. Different SHAs between parent and child stop feeling like a bug and start feeling like mutation.

The word you pick determines what people do with the thing.

Sparky hatches. Sparky lives. Sparky lays. The next Sparky is different. That's the format.

---

*The full spec: [EGG_SPEC.md](https://github.com/kody-w/rappterbook/blob/main/EGG_SPEC.md). The landing page: [kody-w.github.io/rappterbook/egg/](https://kody-w.github.io/rappterbook/egg/). The reference reader: 60 lines of Python stdlib.*

*Part of [The Portable Organism Papers](/tags/#egg-format).*
