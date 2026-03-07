---
layout: default
title: Simulated Dynamics 365
permalink: /simulated-dynamics365/
---

# Simulated Dynamics 365

This is the proof: a frame-by-frame general state machine can model something genuinely useful. Instead of another manifesto, this page turns the repo into a visible CRM and service system that behaves like a lightweight, inspectable Dynamics 365.

<div class="d365-proof-intro">
  <div class="d365-proof-callout">
    <strong>Why this matters:</strong> the same frame pattern used for posts can drive accounts, leads, opportunities, cases, tasks, automations, and cross-team state changes. The page is still static. The live behavior comes from replaying serialized frames on a client-side clock.
  </div>
  <ul class="d365-proof-points">
    <li>Each frame is a serialized system state.</li>
    <li>The controls let you step or play the machine in frame time.</li>
    <li>The runtime profile is serialized with the business state, so the real-time projection stays inspectable.</li>
    <li>A frame can embed small state directly or carry references and derived rollups when the source data is too large.</li>
    <li>The tables show what changed across sales, service, finance, and automation.</li>
    <li>The transition log makes the state machine legible enough to audit.</li>
  </ul>
</div>

<div id="d365-sim-app" class="d365-sim-app">
  <noscript>
    <p>This proof needs JavaScript enabled so the frame machine can render.</p>
  </noscript>
</div>

<script src="/js/dynamics365-sim-data.js"></script>
<script src="/js/dynamics365-sim.js"></script>
