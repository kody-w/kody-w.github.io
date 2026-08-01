const API = { fs: 'api/fs.json', apps: 'api/apps.json' };
const state = { fs: null, apps: [], flat: new Map(), active: 'files', examples: [] };
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) node.append(child?.nodeType ? child : document.createTextNode(String(child ?? '')));
  return node;
};
async function loadJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}
async function loadText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}
function flatten(node) {
  state.flat.set(node.path, node);
  for (const child of node.children || []) flatten(child);
}
function pathNode(path = 'dog:/') {
  const cleaned = path === '/' ? 'dog:/' : path.startsWith('dog:') ? path : `dog:/${path.replace(/^\/+/, '')}`;
  return state.flat.get(cleaned.replace(/\/$/, '') === 'dog:' ? 'dog:/' : cleaned.replace(/\/$/, '')) || state.flat.get(cleaned);
}
function setRoute(id) { location.hash = `/${id}`; }
function currentRoute() { return (location.hash.replace(/^#\/?/, '') || 'files').split('/')[0]; }
function renderDock() {
  const dock = $('#dock-list'); dock.replaceChildren();
  for (const app of state.apps) {
    dock.append(el('button', { class: 'app-button', 'aria-current': app.id === state.active ? 'true' : 'false', onclick: () => setRoute(app.id) },
      el('span', { class: 'icon' }, app.icon),
      el('span', {}, el('strong', {}, app.name), el('br'), el('span', { class: 'small' }, app.does))
    ));
  }
}
function shell(title, eyebrow, body, aside = '') {
  const app = state.apps.find(a => a.id === state.active);
  $('#window').replaceChildren(
    el('div', { class: 'window-head' },
      el('div', {}, el('div', { class: 'eyebrow' }, eyebrow), el('h2', {}, title)),
      el('div', { class: 'small' }, app?.does || aside)
    ),
    body
  );
}
function errorCard(message) { return el('div', { class: 'panel error' }, `Could not load: ${message}`); }
function renderTree(node) {
  const li = el('li');
  const button = el('button', { class: 'node mono', onclick: () => previewNode(node) }, `${node.kind === 'directory' ? '▸' : '•'} ${node.path}`);
  li.append(button);
  if (node.children?.length) li.append(el('ul', {}, node.children.map(renderTree)));
  return li;
}
async function previewNode(node) {
  $('.node.active')?.classList.remove('active');
  for (const btn of document.querySelectorAll('.node')) if (btn.textContent.includes(node.path)) btn.classList.add('active');
  const out = $('#preview');
  out.replaceChildren(el('div', { class: 'eyebrow' }, node.kind), el('h3', {}, node.name), el('p', {}, node.description || 'Mounted public node.'), el('p', { class: 'path' }, node.path));
  if (!node.url) { out.append(el('p', {}, 'Directory node. Select a child leaf to fetch public bytes.')); return; }
  out.append(el('p', {}, el('a', { href: node.url, target: '_blank', rel: 'noreferrer' }, node.url)));
  try {
    const text = await loadText(node.url);
    const rendered = node.kind === 'json' ? JSON.stringify(JSON.parse(text), null, 2) : text;
    out.append(el('pre', {}, rendered.slice(0, 40000)));
  } catch (err) { out.append(errorCard(err.message)); }
}
function renderFiles() {
  const root = state.fs.mounts[0];
  const body = el('div', { class: 'fs-layout' },
    el('div', { class: 'panel' }, el('div', { class: 'eyebrow' }, 'mount tree'), el('ul', { class: 'tree' }, renderTree(root))),
    el('div', { id: 'preview', class: 'panel' }, el('p', {}, 'Select a mounted public file to preview it. Fetch failures are shown honestly here.'))
  );
  shell('Files', 'read only browser', body);
}
async function renderExamples() {
  const body = el('div', { class: 'stack' }, el('div', { id: 'examples-status', class: 'panel' }, 'Loading examples.json…'));
  shell('Examples', 'public catalog', body);
  try {
    const node = pathNode('dog:/api/examples.json');
    const data = await loadJson(node.url);
    state.examples = data.examples || [];
    const categories = [...new Set(state.examples.map(x => x.category).filter(Boolean))].sort();
    const difficulties = [...new Set(state.examples.map(x => x.difficulty).filter(Boolean))].sort();
    const list = el('div', { class: 'grid', id: 'example-list' });
    const q = el('input', { placeholder: 'Search title, tagline, tags, stack…', 'aria-label': 'Search examples' });
    const cat = el('select', {}, el('option', { value: '' }, 'All categories'), categories.map(c => el('option', { value: c }, c)));
    const diff = el('select', {}, el('option', { value: '' }, 'All difficulties'), difficulties.map(d => el('option', { value: d }, d)));
    const count = el('span', { class: 'pill count' }, `${state.examples.length} examples`);
    const apply = () => {
      const term = q.value.toLowerCase();
      const rows = state.examples.filter(ex =>
        (!cat.value || ex.category === cat.value) && (!diff.value || ex.difficulty === diff.value) &&
        (!term || [ex.title, ex.tagline, ex.category, ex.difficulty, ...(ex.tags || []), ...(ex.stack || [])].join(' ').toLowerCase().includes(term))
      );
      count.textContent = `${rows.length} / ${state.examples.length} examples`;
      list.replaceChildren(...rows.slice(0, 80).map(ex => el('article', { class: 'card' },
        el('div', { class: 'eyebrow' }, `${ex.category || 'uncategorized'} · ${ex.difficulty || 'unknown'}`),
        el('h3', {}, ex.title || ex.slug), el('p', {}, ex.tagline || ''),
        el('p', { class: 'small mono' }, (ex.tags || []).join(' · ')),
        el('a', { class: 'primary-link', href: ex.url, target: '_blank', rel: 'noreferrer' }, 'Open real URL ↗')
      )));
      if (rows.length > 80) list.append(el('p', { class: 'small' }, 'Showing first 80 matches. Narrow the search to see more.'));
    };
    q.addEventListener('input', apply); cat.addEventListener('change', apply); diff.addEventListener('change', apply);
    body.replaceChildren(el('div', { class: 'toolbar' }, q, cat, diff, count), list); apply();
  } catch (err) { body.replaceChildren(errorCard(err.message)); }
}
function renderTerminal() {
  const history = el('div', { class: 'terminal-screen', role: 'log', 'aria-live': 'polite' });
  const input = el('input', { autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Terminal command' });
  const print = (text) => history.insertBefore(el('div', { class: 'term-line' }, text), form);
  const command = async (raw) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    if (!cmd) return;
    print(`dog> ${raw}`);
    try {
      if (cmd === 'clear') { history.replaceChildren(form); return; }
      if (cmd === 'help') print('Commands: ls [path], cat <path>, mount, about, clear, help');
      else if (cmd === 'about') print('Kody DOG OS is pure static and read-only. It fetches public bytes only from verified kody-w.github.io URLs.');
      else if (cmd === 'mount') print(state.fs.mounts.map(m => `${m.path} -> ${state.fs.volume.baseUrl} (${state.fs.volume.privacy}, read-only)`).join('\n'));
      else if (cmd === 'ls') {
        const node = pathNode(args[0] || 'dog:/');
        if (!node) print('No such mounted path.');
        else if (!node.children?.length) print(`${node.path} is a leaf. Use cat ${node.path}`);
        else print(node.children.map(c => `${c.kind.padEnd(9)} ${c.path}`).join('\n'));
      } else if (cmd === 'cat') {
        const node = pathNode(args[0]);
        if (!node) print('No such mounted path.');
        else if (!node.url) print('That path is a directory; use ls.');
        else {
          const text = await loadText(node.url);
          print((node.kind === 'json' ? JSON.stringify(JSON.parse(text), null, 2) : text).slice(0, 12000));
        }
      } else print(`Unknown read-only command: ${cmd}. Try help.`);
    } catch (err) { print(`Fetch failed honestly: ${err.message}`); }
    history.scrollTop = history.scrollHeight;
  };
  const form = el('form', { class: 'term-form', onsubmit: e => { e.preventDefault(); const value = input.value; input.value = ''; command(value); } }, el('span', { class: 'mono' }, 'dog>'), input);
  history.append(el('div', { class: 'term-line' }, 'Read-only DOG shell. Try: help, mount, ls dog:/, cat dog:/llms.txt'), form);
  shell('Terminal', 'read only shell', history);
  input.focus();
}
function renderSystem32() {
  const apiRows = [API.fs, API.apps].map(url => el('article', { class: 'card' }, el('h3', { class: 'mono' }, url), el('p', {}, 'Local static API endpoint.'), el('a', { class: 'primary-link', href: url }, 'Open')));
  const mounts = [...state.flat.values()].filter(n => n.url).map(n => el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, n.kind), el('h3', { class: 'mono' }, n.path), el('p', {}, n.description || ''), el('a', { href: n.url, target: '_blank', rel: 'noreferrer' }, n.url)));
  shell('system32', 'internals', el('div', { class: 'stack' },
    el('div', { class: 'panel' }, el('h3', {}, 'Build info'), el('p', {}, 'Static local-first OS client. No server, no database, no writes.'), el('p', { class: 'mono' }, `verifiedAt=${state.fs.verifiedAt}`), el('p', { class: 'mono' }, `volume=${state.fs.volume.id}`)),
    el('div', {}, el('div', { class: 'eyebrow' }, 'static api'), el('div', { class: 'grid' }, apiRows)),
    el('div', {}, el('div', { class: 'eyebrow' }, 'mount table'), el('div', { class: 'grid' }, mounts))
  ));
}
async function init() {
  try {
    const [fs, apps] = await Promise.all([loadJson(API.fs), loadJson(API.apps)]);
    state.fs = fs; state.apps = apps.apps || []; flatten(fs.mounts[0]);
    $('#boot-status').innerHTML = '<strong>read-only</strong> public DOG mounted';
  } catch (err) {
    $('#window').replaceChildren(errorCard(err.message));
    $('#boot-status').textContent = 'boot failed'; return;
  }
  const render = () => {
    state.active = currentRoute();
    if (!state.apps.some(a => a.id === state.active)) state.active = 'files';
    renderDock();
    ({ files: renderFiles, examples: renderExamples, terminal: renderTerminal, system32: renderSystem32 }[state.active] || renderFiles)();
  };
  window.addEventListener('hashchange', render); render();
}
init();
