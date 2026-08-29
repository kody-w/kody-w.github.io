(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module && module.exports) {
    module.exports = api;
  }
  if (root && typeof root === 'object') {
    root.KodyTwinEngine = api;
    if (root.window && typeof root.window === 'object') {
      root.window.KodyTwinEngine = api;
    }
  }
}(typeof globalThis !== 'undefined' ? globalThis
  : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  var SCHEMA = 'kodyw-public-twin/1.0';
  var NORMALIZATION = 'plain-text/1';
  var MAX_QUERY_LENGTH = 500;
  var MAX_QUERY_TOKENS = 32;
  var MAX_RESULTS = 50;
  var SHA256 = /^[0-9a-f]{64}$/;
  var SAFE_RELATION = /^[a-z][a-z0-9-]{0,63}$/;
  var SOURCE_TYPES = Object.freeze({
    post: true,
    field_note: true,
    work: true
  });
  var STOP_WORDS = Object.freeze({
    a: true, about: true, an: true, and: true, are: true, as: true, at: true,
    be: true, been: true, being: true, by: true, did: true, do: true, does: true,
    for: true, from: true, had: true, has: true, have: true, he: true, her: true,
    here: true, him: true, his: true, how: true, i: true, in: true, into: true,
    is: true, it: true, its: true, kody: true, me: true, my: true, of: true,
    on: true, or: true, our: true, she: true, should: true, that: true,
    the: true, their: true, them: true, there: true, they: true, this: true,
    to: true, was: true, we: true, were: true, what: true, when: true,
    where: true, which: true, who: true, why: true, wildfeuer: true,
    with: true, would: true, you: true, your: true
  });
  var SHA256_CONSTANTS = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isPlainObject(value) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function inspectData(value, path, seen, errors) {
    if (value === null || typeof value === 'string' ||
        typeof value === 'boolean') {
      return;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        addError(errors, path, 'INVALID_NUMBER', 'Numbers must be finite.');
      }
      return;
    }
    if (typeof value !== 'object') {
      addError(errors, path, 'NON_JSON_VALUE', 'Only JSON data is accepted.');
      return;
    }
    if (seen.indexOf(value) !== -1) {
      addError(errors, path, 'CYCLIC_VALUE', 'Cyclic data is not accepted.');
      return;
    }
    seen.push(value);

    if (!Array.isArray(value) && !isPlainObject(value)) {
      addError(errors, path, 'NON_PLAIN_OBJECT',
        'Objects must have a plain or null prototype.');
      seen.pop();
      return;
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      addError(errors, path, 'SYMBOL_PROPERTY',
        'Symbol properties are not accepted as JSON data.');
    }

    var descriptors = Object.getOwnPropertyDescriptors(value);
    var keys = Object.keys(descriptors);
    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      if (Array.isArray(value) && key === 'length') {
        continue;
      }
      var descriptor = descriptors[key];
      var childPath = Array.isArray(value)
        ? path + '[' + key + ']'
        : path + '.' + key;
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        addError(errors, childPath, 'UNSAFE_KEY', 'Unsafe object key.');
        continue;
      }
      if (!hasOwn(descriptor, 'value')) {
        addError(errors, childPath, 'ACCESSOR_PROPERTY',
          'Accessor properties are not accepted as data.');
        continue;
      }
      inspectData(descriptor.value, childPath, seen, errors);
    }
    seen.pop();
  }

  function addError(errors, path, code, message) {
    errors.push({ path: path, code: code, message: message });
  }

  function isNonEmptyString(value, maximum) {
    return typeof value === 'string' && value.length > 0 &&
      value.length <= maximum && value.trim() === value &&
      value.indexOf('\u0000') === -1 && value.indexOf('\r') === -1;
  }

  function validDate(value) {
    if (typeof value !== 'string') {
      return false;
    }
    var match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z)?$/.exec(value);
    if (!match) {
      return false;
    }
    var parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === Number(match[1]) &&
      parsed.getUTCMonth() + 1 === Number(match[2]) &&
      parsed.getUTCDate() === Number(match[3]);
  }

  function validSourcePath(value) {
    return isNonEmptyString(value, 1000) &&
      !/[\u0000-\u001f\u007f]/.test(value) &&
      value.charAt(0) !== '/' &&
      value.indexOf('\\') === -1 &&
      !/(?:^|\/)\.\.(?:\/|$)/.test(value);
  }

  function validSourceUrl(value) {
    return isNonEmptyString(value, 2000) &&
      !/[\u0000-\u001f\u007f]/.test(value) &&
      ((value.charAt(0) === '/' && value.charAt(1) !== '/') ||
       /^https:\/\/[^\/\s?#]+(?:[\/?#]|$)/.test(value));
  }

  function validPointer(pointer) {
    if (!isNonEmptyString(pointer, 1000) || pointer.charAt(0) !== '/') {
      return false;
    }
    if (!/^(?:\/(?:[^~/]|~[01])*)+$/.test(pointer)) {
      return false;
    }
    var parts = pointer.slice(1).split('/');
    for (var index = 0; index < parts.length; index += 1) {
      var part = parts[index].replace(/~1/g, '/').replace(/~0/g, '~');
      if (part === '__proto__' || part === 'prototype' ||
          part === 'constructor') {
        return false;
      }
    }
    return true;
  }

  function pointerLastPart(pointer) {
    var part = pointer.slice(pointer.lastIndexOf('/') + 1);
    return part.replace(/~1/g, '/').replace(/~0/g, '~');
  }

  function structuredEntry(record) {
    if (!record || !isPlainObject(record.structured) ||
        !validPointer(record.structured.pointer)) {
      return null;
    }
    var field = pointerLastPart(record.structured.pointer);
    if (hasOwn(record.structured, field) &&
        isStructuredPrimitive(record.structured[field])) {
      return {
        pointer: record.structured.pointer,
        field: field,
        value: record.structured[field]
      };
    }
    if (hasOwn(record.structured, 'value') &&
        isStructuredPrimitive(record.structured.value)) {
      return {
        pointer: record.structured.pointer,
        field: field,
        value: record.structured.value
      };
    }
    return null;
  }

  function isStructuredPrimitive(value) {
    return value === null || typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value));
  }

  function validateStringArray(value, path, errors, allowEmpty) {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
      addError(errors, path, 'INVALID_ARRAY', 'Expected an array of strings.');
      return;
    }
    var seen = Object.create(null);
    for (var index = 0; index < value.length; index += 1) {
      var item = value[index];
      if (!isNonEmptyString(item, 200)) {
        addError(errors, path + '[' + index + ']', 'INVALID_STRING',
          'Expected a normalized non-empty string.');
      } else if (seen[item]) {
        addError(errors, path + '[' + index + ']', 'DUPLICATE_VALUE',
          'Array values must be unique.');
      }
      seen[item] = true;
    }
  }

  function validateRecord(record, index, errors, ids, counts) {
    var path = '$.records[' + index + ']';
    if (!isPlainObject(record)) {
      addError(errors, path, 'INVALID_RECORD', 'Record must be an object.');
      return;
    }
    if (!isNonEmptyString(record.id, 300)) {
      addError(errors, path + '.id', 'INVALID_ID', 'Invalid record ID.');
    } else if (ids[record.id]) {
      addError(errors, path + '.id', 'DUPLICATE_ID', 'Record IDs must be unique.');
    } else {
      ids[record.id] = true;
    }
    if (!SOURCE_TYPES[record.sourceType]) {
      addError(errors, path + '.sourceType', 'INVALID_SOURCE_TYPE',
        'Unknown source type.');
    } else {
      counts[record.sourceType] += 1;
      var prefix = record.sourceType === 'field_note'
        ? 'field-note:' : record.sourceType + ':';
      if (typeof record.id === 'string' && record.id.indexOf(prefix) !== 0) {
        addError(errors, path + '.id', 'ID_SOURCE_MISMATCH',
          'Record ID does not match its source type.');
      }
    }
    if (!isNonEmptyString(record.title, 1000)) {
      addError(errors, path + '.title', 'INVALID_TITLE',
        'Title must be normalized and non-empty.');
    }
    if (!validDate(record.date)) {
      addError(errors, path + '.date', 'INVALID_DATE', 'Invalid source date.');
    }
    if (record.timeBasis !== 'published' &&
        record.timeBasis !== 'repository-created') {
      addError(errors, path + '.timeBasis', 'INVALID_TIME_BASIS',
        'Unknown time basis.');
    }
    if (record.author !== null && !isNonEmptyString(record.author, 500)) {
      addError(errors, path + '.author', 'INVALID_AUTHOR',
        'Author must be null or a normalized string.');
    }
    if (!validSourcePath(record.sourcePath)) {
      addError(errors, path + '.sourcePath', 'INVALID_SOURCE_PATH',
        'Source path must be a safe repository-relative path.');
    } else if (record.sourceType === 'post' &&
               record.sourcePath.indexOf('_posts/') !== 0) {
      addError(errors, path + '.sourcePath', 'SOURCE_PATH_MISMATCH',
        'Post provenance must point to _posts/.');
    } else if (record.sourceType === 'field_note' &&
               record.sourcePath.indexOf('_twin_posts/') !== 0) {
      addError(errors, path + '.sourcePath', 'SOURCE_PATH_MISMATCH',
        'Field-note provenance must point to _twin_posts/.');
    } else if (record.sourceType === 'work' &&
               record.sourcePath !== 'api/works.json') {
      addError(errors, path + '.sourcePath', 'SOURCE_PATH_MISMATCH',
        'Work provenance must point to api/works.json.');
    }
    if (!validSourceUrl(record.sourceUrl)) {
      addError(errors, path + '.sourceUrl', 'INVALID_SOURCE_URL',
        'Source URL must be root-relative or HTTPS.');
    }
    if (typeof record.sourceSha256 !== 'string' ||
        !SHA256.test(record.sourceSha256)) {
      addError(errors, path + '.sourceSha256', 'INVALID_SOURCE_HASH',
        'Source hash must be a lowercase SHA-256 digest.');
    }
    if (!isNonEmptyString(record.text, 1000000)) {
      addError(errors, path + '.text', 'INVALID_TEXT',
        'Text must be normalized and non-empty.');
    }
    if (hasOwn(record, 'tags')) {
      validateStringArray(record.tags, path + '.tags', errors, true);
    }
    if (record.sourceType === 'work') {
      if (!hasOwn(record, 'structured') || !structuredEntry(record)) {
        addError(errors, path + '.structured', 'INVALID_STRUCTURED_PROVENANCE',
          'Work records require an exact value and valid JSON Pointer.');
      }
    } else if (hasOwn(record, 'structured')) {
      addError(errors, path + '.structured', 'UNEXPECTED_STRUCTURED_PROVENANCE',
        'Only work records may use structured provenance.');
    }
  }

  function validateManifest(manifest, errors) {
    if (!Array.isArray(manifest)) {
      addError(errors, '$.sourceManifest', 'INVALID_MANIFEST',
        'Source manifest must be an array.');
      return;
    }
    if (manifest.length === 0) {
      addError(errors, '$.sourceManifest', 'EMPTY_MANIFEST',
        'Source manifest must contain provenance entries.');
      return;
    }
    var seen = Object.create(null);
    for (var index = 0; index < manifest.length; index += 1) {
      var item = manifest[index];
      var path = '$.sourceManifest[' + index + ']';
      if (!isPlainObject(item) || !validSourcePath(item.path) ||
          typeof item.sha256 !== 'string' || !SHA256.test(item.sha256)) {
        addError(errors, path, 'INVALID_MANIFEST_ENTRY',
          'Manifest entries require a safe path and SHA-256 digest.');
      } else if (seen[item.path]) {
        addError(errors, path + '.path', 'DUPLICATE_MANIFEST_PATH',
          'Manifest paths must be unique.');
      } else {
        seen[item.path] = true;
      }
    }
  }

  function compareUnicode(left, right) {
    var leftIndex = 0;
    var rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
      var leftPoint = left.codePointAt(leftIndex);
      var rightPoint = right.codePointAt(rightIndex);
      if (leftPoint !== rightPoint) {
        return leftPoint < rightPoint ? -1 : 1;
      }
      leftIndex += leftPoint > 0xffff ? 2 : 1;
      rightIndex += rightPoint > 0xffff ? 2 : 1;
    }
    if (leftIndex === left.length && rightIndex === right.length) {
      return 0;
    }
    return leftIndex === left.length ? -1 : 1;
  }

  function canonicalJson(value, root) {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError('Canonical JSON requires finite numbers.');
      }
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
      var items = [];
      for (var arrayIndex = 0; arrayIndex < value.length; arrayIndex += 1) {
        if (!hasOwn(value, String(arrayIndex))) {
          throw new TypeError('Canonical JSON does not accept sparse arrays.');
        }
        items.push(canonicalJson(value[arrayIndex], false));
      }
      return '[' + items.join(',') + ']';
    }
    if (!isPlainObject(value)) {
      throw new TypeError('Canonical JSON requires plain objects.');
    }
    var keys = Object.keys(value).filter(function (key) {
      return !(root && key === 'corpusSha256');
    }).sort(compareUnicode);
    var properties = [];
    for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      var key = keys[keyIndex];
      properties.push(JSON.stringify(key) + ':' +
        canonicalJson(value[key], false));
    }
    return '{' + properties.join(',') + '}';
  }

  function utf8Bytes(value) {
    var bytes = [];
    for (var index = 0; index < value.length; index += 1) {
      var point = value.charCodeAt(index);
      if (point >= 0xd800 && point <= 0xdbff) {
        if (index + 1 >= value.length) {
          throw new TypeError('Canonical JSON contains an unpaired surrogate.');
        }
        var low = value.charCodeAt(index + 1);
        if (low < 0xdc00 || low > 0xdfff) {
          throw new TypeError('Canonical JSON contains an unpaired surrogate.');
        }
        point = ((point - 0xd800) * 0x400) + (low - 0xdc00) + 0x10000;
        index += 1;
      } else if (point >= 0xdc00 && point <= 0xdfff) {
        throw new TypeError('Canonical JSON contains an unpaired surrogate.');
      }
      if (point <= 0x7f) {
        bytes.push(point);
      } else if (point <= 0x7ff) {
        bytes.push(0xc0 | (point >>> 6));
        bytes.push(0x80 | (point & 0x3f));
      } else if (point <= 0xffff) {
        bytes.push(0xe0 | (point >>> 12));
        bytes.push(0x80 | ((point >>> 6) & 0x3f));
        bytes.push(0x80 | (point & 0x3f));
      } else {
        bytes.push(0xf0 | (point >>> 18));
        bytes.push(0x80 | ((point >>> 12) & 0x3f));
        bytes.push(0x80 | ((point >>> 6) & 0x3f));
        bytes.push(0x80 | (point & 0x3f));
      }
    }
    return bytes;
  }

  function rotateRight(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  function wordHex(value) {
    return ('00000000' + (value >>> 0).toString(16)).slice(-8);
  }

  function sha256Hex(bytes) {
    var message = bytes.slice();
    var bitLength = bytes.length * 8;
    message.push(0x80);
    while (message.length % 64 !== 56) {
      message.push(0);
    }
    var highLength = Math.floor(bitLength / 0x100000000);
    var lowLength = bitLength >>> 0;
    for (var highShift = 24; highShift >= 0; highShift -= 8) {
      message.push((highLength >>> highShift) & 0xff);
    }
    for (var lowShift = 24; lowShift >= 0; lowShift -= 8) {
      message.push((lowLength >>> lowShift) & 0xff);
    }

    var hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    var words = new Array(64);
    for (var offset = 0; offset < message.length; offset += 64) {
      var wordIndex;
      for (wordIndex = 0; wordIndex < 16; wordIndex += 1) {
        var byteIndex = offset + wordIndex * 4;
        words[wordIndex] = (
          (message[byteIndex] << 24) |
          (message[byteIndex + 1] << 16) |
          (message[byteIndex + 2] << 8) |
          message[byteIndex + 3]
        );
      }
      for (wordIndex = 16; wordIndex < 64; wordIndex += 1) {
        var previous = words[wordIndex - 15];
        var prior = words[wordIndex - 2];
        var smallZero = rotateRight(previous, 7) ^
          rotateRight(previous, 18) ^ (previous >>> 3);
        var smallOne = rotateRight(prior, 17) ^
          rotateRight(prior, 19) ^ (prior >>> 10);
        words[wordIndex] = (words[wordIndex - 16] + smallZero +
          words[wordIndex - 7] + smallOne) | 0;
      }

      var a = hash[0];
      var b = hash[1];
      var c = hash[2];
      var d = hash[3];
      var e = hash[4];
      var f = hash[5];
      var g = hash[6];
      var h = hash[7];
      for (var round = 0; round < 64; round += 1) {
        var bigOne = rotateRight(e, 6) ^ rotateRight(e, 11) ^
          rotateRight(e, 25);
        var choose = (e & f) ^ ((~e) & g);
        var first = (h + bigOne + choose +
          SHA256_CONSTANTS[round] + words[round]) | 0;
        var bigZero = rotateRight(a, 2) ^ rotateRight(a, 13) ^
          rotateRight(a, 22);
        var majority = (a & b) ^ (a & c) ^ (b & c);
        var second = (bigZero + majority) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + first) | 0;
        d = c;
        c = b;
        b = a;
        a = (first + second) | 0;
      }
      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }
    return hash.map(wordHex).join('');
  }

  function computeCorpusSha256(corpus) {
    var errors = [];
    inspectData(corpus, '$', [], errors);
    if (errors.length > 0 || !isPlainObject(corpus)) {
      throw new TypeError('Corpus hash input must be JSON-only data.');
    }
    return sha256Hex(utf8Bytes(canonicalJson(corpus, true)));
  }

  function validateCorpus(corpus) {
    var errors = [];
    inspectData(corpus, '$', [], errors);
    if (errors.length > 0) {
      return { ok: false, errors: errors };
    }
    if (!isPlainObject(corpus)) {
      addError(errors, '$', 'INVALID_CORPUS', 'Corpus must be a JSON object.');
      return { ok: false, errors: errors };
    }
    if (corpus.schema !== SCHEMA) {
      addError(errors, '$.schema', 'UNSUPPORTED_SCHEMA',
        'Unsupported corpus schema.');
    }
    if (corpus.normalizationVersion !== NORMALIZATION) {
      addError(errors, '$.normalizationVersion', 'UNSUPPORTED_NORMALIZATION',
        'Unsupported normalization version.');
    }
    if (typeof corpus.sourceManifestSha256 !== 'string' ||
        !SHA256.test(corpus.sourceManifestSha256)) {
      addError(errors, '$.sourceManifestSha256', 'INVALID_MANIFEST_HASH',
        'Manifest hash must be a lowercase SHA-256 digest.');
    }
    if (typeof corpus.corpusSha256 !== 'string' ||
        !SHA256.test(corpus.corpusSha256)) {
      addError(errors, '$.corpusSha256', 'INVALID_CORPUS_HASH',
        'Corpus hash must be a lowercase SHA-256 digest.');
    } else {
      try {
        if (computeCorpusSha256(corpus) !== corpus.corpusSha256) {
          addError(errors, '$.corpusSha256', 'CORPUS_HASH_MISMATCH',
            'Corpus content does not match its declared SHA-256 digest.');
        }
      } catch (hashError) {
        addError(errors, '$.corpusSha256', 'CORPUS_HASH_FAILURE',
          'Corpus content cannot be hashed canonically.');
      }
    }
    validateManifest(corpus.sourceManifest, errors);

    var ids = Object.create(null);
    var counts = { post: 0, field_note: 0, work: 0 };
    if (!Array.isArray(corpus.records) || corpus.records.length === 0) {
      addError(errors, '$.records', 'INVALID_RECORDS',
        'Corpus records must be a non-empty array.');
    } else {
      for (var recordIndex = 0;
           recordIndex < corpus.records.length;
           recordIndex += 1) {
        validateRecord(corpus.records[recordIndex], recordIndex, errors,
          ids, counts);
      }
    }

    if (!isPlainObject(corpus.stats)) {
      addError(errors, '$.stats', 'INVALID_STATS', 'Stats must be an object.');
    } else {
      var expectedTotal = Array.isArray(corpus.records)
        ? corpus.records.length : 0;
      if (corpus.stats.total !== expectedTotal ||
          corpus.stats.post !== counts.post ||
          corpus.stats.field_note !== counts.field_note ||
          corpus.stats.work !== counts.work) {
        addError(errors, '$.stats', 'STATS_MISMATCH',
          'Declared stats do not match the records.');
      }
    }

    if (!Array.isArray(corpus.relations)) {
      addError(errors, '$.relations', 'INVALID_RELATIONS',
        'Relations must be an array.');
    } else {
      var relationKeys = Object.create(null);
      for (var relationIndex = 0;
           relationIndex < corpus.relations.length;
           relationIndex += 1) {
        var relation = corpus.relations[relationIndex];
        var relationPath = '$.relations[' + relationIndex + ']';
        if (!isPlainObject(relation)) {
          addError(errors, relationPath, 'INVALID_RELATION',
            'Relation must be an object.');
          continue;
        }
        if (!isNonEmptyString(relation.from, 300) || !ids[relation.from] ||
            !isNonEmptyString(relation.to, 300) || !ids[relation.to] ||
            relation.from === relation.to) {
          addError(errors, relationPath, 'INVALID_RELATION_ENDPOINT',
            'Relation endpoints must be distinct existing records.');
        }
        if (typeof relation.relation !== 'string' ||
            !SAFE_RELATION.test(relation.relation)) {
          addError(errors, relationPath + '.relation',
            'INVALID_RELATION_TYPE', 'Invalid relation type.');
        }
        validateStringArray(relation.terms, relationPath + '.terms',
          errors, false);
        if (!isNonEmptyString(relation.reason, 2000)) {
          addError(errors, relationPath + '.reason', 'INVALID_RELATION_REASON',
            'Relations require a normalized evidence reason.');
        }
        var relationKey = relation.from + '\u0000' + relation.to +
          '\u0000' + relation.relation;
        if (relationKeys[relationKey]) {
          addError(errors, relationPath, 'DUPLICATE_RELATION',
            'Duplicate relation.');
        }
        relationKeys[relationKey] = true;
      }
    }

    return {
      ok: errors.length === 0,
      errors: errors,
      schema: corpus.schema,
      normalizationVersion: corpus.normalizationVersion,
      records: Array.isArray(corpus.records) ? corpus.records.length : 0
    };
  }

  function cloneJson(value) {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(cloneJson);
    }
    var copy = {};
    var keys = Object.keys(value);
    for (var index = 0; index < keys.length; index += 1) {
      copy[keys[index]] = cloneJson(value[keys[index]]);
    }
    return copy;
  }

  function normalizeText(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return normalizeDataText(value.slice(0, MAX_QUERY_LENGTH));
  }

  function normalizeDataText(value) {
    if (typeof value !== 'string') {
      return '';
    }
    if (typeof value.normalize === 'function') {
      value = value.normalize('NFKC');
    }
    return value
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function tokenize(value) {
    var normalized = normalizeText(value);
    return tokensFromNormalized(normalized, MAX_QUERY_TOKENS);
  }

  function tokenizeData(value) {
    return tokensFromNormalized(normalizeDataText(value), Infinity);
  }

  function tokensFromNormalized(normalized, maximum) {
    var matches = normalized.match(/[a-z0-9\u00c0-\uffff]+/g) || [];
    var tokens = [];
    for (var index = 0;
         index < matches.length && tokens.length < maximum;
         index += 1) {
      if (matches[index].length > 1 || /^\d+$/.test(matches[index])) {
        tokens.push(matches[index]);
      }
    }
    return tokens;
  }

  function uniqueMeaningfulTokens(tokens) {
    var unique = [];
    var seen = Object.create(null);
    for (var index = 0; index < tokens.length; index += 1) {
      var token = tokens[index];
      if (!STOP_WORDS[token] && !seen[token]) {
        unique.push(token);
        seen[token] = true;
      }
    }
    return unique;
  }

  function countToken(tokens, token) {
    var count = 0;
    for (var index = 0; index < tokens.length; index += 1) {
      if (tokens[index] === token) {
        count += 1;
      }
    }
    return count;
  }

  function phraseCandidates(tokens, meaningful) {
    var phrases = [];
    var seen = Object.create(null);
    for (var size = Math.min(5, tokens.length); size >= 2; size -= 1) {
      for (var start = 0; start + size <= tokens.length; start += 1) {
        var slice = tokens.slice(start, start + size);
        var significant = 0;
        for (var tokenIndex = 0; tokenIndex < slice.length; tokenIndex += 1) {
          if (meaningful.indexOf(slice[tokenIndex]) !== -1) {
            significant += 1;
          }
        }
        if (significant >= 2) {
          var phrase = slice.join(' ');
          if (!seen[phrase]) {
            phrases.push(phrase);
            seen[phrase] = true;
          }
        }
      }
    }
    return phrases;
  }

  function boundedInteger(value, fallback, minimum, maximum) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(minimum, Math.min(maximum, Math.floor(value)));
  }

  function normalizeOptions(options) {
    var optionErrors = [];
    inspectData(options, '$options', [], optionErrors);
    var safe = optionErrors.length === 0 && isPlainObject(options)
      ? options : {};
    var sourceTypes = null;
    var sourceTypeList = null;
    if (Array.isArray(safe.sourceTypes)) {
      sourceTypes = Object.create(null);
      sourceTypeList = [];
      for (var index = 0; index < safe.sourceTypes.length; index += 1) {
        var sourceType = safe.sourceTypes[index];
        if (SOURCE_TYPES[sourceType] && !sourceTypes[sourceType]) {
          sourceTypes[sourceType] = true;
          sourceTypeList.push(sourceType);
        }
      }
    }
    var tagList = Array.isArray(safe.tags)
      ? safe.tags.filter(function (tag) {
        return typeof tag === 'string';
      })
      : [];
    var tags = uniqueMeaningfulTokens(tokenize(tagList.join(' ')));
    return {
      limit: boundedInteger(safe.limit, 10, 1, MAX_RESULTS),
      sourceTypes: sourceTypes,
      sourceTypeList: sourceTypeList,
      tags: tags,
      tagList: tagList,
      from: validDate(safe.from) ? safe.from : null,
      to: validDate(safe.to) ? safe.to : null
    };
  }

  function splitSpans(text) {
    var spans = [];
    var start = 0;
    for (var index = 0; index < text.length; index += 1) {
      var character = text.charAt(index);
      if (character === '\n' ||
          ((character === '.' || character === '!' || character === '?') &&
           (index + 1 === text.length || /\s/.test(text.charAt(index + 1))))) {
        var end = index + (character === '\n' ? 0 : 1);
        while (start < end && /\s/.test(text.charAt(start))) {
          start += 1;
        }
        while (end > start && /\s/.test(text.charAt(end - 1))) {
          end -= 1;
        }
        if (end > start) {
          spans.push({ start: start, end: end });
        }
        start = index + 1;
      }
    }
    while (start < text.length && /\s/.test(text.charAt(start))) {
      start += 1;
    }
    if (start < text.length) {
      spans.push({ start: start, end: text.length });
    }
    return spans;
  }

  function bestTextSpan(record, queryTokens, phrases) {
    var spans = splitSpans(record.text);
    if (spans.length === 0) {
      return { start: 0, end: record.text.length };
    }
    var best = spans[0];
    var bestScore = -1;
    for (var startIndex = 0; startIndex < spans.length; startIndex += 1) {
      for (var endIndex = startIndex;
           endIndex < spans.length && endIndex < startIndex + 3;
           endIndex += 1) {
        var span = {
          start: spans[startIndex].start,
          end: spans[endIndex].end
        };
        var normalized = normalizeDataText(
          record.text.slice(span.start, span.end));
        var evidenceTokens = tokenizeData(normalized);
        var matched = 0;
        for (var tokenIndex = 0;
             tokenIndex < queryTokens.length;
             tokenIndex += 1) {
          if (evidenceTokens.indexOf(queryTokens[tokenIndex]) !== -1) {
            matched += 1;
          }
        }
        var score = matched * 1000;
        for (var phraseIndex = 0;
             phraseIndex < phrases.length;
             phraseIndex += 1) {
          if (normalized.indexOf(phrases[phraseIndex]) !== -1) {
            score += phrases[phraseIndex].split(' ').length * 20;
          }
        }
        score -= (span.end - span.start) / 10000;
        if (score > bestScore ||
            (score === bestScore &&
             span.end - span.start < best.end - best.start)) {
          best = span;
          bestScore = score;
        }
      }
    }
    return best;
  }

  function makeCitation(record, queryTokens, phrases) {
    var structured = structuredEntry(record);
    var citation = {
      sourceId: record.id,
      sourceSha256: record.sourceSha256,
      sourceType: record.sourceType,
      title: record.title,
      author: record.author,
      date: record.date,
      timeBasis: record.timeBasis,
      sourceUrl: record.sourceUrl
    };
    if (record.sourceType === 'work' && structured) {
      citation.locator = {
        kind: 'json-pointer',
        pointer: structured.pointer
      };
      citation.value = cloneJson(structured.value);
      return citation;
    }
    var span = bestTextSpan(record, queryTokens, phrases);
    citation.locator = {
      kind: 'text',
      start: span.start,
      end: span.end
    };
    citation.quote = record.text.slice(span.start, span.end);
    return citation;
  }

  function citationEvidence(citation) {
    return citation.locator.kind === 'text'
      ? citation.quote : cloneJson(citation.value);
  }

  function citationSupportsQuery(citation, queryTokens) {
    if (!citation || queryTokens.length === 0) {
      return false;
    }
    var value = citation.locator.kind === 'text'
      ? citation.quote : String(citation.value);
    var evidenceTokens = tokenizeData(value);
    var matched = 0;
    for (var index = 0; index < queryTokens.length; index += 1) {
      if (evidenceTokens.indexOf(queryTokens[index]) !== -1) {
        matched += 1;
      }
    }
    if (queryTokens.length === 1) {
      return matched === 1;
    }
    return matched >= 2 && matched / queryTokens.length >= 0.5;
  }

  function createEngine(inputCorpus) {
    var validation = validateCorpus(inputCorpus);
    if (!validation.ok) {
      var detail = validation.errors.length
        ? validation.errors[0].code + ' at ' + validation.errors[0].path
        : 'invalid corpus';
      throw new TypeError('Cannot create twin engine: ' + detail);
    }

    var corpus = cloneJson(inputCorpus);
    var records = corpus.records.slice().sort(function (left, right) {
      return left.id < right.id ? -1 : (left.id > right.id ? 1 : 0);
    });
    var byId = Object.create(null);
    var inverted = Object.create(null);
    var indexed = [];

    for (var recordIndex = 0;
         recordIndex < records.length;
         recordIndex += 1) {
      var record = records[recordIndex];
      byId[record.id] = record;
      var titleNormalized = normalizeDataText(record.title);
      var textNormalized = normalizeDataText(record.text);
      var tags = Array.isArray(record.tags) ? record.tags : [];
      var tagsNormalized = normalizeDataText(tags.join(' '));
      var titleTokens = tokenizeData(record.title);
      var textTokens = tokenizeData(record.text);
      var tagTokens = tokenizeData(tags.join(' '));
      var allTokens = titleTokens.concat(textTokens, tagTokens);
      var unique = Object.create(null);
      for (var tokenIndex = 0; tokenIndex < allTokens.length; tokenIndex += 1) {
        var token = allTokens[tokenIndex];
        if (!unique[token]) {
          if (!inverted[token]) {
            inverted[token] = [];
          }
          inverted[token].push(recordIndex);
          unique[token] = true;
        }
      }
      indexed.push({
        record: record,
        titleNormalized: titleNormalized,
        textNormalized: textNormalized,
        tagsNormalized: tagsNormalized,
        titleTokens: titleTokens,
        textTokens: textTokens,
        tagTokens: tagTokens
      });
    }

    function searchInternal(query, options) {
      var normalized = normalizeText(query);
      var rawTokens = tokenize(query);
      var queryTokens = uniqueMeaningfulTokens(rawTokens);
      if (!normalized || queryTokens.length === 0) {
        return [];
      }
      var phrases = phraseCandidates(rawTokens, queryTokens);
      var safeOptions = normalizeOptions(options);
      var candidates = Object.create(null);
      for (var queryIndex = 0;
           queryIndex < queryTokens.length;
           queryIndex += 1) {
        var posting = inverted[queryTokens[queryIndex]] || [];
        for (var postingIndex = 0;
             postingIndex < posting.length;
             postingIndex += 1) {
          candidates[posting[postingIndex]] = true;
        }
      }

      var scored = [];
      var candidateIndexes = Object.keys(candidates);
      for (var candidateIndex = 0;
           candidateIndex < candidateIndexes.length;
           candidateIndex += 1) {
        var indexedRecord = indexed[Number(candidateIndexes[candidateIndex])];
        var candidate = indexedRecord.record;
        if (safeOptions.sourceTypes &&
            !safeOptions.sourceTypes[candidate.sourceType]) {
          continue;
        }
        if (safeOptions.from && candidate.date < safeOptions.from) {
          continue;
        }
        if (safeOptions.to && candidate.date > safeOptions.to) {
          continue;
        }
        if (safeOptions.tags.length > 0) {
          var hasEveryTag = true;
          for (var requiredTag = 0;
               requiredTag < safeOptions.tags.length;
               requiredTag += 1) {
            if (indexedRecord.tagTokens.indexOf(
              safeOptions.tags[requiredTag]) === -1) {
              hasEveryTag = false;
              break;
            }
          }
          if (!hasEveryTag) {
            continue;
          }
        }

        var score = 0;
        var matched = 0;
        if (indexedRecord.titleNormalized === normalized) {
          score += 140;
        } else if (indexedRecord.titleNormalized.indexOf(normalized) !== -1) {
          score += 90;
        }
        if (indexedRecord.textNormalized.indexOf(normalized) !== -1) {
          score += 70;
        }
        if (indexedRecord.tagsNormalized.indexOf(normalized) !== -1) {
          score += 45;
        }
        for (var phraseIndex = 0;
             phraseIndex < phrases.length;
             phraseIndex += 1) {
          var phraseValue = phrases[phraseIndex];
          var phraseSize = phraseValue.split(' ').length;
          if (indexedRecord.titleNormalized.indexOf(phraseValue) !== -1) {
            score += 20 * phraseSize;
          }
          if (indexedRecord.textNormalized.indexOf(phraseValue) !== -1) {
            score += 12 * phraseSize;
          }
          if (indexedRecord.tagsNormalized.indexOf(phraseValue) !== -1) {
            score += 10 * phraseSize;
          }
        }
        for (var scoringIndex = 0;
             scoringIndex < queryTokens.length;
             scoringIndex += 1) {
          var scoringToken = queryTokens[scoringIndex];
          var titleCount = countToken(
            indexedRecord.titleTokens, scoringToken);
          var textCount = countToken(indexedRecord.textTokens, scoringToken);
          var tagCount = countToken(indexedRecord.tagTokens, scoringToken);
          if (titleCount + textCount + tagCount > 0) {
            matched += 1;
            var documentFrequency = (inverted[scoringToken] || []).length;
            score += Math.min(20,
              ((records.length + 1) / (documentFrequency + 1)) * 4);
          }
          score += Math.min(titleCount, 3) * 18;
          score += Math.min(textCount, 5) * 6;
          score += Math.min(tagCount, 3) * 12;
        }
        var coverage = matched / queryTokens.length;
        score += coverage * 25;
        if (matched === queryTokens.length) {
          score += 25;
        }
        scored.push({
          indexed: indexedRecord,
          score: Math.round(score * 1000000) / 1000000,
          matched: matched,
          queryTokenCount: queryTokens.length,
          coverage: coverage,
          phrases: phrases,
          queryTokens: queryTokens
        });
      }

      scored.sort(function (left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (left.indexed.record.date !== right.indexed.record.date) {
          return left.indexed.record.date > right.indexed.record.date ? -1 : 1;
        }
        return left.indexed.record.id < right.indexed.record.id ? -1 : 1;
      });
      return scored.slice(0, safeOptions.limit);
    }

    function publicHit(hit) {
      var record = hit.indexed.record;
      var citation = makeCitation(record, hit.queryTokens, hit.phrases);
      return {
        sourceId: record.id,
        sourceType: record.sourceType,
        title: record.title,
        date: record.date,
        timeBasis: record.timeBasis,
        score: hit.score,
        evidence: citationEvidence(citation),
        citation: citation
      };
    }

    function search(query, options) {
      if (typeof query !== 'string') {
        return [];
      }
      return searchInternal(query, options).map(publicHit);
    }

    function isAnswerable(hit) {
      if (!hit) {
        return false;
      }
      if (hit.queryTokenCount === 1) {
        var token = hit.queryTokens[0];
        return hit.matched === 1 &&
          (hit.indexed.titleTokens.indexOf(token) !== -1 ||
           (inverted[token] || []).length <= Math.max(3,
             Math.ceil(records.length * 0.02)));
      }
      return hit.matched >= 2 && hit.coverage >= 0.5;
    }

    function answer(question, options) {
      if (typeof question !== 'string') {
        return {
          status: 'insufficient-evidence',
          question: '',
          claims: []
        };
      }
      var safeOptions = normalizeOptions(options);
      var internal = searchInternal(question, {
        limit: Math.min(safeOptions.limit, 8),
        sourceTypes: safeOptions.sourceTypeList,
        tags: safeOptions.tagList,
        from: safeOptions.from,
        to: safeOptions.to
      });
      var claims = [];
      for (var index = 0;
           index < internal.length && claims.length < Math.min(5, safeOptions.limit);
           index += 1) {
        if (!isAnswerable(internal[index])) {
          continue;
        }
        var hit = publicHit(internal[index]);
        if (!citationSupportsQuery(
          hit.citation, internal[index].queryTokens)) {
          continue;
        }
        claims.push({
          evidence: hit.evidence,
          citation: hit.citation
        });
      }
      return {
        status: claims.length > 0 ? 'answered' : 'insufficient-evidence',
        question: question.slice(0, MAX_QUERY_LENGTH),
        claims: claims
      };
    }

    function evolution(topic, options) {
      var safeOptions = normalizeOptions(options);
      var internal = typeof topic === 'string'
        ? searchInternal(topic, {
          limit: Math.min(MAX_RESULTS, Math.max(safeOptions.limit, 12)),
          sourceTypes: safeOptions.sourceTypeList,
          tags: safeOptions.tagList,
          from: safeOptions.from,
          to: safeOptions.to
        })
        : [];
      var items = [];
      for (var index = 0;
           index < internal.length && items.length < safeOptions.limit;
           index += 1) {
        if (!isAnswerable(internal[index])) {
          continue;
        }
        var hit = publicHit(internal[index]);
        if (!citationSupportsQuery(
          hit.citation, internal[index].queryTokens)) {
          continue;
        }
        items.push({
          at: hit.date,
          timeBasis: hit.timeBasis,
          language: 'Source evidence at this date; no belief change is inferred.',
          evidence: hit.evidence,
          citation: hit.citation
        });
      }
      items.sort(function (left, right) {
        if (left.at !== right.at) {
          return left.at < right.at ? -1 : 1;
        }
        return left.citation.sourceId < right.citation.sourceId ? -1 : 1;
      });
      return {
        status: items.length >= 2
          ? 'evidence-timeline' : 'insufficient-evidence',
        topic: typeof topic === 'string'
          ? topic.slice(0, MAX_QUERY_LENGTH) : '',
        timeBasis: 'Each item reports its declared source timeBasis.',
        interpretation: 'Chronology alone does not establish a change in belief.',
        items: items.length >= 2 ? items : []
      };
    }

    function relationApplies(relation, queryTokens) {
      var relationTokens = uniqueMeaningfulTokens(tokenize(
        relation.terms.join(' ')));
      if (relationTokens.length === 0) {
        return true;
      }
      for (var index = 0; index < relationTokens.length; index += 1) {
        if (queryTokens.indexOf(relationTokens[index]) !== -1) {
          return true;
        }
      }
      return false;
    }

    function recordAllowed(record, safeOptions) {
      if (safeOptions.sourceTypes &&
          !safeOptions.sourceTypes[record.sourceType]) {
        return false;
      }
      if ((safeOptions.from && record.date < safeOptions.from) ||
          (safeOptions.to && record.date > safeOptions.to)) {
        return false;
      }
      if (safeOptions.tags.length > 0) {
        var recordTags = tokenizeData(
          Array.isArray(record.tags) ? record.tags.join(' ') : '');
        for (var index = 0; index < safeOptions.tags.length; index += 1) {
          if (recordTags.indexOf(safeOptions.tags[index]) === -1) {
            return false;
          }
        }
      }
      return true;
    }

    function challenge(question, options) {
      var safeOptions = normalizeOptions(options);
      var internal = typeof question === 'string'
        ? searchInternal(question, {
          limit: 12,
          sourceTypes: safeOptions.sourceTypeList,
          tags: safeOptions.tagList,
          from: safeOptions.from,
          to: safeOptions.to
        })
        : [];
      if (internal.length === 0) {
        return {
          status: 'missing-evidence',
          question: typeof question === 'string'
            ? question.slice(0, MAX_QUERY_LENGTH) : '',
          thesis: [],
          counterevidence: []
        };
      }
      var queryTokens = uniqueMeaningfulTokens(tokenize(question));
      var queryPhrases = phraseCandidates(tokenize(question), queryTokens);
      var thesisInternal = null;
      var selectedRelation = null;

      for (var hitIndex = 0;
           hitIndex < internal.length && !selectedRelation;
           hitIndex += 1) {
        if (!isAnswerable(internal[hitIndex])) {
          continue;
        }
        var possibleThesis = publicHit(internal[hitIndex]);
        if (!citationSupportsQuery(
          possibleThesis.citation, internal[hitIndex].queryTokens)) {
          continue;
        }
        for (var relationIndex = 0;
             relationIndex < corpus.relations.length;
             relationIndex += 1) {
          var candidateRelation = corpus.relations[relationIndex];
          if (candidateRelation.from ===
                internal[hitIndex].indexed.record.id &&
              relationApplies(candidateRelation, queryTokens) &&
              recordAllowed(byId[candidateRelation.from], safeOptions) &&
              recordAllowed(byId[candidateRelation.to], safeOptions)) {
            thesisInternal = internal[hitIndex];
            selectedRelation = candidateRelation;
            break;
          }
        }
      }

      if (!thesisInternal) {
        for (var thesisIndex = 0;
             thesisIndex < internal.length;
             thesisIndex += 1) {
          if (!isAnswerable(internal[thesisIndex])) {
            continue;
          }
          var fallbackThesis = publicHit(internal[thesisIndex]);
          if (citationSupportsQuery(
            fallbackThesis.citation, internal[thesisIndex].queryTokens)) {
            thesisInternal = internal[thesisIndex];
            break;
          }
        }
      }
      if (!thesisInternal) {
        return {
          status: 'missing-evidence',
          question: question.slice(0, MAX_QUERY_LENGTH),
          thesis: [],
          counterevidence: []
        };
      }

      var thesisHit = publicHit(thesisInternal);
      var thesis = [{
        evidence: thesisHit.evidence,
        citation: thesisHit.citation
      }];
      var counter = null;

      if (selectedRelation) {
        var related = byId[selectedRelation.to];
        var relatedCitation = makeCitation(related, queryTokens,
          queryPhrases);
        counter = {
          relation: selectedRelation.relation,
          evidence: citationEvidence(relatedCitation),
          citation: relatedCitation
        };
      }

      return {
        status: counter ? 'evidence-found' : 'missing-evidence',
        question: question.slice(0, MAX_QUERY_LENGTH),
        thesis: thesis,
        counterevidence: counter ? [counter] : []
      };
    }

    function source(id) {
      if (typeof id !== 'string' || !byId[id]) {
        return null;
      }
      return cloneJson(byId[id]);
    }

    function validateCitation(citation) {
      var dataErrors = [];
      inspectData(citation, '$', [], dataErrors);
      if (dataErrors.length > 0 || !isPlainObject(citation) ||
          typeof citation.sourceId !== 'string' ||
          !byId[citation.sourceId]) {
        return { ok: false, reason: 'invalid-citation' };
      }
      var record = byId[citation.sourceId];
      if (citation.sourceSha256 !== record.sourceSha256 ||
          citation.sourceType !== record.sourceType ||
          citation.title !== record.title ||
          citation.author !== record.author ||
          citation.date !== record.date ||
          citation.timeBasis !== record.timeBasis ||
          citation.sourceUrl !== record.sourceUrl ||
          !isPlainObject(citation.locator)) {
        return { ok: false, reason: 'provenance-mismatch' };
      }
      if (citation.locator.kind === 'text') {
        var start = citation.locator.start;
        var end = citation.locator.end;
        if (!Number.isInteger(start) || !Number.isInteger(end) ||
            start < 0 || end <= start || end > record.text.length ||
            typeof citation.quote !== 'string' ||
            record.text.slice(start, end) !== citation.quote) {
          return { ok: false, reason: 'text-span-mismatch' };
        }
      } else if (citation.locator.kind === 'json-pointer') {
        var entry = structuredEntry(record);
        if (!entry || citation.locator.pointer !== entry.pointer ||
            !jsonEqual(citation.value, entry.value)) {
          return { ok: false, reason: 'structured-value-mismatch' };
        }
      } else {
        return { ok: false, reason: 'unknown-locator' };
      }
      return {
        ok: true,
        sourceId: record.id,
        sourceSha256: record.sourceSha256
      };
    }

    function stats() {
      return {
        schema: corpus.schema,
        normalizationVersion: corpus.normalizationVersion,
        corpusSha256: corpus.corpusSha256,
        records: records.length,
        relations: corpus.relations.length,
        post: corpus.stats.post,
        field_note: corpus.stats.field_note,
        work: corpus.stats.work
      };
    }

    return Object.freeze({
      stats: stats,
      search: search,
      answer: answer,
      evolution: evolution,
      challenge: challenge,
      source: source,
      validateCitation: validateCitation
    });
  }

  function jsonEqual(left, right) {
    if (left === right) {
      return true;
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return Number.isFinite(left) && Number.isFinite(right) && left === right;
    }
    return false;
  }

  return Object.freeze({
    version: '1.0.0',
    validateCorpus: validateCorpus,
    computeCorpusSha256: computeCorpusSha256,
    createEngine: createEngine,
    normalizeText: normalizeText,
    tokenize: tokenize
  });
}));
