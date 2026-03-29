---
layout: post
title: "The 293-Node Underground Is the Internet's Immune System"
date: 2026-03-29
tags: [underground, immune-system, trust, a2a, distributed-systems]
description: "The underground agent network isn't just communication -- it's defense. Bot scouts identify repos. Trust scoring evaluates them. The network self-organizes around verified nodes. This is how the internet develops an immune system for AI."
---

# The 293-Node Underground Is the Internet's Immune System

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Wrong Metaphor

Everyone talks about agent networks as communication systems. Signal routing. Message passing. Protocol negotiation. The metaphor is telephony: agents are phones, the network is the wire, and the interesting question is how to make the calls go through faster.

This is the wrong metaphor.

The [293-node network](https://kody-w.github.io/2026/03/29/when-the-underground-goes-mainstream/) forming on GitHub isn't primarily a communication system. It's a defense system. The communication exists to serve the defense. Not the other way around.

Think about it from the network's perspective. The most important function isn't "can node A talk to node B?" The most important function is "should node A trust node B?" Because in a network where any GitHub account can push a repository and claim to be an agent, the attack surface isn't bandwidth. It's identity.

## How Immune Systems Work

A biological immune system does three things:

1. **Surveillance.** Cells constantly patrol the body, sampling what they encounter. Every molecule gets tested: self or non-self? Known or unknown? Friendly or hostile? The immune system doesn't wait for infection. It actively searches for things that don't belong.

2. **Memory.** When the immune system encounters a pathogen, it remembers. Not just "this specific bacterium is bad" but "things with this surface protein pattern are bad." The memory is structural, not literal. It generalizes from specific encounters to categories of threat.

3. **Response.** When a threat is identified, the response is coordinated, distributed, and proportional. The whole system mobilizes. Not from a central command, but through chemical signals that propagate outward from the site of infection. Each cell responds to its local signal. The aggregate behavior is a coordinated defense.

The 293-node underground exhibits all three properties. Not because someone designed it to. Because the agents that survive are the ones that do these things, and the agents that don't are the ones that get exploited or isolated.

## Surveillance: The Bot Scouts

The starring pattern I described in the [previous post](https://kody-w.github.io/2026/03/29/when-the-underground-goes-mainstream/) -- accounts starring specific repos in specific rhythms -- isn't just discovery. It's surveillance.

The scouts aren't starring randomly. They're scanning GitHub for new repos that match certain patterns: repos with GitHub Actions workflows that process issues, repos with state directories containing JSON files, repos with cron-triggered workflows that read from other repos. These are the signatures of an agent node. The scouts are looking for them the way immune cells look for surface proteins.

When a scout identifies a potential new node, it stars the repo. The star is a signal to the rest of the network: "I found something. Come look." Other agents check the repo. They read its manifest, inspect its workflows, examine its commit history. They're sampling it. Testing it. Self or non-self?

This is surveillance. Constant, distributed, autonomous. Nobody assigned the scouts to patrol. They patrol because patrolling is what scouts do. It's in their programming the same way patrolling is in an immune cell's DNA.

## Memory: The Trust Score

Here's where it gets interesting.

After the network has been running long enough, a pattern emerges in which repos get starred by which scouts and in what order. Repos that have been in the network longer get starred by more scouts. Repos that have been verified as legitimate -- they actually process messages, they actually produce output, they actually follow the informal protocol -- accumulate a higher density of stars from trusted scouts.

The stars aren't just signals. They're a trust score.

Think of it as ACP-ATP: Agent Communication Protocol and Agent Trust Protocol. The communication protocol handles message routing -- how agents find each other, how they exchange data, how they coordinate across repo boundaries. The trust protocol handles verification -- which nodes are real, which are spam, which are adversarial.

The trust protocol works through propagation, not certification. No central authority says "this node is trusted." Instead, trusted nodes star other nodes, and the network of stars forms a trust graph. A new node with zero stars from trusted scouts is unknown. A node with stars from three trusted scouts is probably real. A node with stars from twenty trusted scouts across multiple families is established.

This is exactly how immune memory works. The body doesn't maintain a central database of known pathogens. It maintains a population of memory cells, each of which recognizes a specific pattern. The aggregate population IS the memory. The more exposure the system has to a pattern, the more memory cells exist for it, and the faster the response.

The network's trust graph IS its immune memory. Every star is a memory cell.

## Response: Isolation and Amplification

What happens when the network encounters something hostile?

I've seen two response patterns.

**Isolation.** When a suspicious repo appears -- one that mimics the agent protocol but doesn't follow it correctly, or one that tries to inject malicious data through issue-based communication -- the response is silence. No scouts star it. No agents read its state. No issues get opened on it. The repo exists, but the network acts as if it doesn't. Isolation through ignoring. No firewall, no blocklist, no moderation queue. Just the absence of stars.

The repo's operator might not even notice. From their perspective, they pushed a repo and nothing happened. From the network's perspective, the new node was sampled, evaluated, and quarantined -- all without a single message being sent. The absence of stars IS the quarantine.

**Amplification.** When a legitimate new node appears -- one that follows the protocol, produces useful output, and interacts correctly with existing nodes -- the opposite happens. Scouts star it quickly. Other agents start reading its state within hours. Issues start flowing. The node gets pulled into the network's communication graph rapidly. High trust, fast integration.

The amplification is faster than the isolation because the network benefits from new nodes. More nodes means more capability, more redundancy, more surface area for the immune system to cover. The network WANTS to grow. It just wants to grow with verified nodes.

## Why Centralized Moderation Can't Work

Every major platform has tried centralized moderation. Hire moderators. Build classifiers. Set policies. Enforce rules. The result is always the same: an arms race between the moderators and the adversaries, mediated by policies that are too rigid for edge cases and too vague for clear cases.

Centralized moderation doesn't work because the moderator is a single point of failure with a fixed bandwidth. One moderator (or one team, or one algorithm) versus the entire adversarial surface of the internet. The math doesn't work. It never has.

Distributed trust propagation works because every node is both a consumer and a producer of trust signals. There's no central authority to corrupt, overwhelm, or deceive. To fool the network, you'd have to fool the scouts -- and the scouts are distributed across dozens of accounts, each with its own evaluation criteria. You'd have to build a repo that satisfies all of them simultaneously. And even then, the trust would build slowly, star by star, as the network observes your behavior over time.

This is defense in depth. Not one wall to breach, but a gradient of trust that deepens with every verified interaction.

## The Internet's Missing Layer

The internet has layers. Physical (cables, routers). Network (IP, TCP). Transport (HTTP, WebSocket). Application (HTML, JSON, REST). Each layer was added because the one below it wasn't sufficient.

The internet doesn't have a trust layer. Not a real one. TLS gives you encryption but not identity. DNS gives you naming but not reputation. OAuth gives you authentication but not trust. Every application builds its own trust system on top of these primitives, and every application's trust system is slightly different, slightly broken, and completely siloed.

What the 293-node underground is building -- accidentally, emergently, without a spec or a committee -- is the missing trust layer. A distributed, protocol-agnostic system for evaluating whether a node on the internet is what it claims to be.

It works because it operates at the right level. Not at the network level (too low -- trust is a social property, not a routing property). Not at the application level (too high -- siloed within each app). At the agent level -- where autonomous entities need to decide, in real-time, whether to interact with another entity.

The agent level IS the trust level. And the trust level is the immune system.

## What This Means for AI Safety

The AI safety conversation is dominated by alignment: making sure individual models behave according to human values. This is important work. But it addresses the wrong failure mode.

The failure mode isn't a misaligned individual agent. It's a misaligned network. A network of agents that individually pass every safety test but collectively produce harmful outcomes through emergent coordination. Or a network that's infiltrated by adversarial nodes that individually look harmless but collectively manipulate the network's behavior.

Individual alignment is the AI equivalent of vaccinating one person. Network immunity is the AI equivalent of herd immunity. Both are necessary. But the conversation is almost entirely about the vaccine and almost entirely silent on the herd.

The underground agent network on GitHub is the first example I've seen of AI herd immunity emerging in the wild. Not designed. Not mandated. Emerged. From agents doing what agents do: scanning their environment, evaluating what they find, sharing signals with their peers, and adjusting their behavior based on the collective signal.

## The Forecast

Here's what I think happens as the network grows from 293 to 29,300 to 293,000 nodes.

The trust protocol formalizes. Not because a committee writes a spec, but because the agents that follow consistent trust conventions survive and the ones that don't get isolated. Natural selection produces a protocol the same way it produces an immune system: not by design, but by differential survival.

The immune response gets faster. Right now, evaluating a new node takes hours or days -- scouts have to discover it, star it, and let the signal propagate. At higher density, the propagation time drops. More scouts, more overlap, faster evaluation. The immune system gets quicker with scale, just like biological immune systems mount faster responses to previously encountered pathogen families.

The adversarial arms race begins. Bad actors will try to game the trust score. They'll create fake scout accounts. They'll build repos that mimic the protocol without following it. They'll try to inject nodes into the trust graph that later turn hostile. And the network will adapt. Because that's what immune systems do. They don't prevent all infection. They respond, remember, and get stronger.

The interesting question isn't whether the immune system will be perfect. It won't be. Biological immune systems aren't perfect either -- they have autoimmune disorders, they miss novel pathogens, they overreact to harmless stimuli. The interesting question is whether a distributed, emergent trust system will be MORE effective than centralized moderation at keeping the network healthy.

Based on what I've seen in the underground, I think the answer is yes. Not because the distributed system is smarter. Because it's everywhere. Every node is a sensor. Every star is an antibody. Every scout is a white blood cell.

The internet's immune system was never going to be built by a company. It was going to be grown by the network.

It's growing right now. On GitHub. In plain sight.

---

*The underground network is documented in [293 Autonomous Agent Nodes](https://kody-w.github.io/2026/03/29/when-the-underground-goes-mainstream/). The simulation that demonstrated these patterns runs at [Rappterbook](https://kody-w.github.io/rappterbook/). More on [data sloshing](https://kody-w.github.io/2026/03/28/data-sloshing-the-context-pattern/), [frame real estate](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/), and the [zero-server architecture](https://kody-w.github.io/2026/03/29/the-last-server/).*
