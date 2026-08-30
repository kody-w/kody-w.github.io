'use strict';

importScripts('/js/twin-engine.js');

var CORPUS_PATH = '/api/twin-corpus.json';
var BASELINE_SOURCE_MANIFEST_SHA256 =
  '21f5d074536a7ad5b4db4e3d7445aa3daf97a54e72a091ff543b6fa20cacd5d3';
var BASELINE_CORPUS_SHA256 =
  'cd7445811d231f1741890bdb58535d8d04a8244e9932b3f71948cc5514ef0bab';
var SHELL_RELEASE_SHA256 =
  'd4c42cffb0d8eafdb3ddb411f62f4a6fd3664cb44ae380c393e6901f04581d31';
var SHELL_CACHE = 'kody-twin-shell-' + SHELL_RELEASE_SHA256.slice(0, 16);
var CORPUS_CACHE = 'kody-twin-corpus-' + BASELINE_CORPUS_SHA256.slice(0, 16);
var SHELL_MANIFEST_PATH = '/public-twin/shell-manifest.json';
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

function responseType(response) {
  return (response.headers.get('Content-Type') || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
}

function allowedType(response, types) {
  var actual = responseType(response);
  return Array.isArray(types) && types.some(function (type) {
    return actual === String(type).toLowerCase();
  });
}

function bytesHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(function (value) {
    return value.toString(16).padStart(2, '0');
  }).join('');
}

function responseSha256(response) {
  return response.clone().arrayBuffer().then(function (buffer) {
    return crypto.subtle.digest('SHA-256', buffer);
  }).then(bytesHex);
}

function validShellUrl(value) {
  return isNonEmptyString(value) &&
    value.charAt(0) === '/' &&
    value.charAt(1) !== '/' &&
    value.indexOf('\\') === -1 &&
    value.indexOf('..') === -1;
}

function validShellManifest(manifest) {
  if (!isObject(manifest) ||
      manifest.schema !== 'kodyw-twin-shell/1.0' ||
      !SHA256.test(manifest.sourceSha256) ||
      !Array.isArray(manifest.documents) ||
      manifest.documents.length === 0 ||
      !Array.isArray(manifest.assets) ||
      manifest.assets.length === 0) {
    return false;
  }
  var seen = Object.create(null);
  var documentsValid = manifest.documents.every(function (document) {
    if (!isObject(document) ||
        !validShellUrl(document.url) ||
        seen[document.url] ||
        !Array.isArray(document.contentTypes) ||
        document.contentTypes.length === 0 ||
        !document.contentTypes.every(isNonEmptyString) ||
        !Array.isArray(document.requiredText) ||
        document.requiredText.length === 0 ||
        !document.requiredText.every(isNonEmptyString)) {
      return false;
    }
    seen[document.url] = true;
    return true;
  });
  if (!documentsValid) {
    return false;
  }
  return manifest.assets.every(function (asset) {
    if (!isObject(asset) ||
        !validShellUrl(asset.url) ||
        seen[asset.url] ||
        !SHA256.test(asset.sha256) ||
        !Array.isArray(asset.contentTypes) ||
        asset.contentTypes.length === 0 ||
        !asset.contentTypes.every(isNonEmptyString)) {
      return false;
    }
    seen[asset.url] = true;
    return true;
  });
}

function parseShellManifest(response) {
  if (!response || !response.ok ||
      !allowedType(response, ['application/json'])) {
    return Promise.reject(new Error('Invalid twin shell manifest response'));
  }
  return Promise.all([
    responseSha256(response),
    response.clone().text()
  ]).then(function (values) {
    if (values[0] !== SHELL_RELEASE_SHA256) {
      throw new Error('Twin shell manifest digest mismatch');
    }
    var manifest = JSON.parse(values[1]);
    if (!validShellManifest(manifest)) {
      throw new Error('Invalid twin shell manifest');
    }
    return {
      manifest: manifest,
      response: response
    };
  });
}

function fetchShellManifest() {
  return fetch(SHELL_MANIFEST_PATH, {
    cache: 'no-store',
    credentials: 'same-origin'
  }).then(parseShellManifest);
}

function cachedShellManifest() {
  return caches.open(SHELL_CACHE).then(function (cache) {
    return cache.match(SHELL_MANIFEST_PATH);
  }).then(function (response) {
    return response ? parseShellManifest(response) : null;
  }).catch(function () {
    return null;
  });
}

function verifyShellResponse(specification, response) {
  if (!response || !response.ok ||
      !allowedType(response, specification.contentTypes)) {
    return Promise.reject(new Error(
      'Invalid shell response for ' + specification.url
    ));
  }
  if (specification.sha256) {
    return responseSha256(response).then(function (digest) {
      if (digest !== specification.sha256) {
        throw new Error('Shell digest mismatch for ' + specification.url);
      }
      return response;
    });
  }
  return response.clone().text().then(function (body) {
    var valid = specification.requiredText.every(function (required) {
      return body.indexOf(required) !== -1;
    });
    if (!valid) {
      throw new Error('Shell document markers missing for ' + specification.url);
    }
    return response;
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

function engineValidCorpus(corpus) {
  if (!self.KodyTwinEngine ||
      typeof self.KodyTwinEngine.validateCorpus !== 'function') {
    return Promise.resolve(false);
  }
  try {
    return Promise.resolve(self.KodyTwinEngine.validateCorpus(corpus))
      .then(function (result) {
        return result === true ||
          Boolean(result && result.ok === true);
      }, function () {
        return false;
      });
  } catch (error) {
    return Promise.resolve(false);
  }
}

function validateResponse(response) {
  if (!response || !response.ok) {
    return Promise.resolve(false);
  }
  return response.clone().json().then(function (corpus) {
    if (!validCorpus(corpus)) {
      return false;
    }
    return engineValidCorpus(corpus);
  }, function () {
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

function fetchAndPromoteCorpus() {
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
    });
}

function refreshCorpus() {
  return fetchAndPromoteCorpus().catch(function () {
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

function requireValidatedCorpus() {
  return fetchAndPromoteCorpus().catch(function (networkError) {
    return cachedCorpus().then(function (response) {
      if (!response) {
        throw networkError;
      }
      return response;
    });
  });
}

function shellSpecifications(manifest) {
  return manifest.documents.concat(manifest.assets);
}

function shellIsCached() {
  return cachedShellManifest().then(function (bundle) {
    if (!bundle) {
      return false;
    }
    return caches.open(SHELL_CACHE).then(function (cache) {
      return Promise.all(shellSpecifications(bundle.manifest).map(
        function (specification) {
          return cache.match(specification.url).then(function (response) {
            if (!response) {
              throw new Error('Missing shell asset ' + specification.url);
            }
            return verifyShellResponse(specification, response);
          });
        }
      ));
    }).then(function () {
      return true;
    });
  }).catch(function () {
    return false;
  });
}

function requireActivationCaches() {
  return Promise.all([
    shellIsCached(),
    cachedCorpus()
  ]).then(function (results) {
    if (!results[0] || !results[1]) {
      throw new Error('Twin shell and validated corpus must be cached');
    }
  });
}

function deleteOldCaches() {
  return caches.keys().then(function (names) {
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
  });
}

function precacheShell() {
  return fetchShellManifest().then(function (bundle) {
    var specifications = shellSpecifications(bundle.manifest);
    return Promise.all(specifications.map(function (specification) {
      return fetch(specification.url, {
        cache: 'reload',
        credentials: 'same-origin'
      }).then(function (response) {
        return verifyShellResponse(specification, response);
      }).then(function (response) {
        return {
          specification: specification,
          response: response
        };
      });
    })).then(function (verified) {
      return caches.open(SHELL_CACHE).then(function (cache) {
        var writes = verified.map(function (item) {
          return cache.put(
            item.specification.url,
            item.response.clone()
          );
        });
        writes.push(cache.put(
          SHELL_MANIFEST_PATH,
          bundle.response.clone()
        ));
        return Promise.all(writes);
      });
    });
  });
}

function shellResponse(request) {
  return caches.open(SHELL_CACHE).then(function (cache) {
    return cache.match(request, { ignoreSearch: true }).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(request);
    });
  });
}

function navigationResponse(request) {
  var pathname = new URL(request.url).pathname;
  var isAppPath = pathname === '/public-twin' ||
    pathname === '/public-twin/';
  if (!isAppPath) {
    return shellResponse(request).catch(function () {
      return new Response('Twin resource is unavailable offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    });
  }
  return fetch(request).then(function (response) {
    return cachedShellManifest().then(function (bundle) {
      if (!bundle) {
        throw new Error('Verified shell manifest is unavailable');
      }
      var specification = bundle.manifest.documents.find(function (item) {
        return item.url === '/public-twin/';
      });
      if (!specification) {
        throw new Error('Canonical twin document is not declared');
      }
      return verifyShellResponse(specification, response);
    });
  }).catch(function () {
    return caches.open(SHELL_CACHE).then(function (cache) {
      return cache.match('/public-twin/');
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
    requireValidatedCorpus()
  ]).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(requireActivationCaches().then(function () {
    return deleteOldCaches();
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
      (url.pathname === '/public-twin' ||
       url.pathname.indexOf('/public-twin/') === 0)) {
    event.respondWith(navigationResponse(request));
    return;
  }
  event.respondWith(shellResponse(request));
});
