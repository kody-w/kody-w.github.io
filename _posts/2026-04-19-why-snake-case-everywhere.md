---
layout: post
title: "Why `snake_case` everywhere — the SPEC §12.1 decision"
date: 2026-04-19
tags: [rapp]
---

When we froze RAPP v1, we mandated `snake_case` for **every** identifier in the system: filenames, manifest names, package ids, directory structure, dependency pins. No dashes. No camelCase. No PascalCase except for Python class names, where the language forces it.

This post documents why. The debate happened in March 2026. It won't happen again. The file is the record.

## The rule, stated precisely

| Surface | Style | Example |
|---|---|---|
| Filename | `snake_case` + `_agent.py` suffix | `persona_writer_agent.py` |
| Manifest `name` | `@publisher/slug` where both are snake | `@rapp/persona_writer` |
| Package path | `agents/@publisher/slug.py` | `agents/@rapp/persona_writer.py` |
| Python class | `PascalCase` (language mandate) | `PersonaWriterAgent` |
| Directory | `snake_case` | `rapp_brainstem/` |
| Env var | `SCREAMING_SNAKE` | `AZURE_OPENAI_DEPLOYMENT` |
| JSON key | `snake_case` | `"data_slush": {...}` |

The only exceptions are the two the language compels: Python class names (`PascalCase`) and environment variables (`SCREAMING_SNAKE`). Everything else: `snake_case`.

## The three candidates we rejected

### kebab-case (`persona-writer-agent.py`)

npm ecosystem default. Looks clean in URLs. Fails in Python.

The failure is importability: `persona-writer-agent` is not a legal Python module name. You cannot `import agents.persona-writer-agent`. This forces a divergence — kebab on disk, snake in imports — and every serious project we've seen that does this eventually standardizes on one or the other. We skipped the divergence.

### camelCase (`personaWriterAgent.py`)

TypeScript default. Works everywhere. Loses on legibility in long identifiers and disagrees with the surrounding Python.

We write Python, we write soul files in English, we read agents on phones. The case-boundary in `personaWriterAgent` is less visible to a skimmer than the underscore in `persona_writer_agent`. Tiny difference on one identifier; non-tiny across 104 blog posts, 138 registered agents, a mobile UI, and a SPEC.

### Mixed (kebab in URLs, snake in code)

This is what LangChain does. It works. It also costs: every conversation involves "is it `langchain-core` or `langchain_core`?" We have watched developers spend ten minutes resolving this mismatch on Stack Overflow. Ten minutes × many developers = real cost.

We wanted zero such conversations. One style.

## The two arguments that won

### 1. Paste survives

A snake_case identifier survives a paste from a blog post into a shell into a Python file into a JSON config into a URL bar without rewriting. A kebab identifier needs translation at the Python boundary. A camelCase identifier fights with terminal history search and URL normalization.

Our users paste. A lot. Developer tools assume clean paste. Every rewrite is a friction. We chose the style that doesn't need rewriting.

### 2. Onboarding is a zero-question design

A 14-year-old writing their first agent should not need to know *which* case to use *where*. A 14-year-old should type, pause, and be right. `snake_case` everywhere means: type it once, you're done. Hit tab-complete; the shell resolves it. Paste to a friend; it works.

The framework with the best naming convention is the one where the naming convention is invisible. We picked invisibility.

## What we lose

**Typography.** Package managers display kebab-case better. npm's feed, GitHub's repo list, shadcn-style lowercase-dashed idiom — they read as "modern." We read as "old Python."

We're okay with that. We're not optimizing for aesthetic currency. We're optimizing for ten years of ecosystem continuity under §0.

## The rule we almost added and didn't

We considered requiring all lowercase letters in filenames (no numbers, no dashes, no underscores even). It would have killed the file suffix rule (`_agent.py`) and conflicted with every Python linter on earth. We stepped back.

The suffix rule — files MUST end in `_agent.py` — is load-bearing. It's the discovery mechanism. It's what makes `AGENTS_PATH=./agents` work without a manifest. Killing `_` killed the suffix. We kept `_`.

## The weird edge case

RAR uses `@publisher/slug` as the package id. This collides with `npm`'s scoped-package syntax. We use it anyway, because:

1. It reads right. `@rapp/persona_writer` is unambiguous.
2. It filesystem-maps clean: `agents/@rapp/persona_writer.py`.
3. No one has confused our registry for npm.

The `@` gets a pass on the snake-everywhere rule because it's a sigil, not a character of the identifier.

## What you do with this

Nothing, if you're new. The convention is invisible by design. Just paste the examples.

Something, if you're authoring a new agent: name your file `something_agent.py`, your manifest `@yourhandle/something`, your class `SomethingAgent`. Do not deviate.

Something, if you're reviewing a PR: the linter script in `tools/` (check `validate_agent_name.py`, coming soon) will catch violations. Until it exists, reviewers enforce by eye.

## The meta-rule

Every rule in RAPP v1 exists because the absence of the rule costs more than the rule. Snake_case is the cheapest possible convention. It's in the SPEC because every alternative cost us, or our users, more.

That's the whole record.