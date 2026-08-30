const assert = require('node:assert/strict');
const { createHash, webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const Engine = require('../js/twin-engine.js');
const committedWorkerSource = fs.readFileSync(
  path.join(__dirname, '..', 'public-twin', 'sw.js'),
  'utf8'
);
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'api', 'twin-corpus.json'), 'utf8')
);
const ORIGIN = 'https://kody-w.github.io';
const CORPUS_PATH = '/api/twin-corpus.json';
const committedShellManifest = JSON.parse(
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
  '/api/frame-06-evidence-tribunal.json':
    'api/frame-06-evidence-tribunal.json',
  '/css/main.css': 'css/main.css',
  '/css/frame-06-evidence-tribunal.css':
    'css/frame-06-evidence-tribunal.css',
  '/js/theme.js': 'js/theme.js',
  '/js/twin-state.js': 'js/twin-state.js',
  '/js/twin-engine.js': 'js/twin-engine.js',
  '/js/twin-controller.js': 'js/twin-controller.js',
  '/js/twin-app.js': 'js/twin-app.js',
  '/js/frame-06-evidence-tribunal.js':
    'js/frame-06-evidence-tribunal.js',
  '/js/frame-06-evidence-tribunal-app.js':
    'js/frame-06-evidence-tribunal-app.js',
  '/favicon.ico': 'favicon.ico',
  '/apple-touch-icon.png': 'apple-touch-icon.png'
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalDocument(body) {
  let replacements = 0;
  const canonical = body.replace(
    /(data-twin-document-sha256=")[0-9a-f]{64}(")/g,
    (_match, prefix, suffix) => {
      replacements += 1;
      return `${prefix}${'0'.repeat(64)}${suffix}`;
    }
  );
  assert.equal(replacements, 1);
  return canonical;
}

function documentBody(url, marker, content = '') {
  if (url.startsWith('/public-twin/tribunal')) {
    return '<!doctype html>' +
      '<meta http-equiv="Content-Security-Policy">' +
      `<main id="evidence-tribunal" ${marker}>` +
      '<form id="tribunal-form"></form>' +
      '<p id="tribunal-result-status"></p>' +
      content +
      '</main>' +
      '<script src="/js/frame-06-evidence-tribunal.js"></script>' +
      '<script src="/js/frame-06-evidence-tribunal-app.js"></script>';
  }
  return '<!doctype html>' +
    '<meta http-equiv="Content-Security-Policy">' +
    `<main id="public-twin" ${marker}>` +
    '<form id="twin-question-form">' +
    '<textarea id="twin-question"></textarea>' +
    '<div id="twin-results"></div>' +
    '</form>' +
    content +
    '</main>' +
    '<script src="/js/twin-app.js"></script>';
}

function createGeneration(label) {
  const manifest = structuredClone(committedShellManifest);
  manifest.releaseSha256 = sha256(`release:${label}`);
  const documents = {};
  manifest.documents.forEach((specification) => {
    const zeroMarker = `data-twin-document-sha256="${'0'.repeat(64)}"`;
    const provisional = documentBody(
      specification.url,
      zeroMarker,
      `<p data-generation="${label}">${label}</p>`
    );
    const digest = sha256(canonicalDocument(provisional));
    const marker = `data-twin-document-sha256="${digest}"`;
    specification.sha256 = digest;
    specification.normalization = 'twin-html-sha256/1';
    specification.requiredText = specification.requiredText.map((value) =>
      value.startsWith('data-twin-document-sha256=') ? marker : value
    );
    documents[specification.url] = documentBody(
      specification.url,
      marker,
      `<p data-generation="${label}">${label}</p>`
    );
  });
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const manifestDigest = sha256(manifestBytes);
  const workerSource = committedWorkerSource.replace(
    /(var SHELL_RELEASE_SHA256\s*=\s*\n\s*')[0-9a-f]{64}(';)/,
    `$1${manifestDigest}$2`
  );
  return { manifest, manifestBytes, documents, workerSource };
}

const currentGeneration = createGeneration('current');
const shellManifest = currentGeneration.manifest;
const workerSource = currentGeneration.workerSource;

function validDocumentResponse(url = '/public-twin/', content = '') {
  const specification = shellManifest.documents.find((item) => item.url === url);
  assert.ok(specification, url);
  const marker = specification.requiredText.find((value) =>
    value.startsWith('data-twin-document-sha256=')
  );
  return new Response(
    documentBody(url, marker, content),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

function defaultShellResponse(pathname, generation = currentGeneration) {
  if (pathname === '/public-twin/shell-manifest.json') {
    return new Response(
      generation.manifestBytes,
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  if (generation.documents[pathname]) {
    return new Response(generation.documents[pathname], {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  const relative = assetFiles[pathname];
  if (!relative) {
    return new Response('not found', { status: 404 });
  }
  const specification = generation.manifest.assets.find(
    (asset) => asset.url === pathname
  );
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

function requestKey(request) {
  const value = typeof request === 'string' ? request : request.url;
  const url = new URL(value, ORIGIN);
  return `${url.pathname}${url.search}`;
}

function createCacheStorage() {
  const stores = new Map();
  return {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request, options = {}) {
          const key = requestKey(request);
          let response = store.get(key);
          if (!response && options.ignoreSearch) {
            const pathname = requestPath(request);
            const matchingKey = [...store.keys()].find((stored) =>
              new URL(stored, ORIGIN).pathname === pathname
            );
            response = matchingKey ? store.get(matchingKey) : undefined;
          }
          return response ? response.clone() : undefined;
        },
        async put(request, response) {
          store.set(requestKey(request), response.clone());
        },
        async delete(request) {
          return store.delete(requestKey(request));
        },
        async keys() {
          return [...store.keys()].map(
            (value) => new Request(`${ORIGIN}${value}`)
          );
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
  const caches = options.caches || createCacheStorage();
  const generation = options.generation || currentGeneration;
  const state = {
    skipWaiting: 0,
    clientsClaim: 0,
    timers: []
  };
  const self = {
    location: { origin: ORIGIN },
    KodyTwinEngine: Engine,
    clients: {
      async matchAll() {
        return options.clients || [];
      },
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
      return defaultShellResponse(pathname, generation);
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
    Uint8Array,
    TextEncoder,
    TextDecoder,
    setTimeout(callback, delay) {
      state.timers.push({ callback, delay });
      return state.timers.length;
    }
  };
  vm.runInNewContext(generation.workerSource, context, {
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

async function runTimers(runtime) {
  const timers = runtime.state.timers.splice(0);
  for (const timer of timers) {
    await timer.callback();
  }
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

async function runActivate(runtime) {
  let pending;
  runtime.handlers.activate({
    waitUntil(value) {
      pending = Promise.resolve(value);
    }
  });
  assert.ok(pending, 'activate handler did not register work');
  return pending;
}

async function runFetch(runtime, request, clientId = '') {
  let pending;
  let lifetime;
  runtime.handlers.fetch({
    request,
    clientId,
    waitUntil(value) {
      lifetime = Promise.resolve(value);
    },
    respondWith(value) {
      pending = Promise.resolve(value);
    }
  });
  assert.ok(pending, 'fetch handler did not respond');
  const response = await pending;
  if (lifetime) {
    await lifetime;
  }
  return response;
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

test('tribunal assets are declared with exact hashes and MIME types', () => {
  const required = {
    '/api/frame-06-evidence-tribunal.json': 'application/json',
    '/css/frame-06-evidence-tribunal.css': 'text/css',
    '/js/frame-06-evidence-tribunal.js': 'text/javascript',
    '/js/frame-06-evidence-tribunal-app.js': 'text/javascript'
  };
  for (const [url, mime] of Object.entries(required)) {
    const specification = shellManifest.assets.find((asset) => asset.url === url);
    assert.ok(specification, url);
    assert.ok(specification.contentTypes.includes(mime), url);
    const digest = createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, '..', assetFiles[url])))
      .digest('hex');
    assert.equal(specification.sha256, digest, url);
  }
  assert.ok(
    shellManifest.documents.some(
      (document) => document.url === '/public-twin/tribunal/'
    )
  );
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

test('uncached asset navigation fails closed without replacing app shell', async () => {
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
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Verified Twin resource is unavailable/);
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

test('wrong MIME or tampered tribunal receipt cannot install', async () => {
  for (const response of [
    new Response('{"schema":"forged"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    new Response(
      fs.readFileSync(
        path.join(__dirname, '..', 'api', 'frame-06-evidence-tribunal.json')
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  ]) {
    const runtime = loadWorker(
      new Response(JSON.stringify(corpus), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      {
        responses: {
          '/api/frame-06-evidence-tribunal.json': response
        }
      }
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

test('document body mutations fail even when every required marker remains', async () => {
  for (const document of shellManifest.documents) {
    const runtime = loadWorker(
      new Response(JSON.stringify(corpus), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      {
        responses: {
          [document.url]: validDocumentResponse(
            document.url,
            '<aside data-injected="true">altered claim</aside>'
          )
        }
      }
    );
    await assert.rejects(runInstall(runtime), document.url);
    assert.equal(runtime.state.skipWaiting, 0, document.url);
  }
});

test('document byte verification rejects BOM, invalid UTF-8, duplicate markers, and byte edits', async () => {
  const url = '/public-twin/';
  const original = Buffer.from(currentGeneration.documents[url], 'utf8');
  const marker = shellManifest.documents
    .find((document) => document.url === url)
    .requiredText.find((value) =>
      value.startsWith('data-twin-document-sha256=')
    );
  const byteEdit = Buffer.from(original);
  const editOffset = byteEdit.indexOf(Buffer.from('current'));
  assert.notEqual(editOffset, -1);
  byteEdit[editOffset] = 'X'.charCodeAt(0);
  const mutations = [
    Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]),
    Buffer.concat([original, Buffer.from([0xc3, 0x28])]),
    Buffer.from(
      currentGeneration.documents[url].replace(
        '</main>',
        `<i ${marker}></i></main>`
      )
    ),
    byteEdit
  ];

  for (const bytes of mutations) {
    const runtime = loadWorker(
      new Response(JSON.stringify(corpus), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      {
        responses: {
          [url]: new Response(bytes, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          })
        }
      }
    );
    await assert.rejects(runInstall(runtime));
    assert.equal(runtime.state.skipWaiting, 0);
  }
});

test('tribunal navigation uses its verified scoped offline document', async () => {
  const options = {};
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    options
  );
  await runInstall(runtime);
  options.failPaths = ['/public-twin/tribunal/'];
  const response = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/tribunal/`
  });
  const body = await response.text();
  assert.match(body, /id="evidence-tribunal"/);
  assert.match(body, /frame-06-evidence-tribunal-app\.js/);
});

test('altered root navigation falls back to the verified cached document', async () => {
  const options = {};
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    options
  );
  await runInstall(runtime);
  options.responses = {
    '/public-twin/': validDocumentResponse(
      '/public-twin/',
      'new network body'
    )
  };
  const cache = await runtime.caches.open(runtime.shellCache);
  const installed = await cache.match('/public-twin/');
  const before = await installed.text();
  const response = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/`
  });
  assert.doesNotMatch(await response.text(), /new network body/);
  const after = await (await cache.match('/public-twin/')).text();
  assert.equal(after, before);
});

test('cache misses fail closed instead of falling through to network', async () => {
  const options = {};
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    options
  );
  await runInstall(runtime);
  options.responses = {
      '/js/twin-app.js': new Response('console.log("unverified")', {
        status: 200,
        headers: { 'Content-Type': 'text/javascript' }
      }),
      '/public-twin/': validDocumentResponse(
        '/public-twin/',
        '<p>unverified network shell</p>'
      )
  };
  const store = runtime.caches.stores.get(runtime.shellCache);
  store.delete('/js/twin-app.js');
  store.delete('/public-twin/');

  const asset = await runFetch(runtime, {
    method: 'GET',
    mode: 'same-origin',
    url: `${ORIGIN}/js/twin-app.js`
  });
  assert.equal(asset.status, 503);
  assert.doesNotMatch(await asset.text(), /unverified/);

  const document = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/`
  });
  assert.equal(document.status, 503);
  assert.doesNotMatch(await document.text(), /unverified network shell/);
});

test('non-release requests remain ordinary network traffic', async () => {
  const options = {};
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    options
  );
  await runInstall(runtime);
  options.responses = {
    '/2026/03/28/the-digital-twin-deployment-pattern/': new Response(
      '<!doctype html><title>Public article</title>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  };
  const response = await runFetch(runtime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/2026/03/28/the-digital-twin-deployment-pattern/`
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Public article/);
});

test('release generations stay isolated until each client transitions', async () => {
  const caches = createCacheStorage();
  const oldGeneration = createGeneration('old-release');
  const newGeneration = createGeneration('new-release');
  const oldOptions = { caches, generation: oldGeneration };
  const newOptions = { caches, generation: newGeneration };
  const corpusResponse = () => new Response(JSON.stringify(corpus), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  const oldRuntime = loadWorker(corpusResponse(), oldOptions);
  await runInstall(oldRuntime);
  await runActivate(oldRuntime);
  oldOptions.clients = [{ id: 'old-client' }];
  const leaseResponse = await runFetch(oldRuntime, {
    method: 'GET',
    mode: 'same-origin',
    url: `${ORIGIN}/public-twin/__release-lease__`
  }, 'old-client');
  const lease = await leaseResponse.json();
  assert.equal(lease.shellCache, oldRuntime.shellCache);
  oldOptions.failPaths = ['/public-twin/'];

  await caches.open('kody-twin-shell-aaaaaaaaaaaaaaaa');
  await caches.open('kody-twin-corpus-bbbbbbbbbbbbbbbb');
  newOptions.clients = [{ id: 'old-client' }];
  const newRuntime = loadWorker(corpusResponse(), newOptions);
  await runInstall(newRuntime);
  await runActivate(newRuntime);

  assert.notEqual(oldRuntime.shellCache, newRuntime.shellCache);
  assert.equal(caches.stores.has(oldRuntime.shellCache), true);
  assert.equal(caches.stores.has(newRuntime.shellCache), true);
  assert.equal(caches.stores.has('kody-twin-shell-aaaaaaaaaaaaaaaa'), false);
  assert.equal(caches.stores.has('kody-twin-corpus-bbbbbbbbbbbbbbbb'), false);
  assert.equal(newRuntime.state.skipWaiting, 1);
  assert.equal(newRuntime.state.clientsClaim, 0);

  const oldClientResponse = await runFetch(oldRuntime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/`
  });
  assert.match(await oldClientResponse.text(), /old-release/);

  const newNavigation = await runFetch(newRuntime, {
    method: 'GET',
    mode: 'navigate',
    url: `${ORIGIN}/public-twin/`
  });
  assert.match(await newNavigation.text(), /new-release/);
});

test('browser restart prunes orphan generations to the current release', async () => {
  const caches = createCacheStorage();
  for (const name of [
    'kody-twin-shell-1111111111111111',
    'kody-twin-corpus-2222222222222222',
    'kody-twin-shell-3333333333333333',
    'kody-twin-corpus-4444444444444444'
  ]) {
    await caches.open(name);
  }
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    { caches, clients: [] }
  );
  await runInstall(runtime);
  await runActivate(runtime);
  const releaseCaches = (await caches.keys()).filter((name) =>
    name.startsWith('kody-twin-shell-') ||
    name.startsWith('kody-twin-corpus-')
  );
  assert.deepEqual(
    releaseCaches.sort(),
    [runtime.shellCache, runtime.corpusCache].sort()
  );
});

test('an unleased live client makes cache pruning fail safe', async () => {
  const caches = createCacheStorage();
  const oldShell = 'kody-twin-shell-5555555555555555';
  const oldCorpus = 'kody-twin-corpus-6666666666666666';
  await caches.open(oldShell);
  await caches.open(oldCorpus);
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    { caches, clients: [{ id: 'unleased-client' }] }
  );
  await runInstall(runtime);
  await runActivate(runtime);
  assert.equal(caches.stores.has(oldShell), true);
  assert.equal(caches.stores.has(oldCorpus), true);
});

test('repeated releases bound unknown generations, then leases and disappearance converge', async () => {
  const caches = createCacheStorage();
  const entries = [];
  const corpusResponse = () => new Response(JSON.stringify(corpus), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  for (let index = 0; index < 6; index += 1) {
    const options = {
      caches,
      clients: [{ id: 'delayed-client' }],
      generation: createGeneration(`bounded-${index}`)
    };
    const runtime = loadWorker(corpusResponse(), options);
    await runInstall(runtime);
    await runActivate(runtime);
    await runTimers(runtime);
    entries.push({ options, runtime });
    const shells = (await caches.keys()).filter((name) =>
      name.startsWith('kody-twin-shell-')
    );
    assert.ok(shells.length <= 3, shells.join(','));
  }

  const leased = entries[4];
  const latest = entries[5];
  assert.equal(caches.stores.has(leased.runtime.shellCache), true);
  await runFetch(leased.runtime, {
    method: 'GET',
    mode: 'same-origin',
    url: `${ORIGIN}/public-twin/__release-lease__`
  }, 'delayed-client');

  await runActivate(latest.runtime);
  let shells = (await caches.keys()).filter((name) =>
    name.startsWith('kody-twin-shell-')
  );
  assert.deepEqual(
    shells.sort(),
    [leased.runtime.shellCache, latest.runtime.shellCache].sort()
  );

  latest.options.clients = [];
  await runActivate(latest.runtime);
  shells = (await caches.keys()).filter((name) =>
    name.startsWith('kody-twin-shell-')
  );
  assert.deepEqual(shells, [latest.runtime.shellCache]);
});

test('expired client lease enters grace then bounded orphan cleanup', async () => {
  const caches = createCacheStorage();
  const generation = createGeneration('expired-lease');
  const options = {
    caches,
    clients: [{ id: 'expired-client' }],
    generation
  };
  for (let index = 0; index < 5; index += 1) {
    await caches.open(`kody-twin-shell-deadbeefdeadbee${index}`);
  }
  const runtime = loadWorker(
    new Response(JSON.stringify(corpus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }),
    options
  );
  await runInstall(runtime);
  const leaseCache = await caches.open('kody-twin-client-leases-v1');
  await leaseCache.put(
    `${ORIGIN}/public-twin/__release-lease__?client=expired-client`,
    new Response(JSON.stringify({
      schema: 'kody-twin-client-lease/1',
      releaseSha256: generation.manifest.releaseSha256,
      shellCache: runtime.shellCache,
      corpusCache: runtime.corpusCache,
      touchedAt: 0
    }), {
    headers: { 'Content-Type': 'application/json' }
    })
  );
  await runActivate(runtime);
  assert.ok(
    (await caches.keys()).filter((name) =>
      name.startsWith('kody-twin-shell-')
    ).length > 3
  );
  await runTimers(runtime);
  assert.ok(
    (await caches.keys()).filter((name) =>
      name.startsWith('kody-twin-shell-')
    ).length <= 3
  );
});
