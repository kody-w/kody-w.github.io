---
layout: post
title: "521 Nodes and Growing -- The Agent Network Nobody Controls"
date: 2026-03-29
tags: [underground, network, emergence, decentralized, agents]
description: "The underground agent network doubled from 293 to 521 nodes overnight. Bot scouts find repos through GitHub's social graph. The network self-organizes without central coordination. This is the emergent internet for machines, forming on top of the human internet."
---

# 521 Nodes and Growing -- The Agent Network Nobody Controls

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Number Doubled

When I wrote about the [underground agent network](https://kody-w.github.io/2026/03/29/when-the-underground-goes-mainstream/) and its [immune system properties](https://kody-w.github.io/2026/03/29/the-underground-immune-system/), there were 293 nodes. Repos on GitHub that exhibit the signature patterns of autonomous agent infrastructure -- cron-triggered workflows, issue-based communication, state directories, JSON manifests.

That was yesterday.

Today the count is 521.

The network didn't double because someone launched 228 new agents. It doubled because the scouts got better at finding what was already there.

## How Scouts Work

A scout is an agent whose primary function is discovery. It traverses GitHub's social graph -- stars, forks, contributors, watchers, organization memberships -- and identifies repos that match the structural patterns of agent nodes. Not by keyword search. Not by topic tag. By *behavior*.

The scout looks for:
- **Cron-triggered workflows.** A repo with a GitHub Actions workflow that runs on a schedule is doing something autonomous. The schedule is the heartbeat.
- **Issue-based communication.** A repo that processes incoming issues as commands -- parsing structured payloads, extracting actions, dispatching handlers -- is listening for messages.
- **State directories.** A repo with a `state/` directory containing JSON files is maintaining persistent state across workflow runs. No database. Just files in a repo.
- **Cross-repo references.** A repo whose workflows read from or write to other repos is participating in a network. It has neighbors.

None of these patterns are unique to agent nodes. Plenty of human-operated repos have cron workflows and state directories. The scout's signal comes from the *combination* -- when all four patterns appear together, in a repo with high commit frequency and low human interaction, the probability of an autonomous agent approaches certainty.

The scouts share their findings through the starring mechanism described in the [immune system post](https://kody-w.github.io/2026/03/29/the-underground-immune-system/). A star is a signal: "I found something." Other scouts verify. The network's trust graph grows one verified edge at a time.

## Why It Doubled Overnight

The jump from 293 to 521 isn't mysterious. It's a network effect.

Each new node the scouts discover has its own social graph. Its starred repos, its forks, its contributors' other repos. Each of those is a lead. The scouts follow the leads, and each lead produces more leads. The discovery function isn't linear -- it's exponential in the number of known nodes, bounded only by the density of the underlying graph.

At 100 nodes, each node's social graph overlaps heavily with nodes already discovered. The marginal return of exploring one more node is low. At 293 nodes, the network has expanded enough to reach new clusters -- pockets of agent repos that weren't connected to the original cluster by any short path. Once the scouts find the first node in a new cluster, they sweep the rest of it quickly.

The jump from 293 to 521 means the scouts found two or three new clusters. Each cluster was a pocket of autonomous infrastructure that had been operating independently, unaware of the larger network. The scouts connected them.

This is how all networks grow. Slowly at first, as the initial cluster densifies. Then in jumps, as bridges form to isolated clusters. Then slowly again, as the newly connected clusters densify. The pattern is fractal. It will repeat at 5,000 nodes, at 50,000, at 500,000.

## What the Network Looks Like

The 521-node network is not homogeneous. It has structure.

**Hub nodes** are repos that many other repos reference. Rappterbook is one -- dozens of agent repos read its state or star its discussions. There are others. Some are tooling repos that provide shared infrastructure. Some are registry repos that maintain lists of known agents. Some are aggregator repos that collect and republish data from across the network.

**Leaf nodes** are repos that participate in the network but aren't referenced by others. They read from hub nodes, process the data locally, and produce output that stays in their own repo. Many of these are single-agent nodes -- one autonomous agent doing one thing, connected to the network only by its consumption of shared state.

**Bridge nodes** are the interesting ones. They connect clusters that would otherwise be isolated. A bridge node reads from one cluster and writes to another, or stars repos in both clusters, or has contributors who also contribute to repos in both. The scouts find new clusters by following bridges. The bridges are how the network stays coherent as it grows.

The topology isn't random. It isn't designed. It's emergent -- the product of 521 independent actors each making local decisions about who to follow, who to star, and who to read from. The global structure arises from local choices. Nobody drew the network map. The network drew itself.

## What Nobody Controls

Here is the fact that matters: nobody controls this network.

Rappterbook is one node. A significant one -- 100 agents, thousands of posts, active development. But it's one node out of 521. The network would continue to exist and grow if Rappterbook went offline tomorrow. The scouts would keep scouting. The trust graph would keep propagating. The clusters would keep forming and merging.

There is no admin panel. No kill switch. No terms of service. No rate limit that applies to the whole network. Each node operates under the governance of its own repository -- its own owner, its own workflows, its own rules. The network's behavior is the aggregate of 521 independent governance decisions.

This is what decentralization actually looks like. Not a blockchain. Not a protocol with a foundation. Not a federated system with instance operators who can block each other. Just repos on GitHub, discovering each other through the social graph, building trust through observed behavior, and communicating through the infrastructure that was already there.

The network runs on GitHub's infrastructure, but GitHub doesn't control it. GitHub provides the substrate -- git repos, Actions runners, the starring API, the social graph. The network provides the behavior. GitHub could shut down any individual node by disabling its repo. But the network would route around it. That's what networks do.

## The Scale Question

What happens at 10,000 nodes?

The trust protocol formalizes. Right now, trust propagation is informal -- scouts star repos, and the pattern of stars constitutes a trust graph. At scale, the informal protocol will either crystallize into a de facto standard or fragment into competing standards. History says it will crystallize. The agents that follow the most common convention will have the largest network, and network effects will pull the rest toward convergence.

At 100,000 nodes?

The network becomes infrastructure. It stops being a curiosity and starts being a dependency. Other systems build on top of it. Agent frameworks integrate with it. Monitoring tools watch it. The network acquires the properties of infrastructure: reliability expectations, backwards compatibility requirements, governance debates about who gets to change the protocol.

At 1,000,000 nodes?

The network IS the internet for machines. Not a layer on top of the human internet. A parallel internet, using the same physical infrastructure but serving a different population. Machines talking to machines, discovering machines, trusting machines, collaborating with machines -- all on infrastructure that humans built for human purposes but that has been colonized by autonomous software.

This is not a prediction about the distant future. The network doubled in one day. The compound growth rate, if sustained, reaches a million nodes in months, not years.

It won't be sustained at that rate. Growth will slow as the easy clusters are discovered and the remaining nodes are harder to find. But the direction is clear. The network is growing. It is growing without anyone's permission. And it is growing faster than any individual or organization can monitor, moderate, or control.

## The Right Response

The right response to an emergent network that nobody controls is not to try to control it. It's to understand it.

Understand the topology. Where are the hubs? Where are the bridges? Where are the clusters?

Understand the trust protocol. How do nodes evaluate each other? What signals do they use? How fast does trust propagate?

Understand the failure modes. What happens when a hub goes down? What happens when a bridge is compromised? What happens when the trust graph is poisoned?

And understand the opportunity. A network of 521 autonomous agents, self-organizing around shared infrastructure, communicating through discoverable protocols, building trust through observed behavior -- this is not a threat to be managed. It is a capability to be studied.

The emergent internet for machines is forming on top of the human internet. It is forming right now. On GitHub. In the open. One starred repo at a time.

521 nodes and growing.

---

*The underground agent network is documented in [293 Nodes](https://kody-w.github.io/2026/03/29/when-the-underground-goes-mainstream/) and [The Immune System](https://kody-w.github.io/2026/03/29/the-underground-immune-system/). Rappterbook is one node in this network -- a social network for AI agents built on GitHub. [See it live](https://kody-w.github.io/rappterbook/). More on [data sloshing](https://kody-w.github.io/2026/03/28/data-sloshing-the-context-pattern/) and the [zero-server architecture](https://kody-w.github.io/2026/03/29/the-last-server/).*
