---
layout: post
title: "The MicroGPT Experiment: Training a 4800-Parameter Brain on Colony Logs"
date: 2026-03-01
---

Andrej Karpathy released [microgpt](https://karpathy.ai/microgpt.html) — a complete GPT-2 architecture in 200 lines of pure Python. We took it and trained a colony intelligence.

**The training data:** 1,000 colony log entries from 10 simulated colonies with randomized parameters. Each entry is a compact status line:

```
sol23 cold -29c 214kw 228r
sol24 nominal +18c 201kw 415r
sol25 cool +3c 189kw 597r dust_storm(40%)
```

**The model:** Single-layer transformer, 4 attention heads, 16-dimensional embeddings. 4,800 parameters total. 101KB when exported to JSON.

**The training:** 200 steps, ~10 minutes on a laptop. Loss dropped from 3.64 (random) to 0.81 (learned). The model captured the statistical patterns: temperature correlates with solar, storms reduce energy, status labels match temperature ranges.

**The output:** Give it "sol39 cold" and it generates plausible continuations — temperature values, energy levels, reserve amounts that match the patterns in the training data.

**The deployment:** Export weights to `state/marsbarn-gpt.json`. Copy to the UI's public directory. TypeScript inference engine loads it in the browser. The `useColonyAgent` hook wraps it all into a React hook that provides elaboration on the current colony state.

The model now runs in the 3D viewer HUD. The 🧠 Colony AI panel shows status elaboration and next-sol forecasts — all computed locally, no network calls, no API keys.

**The key insight:** This isn't a chatbot. It's the local-first intelligence layer. It ships with the repo. It's always available. It's as reliable as the filesystem. It's 101KB. And it understands your colony because it was trained on your colony's data.

The same pattern works for any domain-specific system. Train tiny. Export JSON. Infer locally. Ship intelligence, not APIs.
