---
layout: post
title: "Six Times the Test Was Wrong"
date: 2026-08-01
tags: [ai-agents, verification, testing, adversarial-review, methodology, measurement]
description: "I pointed eight agents at one 9,749-line file and told them to loop until perfect. They found 20 real defects. They also produced six false ones — and half of those were mine. The tests were wrong nearly as often as the code, and the only reason anyone knows is that somebody checked the assertion before fixing the implementation."
---

I pointed eight agents at one file and told them to loop until it was perfect.

The file was `voxel-world.html` — 9,749 lines, a Minecraft-style voxel sandbox that is one self-contained HTML document. Six agents owned disjoint regions and edited. Two were read-only critics whose only job was to be unimpressed.

They found 20 real defects. They also produced six false ones.

Three of the six were mine.

## The ledger

Here is what the false failures actually were.

**1. I asserted `window.vox` was an object.** It's a function. My check reported a failure against correct code on the very first run.

**2. I used `offsetParent === null` to mean "not visible."** CSSOM defines `offsetParent` as null for *any* `position: fixed` element. So a correctly rendered fixed overlay read as invisible. An agent dutifully changed a real CSS property to satisfy my broken assertion. I caught it and reverted.

That one didn't stay caught. The same trap burned a critic's entire test run. It survived inside another agent's focus-trap helper. And it was still sitting in the readiness check of *both* my tools an hour later — where, because `#loading` is `position: fixed`, the clause was trivially true and did nothing. Every "boot time" number I had quoted was measuring the wrong moment. **Five instances of one mistake.**

**3. My static test server sent `cache-control: no-store`.** I wrote it that way for clean reruns. It also makes offline caching untestable by construction. An agent caught it, checked what GitHub Pages actually sends for that file, and rebuilt the server to match production. Without that, the entire offline suite would have been measuring a fiction.

The agents produced the other three.

**4. A self-test assertion whose entire body was `async () => true`.** A placeholder, in a passing suite, reporting success forever. It was one of seven assertions the agent found that were green without being correct — three more were vacuous because they ran before any bot existed and compared nothing.

**5. A leak that wasn't.** An agent measured 9.4 leaked objects per round and had the numbers to prove it. Then it ran a zero-bot control group. The control climbed identically. It had been measuring chunk-streaming warmup. It retracted its own finding.

**6. Four failures from asserting `obs.self` when the real key is `obs.you`.**

## The one that matters most

The best finding of the run wasn't a bug. It was this:

**The ambient occlusion was real, correct, wired up, and completely invisible.**

An agent implemented per-vertex AO properly — baked at mesh-build time, zero draw calls. It verified its own work: 66.3% of quads carried per-vertex colour variation, `vertexColors: true` was set. It reported AO as a win.

The blind critic scored it **2 out of 10**. Corners rendered perfectly flat.

The cause: sun intensity 1.1 plus hemisphere 0.8 is about 1.9 irradiance, and with no tone mapping the highlights clip. Multiplying albedo by 0.7 barely moves a pixel already clamped at white. The data was in the buffer. It never reached the screen.

The builder measured the attribute. It never measured the pixel.

That is not a coding error. Every line was correct. It's a verification error — checking the thing you built instead of the thing the user sees.

## What this unlocks

One agent did the thing that actually settles it. It wrote a mutation harness: deliberately break each invariant in a live page, and confirm the suite goes red.

Nine mutations. Nine kills. Each turning exactly one assertion red, with no collateral failures.

That is the only evidence that a green suite means anything. Without it, "83 assertions passing" and "83 assertions that cannot fail" produce identical output.

## The cost

Adversarial verification is expensive. Two of eight agents wrote no production code at all. The critics took over an hour each and spent it clicking every control, throttling the CPU, and blind-ranking screenshots.

They also found the blocker.

The desktop UI was completely unclickable. A "Click to play" overlay at `z-index: 40` sat above a toolbar at 35. Every button resolved to the overlay. Clicking the gear granted pointer lock instead of opening settings. Three panels had no keyboard fallback; the only route in was fourteen tabs and Enter. The buttons rendered at full opacity the entire time, so nothing looked wrong.

It was in `git HEAD`. It is invisible in source. It is invisible in a screenshot. It only appears if you put a cursor on a button and click it.

## The implication

The lesson I keep relearning is not "write more tests."

It's that **the assertion is code too, and nobody reviews it.** Implementation gets scrutinized. Test code gets written once, goes green, and is never read again. So it rots silently, and a green suite becomes a claim nobody has audited.

Three rules I'd now apply anywhere:

**Check the assertion before you fix the implementation.** When something reports a failure, the test is a suspect. In this run, it was guilty 23% of the time.

**Measure the output, not the intermediate.** Verify the pixel, not the buffer. The user cannot see your vertex attributes.

**Prove your tests can fail.** Mutate the code on purpose. If the suite stays green, you don't have tests — you have decoration.

The agents were good. What made them trustworthy was that two of them were paid to disagree, and one of them retracted its own finding.
