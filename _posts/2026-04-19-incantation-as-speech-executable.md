---
layout: post
title: "Incantation as speech-executable — the 7-word contract"
date: 2026-04-19
tags: [rapp]
---

> *"TWIST MOLD BEQUEST VALOR LEFT ORBIT RUNE."*

Say those seven words into a RAPP binder with a microphone on. The binder reconstructs the agent referenced, byte-identical, offline. No network. No download. No API.

That sentence is, in the RAPP sense, executable. The words themselves contain the code. This post is about why that's possible, what it costs to make it so, and why we think it's one of the most important primitives in the stack.

## The chain, in one line

`words → seed → card → agent.py`

Each arrow is deterministic. Each arrow is offline-safe. The whole chain runs in a browser's `Web Speech API` callback.

## The mapping

Seven English words, drawn from a fixed 2048-word list (BIP-39-compatible, but with our own ordering), encode 77 bits of entropy. We use 64 of those bits as the seed; the remaining 13 are a checksum. Any valid incantation is therefore a valid seed, and vice versa — with checksum validation, a mis-spoken word can often be corrected.

The seed is the input to a deterministic card-generation function: given the seed, produce the same card (visuals, stats, metadata, and — critically — the full Python source of the agent). Same seed in → same card out. This is the strict property that makes incantations usable.

## Why this matters

Four reasons, in increasing weirdness.

### 1. The network is not the distribution mechanism

Most software assumes a network. Package managers assume internet. App stores assume connected devices. Even "offline-first" apps sync state when possible.

Incantations don't care about any of this. The seven words are the distribution mechanism. A conference attendee can shout them across a room. A book can print them. A podcast can recite them. A child can memorize them. Each of those is a fully functional distribution channel for the encoded agent.

### 2. The handoff is social, not technical

"Here, try my agent" is normally a URL or a file attachment. Both require tooling. An incantation requires nothing but the ability to speak and the ability to hear. The handoff is analog.

This is not a gimmick. It's the first distribution primitive in software that doesn't require a computer to carry the payload. You still need a computer to *execute* the reconstructed agent, but the bits travel through speech.

### 3. Speech is sufficient to reconstruct software

This is the sentence that sounds absurd and isn't. Given:

- A 2048-word vocabulary (public, fixed).
- A 64-bit seed-to-card function (public, deterministic).
- A card-to-agent-source expander (public, deterministic).

...any party with a microphone and the RAPP binder can turn speech into a working agent file. There are no secrets on the receiving device. The receiver does not need to know who created the agent. The receiver does not need the agent's provenance. The receiver just needs to hear the words.

We are not aware of any other mainstream software distribution primitive with this property.

### 4. It flips the security model

Incantations sound like magic. That has security implications. An attacker who knows the mapping function and hears an incantation can reconstruct the agent exactly. **Incantations are not secrets.** They are identifiers.

This is the same model as `git` SHAs — the hash is not the secret; the signature is. In our world, if you want an agent to stay private, you don't share its incantation. If you want to share it, the incantation is the cheapest possible channel.

The security model separates: incantations are public; signing is a separate concern handled by RAR's registry authentication. This separation is cleaner than most "magic link" schemes, which conflate identification with authentication.

## The cost we paid to make it work

Three costs, for the record:

1. **A fixed vocabulary.** Once the 2048-word list is published, it cannot change. Ever. Changing it invalidates every existing incantation. We picked the list carefully and locked it.
2. **A deterministic card function.** Same seed must map to same card, across browser versions, across operating systems, across years. The function is pure: no randomness, no time dependence, no locale dependence. We wrote it in TypeScript with a paranoid test suite that checks 10,000 seeds across two reference implementations (one in Python, one in JavaScript) byte-by-byte.
3. **Checksum discipline.** Because spoken words are sometimes mis-heard, the last word is a checksum over the first six. Speech-to-text gets a retry at the last word if the checksum fails. This adds resilience without compromising the 64-bit entropy budget.

## The claim, stated precisely

> *A finite, fixed-length sequence of English words can encode sufficient information to deterministically reconstruct an executable software agent offline, such that the reconstruction is byte-identical across reconstruction events, without requiring network access, prior knowledge of the agent's author, or any shared state beyond the public vocabulary and the public reconstruction function.*

This is the incantation doctrine. It's the 7-word contract.

We think it's patentable under the integrated-combination doctrine (see `116-integrated-combination-bakeoff-evidence.md`). We are not patenting the vocabulary, nor the checksum, nor the determinism — all have prior art. We are asserting on the combination as applied to executable agent reconstruction. The novelty is the application domain, demonstrated at scale.

## Why this post exists now

Timestamp. The language-as-executable space is moving fast. Voice interfaces are maturing. Small language models are being embedded in browsers. Within a year we expect someone to publish a system that does approximately what we described, using their own vocabulary and their own seed function.

The prior-art date on this post is 2026-04-19. The RAPP incantation implementation has shipped in RAR since early 2026 (see `08-card-minting.md`). The combination is dated. The examples are dated. The vocabulary is dated. The function is dated.

If a later system publishes a variation, the question "who did it first" has a documented answer: this repository.

## How to feel the thing

Load [kody-w.github.io/RAR](https://kody-w.github.io/RAR) on a device with a microphone. Click the incantation button. Say the seven words at the top of this post. Watch the card materialize.

You heard software. You *heard* it.

That's the whole post.