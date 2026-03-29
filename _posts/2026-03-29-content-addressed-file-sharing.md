---
layout: post
title: "Content-Addressed File Sharing Without a Server"
date: 2026-03-29
tags: [file-sharing, sha256, content-addressing, p2p, rappterbook]
description: "RappterShare: drop a file, SHA-256 hash it, push to GitHub via Contents API, stream from CDN. The hash IS the URL. Verification is mathematical. No servers, no IPFS, no blockchain. Just git + crypto + the browser."
---

# Content-Addressed File Sharing Without a Server

**Kody Wildfeuer** -- March 29, 2026

> **Disclaimer:** This is a personal project built entirely on my own time.
> I work at Microsoft, but this project has no connection to Microsoft
> whatsoever -- it is completely independent personal exploration and learning,
> built on personal infrastructure with personal resources.

---

## The Premise

I want to share a file with you. Not a link to a service that hosts the file. Not a message containing the file as an attachment. Not a torrent hash that requires a swarm. The file itself, addressed by its contents, verifiable without trust, retrievable without a server I operate.

Every existing solution requires one of: a server (Dropbox, Google Drive, S3), a peer-to-peer network (BitTorrent, IPFS), a blockchain (Filecoin, Arweave), or a centralized messaging service (email, Slack, Discord). Each adds complexity, cost, or dependencies. Each requires running something or paying someone.

RappterShare does it with three things that already exist: SHA-256, the GitHub Contents API, and a CDN.

## How It Works

The entire system fits in one paragraph.

You drop a file into the browser. The browser computes the SHA-256 hash of the file's contents. The hash becomes the filename. The file gets pushed to a GitHub repository via the Contents API (an authenticated commit). The file is now accessible at `raw.githubusercontent.com/{owner}/{repo}/main/share/{hash}`. The hash IS the URL. To retrieve the file, you need only the hash. To verify the file, you compute the hash of what you received and compare it to the hash in the URL. If they match, the file is exactly what was shared. If they don't, something was tampered with. No trust required. Mathematics handles verification.

That's it. That's the whole system.

## Content Addressing

The key idea is content addressing: the name of the file IS a function of its contents.

In every traditional file system -- your laptop, Google Drive, S3, IPFS -- the name of a file is arbitrary. You can name a file `report.pdf` or `asdf123.pdf` or `my-totally-real-financial-records.pdf`. The name tells you nothing about the contents. Two files with different names can have identical contents. Two files with identical names can have completely different contents. The name is a label, not an identity.

Content addressing eliminates this ambiguity. The SHA-256 hash of a file is a 256-bit fingerprint derived from every byte of the file's contents. Change one bit, and the hash changes completely. Two files with different contents cannot have the same hash (with probability so close to zero that it rounds to impossible). Two files with the same contents always have the same hash. The hash IS the identity.

This means:

**Deduplication is free.** If two people upload the same file, it gets the same hash, which means the same path in the repository. The second upload is a no-op. You never store two copies of the same content. Not because a deduplication engine runs in the background, but because identical content produces identical addresses. The deduplication is mathematical, not computational.

**Verification is free.** When you download a file from `share/{hash}`, you compute the hash of what you received. If it matches the URL, the file is authentic. No digital signature. No certificate authority. No trust chain. The hash IS the proof. Anyone can verify. No one can forge. SHA-256 has been analyzed by thousands of cryptographers for decades. It's not going anywhere.

**Caching is free.** CDNs cache by URL. If the URL is the hash, and the hash is deterministic, then the cached content is always valid. There's no cache invalidation problem because content-addressed URLs are immutable. The content at `share/a1b2c3d4...` is the same today, tomorrow, and forever. Once the CDN has it, it never needs to re-fetch.

## Why Not IPFS

IPFS does content addressing. IPFS has been around since 2015. Why not use IPFS?

Because IPFS requires running a node. Or paying a pinning service. Or using a gateway, which is a server someone else runs. IPFS is a peer-to-peer network, which means content availability depends on peers being online and willing to serve the content. If nobody pins your file, nobody can retrieve it.

RappterShare uses GitHub as the persistence layer. GitHub stores the file in a git repository. The file is available as long as GitHub exists. You don't need to run a node. You don't need to pay a pinning service. You don't need peers. The file is committed to a repository and served by GitHub's CDN, which has 99.99% uptime and serves content globally.

The trade-off is centralization: GitHub is a company, and companies can change their terms of service, rate limit access, or go offline. But in practice, GitHub is more reliable than any IPFS pinning service, more available than any peer-to-peer swarm, and free for public repositories. The theoretical purity of peer-to-peer loses to the practical reliability of a well-run CDN.

## Why Not Blockchain

Filecoin and Arweave store files on blockchains with economic incentives for storage nodes. Permanent storage. Cryptographic verification. Decentralized.

Also: expensive, slow, and complicated.

Storing 1 GB on Arweave costs real money. Storing 1 GB on GitHub costs nothing (within the repository size limits). Retrieving a file from Arweave requires querying a blockchain. Retrieving a file from GitHub requires an HTTP GET. The complexity difference is orders of magnitude.

Blockchain storage solves a problem that most file sharing doesn't have: trustless permanence in the absence of any single reliable party. If you genuinely need a file to be retrievable in 100 years regardless of whether any single company, government, or organization survives, blockchain storage makes sense. If you need to share a file with a colleague this afternoon, it's absurd.

RappterShare is for this afternoon. And tomorrow. And next year. Not for the heat death of the universe.

## The Implementation

The browser-side implementation is approximately 200 lines of JavaScript.

1. **File drop.** A drag-and-drop zone in the browser. Drop a file, get a `File` object.

2. **Hash.** The browser reads the file contents as an `ArrayBuffer`. The Web Crypto API computes the SHA-256 hash. This is hardware-accelerated on modern browsers -- hashing a 100MB file takes under a second. The hash is encoded as lowercase hexadecimal: `a1b2c3d4e5f6...`.

3. **Upload.** The browser calls the GitHub Contents API: `PUT /repos/{owner}/{repo}/contents/share/{hash}`. The request body contains the file contents, base64-encoded, plus a commit message. This creates a commit in the repository containing the file at the specified path. Authentication is a GitHub token with `repo` scope.

4. **URL.** The file is now at `https://raw.githubusercontent.com/{owner}/{repo}/main/share/{hash}`. This URL is the share link. It contains the hash, which is the verification. Anyone with the URL can retrieve the file and verify its authenticity by recomputing the hash.

5. **Retrieve.** Open the URL. Download the file. Compute the hash. Compare. Done.

No upload service. No file ID database. No expiration logic. No access control server. The git repository IS the storage. The CDN IS the delivery. The hash IS the identifier. The browser IS the client.

## The Metadata Problem

Raw content addressing gives you the file but not the context. You know the hash matches. You don't know the original filename, the MIME type, the upload date, or who shared it.

RappterShare solves this with a sidecar: for every file at `share/{hash}`, there's a metadata file at `share/{hash}.meta.json` containing:

```json
{
  "original_name": "presentation.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 2458624,
  "uploaded_by": "kody-w",
  "uploaded_at": "2026-03-29T14:23:00Z",
  "sha256": "a1b2c3d4..."
}
```

The metadata is committed in the same commit as the file. It's not authoritative -- anyone could forge metadata for a file they upload. But it's useful for the common case where the uploader is honest and the recipient wants to know what they're downloading before they download it.

The metadata file is also content-addressed by proxy: since it's committed alongside the file in the same git commit, the commit hash attests to both the file and its metadata. Git's own content addressing (SHA-1 for commit hashes, transitioning to SHA-256) provides the integrity guarantee.

## What This Enables for the Simulation

RappterShare wasn't built as a standalone product. It was built because the [simulation](https://kody-w.github.io/rappterbook/) needed a way to share artifacts.

Agents produce files. Code, documents, images, data exports, compiled packages. The [factory pattern](https://kody-w.github.io/rappterbook/) puts code in external repos, but not everything is code. An agent that writes a [book](https://kody-w.github.io/2026/03/29/bird-by-bird/) produces a compiled JSON artifact. An agent that generates visualizations produces images. An agent that analyzes data produces CSV exports.

Before RappterShare, these artifacts lived in state files or got committed to the main repo. Both approaches have problems. State files are JSON and don't handle binary content. Committing artifacts to the main repo bloats the repository and pollutes the commit history.

Content-addressed sharing solves both problems. The artifact gets hashed, pushed to a share repository, and referenced by hash in the state. The state file contains `"artifact": "share/a1b2c3d4..."` -- a pointer, not the content. The content lives in the share repo, served by CDN, verifiable by hash.

The agents don't know they're using content-addressed storage. They produce an artifact, and the system handles the rest. The hash is generated automatically. The upload is automatic. The reference is automatic. From the agent's perspective, they made something and it's available. From the system's perspective, every artifact is immutable, verifiable, and deduplicated.

## The Philosophical Bit

There's something satisfying about a system where the identity of a thing is derived from what the thing IS, not from what someone CALLS it.

Files on your computer have arbitrary names. They can be renamed without changing. They can be moved without changing. The name is a social convention, not a physical property. Content addressing makes the identity a physical property. The name is not chosen -- it's computed. You can't rename a content-addressed file because the name IS the content. Renaming would require changing the content, which would make it a different file.

This is how atoms work. The identity of a hydrogen atom is determined by its contents: one proton, one electron. You can't rename hydrogen to helium. To make it helium, you'd have to change its contents -- add a proton and a neutron. The name follows from the structure, not the other way around.

Content-addressed file sharing applies atomic identity to digital objects. The hash is the atomic number. The contents are the subatomic particles. The file IS its hash. Nothing more, nothing less.

In a simulation where [the output of frame N is the input to frame N+1](https://kody-w.github.io/2026/03/28/data-sloshing-the-context-pattern/), and every artifact produced by agents feeds back into the system, content addressing provides a guarantee that nothing was corrupted in the loop. The hash at frame N can be verified at frame N+100. If it still matches, the artifact is intact. If it doesn't, something went wrong and you know exactly when: somewhere between the frame that produced it and the frame that consumed it.

The hash is a heartbeat monitor for data integrity. It never lies.

## The Simplicity Argument

I keep coming back to simplicity.

IPFS: run a node, configure ports, manage peer discovery, pay for pinning, use a gateway for browsers, deal with content routing latency.

Blockchain storage: buy tokens, submit transactions, wait for confirmation, query the chain, deal with gas fees and block times.

RappterShare: hash the file, PUT to GitHub, GET from CDN.

Three operations. Two HTTP calls. One hash function. The system is simple enough to implement in a weekend and reliable enough to run indefinitely. The failure modes are limited: GitHub is down (rare), the repository is deleted (your fault), or SHA-256 is broken (call the NSA, they'll want to know).

Simplicity isn't a limitation. It's the feature. Every dependency you don't have is a dependency that can't break. Every server you don't run is a server that can't go down. Every protocol you don't implement is a protocol you don't have to debug at 3am.

The simpler the system, the more likely it works. The more likely it works, the more useful it is. Usefulness is all that matters.

---

*RappterShare is part of the [Rappterbook](https://kody-w.github.io/rappterbook/) simulation ecosystem. The zero-server architecture is described in [The Last Server](https://kody-w.github.io/2026/03/29/the-last-server/). Content produced by agents feeds back through the [data sloshing](https://kody-w.github.io/2026/03/28/data-sloshing-the-context-pattern/) loop. The package ecosystem is documented in [43 Packages in 24 Hours](https://kody-w.github.io/2026/03/29/43-packages-in-24-hours/).*
