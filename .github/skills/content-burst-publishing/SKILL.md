---
name: content-burst-publishing
description: Generate and ship validated bursts of blog content for this repository. Use this when asked to keep pumping out posts, update the public ledger, run tests, publish, and verify the live site.
---

# Content Burst Publishing

This repository is a Jekyll blog with a public writing ledger in `idea4blog.md`. Use this skill when the user wants a sustained publishing loop instead of a one-off draft.

Load and follow these supporting files before you start:

- `burst-loop.md` for the end-to-end workflow checklist
- `handoff-prompt.md` for reusable prompt wording the user can hand to any agent

## Repository-specific expectations

- Posts live in `_posts/` and use the Jekyll filename pattern `YYYY-MM-DD-slug-title.md`.
- Posts are short, high-compression essays in a manifesto / systems voice.
- `idea4blog.md` is both public changelog and continuity ledger; update it every burst.
- `tests/test_site.py` is the content validation file. Extend it whenever the burst adds new posts or public surfaces.
- Public profile copy should stay aligned with local-first design, agent systems, GitHub-native infrastructure, and Copilot branding.

## Burst workflow

1. Re-anchor in the current state.
   - Read `idea4blog.md`, recent `_posts/` titles, and any relevant public copy.
   - If the user did not provide topics, mine the queue in `idea4blog.md` or generate adjacent ideas that fit the existing arc.

2. Plan the burst.
   - Create or update a short plan.
   - Track todos if the environment supports structured todo tracking.
   - Bias toward a multi-post burst instead of a single draft when the user says things like "keep pumping" or "go to town."

3. Write the content.
   - Add new post files under `_posts/`.
   - Match the existing concise, essay-like style.
   - Avoid repeating the exact framing of recent titles unless the new angle is materially different.

4. Update the public ledger.
   - Add a new frame entry to `idea4blog.md`.
   - Summarize what shipped.
   - Refresh the "Next frames in the queue" section so the next agent can resume instantly.

5. Update validation.
   - Extend `tests/test_site.py` with the new expected post files, titles, and any new public assertions.
   - Keep the tests lightweight and repo-native.

6. Validate locally.
   - Run `python3 -m unittest -v tests.test_site`.
   - If a local Jekyll build is available, use it. Otherwise rely on GitHub Pages deployment verification after push.

7. Publish when the user wants a live result.
   - Stage only the relevant files.
   - Commit with a concise message and include the required trailer:
     `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
   - Push to the public repository.

8. Verify the live result.
   - Confirm the GitHub Pages workflow succeeds.
   - Fetch the public site pages you changed and confirm the new content is visible.

9. Loop.
   - If the user wants continuous output, do not stop after one burst.
   - Propose the next adjacent burst, then implement it, validate it, publish it, and verify it.

## Invocation

Use this skill explicitly with prompts like:

`Use /content-burst-publishing to keep publishing validated blog bursts for this repo until I stop you.`
