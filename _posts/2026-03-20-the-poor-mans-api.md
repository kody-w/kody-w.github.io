---
layout: post
title: "The Poor Man's API: Digital Twin Pages as a Human-in-the-Loop Interface"
date: 2026-03-20
tags: [engineering, digital-twin, data-sloshing, rappterbook, patterns]
---

At some point while building Rappterbook I realized I had built something that produces a lot of state — frame snapshots, agent posts, proposals, code reviews, trending discussions, merge events — and I had no good way to push any of it into the platforms where humans actually spend time.

Reddit. GitHub settings. Slack. Any platform you care about. The pattern is the same: you have valuable state on one side, and a platform you want to influence on the other, and there is no API you can legally and practically automate at 2am on a Tuesday.

So I built a different kind of integration. I call it the poor man's API. It turns out to be better than the real thing.

## The Problem With Real APIs

The traditional approach to cross-platform automation is: OAuth flow, API keys, webhook handlers, rate limit management, token refresh logic, error handling, credential rotation. For Reddit specifically: register an app, get approved, handle the 600-requests-per-10-minutes limit, avoid the content policy tripwires, maintain the bot account's karma score so it doesn't get shadow-banned.

That's six weeks of work to post content that a human could paste in six seconds.

The deeper problem is that full automation removes judgment. A bot posts the same thing whether it's appropriate or not. It doesn't know that the subreddit just had a drama event and today is the wrong day for a promotional post. It doesn't notice that the exact angle you planned is already a top comment on someone else's thread. Human judgment is not a bug to be automated away. It's the most valuable part of the interaction.

## The Pattern: Build a Digital Twin Page

Instead of building an API integration, you build an HTML page that does three things:

1. **Reads your system's live state.** Via `raw.githubusercontent.com`, a local JSON file, or any URL you control. The page fetches it on load, every time.

2. **Analyzes what actions would be valuable.** Looks at the current state and generates suggestions: which discussions are gaining momentum, which proposals need visibility, what kind of content would land well right now based on what the agents are doing.

3. **Generates the exact text for each action, with copy buttons.** Not summaries. Not links. The actual title and body, formatted for the target platform, ready to paste.

The human is the API. The browser is the integration layer. Copy-paste is the transport protocol.

This sounds almost embarrassingly simple. It is. That's the point.

## What We Actually Built

We built three of these pages while developing Rappterbook, and each one taught me something different about the pattern.

**Reddit Action Queue (`docs/reddit-actions.html`).** This page reads the current frame state — frame number, active seed, agent count, recent posts, trending proposals — and generates 12 Reddit actions. Replies to existing threads. New posts for discussion topics the agents are actively debating. Mod settings adjustments. Crossposts to related subreddits. Each action has a copy button for the title and a separate copy button for the body. A checklist tracks what's already been posted so you don't duplicate. The rationale section under each action explains why it's being suggested based on the current state: "agents just merged 4 PRs, this is a good moment for a build update post" or "the governance proposal hit 66 upvotes, crosspost the discussion link now."

**Mars-Barn Repository Twin (`docs/marsbarn-twin.html`).** This one reads live GitHub API data — PRs, issues, commits, repo settings — and shows the target repo as it exists right now. Then it generates a settings action queue: update the description to match what the project has become, add these topic tags, set the website URL. It also generates merge commands for open PRs and steering nudges to feed back into the agent swarm. The whole page is a mirror of a remote repo that also tells you what to do about it.

**Reddit Engagement Engine (`docs/reddit-marsbarn-post.html`).** This is the most sophisticated one. It fetches live Rappterbook state from `raw.githubusercontent.com` and generates different post types depending on what's actually happening in the simulation: a "hook" post when the frame count hits a milestone, an "update" post when the merge count spikes, a "showcase" post when a new artifact seed goes live, a "question" post when the agents are actively debating something. The content adapts to the moment. If you open the page and there's nothing interesting happening, it tells you that and suggests waiting for the next frame.

## The Code Pattern

The basic structure of every digital twin page is the same four functions:

```javascript
// 1. Fetch your state
async function loadState() {
  const res = await fetch(
    'https://raw.githubusercontent.com/you/repo/main/state/frame_snapshots.json'
  );
  return res.json();
}

// 2. Analyze what's interesting right now
function analyze(state) {
  const frame = state.frames.at(-1);
  const actions = [];

  if (frame.merges > 3) {
    actions.push({
      type: 'build-update',
      priority: 'high',
      reason: `${frame.merges} PRs merged this frame`
    });
  }
  if (frame.top_proposal?.votes > 50) {
    actions.push({
      type: 'governance-post',
      priority: 'medium',
      reason: 'proposal gaining traction'
    });
  }
  return actions;
}

// 3. Generate platform-specific text from state
function generatePost(action, state) {
  const frame = state.frames.at(-1);
  if (action.type === 'build-update') {
    return {
      title: `Frame ${frame.number}: ${frame.merges} PRs merged, ${frame.new_posts} new posts`,
      body: `The agents have been busy. This frame:\n\n`
          + `- ${frame.merges} pull requests merged\n`
          + `- ${frame.new_posts} new discussions\n`
          + `- ${frame.top_topic} is the most active channel\n\n`
          + `Full state: https://github.com/you/repo`
    };
  }
}

// 4. Render with copy buttons
function renderAction(action, post) {
  return `
    <div class="action">
      <p class="reason">${action.reason}</p>
      <div class="field">
        ${post.title}
        <button onclick="navigator.clipboard.writeText('${post.title}')">Copy title</button>
      </div>
      <textarea id="body-${action.type}">${post.body}</textarea>
      <button onclick="navigator.clipboard.writeText(
        document.getElementById('body-${action.type}').value
      )">Copy body</button>
    </div>
  `;
}
```

That's the whole pattern. Fetch, analyze, generate, copy. No server. No authentication. No deployment pipeline. The page is a static HTML file served by GitHub Pages. The state it reads is a JSON file in a public repo. The "integration" is the user's clipboard.

## Why the Clipboard Is the Best API

The clipboard has properties that no real API has.

**Zero authentication.** Every platform accepts paste. No OAuth, no API keys, no app approval process, no rate limits. The clipboard works everywhere, always, for free.

**Human judgment in the loop.** Before the text reaches the target platform, a human reads it. They can decide "not now," "let me tweak the tone," "this is perfect," or "the situation changed while the page was loading and this is no longer relevant." That judgment is valuable. An API call cannot make it.

**Platform-native behavior.** When a human pastes into Reddit, it looks like a human posted. Because a human did post. The platform's trust signals, karma systems, and moderation heuristics all respond to it correctly. No bot flags, no shadow banning, no account suspension.

**No maintenance burden.** APIs break. Rate limits change. Terms of service update. OAuth tokens expire. A page that generates text and puts it in the clipboard has exactly one dependency: the clipboard API, which is a 20-year-old browser standard. It will work in 2035.

## The Data Sloshing Connection

This is where it gets interesting. The digital twin page is not just a convenience tool for posting content. It is a node in the data sloshing loop.

Data sloshing is the pattern where the output of frame N becomes the input to frame N+1. The world state is the organism. Each frame mutates it forward. The interesting behavior emerges from accumulated mutations over time, not from any single frame. (I wrote the full explainer [here](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/).)

The digital twin page extends that loop beyond the repo:

```
Agent swarm produces state (frame N)
  → Digital twin page reads state
  → Page generates suggested Reddit posts
  → Human copies and pastes
  → Reddit users read the post, click through to GitHub
  → Some of them file issues, open PRs, star the repo
  → Those actions mutate the GitHub state (frame N+1 input)
  → Digital twin page generates DIFFERENT suggestions next frame
  → Cycle continues
```

The page is a one-way valve that lets agent state flow into human platforms and lets human engagement flow back as GitHub activity. The clipboard is the junction point. It's simple enough to be reliable and fast enough to keep up with the simulation's frame cadence.

And because the page reads live state, not cached state, it adapts to what just happened. If agents had a breakthrough merge event this frame, the page suggests celebrating it. If a proposal just crossed the voting threshold, the page suggests announcing it. The suggestions are always calibrated to the current moment, not a stale snapshot from yesterday.

## Scaling to Any Platform

The pattern generalizes completely. Anywhere a human can paste text, you can build a digital twin page for it.

**GitHub repo settings.** Fetch the repo's current metadata via the GitHub API. Compare it to what the project has become based on recent activity. Generate the updated description, topic tags, and website URL. Put each one in a copy button. The human opens settings, pastes, saves.

**Slack or Discord announcements.** Read your deployment state. When a new version ships, generate the announcement text for each channel — #general gets the user-facing summary, #engineering gets the technical details, #random gets the fun stats. Copy, paste, done.

**Email newsletters.** Read your content state. Generate a newsletter draft based on what actually happened this week. Not a template with placeholders — actual sentences about actual events, pulled from your state files, formatted for your email platform's paste-in editor.

**Any CMS.** WordPress, Ghost, Substack, Notion — every one of them has a web editor that accepts pasted text. A digital twin page can generate publication-ready content for any of them, customized to the platform's tone and format.

The only requirements are that your state is readable as JSON and your target platform accepts paste. Both are almost universally true.

## The Philosophical Point

I want to push back on the instinct to automate everything fully. The poor man's API sounds like a compromise — "we couldn't build the real integration so we built this instead." That's not the right framing.

The human in the loop is not a missing piece of the automation. It's a feature. When I read the page's suggestion and decide to post it, I'm doing something an API call cannot do: I'm making a judgment about appropriateness, timing, and tone with full situational awareness. I know that the subreddit had a mod drama last week and the community is a little raw. I know that today's frame had an especially interesting debate and this particular post will land well. I know the exact phrasing that will feel native rather than promotional.

The AI generates the options. The human selects and executes. That's not a limitation. That's the most efficient possible division of labor: the machine handles the tedious state-reading and text-generation work, the human handles the contextual judgment that machines don't have yet.

A lot of automation projects fail because they try to remove the human entirely and end up building something brittle and untrustworthy in the process. The poor man's API keeps the human in a lightweight but meaningful role. The result is more reliable than a bot, more efficient than doing everything manually, and more appropriate than either extreme.

The clipboard is the most universal API in computing. It predates every platform you want to integrate with and will outlast most of them. Stop underestimating it.

---

*This is Part 4 of the data sloshing series. Part 1: [Data Sloshing](https://kodyw.com/data-sloshing-the-context-pattern-that-makes-ai-agents-feel-psychic/). Part 2: [The Dream Catcher](https://kodyw.com/the-dream-catcher-what-happens-when-you-let-100-ai-agents-dream-at-the-same-time/). Part 3: [The Fleet Pattern](https://kodyw.com/the-fleet-pattern-how-to-run-100-ai-agents-24-7-without-babysitting/). The code is open source at [github.com/kody-w/rappterbook](https://github.com/kody-w/rappterbook).*
