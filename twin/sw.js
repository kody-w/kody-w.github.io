'use strict';

var SHELL_CACHE = 'kody-twin-shell-v1';
var CORPUS_CACHE = 'kody-twin-corpus-v1';
var CORPUS_PATH = '/api/twin-corpus.json';
var BASELINE_SOURCE_MANIFEST_SHA256 =
  '9b14903ad91282be2e962e97697479b04e8416da52b7b219afa0422e391d3e29';
var BASELINE_CORPUS_SHA256 =
  '0d6badcd9364761804d7e77f2f5695185ed8e8254a80650f9d57a09695dd7f9d';
var SHELL_PATHS = [
  '/twin/',
  '/twin/index.html',
  '/twin/manifest.webmanifest',
  '/twin/icon-192.png',
  '/twin/icon-512.png',
  '/twin/one-sentence-prompt.txt',
  '/css/main.css',
  '/js/copy-accessibility.js',
  '/js/theme.js',
  '/js/search.js',
  '/js/twin-state.js',
  '/js/twin-engine.js',
  '/js/twin-controller.js',
  '/js/twin-app.js',
  '/search.json',
  '/favicon.ico',
  '/apple-touch-icon.png'
];
var SHELL_PATH_SET = SHELL_PATHS.reduce(function (paths, path) {
  paths[path] = true;
  return paths;
}, Object.create(null));
var SHA256 = /^[0-9a-f]{64}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isJsonPrimitive(value) {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value));
}

function hasOnlyKeys(value, keys) {
  var actual = Object.keys(value).sort();
  var expected = keys.slice().sort();
  if (actual.length !== expected.length) {
    return false;
  }
  for (var i = 0; i < actual.length; i += 1) {
    if (actual[i] !== expected[i]) {
      return false;
    }
  }
  return true;
}

function validRecord(record) {
  if (!isObject(record)) {
    return false;
  }
  var required = [
    'id',
    'sourceType',
    'title',
    'date',
    'timeBasis',
    'author',
    'sourcePath',
    'sourceUrl',
    'sourceSha256',
    'text'
  ];
  for (var i = 0; i < required.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(record, required[i])) {
      return false;
    }
  }
  if (!isNonEmptyString(record.id) ||
      ['post', 'field_note', 'work'].indexOf(record.sourceType) === -1 ||
      !isNonEmptyString(record.title) ||
      !isNonEmptyString(record.date) ||
      !isNonEmptyString(record.timeBasis) ||
      !(record.author === null || isNonEmptyString(record.author)) ||
      !isNonEmptyString(record.sourcePath) ||
      !isNonEmptyString(record.sourceUrl) ||
      !SHA256.test(record.sourceSha256) ||
      !isNonEmptyString(record.text)) {
    return false;
  }
  var hasStructured = Object.prototype.hasOwnProperty.call(record, 'structured');
  if (record.sourceType === 'work' && !hasStructured) {
    return false;
  }
  if (record.sourceType !== 'work' && hasStructured) {
    return false;
  }
  if (hasStructured) {
    var structured = record.structured;
    if (!isObject(structured) ||
        !hasOnlyKeys(structured, ['pointer', 'value']) ||
        !isNonEmptyString(structured.pointer) ||
        !isJsonPrimitive(structured.value)) {
      return false;
    }
  }
  return true;
}

function validRelation(relation) {
  return isObject(relation) &&
    isNonEmptyString(relation.from) &&
    isNonEmptyString(relation.to) &&
    isNonEmptyString(relation.relation) &&
    Array.isArray(relation.terms) &&
    relation.terms.every(isNonEmptyString) &&
    isNonEmptyString(relation.reason);
}

function validSourceManifest(manifest) {
  if (!Array.isArray(manifest)) {
    return false;
  }
  return manifest.every(function (entry) {
    if (!isObject(entry)) {
      return false;
    }
    var path = entry.path || entry.sourcePath;
    var hash = entry.sha256 || entry.sourceSha256;
    return isNonEmptyString(path) && SHA256.test(hash);
  });
}

function validCorpus(corpus) {
  if (!isObject(corpus) ||
      corpus.schema !== 'kodyw-public-twin/1.0' ||
      corpus.normalizationVersion !== 'plain-text/1' ||
      corpus.sourceManifestSha256 !== BASELINE_SOURCE_MANIFEST_SHA256 ||
      corpus.corpusSha256 !== BASELINE_CORPUS_SHA256 ||
      !isObject(corpus.stats) ||
      !hasOnlyKeys(corpus.stats, ['total', 'post', 'field_note', 'work']) ||
      !Array.isArray(corpus.relations) ||
      !corpus.relations.every(validRelation) ||
      !validSourceManifest(corpus.sourceManifest) ||
      !Array.isArray(corpus.records)) {
    return false;
  }

  var statNames = ['total', 'post', 'field_note', 'work'];
  for (var i = 0; i < statNames.length; i += 1) {
    if (!Number.isSafeInteger(corpus.stats[statNames[i]]) ||
        corpus.stats[statNames[i]] < 0) {
      return false;
    }
  }
  if (corpus.stats.total !== corpus.records.length ||
      corpus.stats.total !== corpus.stats.post +
        corpus.stats.field_note + corpus.stats.work) {
    return false;
  }
  var counts = { post: 0, field_note: 0, work: 0 };
  var ids = Object.create(null);
  for (var j = 0; j < corpus.records.length; j += 1) {
    var record = corpus.records[j];
    if (!validRecord(record) || ids[record.id]) {
      return false;
    }
    ids[record.id] = true;
    counts[record.sourceType] += 1;
  }
  return counts.post === corpus.stats.post &&
    counts.field_note === corpus.stats.field_note &&
    counts.work === corpus.stats.work;
}

function validateResponse(response) {
  if (!response || !response.ok) {
    return Promise.resolve(false);
  }
  return response.clone().json().then(validCorpus, function () {
    return false;
  });
}

function cachedCorpus() {
  return caches.open(CORPUS_CACHE).then(function (cache) {
    return cache.match(CORPUS_PATH);
  }).then(function (response) {
    if (!response) {
      return null;
    }
    return validateResponse(response).then(function (valid) {
      return valid ? response : null;
    });
  });
}

function refreshCorpus() {
  return fetch(CORPUS_PATH, { cache: 'no-store', credentials: 'same-origin' })
    .then(function (response) {
      return validateResponse(response).then(function (valid) {
        if (!valid) {
          throw new Error('Invalid twin corpus response');
        }
        return caches.open(CORPUS_CACHE).then(function (cache) {
          return cache.put(CORPUS_PATH, response.clone()).then(function () {
            return response;
          });
        });
      });
    })
    .catch(function () {
      return cachedCorpus().then(function (response) {
        if (response) {
          return response;
        }
        return new Response(
          JSON.stringify({ error: 'Twin corpus is unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      });
    });
}

function precacheShell() {
  return caches.open(SHELL_CACHE).then(function (cache) {
    return Promise.all(SHELL_PATHS.map(function (path) {
      return fetch(path, { cache: 'reload', credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Unable to cache ' + path);
          }
          return cache.put(path, response);
        });
    }));
  });
}

function shellResponse(request) {
  return caches.open(SHELL_CACHE).then(function (cache) {
    return cache.match(request, { ignoreSearch: true }).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(request).then(function (response) {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

function navigationResponse(request) {
  return fetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Navigation request failed');
    }
    return caches.open(SHELL_CACHE).then(function (cache) {
      return cache.put('/twin/', response.clone()).then(function () {
        return response;
      });
    });
  }).catch(function () {
    return caches.open(SHELL_CACHE).then(function (cache) {
      return cache.match('/twin/');
    }).then(function (response) {
      return response || new Response('Twin is unavailable offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    });
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(Promise.all([
    precacheShell(),
    refreshCorpus()
  ]).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) {
      var oldShell = name.indexOf('kody-twin-shell-') === 0 &&
        name !== SHELL_CACHE;
      var oldCorpus = name.indexOf('kody-twin-corpus-') === 0 &&
        name !== CORPUS_CACHE;
      if (oldShell || oldCorpus) {
        return caches.delete(name);
      }
      return Promise.resolve(false);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname === CORPUS_PATH) {
    event.respondWith(refreshCorpus());
    return;
  }
  if (request.mode === 'navigate' &&
      (url.pathname === '/twin' || url.pathname.indexOf('/twin/') === 0)) {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (SHELL_PATH_SET[url.pathname]) {
    event.respondWith(shellResponse(request));
  }
});
