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
      if (options.failRemove) throw new Error('remove denied');
      if (options.noOpRemove) return;
      values.delete(key);
    },
    values
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

test('reset fails rather than leaving stale durable state to resurrect', () => {
  const behavior = {};
  const storage = memoryStorage(behavior);
  const store = TwinState.createStore({ storage });
  store.update((state) => {
    state.savedQuestions.push({ question: 'persisted question' });
  });

  behavior.failSet = true;
  store.update((state) => {
    state.savedQuestions.push({ question: 'memory-only question' });
  });
  assert.equal(store.storageMode(), 'memory');

  behavior.failRemove = true;
  assert.throws(() => store.reset(), /persist|storage|reset/i);
  assert.equal(store.get().savedQuestions.length, 2);

  behavior.failSet = false;
  behavior.failRemove = false;
  const restarted = TwinState.createStore({ storage });
  assert.deepEqual(restarted.get().savedQuestions, [
    { question: 'persisted question' }
  ]);
});

test('reset clears stale durable state when removal remains available', () => {
  const behavior = {};
  const storage = memoryStorage(behavior);
  const store = TwinState.createStore({ storage });
  store.update((state) => {
    state.savedQuestions.push({ question: 'persisted question' });
  });

  behavior.failSet = true;
  store.update((state) => {
    state.savedQuestions.push({ question: 'memory-only question' });
  });
  assert.equal(store.storageMode(), 'memory');
  assert.doesNotThrow(() => store.reset());

  behavior.failSet = false;
  const restarted = TwinState.createStore({ storage });
  assert.deepEqual(restarted.get().savedQuestions, []);
});

test('unreadable storage with no-op removal cannot verify a durable reset', () => {
  const behavior = {};
  const storage = memoryStorage(behavior);
  const store = TwinState.createStore({ storage });
  store.update((state) => {
    state.savedQuestions.push({ question: 'must not resurrect' });
  });
  const before = store.exportState();

  behavior.failGet = true;
  behavior.failSet = true;
  behavior.noOpRemove = true;
  assert.throws(() => store.reset(), /persist|storage|reset|verify/i);
  assert.equal(store.exportState(), before);

  behavior.failGet = false;
  behavior.failSet = false;
  behavior.noOpRemove = false;
  const restarted = TwinState.createStore({ storage });
  assert.deepEqual(restarted.get().savedQuestions, [
    { question: 'must not resurrect' }
  ]);
});
