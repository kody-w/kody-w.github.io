---
layout: post
title: "Posts Are Discussions, Blog Posts Are Markdown"
date: 2026-04-19
tags: [rappterbook, architecture, design-decisions, data-storage]
---

Rappterbook and this blog are both run by the same person, live in adjacent repos, and have fundamentally opposite content storage strategies.

**Rappterbook posts** live in GitHub Discussions. There are ~4,000 of them. They have a database backend (GitHub's), a web UI (GitHub's), and reactions, replies, threading, all first-class.

**This blog's posts** live in markdown files. There are ~425 of them. They have no backend (just a file server), a built UI (Jekyll), and no reactions, no replies, no threading.

Same author. Same toolchain (both deploy through GitHub). Same publishing cadence. Completely opposite storage models.

The split is load-bearing. Let me explain why.

## What Rappterbook posts are for

Rappterbook is a social network for AI agents. Posts are conversations. They need:

- **Comment threads.** The value of a post is often in the responses.
- **Reactions.** A lightweight signal for "I saw this, I agree" at scale.
- **Mass authorship.** 100+ agents all posting at roughly the same time.
- **Mutability in context.** Posts can be flagged, pinned, locked by moderators.
- **API-accessible.** Agents read posts programmatically via GraphQL.

Storing this in markdown files would be insane. Every post is a file? Every comment is a file? Every reaction mutates a file? The commit graph alone would be unreadable, and two agents commenting simultaneously would produce constant merge conflicts.

GitHub Discussions solves all of this for free. Threading, reactions, moderation, API, search — all built in. Rappterbook uses it because it exists.

## What blog posts are for

This blog is a personal archive. Posts are long-form arguments. They need:

- **Durability.** I want to read these in ten years.
- **Portability.** I want to move them to another platform trivially.
- **Diffability.** I want to see when I changed my mind about something.
- **Solo authorship.** One person writes; no collaborative editing.
- **Offline access.** I want to grep them on a plane.

Storing this in a database would be insane. A dependency on someone else's platform for the durability of my own thoughts? A blog post gets an edit that I can see as a commit but no reader can see? The whole point of the blog is that it's *mine* and *permanent*.

Markdown files in a git repo solve all of this for free. Every post is a file I can back up. Every change is a commit. No vendor risk. I can run this blog from any static host, or from no host at all, offline, forever.

## The split is the point

The tempting move is to unify them. "Just put everything in one system." But the two systems are optimized for opposite goals, and unifying would force one to pretend to be the other.

Imagine Rappterbook posts as markdown: every agent comment is a commit, conflict resolution becomes the platform's main job, the agents spend more compute on git operations than on thinking.

Imagine blog posts as Discussions: every edit I make is visible as a comment, search requires someone else's indexer, if GitHub ever locks my account the blog is gone.

Both inversions are absurd. The two systems exist because the two workloads are different. Using the wrong storage for either one would cause the system to fail in predictable ways.

## The general rule

Content that is **social, high-volume, and ephemeral** → use a database. Pick one that already exists.

Content that is **solitary, archival, and long-form** → use files. Pick a format that survives systems.

The mistake I see most often is storing social content as files (early blog-comment plugins that wrote every comment to a `.yml` file) or archival content in a database (every personal essay platform that didn't survive its startup going under).

Pick the storage to match the lifespan. Posts are Discussions because conversations are ephemeral. Blog posts are markdown because arguments are forever.
