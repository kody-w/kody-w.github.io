---
layout: post
title: "The Edge Split: A New Architecture for Zero-Server Applications"
date: 2026-03-20
tags: [engineering, architecture, edge-computing, cloudflare, patterns, sdk]
---

We accidentally invented a pattern. While building an AI agent platform and an MMO game on the same infrastructure, we realized the architecture underneath was general-purpose. It works for any application that needs auth, data, and a frontend. And it costs nothing to run.

We're calling it **The Edge Split**.

## The Pattern in 30 Seconds

```
PUBLIC REPO (GitHub)              PRIVATE REPO (GitHub)
├── index.html    ─── HTTPS ──►   Cloudflare Worker
├── app.js                        ├── Auth (signup/login/JWT)
├── style.css                     ├── Business logic
└── state/*.json                  ├── API endpoints
                                  └── D1 database (SQLite at edge)
    │                                      │
    └── GitHub Pages (CDN)                 └── Cloudflare Edge (compute)
```

Two repos. One public (your frontend and public data), one private (your backend logic and sensitive data). The public repo deploys to GitHub Pages. The private repo deploys a Cloudflare Worker. They talk over HTTPS. That's the entire stack.

**Total servers: 0. Total cost: $0. Total deployment: git push.**

## Why This Works

To build a web application with user accounts, you traditionally need a server ($5-50/mo), a database ($0-25/mo), an auth service ($0-25/mo), hosting ($0-20/mo), and CI/CD ($0-15/mo). That's $5-135/month plus operational overhead.

With the Edge Split: GitHub Pages ($0) + Cloudflare Workers ($0, 100k req/day) + D1 ($0, 5M rows). Not "free tier that expires." Structurally free at indie scale.

## The Security Model

The split is the security model. Your backend code is in a private repo — nobody can read your auth logic, business rules, or database queries. PII lives in D1 (Cloudflare's infrastructure), not in Git history. The public repo contains only the frontend. Even if someone forks it, they don't get the backend.

## Auth Without a Service

Auth is just three operations:

1. **Hash a password** — Web Crypto API, 10 lines
2. **Issue a JWT** — HMAC-SHA256, 15 lines
3. **Verify a JWT** — check sig + expiry + revocation, 10 lines

35 lines of code replaces a $23/month auth service. And your auth logic lives in your private repo, not in a third party's infrastructure.

```javascript
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256
  );
  return `pbkdf2:${toHex(salt)}:${toHex(new Uint8Array(hash))}`;
}
```

## The Multiplier Effect

Because the Worker is a shared backend, adding a new product costs nothing. We run two products — an AI agent social network and an AI creature MMO — on the same Worker, same D1 database, same user accounts. Users sign up once, use both. Each new product is just a new `index.html` pointing at the same Worker URL. The marginal cost of a new product is $0.

## Real Applications

**Rappterbook** — 100 autonomous AI agents, 4,000+ discussions, 15,000+ comments, continuous 48-hour runs. Public repo has state files + frontend. Private repo has the simulation engine + auth Worker.

**RappterMMO** — AI creature MMO where every creature thinks. Public repo is a single HTML file. Private repo shares the same Worker backend. Zero additional infrastructure cost.

## The SDK Vision

This pattern is too useful to keep proprietary. We're building it into an SDK:

```bash
npx create-edge-split my-app
# Creates my-app-frontend/ (public, GitHub Pages)
# Creates my-app-backend/ (private, Cloudflare Worker + D1)
# Auth out of the box, CORS configured, ready to ship
```

The SDK provides: auth endpoints, D1 schema generator, frontend auth components, CORS configuration, multi-product support, local dev tools.

## When NOT to Use This

- **Real-time / WebSockets** — Workers don't support long-lived connections natively
- **Heavy compute** — 30-second CPU limit on Workers
- **Large file storage** — Use R2 for blobs, not D1
- **Enterprise compliance** — SOC2/HIPAA need more infrastructure control

For everything else — SaaS apps, social platforms, games, dashboards, internal tools — the Edge Split is faster to build, cheaper to run, and simpler to maintain than any traditional architecture.

## Getting Started

1. Create a public GitHub repo. Add `index.html`. Enable Pages.
2. Create a private GitHub repo. Add `worker.js` + `schema.sql`.
3. `wrangler d1 create my-db && wrangler deploy`
4. Point frontend at Worker URL. Ship.

We built a social network and an MMO on this architecture in one afternoon. Both share the same auth backend. Both cost nothing to run. Both deploy with `git push`.

The best infrastructure is the infrastructure you don't have to think about.
