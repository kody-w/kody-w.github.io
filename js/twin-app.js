(() => {
  "use strict";

  const VERSION = "1.0.0";
  const CORPUS_URL = "/api/twin-corpus.json";
  const PROMPT_URL = "/twin/one-sentence-prompt.txt";
  const EXPECTED_CORPUS_SHA256 = "0d6badcd9364761804d7e77f2f5695185ed8e8254a80650f9d57a09695dd7f9d";
  const EXPECTED_SOURCE_MANIFEST_SHA256 = "9b14903ad91282be2e962e97697479b04e8416da52b7b219afa0422e391d3e29";
  const MODE_ACTIONS = Object.freeze({
    answer: "answer.ask",
    evolution: "evolution.compare",
    challenge: "challenge.run",
  });

  const runtime = {
    phase: "booting",
    ready: false,
    corpusValidated: false,
    indexed: false,
    stateInitialized: false,
    serviceWorkerHandled: false,
    serviceWorkerActivated: false,
    offlineReady: false,
    serviceWorkerControlled: false,
    cachedCorpusVerified: false,
    cacheVerificationError: null,
    serviceWorkerError: null,
    corpusSha256: "",
    sourceManifestSha256: "",
    records: 0,
    storageMode: "unknown",
    stalePinsRemoved: 0,
    error: null,
  };

  const elements = {
    root: document.getElementById("public-twin"),
    corpusStatus: document.getElementById("twin-corpus-status"),
    corpusBreakdown: document.getElementById("twin-corpus-breakdown"),
    corpusDetail: document.getElementById("twin-corpus-detail"),
    storageStatus: document.getElementById("twin-storage-status"),
    storageDetail: document.getElementById("twin-storage-detail"),
    offlineStatus: document.getElementById("twin-offline-status"),
    offlineDetail: document.getElementById("twin-offline-detail"),
    offlineReload: document.getElementById("twin-offline-reload"),
    liveStatus: document.getElementById("twin-live-status"),
    form: document.getElementById("twin-question-form"),
    question: document.getElementById("twin-question"),
    submit: document.getElementById("twin-submit"),
    modes: Array.from(document.querySelectorAll("[data-mode]")),
    results: document.getElementById("twin-results"),
    resultTitle: document.getElementById("twin-result-title"),
    resultCount: document.getElementById("twin-result-count"),
    pinned: document.getElementById("twin-pinned"),
    pinnedCount: document.getElementById("twin-pinned-count"),
    exportButton: document.getElementById("twin-export"),
    importInput: document.getElementById("twin-import"),
    resetButton: document.getElementById("twin-reset"),
    stateStatus: document.getElementById("twin-state-status"),
    appIdea: document.getElementById("twin-app-idea"),
    buildPrompt: document.getElementById("twin-build-prompt"),
    promptText: document.getElementById("twin-prompt-text"),
    copyPrompt: document.getElementById("twin-copy-prompt"),
    promptStatus: document.getElementById("twin-prompt-status"),
    dialog: document.getElementById("twin-source-dialog"),
    dialogTitle: document.getElementById("twin-source-title"),
    dialogContent: document.getElementById("twin-source-content"),
    dialogClose: document.getElementById("twin-source-close"),
  };

  let controller = null;
  let store = null;
  let activeMode = "answer";
  let activeCitation = null;
  let lastDialogTrigger = null;
  let currentPrompt = "";

  function text(value, fallback = "") {
    return value == null ? fallback : String(value);
  }

  function objectValue(value) {
    return value && typeof value === "object" ? value : {};
  }

  function create(tag, className, content) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (content != null) {
      node.textContent = text(content);
    }
    return node;
  }

  function clear(node) {
    if (node) {
      node.textContent = "";
    }
  }

  function setLive(message) {
    if (elements.liveStatus) {
      elements.liveStatus.textContent = message;
    }
  }

  function errorEnvelope(action, code, message, retryable = false) {
    return {
      ok: false,
      action,
      error: {
        code,
        message: text(message, "The action could not be completed."),
        retryable: Boolean(retryable),
      },
    };
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  function safeUrl(value) {
    try {
      const url = new URL(text(value), window.location.origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch (_error) {
      return "";
    }
    return "";
  }

  function displayDate(value) {
    if (!value) {
      return "Not declared";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return text(value);
    }
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function shortHash(value) {
    const hash = text(value);
    return hash.length > 18 ? `${hash.slice(0, 12)}…${hash.slice(-6)}` : hash || "Not declared";
  }

  function moduleApi(names, method) {
    for (const name of names) {
      const candidate = window[name];
      if (candidate && typeof candidate[method] === "function") {
        return candidate;
      }
    }
    return null;
  }

  function deniedStorage() {
    return {
      getItem() {
        throw new Error("Persistent browser storage is unavailable.");
      },
      setItem() {
        throw new Error("Persistent browser storage is unavailable.");
      },
      removeItem() {
        throw new Error("Persistent browser storage is unavailable.");
      },
    };
  }

  function browserStorage() {
    try {
      return window.localStorage || deniedStorage();
    } catch (_error) {
      return deniedStorage();
    }
  }

  async function copyText(value) {
    const output = text(value);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(output);
      return;
    }
    const field = document.createElement("textarea");
    field.value = output;
    field.setAttribute("readonly", "");
    field.className = "twin-copy-fallback";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) {
      throw new Error("Clipboard access was denied.");
    }
  }

  function inspectRuntime() {
    let controllerInspection = {};
    if (controller && typeof controller.inspect === "function") {
      try {
        controllerInspection = objectValue(controller.inspect());
      } catch (_error) {
        controllerInspection = {};
      }
    }
    return Object.assign({}, controllerInspection, {
      version: VERSION,
      phase: runtime.phase,
      ready: runtime.ready,
      corpusValidated: runtime.corpusValidated,
      indexed: runtime.indexed,
      stateInitialized: runtime.stateInitialized,
      serviceWorkerHandled: runtime.serviceWorkerHandled,
      serviceWorkerActivated: runtime.serviceWorkerActivated,
      offlineReady: runtime.offlineReady,
      serviceWorkerControlled: runtime.serviceWorkerControlled,
      cachedCorpusVerified: runtime.cachedCorpusVerified,
      online: navigator.onLine,
      storageMode: runtime.storageMode,
      records: runtime.records,
      corpusSha256: runtime.corpusSha256,
      sourceManifestSha256: runtime.sourceManifestSha256,
      stalePinsRemoved: runtime.stalePinsRemoved,
      cacheVerificationError: runtime.cacheVerificationError,
      serviceWorkerError: runtime.serviceWorkerError,
      error: runtime.error,
    });
  }

  function updateRuntimeStatus() {
    if (elements.corpusStatus) {
      elements.corpusStatus.textContent = runtime.corpusValidated && runtime.indexed
        ? `${runtime.records.toLocaleString()} records ready`
        : runtime.error
          ? "Unavailable"
          : "Loading and validating…";
      elements.corpusDetail.textContent = runtime.corpusSha256
        ? `SHA-256 ${shortHash(runtime.corpusSha256)}`
        : "Public records only";
      if (elements.corpusBreakdown && runtime.corpus) {
        elements.corpusBreakdown.textContent =
          `${runtime.corpus.post.toLocaleString()} posts · ` +
          `${runtime.corpus.field_note.toLocaleString()} field notes · ` +
          `${runtime.corpus.work.toLocaleString()} repositories`;
      }
    }

    if (elements.storageStatus) {
      elements.storageStatus.textContent = runtime.storageMode === "localStorage"
        ? "Local persistence"
        : runtime.storageMode === "memory"
          ? "Memory mode"
          : "Initializing…";
      elements.storageDetail.textContent = runtime.storageMode === "memory"
        ? "Usable now; cleared on restart"
        : "No account or telemetry";
    }

    if (elements.offlineStatus) {
      elements.offlineStatus.textContent = runtime.offlineReady
        ? "Offline ready"
        : runtime.serviceWorkerControlled
          ? "Cache unverified"
        : runtime.serviceWorkerActivated && runtime.cachedCorpusVerified
          ? "Reload required"
        : runtime.serviceWorkerActivated
          ? "Cache unverified"
        : runtime.serviceWorkerHandled
          ? "Online only"
          : "Checking…";
      if (runtime.offlineReady) {
        elements.offlineDetail.textContent = navigator.onLine
          ? "Offline shell is active"
          : "Working from the local cache";
      } else if (runtime.serviceWorkerControlled) {
        elements.offlineDetail.textContent = "Controlled page; cached corpus integrity is not confirmed";
      } else if (runtime.serviceWorkerActivated && runtime.cachedCorpusVerified) {
        elements.offlineDetail.textContent = "Verified cache installed; this page is not controlled yet";
      } else if (runtime.serviceWorkerActivated) {
        elements.offlineDetail.textContent = "Worker active; cached corpus integrity is not confirmed";
      } else if (runtime.serviceWorkerHandled) {
        elements.offlineDetail.textContent = "Offline use is not confirmed";
      } else {
        elements.offlineDetail.textContent = "Not yet confirmed";
      }
      if (elements.offlineReload) {
        elements.offlineReload.hidden = !runtime.serviceWorkerActivated
          || !runtime.cachedCorpusVerified
          || runtime.serviceWorkerControlled;
      }
    }
  }

  function setMode(mode) {
    if (!Object.prototype.hasOwnProperty.call(MODE_ACTIONS, mode)) {
      return;
    }
    activeMode = mode;
    elements.modes.forEach((button) => {
      const selected = button.getAttribute("data-mode") === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    if (elements.form) {
      elements.form.setAttribute("data-semantic-action", MODE_ACTIONS[mode]);
    }
    if (elements.submit) {
      elements.submit.setAttribute("data-semantic-action", MODE_ACTIONS[mode]);
      elements.submit.textContent = mode === "answer"
        ? "Inspect evidence"
        : mode === "evolution"
          ? "Trace evolution"
          : "Run challenge";
    }
  }

  function modeFromState(state) {
    const preferences = objectValue(objectValue(state).preferences);
    return Object.prototype.hasOwnProperty.call(MODE_ACTIONS, preferences.mode)
      ? preferences.mode
      : "answer";
  }

  function applyStateView(state) {
    const snapshot = objectValue(state);
    setMode(modeFromState(snapshot));
    renderPinned(snapshot);
  }

  function refreshStorageMode() {
    if (store && typeof store.storageMode === "function") {
      runtime.storageMode = store.storageMode();
      updateRuntimeStatus();
    }
    return runtime.storageMode;
  }

  function reconcileStoredPins(engine) {
    const before = store.get();
    const pins = Array.isArray(before.pinnedCitations) ? before.pinnedCitations : [];
    const validPins = pins.filter((citation) => {
      try {
        const validation = engine.validateCitation(citation);
        return validation && validation.ok === true;
      } catch (_error) {
        return false;
      }
    });
    const removed = pins.length - validPins.length;
    let state = before;
    if (removed > 0) {
      state = store.update((draft) => {
        draft.pinnedCitations = validPins;
      });
    }
    refreshStorageMode();
    return { state, removed };
  }

  function evidenceCitation(item) {
    const candidate = objectValue(item);
    return objectValue(candidate.citation || candidate);
  }

  function evidenceText(item) {
    const candidate = objectValue(item);
    const citation = evidenceCitation(candidate);
    return text(
      candidate.text
      || candidate.claim
      || candidate.statement
      || candidate.summary
      || candidate.quote
      || citation.quote
      || candidate.value
      || citation.value,
      "Exact evidence is available in the source inspector.",
    );
  }

  function citationLabel(citation, index) {
    const source = objectValue(citation);
    return text(source.title || source.sourceTitle || source.sourceId, `Source ${index + 1}`);
  }

  function citationMeta(citation) {
    const source = objectValue(citation);
    const values = [
      source.sourceType ? text(source.sourceType).replaceAll("_", " ") : "",
      source.date ? displayDate(source.date) : "",
      source.timeBasis ? text(source.timeBasis).replaceAll("-", " ") : "",
    ].filter(Boolean);
    return values.join(" · ") || "Public source";
  }

  function citationButtons(citation, index) {
    const controls = create("div", "twin-citation-controls");
    const open = create("button", "twin-citation-button", `Open source ${index + 1}`);
    const pin = create("button", "twin-citation-button", "Pin evidence");

    open.type = "button";
    open.setAttribute("data-semantic-action", "citation.open");
    open.setAttribute("aria-label", `Open citation details for ${citationLabel(citation, index)}`);
    open.addEventListener("click", () => openCitation(citation, open));

    pin.type = "button";
    pin.setAttribute("data-semantic-action", "citation.pin");
    pin.setAttribute("aria-label", `Pin citation for ${citationLabel(citation, index)}`);
    pin.addEventListener("click", () => pinCitation(citation, pin));

    controls.append(open, pin);
    return controls;
  }

  function evidenceCard(item, index, label) {
    const citation = evidenceCitation(item);
    const article = create("article", "twin-evidence-card");
    const header = create("div", "twin-evidence-head");
    const badge = create("span", "twin-evidence-number", label || `[${index + 1}]`);
    const source = create("div");
    const title = create("strong", "", citationLabel(citation, index));
    const meta = create("span", "", citationMeta(citation));
    const quote = create("blockquote", "", evidenceText(item));

    source.append(title, meta);
    header.append(badge, source);
    article.append(header, quote, citationButtons(citation, index));
    return article;
  }

  function emptyResult(title, message, className = "") {
    const panel = create("div", `twin-empty-state ${className}`.trim());
    panel.append(create("strong", "", title), create("p", "", message));
    return panel;
  }

  function responseData(response) {
    const data = objectValue(response && response.data);
    return objectValue(data.result || data);
  }

  function renderAnswer(data) {
    const claims = Array.isArray(data.claims)
      ? data.claims
      : Array.isArray(data.items)
        ? data.items
        : [];
    const answered = claims.length > 0 && data.status !== "insufficient-evidence";
    elements.resultTitle.textContent = answered ? "Supported public evidence" : "Insufficient public evidence";
    elements.resultCount.textContent = `${claims.length} citation${claims.length === 1 ? "" : "s"}`;
    if (!answered) {
      elements.results.appendChild(emptyResult(
        "The twin abstained.",
        text(data.message || data.reason, "No exact public evidence in the corpus supports this question. Try narrower terms or inspect another mode."),
        "is-abstention",
      ));
      return;
    }
    claims.forEach((claim, index) => {
      elements.results.appendChild(evidenceCard(claim, index));
    });
  }

  function renderEvolution(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    elements.resultTitle.textContent = items.length ? "Evidence through time" : "No supported evolution";
    elements.resultCount.textContent = `${items.length} citation${items.length === 1 ? "" : "s"}`;
    if (!items.length) {
      elements.results.appendChild(emptyResult(
        "A timeline needs distinct dated sources.",
        text(data.message || data.reason, "The public corpus does not contain enough exact evidence to establish an evolution."),
        "is-abstention",
      ));
      return;
    }
    const timeline = create("ol", "twin-timeline");
    items.forEach((item, index) => {
      const row = create("li");
      const at = create("time", "", displayDate(item.at || evidenceCitation(item).date));
      row.append(at, evidenceCard(item, index));
      timeline.appendChild(row);
    });
    elements.results.appendChild(timeline);
  }

  function resultSection(title, items, offset, emptyMessage) {
    const section = create("section", "twin-challenge-section");
    section.appendChild(create("h4", "", title));
    if (!items.length) {
      section.appendChild(create("p", "twin-muted", emptyMessage));
      return section;
    }
    items.forEach((item, index) => {
      section.appendChild(evidenceCard(item, offset + index));
    });
    return section;
  }

  function renderChallenge(data) {
    const thesis = Array.isArray(data.thesis) ? data.thesis : [];
    const counter = Array.isArray(data.counterevidence) ? data.counterevidence : [];
    const total = thesis.length + counter.length;
    elements.resultTitle.textContent = total ? "Claim and explicit qualification" : "Missing counterevidence";
    elements.resultCount.textContent = `${total} citation${total === 1 ? "" : "s"}`;
    if (!total) {
      elements.results.appendChild(emptyResult(
        "The twin will not manufacture disagreement.",
        text(data.message || data.reason, "No explicit challenge relationship can be proved from the public corpus."),
        "is-abstention",
      ));
      return;
    }
    elements.results.append(
      resultSection("Supported thesis", thesis, 0, "No supported thesis was found."),
      resultSection(
        "Explicit counterevidence or qualification",
        counter,
        thesis.length,
        "No curated or textually explicit qualification was found. Related search results are not treated as counterevidence.",
      ),
    );
  }

  function renderResult(mode, response) {
    clear(elements.results);
    elements.results.setAttribute("aria-busy", "false");
    if (!response || response.ok !== true) {
      const error = objectValue(response && response.error);
      elements.resultTitle.textContent = "Action could not complete";
      elements.resultCount.textContent = "0 citations";
      elements.results.appendChild(emptyResult(
        text(error.code, "STRUCTURED_ERROR"),
        text(error.message, "The semantic action failed without changing local state."),
        "is-error",
      ));
      return;
    }
    const data = responseData(response);
    if (mode === "evolution") {
      renderEvolution(data);
    } else if (mode === "challenge") {
      renderChallenge(data);
    } else {
      renderAnswer(data);
    }
  }

  function sourceDatum(source, citation, names) {
    for (const name of names) {
      if (source[name] != null) {
        return source[name];
      }
      if (citation[name] != null) {
        return citation[name];
      }
    }
    return null;
  }

  function sourceRow(label, value, code = false) {
    const row = create("div", "twin-source-row");
    const term = create("dt", "", label);
    const description = create("dd");
    const output = code ? create("code", "", value) : create("span", "", value);
    description.appendChild(output);
    row.append(term, description);
    return row;
  }

  function showSource(payload) {
    if (!elements.dialog || !elements.dialogContent) {
      return;
    }
    const outer = objectValue(payload);
    const source = objectValue(outer.record || outer.source || outer.data || outer);
    const citation = objectValue(outer.citation || source.citation || activeCitation || outer);
    const title = text(sourceDatum(source, citation, ["title", "sourceTitle", "sourceId"]), "Citation details");
    const quote = citation.quote != null
      ? citation.quote
      : citation.value != null
        ? citation.value
        : sourceDatum(source, citation, ["quote", "value", "text"]);
    const locator = citation.locator != null
      ? citation.locator
      : sourceDatum(source, citation, ["locator", "pointer"]);
    const url = safeUrl(sourceDatum(source, citation, ["sourceUrl", "url"]));
    const list = create("dl", "twin-source-list");

    elements.dialogTitle.textContent = title;
    list.append(
      sourceRow("Author", text(sourceDatum(source, citation, ["author"]), "Not declared")),
      sourceRow("Source type", text(sourceDatum(source, citation, ["sourceType"]), "Not declared").replaceAll("_", " ")),
      sourceRow("Date", displayDate(sourceDatum(source, citation, ["date"]))),
      sourceRow("Time basis", text(sourceDatum(source, citation, ["timeBasis"]), "Not declared").replaceAll("-", " ")),
      sourceRow("Exact quote or value", text(quote, "Not available"), true),
      sourceRow("SHA-256", text(sourceDatum(source, citation, ["sourceSha256", "sha256"]), "Not declared"), true),
      sourceRow(
        "Locator",
        typeof locator === "object" && locator !== null ? JSON.stringify(locator) : text(locator, "Not declared"),
        true,
      ),
    );

    if (url) {
      const row = create("div", "twin-source-row");
      const term = create("dt", "", "URL");
      const description = create("dd");
      const link = create("a", "", url);
      link.href = url;
      link.rel = "noopener noreferrer";
      link.setAttribute("data-semantic-action", "sources.get");
      if (new URL(url).origin !== window.location.origin) {
        link.target = "_blank";
      }
      description.appendChild(link);
      row.append(term, description);
      list.appendChild(row);
    } else {
      list.appendChild(sourceRow("URL", "Not declared"));
    }

    clear(elements.dialogContent);
    elements.dialogContent.appendChild(list);
    if (!elements.dialog.open) {
      elements.dialog.showModal();
    }
    elements.dialogClose.focus();
  }

  async function openCitation(citation, trigger) {
    activeCitation = citation;
    lastDialogTrigger = trigger || document.activeElement;
    const response = await dispatchAction("citation.open", { citation });
    if (response.ok && !elements.dialog.open) {
      showSource(responseData(response));
    }
    if (!response.ok) {
      setLive(`${response.error.code}: ${response.error.message}`);
    }
  }

  async function pinCitation(citation, button) {
    const response = await dispatchAction("citation.pin", { citation });
    if (!response.ok) {
      setLive(`${response.error.code}: ${response.error.message}`);
      return;
    }
    const data = responseData(response);
    const newlyPinned = data.pinned !== false;
    button.textContent = newlyPinned ? "Pinned" : "Already pinned";
    setLive(newlyPinned ? "Citation pinned to local evidence." : "Citation was already pinned.");
    await refreshState();
  }

  function pinnedCitation(item) {
    const candidate = objectValue(item);
    return objectValue(candidate.citation || candidate);
  }

  function pinnedEvidenceText(citation) {
    const source = objectValue(citation);
    if (Object.prototype.hasOwnProperty.call(source, "quote")) {
      return text(source.quote, "Exact evidence unavailable.");
    }
    if (Object.prototype.hasOwnProperty.call(source, "value")) {
      return typeof source.value === "string"
        ? source.value
        : JSON.stringify(source.value);
    }
    return "Exact evidence unavailable.";
  }

  function renderPinned(state) {
    const snapshot = objectValue(state);
    const pins = Array.isArray(snapshot.pinnedCitations) ? snapshot.pinnedCitations : [];
    clear(elements.pinned);
    elements.pinnedCount.textContent = text(pins.length);
    if (!pins.length) {
      elements.pinned.appendChild(create("p", "twin-muted", "Pin a citation to keep it beside your investigation."));
      return;
    }
    const list = create("ol", "twin-pinned-items");
    pins.forEach((item, index) => {
      const citation = pinnedCitation(item);
      const row = create("li");
      const label = create("button", "twin-pinned-source", citationLabel(citation, index));
      label.type = "button";
      label.setAttribute("data-semantic-action", "citation.open");
      label.addEventListener("click", () => openCitation(citation, label));
      row.append(label, create("span", "", pinnedEvidenceText(citation)));
      list.appendChild(row);
    });
    elements.pinned.appendChild(list);
  }

  async function refreshState() {
    const response = await dispatchAction("state.get");
    if (response.ok) {
      const data = responseData(response);
      applyStateView(objectValue(data.state || data));
    }
    return response;
  }

  async function dispatchAction(action, input) {
    if (!controller) {
      return errorEnvelope(action, "NOT_READY", "The public twin is still initializing.", true);
    }
    try {
      const response = await controller.dispatch(action, input);
      refreshStorageMode();
      return response && typeof response === "object"
        ? response
        : errorEnvelope(action, "INVALID_RESPONSE", "The semantic controller returned an invalid response.");
    } catch (error) {
      refreshStorageMode();
      return errorEnvelope(action, "ACTION_FAILED", error && error.message, false);
    }
  }

  async function submitQuestion() {
    const question = elements.question.value.trim();
    if (!question) {
      elements.question.focus();
      setLive("Enter a question before running a semantic action.");
      return;
    }
    const action = MODE_ACTIONS[activeMode];
    elements.results.setAttribute("aria-busy", "true");
    elements.submit.disabled = true;
    setLive(`Running ${action} against the local public corpus.`);
    const response = await dispatchAction(action, { question });
    renderResult(activeMode, response);
    elements.submit.disabled = !runtime.ready;
    if (response.ok) {
      setLive(`${action} completed with inspectable evidence.`);
      await refreshState();
    } else {
      setLive(`${response.error.code}: ${response.error.message}`);
    }
  }

  async function exportState() {
    const response = await dispatchAction("state.export");
    if (!response.ok) {
      elements.stateStatus.textContent = `${response.error.code}: ${response.error.message}`;
      return;
    }
    const data = responseData(response);
    const serialized = text(data.serialized || data.json || data);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kody-twin-state.json";
    link.setAttribute("data-semantic-action", "state.export");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    elements.stateStatus.textContent = "State exported as deterministic JSON.";
  }

  async function importState(file) {
    if (!file) {
      return;
    }
    try {
      const serialized = await file.text();
      const response = await dispatchAction("state.import", { serialized });
      if (!response.ok) {
        elements.stateStatus.textContent = `${response.error.code}: ${response.error.message}`;
        return;
      }
      elements.stateStatus.textContent = "State imported and replaced transactionally.";
      await refreshState();
    } catch (error) {
      elements.stateStatus.textContent = `IMPORT_READ_FAILED: ${text(error.message)}`;
    } finally {
      elements.importInput.value = "";
    }
  }

  async function resetState() {
    const response = await dispatchAction("state.reset");
    if (!response.ok) {
      elements.stateStatus.textContent = `${response.error.code}: ${response.error.message}`;
      return;
    }
    elements.stateStatus.textContent = "Local twin state reset.";
    await refreshState();
  }

  async function buildProductPrompt() {
    const app = elements.appIdea.value.trim();
    if (!app) {
      elements.appIdea.focus();
      elements.promptStatus.textContent = "Enter an app idea first.";
      return null;
    }
    const response = await dispatchAction("prompt.build", { app });
    if (!response.ok) {
      elements.promptStatus.textContent = `${response.error.code}: ${response.error.message}`;
      return null;
    }
    const data = responseData(response);
    currentPrompt = text(data.prompt);
    elements.promptText.textContent = currentPrompt;
    elements.copyPrompt.disabled = !currentPrompt;
    elements.promptStatus.textContent = "Canonical prompt built. Only {APP} was replaced.";
    return currentPrompt;
  }

  async function copyProductPrompt() {
    const app = elements.appIdea.value.trim();
    if (!app) {
      elements.appIdea.focus();
      elements.promptStatus.textContent = "Enter an app idea first.";
      return;
    }
    const response = await dispatchAction("prompt.copy", { app });
    if (!response.ok) {
      elements.promptStatus.textContent = `${response.error.code}: ${response.error.message}`;
      return;
    }
    const data = responseData(response);
    currentPrompt = text(data.prompt, currentPrompt);
    if (currentPrompt) {
      elements.promptText.textContent = currentPrompt;
    }
    elements.promptStatus.textContent = "Exact canonical prompt copied.";
  }

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuestion();
    });

    elements.question.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        submitQuestion();
      }
    });

    elements.modes.forEach((button) => {
      button.addEventListener("click", async () => {
        const mode = button.getAttribute("data-mode");
        const response = await dispatchAction("ui.setMode", { mode });
        if (response.ok) {
          setMode(mode);
          setLive(`Semantic mode set to ${mode}.`);
        } else {
          setLive(`${response.error.code}: ${response.error.message}`);
        }
      });
    });

    elements.exportButton.addEventListener("click", exportState);
    elements.importInput.addEventListener("change", () => importState(elements.importInput.files[0]));
    elements.resetButton.addEventListener("click", resetState);
    elements.offlineReload.addEventListener("click", async () => {
      elements.offlineReload.disabled = true;
      setLive("Confirming corpus status, then reloading once under service-worker control.");
      await dispatchAction("corpus.status");
      window.location.reload();
    });
    elements.buildPrompt.addEventListener("click", buildProductPrompt);
    elements.copyPrompt.addEventListener("click", copyProductPrompt);
    elements.appIdea.addEventListener("input", () => {
      const hasIdea = Boolean(elements.appIdea.value.trim());
      currentPrompt = "";
      elements.buildPrompt.disabled = !runtime.ready || !hasIdea;
      elements.copyPrompt.disabled = true;
      elements.promptText.textContent = hasIdea
        ? "Build the prompt to replace {APP} with this exact idea."
        : "Enter an app idea to replace the canonical {APP} token.";
      elements.promptStatus.textContent = "";
    });
    elements.appIdea.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        buildProductPrompt();
      }
    });

    elements.dialogClose.addEventListener("click", () => elements.dialog.close());
    elements.dialog.addEventListener("cancel", () => {
      window.setTimeout(() => {
        if (lastDialogTrigger && document.contains(lastDialogTrigger)) {
          lastDialogTrigger.focus();
        }
      }, 0);
    });
    elements.dialog.addEventListener("close", () => {
      if (lastDialogTrigger && document.contains(lastDialogTrigger)) {
        lastDialogTrigger.focus();
      }
      lastDialogTrigger = null;
    });

    window.addEventListener("online", () => {
      updateRuntimeStatus();
      setLive("Network available. The twin still runs against its local public corpus.");
    });
    window.addEventListener("offline", () => {
      updateRuntimeStatus();
      setLive(runtime.offlineReady
        ? "Network unavailable. Continuing from the verified offline shell."
        : "Network unavailable and offline readiness was not confirmed.");
    });
  }

  async function cachedCorpusEvidence(Engine) {
    let cacheStorage;
    try {
      cacheStorage = window.caches;
    } catch (_error) {
      cacheStorage = null;
    }
    if (!cacheStorage || typeof cacheStorage.match !== "function") {
      return {
        ok: false,
        code: "CACHE_STORAGE_UNAVAILABLE",
        message: "CacheStorage is unavailable in this browser.",
      };
    }
    if (!Engine || typeof Engine.validateCorpus !== "function" || !runtime.corpusSha256) {
      return {
        ok: false,
        code: "CACHE_VALIDATION_UNAVAILABLE",
        message: "Cached corpus validation cannot run.",
      };
    }
    try {
      const response = await cacheStorage.match(CORPUS_URL, { ignoreSearch: true });
      if (!response || !response.ok) {
        return {
          ok: false,
          code: "CACHED_CORPUS_MISSING",
          message: "No successful cached corpus response was found.",
        };
      }
      const cachedCorpus = await response.clone().json();
      const validation = Engine.validateCorpus(cachedCorpus);
      if (!validation || validation.ok !== true) {
        return {
          ok: false,
          code: "CACHED_CORPUS_INVALID",
          message: "The cached corpus failed engine validation.",
        };
      }
      if (cachedCorpus.corpusSha256 !== runtime.corpusSha256) {
        return {
          ok: false,
          code: "CACHED_CORPUS_MISMATCH",
          message: "The cached corpus digest does not match the running corpus.",
        };
      }
      if (cachedCorpus.sourceManifestSha256 !== runtime.sourceManifestSha256) {
        return {
          ok: false,
          code: "CACHED_MANIFEST_MISMATCH",
          message: "The cached source manifest digest does not match the running corpus.",
        };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: "CACHE_VERIFICATION_FAILED",
        message: text(error && error.message, "Cached corpus verification failed."),
      };
    }
  }

  async function verifyCachedCorpus(Engine) {
    const timeout = new Promise((resolve) => {
      window.setTimeout(() => {
        resolve({
          ok: false,
          code: "CACHE_VERIFICATION_TIMEOUT",
          message: "Cached corpus verification exceeded the bounded startup window.",
        });
      }, 2500);
    });
    const result = await Promise.race([cachedCorpusEvidence(Engine), timeout]);
    runtime.cachedCorpusVerified = result.ok === true;
    runtime.cacheVerificationError = result.ok ? null : {
      code: result.code,
      message: result.message,
      retryable: true,
    };
    runtime.offlineReady = runtime.serviceWorkerControlled && runtime.cachedCorpusVerified;
    updateRuntimeStatus();
    return runtime.cachedCorpusVerified;
  }

  async function serviceWorkerStatus(Engine) {
    if (!("serviceWorker" in navigator)) {
      runtime.serviceWorkerHandled = true;
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("/twin/sw.js", { scope: "/twin/" });
      const readyRegistration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => window.setTimeout(() => resolve(null), 5000)),
      ]);
      const active = readyRegistration && readyRegistration.active
        ? readyRegistration.active
        : registration.active;
      runtime.serviceWorkerControlled = Boolean(navigator.serviceWorker.controller);
      runtime.serviceWorkerActivated = Boolean(active || runtime.serviceWorkerControlled);
      await verifyCachedCorpus(Engine);

      const pendingWorker = registration.installing || registration.waiting;
      if (!active && pendingWorker) {
        pendingWorker.addEventListener("statechange", async () => {
          if (pendingWorker.state === "activated") {
            runtime.serviceWorkerActivated = true;
            runtime.serviceWorkerControlled = Boolean(navigator.serviceWorker.controller);
            await verifyCachedCorpus(Engine);
            updateRuntimeStatus();
            if (!runtime.serviceWorkerControlled) {
              setLive(runtime.cachedCorpusVerified
                ? "Verified offline cache installed. Reload once to activate offline mode for this page."
                : "Worker activated, but cached corpus integrity is not verified.");
            }
          }
        });
      }

      navigator.serviceWorker.addEventListener("controllerchange", async () => {
        runtime.serviceWorkerControlled = Boolean(navigator.serviceWorker.controller);
        runtime.serviceWorkerActivated = runtime.serviceWorkerControlled || runtime.serviceWorkerActivated;
        await verifyCachedCorpus(Engine);
        updateRuntimeStatus();
        if (runtime.offlineReady) {
          setLive("Offline shell control and cached corpus integrity are verified for /twin/.");
        } else if (runtime.serviceWorkerControlled) {
          setLive("Service-worker control is active, but cached corpus integrity is not verified.");
        }
      });

      if (runtime.serviceWorkerActivated && !runtime.serviceWorkerControlled) {
        setLive(runtime.cachedCorpusVerified
          ? "Verified offline cache installed. Reload once to activate offline mode for this page."
          : "Worker activated, but cached corpus integrity is not verified.");
      }
    } catch (error) {
      runtime.offlineReady = false;
      runtime.cachedCorpusVerified = false;
      runtime.serviceWorkerError = {
        code: "SERVICE_WORKER_UNAVAILABLE",
        message: text(error.message),
        retryable: true,
      };
    } finally {
      runtime.serviceWorkerHandled = true;
      updateRuntimeStatus();
    }
  }

  function controllerView() {
    return {
      render(value, action) {
        const candidate = objectValue(value);
        let state = null;
        if (candidate.state && typeof candidate.state === "object") {
          state = candidate.state;
        } else if (Array.isArray(candidate.pinnedCitations) && candidate.preferences) {
          state = candidate;
        } else if (store && typeof store.get === "function") {
          try {
            state = store.get();
          } catch (_error) {
            state = null;
          }
        }
        if (state) {
          applyStateView(state);
        }
        const modesByAction = {
          "answer.ask": "answer",
          "evolution.compare": "evolution",
          "challenge.run": "challenge",
        };
        const mode = modesByAction[action];
        if (mode) {
          renderResult(mode, { ok: true, action, data: candidate });
          setLive("Evidence rendered from the verified public corpus.");
        }
      },
      setMode,
      openSource: showSource,
    };
  }

  function exposeApi(capabilities) {
    const api = {
      version: VERSION,
      capabilities: () => {
        if (controller && typeof controller.capabilities === "function") {
          return deepFreeze(controller.capabilities());
        }
        return deepFreeze(capabilities);
      },
      inspect: inspectRuntime,
      dispatch: (action, input) => dispatchAction(action, input),
      runMission: async (mission) => {
        if (!controller) {
          return errorEnvelope("mission.run", "NOT_READY", "The public twin is still initializing.", true);
        }
        try {
          return await controller.runMission(mission);
        } finally {
          refreshStorageMode();
        }
      },
      selfTest: () => {
        if (!controller) {
          return Promise.resolve(errorEnvelope("selfTest", "NOT_READY", "The public twin is still initializing.", true));
        }
        return controller.selfTest();
      },
    };
    window.KodyTwin = Object.freeze(api);
  }

  function exposeFailure(error) {
    runtime.phase = "error";
    runtime.ready = false;
    runtime.error = {
      code: text(error.code, "BOOT_FAILED"),
      message: text(error.message, "The public twin could not initialize."),
      retryable: Boolean(error.retryable),
    };
    exposeApi({ actions: [] });
    updateRuntimeStatus();
    elements.submit.disabled = true;
    elements.buildPrompt.disabled = true;
    elements.copyPrompt.disabled = true;
    renderResult("answer", errorEnvelope("bootstrap", runtime.error.code, runtime.error.message, runtime.error.retryable));
    setLive(`${runtime.error.code}: ${runtime.error.message}`);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) {
      const error = new Error(`Request failed with HTTP ${response.status}.`);
      error.code = "CORPUS_FETCH_FAILED";
      error.retryable = response.status >= 500;
      throw error;
    }
    return response.json();
  }

  async function fetchText(url) {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) {
      const error = new Error(`Request failed with HTTP ${response.status}.`);
      error.code = "PROMPT_FETCH_FAILED";
      error.retryable = response.status >= 500;
      throw error;
    }
    return response.text();
  }

  async function boot() {
    if (!elements.root) {
      return;
    }
    bindEvents();
    const Engine = moduleApi(["KodyTwinEngine", "TwinEngine", "twinEngine"], "createEngine");
    const TwinState = moduleApi(["KodyTwinState", "TwinState", "twinState"], "createStore");
    const Controller = moduleApi(["KodyTwinController", "TwinController", "twinController"], "createController");
    if (!Engine || !TwinState || !Controller) {
      const error = new Error("One or more semantic runtime modules are unavailable.");
      error.code = "MODULES_UNAVAILABLE";
      error.retryable = true;
      exposeFailure(error);
      return;
    }

    try {
      runtime.phase = "loading";
      const [corpus, prompt] = await Promise.all([
        fetchJson(CORPUS_URL),
        fetchText(PROMPT_URL),
      ]);

      const validation = typeof Engine.validateCorpus === "function"
        ? Engine.validateCorpus(corpus)
        : { ok: true, errors: [] };
      if (!validation || validation.ok !== true) {
        const error = new Error(`Corpus validation failed: ${JSON.stringify(validation && validation.errors || [])}`);
        error.code = "CORPUS_INVALID";
        error.retryable = false;
        throw error;
      }
      if (corpus.corpusSha256 !== EXPECTED_CORPUS_SHA256
          || corpus.sourceManifestSha256 !== EXPECTED_SOURCE_MANIFEST_SHA256) {
        const error = new Error("Loaded corpus does not match the trusted public twin release.");
        error.code = "CORPUS_RELEASE_MISMATCH";
        error.retryable = false;
        throw error;
      }
      runtime.corpusValidated = true;
      runtime.corpusSha256 = corpus.corpusSha256;
      runtime.sourceManifestSha256 = corpus.sourceManifestSha256;
      runtime.records = Number(corpus.stats && corpus.stats.total || corpus.records && corpus.records.length || 0);
      runtime.corpus = {
        post: Number(corpus.stats && corpus.stats.post || 0),
        field_note: Number(corpus.stats && corpus.stats.field_note || 0),
        work: Number(corpus.stats && corpus.stats.work || 0),
      };

      runtime.phase = "indexing";
      const engine = Engine.createEngine(corpus);
      runtime.indexed = true;

      store = TwinState.createStore({ storage: browserStorage() });
      refreshStorageMode();
      const reconciliation = reconcileStoredPins(engine);
      runtime.stalePinsRemoved = reconciliation.removed;
      runtime.stateInitialized = true;

      controller = Controller.createController({
        engine,
        store,
        view: controllerView(),
        prompt,
        copyText,
        corpusSha256: runtime.corpusSha256,
      });
      applyStateView(reconciliation.state);
      elements.stateStatus.textContent = `${reconciliation.removed} stale pinned citation${reconciliation.removed === 1 ? "" : "s"} removed during startup validation.`;

      runtime.phase = "offline-check";
      await serviceWorkerStatus(Engine);
      const capabilities = typeof controller.capabilities === "function"
        ? controller.capabilities()
        : { actions: [] };
      exposeApi(capabilities);

      runtime.phase = runtime.offlineReady ? "ready" : "ready-online";
      runtime.ready = runtime.corpusValidated
        && runtime.indexed
        && runtime.stateInitialized
        && runtime.serviceWorkerHandled;
      updateRuntimeStatus();
      elements.submit.disabled = !runtime.ready;
      elements.buildPrompt.disabled = !runtime.ready || !elements.appIdea.value.trim();
      await refreshState();
      setLive(runtime.offlineReady
        ? "Public twin ready. Corpus validated, indexed, and under offline service-worker control."
        : runtime.serviceWorkerActivated && runtime.cachedCorpusVerified
          ? "Public twin ready. Reload once to place this page under offline service-worker control."
          : runtime.serviceWorkerControlled
            ? "Public twin ready online. Service-worker control is active, but cached corpus integrity is not verified."
          : "Public twin ready in online mode. Offline readiness is not confirmed.");
    } catch (error) {
      exposeFailure(error);
    }
  }

  boot();
})();
