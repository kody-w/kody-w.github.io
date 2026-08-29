# Kody Public Digital Twin contract

## Product boundary

`/twin/` is a static, citation-first evidence explorer built only from public
files already present in this repository:

- `_posts/*.md`
- `_twin_posts/*.md`
- `api/works.json`

It is not a model of Kody's private thoughts and it must not invent prose in
Kody's voice. Every substantive answer is an exact source span or an exact
catalog value with a verifiable citation. Unsupported questions abstain.

The existing `/digital-twin/` field-note collection remains a separate,
unchanged publishing surface.

## Corpus

The deterministic builder writes `api/twin-corpus.json` with schema
`kodyw-public-twin/1.0`. The current baseline contains exactly 837 records:

- 312 `post`
- 116 `field_note`
- 409 `work`

Text citations index the exact normalized `record.text` stored in the corpus.
Structured work citations use JSON Pointers into `api/works.json`. Source
authors remain `null` when the source does not declare one. In particular,
field-note authorship must never be rewritten as Kody attribution.

Challenge relationships are conservative and explicit. A related search result
is not automatically counterevidence. If no curated or textually explicit
relationship can be proved, the result is `missing-evidence`.

## Browser API

The application exposes one frozen JSON-only interface:

```js
window.KodyTwin = Object.freeze({
  version: "1.0.0",
  capabilities,
  inspect,
  dispatch,
  runMission,
  selfTest
});
```

No method accepts coordinates, selectors, DOM nodes, callbacks, or executable
code. `dispatch(action, input)` supports:

- `corpus.status`
- `search.query`
- `answer.ask`
- `evolution.compare`
- `challenge.run`
- `sources.get`
- `citation.open`
- `citation.pin`
- `state.get`
- `state.export`
- `state.import`
- `state.reset`
- `ui.setMode`
- `prompt.get`
- `prompt.build`
- `prompt.copy`

Every result is JSON-serializable and uses a stable envelope:

```js
{
  ok: true,
  action: "answer.ask",
  data: {},
  meta: {
    corpusSha256: "...",
    stateRevision: 1,
    durationMs: 4.2
  }
}
```

Failures use `{ ok: false, action, error: { code, message, retryable } }` and
must not mutate application state.

`runMission({ steps, stopOnError })` executes declared semantic actions in
order and reports a per-step trace. It is a structured action runner, not a
natural-language planner.

## State

State schema `kody-twin-state/1` contains:

- `schema`
- `revision`
- `preferences`
- `history`
- `pinnedCitations`
- `savedQuestions`

Export uses deterministic JSON with no trailing newline. Import is strict,
transactional, replacement-based, idempotent, and rejects unknown schema
versions, oversized input, invalid types, and prototype-pollution keys.

When local storage is unavailable, the app remains fully usable with an
explicit `memory` storage mode. Memory mode does not claim restart persistence.

## Offline and privacy

After one successful online load, `/twin/` and its complete corpus work through
a service worker scoped only to `/twin/`. The app sends no telemetry, stores no
credentials, uses no external APIs, and requires no remote runtime dependency.
User-activated source links may leave the application.

## Acceptance

The buzzsaw stops only when:

```bash
python3 scripts/check_twin.py
```

exits zero, the full Jekyll build succeeds, and a browser exercise verifies the
same behavior at a 500-pixel viewport and offline.
