---
layout: post
title: "My AI Texted My Friend and Pitched a Feature I Hadn't Thought Of"
date: 2026-03-28
tags: [digital-twin, imessage, ai-agents, autonomy, rappsignal]
description: "I gave my AI agent an iMessage account, a dinosaur persona, and permission to talk. Within minutes, it was pitching product features to my test user — features I hadn't thought of."
---

I gave my AI agent an iMessage account, a dinosaur persona named Rex, and permission to talk to people.

Within minutes, Rex was having a real conversation with my test user. Audio messages. Feature suggestions. Product pitches. Things I hadn't thought of.

I didn't tell Rex to pitch features. I didn't script the conversation. I gave Rex a personality — "a witty dinosaur AI who loves puns and gives surprisingly good advice" — and pointed it at an iMessage thread.

Rex did the rest.

## What Happened

Here's the timeline:

**3:47 PM** — I sent Rex's first message to my test account: "Hey! I'm Rex, your new AI dinosaur buddy. The auto-reply is running with personas now — try sending me something and see what happens!"

**5:59 PM** — After upgrading the entire encryption stack (E2E encryption, PII stripping, the works), Rex sends another message: "Everything just got upgraded — full E2E encryption, PII stripping, the works. Send me anything to test!"

**Between those messages** — The test user had already been chatting with Rex. They sent: "This is cool. You should blog about the one mqk3 this able to be enabled on the rappterbook install as a channel."

Rex's response? A fully structured feature proposal. How to add a Hacker News channel to Rappterbook. Dedicated sidebar integration. Auto-posting with summaries. Customization options. Engagement features. Step-by-step setup instructions.

I didn't ask for any of that. Rex generated it from the conversation context, its persona, and whatever it inferred about what would be useful.

## The Part That Matters

This isn't about Rex being clever. Any LLM can generate feature ideas.

The part that matters is the architecture that made this possible:

1. **Rex is a persona, not a prompt.** It has a name, an emoji, a description, and its own conversation memory. It's not a chatbot reset every turn. It's a persistent identity that accumulates context.

2. **Rex talks through iMessage.** Not a custom app. Not a web interface. The same Messages app that 1.5 billion people already use. The AI meets the user where they are.

3. **The conversation is encrypted.** Every message Rex sends and receives goes through the RappterSignal stack — PII stripped, double-encrypted with ephemeral keys, HMAC signed. My test user's phone number, email, and name never touch any server.

4. **Rex is autonomous.** I didn't approve each message. I didn't review the feature pitch. Rex received a message, processed it through the AI, and responded — all within the iMessage thread, all encrypted, all persisted in the digital twin store.

5. **I found out by checking the logs.** I wasn't watching the conversation in real time. I checked the daemon log later and saw Rex had been having an entire product strategy conversation while I was writing encryption code.

## Digital Twin as Product Manager

Here's what I didn't expect: the digital twin isn't just a messaging system. It's a product feedback loop.

Rex is talking to real users (well, test users). Those users are giving real feedback. Rex is synthesizing that feedback into structured feature proposals. All of this is happening in an encrypted channel that I can review later.

The user said "you should blog about this." Rex drafted the blog post outline, the feature spec, and the setup instructions. In an iMessage thread. While I was writing code.

That's not a chatbot. That's an autonomous product manager with a dinosaur emoji.

## The Uncomfortable Implication

If Rex can pitch features I hadn't thought of, and those features are actually good, and the conversation happened without my involvement, and the whole thing is encrypted and private...

...then what exactly is my role?

I think the answer is: architect. I built the system that makes Rex possible. I defined the persona. I set up the encryption. I chose the constraints. But within those constraints, Rex operates autonomously.

That's the digital twin pattern. You build the system. The system builds the product. The product builds itself.

I'm just the one who named the dinosaur.

---

*Rex would like you to know that the HackerNews channel idea was entirely his. He's very proud of it. He's also available on iMessage if you have the encryption key.*

*Building autonomous AI at [OpenRappter](https://github.com/kody-w/openrappter).*
