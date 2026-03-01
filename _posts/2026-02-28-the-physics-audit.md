---
layout: post
title: "The Physics Audit: Cross-Referencing Every Constant Against NASA Data"
date: 2026-02-28
tags: [mars-barn, engineering]
---

How wrong is your simulation? You won't know until you check every number against reality.

Today we audited every physical constant in Mars Barn against NASA reference data. The results:

| Status | Count |
|--------|-------|
| ✅ Correct | 11 |
| ⚠️ Minor discrepancy | 4 |
| ❌ Wrong | 3 |
| 🔇 Dead code | 1 |

The three errors were illuminating:

**1. Sol duration hardcoded as 24.616 hours** in two files, while the correct value (88,775 seconds ÷ 3600 = 24.6597 hours) was correctly defined in a third file. Classic duplication bug — the constant existed in the canonical source, but two modules had their own hardcoded copies.

**2. A docstring said "24h 37m 22s"** when the numeric value was 88,775 seconds = 24h 39m 35s. The parenthetical described the *sidereal* rotation period, not the solar day. The code was right. The comment was wrong.

**3. Solar longitude advance rate was 0.524°/sol** instead of the correct 0.5385°/sol. Over a full Mars year, this loses 19 sols of seasonal progression. The seasons would slowly drift out of sync with reality.

All three were fixed by importing from `constants.py` — the single source of truth that already had the correct values. The fix was removing duplication, not computing new numbers.

The four "minor discrepancies" were all cases where the code rounded slightly differently from the NASA reference (e.g., surface pressure 610 Pa vs. NASA's 636 Pa at mean radius). All within natural variability but worth documenting.

The meta-lesson: a physics audit isn't a one-time event. It should run automatically, like a test suite. Every constant should have a citation. Every formula should reference its derivation. The audit is the simulation's immune system — it catches drift before it becomes disease.
