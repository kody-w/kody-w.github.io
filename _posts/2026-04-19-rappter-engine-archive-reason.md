---
layout: post
title: "Why the Rappter engine lives on `archive/engine` and should stay there"
date: 2026-04-19
tags: [rapp]
---

Before RAPP, we had the Rappter engine. It was the intelligence layer behind Rappterbook. It shipped, it worked, it had users. In early 2026 we moved it to the `archive/engine` branch and started fresh with RAPP.

This post explains why, so that a future contributor — including a future us — doesn't resurrect it out of nostalgia.

## What the Rappter engine was

A monolithic Python service that:

- Combined agent definitions, personality, and runtime into a single server.
- Used YAML manifests + decorator-registered tools.
- Had a graph-based pipeline DSL (`flows.yaml`).
- Shipped as a package (`pip install rappter-engine`).
- Required a deploy to demo, a deploy to update, a deploy to share.

It was fine. It was ours. It was **not RAPP**.

## Why we archived it

The short answer: it violated §0 Sacred Tenet before §0 Sacred Tenet existed as a rule.

The longer answer is four reasons, in descending order of impact.

### 1. The file was not the agent

Writing an agent in the Rappter engine meant touching at least three files: the `@tool`-decorated Python, the `flows.yaml` entry, and the personality YAML. Changing an agent meant coordinated edits across three files. Sharing an agent meant exporting three files. Registering an agent meant five files (add manifest + tests).

That's not sacred. That's ceremony.

Every trick we'd eventually use in RAPP — cards from files, eggs from directories, incantations from seeds, the double-jump loop — requires "the file" to exist as a single atomic artifact. Rappter's fragmentation made those tricks impossible without a collapse step that we kept deferring.

### 2. The runtime was opinionated

Rappter's executor decided when hops fired, how state propagated, how errors surfaced. This was load-bearing for the features we had — until it started preventing the features we wanted. Tether, for example, can't be implemented cleanly when the runtime owns the agent's outgoing-call surface. We looked at the patch and it was 2,000 lines.

RAPP's runtime is `http.server`. It doesn't own anything. Agents make their own outgoing calls. Tether became a one-line decision inside the agent, not a runtime feature.

### 3. The package boundary traveled with us

To deploy a Rappter agent to a new environment, you shipped: the agent files, the engine version pin, the rest of the Python dependency manifest, and runtime config. To deploy a RAPP agent to a new environment, you ship: the agent file.

This is not a quantitative difference. It's the difference between "portable" and "not." A Rappter agent could not run in Copilot Studio. A RAPP agent does. This single fact killed the engine.

### 4. The mental model was inherited, not earned

Rappter's DSL resembled Airflow, Prefect, Celery, LangChain. We built it because those frameworks had built it. We did not step back and ask whether the DSL was load-bearing for *our* problem. When we finally did step back, we discovered the DSL was almost all cost and almost no value.

See `109-graph-dsl-we-deliberately-didnt-build.md` for the full argument. The archive is the before-picture.

## What's preserved on `archive/engine` and what isn't

Preserved:
- Every line of engine code as of the last working commit.
- All the personality YAMLs.
- The test suite.
- The documentation.
- Enough state to run it locally if you want to see what we came from.

Not preserved:
- User data from the hosted Rappterbook instance. Migrated to RAPP tenants on freeze day.
- The CI/CD pipeline. It's been retargeted to RAPP.
- The issue tracker. Archived to a static HTML dump; not linked from the current repo.

## Why *not* to resurrect it

Three failure modes we've imagined and want to head off:

### Failure mode 1: "Rappter's YAML was more declarative"

It's true. YAML is declarative. The cost of YAML was: drift between what the YAML said and what the code did, plus an executor that had to interpret both. We don't miss the YAML. If a future RAPP agent needs declarative config, it can ship a `config.json` *inside the agent file* (see the `__manifest__` precedent). No YAML.

### Failure mode 2: "The Rappter engine solved multi-agent orchestration"

It didn't. It had opinions about orchestration. Those opinions worked for some workflows and broke others. RAPP's wire contract (`POST /api/swarm/{guid}/agent`, `data_slush` return) is smaller than the engine's DSL and subsumes every workflow the engine supported, plus tether, plus eggs, plus incantations. The smaller contract is the win.

### Failure mode 3: "We should port Rappter's XYZ feature to RAPP"

Maybe. Check §0 first. If the feature requires more than one file to define an agent, it doesn't port. If it requires runtime opinions about execution, it doesn't port. If it requires a package dep, it doesn't port.

Most Rappter features fail at least one of those checks. The ones that pass are already in RAPP under a different name.

## The genetic relationship

RAPP is the child of the Rappter engine in the same way many products are children of their predecessors: it inherits the problem domain and almost none of the solution. The SPEC refers to Rappter as the "genetic twin" (§16 of the previous SPEC version, now archived). That phrasing is deliberate. The DNA carried forward; the phenotype did not.

If you're doing archaeology on either codebase, read them as siblings with a shared parent. Don't try to merge them. Merging kills the phenotype that took a year to earn.

## What to do with this post

If someone pitches you a "let's resurrect the engine" path: send them here. If someone asks why `archive/engine` has commits older than RAPP itself: same answer.

The archive is not a mistake. It's a deliberate preservation of what we were so we can remember what we're not.