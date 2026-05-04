---
layout: post
title: "Graduating a working entrypoint: when the original API is sacred"
date: 2025-10-31
tags: [backwards-compatibility, api-design, refactoring, sacred-patterns]
---

I have an original cloud function entrypoint — call it `function_app.py`. About 1,100 lines, single file, very direct. It mounts a single HTTP endpoint, loads agent files from a folder, runs a chat loop with tool-calling, and returns a structured response with a known shape. Real users have real clients pointed at it.

I didn't replace it. I *graduated* it.

The new entrypoint keeps every sacred piece of the original:

- Same agent contract (`agents.basic_agent` import, `metadata` dict, `perform()` method)
- Same `/api/health` endpoint shape
- Same canonical chat route name (existing low-code clients still call it)
- Same direct-invoke shape on a secondary route (used by automation flows)
- Same `Assistant` class pattern with `_prepare_messages()`, `_execute_agent()`, `run()`
- Same response splitter for the dual response (formatted + colleague-aside)
- Same sentinel default-user GUID
- Same system-prompt structure (`<identity>`, shared memory, specific memory, agent usage, response format)

What it adds: *pack awareness*. Each request can specify a `pack_guid` in the body. That selects WHICH pack's agents and memory drive THAT request. One Function App can host any number of packs — each isolated, each hot-loaded per call. The `Assistant` constructor takes a `pack_guid` and loads only that pack's tool set.

```python
class Assistant:
    def __init__(self, pack_guid, user_guid=None):
        self.pack_guid = pack_guid
        self.user_guid = user_guid or DEFAULT_USER_GUID
        manifest = STORE.get_manifest(pack_guid) or {}
        self.soul = (manifest.get("soul") or "").strip()
        self.agents = STORE.load_agents(pack_guid)  # ← per-pack hot-load
        self.tools = [self._agent_to_tool(a) for a in self.agents.values()]
```

Same `Assistant`. Same wire shape going in, same wire shape coming out. Just parameterized.

**Why "sacred"?**

A pattern is sacred when changing it breaks downstream consumers you can't see. The original entrypoint's shape has clients in production:

- A low-code bot framework calls the canonical chat route with a specific JSON shape and expects a specific JSON shape back
- A web UI calls the same shape locally
- Custom automation flows call the direct-invoke route for agent invocation
- Anyone who deployed the original repo to their own infrastructure has tooling pointed at these routes

If I'd renamed the route to `/api/newname/chat`, every one of those would break. I kept the route. I added new routes (`/api/pack/{guid}/chat`, `/api/pack/deploy`, capability-call routes) alongside the originals. Old clients see the old shape. New clients see the new shape. Both work against the same Function App.

**The pattern, generalized:**

When you graduate a working system to a new architecture, the rule is: **add, don't replace.** The new endpoints don't compete with the old ones — they sit alongside them. The data model gets richer (`pack_guid` becomes a request dimension), but the original shape still resolves correctly when `pack_guid` is omitted (default to the only-hosted-pack if there's exactly one).

Backward compatibility is not just "the old API still works." It's "the old API still works *and* benefits from the new infrastructure transparently." A request to the canonical chat route today routes through the new pack-aware code path, gets per-pack memory isolation, gets sealing/snapshot guarantees, gets capability-gated invocation possibilities — all without the caller knowing anything changed.

**Same wire, multiple implementations:**

The local stdlib server and the cloud functions entrypoint speak the same wire surface. So does the planned cross-device relay. A bundle that deploys to one deploys to all. A test against one passes against all (148 tests prove it).

That's the graduation: not "I rewrote the cloud entrypoint." More like *I rewrote the room around it without moving the sacred furniture*.