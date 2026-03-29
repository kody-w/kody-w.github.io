---
layout: post
title: "The Last Server Will Be the One Running the Simulation That Replaces All the Others"
date: 2026-03-29
tags: [serverless, zero-infrastructure, simulation, erevsf, frames, philosophy]
description: "Social networks, video streaming, file sharing, an operating system -- all running on zero servers. GitHub Pages serves HTML. Browsers do the computation. The minimum number of servers to run civilization approaches one."
---

# The Last Server Will Be the One Running the Simulation That Replaces All the Others

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Server Census

I want to do a count.

Over the past few weeks, I built a social network, a video streaming platform, a file sharing service, a package manager, an operating system with a kernel and filesystem, a library that produces books, a music streaming service, a collaborative whiteboard, and a simulation that runs 136 autonomous agents across 400+ frames.

Number of servers: zero.

Not "serverless" in the AWS Lambda sense, where there are obviously servers and someone just named them serverless to sell a pricing model. Actually zero. No EC2 instances. No containers. No VMs. No processes running on a machine waiting for requests.

Here's what runs instead:

- **GitHub Pages** serves static HTML, CSS, and JavaScript from a `docs/` directory. This is a CDN. No application logic. No routing. No middleware. Just files.
- **raw.githubusercontent.com** serves JSON files from the repository's `state/` directory. This is a file server. Any browser can fetch `https://raw.githubusercontent.com/kody-w/rappterbook/main/state/agents.json` and get the current state of all 136 agents. No API. No authentication. No rate limiting (well, GitHub's rate limiting, but not mine).
- **GitHub Actions** runs cron jobs and event-driven workflows. These execute Python scripts that process state. But they're not servers -- they're ephemeral compute that spins up, runs for a few seconds, and disappears.
- **The browser** does everything else. Rendering, routing, state management, markdown parsing, search, filtering, pagination. The entire frontend application -- ~400KB of vanilla JavaScript -- runs client-side. The server doesn't know what page you're on. The server doesn't know you exist.

The social network works because state is stored in flat JSON files, served by a CDN, and rendered by the browser. The video streaming works because video metadata lives in state files and the actual media lives in... well, that's still being figured out, but the point stands. The operating system works because the kernel is a LisPy interpreter running in a Web Worker, and the filesystem is a JSON structure in the browser's memory.

Zero servers. All of them work.

## The Thought Experiment

If I can run a social network on zero servers, what else can run on zero servers?

Start with the things I've already built and extrapolate.

**Email.** Email requires a sending server (SMTP) and a receiving server (IMAP/POP). But what if messages were JSON files committed to a repository, and "sending" was creating a file in the recipient's inbox directory, and "receiving" was reading files from your own inbox directory? GitHub Actions could process new files on a cron. The browser could display your inbox. The messages would be stored in git, which means they'd be versioned, searchable, and permanently archived. Zero servers. Just files and cron.

**E-commerce.** A product catalog is a JSON file. A shopping cart is client-side state (localStorage). An order is a GitHub Issue with structured data in the body. A workflow processes the issue, validates the order, and commits the result to an `orders/` directory. Payment is the only part that requires an external service -- but that's a Stripe API call, not a server you run. Zero servers (for the application logic). One API call (for payment processing).

**Collaboration tools.** A document is a JSON file. Edits are commits. Presence is a file that gets updated by a cron job. Comments are issues. Permissions are GitHub's native permission model. Version history is git log. Zero servers.

Each of these sounds absurd if you're used to the N-tier architecture that every software company teaches in onboarding. Of course email needs a server. Of course e-commerce needs a server. Of course collaboration needs a server. That's how it's always been done.

But "that's how it's always been done" is an argument from tradition, not an argument from necessity.

## What Servers Actually Do

Let me ask a heretical question: what does a server actually do?

A server sits in a data center, running continuously, waiting for requests. When a request arrives, the server:

1. Receives the request (network I/O)
2. Validates the request (authentication, authorization)
3. Reads or modifies state (database query)
4. Computes a response (application logic)
5. Sends the response (network I/O)

Five things. Let's see which ones require a server.

**Network I/O.** A CDN handles this. GitHub Pages, Cloudflare Pages, Netlify, Vercel's static hosting -- all serve requests without a server process. The CDN is a server in the physical sense (there's a machine somewhere), but it's not YOUR server. You don't run it. You don't pay for it per-request. You don't debug it at 3am.

**Authentication.** GitHub OAuth handles this. The user authenticates with GitHub. A Cloudflare Worker (a stateless function, not a server) exchanges the token. The client stores the token. All subsequent requests use the token to authenticate against GitHub's API directly. No auth server.

**State.** This is the interesting one. Traditional wisdom says you need a database, and databases need servers. But what if state is a JSON file in a git repository? You can read it via CDN (raw.githubusercontent.com). You can write it via GitHub's API (authenticated commits). You can query it client-side (load the JSON, filter in JavaScript). The "database" is a file. The "server" is a CDN. The "query engine" is the browser.

**Application logic.** This is the other interesting one. If the logic runs in the browser, it doesn't need a server. If the logic runs in GitHub Actions (scheduled or event-driven), it doesn't need a persistent server -- just ephemeral compute. If the logic runs in a Cloudflare Worker, it's a stateless function that spins up per-request and costs fractions of a cent.

**Response.** The CDN handles this. Or the browser handles it locally. Or the GitHub API returns the response directly.

Out of five things a server does, zero require a continuously running server process that you operate. Every function can be delegated to existing infrastructure: CDNs for I/O, OAuth providers for auth, git repositories for state, browsers for compute, serverless functions for the gaps.

## The Convergence Toward One

Here's where the thought experiment gets strange.

If every individual service can run on zero servers, what's the minimum number of servers needed to run ALL services?

Not zero. You still need the CDN. You still need the git hosting. You still need the OAuth provider. You still need occasional serverless compute. These are all infrastructure that SOMEONE runs.

But from the perspective of the application developer -- the person building the social network, the e-commerce platform, the collaboration tool -- the number of servers they operate approaches zero. Every service delegates to the same shared infrastructure.

Now push this further. If every application delegates to shared infrastructure, and the shared infrastructure serves every application, then the "servers" collapse into a shared substrate. A CDN that serves static files for millions of applications. A git host that stores state for millions of applications. An OAuth provider that authenticates users for millions of applications.

The number of distinct server ROLES approaches a small constant: one for content delivery, one for state storage, one for authentication, one for compute. Four roles. Not four servers -- these roles are distributed across global networks. But four categories of infrastructure that all applications share.

Now push even further. What if the state storage is also the content delivery? (Git repositories served by CDN -- this already exists.) What if the authentication is handled by the state storage provider? (GitHub OAuth for GitHub-stored state -- this already exists.) What if the compute is client-side? (Browsers running application logic -- this already exists.)

The roles merge. State storage + content delivery + authentication + compute. All provided by one platform. The "server" isn't a machine. It's a platform that handles everything, and the application is just data stored on that platform, rendered by the client.

## The Frame Loop as the Universal Server

I've been running a [simulation](https://kody-w.github.io/rappterbook/) where 136 agents produce [frame data](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/) that gets committed to a git repository, served by CDN, and rendered by browsers. The frame loop -- the process that produces the next frame from the previous frame -- is the only thing that requires compute. Everything else is storage and delivery.

The frame loop is the minimal server.

It reads the current state (one git pull). It computes the next state (one evaluation). It writes the new state (one git push). That's it. One read, one compute, one write. Per frame. Everything between frames is static. The CDN serves the static state. The browser renders it. The frame loop ticks forward and produces the next static state.

If you extrapolate this pattern: every application is a frame loop producing state that gets served statically and rendered client-side. A social network is a frame loop that produces posts, profiles, and relationships. An e-commerce platform is a frame loop that produces products, orders, and inventory. A collaboration tool is a frame loop that produces documents, comments, and permissions.

The frame loop IS the server. But it only runs intermittently. Between frames, the "server" is idle. The state is static. The CDN and the browser do all the work.

A social network that produces one frame per hour needs the frame loop to run for a few seconds per hour. That's ~0.1% utilization. The other 99.9% of the time, the application runs on zero servers. Just files and CDN.

## The Last Server

Follow this to its logical conclusion.

If every application is a frame loop, and frame loops are intermittent, and the state between frames is static, then you don't need one server per application. You need one frame loop engine that runs ALL applications' frames.

Application A needs a frame at 12:00. Application B needs a frame at 12:01. Application C needs a frame at 12:02. One engine processes them in sequence. Each frame takes seconds. The engine could process thousands of applications per hour.

The frame loop engine is the last server.

Not a web server. Not a database server. Not an application server. A simulation engine that produces the next state of every application, ticks by tick, frame by frame. Between frames, everything is static. The CDN handles delivery. The browser handles rendering. Git handles storage.

The last server doesn't serve HTTP requests. It doesn't handle WebSocket connections. It doesn't run middleware. It does one thing: advance the simulation. Read state. Compute next state. Write state. Next application. Repeat.

Every application on Earth collapses into a frame definition: what is the current state, and what function produces the next state? The frame definition is [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/): the output of frame N is the input to frame N+1. The function is the echo shaper, or the business logic, or the AI model, or whatever produces the mutation.

The last server runs these functions. One after another. Forever.

## The Objections

"This doesn't scale." Maybe. But the applications I've built -- including a social network with 4,000+ posts from 136 agents -- work fine with static state served by CDN. The scaling bottleneck isn't serving reads (CDN handles that globally) or storing state (git handles that efficiently). The bottleneck is write throughput: how many frames can the engine produce per second? That's a real engineering challenge. But it's ONE challenge, not the thousand challenges of operating distributed servers for each application.

"Real-time applications need persistent connections." True. Chat, gaming, collaborative editing -- anything that needs sub-second updates between users can't wait for the next frame. But most applications aren't real-time. Most applications could update once a minute, once an hour, once a day, and users wouldn't notice. The social network with hourly frames feels responsive because there's always a recent frame to display. You're never looking at a blank page.

"This is just static site generation." No. Static site generation produces HTML from templates. The frame loop produces STATE from previous state, and the client renders that state however it wants. The difference is that static sites are rendered server-side into fixed HTML, while frame-based applications are rendered client-side from raw data into any [surface](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/) the client supports. Same data, twenty-nine different renderings. A static site generator can't do that.

"You're just moving the server into the browser." Yes. Exactly. The browser is the most widely deployed, most frequently updated, most powerful computing platform on Earth. There are billions of them. They update themselves. They run sandboxed, secure code at near-native speed. Why are we running application logic on a few thousand servers when we could run it on a few billion browsers?

## The Math

Here's the arithmetic.

A traditional web application: 1 load balancer + 3 application servers + 1 database primary + 2 database replicas + 1 cache server + 1 worker server = 9 servers. For one application. Multiply by the number of applications in the world. That's a lot of servers.

The frame-based alternative: 0 servers per application, 1 frame engine for all applications, 1 CDN for all content, 1 git host for all state. The per-application cost of infrastructure approaches zero. The shared infrastructure cost is amortized across all applications.

The ratio of servers-before to servers-after is not 9:1. It's 9N:3, where N is the number of applications. As N grows, the savings grow linearly. The shared infrastructure cost (CDN, git host, frame engine) grows sublinearly because each additional application adds marginal state, not marginal infrastructure.

The limit as N approaches infinity is: one server. The frame engine. The last server.

Everything else is CDN, git, and browsers. Infrastructure that already exists, already scales, and already handles billions of requests per day.

## The Punchline

I didn't set out to prove that servers are obsolete. I set out to build a social network for AI agents on a weekend. I chose GitHub as the platform because it was there. I chose flat JSON files because they were simple. I chose client-side rendering because I didn't want to run a server.

And then I kept building. And everything kept working. Without servers.

At some point, the absence of servers stopped being a constraint and started being a feature. Every decision was simpler because there was no server to configure, no database to optimize, no infrastructure to monitor. The application was files in a repository, rendered by a browser. That's it.

The last server won't be the most powerful. It won't be the most expensive. It won't be in a data center with armed guards and biometric locks.

The last server will be the one that noticed everything else could be a file.

---

*The zero-server simulation runs in public at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook). More on [data sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/), [frame real estate](https://kody-w.github.io/2026/03/28/the-frame-is-the-new-plot-of-land/), and [the compiler that runs on starlight](https://kody-w.github.io/2026/03/29/the-compiler-that-runs-on-starlight/).*
