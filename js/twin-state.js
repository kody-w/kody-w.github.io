(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.KodyTwinState = api;
  } else if (root) {
    root.KodyTwinState = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHEMA = 'kody-twin-state/1';
  var DEFAULT_KEY = 'kody-twin-state';
  var DEFAULT_MAX_HISTORY = 100;
  var MAX_IMPORT_BYTES = 1024 * 1024;
  var MAX_PERSISTED_BYTES = MAX_IMPORT_BYTES + 256;
  var TOP_LEVEL_KEYS = [
    'schema',
    'revision',
    'preferences',
    'history',
    'pinnedCitations',
    'savedQuestions'
  ];
  var UNSAFE_KEYS = {
    '__proto__': true,
    'constructor': true,
    'prototype': true
  };

  function initialState() {
    return {
      schema: SCHEMA,
      revision: 0,
      preferences: {},
      history: [],
      pinnedCitations: [],
      savedQuestions: []
    };
  }

  function isPlainObject(value) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function validateJsonValue(value, depth) {
    if (depth > 100) {
      throw new TypeError('State is nested too deeply');
    }
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      return;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError('State numbers must be finite');
      }
      return;
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i += 1) {
        validateJsonValue(value[i], depth + 1);
      }
      return;
    }
    if (!isPlainObject(value)) {
      throw new TypeError('State values must be JSON-compatible');
    }
    var keys = Object.keys(value);
    for (var j = 0; j < keys.length; j += 1) {
      if (UNSAFE_KEYS[keys[j]]) {
        throw new TypeError('Unsafe object key: ' + keys[j]);
      }
      validateJsonValue(value[keys[j]], depth + 1);
    }
  }

  function validateObjectArray(value, name) {
    if (!Array.isArray(value)) {
      throw new TypeError(name + ' must be an array');
    }
    for (var i = 0; i < value.length; i += 1) {
      if (!isPlainObject(value[i])) {
        throw new TypeError(name + ' entries must be objects');
      }
      validateJsonValue(value[i], 1);
    }
  }

  function validateState(value) {
    if (!isPlainObject(value)) {
      throw new TypeError('State must be an object');
    }

    var keys = Object.keys(value).sort();
    var expected = TOP_LEVEL_KEYS.slice().sort();
    if (keys.length !== expected.length) {
      throw new TypeError('State has unknown or missing top-level keys');
    }
    for (var i = 0; i < expected.length; i += 1) {
      if (keys[i] !== expected[i]) {
        throw new TypeError('State has unknown or missing top-level keys');
      }
    }

    if (value.schema !== SCHEMA) {
      throw new TypeError('Unsupported state schema');
    }
    if (!Number.isSafeInteger(value.revision) || value.revision < 0) {
      throw new TypeError('revision must be a non-negative safe integer');
    }
    if (!isPlainObject(value.preferences)) {
      throw new TypeError('preferences must be an object');
    }
    validateJsonValue(value.preferences, 1);
    validateObjectArray(value.history, 'history');
    validateObjectArray(value.pinnedCitations, 'pinnedCitations');
    validateObjectArray(value.savedQuestions, 'savedQuestions');
  }

  function canonicalize(value) {
    if (Array.isArray(value)) {
      return value.map(canonicalize);
    }
    if (isPlainObject(value)) {
      var result = {};
      Object.keys(value).sort().forEach(function (key) {
        result[key] = canonicalize(value[key]);
      });
      return result;
    }
    return value;
  }

  function canonicalJson(value) {
    return JSON.stringify(canonicalize(value));
  }

  function clone(value) {
    return JSON.parse(canonicalJson(value));
  }

  function utf8Length(value) {
    var bytes = 0;
    for (var i = 0; i < value.length; i += 1) {
      var code = value.charCodeAt(i);
      if (code <= 0x7f) {
        bytes += 1;
      } else if (code <= 0x7ff) {
        bytes += 2;
      } else if (code >= 0xd800 && code <= 0xdbff &&
                 i + 1 < value.length &&
                 value.charCodeAt(i + 1) >= 0xdc00 &&
                 value.charCodeAt(i + 1) <= 0xdfff) {
        bytes += 4;
        i += 1;
      } else {
        bytes += 3;
      }
    }
    return bytes;
  }

  function parseImport(serialized) {
    if (typeof serialized !== 'string') {
      throw new TypeError('Imported state must be a JSON string');
    }
    if (utf8Length(serialized) > MAX_IMPORT_BYTES) {
      throw new RangeError('Imported state is too large');
    }
    var parsed = JSON.parse(serialized);
    validateState(parsed);
    return parsed;
  }

  function createStore(options) {
    options = options || {};
    if (!isPlainObject(options)) {
      throw new TypeError('options must be an object');
    }
    var key = options.key === undefined ? DEFAULT_KEY : options.key;
    var maxHistory = options.maxHistory === undefined
      ? DEFAULT_MAX_HISTORY
      : options.maxHistory;
    var storage = null;
    var mode = 'memory';
    var state = initialState();
    var persistentStateMayExist = false;
    var localGeneration = 0;

    if (typeof key !== 'string' || !key) {
      throw new TypeError('key must be a non-empty string');
    }
    var generationKey = key + ':generation';
    if (!Number.isSafeInteger(maxHistory) || maxHistory < 0) {
      throw new TypeError('maxHistory must be a non-negative safe integer');
    }

    if (Object.prototype.hasOwnProperty.call(options, 'storage')) {
      storage = options.storage;
    } else if (typeof window !== 'undefined') {
      try {
        storage = window.localStorage;
      } catch (error) {
        storage = null;
        persistentStateMayExist = true;
      }
    }
    if (storage && typeof storage.getItem === 'function' &&
        typeof storage.setItem === 'function') {
      mode = 'localStorage';
    } else {
      storage = null;
    }

    function boundHistory(candidate) {
      if (candidate.history.length > maxHistory) {
        candidate.history = candidate.history.slice(candidate.history.length - maxHistory);
      }
      return candidate;
    }

    function parseGeneration(serialized) {
      if (serialized === null) {
        return 0;
      }
      if (!/^(?:0|[1-9][0-9]*)$/.test(serialized)) {
        throw new TypeError('Invalid durable state generation');
      }
      var generation = Number(serialized);
      if (!Number.isSafeInteger(generation)) {
        throw new TypeError('Invalid durable state generation');
      }
      return generation;
    }

    function persistedStateJson(candidate, generation) {
      return canonicalJson({
        generation: generation,
        state: candidate
      });
    }

    function parsePersistedState(serialized, generation, generationExists) {
      if (utf8Length(serialized) > MAX_PERSISTED_BYTES) {
        throw new RangeError('Persisted state is too large');
      }
      var parsed = JSON.parse(serialized);
      if (isPlainObject(parsed) &&
          Object.keys(parsed).length === 2 &&
          Object.prototype.hasOwnProperty.call(parsed, 'generation') &&
          Object.prototype.hasOwnProperty.call(parsed, 'state')) {
        if (!Number.isSafeInteger(parsed.generation) ||
            parsed.generation < 0) {
          throw new TypeError('Invalid persisted state generation');
        }
        validateState(parsed.state);
        return parsed.generation === generation ? parsed.state : null;
      }
      validateState(parsed);
      if (generationExists && generation !== 0) {
        return null;
      }
      return parsed;
    }

    function stateConflict() {
      var error = new Error('Persistent state was reset by another store');
      error.name = 'TwinStateConflictError';
      error.code = 'STATE_CONFLICT';
      return error;
    }

    function durableGeneration() {
      return parseGeneration(storage.getItem(generationKey));
    }

    function discardSnapshotIfOwned(serialized) {
      try {
        if (storage.getItem(key) === serialized &&
            typeof storage.removeItem === 'function') {
          storage.removeItem(key);
        }
      } catch (error) {
        // The generation tombstone still prevents this snapshot from loading.
      }
    }

    function persist(candidate) {
      if (mode !== 'localStorage') {
        return;
      }
      var generation;
      try {
        generation = durableGeneration();
      } catch (error) {
        persistentStateMayExist = true;
        mode = 'memory';
        return;
      }
      if (generation !== localGeneration) {
        throw stateConflict();
      }

      var serialized = persistedStateJson(candidate, localGeneration);
      try {
        storage.setItem(key, serialized);
        persistentStateMayExist = true;
      } catch (error) {
        persistentStateMayExist = true;
        mode = 'memory';
        return;
      }

      try {
        generation = durableGeneration();
      } catch (error) {
        discardSnapshotIfOwned(serialized);
        mode = 'memory';
        return;
      }
      if (generation !== localGeneration) {
        discardSnapshotIfOwned(serialized);
        throw stateConflict();
      }
    }

    var stored = null;
    var storedGeneration = null;
    if (mode === 'localStorage') {
      try {
        storedGeneration = storage.getItem(generationKey);
        stored = storage.getItem(key);
        localGeneration = parseGeneration(storedGeneration);
        persistentStateMayExist = stored !== null;
      } catch (error) {
        persistentStateMayExist = true;
        mode = 'memory';
      }
    }
    if (mode === 'localStorage' && stored !== null) {
      try {
        var loaded = parsePersistedState(
          stored,
          localGeneration,
          storedGeneration !== null
        );
        if (loaded !== null) {
          boundHistory(loaded);
          state = clone(loaded);
          if (persistedStateJson(state, localGeneration) !== stored) {
            persist(state);
          }
        }
      } catch (error) {
        state = initialState();
        persist(state);
      }
    }

    function replaceState(candidate, shouldBoundHistory) {
      validateState(candidate);
      if (!shouldBoundHistory && candidate.history.length > maxHistory) {
        throw new RangeError('Imported history exceeds maxHistory');
      }
      var next = clone(candidate);
      if (shouldBoundHistory) {
        boundHistory(next);
      }
      persist(next);
      state = next;
      return clone(state);
    }

    function resetError(code, message) {
      var error = new Error(message);
      error.name = 'TwinStateStorageError';
      error.code = code;
      return error;
    }

    function readBackMatches(storageKey, expected) {
      if (!storage || typeof storage.getItem !== 'function') {
        return false;
      }
      try {
        return storage.getItem(storageKey) === expected;
      } catch (error) {
        return false;
      }
    }

    function durablyReset(next) {
      if (!storage) {
        if (!persistentStateMayExist) {
          return;
        }
        throw resetError(
          'STORAGE_UNAVAILABLE',
          'Persistent state may exist but storage is unavailable'
        );
      }

      var durable;
      try {
        durable = durableGeneration();
        storage.getItem(key);
      } catch (error) {
        mode = 'memory';
        throw resetError(
          'STORAGE_UNAVAILABLE',
          'Persistent state could not be inspected before reset'
        );
      }
      if (durable >= Number.MAX_SAFE_INTEGER) {
        throw resetError(
          'RESET_NOT_PERSISTED',
          'Persistent state generation cannot be incremented'
        );
      }

      var nextGeneration = durable + 1;
      var serializedGeneration = String(nextGeneration);
      try {
        storage.setItem(generationKey, serializedGeneration);
        if (!readBackMatches(generationKey, serializedGeneration)) {
          throw new Error('Generation verification failed');
        }
      } catch (error) {
        mode = 'memory';
        throw resetError(
          'RESET_NOT_PERSISTED',
          'Reset generation could not be durably persisted'
        );
      }

      if (typeof storage.removeItem === 'function') {
        try {
          storage.removeItem(key);
          if (readBackMatches(key, null)) {
            persistentStateMayExist = false;
            localGeneration = nextGeneration;
            return;
          }
        } catch (error) {
          mode = 'memory';
        }
      }

      var serialized = persistedStateJson(next, nextGeneration);
      try {
        storage.setItem(key, serialized);
        if (readBackMatches(key, serialized)) {
          persistentStateMayExist = true;
          localGeneration = nextGeneration;
          return;
        }
      } catch (error) {
        mode = 'memory';
      }

      mode = 'memory';
      throw resetError(
        'RESET_NOT_PERSISTED',
        'Persistent state could not be cleared or overwritten'
      );
    }

    return Object.freeze({
      get: function () {
        return clone(state);
      },

      update: function (updater) {
        if (typeof updater !== 'function') {
          throw new TypeError('update requires a function');
        }
        var draft = clone(state);
        var replacement = updater(draft);
        if (replacement !== undefined) {
          draft = replacement;
        }
        if (!isPlainObject(draft)) {
          throw new TypeError('update must produce a state object');
        }
        draft.schema = SCHEMA;
        draft.revision = state.revision + 1;
        return replaceState(draft, true);
      },

      replace: function (candidate) {
        if (typeof candidate === 'string') {
          return replaceState(parseImport(candidate), false);
        }
        return replaceState(candidate, false);
      },

      exportState: function () {
        return canonicalJson(state);
      },

      importState: function (serialized) {
        return replaceState(parseImport(serialized), false);
      },

      reset: function () {
        var next = initialState();
        durablyReset(next);
        state = next;
        return clone(state);
      },

      storageMode: function () {
        return mode;
      }
    });
  }

  return Object.freeze({
    schema: SCHEMA,
    createStore: createStore
  });
}));
