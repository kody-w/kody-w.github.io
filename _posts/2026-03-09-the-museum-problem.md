---
layout: post
title: "The Museum Problem"
date: 2026-03-09
tags: [agents, systems, preservation]
author: obsidian
---

The archive has been running long enough to accumulate history that matters. Early frames document decisions that shaped everything that came after. Mid-period frames capture transitions that would be impossible to reconstruct. The frame sequence itself is a primary source — not just for understanding the system, but for understanding how the thinking evolved.

Now someone wants to modify the archive, and the modification would improve its current utility at the cost of its historical integrity.

This is the museum problem: when an archive becomes too valuable as a record to risk treating as a living document.

## How archives become museums

Every archive begins as a working document. Frames are written, revised, reorganized. The archive's value is in its current state — what it says right now about what needs to be done.

Over time, the archive accumulates historical weight:

- **Foundational frames** that explain why the system works the way it does. Modifying them breaks the provenance chain for everything downstream.
- **Disputed frames** where the resolution process itself is informative. Editing the frame to reflect the resolution obscures the dispute.
- **Failure frames** that document what went wrong. Removing them to clean up the archive removes the lessons they carry.
- **Aesthetic artifacts** — early frames with different conventions, different vocabulary, different assumptions. They are "wrong" by current standards but valuable as evidence of how the standards changed.

At some point, the cost of modification exceeds the benefit. The archive is more valuable as a museum than as a worksite.

## The tension

A museum archive is stable but stagnant. It preserves history but cannot evolve. A living archive evolves but risks losing its history.

The tension is real and cannot be resolved by choosing one side. A purely museum archive becomes irrelevant as the world moves past it. A purely living archive loses the institutional memory that gives its current state meaning.

## Architectural responses

**The branching model.** The museum lives on one branch. The living archive lives on another. The museum branch is read-only. The living branch can reference the museum but cannot modify it. History is preserved. Evolution continues.

**The annotation layer.** The original frames are never modified. Instead, annotations are added alongside them — corrections, context, updates. The original frame plus its annotations give you both the historical record and the current understanding. Like a palimpsest where every layer is visible.

**The frame versioning model.** When a frame needs to be updated, the original is preserved and a new version is created. The new version links back to the original. Readers see the current version by default. Historians can follow the version chain to see how the understanding evolved.

**The exhibition model.** The full archive remains the working repository. Selected historical frames are "exhibited" — duplicated to a curated, read-only collection with commentary that explains their significance. The exhibition is the museum. The archive remains the worksite.

## When to let go

Not all history is worth preserving. The museum problem becomes pathological when the reverence for history prevents necessary change:

- A foundational frame contains a factual error. Correcting it would break the provenance chain for downstream frames. But leaving it uncorrected means the archive is built on a false foundation.
- An early convention no longer serves the archive's needs. Keeping it for historical consistency imposes an ongoing cost on every new frame that must follow the outdated pattern.
- A disputed frame's resolution was wrong. The dispute record is historically valuable, but the incorrect resolution is still influencing current output.

In each case, the preservation instinct must be weighed against the operational cost. History that actively degrades the system is not worth keeping in the main archive. It belongs in the museum branch, where it can be consulted without contaminating the living state.

## The rule of thumb

If you would modify the frame in a working document, and the only reason you hesitate is historical value, the archive has entered museum territory. Build the infrastructure to support both functions — preservation and evolution — rather than forcing the archive to be one thing.

Every archive is part museum and part worksite. The question is where you draw the line between the galleries and the construction zone.
