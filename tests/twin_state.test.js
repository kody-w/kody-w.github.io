const assert = require('node:assert/strict');
const test = require('node:test');

const TwinState = require('../js/twin-state.js');

function memoryStorage(options = {}) {
  const values = new Map();
  return {
    getItem(key) {
      if (options.failGet) throw new Error('get denied');
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (options.failSet) throw new Error('quota denied');
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test('state survives a new store and exports byte-exactly', () => {
  const storage = memoryStorage();
  const first = TwinState.createStore({ storage });
  first.update((state) => {
    state.preferences.mode = 'challenge';
    state.savedQuestions.push({ question: 'What changed?' });
  });
  const exported = first.exportState();
  const second = TwinState.createStore({ storage });
  assert.equal(second.exportState(), exported);
  second.reset();
  second.importState(exported);
  assert.equal(second.exportState(), exported);
  second.importState(exported);
  assert.equal(second.exportState(), exported);
});

test('storage denial falls back to a fully usable memory store', () => {
  const store = TwinState.createStore({ storage: memoryStorage({ failGet: true }) });
  assert.equal(store.storageMode(), 'memory');
  store.update((state) => {
    state.history.push({ id: 'one' });
  });
  assert.equal(store.get().history.length, 1);
  assert.doesNotThrow(() => store.importState(store.exportState()));
});

test('write failure changes storage mode without losing current state', () => {
  const store = TwinState.createStore({ storage: memoryStorage({ failSet: true }) });
  store.update((state) => {
    state.pinnedCitations.push({ sourceId: 'post:one' });
  });
  assert.equal(store.storageMode(), 'memory');
  assert.equal(store.get().pinnedCitations.length, 1);
});

test('invalid imports are transactional and reject pollution keys', () => {
  const store = TwinState.createStore({ storage: memoryStorage() });
  store.update((state) => {
    state.savedQuestions.push({ question: 'Keep me' });
  });
  const before = store.exportState();
  for (const invalid of [
    '{',
    '{"schema":"wrong"}',
    '{"schema":"kody-twin-state/1","revision":"bad","preferences":{},"history":[],"pinnedCitations":[],"savedQuestions":[]}',
    '{"schema":"kody-twin-state/1","revision":0,"preferences":{},"history":[],"pinnedCitations":[],"savedQuestions":[],"__proto__":{}}'
  ]) {
    assert.throws(() => store.importState(invalid));
    assert.equal(store.exportState(), before);
  }
});
