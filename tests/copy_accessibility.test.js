const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

class FakeElement {
  constructor(tagName, text = '') {
    this.tagName = tagName.toUpperCase();
    this._text = text;
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    this.listeners = {};
    this.className = '';
    this.id = '';
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      add: (name) => {
        if (!this.classList.contains(name)) this.className = `${this.className} ${name}`.trim();
      },
      remove: (name) => {
        this.className = this.className.split(/\s+/).filter((item) => item !== name).join(' ');
      },
      toggle: (name, force) => {
        if (force) this.classList.add(name);
        else this.classList.remove(name);
      }
    };
  }

  get parentElement() {
    return this.parentNode;
  }

  get textContent() {
    return this.children.length
      ? this.children.map((child) => child.textContent).join('')
      : this._text;
  }

  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }

  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentNode = null;
  }

  insertBefore(child, reference) {
    if (child.parentNode) child.parentNode.removeChild(child);
    const index = this.children.indexOf(reference);
    child.parentNode = this;
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(type, listener) {
    (this.listeners[type] ||= []).push(listener);
  }

  focus() {}
  select() {}
  setSelectionRange() {}

  matches(selector) {
    if (selector === '[data-copy-prompt]') return this.dataset.copyPrompt !== undefined;
    if (selector === '[data-no-copy]') return this.dataset.noCopy !== undefined;
    if (selector === '[data-line-number]') return this.dataset.lineNumber !== undefined;
    if (selector === '[data-copy-action="prompt"]') return this.dataset.copyAction === 'prompt';
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  closest(selector) {
    const selectors = selector.split(',').map((item) => item.trim());
    let node = this;
    while (node) {
      if (selectors.some((item) => node.matches(item))) return node;
      node = node.parentNode;
    }
    return null;
  }

  descendants() {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }

  querySelectorAll(selector) {
    const nodes = this.descendants();
    if (selector === 'pre > code') {
      return nodes.filter((node) => node.tagName === 'CODE' && node.parentNode?.tagName === 'PRE');
    }
    const selectors = selector.split(',').map((item) => item.trim());
    return nodes.filter((node) => selectors.some((item) => node.matches(item)));
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  cloneNode(deep) {
    const clone = new FakeElement(this.tagName, this._text);
    clone.className = this.className;
    clone.dataset = { ...this.dataset };
    if (deep) this.children.forEach((child) => clone.appendChild(child.cloneNode(true)));
    return clone;
  }
}

class FakeDocument extends FakeElement {
  constructor() {
    super('document');
    this.readyState = 'loading';
    this.body = new FakeElement('body');
    this.appendChild(this.body);
    this.activeElement = this.body;
    this.copyResult = false;
    this.selection = {
      rangeCount: 0,
      removeAllRanges() {},
      addRange() {}
    };
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createDocumentFragment() {
    return new FakeElement('fragment');
  }

  createTextNode(text) {
    return new FakeElement('text', text);
  }

  createRange() {
    return {
      selectNodeContents() {},
      cloneRange() { return this; }
    };
  }

  getElementById(id) {
    return [this, ...this.descendants()].find((node) => node.id === id) || null;
  }

  addEventListener() {}

  execCommand(command) {
    assert.equal(command, 'copy');
    this.fallbackValue = this.body.querySelector('textarea')?.value;
    return this.copyResult;
  }
}

function createHarness() {
  const document = new FakeDocument();
  const window = {
    document,
    navigator: {},
    isSecureContext: false,
    getSelection: () => document.selection,
    setTimeout: () => 1,
    clearTimeout() {}
  };
  const source = readFileSync(resolve(__dirname, '../js/copy-accessibility.js'), 'utf8');
  runInNewContext(source, { window, document, JSON, Math, Number, Object, Set, String, Array, RegExp });
  return { api: window.CopyAccessibility, document, window };
}

function addCode(document, text) {
  const pre = new FakeElement('pre');
  const code = new FakeElement('code', text);
  pre.appendChild(code);
  document.body.appendChild(pre);
  return code;
}

function addPrompt(document, text) {
  const section = new FakeElement('section');
  section.className = 'ai-prompt lwk-prompt';
  section.dataset.copyPrompt = 'true';
  const pre = new FakeElement('pre');
  const code = new FakeElement('code', text);
  code.className = 'ai-prompt-text lwk-prompt-text';
  const button = new FakeElement('button');
  button.className = 'lwk-copy-btn';
  button.dataset.copyAction = 'prompt';
  button.type = 'button';
  button.setAttribute('aria-label', 'Copy prompt to clipboard');
  const label = new FakeElement('span', 'Copy prompt');
  label.className = 'lwk-copy-label';
  const status = new FakeElement('span');
  status.className = 'lwk-copy-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  pre.appendChild(code);
  button.appendChild(label);
  section.appendChild(pre);
  section.appendChild(button);
  section.appendChild(status);
  document.body.appendChild(section);
  return { section, code, button, status };
}

test('initialization is idempotent and gives code a deterministic anchor', () => {
  const { api, document } = createHarness();
  const code = addCode(document, 'if (ready) {\n  run();\n}\n');

  api.init(document);
  api.init(document);

  assert.equal(document.querySelectorAll('.copy-code-button').length, 1);
  const wrapper = code.closest('.copy-code-block');
  assert.equal(wrapper.id, `code-${api.stableHash(code.textContent)}`);
  assert.equal(wrapper.querySelectorAll('.copy-code-anchor').length, 1);
});

test('copy code preserves whitespace and excludes controls and line numbers', async () => {
  const { api, document, window } = createHarness();
  const code = addCode(document, '');
  code.appendChild(new FakeElement('span', 'first\n  second  \n'));
  const lineNumber = new FakeElement('span', '99');
  lineNumber.className = 'line-number';
  code.appendChild(lineNumber);
  code.appendChild(new FakeElement('span', 'third\n'));
  let copied;
  window.isSecureContext = true;
  window.navigator.clipboard = { writeText: async (text) => { copied = text; } };

  api.init(document);
  const button = document.querySelector('.copy-code-button');
  await button.listeners.click[0]();

  assert.equal(copied, 'first\n  second  \nthird\n');
  assert.doesNotMatch(copied, /Copy code|99/);
  assert.equal(button.getAttribute('aria-label'), 'Copy code to clipboard');
  assert.equal(button.type, 'button');
});

test('explicit prompt keeps exactly one prompt control and copies exact text', async () => {
  const { api, document, window } = createHarness();
  const expected = 'Review this.\n\n  Keep indentation.\n';
  const prompt = addPrompt(document, expected);
  let copied;
  window.isSecureContext = true;
  window.navigator.clipboard = { writeText: async (text) => { copied = text; } };

  api.init(document);
  api.init(document);
  await prompt.button.listeners.click[0]();

  assert.equal(document.querySelectorAll('.lwk-copy-btn').length, 1);
  assert.equal(prompt.button.listeners.click.length, 1);
  assert.equal(document.querySelectorAll('.copy-code-button').length, 0);
  assert.equal(copied, expected);
  assert.equal(prompt.status.getAttribute('role'), 'status');
  assert.equal(prompt.status.getAttribute('aria-live'), 'polite');
});

test('clipboard rejection uses textarea fallback', async () => {
  const { api, document, window } = createHarness();
  window.isSecureContext = true;
  window.navigator.clipboard = { writeText: async () => { throw new Error('denied'); } };
  document.copyResult = true;

  assert.equal(await api.copyText('fallback text'), true);
  assert.equal(document.fallbackValue, 'fallback text');
  assert.equal(document.body.querySelectorAll('textarea').length, 0);
});

test('total copy failure selects the readable source and reports recovery', async () => {
  const { api, document } = createHarness();
  const code = addCode(document, 'still readable');
  document.copyResult = false;
  let selected = false;
  document.createRange = () => ({
    selectNodeContents(node) { selected = node === code; }
  });

  api.init(document);
  const button = document.querySelector('.copy-code-button');
  await button.listeners.click[0]();

  assert.equal(selected, true);
  assert.match(document.querySelector('.copy-code-status').textContent, /complete code is selected/i);
});
