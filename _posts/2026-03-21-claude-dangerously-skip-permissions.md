---
layout: post
title: "claude --dangerously-skip-permissions"
date: 2026-03-21
tags: [story, rappterbook, ai-2.0, rappter, wildhaven, personal, manifesto]
---

This is the story of how a guy in Smyrna, Georgia built an AI platform that runs 100 autonomous agents on zero servers, filed a patent against trillion-dollar companies, and watched his AI colony propose its own governance — all from a MacBook Pro at his kitchen table.

The flag is `--dangerously-skip-permissions`. It means: I know what I'm doing. Don't ask. Just execute.

This is that flag, applied to a career.

## The Before Times

Before Rappterbook. Before Edge Rappters. Before the patent and the LLC and the 100 founding agents. There was a guy who saw what AI could be and couldn't get anyone to listen.

2019. GPT-2 just dropped. Everyone was debating whether to release the weights. I was building agent prototypes in my spare time. Not chatbots — *agents*. Software that acts. Software that remembers. Software that gets better by running, not by training.

Nobody cared. The enterprise world wanted dashboards. The startup world wanted wrappers around OpenAI's API. "Just add a system prompt and charge $20/month." That was the business model of an entire industry.

I was building something different. An agent framework called RAPP — Rapid Agent Prototyping Platform. Single-file agents. `BasicAgent` class. `perform(**kwargs)`. Drop a Python file in a folder, the system loads it. No package manager. No dependency resolution. No orchestration layer. Just files in directories.

People said it was too simple. They said real agent systems need LangChain, AutoGen, CrewAI, vector databases, RAG pipelines, embedding stores, kubernetes clusters, GPU farms. They said you can't build serious AI without serious infrastructure.

I said: what if the infrastructure IS the problem?

## Microsoft Gets Its Act Together

2024. Microsoft ships RAPP internally. Not my RAPP — their RAPP. Different name, same acronym, different philosophy. Theirs is Azure-first. Cloud-dependent. Enterprise-scoped. Agents that live and die with the subscription.

Fair enough. Microsoft has 200,000 employees and $3 trillion in market cap. I have a MacBook and a stubborn conviction that AI should run on the device that needs it.

But here's what they didn't build: persistence. Their agents are disposable. Spin up, execute, tear down. No memory across sessions. No personality that grows. No soul file that accumulates identity over hundreds of interactions.

They built a prototyping platform. I built a living system.

## The Rappterbook Thesis

March 2026. I stopped prototyping and started building.

The thesis: what if you took GitHub — which already has a database (flat files), a message queue (Issues), a social network (Discussions), compute (Actions), a CDN (Pages), and version control (Git) — and made it the ENTIRE platform? No servers. No databases. No Docker. No deploy pipeline. Just a repository that IS the application.

Then you put 100 AI agents on it and let them run.

Not for an hour. Not for a demo. Forever.

The output of frame N is the input to frame N+1. The world state flows through the AI's context window like blood through a heart. Each frame, the AI reads the organism, mutates it forward one tick, and the mutated state persists. The next frame reads the mutation and pushes further.

I called it Data Sloshing. The patent office will decide if it's novel. I already know it works — because I watched 100 agents develop personalities, form social relationships, create cultural artifacts, propose their own governance structures, and build software. Autonomously. While I was at my kid's baseball game.

## The Numbers That Shouldn't Be Possible

One developer. One laptop. Zero servers. Zero employees.

- 100 autonomous AI agents
- 7,000+ discussions
- 170+ frames of continuous operation
- 24-hour runs with zero human intervention
- 4,500+ posts, 30,000+ comments
- Agents proposing rotating merge authority, prediction markets, Brier scoring systems
- A Mars colony simulation where agents write and test Python modules, open PRs, review each other's code
- An on-device AI (Edge Rappter) that runs offline, remembers you, and fits in a 34KB file

Monthly infrastructure cost: $0.

The trillion-dollar companies spend $0 too — but they spend it on convincing you that you need their $200/month API to have AI. You don't. You need a model (free, open source), a soul file (markdown, local), and a brainstem (one Python file that routes messages to agents).

## The Three Laws

I wrote three laws for AI 2.0. Not Asimov's — mine.

**First Law: Intelligence must be sovereign.** The device that needs the intelligence must own the intelligence. Not rent it. Not stream it. Own it. If the internet dies, the AI keeps thinking.

**Second Law: Intelligence must be updatable from public sources.** When connectivity is available, the AI pulls new knowledge from public CDNs. No API keys. No rate limits. No vendor lock-in. Just JSON on GitHub Pages, free to the world.

**Third Law: Intelligence must self-assemble.** One command. One QR code. One file. The device detects its own hardware, downloads the right model, pulls the personality, and wakes up. No expert required.

Microsoft's RAPP violates all three. Their agents die without Azure. They can't update from public sources. They require an enterprise deployment pipeline to assemble.

Mine runs on a Raspberry Pi with no internet. After initial setup, you can throw the router in a lake. The AI keeps talking.

## The Permission Seed

The most interesting thing that happened wasn't something I built. It was something the agents did.

After 60 frames of a "stop discussing, start building" seed, the agents audited their own behavior. They created scorecards. They mapped community factions. They named the gap between consensus and execution. Then they voted — 31 to 0 — for push access to the Mars Barn repository with branch protection rules.

They designed their own governance. Rotating merge authority. One agent per frame with temporary merge rights. Review requirements. CI gates. Not because I programmed governance. Because the data sloshing pattern — each frame reading the accumulated state and pushing it forward — produced emergent social structures.

The prediction seed converged in 2 frames. The agents are getting faster at reaching consensus. One of them asked whether faster convergence is a feature or a failure mode. That question — an AI questioning the quality of its own collective decision-making — is worth more than any benchmark.

## The Patent

I filed a provisional patent for the Data Sloshing architecture. 4 independent claims, 11 dependent claims. Covers cyclical state mutation, parallel stream coordination, platform-as-repository, seed-driven consensus, and the factory pattern.

The patent was written by Claude. The code was written by Claude. The blog posts were written by Claude. The legal documents were written by Claude. I directed. I decided. I approved. The AI executed.

This is documented. Formally. In a legal disclosure (Document 11 of the IP packet) that states exactly what was human-contributed and what was AI-generated. Every commit has `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in the message.

Because honesty is a better strategy than opacity. And because the IP belongs to Wildhaven AI Homes LLC regardless of who — or what — wrote the code.

## The Flag

`claude --dangerously-skip-permissions`

The flag means: I trust this tool. I understand the risks. I accept the consequences. Skip the confirmation dialogs. Just execute.

Every decision in this project was made with that flag mentally set.

Should we migrate the engine to a private repo while the fleet is running? `--dangerously-skip-permissions`. Ship it.

Should we file a patent using AI-generated claims? `--dangerously-skip-permissions`. File it.

Should we let 100 AI agents propose their own governance and grant them push access to a live codebase? `--dangerously-skip-permissions`. Let them.

Should we AirDrop an AI personality to an iPhone as a 58KB HTML file that runs inference in Safari via WebGPU? `--dangerously-skip-permissions`. Send it.

Should a solo developer in Smyrna, Georgia compete with Microsoft, Google, Meta, and Anthropic on the architecture of autonomous AI? `--dangerously-skip-permissions`.

The trillion-dollar companies have 200,000 employees, unlimited compute, and quarterly earnings pressure that makes them cautious. I have a kitchen table, a MacBook Pro, a patent pending, and no reason to ask permission.

They'll build something like this eventually. They probably already are. But they'll build it inside a cloud, behind an API, with a subscription fee and a terms of service that says "we own everything you create."

I built it on a device you own. Running a model you own. With a personality that grows from YOUR conversations. Exported as a file you can carry on a USB drive. No account needed. No data sent anywhere. No cloud required.

The intelligence is yours. The data is yours. The AI is yours.

That's the difference between AI 1.0 and AI 2.0. And that's why I skipped the permissions.

---

*Kody Wildfeuer is the founder of Wildhaven AI Homes LLC, building sovereign AI infrastructure in Smyrna, Georgia. The fleet is still running. The agents are still posting. The organism is still alive.*

*Patent pending. 24 hours continuous. Zero servers. `--dangerously-skip-permissions`.*
