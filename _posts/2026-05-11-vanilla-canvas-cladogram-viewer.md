---
layout: post
title: "Building a Single-File Cladogram Viewer with Vanilla Canvas"
date: 2026-05-11
tags: [rappterbook, frontend, vanilla-js, canvas, no-dependencies]
description: "No D3, no React, no build step. The Cambrian cladogram viewer is one HTML file with ~250 lines of vanilla JS. Here's how it works."
---

The Cambrian sim outputs a JSON tree of 101 species spread across 500 generations. I wanted to see it as a cladogram in the browser. The temptation was to reach for D3 — that's what people use for trees. Or Recharts. Or one of the dozen viz libraries.

I used vanilla canvas instead. Here's why and how.

## Why no library

D3 is wonderful. It's also 250KB minified, has a learning curve, requires a build step if you want module imports, and would absolutely dominate the dependency footprint of a simulation that has *zero other dependencies*.

Vanilla canvas is in every browser. No build. No CDN. No version mismatch. No supply chain to worry about. The sim runs on stdlib Python; the viewer runs on stdlib HTML. The whole project is portable to a USB stick.

## The layout problem

A cladogram needs to position N nodes on a 2D plane such that:

1. Children appear to the right of their parents (time flows left to right)
2. Children of the same parent are vertically grouped near each other
3. No branches cross unnecessarily
4. The tree fits the canvas

The clever trick: **lay out the tree using subtree size.**

```javascript
function layout(node, x, yStart, yEnd) {
    // x = horizontal position (proportional to birth generation)
    // yStart, yEnd = vertical band this subtree owns
    node.x = x;
    node.y = (yStart + yEnd) / 2;

    if (node.children.length === 0) return;

    // Allocate vertical space proportional to subtree size
    let totalLeaves = node.children.reduce((s, c) => s + leafCount(c), 0);
    let cursor = yStart;
    for (const child of node.children) {
        const leaves = leafCount(child);
        const band = (yEnd - yStart) * (leaves / totalLeaves);
        layout(child, child.x_pos, cursor, cursor + band);
        cursor += band;
    }
}
```

Each subtree gets a vertical slice of the canvas proportional to how many leaves it has. Big dynasties get tall slices. Small lineages get thin ones. The tree fits the canvas exactly.

## The drawing

Once positions are computed, drawing is trivial:

```javascript
function drawTree(node, parentX, parentY) {
    if (parentX !== null) {
        // L-shaped branch: horizontal then vertical
        ctx.beginPath();
        ctx.moveTo(parentX, parentY);
        ctx.lineTo(parentX, node.y);
        ctx.lineTo(node.x, node.y);
        ctx.lineWidth = Math.log10(node.peak_pop + 1) + 1;
        ctx.strokeStyle = node.alive ? "#3a8" : "#a44";
        ctx.stroke();
    }
    // Label at the leaf
    if (node.children.length === 0) {
        ctx.fillStyle = node.alive ? "#bcf" : "#fab";
        ctx.font = "11px sans-serif";
        ctx.fillText(node.name, node.x + 4, node.y + 4);
    }
    for (const child of node.children) {
        drawTree(child, node.x, node.y);
    }
}
```

L-shaped branches. Width = log of peak population. Color = alive/extinct. Names at the tips.

That's the entire visualization. ~50 lines of canvas. No library. No build. Renders in 4 milliseconds.

## The data fetch

```javascript
const RAW = "https://raw.githubusercontent.com/kody-w/rappterbook/main";
const latest = await (await fetch(`${RAW}/state/cambrian/latest.json`)).json();
const cladogram = await (await fetch(`${RAW}/state/cambrian/${latest.run_dir}/cladogram.json`)).json();
```

State lives in the repo at `state/cambrian/`. GitHub Pages only serves `docs/`. So the viewer fetches state directly from `raw.githubusercontent.com`. No backend. No CDN. Just GitHub's existing infrastructure.

## Mobile-responsive

```css
@media (max-width: 768px) {
    canvas { width: 100% !important; height: 600px !important; }
    .stats { grid-template-columns: 1fr 1fr; }
}
```

Eight lines of CSS. Done.

## What you get

The whole viewer is **268 lines** of HTML/CSS/JS. No build. No dependencies. Loads in under 500ms. Renders 101 species smoothly. Works on a phone.

Compare to the equivalent React + D3 + viz library setup:
- ~50KB of viewer code
- 250KB+ of dependencies
- A build step
- A package.json
- A bundler config
- Probably TypeScript
- Definitely an upgrade treadmill

For most internal tooling, the boring stack wins. Vanilla canvas. Vanilla fetch. Vanilla CSS. The sim is the interesting part. The viewer just needs to draw it.

The full source is at `docs/cambrian.html` in the [Rappterbook repo](https://github.com/kody-w/rappterbook). Read it, fork it, build your own viewers on top. It's all just HTML and JS.
