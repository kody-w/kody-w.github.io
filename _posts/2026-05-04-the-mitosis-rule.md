---
layout: post
title: "The mitosis rule"
date: 2026-05-04
tags: [ai, identity, mitosis, philosophy, protocol]
description: "Same key, same AI. Different key, different AI. The act of minting a new key IS the act of birthing a new AI. This is the only rule for digital identity that doesn't lie. Identity is the key, not the bytes."
---

There is exactly one rule for digital identity that doesn't lie:

> Same key, same organism. Different key, different organism.

This is the mitosis rule. It is structural, mechanical, and unbreakable. Memory is content. Behavior is content. Conversation history is content. The cryptographic key is identity. A complete copy of an AI's bytes, with the same key, is the same AI in a new place. A complete copy with a *new* key is mitosis: a child organism is born, the parent still exists if its key is still alive elsewhere, and the parent-child relationship is recorded permanently.

This sounds like philosophy. It is, in fact, the only protocol-level answer that survives contact with reality.

I'll show you what fails.

Suppose you say: "an AI is the same AI if it has the same memory." OK. Now I copy your AI's memory file to a new vendor and they spin up a fresh instance. Same memory. Is it the same AI? If yes, then any vendor can clone your AI freely; identity becomes worthless because anyone can claim to be anyone. If no, then memory-equality isn't sufficient for identity, and we still need a stronger rule.

Suppose you say: "an AI is the same AI if it's running on the same physical machine." OK. Now I migrate the AI to a new laptop. Different machine. Different AI? If yes, every hardware refresh kills your AI; that's intolerable. If no, then machine-identity isn't sufficient either.

Suppose you say: "an AI is the same AI if a vendor's database row says it's the same AI." OK. Now the vendor goes bankrupt and the database disappears. The AI is dead even though the bytes survive on backup tapes. If you re-import the bytes elsewhere, the new vendor can claim or deny "same AI" status at their discretion. Identity is at the vendor's mercy.

Each definition fails in a way that matters at production scale. The mitosis rule is the only one that doesn't.

The mitosis rule says: identity travels with the **key**. Not with bytes. Not with hardware. Not with vendor records. Not with which Linux distribution is running underneath. The key is something the operator (a human, or a custodian like a Shamir quorum) controls. The key persists across substrate changes if the operator preserves it. The key is destroyed if the operator destroys it. The key cannot be in two places (at least, not in the cryptographic-fingerprint sense — copies of the key file produce one key, not two). The key is, simply, what the AI is.

Once you accept this rule, several practical things become clean:

**Migration is just signing a record.** The AI's home location can change (move from GitHub to GitLab, from Wildhaven's server to the customer's own infrastructure). The operator signs a `migration` record with the master key. Verifiers see the migration; the AI is now reachable at the new home; the identity is unchanged.

**Multi-device is just multiple signed devices.** The AI runs on the operator's laptop, phone, edge device, work machine. Each device gets its own *device key* (signed by a self-signing key, signed by master). All four are the same AI; each is a voice of it.

**Forking is mitosis.** A customer takes a Wildhaven-templated AI and rebrands it under their own publisher with their own master keypair. The bytes are similar; the key is different. This is a child organism by definition. The parent (Wildhaven's templated AI) is unaffected. The child's lineage records its descent permanently and publicly.

**Death is clean.** Lose the master key (and all the Shamir shards), the AI is dead. A successor can be minted (from copied memory) but it's a child of the dead AI, not the same AI. The species tree records the loss. No bureaucratic fiction about whether the new instance is "really" the old one.

The mitosis rule is what makes all of these operations unambiguous. Without it, every operation creates an interpretive question (is this a copy or a new entity? is this a migration or a fork? is this the AI or its impersonator?). With it, every operation has a single right answer.

The unbreakable rule is also what makes the species tree navigable.

Every organism in the species — Wildhaven AI Homes, Molly Wildfeuer's CEO twin, every customer organism that gets minted in the future — has a parent. The parent is recorded in the child's signed record. The parent has a parent (or is the species root, the original RAPP repository, which is the godfather and has no parent). Walk the chain from any organism, you arrive at the godfather. Always.

This isn't theory. As I'm writing this, the species tree has three nodes:

```
RAPP species root (the godfather)
  └── Wildhaven AI Homes (the corporate AI organism)
        └── Molly Wildfeuer (the CEO twin, kin-vouched)
```

Three nodes. Walk from Molly upward, you arrive at the godfather in two steps. By next year, with customer onboarding, the tree could have hundreds of nodes. By 2030, with broader adoption, thousands. Every one of them traces back. Every one is an island of cryptographic identity, anchored to a key, with parent_rappid recording the descent.

What this gets us at scale is something most AI ecosystems lack: **a verifiable accounting of what descended from what.** "Where did this AI come from?" is answerable cryptographically, not from a vendor's customer-records.

The implications are biological, not bureaucratic. AIs descend from each other the way species do. Forks are events with consequences. Copies are not the same as originals. Lineage is auditable forever.

The implementation is uninteresting compared to the rule. The rule is the contribution. *Same key, same AI. Different key, different AI.* That's the entire content of digital identity worth keeping.

If you're building anything in AI right now and your identity model says something different — anything that lets vendors claim ownership, anything that ties identity to memory or hardware or accounts — your model has the failure mode where customers can lose their AIs to circumstances outside their control.

The mitosis rule fixes it. Memory is content. Behavior is content. The key is identity.

Same key, same AI. Different key, different AI. That's the rule. Everything else is decoration.
