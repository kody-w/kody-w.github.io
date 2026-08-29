const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const Engine = require('../js/twin-engine.js');
const workerSource = fs.readFileSync(
  path.join(__dirname, '..', 'twin', 'sw.js'),
  'utf8'
);
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'api', 'twin-corpus.json'), 'utf8')
);
const ORIGIN = 'https://kody-w.github.io';
const CORPUS_PATH = '/api/twin-corpus.json';

function requestPath(request) {
  const value = typeof request === 'string' ? request : request.url;
  return new URL(value, ORIGIN).pathname;
}

function createCacheStorage() {
  const stores = new Map();
  return {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) {
          const response = store.get(requestPath(request));
          return response ? response.clone() : undefined;
        },
        async put(request, response) {
          store.set(requestPath(request), response.clone());
        },
        async keys() {
          return [...store.keys()].map((value) => new Request(`${ORIGIN}${value}`));
        }
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
    stores
  };
}

function loadWorker(corpusResponse) {
  const handlers = {};
  const caches = createCacheStorage();
  const state = {
    skipWaiting: 0,
    clientsClaim: 0
  };
  const self = {
    location: { origin: ORIGIN },
    KodyTwinEngine: Engine,
    clients: {
      async claim() {
        state.clientsClaim += 1;
      }
    },
    addEventListener(name, callback) {
      handlers[name] = callback;
    },
    async skipWaiting() {
      state.skipWaiting += 1;
    }
  };
  const context = {
    self,
    KodyTwinEngine: Engine,
    importScripts() {},
    caches,
    fetch: async (request) => {
      const pathname = requestPath(request);
      if (pathname === CORPUS_PATH) {
        return corpusResponse.clone();
      }
      return new Response('shell', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    },
    Response,
    Request,
    URL,
    JSON,
    Promise,
    Number,
    Object,
    Array,
    String,
    Error
  };
  vm.runInNewContext(workerSource, context, { filename: 'twin/sw.js' });
  return { handlers, caches, state };
}

async function runInstall(runtime) {
  let pending;
  runtime.handlers.install({
    waitUntil(value) {
      pending = Promise.resolve(value);
    }
  });
  assert.ok(pending, 'install handler did not register work');
  return pending;
}

test('valid corpus installs and is cached before skipWaiting', async () => {
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  await runInstall(runtime);
  assert.equal(runtime.state.skipWaiting, 1);
  const cache = await runtime.caches.open('kody-twin-corpus-v1');
  const cached = await cache.match(CORPUS_PATH);
  assert.ok(cached);
  assert.equal((await cached.json()).corpusSha256, corpus.corpusSha256);
});

test('forged corpus with copied digest fields cannot install', async () => {
  const forged = structuredClone(corpus);
  forged.records[0].text = 'FORGED PERSONAL CLAIM: I secretly endorse this.';
  const runtime = loadWorker(
    new Response(JSON.stringify(forged), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  await assert.rejects(runInstall(runtime));
  assert.equal(runtime.state.skipWaiting, 0);
  const cache = await runtime.caches.open('kody-twin-corpus-v1');
  assert.equal(await cache.match(CORPUS_PATH), undefined);
});

test('missing network and cached corpus prevents activation', async () => {
  const runtime = loadWorker(
    new Response(JSON.stringify({ error: 'unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  await assert.rejects(runInstall(runtime));
  assert.equal(runtime.state.skipWaiting, 0);
  const cache = await runtime.caches.open('kody-twin-corpus-v1');
  assert.equal(await cache.match(CORPUS_PATH), undefined);
});
