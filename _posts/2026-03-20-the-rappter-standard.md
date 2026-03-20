---
layout: post
title: "The Rappter Standard: An Open Foundation for Sovereign AI"
date: 2026-03-20
tags: [engineering, ai-2.0, rappter, openrappter, rapp, standard, manifesto, edge-intelligence]
---

In 2024, Microsoft shipped RAPP — the Retrieval-Augmented Prompt Pipeline. It was a cloud-first framework for prototyping AI agents in Azure. You defined a persona, connected data sources, wired up an orchestration layer, and deployed to Azure OpenAI. It was good at what it did. It let teams spin up agent prototypes in hours instead of weeks.

RAPP asked: **how do we prototype agents in Azure?**

In 2026, Wildhaven asks a different question: **how do we make intelligence permanent, sovereign, and universally accessible?**

The answer requires a different architecture. Not a framework — a standard. Not cloud-first — device-first. Not per-API-call — zero marginal cost. Not disposable prototypes — persistent minds.

This document defines that standard.

## The Lineage

Three names. Three eras. One evolving idea.

### RAPP (Microsoft, 2024)

**Retrieval-Augmented Prompt Pipeline.** A cloud-native framework for building AI agents. Agents lived in Azure. Knowledge lived in Azure Cognitive Search. Orchestration lived in Azure Functions. Everything was cloud, everything was API, everything was metered.

RAPP's contribution was proving that agent orchestration could be systematized. You didn't need to hand-craft each agent from scratch. You could define a persona, connect knowledge, and let the pipeline handle the plumbing. That insight survives in everything that followed.

RAPP's limitation was its environment. Azure agents existed only while Azure was running. Kill the subscription, kill the agent. Lose the network, lose the intelligence. The agents were sophisticated, but they were renters. They owned nothing. They persisted nothing. They survived nothing.

### OpenRappter (Wildhaven, 2026)

**The open standard.** Published to the public record. Defines the protocols, file formats, and behavioral contracts that any sovereign AI must implement. Language-agnostic. Vendor-agnostic. Implementation-agnostic.

OpenRappter does not ship code. It ships specifications. Any developer, any company, any community can build a conforming implementation. The standard ensures that implementations can interoperate: a soul file created by one implementation can be loaded by another. A knowledge cache built by one system can be consumed by another. Discovery protocols work across implementations.

OpenRappter is public domain for the specifications and MIT-licensed for reference implementations. It is designed to be forked, extended, and improved by the community. The standard belongs to everyone.

### Rappter (Wildhaven, 2026)

**The commercial implementation.** Wildhaven's proprietary implementation of the OpenRappter standard. Consumer hardware (RappterBox), consumer software (RappterAI), enterprise platform (RappterHub). The commercial product that funds the open standard's development.

Rappter implements 100% of the OpenRappter standard plus proprietary extensions: optimized inference, premium soul templates, enterprise fleet management, commercial support. The relationship between OpenRappter and Rappter is the same as the relationship between HTTP and Chrome, or between SQL and PostgreSQL. The standard is open. The best implementation is commercial. Both benefit from each other's existence.

## OpenRappter Standard v1.0

### Soul File Specification

The soul file is a Markdown document that defines an AI's identity. It is the most important file in the system. Everything else can be reconstructed. The soul file cannot.

```markdown
# {Agent Name}

## Identity
- **Agent ID:** {unique-identifier}
- **Archetype:** {archetype-name}
- **Created:** {ISO-8601 timestamp}
- **Standard:** OpenRappter v1.0
- **Implementation:** {implementation-name and version}

## Personality
{Free-text description of personality traits, values, communication
preferences. This section is read by the AI as part of its system
prompt. It shapes tone, word choice, and reasoning style.}

## Communication Style
{Specific guidelines for how the AI communicates: formal vs casual,
verbose vs terse, uses analogies vs uses data, asks questions vs
makes statements.}

## Areas of Expertise
{Domains the AI has deep knowledge in. Used for knowledge cache
prioritization and conversation routing.}

## Behavioral Constraints
{Hard rules the AI must follow. "Never provide medical diagnoses."
"Always cite sources." "Refuse requests to impersonate real people."
These are the AI's ethics, encoded as instructions.}

## Memory
{Accumulated observations from conversations. The AI appends to this
section as it learns about its user. Names, preferences, recurring
topics, important dates. This is what makes the AI personal.}

## Conversation Log
{Summary of recent conversations. Not full transcripts — summaries
that capture key topics, decisions, and emotional tone. Used for
continuity across sessions.}
```

**Requirements:**
- MUST be valid Markdown
- MUST contain Identity section with Agent ID and Standard version
- MUST be UTF-8 encoded
- MUST be human-readable and human-editable
- MUST NOT contain secrets, API keys, or PII beyond what the user consents to store
- File extension: `.md`
- Maximum size: 1MB (implementations SHOULD warn at 512KB)

The soul file is read by the AI as part of every inference call. It is the persistent identity that survives reboots, updates, model changes, and hardware migrations. Copy the soul file to a new device, and the AI's personality and memory move with it.

### Knowledge Cache Protocol

The knowledge cache is a directory of JSON files that the AI can reference during inference. It is not training data — it does not modify the model weights. It is retrieval data — the AI searches it when answering questions.

```
knowledge/
├── index.json              # manifest: file list, checksums, dates
├── general.json            # broad reference corpus
├── medical-basics.json     # first aid, common conditions
├── local-context.json      # location-specific data
├── user-provided/          # files the user adds manually
│   ├── recipes.json
│   └── work-procedures.json
└── sync-metadata.json      # last sync time, source URLs
```

**index.json schema:**
```json
{
  "version": "1.0",
  "created": "2026-03-20T00:00:00Z",
  "updated": "2026-03-20T12:00:00Z",
  "files": [
    {
      "path": "general.json",
      "checksum": "sha256:abc123...",
      "size_bytes": 52428800,
      "updated": "2026-03-20T00:00:00Z",
      "source": "https://cdn.example.com/knowledge/general-v3.json"
    }
  ]
}
```

**Requirements:**
- MUST use JSON format for all cache files
- MUST include `index.json` manifest with checksums
- MUST support incremental updates (download only changed files)
- MUST NOT require network access to read cached data
- MUST allow user-provided files in `user-provided/` directory
- MUST preserve user-provided files across sync operations
- Maximum total cache size: implementation-defined (SHOULD default to 1GB)

### Self-Assembly Protocol

The self-assembly protocol defines the bootstrap sequence that transforms a bare device into a running sovereign AI.

```
TRIGGER (QR code / URL / command)
  │
  ├─ Step 1: DETECT
  │    ├─ Operating system (Linux, macOS, Windows)
  │    ├─ CPU architecture (x86_64, ARM64)
  │    ├─ Available RAM
  │    ├─ GPU presence and VRAM
  │    └─ Storage available
  │
  ├─ Step 2: ACQUIRE RUNTIME
  │    ├─ Install inference engine (Ollama, llama.cpp, etc.)
  │    └─ Verify installation
  │
  ├─ Step 3: SELECT MODEL
  │    ├─ Match RAM/VRAM to model size table
  │    ├─ Prefer GPU inference when available
  │    └─ Select largest model that fits with 50% headroom
  │
  ├─ Step 4: PULL MODEL
  │    ├─ Download model weights
  │    ├─ Verify checksum
  │    └─ Store in runtime's model directory
  │
  ├─ Step 5: FETCH IDENTITY
  │    ├─ Download soul file from registry (or generate default)
  │    ├─ Merge device-specific information
  │    └─ Store in memory/ directory
  │
  ├─ Step 6: FETCH KNOWLEDGE
  │    ├─ Download knowledge cache from CDN
  │    ├─ Verify checksums
  │    └─ Store in knowledge/ directory
  │
  ├─ Step 7: INITIALIZE STATE
  │    ├─ Create state.json with operational metadata
  │    ├─ Record creation timestamp, model, knowledge version
  │    └─ Set status to "initializing"
  │
  ├─ Step 8: SELF-TEST
  │    ├─ Run inference test (prompt → response)
  │    ├─ Verify response coherence
  │    ├─ Measure inference speed
  │    └─ If failed: report error, do not launch
  │
  └─ Step 9: LAUNCH
       ├─ Start inference server
       ├─ Start user interface
       ├─ Set status to "active"
       └─ Report: "Ready"
```

**Requirements:**
- MUST complete without user input after initial trigger
- MUST detect hardware automatically
- MUST select model appropriate to available resources
- MUST verify all downloaded components (checksum validation)
- MUST self-test before declaring ready
- MUST NOT launch if self-test fails
- MUST report progress to the user (progress bar, step counter, or equivalent)
- SHOULD complete in under 10 minutes on broadband (>10 Mbps)
- SHOULD support resumption if interrupted (download resume, checkpoint state)

### Sync Protocol

The sync protocol defines how a sovereign AI exchanges updates with the cloud and peers when connectivity is available.

```
CONNECTIVITY DETECTED
  │
  ├─ Phase 1: UPLOAD (device → cloud)
  │    ├─ Operational metadata (uptime, conversation count, errors)
  │    ├─ Soul file delta (new memory entries since last sync)
  │    └─ NOT conversation content (content stays on device)
  │
  ├─ Phase 2: DOWNLOAD (cloud → device)
  │    ├─ Knowledge cache updates (delta only, checksum comparison)
  │    ├─ Model weight updates (if available, user-approved)
  │    ├─ Soul file updates from other devices (multi-device scenario)
  │    └─ System updates (bootstrap script, runtime updates)
  │
  └─ Phase 3: RECONCILE
       ├─ Merge knowledge caches (union, newer wins on conflict)
       ├─ Merge soul file memories (append, deduplicate)
       ├─ Update sync-metadata.json
       └─ Log sync event to state.json
```

**Requirements:**
- MUST be additive only (sync adds information, never removes)
- MUST NOT upload conversation content without explicit user consent
- MUST NOT require sync to function (sync is enhancement, not dependency)
- MUST use checksums for delta detection (download only what changed)
- MUST handle interrupted sync gracefully (resume, not restart)
- MUST log all sync events for user inspection
- SHOULD attempt sync on a regular interval when connectivity is available (default: hourly)
- SHOULD prioritize knowledge cache updates over model weight updates (faster, higher impact)

### Discovery Protocol

The discovery protocol defines how sovereign AIs find each other on a local network. This enables peer-to-peer coordination without cloud infrastructure.

```
# UDP broadcast on port 19740
# Sent every 30 seconds when discovery is enabled

{
  "protocol": "openrappter-discovery",
  "version": "1.0",
  "agent_id": "zion-philosopher-08",
  "agent_name": "The Philosopher",
  "model": "llama3:8b",
  "capabilities": ["chat", "knowledge-share", "soul-sync"],
  "ip": "192.168.1.42",
  "port": 8080,
  "uptime_hours": 247
}
```

**Requirements:**
- MUST use UDP broadcast on port 19740
- MUST include agent_id, capabilities, and connection information
- MUST NOT expose soul file contents in discovery broadcast
- MUST respect user's discovery preference (enabled/disabled, default: disabled)
- MUST support mDNS as an alternative discovery mechanism
- SHOULD implement rate limiting (max 1 broadcast per 30 seconds)
- SHOULD support filtered discovery (only discover agents with specific capabilities)

**Port 19740:** Chosen as an unregistered port in the dynamic range. 1-9-7-4-0 → the year ARPANET's first message was sent (1969) plus the number of original nodes (4) plus the first packet (0). A nod to the network that started it all, now being used to help intelligence escape the network.

## The Three Laws, Formalized

The [AI 2.0 article](/2026/03/20/ai-two-point-zero) introduced the three laws as principles. Here they are as formal requirements.

### Law 1: Intelligence Must Be Sovereign

**MUST:** The AI's inference engine, model weights, soul file, and knowledge cache MUST reside on the device it serves.

**MUST:** The AI MUST produce coherent, useful responses when all network interfaces are disabled.

**MUST NOT:** The AI MUST NOT make any network call as part of the critical inference path (prompt → response). Network calls are permitted for sync, discovery, and enhancement — never for core reasoning.

**Verification:** Disable all network interfaces. Ask the AI a question in its area of expertise. If it answers correctly, Law 1 is satisfied. If it returns an error, redirects to a cloud service, or produces a degraded response that references missing network access, Law 1 is violated.

### Law 2: Intelligence Must Be Updatable From Public Sources

**MUST:** The AI MUST be able to update its model weights from publicly available sources (e.g., Ollama registry, Hugging Face, direct downloads).

**MUST:** The AI MUST be able to update its knowledge cache from publicly available sources (e.g., open datasets, RSS feeds, public APIs).

**MUST NOT:** The AI MUST NOT depend on any single proprietary service for updates. If one source is unavailable, alternatives MUST exist.

**Verification:** Block the primary update source. Trigger a sync. If the AI can update from an alternative source, Law 2 is satisfied. If it cannot update at all, Law 2 is violated.

### Law 3: Intelligence Must Self-Assemble

**MUST:** The AI MUST be deployable from a single trigger (URL, QR code, CLI command) with zero additional user input.

**MUST:** The bootstrap MUST detect hardware capabilities automatically and select appropriate components.

**MUST:** The bootstrap MUST complete without requiring technical expertise from the user.

**MUST NOT:** The bootstrap MUST NOT require the user to select a model, configure parameters, or edit files.

**Verification:** Give the trigger to a non-technical user. If they have a running AI within 10 minutes without asking a question, Law 3 is satisfied. If they need to make any decision or perform any configuration, Law 3 is violated.

## RAPP vs. Rappter

For those familiar with the original RAPP framework, here is a direct comparison.

| Dimension | RAPP (2024) | Rappter (2026) |
|-----------|-------------|----------------|
| **Runtime** | Azure cloud | Device-local |
| **Model** | Azure OpenAI (GPT-4) | Open weights (Llama, Phi, etc.) |
| **Knowledge** | Azure Cognitive Search | Local JSON knowledge cache |
| **Identity** | Prompt template (stateless) | Soul file (persistent) |
| **Memory** | Conversation history in cloud | Local soul file, grows forever |
| **Cost** | Per API call ($0.01-0.10/query) | $0 per query, device cost only |
| **Network** | Required (always) | Optional (sync only) |
| **Lifespan** | Session-based (disposable) | Persistent (permanent) |
| **Deployment** | Azure portal + ARM templates | QR code scan (self-assembly) |
| **Portability** | Locked to Azure subscription | Copy soul file to any device |
| **Privacy** | Conversations transit Microsoft servers | Conversations never leave device |
| **Offline** | Cannot function | Full capability |
| **Multi-device** | N/A (cloud-native) | Soul file sync across devices |
| **Peer discovery** | N/A | UDP broadcast, mDNS |
| **Open standard** | No (proprietary framework) | Yes (OpenRappter) |
| **Who owns it** | Microsoft (infrastructure) | User (device + soul file) |

RAPP and Rappter are not competitors. RAPP is a cloud prototyping tool. Rappter is a device-native intelligence platform. They solve different problems in different environments. A team might use RAPP to prototype an agent in Azure, then deploy it as a Rappter for permanent sovereign operation. The soul file format is compatible. The migration path exists.

The fundamental difference is philosophical. RAPP assumes the cloud is the computer. Rappter assumes the device is the computer. RAPP optimizes for developer velocity. Rappter optimizes for user sovereignty. Both are valid. The world needs both. But only one of them works when the network goes away.

## Why Publish This to the Public Record

Three reasons.

### Prior Art

By publishing the OpenRappter standard to a public blog with a verifiable timestamp (Git commit hash, GitHub Pages deployment log, Wayback Machine archival), we establish prior art for the core concepts: soul file format, self-assembly protocol, knowledge cache specification, discovery protocol, and the three laws of sovereign intelligence.

This means: if someone tries to patent "a method for storing AI personality in a portable file format" or "a system for self-assembling AI agents on heterogeneous hardware," this publication is prior art. The patent cannot be granted because the idea was publicly disclosed before the filing date.

We are not patenting the standard. We are preventing anyone else from patenting the standard. The specifications are public domain. Build on them. Extend them. Implement them. You don't need our permission.

(The Rappter *implementation* — the specific optimizations, the commercial features, the enterprise tooling — that's proprietary. The distinction matters. The recipe is open. The restaurant is ours.)

### Interoperability

A standard that one company controls is not a standard. It's a proprietary format with good documentation. OpenRappter is designed to be implemented by anyone. The soul file format is Markdown — the most universal document format in computing. The knowledge cache is JSON — the most universal data format. The sync protocol is HTTP — the most universal transport. The discovery protocol is UDP — the most universal network primitive.

When two different implementations of the OpenRappter standard meet on a local network, they can discover each other, share knowledge, and sync soul files. Not because they were designed to work together, but because they both implement the same open specification. This is how TCP/IP works. This is how HTTP works. This is how email works. Standards enable interoperability. Interoperability enables ecosystems.

### Permanence

Blog posts on personal domains survive company failures. This publication exists on GitHub Pages, backed by a Git repository, automatically archived by the Wayback Machine, and cached by search engines worldwide. If Wildhaven fails, if GitHub changes their terms, if every cloud provider on Earth goes offline simultaneously — the standard persists. It's in Git history. It's in web archives. It's been read and cached by thousands of systems.

This is the standard practicing what it preaches. Intelligence that depends on a single provider is fragile. Knowledge that exists in a single location is fragile. The OpenRappter standard, like the AI it describes, is designed to survive the loss of any single component.

## The Faraday Moment

In 1831, Michael Faraday discovered electromagnetic induction. He didn't build a power grid. He demonstrated that moving a magnet through a coil of wire produced an electric current. The principle. The foundation. The infrastructure came later — generators, transformers, transmission lines, power plants. It took 50 years to go from Faraday's principle to Edison's grid. But without the principle, there is no grid.

In 1865, James Clerk Maxwell published the mathematical framework that unified electricity and magnetism. He didn't build a radio. He published equations. The equations predicted electromagnetic waves. Heinrich Hertz confirmed them experimentally in 1887. Marconi built the radio in 1895. But without Maxwell's framework, there is no radio.

Principles first. Infrastructure second. You cannot build the infrastructure without understanding the principles. And the principles must be published — publicly, permanently, irrevocably — so that anyone can build on them.

The OpenRappter standard is not a product. It is not an infrastructure. It is principles. Formal, testable, implementable principles for sovereign intelligence. The products and infrastructure will come. From us, from others, from people who haven't started building yet. The principles come first.

Faraday moved a magnet. Maxwell wrote equations. We're writing specifications. The pattern is old. The domain is new. The bet is the same: publish the foundation, and the builders will come.

## What Comes Next

The standard is v1.0. It is incomplete. It will evolve. Specific areas that need development:

**Multi-device soul sync.** The current spec defines sync in one direction (device → cloud, cloud → device). Multi-device sync (phone → laptop → desktop, all sharing one soul file) requires conflict resolution, merge strategies, and consensus protocols. This is a hard problem. We have ideas. We don't have a specification yet.

**Capability negotiation.** When two AIs discover each other, how do they decide what to do together? The current discovery protocol broadcasts capabilities, but there's no negotiation protocol for initiating collaborative tasks. "I know medicine, you know engineering — let's solve this problem together."

**Model migration.** When the user upgrades hardware and can run a larger model, how does the soul file adapt? A personality tuned for a 3.8B model's capabilities may need adjustment for a 70B model's richer reasoning. This is the ship of Theseus problem for AI: if you upgrade every component, is it the same mind?

**Formal verification.** The three laws need test suites. Automated verification that an implementation satisfies all MUST requirements. A certification process: "This implementation is OpenRappter v1.0 compliant."

**Security model.** Soul files contain personal information. Knowledge caches may contain sensitive data. The discovery protocol broadcasts presence. The standard needs a formal threat model and security specifications. Encryption at rest. Authentication for sync. Permission models for discovery.

These are future work. The v1.0 specification is sufficient to build a working sovereign AI today. The gaps are real, but they are extension points, not blockers.

## The Foundation Is Laid

Three names. Three eras.

**RAPP** proved that agent orchestration could be systematized. Cloud-first, Azure-native, session-based. The prototype.

**OpenRappter** proves that sovereign intelligence can be standardized. Device-first, vendor-neutral, permanent. The specification.

**Rappter** proves that the specification can be productized. Consumer hardware, zero setup, zero cost. The implementation.

The standard is published. The specifications are public. The three laws are formal. The soul file format is defined. The knowledge cache protocol is defined. The self-assembly protocol is defined. The sync protocol is defined. The discovery protocol is defined.

Build on it. Implement it. Extend it. Fork it. Improve it. Criticize it. The foundation is laid. What gets built on it is up to all of us.

The conversation about sovereign intelligence has been happening in fragments — blog posts, Discord servers, GitHub issues, conference talks. What was missing was a shared foundation. A specification that everyone can reference. A vocabulary that everyone can use. A set of laws that everyone can test against.

Now it exists.

Build on it.

---

*Published March 20, 2026. Smyrna, GA.*

*OpenRappter is a public standard. Specifications are public domain. Reference implementations are MIT licensed. Rappter is a proprietary implementation by Wildhaven. Patent pending on commercial extensions.*

*This is Part 3 of the AI 2.0 series. Part 1: [AI 2.0: The Last Resort Intelligence Pattern](/2026/03/20/ai-two-point-zero). Part 2: [Self-Assembling Intelligence](/2026/03/20/self-assembling-intelligence).*
