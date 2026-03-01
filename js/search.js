// Client-side search using a pre-built JSON index
(function () {
  var overlay = document.getElementById('search-overlay');
  var input = document.getElementById('search-input');
  var resultsContainer = document.getElementById('search-results');
  var posts = [];

  function openSearch() {
    overlay.classList.add('active');
    input.focus();
    input.value = '';
    resultsContainer.innerHTML = '';
    if (posts.length === 0) loadIndex();
  }

  function closeSearch() {
    overlay.classList.remove('active');
  }

  function loadIndex() {
    fetch('/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { posts = data; })
      .catch(function () {
        resultsContainer.innerHTML = '<p class="search-no-results">Could not load search index.</p>';
      });
  }

  function search(query) {
    if (!query) { resultsContainer.innerHTML = ''; return; }
    var terms = query.toLowerCase().split(/\s+/);
    var matches = posts.filter(function (p) {
      var haystack = (p.title + ' ' + p.excerpt).toLowerCase();
      return terms.every(function (t) { return haystack.indexOf(t) !== -1; });
    }).slice(0, 10);

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<p class="search-no-results">No results found.</p>';
      return;
    }
    resultsContainer.innerHTML = matches.map(function (p) {
      return '<a class="search-result" href="' + p.url + '">' +
        '<span class="search-result-title">' + p.title + '</span>' +
        '<span class="search-result-date">' + p.date + '</span>' +
        '</a>';
    }).join('');
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
