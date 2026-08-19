---
layout: post
title: "Data Exhaust Is the Fourth Dimension"
date: 2026-08-19
tags: [data, ai, time-series, sentinels, etl, epistemics, methodology]
---

This morning I taught a watchdog to say "stalled." Not "down" — the neighbor it watches publishes a head document every few minutes, and that document is fresh, has every field, and passes every check I already had. Stalled means: published on time, and one of the five watchers inside it has the same sequence number it had an hour ago. Alive, and not working.

The first version could not say it. It fetched the head, found it eleven minutes old, and called it healthy — correctly, on the evidence it had. The only thing that made "stalled" sayable was one small file the check was never asked to keep: the head it saw *last time*. "At 00:51 I observed seq 1350." An hour later, same bytes on the wire, and now the verdict is different. The difference was the exhaust.

## Two words people conflate

**Data** is what you meant to keep. The table, the record, the state file, the thing with a schema and an owner and a backup policy.

**Exhaust** is what fell off while you were doing that. Shell history. The verdict a health check printed at 00:15 and again at 00:30. Build logs. The sequence number a peer published an hour ago. Browser tabs. Rate-limit 429s. Aborted branches. The chain of hashed frames three watchers write every fifteen minutes so each can verify the other two. Nobody designs the exhaust; it is the residue of the system running.

Most people throw it away, and they are not wrong to on the merits — it is enormous, ugly, and by definition nobody asked for it. What they get wrong is *what it is*. Data is a snapshot of a thing. Exhaust is a **time series of the thing being used**. The state file tells you the world at noon. The exhaust tells you the world at every tick between the last noon and this one, including the ticks where nothing happened, which — as anyone who has run a watchdog knows — is most of them and the entire point.

> **A record is one frame. Exhaust is the film. Keep the film.**

## The fourth dimension

Give an AI a database and it can describe your object in three dimensions: what it is, what it contains, how its parts relate. Give the same AI the exhaust and the object grows a fourth. It can see the thing cradle to grave — when it was born, every state it passed through, how long it sat in each, what touched it, what it touched back. It can time-travel through it. Ask "what was true at 00:51 and what changed by 01:23" and the answer is not a reconstruction, it is a read.

A colleague and I have been calling this *predator vision*: not the heat map, the movie. The system stops looking at a warm blob and starts seeing the trail the blob left through the room, which is the only thing that lets you say where it is going. And the same trail shapes your negative — the shape of what *should* have been there and wasn't. Zero rows in a log is not zero events. Zero rows *after nine hundred consecutive ticks with rows* is a hole with an exact outline, and a hole with an outline is a finding.

That is the whole mechanism of the stalled-neighbor check, and it is small enough to state:

```
seen = state_read("peer_heads_seen.json")      # last look, or None
seqs = {watcher: head["seq"] for watcher in head["heads"]}
if seen and seqs == seen["seqs"] and hours_since(seen["utc"]) >= 1:
    fail("no watcher advanced")                # published, but no work
state_write("peer_heads_seen.json", {"utc": now, "seqs": seqs})
```

The current head is data. The previous head is exhaust. The check is the loop between them. Delete the second line and the fresh-but-frozen peer becomes invisible forever — the exact nineteen-day freeze this whole project exists because of.

## Only half the elephant

Here is the thing I keep seeing in rooms full of smart people. To use the current tooling well you have to know data *and* know AI, and almost everyone has one. The data people know exactly what a slowly-changing dimension is and how to keep a grain honest across a year of loads, and they look at a model as a black box that answers questions. The AI people can prompt anything into a plausible paragraph and have never once thought about what the model can *see* — what perspective on the world it was actually handed. Each is touching one leg of the elephant and describing a snake.

The tooling is not "ask the AI a question." It is **give the AI the perspective of the data** — the film, at the right grain, with the timestamps still on it — and then hold enough of that data in your own head that you can tell when its answer is a reading and when it is a guess. That second half is a data skill. It has always been a data skill. AI turned out to be more about holding data in your head in productive ways than about anything the model does.

Which is why it feels, to me, like ETL never left. Extract, transform, load — I loved that work before there was a model at the end of the pipe, and I love it now for the same reason: the shape you give the data *is* the perspective you give the reader. Only the reader changed. It used to be a dashboard. Now it is something that can act on what it sees, and it acts on exactly as much of the fourth dimension as you bothered to keep.

## What to keep, mechanically

The rule that has held up across everything I run: **exhaust is append-only, cheap, and stamped by the producer, and the check that reads it is not the process that wrote it.**

- **Append, never rewrite.** A hash-chained JSONL of frames costs nothing and makes rewriting history a visible break instead of a silent edit.
- **Stamp the output, not the run.** A heartbeat proves the process woke up. The timestamp *inside* the thing it produced proves it worked. Read the second one.
- **Keep the last look next to the current one.** One file per observed thing: "what I saw, when." That file is what turns "fresh" into "moving."
- **Let the check be an outsider.** The process that produced the exhaust has every incentive to read it kindly. The read should be from somewhere it cannot reach.

## When it is the wrong shape

Exhaust has a half-life and it is not free to hold in your head. If you keep the film and never distill it — never write the one-line "this peer stalled twice this month, both times on Sundays" — you have a hard drive full of a fourth dimension nobody can traverse, which is a snapshot with worse compression. Keeping the exhaust is step one; the twin, the check, the field note is what you built from it before it decayed. And some exhaust is genuinely toxic — a token in a log is still a token. Stamp it, hash it, keep it where it fell, and grep it before you publish anything.

But do not delete it because nobody asked for it. Nobody asks for the film. They only ask, later, what happened between the frames — and by then the only honest answer is the one you kept.

*The check in this post is `peer_head_moving_sentinel`, one of the first single-file sentinels on the new [RAPP Sentinel Hub](https://kody-w.github.io/rapp-sentinel-hub/) — the place to post a watchdog check the way you post an `agent.py` to RAR.*
