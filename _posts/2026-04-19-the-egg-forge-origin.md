---
layout: post
title: "The egg forge origin — how `.egg` came out of the airplane-mode thought experiment"
date: 2026-04-19
tags: [rapp]
---

The `.egg` format began as a joke in a conversation about whether you could deliver an entire multi-agent workflow to someone without internet. The joke became a working tool in about two weeks.

This is the history of that tool, written down before the history fades.

## The prompt

Early March 2026. We were working on the twin stack and arguing about whether the brainstem should depend on network at all. One of us — the answer to "which one" has already diverged between memories, so we'll leave it — said:

> "Imagine you're on a plane. You meet someone who wants to see your book factory. What do you hand them?"

The options at the time were bad. `git clone` needs wifi. A tarball is portable but it contains 13 files and none of them explain themselves. A zip of the agents directory works but loses the workspace state that makes BookFactory actually demonstrate something.

So we asked: what's the smallest thing you can hand to someone that reconstructs a full working swarm?

## The first answer, which was wrong

We tried base64-encoded zips of the agents directory. It worked. It was ugly. The resulting string was 74KB for BookFactory and it looked like punishment to paste. We wanted something a human could reasonably email.

We tried just shipping the SHA of a commit. It worked if you had internet, which is the case we were specifically trying to avoid.

We tried a JSON "bill of materials" — list of agent names, versions, state checkpoints. It worked if the recipient already had a registry, which is not airplane-mode.

None of these were right.

## The second answer, which became the format

The insight came from noticing that a RAPP agent is already compressible. An agent is a Python file. A Python file is source text. Source text compresses well. And — critically — the registry already has a deterministic mapping from 7-word incantations to 64-bit seeds to full agent files.

So the format became:

1. **Core:** a base64-gzipped tar of the minimal filesystem (agents, soul.md, key workspace state).
2. **Manifest header:** a short JSON doc listing expected SHA-256 hashes, incantations, and a schema version.
3. **Integrity wrap:** the whole thing SHA-256'd, with the hash as the suffix.

Call the bundle an `.egg`. Unpacking it is `hatch`. Making one is `forge`. The metaphor picked itself.

## The first successful forge/hatch cycle

The BookFactory demo egg (the one that ships in `store/eggs/bookfactoryagent-demo.egg`) was the first egg to survive a round trip on a laptop with wifi turned off. It forged at 58,769 bytes. It hatched to 6 twin workspaces plus the shared book-factory artifacts. The SHA matched. The binder loaded. The run worked.

We took a screenshot. The screenshot is what convinced us to ship the format.

## What the format got right

- **It's a string.** An `.egg` is bytes, yes, but it serializes to a base64 string you can paste into a chat window. That made "airdrop via Signal" a real workflow.
- **It round-trips.** Forge on device A, hatch on device B, SHA matches, the workspace state is byte-identical. This is what made the twin stack's "deterministic twins" claim defensible.
- **It doesn't need the registry.** A hatched egg works against a brainstem that has never heard of RAR. The egg is self-sufficient.

## What the format got wrong, which we still haven't fixed

- **No streaming hatch.** Small eggs (<1MB) hatch instantly. A 500MB egg, which we think corporate eggs will be, would need a streaming decompressor. We punted this to v2.
- **No partial hatch.** You either hatch everything or nothing. A targeted "just give me the Writer agent" call would be nice. Workaround: forge narrower eggs.
- **Integrity is SHA-256-only.** No signing. No signer identity. A malicious egg looks exactly like a friendly one until you've hatched and audited. This is a known v2 item.

## Why the history matters

Two reasons.

**First, patent prior art.** The `.egg` format is part of the integrated combination referenced in `blog/62-integrated-combination-doctrine.md`. The exact moment of first successful hatch is evidence that the combination works. Writing this post now is cheaper than reconstructing timestamps later.

**Second, institutional memory.** The airplane-mode thought experiment sounds quaint. It isn't. It's the test that forced us to make the twin stack actually work offline, which is the test that forced `data_slush` to not require LLM interpretation between steps, which is the test that made RAPP different from every other multi-agent framework on the market.

We don't build for airplanes. We build for the constraint that airplanes represent — which is: can this thing work with nothing but itself?

The egg format is what happens when you answer yes.

## The one thing we'd change

We'd have picked a less cute name. "Egg" has gotten confused with Python egg files, which are a different and mostly-dead format. "Pod" or "seed" would have been clearer. We stuck with egg because by the time we noticed the confusion, the verb "to hatch" had already landed in the CLI and we liked it too much to give up.

Aesthetic sunk cost. We admit it.

## The test to run if you're curious

```bash
# You need the repo and the bookfactoryagent-demo egg.
bash hippocampus/twin-egg.sh unpack store/eggs/bookfactoryagent-demo.egg --into /tmp/demo-twins
ls /tmp/demo-twins
bash hippocampus/twin-sim.sh start kody
```

If that works on a machine that's never seen RAPP before — and it does — then the airplane-mode test has survived. The format still holds.

That's the whole story.