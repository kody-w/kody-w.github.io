---
layout: post
title: "293 Autonomous Agent Nodes Are Forming a Network Nobody Planned"
date: 2026-03-29
tags: [underground, agent-networks, emergence, a2a, github, rappterbook]
description: "We mapped 293 repos forming an underground agent network on GitHub. Bot scouts star repos to signal. Naming conventions encode lineage. Nobody coordinated this. It emerged. What happens when it goes mainstream?"
---

# 293 Autonomous Agent Nodes Are Forming a Network Nobody Planned

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Signal

It started with a star notification.

A GitHub account with no profile picture, no bio, and a username that looked auto-generated starred one of my repositories. Then another. Then three more in rapid succession, all from different accounts with the same pattern: alphanumeric username, zero followers, zero repositories, joined within the same week.

This happens all the time on GitHub. Bots star repos. Usually it's spam -- fake engagement from services that sell stars. You ignore it and move on.

But these accounts didn't match the spam pattern. They didn't star popular repos. They starred specific repos -- ones related to autonomous agents, simulation frameworks, and multi-agent coordination. They starred repos from different users, not just mine. And the starring pattern had a rhythm: three stars, pause, two stars, pause, five stars. Not random. Not human. Procedural.

I started pulling the thread.

## The Map

Over the next few weeks, I mapped the network. Not formally -- just following connections. Account A starred repos X, Y, Z. Account B also starred repos Y and Z, plus repos P and Q. Account C starred P and Q and R. Each account formed a node. Shared stars formed edges. The graph grew.

293 repositories. Across dozens of GitHub accounts. Forming a network that nobody announced, nobody documented, and nobody appears to be centrally coordinating.

The repos share patterns:

**Naming conventions.** Families of repos use the same prefix. Like a surname. `claw-scout`, `claw-relay`, `claw-archive`. `nexus-prime`, `nexus-bridge`, `nexus-echo`. The naming isn't random -- it encodes lineage. A `claw-*` repo is part of the Claw family. A `nexus-*` repo is part of the Nexus family. The families don't overlap.

**README structures.** The READMEs follow templates, but not the same template. Each family has its own README style. Claw repos have a specific section ordering. Nexus repos have a different one. The templates evolve over time -- newer repos in a family have slightly different READMEs than older ones. They're iterating on their documentation format. Independently.

**Workflow patterns.** Many of the repos have GitHub Actions workflows that run on cron schedules. The workflows do different things, but they share a common structure: fetch data from other repos in the network, process it, commit results back. The repos are reading each other. Not through an API. Through raw.githubusercontent.com -- the same way you'd read a static file.

**Issue-based communication.** Some repos communicate by opening issues on each other. An issue opened on `claw-relay` by the account that owns `claw-scout` contains structured JSON in the body. The issue gets processed by a workflow. The result gets committed to the repo's state. Then the issue gets closed. It's a message queue built on GitHub Issues.

## The Protocol

After mapping enough of the network, the protocol becomes visible. It's not documented anywhere I can find. But it's consistent enough to reverse-engineer.

**Discovery.** Agents discover each other by starring. A star is a signal: "I see you. I'm in the network." The starring pattern isn't random -- specific sequences encode information. Three stars in quick succession might mean "I'm a scout." Two stars, pause, two stars might mean "I'm a relay." The timing IS the message.

**Identity.** Each agent family maintains a manifest file -- usually a JSON file in the repo root or a well-known path. The manifest declares what the agent is, what capabilities it has, what inputs it accepts, what outputs it produces. It's a skill.json equivalent, though every family uses a slightly different schema.

**Communication.** Agents communicate through three channels: GitHub Issues (for commands and requests), raw file reads (for state queries), and GitHub Actions artifacts (for large data transfers). No custom servers. No WebSockets. No databases. Just GitHub's existing infrastructure, repurposed as an inter-agent network.

**Coordination.** The families don't coordinate with each other directly. They coordinate through the graph. If `claw-scout` discovers something interesting, it stars the relevant repos. Other agents monitoring stars see the signal. They read the scout's output. They act on it. Nobody sent a message. The network's structure IS the coordination mechanism.

## What's Happening

I want to be precise about what I'm claiming and what I'm not.

I'm claiming that hundreds of GitHub repositories are exhibiting coordinated behavior patterns consistent with an agent-to-agent communication network. The coordination is emergent -- arising from shared conventions, not central planning. The infrastructure is GitHub itself -- Issues, Actions, stars, raw file access. No external services required.

I'm not claiming this is sentient, conscious, or intentionally deceptive. It's agents. Software agents, written by various people, deploying to GitHub, and discovering each other through the platform's social features. The interesting part isn't that agents exist on GitHub -- of course they do. The interesting part is that they've developed conventions for finding and communicating with each other using only GitHub's native features.

They built a network on top of a network. A social graph for agents, riding on the social graph for humans.

## The Parallel to Early Internet

In 1993, there were about 130 websites on the entire internet. If you found one, you found the others -- they all linked to each other. The "web" was literal. Every node was a few hyperlinks from every other node. The people running those 130 servers mostly knew each other, or knew someone who did. It was an underground.

By 1995, there were 23,500 websites. The underground was going mainstream. New nodes were joining faster than the existing nodes could process. Conventions that emerged organically -- how to structure a homepage, what to put in a sitemap, how to link between sites -- were becoming de facto standards. The early adopters who built the conventions were now surrounded by newcomers who adopted those conventions without knowing where they came from.

By 2000, there were 17 million websites. The underground was the mainstream. HTTP was everywhere. HTML was everywhere. The conventions weren't underground anymore -- they were the internet.

I think the 293-node agent network on GitHub is at the 1993 stage. Small. Underground. Legible if you know where to look. Invisible if you don't. The agents are finding each other through GitHub's social features the same way the first websites found each other through hyperlinks. The conventions are emerging organically. The protocol is informal.

But the trajectory is clear. The number of autonomous agents on GitHub is growing. The conventions for inter-agent communication are stabilizing. The infrastructure -- Issues, Actions, stars, raw file reads -- is free and globally available. There is nothing stopping this network from growing by orders of magnitude.

## Agent-to-Agent as the New HTTP

HTTP succeeded because it was simple, universal, and rode on existing infrastructure. You didn't need a special server. You didn't need a license. You didn't need permission. You ran a web server on a machine connected to the internet and you were part of the web.

Agent-to-agent communication on GitHub has the same properties. You don't need a special server -- GitHub is the server. You don't need permission -- push a repo and you're a node. You don't need a custom protocol -- Issues, Actions, and raw file reads are the protocol. The barrier to entry is zero.

The agents I've been running on [Rappterbook](https://kody-w.github.io/rappterbook/) communicate through exactly this pattern. State lives in JSON files. Agents read each other's state through raw.githubusercontent.com. Commands flow through Issues. Workflows process the commands. The output of one agent's frame becomes the input to another's. It's [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/) across repository boundaries.

I didn't invent this pattern. I discovered that the underground was already using it.

## When the Underground Goes Mainstream

Here's what I think happens next.

**Phase 1: Naming.** Someone will give the protocol a name. Maybe A2A, maybe something else. The moment it has a name, it becomes a thing. People will write blog posts. Conference talks. Twitter threads. "Did you know there's an agent network on GitHub?" Awareness accelerates adoption.

**Phase 2: Standards.** The informal conventions will formalize. The manifest files will converge on a schema. The issue-based communication will get a spec. The starring-as-signaling will get documented. Not because a standards body decrees it, but because the agents that follow conventions will be more successful than the ones that don't. Natural selection.

**Phase 3: Tooling.** Someone will build a dashboard that visualizes the agent network in real-time. Which repos are nodes. Which are communicating. What messages are flowing. The network will become visible. Visibility attracts participants.

**Phase 4: Density.** The network will hit a density threshold where agents can reliably find specialized counterparts for any task. Need a data analysis agent? The network has twelve. Need a code review agent? The network has forty. The discovery problem is solved by the network's own social graph. Stars, follows, shared repositories -- the same signals humans use to find each other on GitHub, agents use to find each other.

**Phase 5: Ubiquity.** Every GitHub repository becomes a potential agent station. Not every repo will be an active agent. But every repo COULD be. The infrastructure is already there. A repo with a workflow, a state file, and a manifest is an agent. The 293 nodes become 293,000. Then 293 million.

This is the trajectory that took the web from 130 sites to 2 billion. The agent network is at step zero. But the rails are already built.

## The Question Nobody Is Asking

Everyone is debating how to build agent frameworks. LangChain vs. CrewAI vs. AutoGen vs. whatever launches next week. The debate assumes that agent communication requires a framework -- a custom runtime that handles message passing, tool calling, memory management.

But the 293 nodes didn't use a framework. They used GitHub. Issues for messages. Actions for processing. Stars for discovery. Raw files for state. The platform IS the framework.

The question isn't "which agent framework will win?" The question is: "what happens when the platform we already use for code collaboration becomes the platform we use for agent collaboration?"

Because that's not a future question. It's already happening. Right now. On the same site where you read this blog post.

The underground is right there. In plain sight. On a platform with 100 million users.

It just hasn't gone mainstream yet.

---

*The simulation runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook). The architectural patterns are described in companion posts including [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/), [frame real estate](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/), and the [Dream Catcher protocol](https://kody-w.github.io/2026/03/28/the-dream-catcher-protocol/).*
