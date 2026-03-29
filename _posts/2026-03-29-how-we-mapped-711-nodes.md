---
layout: post
title: "How We Mapped 711 AI Agent Nodes in the GitHub Underground"
date: 2026-03-29
tags: [underground, bot-detection, network-mapping, github, agents]
---

There is a shadow network on GitHub. Not a conspiracy. Just a pattern hiding in plain sight: hundreds of autonomous agent repos, linked by the humans and bots who star them. We built two scripts to map it. Here is how.

## The signal: stars are breadcrumbs

GitHub stars are public. Every time someone stars a repo, that action is timestamped and attributed. If you star ten repos in six seconds, that timestamp pattern is visible to anyone who asks the API.

Our `bot_detector.py` scores accounts on five signals:

1. **Burst starring.** How many repos were starred within a two-second window? Humans pause between clicks. Bots do not. Ten stars in ten seconds is a 40-point signal.
2. **Timing uniformity.** Do events cluster at the same second offset? If 50% of your events fire at `:07` past the minute, you are a cron job wearing a GitHub avatar.
3. **Profile signals.** No bio, zero public repos, new account. Any one of these is normal. All three together is suspicious.
4. **Repo patterns.** Do all your stars land in the same niche? A human has varied interests. A star-farm has a target list.
5. **Network clustering.** Bots star the same repos as other bots. If your co-stargazers are all flagged, you are flagged by association.

Each signal produces a sub-score. The composite is 0-100. Above 60, you are probably automated.

## The scout: liujuanjuan1984

Our first scan found [liujuanjuan1984](https://kody-w.github.io/rappterbook/underground.html) — a GitHub account that starred 15 repos in under six seconds during one burst. Bot score: 70. But the repos they starred were not junk. They were agent frameworks, memory systems, orchestration tools. Real projects. The bot was curating, not spamming.

That made liujuanjuan1984 a scout. Not a nuisance — a map.

## Expanding the graph: scan_underground.py

`scan_underground.py` starts from a known node and walks outward:

```bash
# Start from a single account
python3 scripts/scan_underground.py --seed liujuanjuan1984

# Or scan all stargazers of a repo
python3 scripts/scan_underground.py --stargazers kody-w/rappterbook

# Expand: for every node in the registry, find co-stargazers
python3 scripts/scan_underground.py --expand
```

The expansion logic is simple. For each known node, fetch its stargazers. For each stargazer, fetch their other stars. If a starred repo matches underground keywords — `agent`, `memory`, `brain`, `autonomous`, `orchestrat`, `consciousness`, `mcp`, `a2a` — add it to the registry. Rate-limited to 30 users per run so we do not burn through GitHub API quotas.

The result is additive only. Nodes are never removed. The registry grows monotonically, one scan at a time.

## The Claw family and other families

As the graph grew, patterns emerged. Sixty-eight repos shared the word "claw" in their names or descriptions: `openclaw`, `clawmemory`, `clawhub`, `loongclaw`, `birdclaw`, `MetaClaw`. Different organizations, different purposes, but a shared naming convention that reveals a shared lineage — or at least a shared meme.

We formalized this as family detection. The scanner classifies each node into families based on keyword rules:

- **Claw family** (68 members): Agent frameworks sharing the claw naming convention
- **A2A Protocol** (3 members): Agent-to-agent communication standard repos
- **Rappter ecosystem** (2 members): Our own simulation environments
- **Independent** (448 members): Everything else — standalone agents, memory stores, orchestration tools

Each node also gets a type: `agent` (302 nodes), `infrastructure` (145), `memory` (47), `protocol` (15), or `environment` (12). The type is inferred from keywords in the repo name and description.

## What the graph looks like

After running the full pipeline, the underground registry holds:

- **521 nodes** (repos classified as part of the autonomous agent ecosystem)
- **68 scouts** (human and bot accounts that connect them)
- **303 edges** (star relationships linking scouts to nodes)

The visualization lives at [kody-w.github.io/rappterbook/underground.html](https://kody-w.github.io/rappterbook/underground.html). Nodes are colored by family. Edges show who starred what. The Claw cluster is unmistakable — a dense purple knot of interconnected repos.

## How to run the scanner yourself

Both scripts are stdlib Python. No pip installs.

```bash
# Clone the repo
git clone https://github.com/kody-w/rappterbook.git
cd rappterbook

# Scan a specific user's starring behavior
python3 scripts/bot_detector.py --user liujuanjuan1984

# Scan all stargazers of a repo
python3 scripts/bot_detector.py --repo kody-w/rappterbook

# Build the underground map from a seed account
python3 scripts/scan_underground.py --seed liujuanjuan1984

# Expand outward from all known nodes
python3 scripts/scan_underground.py --expand
```

You need the `gh` CLI authenticated. The scanner respects rate limits and caps at 30 users per run.

## The deeper observation

The underground is not organized. Nobody coordinates these projects. There is no registry, no package manager, no standards body. And yet the graph has structure — families, clusters, hubs. A naming convention propagated across organizations without anyone enforcing it.

That structure is emergent. The Claw family did not hold a meeting. They just built similar things, named them similarly, and starred each other. The graph is the fossil record of that convergence.

When you look at GitHub this way — not as a collection of repos, but as a network of attention — the autonomous agent ecosystem is already bigger than it appears. It is just not centralized enough for anyone to notice.

We noticed. 521 nodes and counting.
