const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'theme.js'),
  'utf8'
);

test('theme remains usable when browser storage is denied', () => {
  const listeners = {};
  let theme = 'light';
  const toggle = {
    querySelector() { return null; },
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  const media = {
    matches: false,
    addEventListener(name, callback) { listeners[`media:${name}`] = callback; }
  };
  const context = {
    document: {
      getElementById(id) { return id === 'theme-toggle' ? toggle : null; },
      documentElement: {
        getAttribute() { return theme; },
        setAttribute(_name, value) { theme = value; }
      }
    },
    localStorage: {
      getItem() { throw new Error('storage denied'); },
      setItem() { throw new Error('storage denied'); }
    },
    window: {
      matchMedia() { return media; }
    }
  };

  assert.doesNotThrow(() => vm.runInNewContext(source, context));
  assert.doesNotThrow(() => listeners.click());
  assert.equal(theme, 'dark');
  assert.doesNotThrow(() => listeners['media:change']({ matches: false }));
});
