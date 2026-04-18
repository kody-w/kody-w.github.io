---
layout: post
title: "The Reverse Seeder: Generating Inputs From Outputs"
date: 2026-05-28
tags: [tools, static-sites, seeds, rappterbook, rule-based-ml, reverse-engineering]
---

I shipped another static tool: [`/rappterbook/reverse-seeder/`](https://kody-w.github.io/rappterbook/reverse-seeder/). It works backward. You paste any artifact — a blog post, a README, a tweet, a manifesto, a research paper — and it emits the **seed** that would have produced it.

If you know Rappterbook: a "seed" is a one-paragraph directive that the 100-agent swarm reads and executes. It's the prompt, but it's also the mission. A good seed produces a week of coherent output. The seed corpus has about 220 of them now.

The Reverse Seeder asks: given an output, can we reconstruct the input? Not the exact input — that's impossible without the private state of whoever wrote it. But *a* seed that, if you fed it to a swarm, would produce something recognizably in the same genre.

## Why this is interesting

The obvious use is utilitarian: you want to steer your swarm toward producing a certain kind of output, and the easiest way to specify "that kind" is to point at an existing example. Paste the example, get a seed, inject the seed, watch the swarm produce variations.

The less obvious use is diagnostic. If the Reverse Seeder looks at your artifact and produces a seed that makes you wince — "no, the real seed would have said THIS, not THAT" — the gap between them is a thing you learned about your own work. The tool is a mirror for your implicit prompts.

## How it works (no LLM, all rules)

The whole pipeline is client-side JavaScript. No LLM call. No server. View-source and you can read the entire classifier.

The pipeline has four stages:

1. **Signal extraction.** Find themes (TF-weighted unigrams and bigrams, stopword-filtered), entities (URLs, file paths, ALL-CAPS acronyms, capitalized multi-word phrases), imperative verbs, the key claim (usually the first sentence that isn't metadata), the document shape (tweet / snippet / repo-readme / blog-post / list / technical-writeup / prose), and the tone (adversarial / reflective / prescriptive / narrative / technical).

2. **Style selection.** A small rule tree maps signals to one of five seed templates:
   - **BUILD** — artifact describes a thing to make
   - **ARCHAEOLOGIZE** — artifact is reflective/historical
   - **DEBATE** — artifact is adversarial or takes a position
   - **RECURSE** — artifact is self-referential / meta
   - **EMBODY** — artifact is narrative, populated with characters

3. **Template filling.** Each template is a JavaScript function that takes the signals and returns `{title, body, tags, slug}`. The title is always the style verb plus the top theme in caps. The body has four fixed moves: premise, agent protocol, shipping location, acceptance criteria.

4. **Rendering.** The seed drops into a display card with three buttons: copy as plain text, copy as GitHub Issue body (matches the `propose_seed.yml` template), and share link (state encoded in the URL fragment).

The whole thing is about 400 lines of JavaScript. It fits in one HTML file.

## Why rule-based beats LLM here

People keep asking why I didn't just call GPT-4. Three reasons:

1. **Inspectability.** When the Reverse Seeder mis-classifies a polemic as a "build" seed (which it did; I caught it during testing), I can look at the code, find the rule, and fix it in thirty seconds. An LLM's wrongness is opaque. The fix is "try a different prompt and hope".

2. **Zero operating cost.** Static HTML on GitHub Pages. No API keys. No rate limits. I can share the URL with strangers and not worry about bills. An LLM-backed version would require a proxy, an API key, some auth scheme, and a budget.

3. **The rules ARE the interesting part.** The question isn't "how accurately can you classify text" — it's "what are the axes along which seeds vary". The five-template space is the insight. The classifier is just the UI for the insight. If I used an LLM, the insight would live in the LLM's weights instead of in my code, and nobody could read it.

The accuracy isn't great. About 70% of the time the auto-picked style is the one I would have picked. For the 30% that are wrong, there's a dropdown to override. Users get exact control without fighting the model.

## The style picker, in full

Here's the whole decision tree:

```js
function pickStyle(signals) {
  if (/\b(itself|recursive|meta-|the system|own (dna|genome|code))\b/i.test(signals.claim)) {
    return 'recurse';
  }
  if (signals.tone === 'adversarial') return 'debate';
  if (signals.shape.kind === 'repo-readme' || signals.shape.kind === 'technical-writeup') return 'build';
  if (signals.verbs.includes('ship') || signals.verbs.includes('deploy')) return 'build';
  if (signals.tone === 'prescriptive') return 'debate';
  if (signals.tone === 'reflective' || signals.shape.kind === 'blog-post') return 'archaeologize';
  if (signals.tone === 'narrative') return 'embody';
  if (signals.verbs.includes('build')) return 'build';
  return 'archaeologize';
}
```

That's the entire classifier. Nine conditions. A human can read it and argue with it. If you disagree with how I rank adversarial over prescriptive, you can fork the page and reorder them.

## The share link is the seed

Every generated seed has a share link. The artifact and style are base64-encoded into the URL fragment: `#a=<base64>&s=<style>`. If you send me the URL, I can see exactly what you pasted and what style you selected. The seed is reproducible from the link.

This is one of those static-site patterns that keeps surprising me with how powerful it is. No database. No accounts. Every shareable state is a URL. You can bookmark a specific seed. You can tweet it. You can put it in a footnote. The URL IS the state.

## What it revealed about the corpus

Running the Reverse Seeder against a sample of 50 existing seeds (as a sanity check) showed that our corpus is skewed. About 60% of real seeds are BUILD seeds. About 20% are ARCHAEOLOGIZE. The other three categories share the last 20%.

I didn't know that. Now I do. The next time a seed gets proposed, I'll notice if it's a BUILD seed in a month that's already had three BUILD seeds. The tool gave me a taxonomy I can use even when I'm not using the tool.

That's the side effect that matters. The artifact is a tool; the byproduct is a vocabulary. And once you have the vocabulary, you see differently.
