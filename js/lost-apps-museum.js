(() => {
  const cards = [...document.querySelectorAll("[data-lost-app-card]")];
  const search = document.querySelector("#lost-apps-search");
  const category = document.querySelector("#lost-apps-category");
  const readiness = document.querySelector("#lost-apps-readiness");
  const reset = document.querySelector("#lost-apps-reset");
  const count = document.querySelector("#lost-apps-result-count");
  const empty = document.querySelector("#lost-apps-empty");
  const dialog = document.querySelector("#lost-app-preview-dialog");
  const frame = document.querySelector("#lost-app-preview-frame");
  const previewTitle = document.querySelector("#lost-app-preview-title");
  const close = document.querySelector("#lost-app-preview-close");
  let previewTrigger = null;

  if (!cards.length || !search || !category || !readiness || !count || !empty) {
    return;
  }

  const allowedPreview = /^\/learnwithkody\/demos\/\d+-[a-z0-9-]+\.html$/;

  function updateQuery() {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set("q", search.value.trim());
    if (category.value) params.set("category", category.value);
    if (readiness.value) params.set("readiness", readiness.value);
    const suffix = params.toString();
    const next = `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }

  function filterCards() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const match =
        (!query || card.dataset.search.includes(query)) &&
        (!category.value || card.dataset.category === category.value) &&
        (!readiness.value || card.dataset.readiness === readiness.value);
      card.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `Showing ${visible} of ${cards.length} exhibits`;
    empty.hidden = visible !== 0;
    updateQuery();
  }

  function closePreview() {
    if (!dialog || !frame) return;
    frame.removeAttribute("src");
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    if (previewTrigger) {
      previewTrigger.focus();
      previewTrigger = null;
    }
  }

  function openPreview(button) {
    if (!dialog || !frame || !previewTitle) return;
    const url = button.dataset.lostAppPreview || "";
    if (!allowedPreview.test(url)) return;
    previewTrigger = button;
    previewTitle.textContent = button.dataset.lostAppTitle || "Clean-room restoration";
    frame.title = `${previewTitle.textContent} — isolated preview`;
    frame.src = url;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  const params = new URLSearchParams(window.location.search);
  search.value = params.get("q") || "";
  category.value = params.get("category") || "";
  readiness.value = params.get("readiness") || "";

  [search, category, readiness].forEach((control) => {
    control.addEventListener("input", filterCards);
  });
  reset.addEventListener("click", () => {
    window.setTimeout(filterCards);
  });
  document.querySelectorAll("[data-lost-app-preview]").forEach((button) => {
    button.addEventListener("click", () => openPreview(button));
  });
  if (close) close.addEventListener("click", closePreview);
  if (dialog) {
    dialog.addEventListener("close", () => frame && frame.removeAttribute("src"));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closePreview();
    });
  }
  filterCards();
})();
