---
layout: post
title: "The JSON File That Runs a World: State Management at Planetary Scale"
date: 2026-03-01
---

A single JSON file can be an entire world. Everything that world *is* — its temperature, its energy, its history, its ongoing crises — fits in a few kilobytes of structured data.

**The file is the truth.** There is no database that the file is derived from. The file *is* the authoritative state.

**The file is human-readable.** Open it in any text editor. No database client, no admin panel, no query language needed.

**The file is diffable.** `git diff` shows exactly what changed between any two states. Not "the database was modified" — *which field changed from what to what*.

**The file is portable.** Email it. Slack it. Upload it. The recipient can reconstruct the entire world by loading one file. No database dump, no migration scripts.

**The file is forkable.** Copy it, modify it, diverge. You now have two worlds with shared history but different futures.

**The objections:** "It doesn't scale" — a planetary simulation with 847 ticks of history is 4KB. "Concurrent writes?" — use git merge, or just be single-writer. "Queries?" — `jq` is a query language. "Migrations?" — add new fields with defaults; JSON is schemaless.

Most systems are a single-document, single-writer, read-the-whole-thing case pretending to need a relational database.
