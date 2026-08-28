(() => {
  const state = {
    repos: [],
    visibleLimit: 60,
  };

  const elements = {
    featured: document.querySelector("#work-featured"),
    catalog: document.querySelector("#work-catalog"),
    search: document.querySelector("#work-search"),
    family: document.querySelector("#work-family"),
    activity: document.querySelector("#work-activity"),
    sort: document.querySelector("#work-sort"),
    count: document.querySelector("#work-result-count"),
    showAll: document.querySelector("#work-show-all"),
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shortDate(value) {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
      return "#";
    }
  }

  function repoCard(repo, featured = false) {
    const homepage = repo.homepage
      ? `<a href="${escapeHtml(safeUrl(repo.homepage))}">Live site</a>`
      : "";
    const stars = repo.stars
      ? `<span><i class="fas fa-star" aria-hidden="true"></i> ${repo.stars}</span>`
      : "";
    return `
      <article class="${featured ? "work-featured-card" : "work-repo-card"}">
        <div class="work-card-topline">
          <span>${escapeHtml(repo.family)}</span>
          <span>${escapeHtml(repo.activity)}</span>
        </div>
        <h3><a href="${escapeHtml(safeUrl(repo.url))}">${escapeHtml(repo.name)}</a></h3>
        <p>${escapeHtml(repo.description || "Public project and build record.")}</p>
        <div class="work-repo-meta">
          <span>${escapeHtml(repo.language)}</span>
          ${stars}
          <span>Updated ${shortDate(repo.pushed_at)}</span>
        </div>
        <div class="work-card-links">
          <a href="${escapeHtml(safeUrl(repo.url))}">Source</a>
          ${homepage}
        </div>
      </article>
    `;
  }

  function currentRepos() {
    const query = elements.search.value.trim().toLowerCase();
    const family = elements.family.value;
    const activity = elements.activity.value;
    const sort = elements.sort.value;
    const filtered = state.repos.filter((repo) => {
      const haystack = [
        repo.name,
        repo.description,
        repo.language,
        repo.family,
        repo.category,
        ...(repo.topics || []),
      ].join(" ").toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (!family || repo.family === family) &&
        (!activity || repo.activity === activity)
      );
    });

    filtered.sort((left, right) => {
      if (sort === "stars") {
        return right.stars - left.stars || right.pushed_at.localeCompare(left.pushed_at);
      }
      if (sort === "oldest") {
        return left.created_at.localeCompare(right.created_at);
      }
      if (sort === "name") {
        return left.name.localeCompare(right.name);
      }
      return right.pushed_at.localeCompare(left.pushed_at);
    });
    return filtered;
  }

  function renderCatalog() {
    const repos = currentRepos();
    const shown = repos.slice(0, state.visibleLimit);
    elements.count.textContent = `${repos.length} project${repos.length === 1 ? "" : "s"}`;
    elements.catalog.innerHTML = shown.map((repo) => repoCard(repo)).join("");
    elements.showAll.hidden = shown.length >= repos.length;
    elements.showAll.textContent = `Show all ${repos.length} projects`;
  }

  function render(payload) {
    state.repos = payload.repos;
    document.querySelector("#work-stat-repos").textContent =
      payload.stats.public_source_repos.toLocaleString();
    document.querySelector("#work-stat-active").textContent =
      payload.stats.active_90d.toLocaleString();
    document.querySelector("#work-stat-new").textContent =
      payload.stats.active_30d.toLocaleString();
    document.querySelector("#work-stat-languages").textContent =
      payload.stats.languages.toLocaleString();

    const featured = state.repos
      .filter((repo) => repo.featured_rank)
      .sort((left, right) => left.featured_rank - right.featured_rank);
    elements.featured.innerHTML = featured.map((repo) => repoCard(repo, true)).join("");

    payload.families.forEach((family) => {
      const option = document.createElement("option");
      option.value = family;
      option.textContent = family;
      elements.family.append(option);
    });
    renderCatalog();
  }

  [elements.search, elements.family, elements.activity, elements.sort].forEach((element) => {
    element.addEventListener("input", () => {
      state.visibleLimit = 60;
      renderCatalog();
    });
  });
  elements.showAll.addEventListener("click", () => {
    state.visibleLimit = Number.POSITIVE_INFINITY;
    renderCatalog();
  });

  fetch("/api/works.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Catalog request failed with ${response.status}`);
      }
      return response.json();
    })
    .then(render)
    .catch((error) => {
      elements.count.textContent = "Catalog temporarily unavailable";
      elements.catalog.innerHTML = `<p>${escapeHtml(error.message)}. Browse the complete work at <a href="https://github.com/kody-w?tab=repositories">GitHub</a>.</p>`;
    });
})();
