// Client-side search using a pre-built JSON index
(function () {
  var overlay = document.getElementById('search-overlay');
  var input = document.getElementById('search-input');
  var resultsContainer = document.getElementById('search-results');
  var entries = [];

  function openSearch() {
    overlay.classList.add('active');
    input.focus();
    input.value = '';
    resultsContainer.textContent = '';
    if (entries.length === 0) loadIndex();
  }

  function closeSearch() {
    overlay.classList.remove('active');
  }

  function loadIndex() {
    fetch('/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        entries = Array.isArray(data) ? data : [];
        if (input.value) search(input.value);
      })
      .catch(function () {
        showMessage('Could not load search index.');
      });
  }

  function showMessage(message) {
    var paragraph = document.createElement('p');
    paragraph.className = 'search-no-results';
    paragraph.textContent = message;
    resultsContainer.textContent = '';
    resultsContainer.appendChild(paragraph);
  }

  function searchableText(value) {
    if (Array.isArray(value)) return value.join(' ');
    return value == null ? '' : String(value);
  }

  function safeLocalUrl(value) {
    return typeof value === 'string' && value.charAt(0) === '/' && value.charAt(1) !== '/'
      ? value
      : '/';
  }

  function renderMatches(matches) {
    var fragment = document.createDocumentFragment();

    matches.forEach(function (entry) {
      var link = document.createElement('a');
      var title = document.createElement('span');
      var metadata = [entry.type, entry.status, entry.date]
        .map(searchableText)
        .filter(function (value) { return value; });

      link.className = 'search-result';
      link.href = safeLocalUrl(entry.url);
      title.className = 'search-result-title';
      title.textContent = searchableText(entry.title);
      link.appendChild(title);

      if (metadata.length) {
        var meta = document.createElement('span');
        meta.className = 'search-result-date';
        meta.textContent = metadata.join(' · ');
        link.appendChild(meta);
      }

      fragment.appendChild(link);
    });

    resultsContainer.textContent = '';
    resultsContainer.appendChild(fragment);
  }

  function search(query) {
    if (!query) { resultsContainer.textContent = ''; return; }
    var terms = query.toLowerCase().split(/\s+/);
    var matches = entries.filter(function (entry) {
      var haystack = [
        entry.title,
        entry.excerpt,
        entry.type,
        entry.status,
        entry.category,
        entry.tags
      ].map(searchableText).join(' ').toLowerCase();
      return terms.every(function (t) { return haystack.indexOf(t) !== -1; });
    }).slice(0, 10);

    if (matches.length === 0) {
      showMessage('No results found.');
      return;
    }
    renderMatches(matches);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Cmd+K or Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('active') ? closeSearch() : openSearch();
    }
    // Esc to close
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Click outside to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  if (input) {
    input.addEventListener('input', function () { search(this.value); });
  }
})();
