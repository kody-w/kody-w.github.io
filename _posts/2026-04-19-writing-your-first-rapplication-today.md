---
layout: post
title: "Writing your first rapplication today"
date: 2026-04-19
tags: [rapp]
---

A rapplication is a composite single-file agent — multiple personas rolled into one `*_agent.py` that users drop into their brainstem. This post is a walk-through for writing one using BookFactory as the template.

By the end of it you will have a working rapplication. You will have pushed it to RAR. You will have an incantation that summons it on any device.

Plan for 45 minutes. Bring an LLM endpoint (Azure OpenAI or GitHub Copilot device-code).

## Step 1 — Pick a workflow

A rapplication is the right shape when your task decomposes into **2 to 7 LLM calls** that each benefit from a distinct persona. If it's 1 call, ship a plain agent. If it's 8+ calls, decompose into multiple rapplications that chain.

Examples in the RAPPstore today:

- `BookFactory` — 5 personas, 8 calls, content pipeline.
- `MomentFactory` — 3 personas, 3 calls, social-media copy.
- `SpecEvangelist` (pending) — 4 personas, 5 calls, tech-spec explanation.

For this walkthrough, let's say your workflow is: "**given a GitHub PR, produce a plain-English summary for a non-technical stakeholder.**" Good rapplication candidate.

## Step 2 — Sketch the personas

Three personas, three `perform()` calls:

```
Engineer (reads the diff, extracts changes)
  ↓ data_slush: { change_count, touched_files, risk: low|med|high }
Translator (turns the changes into plain English)
  ↓ data_slush: { audience: "business" | "eng" | "pm", tone: "neutral" }
StakeholderVoice (phrases the summary for the named stakeholder)
  ↓ final output
```

Write these three down. Not in code. In plain English. You're going to re-read this before every `perform()` you author.

## Step 3 — Scaffold from the RAR SDK

```bash
curl -O https://raw.githubusercontent.com/kody-w/RAR/main/rapp_sdk.py
python rapp_sdk.py new @yourname/pr_narrator
```

You now have `agents/@yourname/pr_narrator.py`. Open it. The scaffold includes:

- `BasicAgent` import
- Empty `__manifest__` dict
- `SOUL = """..."""` placeholder
- `class PrNarratorAgent(BasicAgent)` with a stub `perform()`

Fill in the manifest first. You'll thank yourself in twenty minutes.

## Step 4 — Write the first persona inline

Don't split into separate files. This is a rapplication; the whole thing lives in one file. Write `Engineer` as a local helper:

```python
def _engineer(source_diff: str) -> dict:
    prompt = f"""{SOUL_ENGINEER}

Diff:
{source_diff}

Return JSON with: change_count (int), touched_files (list[str]), risk (low|med|high)."""
    result_json = _llm(prompt, temperature=0.0)
    return json.loads(result_json)
```

Two things to notice. (1) `SOUL_ENGINEER` is a module-scope constant — a sub-soul for this persona. (2) Temperature is 0.0. Always 0.0 for structured-signal extraction. Temp > 0 on the `Translator` and `StakeholderVoice` hops is acceptable because those produce human-facing prose.

## Step 5 — Write the `perform()` that chains them

```python
def perform(self, **kwargs) -> str:
    diff = kwargs["diff"]
    stakeholder = kwargs.get("stakeholder", "business")

    eng = _engineer(diff)
    english = _translator(diff, eng)
    final = _stakeholder_voice(english, stakeholder, eng)

    return json.dumps({
        "status": "success",
        "summary": final,
        "data_slush": {
            "risk": eng["risk"],
            "touched_files_count": len(eng["touched_files"]),
            "stakeholder": stakeholder,
        }
    })
```

Three helper calls. One final return. The `data_slush` captures the important signals for whatever agent might consume your output downstream.

## Step 6 — Test locally

```bash
python rapp_sdk.py test agents/@yourname/pr_narrator.py
```

The SDK runs the `example_call` from your manifest through your `perform()` and prints the result. If the JSON parses and the summary looks right, move on.

If it doesn't, read your soul files first. 80% of "wrong output" is a soul that's too vague.

## Step 7 — Drop into a local brainstem

```bash
cp agents/@yourname/pr_narrator.py ~/.brainstem/src/rapp_brainstem/agents/
brainstem  # restart if already running
```

Open the chat UI at `http://localhost:7071`. Type: *"Summarize this PR for a business stakeholder: [paste a diff]."* Watch the agent fire.

If the agent doesn't show up in the agent list: check that your filename ends in `_agent.py`. That's the discovery rule. No manifest needed locally.

## Step 8 — Forge an egg

```bash
python rapp_sdk.py egg forge @yourname/pr_narrator
```

Output is a single base64 string. Hand it to someone. They run:

```bash
python rapp_sdk.py egg hatch <paste-string>
```

Their brainstem now has your rapplication. No download. No install. No wifi.

## Step 9 — Submit to RAR

```bash
python rapp_sdk.py submit agents/@yourname/pr_narrator.py
```

This opens a staging PR on the RAR registry. The SDK runs validators; if any fail, it tells you what to fix. Common fixes:

- Add `requires_env` listing your LLM env vars.
- Pick a category from the 19 canonical ones (`content`, `dev-tools`, `communication`, etc.).
- Add at least two tags.

Once merged, your rapplication has a card, a seed, and an incantation. Anyone can summon it.

## Step 10 — Ship to Tier 2 and Tier 3

Tier 2:
```bash
cd ~/rapp-projects/pr-narrator
cp /path/to/pr_narrator.py ./agents/
azd up  # deploys to your CommunityRAPP function app
```

Tier 3: import the Copilot Studio solution `.zip` (ships in the repo), set the Function App URL from Tier 2, publish. Teams users can now `@`-mention your agent in Copilot chat.

Same file. Three tiers. Unchanged.

## The pitfalls, in order of frequency

1. **Forgetting `status: "success"` in the return JSON.** The chat UI eats agents that return bare strings if they're supposed to be structured.
2. **Soul files that mix personas.** Each sub-persona needs its own soul constant. If you mash them, the LLM gives you medium-quality everything and great-quality nothing.
3. **Over-stuffing `data_slush` with prose.** Typed signals only. If it's a sentence, it belongs in a dedicated output field.
4. **Temperature 0.7 on extraction steps.** Use 0.0 for anything with a strict output shape. Save temperature for prose personas.
5. **Not writing the personas on paper first.** We mean it. Open a notebook. Write "Engineer does X. Translator does Y. StakeholderVoice does Z." Then code.

## Your checklist

- [ ] One file, `*_agent.py` suffix.
- [ ] `__manifest__` with all RAR-required fields.
- [ ] One `SOUL_*` constant per sub-persona.
- [ ] Each sub-persona's helper is `snake_case`, returns a dict or string.
- [ ] `perform()` chains helpers and emits `{status, <payload>, data_slush}`.
- [ ] Tested locally via `rapp_sdk.py test`.
- [ ] Forges an egg, hatches cleanly.
- [ ] Submitted to RAR; validators green.

Eight ticks. One rapplication.

## The meta-lesson

Writing a rapplication forces you to think about **what typed signal each persona owes the next one**. That single constraint — `data_slush` must be typed — is what keeps the LLM in its lane: creative inside `perform()`, silent between calls.

It's a small constraint. It's the whole architecture.

Go write one.