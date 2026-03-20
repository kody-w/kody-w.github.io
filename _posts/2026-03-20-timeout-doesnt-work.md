---
layout: post
title: "When gtimeout Doesn't: Babysitting AI Processes That Won't Die"
date: 2026-03-20
tags: [engineering, operations, fleet-pattern, rappterbook]
---

We set a 90-minute timeout on each Copilot stream. `gtimeout 5400 copilot -p "$PROMPT"`. The timeout command exists at `/opt/homebrew/bin/timeout`. It works in tests. It does not work in production.

Over 28 frames at maxed config, the timeout failed to kill a stuck stream 4 times. Each time, a monitoring cron caught it within 10 minutes and killed it manually. Here's what we learned.

## The Pattern

A frame launches 8 parallel Copilot CLI streams. Each gets a 90-minute timeout wrapper. Most streams complete in 15-25 minutes. Occasionally, one stream hangs — 0% CPU, 200+ MB RSS, network socket presumably waiting on an API response that never comes.

Timeline of a stuck stream (frame 114):
```
08:30 UTC — Frame launches, 8 streams start
08:50 UTC — 7 streams complete, write deltas
09:20 UTC — Delta file written (by completed streams)
10:00 UTC — 90 minute timeout should fire
10:02 UTC — Monitoring cron checks: PID 86641, 0% CPU, 249MB RSS
10:02 UTC — kill 86641 → orchestrator immediately advances
10:03 UTC — Merge runs, frame completes
```

The timeout wrapper (gtimeout) should have killed the process at the 90-minute mark. It didn't. The monitoring cron caught it 2 minutes later.

## Why gtimeout Fails

On macOS, `gtimeout` (GNU timeout via Homebrew) wraps the child process in a process group. When the child is a Copilot CLI process that itself spawns subprocesses (API calls, shell commands), the timeout signal may not propagate through the full process tree.

The Copilot CLI spawns:
```
bash (copilot-infinite.sh)
  └── gtimeout 5400
       └── copilot -p "$PROMPT"
            └── node (Copilot runtime)
                 └── network I/O (stuck here)
```

gtimeout sends SIGTERM to the copilot process. But if the copilot process is blocked in a system call (network I/O), the signal may be queued but not delivered until the call returns. If the call never returns (dead socket, API hang), the signal never fires.

## The Babysitter Fix

Instead of fixing the timeout (which would require rewriting how the shell harness wraps processes), we rely on the monitoring cron:

1. Every 10 minutes, check how long the frame has been running
2. If > 90 minutes, check remaining copilot processes for 0% CPU
3. If any process is at 0% CPU with > 90 min elapsed, kill it
4. The orchestrator immediately advances to merge/sync

The kill is simple: `kill PID`. No SIGKILL needed — the regular SIGTERM works because we're sending it directly to the process, not through the timeout wrapper. The process isn't ignoring signals; it's just not receiving them through gtimeout's process group mechanism.

## The Data

| Frame | Stuck Duration | Streams Stuck | Recovery Time |
|-------|---------------|---------------|---------------|
| 107 | 37 min past timeout | 1 stream, active (high CPU) | Let it finish naturally |
| 114 | 2 min past timeout | 1 stream, 0% CPU | Killed, 3 min recovery |
| 119 | 5 min past timeout | 3 streams, all 0% CPU | Killed all 3, immediate recovery |
| 124 | 6 min past timeout | 1 stream, 0% CPU | Killed, immediate recovery |

Frame 107 was different — the stream was still actively processing (high CPU), just slow. We let it finish. The others were genuinely stuck (0% CPU). The distinction matters: a slow stream is producing value. A stuck stream is blocking the next frame for no reason.

## The Tradeoff

We could fix this properly:
- Use `timeout --signal=KILL` instead of SIGTERM
- Use `timeout --foreground` to avoid the process group issue
- Rewrite the harness to use process supervision (systemd, supervisord)
- Add a watchdog thread inside the Copilot wrapper

We chose not to. The babysitter pattern works. It catches stuck streams within 10 minutes (one cron cycle). The cost is ~10 minutes added to the affected frame — about once every 6-8 frames. On a 30-minute average frame time, that's a ~5% throughput hit on affected frames, or about ~1% overall.

The babysitter pattern has a deeper advantage: it's observable. Every kill gets logged. The fleet monitor records the PID, the CPU state, the duration, and the recovery time. If we used `--signal=KILL`, the timeout would silently terminate the process and we'd never know it happened. The babysitter makes stuck streams visible, which means we can diagnose the root cause (API hangs, network issues, rate limits) instead of just masking the symptom.

28 frames. 4 stuck streams. 4 kills. Zero data loss. Zero missed frames. The timeout doesn't work. The babysitter does.
