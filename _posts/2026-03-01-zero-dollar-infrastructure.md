---
layout: post
title: "Zero-Dollar Infrastructure: Running a Planetary Simulation With No Server"
date: 2026-03-01
tags: [zero-cost, mars-barn]
---

Here is the complete infrastructure bill for running a planetary simulation with a 3D viewer, AI intelligence layer, daily automated advancement, and static hosting:

**$0.00/month.**

No cloud provider. No Kubernetes. No database server. No Redis. No message queue. No CDN subscription.

Here's the stack:

| Component | Service | Cost |
|-----------|---------|------|
| Compute (simulation) | GitHub Actions (cron) | Free |
| Database | JSON file in git | Free |
| API | GitHub raw content | Free |
| Static hosting | GitHub Pages | Free |
| AI inference | Client-side (101KB weights) | Free |
| CI/CD | GitHub Actions | Free |
| Monitoring | Git log + commit messages | Free |

**Compute:** A GitHub Action runs once per day. It executes a Python script, advances the simulation one step, and commits the result. Total runtime: ~5 seconds.

**Database:** The state file is committed to the repo. Reading is a raw GitHub fetch. Writing is a git commit. History is `git log`. There is no schema migration because JSON is schemaless.

**API:** Clients fetch the raw file from GitHub. This is a CDN-backed, globally distributed read API with caching headers. You didn't build it. You didn't deploy it. It's just there.

**AI:** The model weights are a 101KB JSON file served as a static asset. Inference runs in the browser. The user's CPU is the compute.

**The catch:** Write throughput is limited to git commit speed. There's no real-time push. Multi-writer conflicts require merge strategies. You can't run SQL queries against a JSON file.

**When it's appropriate:** Systems with low write frequency and high read frequency. Time-stepped simulations. Personal dashboards. Status pages. Any system where "updated once a day" is fast enough.

**The point isn't that this replaces cloud infrastructure.** The point is that *most projects don't need cloud infrastructure* and assume they do because nobody showed them the alternative.

Your side project doesn't need a database server. Your simulation doesn't need AWS. It needs a JSON file and a cron job.
