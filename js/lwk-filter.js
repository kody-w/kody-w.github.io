// Learn with Kody — client-side example filter
(function () {
  const grid = document.getElementById('lwk-grid');
  const empty = document.getElementById('lwk-empty');
  const filterRoot = document.getElementById('lwk-filters');
  if (!grid || !filterRoot) return;

  const state = { category: 'all', difficulty: 'all' };

  function apply() {
    const cards = grid.querySelectorAll('.lwk-example-card');
    let visible = 0;
    cards.forEach((card) => {
      const cat = card.dataset.category || '';
      const diff = card.dataset.difficulty || '';
      const matchCat = state.category === 'all' || cat === state.category;
      const matchDiff = state.difficulty === 'all' || diff === state.difficulty;
      const show = matchCat && matchDiff;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  filterRoot.addEventListener('click', (e) => {
    const btn = e.target.closest('.lwk-filter-btn');
    if (!btn) return;
    const type = btn.dataset.filterType;
    const value = btn.dataset.filterValue;
    if (!type) return;
    state[type] = value;
    filterRoot
      .querySelectorAll(`.lwk-filter-btn[data-filter-type="${type}"]`)
      .forEach((b) => b.classList.toggle('is-active', b === btn));
    apply();
  });

  apply();
})();
