const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const Engine = require('../js/twin-engine.js');
const workerSource = fs.readFileSync(
  path.join(__dirname, '..', 'public-twin', 'sw.js'),
  'utf8'
);
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'api', 'twin-corpus.json'), 'utf8')
);
const ORIGIN = 'https://kody-w.github.io';
const CORPUS_PATH = '/api/twin-corpus.json';
const shellManifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'public-twin', 'shell-manifest.json'),
    'utf8'
  )
);
const assetFiles = {
  '/public-twin/manifest.webmanifest': 'public-twin/manifest.webmanifest',
  '/public-twin/icon-192.png': 'public-twin/icon-192.png',
  '/public-twin/icon-512.png': 'public-twin/icon-512.png',
  '/public-twin/one-sentence-prompt.txt':
    'public-twin/one-sentence-prompt.txt',
  '/css/main.css': 'css/main.css',
  '/js/theme.js': 'js/theme.js',
  '/js/twin-state.js': 'js/twin-state.js',
  '/js/twin-engine.js': 'js/twin-engine.js',
  '/js/twin-controller.js': 'js/twin-controller.js',
  '/js/twin-app.js': 'js/twin-app.js',
  '/favicon.ico': 'favicon.ico',
  '/apple-touch-icon.png': 'apple-touch-icon.png'
};

function validDocumentResponse(content = '') {
  const marker = shellManifest.documents[0].requiredText.find((value) =>
    value.startsWith('data-twin-document-sha256=')
  );
  return new Response(
    '<!doctype html>' +
      '<meta http-equiv="Content-Security-Policy">' +
      `<main id="public-twin" ${marker}>` +
      '<form id="twin-question-form">' +
      '<textarea id="twin-question"></textarea>' +
      '<div id="twin-results"></div>' +
      '</form>' +
      content +
      '</main>' +
      '<script src="/js/twin-app.js"></script>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

function defaultShellResponse(pathname) {
  if (pathname === '/public-twin/shell-manifest.json') {
    return new Response(
      fs.readFileSync(
        path.join(__dirname, '..', 'public-twin', 'shell-manifest.json')
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  if (pathname === '/public-twin/' ||
      pathname === '/public-twin/index.html') {
    return validDocumentResponse();
  }
  const relative = assetFiles[pathname];
  if (!relative) {
    return new Response('not found', { status: 404 });
  }
  const specification = shellManifest.assets.find((asset) => asset.url === pathname);
  assert.ok(specification, pathname);
  return new Response(fs.readFileSync(path.join(__dirname, '..', relative)), {
    status: 200,
    headers: { 'Content-Type': specification.contentTypes[0] }
  });
}

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

function loadWorker(corpusResponse, options = {}) {
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
      if ((options.failPaths || []).includes(pathname)) {
        return new Response('failed', { status: 503 });
      }
      if (options.responses && options.responses[pathname]) {
        return options.responses[pathname].clone();
      }
      if (pathname === CORPUS_PATH) {
        return corpusResponse.clone();
      }
      return defaultShellResponse(pathname);
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
    Error,
    crypto: webcrypto,
    Uint8Array
  };
  vm.runInNewContext(workerSource, context, {
    filename: 'public-twin/sw.js'
  });
  return {
    handlers,
    caches,
    state,
    shellCache: context.SHELL_CACHE,
    corpusCache: context.CORPUS_CACHE
  };
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

async function runFetch(runtime, request) {
  let pending;
  runtime.handlers.fetch({
    request,
    respondWith(value) {
      pending = Promise.resolve(value);
    }
  });
  assert.ok(pending, 'fetch handler did not respond');
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
  const cache = await runtime.caches.open(runtime.corpusCache);
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
  const cache = await runtime.caches.open(runtime.corpusCache);
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
  const cache = await runtime.caches.open(runtime.corpusCache);
  assert.equal(await cache.match(CORPUS_PATH), undefined);
});

test('cache names are content-addressed release identifiers', () => {
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
  assert.match(runtime.shellCache, /^kody-twin-shell-[0-9a-f]{12,}$/);
  assert.match(runtime.corpusCache, /^kody-twin-corpus-[0-9a-f]{12,}$/);
  assert.notEqual(runtime.shellCache, 'kody-twin-shell-v1');
  assert.notEqual(runtime.corpusCache, 'kody-twin-corpus-v1');
});

test('interrupted upgrade leaves the active shell cache untouched', async () => {
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    { failPaths: ['/css/main.css'] }
  );
  const active = await runtime.caches.open('kody-twin-shell-v1');
  await active.put(
    '/public-twin/',
    new Response('old-shell', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  );

  await assert.rejects(runInstall(runtime));
  assert.equal(runtime.state.skipWaiting, 0);
  const preserved = await active.match('/public-twin/');
  assert.equal(await preserved.text(), 'old-shell');
});

test('asset navigation cannot replace the canonical cached app shell', async () => {
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    {
      responses: {
        '/public-twin/manifest.webmanifest': new Response(
          '{"name":"manifest"}',
          {
          status: 200,
          headers: { 'Content-Type': 'application/manifest+json' }
        })
      }
    }
  );
  const cache = await runtime.caches.open(runtime.shellCache);
  await cache.put(
    '/public-twin/',
    new Response('<!doctype html><title>app shell</title>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  );

  const response = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/manifest.webmanifest`
  });
  assert.equal(await response.text(), '{"name":"manifest"}');
  const preserved = await cache.match('/public-twin/');
  assert.match(await preserved.text(), /app shell/);
});

test('HTML fallbacks and tampered bytes cannot install as shell assets', async () => {
  for (const response of [
    new Response('<!doctype html><title>fallback</title>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }),
    new Response('console.log("tampered")', {
      status: 200,
      headers: { 'Content-Type': 'text/javascript' }
    })
  ]) {
    const runtime = loadWorker(
      new Response(JSON.stringify(corpus), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      { responses: { '/js/twin-app.js': response } }
    );
    await assert.rejects(runInstall(runtime));
    assert.equal(runtime.state.skipWaiting, 0);
  }
});

test('generic HTML without the release document contract cannot install', async () => {
  const generic = new Response(
    '<!doctype html><meta http-equiv="Content-Security-Policy"><main id="public-twin"></main>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    {
      responses: {
        '/public-twin/': generic,
        '/public-twin/index.html': generic
      }
    }
  );
  await assert.rejects(runInstall(runtime));
  assert.equal(runtime.state.skipWaiting, 0);
});

test('successful root navigation cannot mutate the installed release cache', async () => {
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    {
      responses: {
        '/public-twin/': validDocumentResponse('new network body')
      }
    }
  );
  await runInstall(runtime);
  const cache = await runtime.caches.open(runtime.shellCache);
  const installed = await cache.match('/public-twin/');
  const before = await installed.text();
  const response = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/`
  });
  assert.match(await response.text(), /new network body/);
  const after = await (await cache.match('/public-twin/')).text();
  assert.equal(after, before);
});
