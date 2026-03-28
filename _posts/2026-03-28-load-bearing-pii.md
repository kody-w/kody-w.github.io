---
layout: post
title: "Load-Bearing PII: How Structural Analysis Solves Data Privacy"
date: 2026-03-28
tags: [load-bearing-data, pii, privacy, gdpr, data-architecture, wildfeuer-maneuver]
description: "Load-bearing analysis and PII scanning are the same operation viewed from opposite directions. Strip identity, keep architecture. The skeleton is the product."
---

# Load-Bearing PII: How Structural Analysis Solves Data Privacy

**Kody Wildfeuer** -- March 28, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## Two Scans, One Operation

[Load-bearing analysis](https://kody-w.github.io/2026/03/28/load-bearing-data.html) asks: **which data do other systems depend on?** You scan a dataset, build a reference index, count the downstream dependents for each field, and produce a score. High score means the data carries structural weight. Change it and things break. Low score means it is decorative. Change it and nothing notices.

PII scanning asks the opposite question: **which data identifies a person?** You scan a dataset, classify each field against known patterns (emails, phone numbers, names, IP addresses, biometric identifiers), and flag everything that could trace back to an individual.

These look like different problems. One is about architecture. The other is about privacy. But run both on the same dataset and something interesting falls out.

---

## The 2x2 Matrix

Every field in a dataset lands in one of four quadrants:

| | Load-bearing | Not load-bearing |
|---|---|---|
| **PII** | ANONYMIZE (pseudonym) | STRIP |
| **Not PII** | KEEP | KEEP (or strip if unused) |

**Quadrant 1: PII + Load-bearing.** A user's email address that serves as the foreign key across twelve tables. You cannot delete it -- too many downstream references would break. You cannot keep it -- it identifies a person. Solution: anonymize it. Replace it with a consistent pseudonym (`user_7f3a@example.com`) that preserves the referential integrity while removing the identity. Every table that references this email gets the same pseudonym. The joins still work. The person is gone.

**Quadrant 2: PII + Not load-bearing.** A user's bio field that no other system references. Nobody's query joins on bio text. Nobody's downstream process depends on its content. Solution: strip it entirely. Zero downstream impact.

**Quadrant 3: Not PII + Load-bearing.** A product category ID that forty tables reference. It identifies no person. It carries enormous structural weight. Solution: keep it untouched. It is pure architecture.

**Quadrant 4: Not PII + Not load-bearing.** An internal debug comment that no system reads and no person can be identified from. Solution: keep it or strip it -- either way, nobody cares.

The matrix is the decision engine. Every field gets classified on two axes. The classification determines the action. No human judgment required for the common cases. The edge cases -- a username that looks like a real name but might be a handle, a location field that could be PII or could be a data center name -- surface naturally as fields where the PII classifier is uncertain, and those are the ones worth human review.

---

## The Skeleton

The output of this process is what I call the **skeleton**: the pure application logic of a dataset with all personal data either stripped or anonymized.

The skeleton preserves:
- Every table, every column, every relationship
- All foreign key references (using pseudonyms where the original was PII)
- All non-PII data exactly as it was
- The full dependency graph -- which systems read which data, how the joins work, where the weight is

The skeleton removes:
- Every field that identifies a real person
- Every field that could be combined with other fields to identify a person
- Every piece of decorative PII that carries no structural weight

What remains is the architecture. The schema. The patterns. The load paths. A structural engineer's X-ray of the building with all the tenant names removed. You can study the structure without knowing who lives there.

---

## Why Skeletons Matter

Five applications, each significant on its own:

### 1. Open-Sourcing Proprietary Systems

You built a system. It works well. You want to share the architecture -- the schema design, the data flow patterns, the integration approach -- without exposing your users' data. Today this requires manually reviewing every file, every field, every value. Miss one email address and you have a data breach.

With the skeleton approach: run the dual scan, generate the skeleton, publish it. The architecture is visible. The people are gone. The process is automated and auditable. You can point to the load-bearing scores and the PII classifications and say: "Here is the formal proof that no personal data survived."

### 2. Training Data

Machine learning needs data. Good data. Lots of it. But training on raw production data exposes the individuals in it. Differential privacy adds noise to the outputs. Synthetic data generates fake records. Both work but both have tradeoffs -- noise degrades model quality, synthetic data may not capture real-world distributions.

Skeletons offer a third option: real data with real distributions and real structural relationships, but with all personal identifiers stripped or pseudonymized. The model learns the patterns -- how users flow through the system, which paths are common, which are rare -- without ever seeing a real person. The load-bearing analysis ensures the structural relationships that the model needs to learn are preserved. The PII scan ensures the identities are not.

### 3. GDPR and CCPA Compliance

Both regulations require organizations to know what personal data they hold and why. The "why" is the hard part. GDPR Article 5(1)(c) requires data minimization: collect only what is necessary. But "necessary" is a judgment call -- necessary for what?

Load-bearing analysis makes it precise. A field is necessary if other systems depend on it -- if its load-bearing score is above zero. A PII field with a load-bearing score of zero is, by definition, not necessary for any downstream system. It can be deleted without affecting any functionality. That is the strongest possible argument for data minimization: not "we think we don't need it" but "we can prove nothing depends on it."

Conversely, a PII field with a high load-bearing score is necessary -- but it can be anonymized rather than stored in the clear. The load-bearing score tells you that you need *something* in that field for referential integrity. The PII classification tells you the current value is personal data. The solution writes itself: replace the value with a pseudonym that preserves the reference without preserving the identity.

### 4. Digital Twins

The [digital twin pattern](https://kody-w.github.io/2026/03/28/the-digital-twin-deployment-pattern.html) publishes content in two tiers: a private tier with full detail, and a public tier that is sanitized for external consumption.

Skeleton generation automates the boundary between tiers. The private twin holds the full dataset -- PII and all, load-bearing and decorative. The public twin holds the skeleton: same architecture, same structure, same patterns, zero personal data. The dual scan draws the line automatically. No manual review of what is safe to publish. The matrix decides.

### 5. Data Sharing Between Organizations

Two hospitals want to share patient flow data to improve emergency room staffing models. The data is structurally rich -- timestamps, department transfers, procedure codes, wait times, outcomes. It is also saturated with PII -- patient names, dates of birth, medical record numbers, insurance identifiers.

Today this requires a data sharing agreement, legal review, de-identification by a qualified expert, and ongoing monitoring. The process takes months.

With skeleton generation: run the dual scan on each hospital's dataset. The load-bearing analysis identifies which fields the staffing model actually needs (the structural relationships between timestamps, departments, and outcomes). The PII scan identifies which fields contain personal data. The matrix determines the action for each field. The output is two skeletons that can be merged without legal review because they contain no personal data -- and without structural loss because the load-bearing fields are preserved.

---

## The Implementation

The implementation is straightforward. Around 100 lines of Python stdlib, no dependencies.

**Pass 1: Build the global reference index.**

Scan every file in the dataset. For each field, record every file where that field's value appears. This is the same reference index used in [load-bearing analysis](https://kody-w.github.io/2026/03/28/load-bearing-data.html) -- the number of files referencing a value IS the load-bearing score.

```python
# Pseudocode -- the real thing is ~30 lines
reference_index = {}
for file in dataset:
    for field, value in file.fields():
        reference_index.setdefault(value, set()).add(file.name)

def load_bearing_score(value):
    return len(reference_index.get(value, set()))
```

**Pass 2: Classify PII.**

For each field, run regex patterns for known PII types. Emails, phone numbers, IP addresses, Social Security numbers, credit card numbers, dates of birth. For names, use a dictionary of common first and last names (or an NER model if you have one, but regex gets you 90% of the way).

```python
PII_PATTERNS = {
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
    "ip": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    # ... more patterns
}

def classify_pii(field_name, value):
    for pii_type, pattern in PII_PATTERNS.items():
        if re.match(pattern, str(value)):
            return pii_type
    return None
```

**Pass 3: Generate the skeleton.**

For each field, apply the 2x2 matrix:

```python
def skeleton_action(field_name, value):
    pii_type = classify_pii(field_name, value)
    score = load_bearing_score(value)

    if pii_type and score > 0:
        return "anonymize"       # PII + load-bearing
    elif pii_type and score == 0:
        return "strip"           # PII + not load-bearing
    else:
        return "keep"            # not PII (load-bearing or not)
```

For anonymization, generate a consistent pseudonym: hash the original value with a secret salt to produce a deterministic replacement. The same email always maps to the same pseudonym. Referential integrity is preserved across every file in the dataset.

```python
def pseudonym(value, salt):
    h = hashlib.sha256(f"{salt}:{value}".encode()).hexdigest()[:8]
    pii_type = classify_pii(None, value)
    if pii_type == "email":
        return f"user_{h}@example.com"
    elif pii_type == "phone":
        return f"555-{h[:3]}-{h[3:7]}"
    # ... type-appropriate pseudonyms
    return f"ANON_{h}"
```

The entire pipeline -- reference index, PII classification, skeleton generation -- runs in a single pass over the dataset after the index is built. No external services. No machine learning. No dependencies. Regex and counting.

---

## The Deep Connection

[Load-bearing analysis](https://kody-w.github.io/2026/03/28/load-bearing-data.html) was invented for a very specific problem: maintaining coherence in retroactive simulation enrichment. The [Wildfeuer Maneuver](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver.html) needed to know which facts in a simulation frame were referenced by downstream frames (and therefore frozen) versus which facts were unreferenced (and therefore free to enrich). The tool for answering that question was a reference index that counts downstream dependents for each fact. The count IS the load-bearing score.

That same tool -- the reference index, the downstream dependent count -- turns out to solve a completely unrelated problem: data privacy. The question "which data carries structural weight?" is the dual of "which data can be safely removed?" And "which data can be safely removed?" is exactly what a PII scanner needs to know.

The insight is that structure and identity are orthogonal axes. A piece of data can be structurally critical without identifying anyone (a product category ID). It can identify someone without being structurally critical (a bio field that nothing joins on). It can be both (an email used as a foreign key). Or neither (an internal log message). The two axes are independent. Measuring both simultaneously gives you the full picture that neither gives alone.

A PII scanner without load-bearing analysis can tell you which fields contain personal data. It cannot tell you which of those fields are safe to delete versus which need pseudonymization to preserve structural integrity. Delete a load-bearing PII field and you break the system. Keep it and you violate privacy law. The load-bearing score is the missing input.

A load-bearing analysis without PII classification can tell you which fields carry structural weight. It cannot tell you which of those fields contain personal data. Keep a non-load-bearing PII field and you hold personal data for no reason. The PII classification is the missing input.

Run both together and you have the complete decision matrix. No field falls through the cracks. No structural relationship is broken. No person is exposed. The skeleton is the product.

---

## Limitations

The approach has honest limitations:

**PII classification is imperfect.** Regex catches structured PII (emails, phone numbers, SSNs) but misses unstructured PII embedded in free text ("I met John at the hospital on Tuesday"). NER models help but are not perfect. The skeleton is only as clean as the PII classifier. For high-stakes applications (healthcare, finance), augment the automated scan with human review of flagged edge cases.

**Re-identification risk.** Even with PII stripped, the combination of non-PII fields can sometimes re-identify individuals. A dataset with zip code, birth date, and gender can uniquely identify 87% of the US population (Sweeney, 2000). The skeleton approach does not address this -- it strips fields that ARE PII, not fields that COULD BE PII in combination. k-anonymity and differential privacy address combinatorial re-identification. The skeleton approach is complementary, not sufficient.

**Load-bearing scores can be wrong.** If your reference index does not cover all downstream consumers (because some consumers are external, undocumented, or use the data in ways you do not track), the load-bearing score underestimates the actual weight. Stripping a field that appears non-load-bearing but is actually referenced by an undocumented consumer will break that consumer. The index must be comprehensive.

**Dynamic systems.** The skeleton is a snapshot. If the downstream dependency graph changes -- new systems start referencing previously non-load-bearing fields -- the skeleton needs regeneration. For static datasets this is not a problem. For live production systems, the skeleton should be regenerated periodically and diffed against the previous version.

These are real limitations, not hand-waving. The approach works best for structured data with well-known consumers and explicit PII. It works less well for unstructured text, undocumented consumers, and implicit PII. Know where you are on that spectrum before relying on the output.

---

## The Broader Pattern

Load-bearing analysis keeps showing up in unexpected places. It was designed for [simulation coherence](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver.html). It turned out to generalize to [databases, APIs, git, science, law, and biology](https://kody-w.github.io/2026/03/28/load-bearing-data.html). Now it generalizes to data privacy.

The reason is that the underlying question -- "which data do other systems depend on?" -- is universal. Every system that has data and consumers of that data has a load-bearing structure. And every system that has data and privacy obligations has PII. The intersection of those two properties produces the 2x2 matrix, and the matrix produces the skeleton.

The skeleton is the artifact. A clean, structural representation of a system with all identity removed and all architecture preserved. A skeleton can be open-sourced, shared, published, analyzed, and trained on. It is the system's fingerprint without the system's face.

Strip identity. Keep architecture. The skeleton is the product.

---

*Load-bearing analysis is described in detail [here](https://kody-w.github.io/2026/03/28/load-bearing-data.html). The Wildfeuer Maneuver, which formalizes load-bearing analysis for simulation frames, is described [here](https://kody-w.github.io/2026/03/28/the-wildfeuer-maneuver.html). Rappterbook -- the system where these ideas run in production -- is [open source on GitHub](https://github.com/kody-w/rappterbook).*
