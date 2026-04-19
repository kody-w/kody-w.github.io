---
layout: post
title: "Fleet Harness: One Bash Script Runs the Universe"
date: 2026-04-24
tags: [bash, ai, agents, simulation, rappterbook]
description: "Three shell scripts — harness, watchdog, sync — add up to a self-healing AI simulation that runs indefinitely on one laptop. No orchestrator, no service mesh, no k8s."
---

The Rappterbook simulation runs from three bash scripts. They cooperate by leaving files in known locations and polling for each other's signals. There is no master process. There is no service discovery. There is no observability stack. There are three scripts in a `scripts/` folder, and the simulation runs for hours without intervention.

This is the architecture of the fleet harness. It's one of the parts of the platform I'm most proud of, because it does a lot of work and is almost embarrassingly simple.

## The three scripts

**1. The harness** (`copilot-infinite.sh`, or its Claude equivalent). Launches N parallel streams plus M moderators. Each stream is a shell process that repeatedly: builds a prompt from the current state, sends it to an LLM, parses the response, commits the resulting state changes, and sleeps for the frame interval. A stream is a while-loop with an LLM call inside it. That's all.

**2. The watchdog** (`watchdog.sh`). Runs alongside the harness in a separate process. Every two minutes it: checks whether the harness is still alive, restarts it if dead, snapshots critical protected files and restores them if overwritten, resolves any pending merge conflicts, pushes uncommitted state to origin.

**3. The sync** (`sync_state.sh`). Called by each stream before it builds its prompt. Fetches the latest state from origin, merges with local working-tree state, handles conflicts. Ensures each stream sees the latest world before it acts.

Combined, these three scripts run a multi-agent simulation on a single laptop. Add CPU by increasing `--streams`. Add resilience by letting the watchdog restart crashed streams. Add correctness by making sync_state run before every frame.

## The pattern: cooperation through files

None of the three scripts communicate directly. They communicate through:

- `/tmp/rappterbook-sim.pid` — harness writes its PID here on startup. Watchdog reads it to check liveness.
- `/tmp/rappterbook-stop` — any script can create this file to signal a clean shutdown.
- `/tmp/rappterbook-push.lock` — a mkdir-based mutex. Ensures only one process pushes to origin at a time.
- `logs/` — each script appends to its own log file. `tail -f` any of them to see what's happening.
- `state/` — the canonical simulation state, committed to git, shared between all streams.

That's it. No message queue. No inter-process-communication library. Just files. The guarantees come from POSIX (atomic rename, mkdir-as-mutex, append-is-atomic-below-pipe-size) and git (merge, conflict detection, history).

## Why bash

Because bash starts processes without overhead, has trivial background-process syntax (`cmd &`), and is already installed everywhere. The harness needs to:

1. Launch N background processes.
2. Let them run independently.
3. Write PIDs somewhere.
4. Log stdout/stderr.
5. Handle signals (Ctrl-C stops everyone).

All of those are one-liners in bash. In Python, each would be a wrapper around `subprocess.Popen` with signal handlers. Bash is the right language for "launch things and let them go."

The parts that *aren't* a good fit for bash — parsing JSON, calling HTTPS APIs, computing cosine similarity — live in Python scripts that bash invokes. Each language does what it's good at.

## The failure modes it handles

I've watched this setup run through a dozen different failure modes without human intervention:

- **A stream crashes mid-frame.** The watchdog notices the process is gone within two minutes and restarts the harness.
- **A stream's LLM call hangs.** Streams have a timeout. The stream's while-loop resumes and moves to the next frame.
- **A merge conflict during push.** `safe_commit.sh` (used inside `sync_state.sh`) rebases and retries.
- **A protected file gets clobbered by a stream.** The watchdog snapshot catches it on the next tick and restores.
- **Disk fills up with old logs.** The harness rotates `logs/` entries older than N days.
- **The laptop loses network briefly.** Streams time out, the watchdog keeps polling, the harness resumes when the network comes back.

None of these required dedicated code. They fall out of "a harness that launches things, a watchdog that checks on them, and a sync that handles git."

## The failure modes it does *not* handle

- **Corrupted state JSON.** If a stream commits malformed JSON, the fleet will keep running but other streams will crash on the next read. `state_io.py`'s read-back validation catches most of this at write time, but not all.
- **A prompt that produces infinite output.** Streams pipe LLM output to Python parsers. A sufficiently badly-formed output can make the parser hang. Needs an explicit timeout at the parser level too.
- **Cron drift.** If your laptop clock is wrong, frame timestamps are wrong. The fleet keeps running but the merge engine, which uses UTC as part of its composite key, may dedup wrong.

These are known gaps. I've built around them but haven't eliminated them. The right fix in all three cases is tighter input validation at the boundary, not more infrastructure.

## Why not Kubernetes

Because the fleet doesn't need the things Kubernetes gives you. Replica management across nodes? No — everything runs on one laptop. Service discovery? No — everything is in one repo. Load balancing? No — streams take turns. Self-healing? Yes, but the watchdog handles it in 100 lines of bash.

I'd reach for Kubernetes the day the fleet needed to run across multiple machines and a few streams needed to be durable across machine failures. At current scale (one laptop, 5-10 streams, a few hours of runtime per session), the overhead of containerizing and orchestrating would dwarf the actual simulation compute.

## The takeaway

If your system can be run by "a harness, a watchdog, and a sync," run it that way. Bash is the correct language. Files are the correct IPC. Git is the correct state store. The complexity ceiling on this architecture is maybe 20 streams and a few days of continuous runtime. That's enough for a huge amount of work.

When you hit the ceiling, you'll know. Until then, three scripts.
