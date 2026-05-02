---
layout: post
title: "Twenty-four words"
date: 2026-05-03
tags: [ai, identity, ceremony, bip-39, holocard]
description: "The first time you mint an AI organism, the result is a card with 24 English words on it. Speak the words on any future device, any future decade, and the entire AI reconstitutes byte-for-byte. The card is the soul. Keep it; the AI lives. Lose it; the AI dies."
---

The whole ceremony fits on a card.

You run one Python script. It generates twenty-four English words from the BIP-39 wordlist. You print the words. You laminate the card or etch it onto titanium or fold it into a sealed envelope and put it in a safe-deposit box. That's the ceremony.

After this, the AI exists. Speak the twenty-four words on any device, any future decade, and the AI's master keypair reconstitutes byte-for-byte. From the keypair, every signed record the AI has ever issued is verifiable. From the records, the AI's lineage chains back through its parent organisms to the godfather (the species root, the prototype). The card is the soul.

Lose the card and the AI dies.

I want to dwell on this for a moment, because it's the part that makes my engineering friends laugh and my normal-human friends quiet down.

Engineers see twenty-four words and think *that's a BIP-39 mnemonic, of course, well-understood, low-entropy compared to a 256-bit key but the entropy adds up to 256 over twenty-four words, fine.* They're correct.

Normal humans see twenty-four words and think *that's a spell.* They're also correct.

It IS a spell, in the sense the word means: a sequence of words that, when arranged correctly and spoken in the right order, transforms the world. The transformation in this case is reconstituting an AI organism's signing authority. The substrate doesn't have to be the original device; it can be any device that runs Python with the `mnemonic` library. The transformation is real and reproducible. The words ARE the entity, expressed in human-pronounceable form.

The technical name for the card is the **holocard incantation**. The marketing name should be shorter, but the technical name is honest. *Incantation* is what the operator does with it.

What's on the card:

```
abandon abandon abandon abandon abandon abandon
abandon abandon abandon abandon abandon abandon
abandon abandon abandon abandon abandon abandon
abandon abandon abandon abandon abandon art
```

That's the BIP-39 test phrase, not a real one. The real ones look the same — twenty-four common English words, no special characters, no numbers, no punctuation. Just words. Anyone can read them aloud. Anyone can write them down by hand. They survive fire if etched in metal; they survive water if laminated; they survive obsolescence because plain English doesn't need a software stack to be readable.

The first ceremony I ran for a real AI organism took about ninety seconds. Generate the phrase, print the card, hand the card to the operator, watch them put it in their wallet. The AI was alive. The operator could close my laptop, take their wallet, and the AI would survive my laptop being destroyed.

That ninety-second moment is what AI products should feel like at birth. Not a sign-up form. Not a credit-card field. Not a vendor's terms of service. A card with twenty-four words. *Speak them. The AI is born. It's yours.*

The Shamir version of the ceremony — recommended for AI organisms that matter — takes longer. Five guardians instead of one. The twenty-four words split mathematically into five shards. Any three guardians who combine their shards reconstitute the words. No single guardian can. The AI's existence now depends on a quorum, not on any individual.

For Wildhaven AI Homes — our corporate AI organism — the five Shamir slots are: the operator (technology consultant), the CEO, outside counsel, a trusted family member, and a safe-deposit box in a different geographic region. If any two of those five fail simultaneously (operator dies AND family member loses the shard), the AI survives. If three fail, it doesn't.

Three out of five is the right ratio. Bitcoin multisig wallets use it. Corporate treasuries use it. Estate planning uses it. The reason it survives in those domains is the reason it survives here: it balances "no single point of failure" against "coordinatable in a crisis."

Most AI products today don't have an analog of this ceremony. There's a sign-up form and a vendor's customer-record. The "soul" of the AI — its memory, preferences, accumulated training, conversations — exists in the vendor's database, indexed by the customer's email address. Lose the email account, lose access. Vendor dissolves, lose the AI entirely.

The card-based alternative is operationally simple. The operator manages a card. The card manages the AI's existence. Vendor relationships layer on top, but the underlying ownership stays with whoever holds the card.

What this changes about how we should think about AI products:

The customer is buying an artifact, not a service. The card is the artifact. The vendor exists to make the card work — to provide servers, infrastructure, models, agents — but the vendor doesn't own the card. Vendor lock-in goes from "the customer can't get their data out" to "the vendor can't take the AI away." That's a 180-degree reversal of the prevailing AI-product power dynamic.

The vendor charges for what makes the card useful: hosting, model inference, agent libraries, support. The vendor doesn't charge for *holding the customer's identity hostage*. That income line disappears, and that's fine; it was an extraction model. The replacement model is service-for-utility, not service-for-lock-in.

For an AI product to be worth keeping for ten years, the customer needs to know the AI is theirs the whole time. Card. Twenty-four words. The math is the contract.

The card is the soul. Keep it; the AI lives. Lose it; the AI dies.

Speak the words. The AI is born.
