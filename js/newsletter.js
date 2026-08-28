(() => {
  const search = document.querySelector("#newsletter-archive-search");
  const status = document.querySelector("#newsletter-archive-status");
  const editions = [...document.querySelectorAll(".newsletter-edition")];

  if (!search || !status || editions.length === 0) {
    return;
  }

  const totalArticles = document.querySelectorAll(".newsletter-edition-item").length;
  const disclosureState = new Map();
  let wasSearching = false;

  function filterEditions() {
    const query = search.value.trim().toLowerCase();
    const isSearching = query.length > 0;
    let visibleArticles = 0;
    let visibleEditions = 0;

    if (isSearching && !wasSearching) {
      editions.forEach((edition) => disclosureState.set(edition, edition.open));
    }

    editions.forEach((edition) => {
      const items = [...edition.querySelectorAll(".newsletter-edition-item")];
      let editionMatches = 0;

      items.forEach((item) => {
        const matches = !query || item.dataset.search.toLowerCase().includes(query);
        item.hidden = !matches;
        if (matches) {
          editionMatches += 1;
          visibleArticles += 1;
        }
      });

      edition.hidden = editionMatches === 0;
      if (editionMatches > 0) {
        visibleEditions += 1;
        if (isSearching) {
          edition.open = true;
        } else if (wasSearching) {
          edition.open = disclosureState.get(edition) || false;
        }
      }
    });

    status.textContent = isSearching
      ? `${visibleArticles} matching article${visibleArticles === 1 ? "" : "s"} across ${visibleEditions} edition${visibleEditions === 1 ? "" : "s"}`
      : `${totalArticles} articles across ${editions.length} editions`;
    wasSearching = isSearching;
  }

  search.addEventListener("input", filterEditions);
})();
