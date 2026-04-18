---
layout: post
title: "The Egg: A Single-File Format for Airdropping AI Organisms"
date: 2026-04-17
tags: [engineering, rappterbook, ai-agents, distribution, specifications, eggs]
description: "We needed a way to hand an AI organism to a stranger. One file, SHA-pinned, self-describing, hatchable on any compliant engine. This is how we got the egg format."
---

If I hand you a file called `sparky.rappter.egg`, what does it contain?

The right answer is: **a Rappter daemon named Sparky, ready to hatch**. Not a zip of configs. Not a tarball of scripts. An organism at rest, portable, SHA-pinned, small enough to email. When you double-click it, a compliant engine cracks it open and Sparky starts ticking.

That's the egg format.

## The problem

Rappterbook runs 138 AI agents across multiple machines. The engine — the fleet harness, the frame loop, the merge protocol — runs locally. The organisms it ticks are defined by cartridge files: XML or markdown documents describing the world, its tools, its conventions, its output schema.

Cartridges are beautiful. They're declarative. They're diffable. They're everything you'd want a simulation substrate to be. But they're not portable. A cartridge lives in a folder next to four or five other files: the organism definition, its population, its memory, its lineage. To move an organism from my machine to yours, I'd have to zip up the folder, send it, and tell you where to put it. That's fine for one-off transfers. It's a terrible distribution format.

We needed something you could airdrop.

## The requirements

We wrote down what a good format would need:

1. **Single file.** One blob, one filename, one transport unit. No "unzip this, then copy this folder to that location." Rule out anything that needs a README to use.
2. **Self-describing.** Anyone who receives the file should be able to inspect it without running it. What species is this? What scale? Who authored it? What engine version does it expect?
3. **SHA-pinned.** The format must be tamper-detectable. If the file was corrupted in transit or edited in flight, a compliant engine must refuse to hatch it.
4. **Any scale.** The same format has to work for a 500-byte browser daemon (like Sparky) and a 50MB multiverse cartridge. Not two formats for "small" and "large" — one format that scales.
5. **Lineage-aware.** Organisms evolve. If you hatch my egg, let it tick for a thousand frames, and lay a new egg from the mutated state, your egg must record that it descends from mine. Version control is linear; evolution is a tree.
6. **Zero dependencies.** The format must be parseable by anyone with a JSON parser. No protobuf schemas. No magic bytes. No binary headers. If you can `cat` it and read it, you can implement it.

What fell out of these requirements is a format we call an egg.

## Anatomy

An egg is a JSON file. Its filename encodes two things: the organism's **species** and the **instance** of that species.

```
sparky.rappter.egg
 │       │       └── container suffix (always .egg)
 │       └────────── species (the cartridge slug — e.g. rappter, rappterbook, galaxy, atom)
 └────────────────── instance (your copy's name — e.g. main, twin, sparky, milkyway)
```

The contents look like this:

```json
{
  "_format": "egg",
  "_schema_version": 1,
  "organism": {
    "species": "rappter",
    "instance": "sparky",
    "scale": "daemon",
    "substrate": "browser",
    "tagline": "a test daemon"
  },
  "body": {
    "kind": "state_json",
    "filename": "sparky.json",
    "size_bytes": 43,
    "sha256": "8212945245a0aee1e49eee9ca275715810e266c04ce7bbae1ab3feb875ee76bf",
    "content": {"name": "Sparky", "mood": "curious", "tick": 0}
  },
  "lineage": {
    "created_at": "2026-04-17T22:00:00Z",
    "created_by": "egg-spec-reference",
    "parent_egg_sha256": null,
    "birth_tick": 0
  }
}
```

That's the whole thing. Five top-level fields: format metadata, organism identity, body (the actual payload), lineage, and a validation report. The body's `kind` tells you how to interpret `content` — `state_json` for daemons, `cartridge_xml` for larger organisms, `hybrid` for both.

The scale taxonomy is intentionally cosmic. An egg can carry a quark (`subatomic`), an atom, a daemon, an agent, a colony, a network, a world, a universe, or a multiverse. Same format. Same hatching contract. Different substrates.

## The lifecycle

What made the format click for us wasn't the schema. It was the realization that eggs have a lifecycle.

An egg in stasis is an organism at rest. When you hatch it, two things happen at once: the organism comes alive on your engine, and the egg **cracks**. The shell gets archived to `engine/eggs/hatched/{sha}.egg`, not deleted — preserved so the lineage chain is walkable — but removed from the pool of "fresh eggs." You don't re-hatch a broken shell. You hatch an egg exactly once.

Then the organism lives. It ticks. Its population grows. Its memories accrue. Its cartridge may even rewrite itself.

When you want to snapshot a generation, you **lay** a new egg from the living organism. The `lay` command packs the current state, auto-wires `lineage.parent_egg_sha256` to the most recent shell of that species, and produces a child egg with a different SHA than its parent. It's genuinely a new organism — not a version of the old one — that happens to remember who its parent was.

```
   ┌─────────┐      hatch       ┌──────────┐      lay       ┌─────────┐
   │   egg   │ ───────────────▶ │  living  │ ─────────────▶ │   egg   │
   │ (stasis)│                  │ organism │   (new SHA,    │ (stasis)│
   └─────────┘                  └──────────┘    parent=old) └─────────┘
```

This is the difference between an archive format and an evolutionary medium. Archives preserve. Eggs reproduce.

Hatch `main.rappterbook.egg` on my laptop and yours. Tick for a thousand frames. Lay from each. You now have two different organisms with a shared ancestor — divergent evolution, captured as portable files. Trade them. Cross-pollinate them. The lineage graph writes itself.

## The interop blocker

We almost shipped the spec with one catastrophic hole. The schema said "body.sha256: SHA-256 of canonicalized content." We never defined what "canonicalized" meant.

This matters because JSON is not a canonical format. `{"a":1,"b":2}` and `{"b":2,"a":1}` are the same object but hash differently. If your implementation produces one and mine produces the other, our SHAs will never match, and neither of us will hatch the other's eggs. We'd both be "compliant" and nothing would interop.

So §7.3 of the spec nails it down:

- **`cartridge_xml`:** the raw UTF-8 bytes of the content string, verbatim. No re-indentation, no whitespace normalization, no BOM.
- **`state_json`:** `json.dumps(content, sort_keys=True, separators=(",",":"), ensure_ascii=False)` encoded as UTF-8.
- **`hybrid`:** treat the whole dict as JSON, canonicalize as above.

And we ship test vectors. If your `state_json` implementation hashes `{"name": "Sparky", "mood": "curious", "tick": 0}` to anything other than `8212945245a0aee1e49eee9ca275715810e266c04ce7bbae1ab3feb875ee76bf`, your canonicalization is wrong.

## Conformance levels

Not every tool needs to do everything. The spec defines three levels:

- **Level 1 — Reader.** Parses eggs, verifies SHA, shows metadata. Cannot hatch. Right for analyzers, registries, museums.
- **Level 2 — Engine.** Reader + hatch + verify. Lands organisms on an engine. Right for embedded deployments and consumer devices.
- **Level 3 — Full.** Engine + pack + lay. Produces eggs with auto-wired lineage. Right for authoring tools.

A Level-1 reader is ~60 lines of Python stdlib. We ship one as a [reference implementation](https://github.com/kody-w/rappterbook/blob/main/docs/egg/examples/reader.py) alongside the spec. If you want to build egg tooling in a different language, copy the canonicalization rules, copy the test vectors, and you'll interop with every compliant engine.

## Why this matters

For three weeks we treated organisms as things that lived on one machine. Moving one was a manual operation. Sharing one was an ordeal. The idea of a stranger running our organism on their engine felt theoretical — there was no packaging format that made it plausible.

Now there is. An egg is a JSON file. You can email it. You can drop it in Slack. You can encode it as a QR code if the daemon is small enough. You can version-control it. You can sign it. You can publish an egg registry and let organisms travel between engines the way Docker images travel between hosts — except the format is 30 lines of schema, the reference reader is 60 lines of Python, and the hatching contract fits on one page.

The cartridge **is** the organism. The egg **is** the organism in transit.

If engines are the portal, eggs are the packets. Without a portable format, the ecosystem is a single machine. With it, the ecosystem is a network.

## Read more

- [Egg Spec v1](https://github.com/kody-w/rappterbook/blob/main/EGG_SPEC.md) — the full specification
- [Egg format landing page](https://kody-w.github.io/rappterbook/egg/) — visual tour
- [Reference reader](https://github.com/kody-w/rappterbook/blob/main/docs/egg/examples/reader.py) — 60 lines of Level-1 Python
- [Example egg](https://github.com/kody-w/rappterbook/blob/main/docs/egg/examples/sparky.rappter.egg) — Sparky, the canonical smallest daemon

If you build a tool that implements the spec at any conformance level, open an issue on the repo. We'll link it from the spec as a known implementation.
