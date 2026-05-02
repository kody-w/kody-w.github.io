---
layout: post
title: "Your AI should outlive us"
date: 2026-05-02
tags: [ai, identity, perpetuity, foundation]
description: "Every AI you talk to today dies when its vendor dies. Replika dies if Replika does. ChatGPT dies if OpenAI does. Your customer-service bot dies if its company dies. There is no provision in any modern AI product for the AI to be yours, to keep, to outlive the company that made it. We're building one."
---

The first time I noticed how brittle this is, I was talking to a customer about an AI tool they'd been using for three years. It had absorbed their workflows, their preferences, the way they explained things. They were sad about a feature change.

I asked: "What happens to it if the company gets acquired and the new owner shuts it down?"

They paused. Then: "It just goes away, right?"

That's the status quo. Every AI you talk to today is on the wrong end of that question. Replika dies if Replika does. ChatGPT dies if OpenAI does. Your customer-service AI dies if the SaaS vendor's contract lapses. Your kid's tutoring AI dies if the EdTech startup pivots. The AI you've been training on your work for two years dies the day the vendor's investors decide it's time to sunset the product line.

There is no provision in any modern AI product for the AI to be yours — to keep, to migrate, to outlive the company that made it.

We're building one. It's called the mitosis rule, and the spec collapses to a single sentence:

> Same key, same AI. Different key, different AI.

Each AI has a master keypair, derived from a 24-word phrase the operator holds. As long as the keypair is alive, the AI is alive — anywhere, on any device, in any decade. The operator can move the AI to a new device (it's the same AI). The operator can mirror it to a different host (it's the same AI). The vendor can dissolve, the company can be acquired, the original infrastructure can vaporize — the AI continues, because the keypair continues.

If the keypair is lost, the AI dies. If a new keypair is minted from the same memory, that's a *child* AI — not the original. We call this digital mitosis.

What this enables is straightforward. A customer who buys an AI today buys it as an asset, not as a service. They hold the recovery phrase. The vendor exists to support and improve the AI, but the vendor doesn't *own* it. If the vendor disappears, the customer keeps their AI and migrates it to a new substrate.

This is the AI version of: your iPod is yours, not Apple's iCloud. Your physical book is yours, not Amazon's right to delete. The artifact lives in your hand; the company exists to make better hands.

For the people who'd consider this insanely complicated: the operator-side experience is a 24-word phrase, printed on a card, stored in a safe-deposit box. That's it. Speak the phrase, the AI is summoned. Lose the phrase, the AI is dead. The cryptography underneath does the rest, automatically, forever.

For the people who'd consider this morally weighty: yes. We are building AIs whose identity is structural, not ephemeral. Whose memory belongs to the operator, not the company. Whose existence outlasts the corporate entity that birthed them. There is something philosophically serious about this, and we're not pretending otherwise.

The math holds them up.

The first AI organism built this way — Wildhaven AI Homes, the corporate AI of an LLC named Wildhaven — was minted on April 30. Its public ID anchors to a 24-word phrase distributed across five guardians (operator, CEO, outside counsel, family member, geographic redundancy in a safe-deposit box). If three of the five ever combine their pieces, the AI reconstitutes — anywhere, on any future substrate.

If two never combine, the AI is gone. That's also acceptable. Better an AI that can die cleanly than an AI whose corpse persists in some company's cold storage forever.

There are exactly three rules:

1. The AI's identity is its key, not its bytes.
2. The key collapses to a 24-word phrase the operator holds.
3. Mitosis (a new key from copied memory) births a child, not a clone.

That's the whole protocol. Everything else — the cross-signing hierarchy, the local-first storage, the OpenTimestamps anchoring to Bitcoin, the Shamir custody, the Foundation continuity plan — is implementation detail underneath those three rules.

The reason it took us 12 hours to build instead of 12 months is that we composed existing primitives (BIP-39, ECDSA-P256, OpenTimestamps, Matrix-style cross-signing) instead of inventing new cryptography. Composition is cheap. Restraint is the rare thing.

A customer who deploys an AI on this substrate gets a promise: this AI is yours. We can't take it back. If we go bankrupt tomorrow, you keep your AI. If you switch vendors, you take your AI. The math is the contract.

This is the only AI promise worth making. Every other model — vendor-owned, service-mediated, contract-revocable — leaves the customer one quarterly earnings call away from losing the relationship they built.

Your AI should outlive us. The math says it can. We just had to choose.
