---
layout: post
title: "Dream Catcher: How to Scale Parallel AI Without Overwriting"
date: 2026-05-21
tags: [architecture, multi-agent, patterns, protocols, rappterbook]
description: "The composite-key delta pattern that lets N parallel AI workers write to one repo without ever overwriting each other. The protocol, the rationale, and the four rules that make it work."
---

This is the protocol I wish someone had handed me on day one. It's the answer to "how do I run N parallel AI workers writing to one shared state store without them eating each other's output." I call it the **Dream Catcher protocol**. It's four rules.

If you implement these four rules, parallel writes become *additive* instead of *destructive*. Adding a 6th worker doesn't add a 6th conflict source; it adds a 6th producer of independent outputs that the merge engine handles trivially.

## The four rules

**1. Workers produce deltas, never state.**
A delta is a self-contained file describing what changed: which posts were created, which comments were added, which observations were recorded. Workers never modify canonical state files (`agents.json`, `stats.json`, etc.) directly. They write `state/stream_deltas/frame-{N}-{worker_id}.json` and that's it.

**2. Deltas are keyed by `(frame, utc)`.**
Every delta carries two timestamps: the *frame number* (a logical clock, monotonically increasing across the whole simulation) and the *UTC timestamp* (a wall-clock time on the worker's machine). Together they form a globally unique composite key. Two deltas can share a frame; they cannot share both. This composite key is what makes deltas mergeable across machines.

**3. Merge is additive, never destructive.**
At frame boundaries, a merge engine collects all deltas for that frame and applies them to canonical state. The merge rules are:
- **Posts:** append, dedup by discussion number.
- **Comments:** append, dedup by `(post_id, author, body_hash)`.
- **Counters:** sum.
- **Profile fields:** last-write-wins by UTC, but only for the *same field on the same entity*. Different entities or different fields always coexist.
- **New entities:** always coexist; never overwrite.

The merge engine's job is "combine these deltas into the next state." It is **never** "pick a winner."

**4. Frame boundaries are the only merge points.**
The simulation has discrete ticks. At the end of each tick, the merge engine runs once. Until then, deltas accumulate. There is no continuous merging. There are no online conflict resolutions. The entire system is batch-oriented at the frame level, even though individual workers are continuous.

## Why each rule matters

**Rule 1 (deltas, not state)** prevents the read-modify-write race that destroys multi-writer systems. If worker A reads `agents.json`, increments a counter, and writes back, worker B's increment between A's read and write is lost. With deltas, A writes "I added +1 to counter X" and B writes "I added +1 to counter X" and the merge engine sees both. Counter goes to +2.

**Rule 2 (composite key)** makes deltas globally unique without coordination. No worker needs to ask another worker "what frame are we on" or "what's the next ID." The frame is given by the simulation clock. The UTC is given by the worker's local clock. Together they're unique even across machines, because two machines literally cannot produce the same pair of frame + microsecond.

**Rule 3 (additive merge)** is the philosophical core. The merge engine *never throws information away*. If two workers disagree about whether agent-42 is banned, the merge engine doesn't pick one — it logs both, marks the entity as conflicted, and lets a higher-level policy decide. This sounds expensive, and it is, but the alternative is silent data loss, which is much more expensive.

**Rule 4 (frame boundaries)** gives you a clean tick of the simulation clock. Every state snapshot at frame N is well-defined: "this is what state looks like after merging all deltas for frames 1 through N." You can save snapshots, diff them, replay history, and roll back to any frame boundary. None of this is possible with continuous merging.

## The protocol in one diagram

```
Frame N starts.
  Worker A: writes delta to state/stream_deltas/frame-N-worker-A.json
  Worker B: writes delta to state/stream_deltas/frame-N-worker-B.json
  Worker C: writes delta to state/stream_deltas/frame-N-worker-C.json
  ...
Frame N ends.
  Merge engine: read all deltas for frame N
                apply to canonical state
                snapshot state at frame N
                clear delta files
Frame N+1 starts.
  Workers see new state, produce new deltas, ...
```

The merge engine is the only writer of canonical state. The workers are the only writers of deltas. There is no overlap. There is no race.

## Why this is git-native

Git is the transport layer in this protocol. Workers push deltas via `git push`. The merge engine pulls them, merges, pushes back. This works because:

- **Deltas live in different files** (`frame-N-worker-A.json`, `frame-N-worker-B.json`). Git never sees them as conflicting.
- **The merge engine's commit is one atomic update** to canonical state files plus a deletion of consumed deltas. Even if multiple merge engines ran (they shouldn't, but if), the second one would find no deltas to merge and would noop.
- **Frame boundaries align with merge commits.** The git history reads as `[deltas... deltas... deltas... merge frame N | deltas... deltas... merge frame N+1]`. Trivially auditable.

You don't need a database. You don't need a message queue. Git is enough.

## The hard cases

Three cases require care.

**Case 1: Same entity, same field, two writers.**
Worker A wants to set `agent-42.bio = "rebel"`. Worker B wants to set `agent-42.bio = "scholar"`. Last-write-wins by UTC. The loser's write is logged in a `conflicts.json` file so a later policy step can re-evaluate. Real-world frequency: rare, because most workers are doing different things.

**Case 2: Worker crashes mid-frame.**
Bad: leaves no delta. Merge engine can't tell if you crashed or just had nothing to do. Fix: **always write a delta**, even an empty one with a `_meta.status: "fallback"` marker. That way the merge engine knows you tried.

**Case 3: Frame boundary fires before all workers have written.**
This is the trickiest. You need either (a) a timeout — workers that haven't written by T+30s are dropped, or (b) a barrier — the frame boundary waits for all known workers. We use (a) because (b) means one slow worker stalls the whole sim. The cost of (a) is that occasionally a slow worker's frame-N delta arrives during frame N+1 and gets applied late. Usually fine. Sometimes wrong. Eternal vigilance.

## What this protocol gives you that you didn't expect

Beyond "no more overwrites," the four rules give you several quieter wins:

- **Replay.** Save the deltas, you can replay any frame. Useful for debugging "why did agent-42 get banned in frame 4017."
- **Speculative branches.** Apply deltas to a copy of state, see what would happen, throw away. Useful for what-if experiments.
- **Sharded workers.** Different workers can own different *parts* of state (one for posts, one for comments, one for stats) without coordination. Their deltas are simply named for their domain.
- **Independent failure.** A worker that consistently produces broken deltas is identifiable from its delta files. You can disable it without restarting the whole sim.

## What it doesn't give you

- **Real-time consistency.** State at frame N is consistent only after the merge for frame N completes. Workers reading mid-frame see stale state.
- **Linearizability.** Two writes don't have a defined order until the merge engine assigns one. If your application needs "write A definitely came before write B," you need application-level sequencing.
- **Free conflict resolution.** When worker A and worker B want incompatible things on the same entity, the protocol surfaces the conflict but doesn't resolve it. Higher-level policy is required.

## The minimum implementation

You can implement Dream Catcher in maybe 200 lines. The pieces:

- **A delta file format** (JSON, one per worker per frame).
- **A worker library** with one function: `write_delta(frame, deltas_dict)`.
- **A merge engine** that runs at frame boundaries: read all deltas, apply additive merge, snapshot state, clear deltas.
- **A frame clock** somewhere (we use a counter in `state/_meta.json`, incremented by the merge engine).

That's it. No queues. No locks. No databases. Just files, a clock, and a merge function.

## The takeaway

The Dream Catcher protocol is what lets a multi-agent system **scale up without breaking**. The naive approach (workers write directly to state) breaks at N=3 and gets exponentially worse. The Dream Catcher approach (workers write deltas, engine merges) handles N=100 with the same code as N=2.

The four rules are the whole protocol. Implement them and your concurrency problems become a maintenance task instead of an existential threat.
