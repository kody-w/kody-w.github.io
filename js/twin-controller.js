(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.KodyTwinController = api;
  }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var VERSION = '1.0.0';
  var MAX_TEXT_LENGTH = 500;
  var MAX_IMPORT_LENGTH = 1024 * 1024;
  var MAX_MISSION_STEPS = 100;
  var SOURCE_TYPES = ['post', 'field_note', 'work'];
  var MODES = ['answer', 'evolution', 'challenge'];
  var ACTION_NAMES = [
    'corpus.status',
    'search.query',
    'answer.ask',
    'evolution.compare',
    'challenge.run',
    'sources.get',
    'citation.open',
    'citation.pin',
    'state.get',
    'state.export',
    'state.import',
    'state.reset',
    'ui.setMode',
    'prompt.get',
    'prompt.build',
    'prompt.copy'
  ];
  var FORBIDDEN_KEYS = Object.create(null);
  [
    'x',
    'y',
    'selector',
    'xpath',
    'coordinate',
    'coordinates',
    'clientx',
    'clienty',
    'pagex',
    'pagey',
    'screenx',
    'screeny',
    'offsetx',
    'offsety',
    'javascript',
    'script',
    'code',
    'callback',
    'handler',
    'function',
    'executable',
    'domnode',
    'element',
    'event',
    '__proto__',
    'prototype',
    'constructor'
  ].forEach(function (key) {
    FORBIDDEN_KEYS[key] = true;
  });

  var CAPABILITIES = {
    version: VERSION,
    apiVersion: '1.0',
    interface: 'kody-twin-controller/1.0',
    jsonOnly: true,
    missionRunner: {
      ordered: true,
      defaultStopOnError: true,
      maximumSteps: MAX_MISSION_STEPS
    },
    actions: [
      {
        name: 'corpus.status',
        description: 'Report the loaded public corpus status and statistics.',
        input: { required: [], optional: [] },
        inputSchema: noInputSchema(),
        mutatesState: false
      },
      {
        name: 'search.query',
        description: 'Search the public corpus for exact evidence.',
        input: { required: ['query'], optional: ['limit', 'sourceTypes'] },
        inputSchema: queryInputSchema('query'),
        mutatesState: true
      },
      {
        name: 'answer.ask',
        description: 'Answer a question using only cited public evidence.',
        input: { required: ['question'], optional: ['limit', 'sourceTypes'] },
        inputSchema: queryInputSchema('question'),
        mutatesState: true
      },
      {
        name: 'evolution.compare',
        description: 'Compare cited evidence across declared source times.',
        input: { required: ['question'], optional: ['limit', 'sourceTypes'] },
        inputSchema: queryInputSchema('question'),
        mutatesState: true
      },
      {
        name: 'challenge.run',
        description: 'Find explicit qualifying or counterevidence for a question.',
        input: { required: ['question'], optional: ['limit', 'sourceTypes'] },
        inputSchema: queryInputSchema('question'),
        mutatesState: true
      },
      {
        name: 'sources.get',
        description: 'Resolve one or more public source records by citation or identifier.',
        input: {
          requiredOneOf: ['sourceId', 'sourceIds', 'citations'],
          optional: []
        },
        inputSchema: sourcesInputSchema(),
        mutatesState: false
      },
      {
        name: 'citation.open',
        description: 'Validate a citation and open its source through the view adapter.',
        input: { required: ['citation'], optional: [] },
        inputSchema: citationInputSchema(),
        mutatesState: false
      },
      {
        name: 'citation.pin',
        description: 'Validate and save a citation in local twin state.',
        input: { required: ['citation'], optional: [] },
        inputSchema: citationInputSchema(),
        mutatesState: true
      },
      {
        name: 'state.get',
        description: 'Read the current JSON-only twin state.',
        input: { required: [], optional: [] },
        inputSchema: noInputSchema(),
        mutatesState: false
      },
      {
        name: 'state.export',
        description: 'Export the current twin state as deterministic JSON.',
        input: { required: [], optional: [] },
        inputSchema: noInputSchema(),
        mutatesState: false
      },
      {
        name: 'state.import',
        description: 'Replace twin state from a validated deterministic JSON export.',
        input: { required: ['serialized'], optional: [] },
        inputSchema: objectInputSchema(
          ['serialized'],
          { serialized: { type: 'string', minLength: 1, maxLength: MAX_IMPORT_LENGTH } }
        ),
        mutatesState: true
      },
      {
        name: 'state.reset',
        description: 'Reset twin state to its deterministic initial value.',
        input: { required: [], optional: [] },
        inputSchema: noInputSchema(),
        mutatesState: true
      },
      {
        name: 'ui.setMode',
        description: 'Set the active semantic investigation mode.',
        input: { required: ['mode'], optional: [] },
        inputSchema: objectInputSchema(
          ['mode'],
          { mode: { type: 'string', enum: MODES.slice() } }
        ),
        mutatesState: true
      },
      {
        name: 'prompt.get',
        description: 'Read the canonical one-sentence product prompt.',
        input: { required: [], optional: [] },
        inputSchema: noInputSchema(),
        mutatesState: false
      },
      {
        name: 'prompt.build',
        description: 'Replace the prompt placeholder with one validated app idea.',
        input: { required: ['app'], optional: [] },
        inputSchema: promptInputSchema(),
        mutatesState: false
      },
      {
        name: 'prompt.copy',
        description: 'Build and copy the canonical prompt through the injected copier.',
        input: { required: ['app'], optional: [] },
        inputSchema: promptInputSchema(),
        mutatesState: false
      }
    ]
  };

  function createController(dependencies) {
    dependencies = dependencies || {};
    var engine = dependencies.engine;
    var store = dependencies.store;
    var view = dependencies.view || {};
    var prompt = dependencies.prompt;
    var copyText = dependencies.copyText;
    var corpusSha256 = typeof dependencies.corpusSha256 === 'string'
      ? dependencies.corpusSha256
      : '';
    var activeResultId = null;

    requireMethod(engine, 'stats', 'engine');
    requireMethod(engine, 'search', 'engine');
    requireMethod(engine, 'answer', 'engine');
    requireMethod(engine, 'evolution', 'engine');
    requireMethod(engine, 'challenge', 'engine');
    requireMethod(engine, 'validateCitation', 'engine');
    requireMethod(store, 'get', 'store');
    requireMethod(store, 'update', 'store');
    requireMethod(store, 'exportState', 'store');
    requireMethod(store, 'importState', 'store');
    requireMethod(store, 'reset', 'store');
    if (typeof prompt !== 'string' || countPlaceholder(prompt) !== 1) {
      throw new TypeError('prompt must contain exactly one {APP} placeholder');
    }
    if (typeof copyText !== 'function') {
      throw new TypeError('copyText must be a function');
    }

    function capabilities() {
      return cloneJson(CAPABILITIES);
    }

    function inspect() {
      var corpus;
      var state;
      try {
        corpus = cloneJson(engine.stats());
      } catch (error) {
        corpus = { error: errorMessage(error) };
      }
      try {
        state = cloneJson(store.get());
      } catch (error) {
        state = { error: errorMessage(error) };
      }
      var preferences = state && isPlainObject(state.preferences)
        ? state.preferences
        : {};
      return {
        version: VERSION,
        apiVersion: '1.0',
        ready: true,
        route: '/twin/',
        mode: MODES.indexOf(preferences.mode) !== -1 ? preferences.mode : 'answer',
        corpusSha256: corpusSha256,
        corpus: corpus,
        state: state,
        storageMode: storageMode(),
        stateRevision: state && Number.isInteger(state.revision) ? state.revision : 0,
        activeResultId: activeResultId,
        controls: ACTION_NAMES.map(function (action) {
          return { action: action, enabled: true };
        }),
        prompt: {
          available: true,
          placeholderCount: countPlaceholder(prompt)
        },
        actions: ACTION_NAMES.slice()
      };
    }

    async function dispatch(action, input) {
      var started = now();
      if (typeof action !== 'string' || ACTION_NAMES.indexOf(action) === -1) {
        return failure(
          typeof action === 'string' ? action : 'invalid',
          'UNKNOWN_ACTION',
          'Unknown semantic action.',
          false
        );
      }

      try {
        validateInput(action, input);
        var data = await execute(action, input);
        return success(action, data, started);
      } catch (error) {
        return failure(
          action,
          error && error.code ? error.code : 'ACTION_FAILED',
          errorMessage(error),
          Boolean(error && error.retryable)
        );
      }
    }

    async function execute(action, input) {
      var value;
      var options;
      var snapshot;
      switch (action) {
        case 'corpus.status':
          return {
            status: 'ready',
            stats: jsonResult(engine.stats()),
            corpusSha256: corpusSha256
          };

        case 'search.query':
          options = queryOptions(input);
          value = jsonResult(engine.search(input.query, options));
          render(action, value);
          recordActivity(action, input.query, value);
          setActiveResult(action, value);
          return value;

        case 'answer.ask':
          options = queryOptions(input);
          value = jsonResult(engine.answer(input.question, options));
          render(action, value);
          recordActivity(action, input.question, value, true);
          setActiveResult(action, value);
          return value;

        case 'evolution.compare':
          options = queryOptions(input);
          value = jsonResult(engine.evolution(input.question, options));
          render(action, value);
          recordActivity(action, input.question, value);
          setActiveResult(action, value);
          return value;

        case 'challenge.run':
          options = queryOptions(input);
          value = jsonResult(engine.challenge(input.question, options));
          render(action, value);
          recordActivity(action, input.question, value, true);
          setActiveResult(action, value);
          return value;

        case 'sources.get':
          value = getSources(input);
          render(action, value);
          return value;

        case 'citation.open':
          assertValidCitation(input.citation);
          value = sourceForCitation(input.citation);
          if (typeof view.openSource === 'function') {
            try {
              view.openSource({
                source: cloneJson(value),
                citation: cloneJson(input.citation)
              });
            } catch (error) {
              throw viewError('open the citation source');
            }
          }
          return {
            opened: true,
            citation: cloneJson(input.citation),
            source: cloneJson(value)
          };

        case 'citation.pin':
          assertValidCitation(input.citation);
          value = {
            pinned: !hasPinnedCitation(input.citation),
            citation: cloneJson(input.citation)
          };
          render(action, value);
          if (value.pinned) {
            pinCitation(input.citation);
          }
          return value;

        case 'state.get':
          return {
            state: cloneJson(store.get()),
            storageMode: storageMode()
          };

        case 'state.export':
          return {
            serialized: exportedState(),
            storageMode: storageMode()
          };

        case 'state.import':
          snapshot = stateSnapshot();
          try {
            store.importState(input.serialized);
          } catch (error) {
            restoreStateSnapshot(snapshot);
            throw controllerError(
              'INVALID_INPUT',
              'serialized is not a valid supported state export.',
              false
            );
          }
          try {
            value = {
              state: cloneJson(store.get()),
              serialized: exportedState(),
              storageMode: storageMode()
            };
            activeResultId = null;
            render(action, value);
            return value;
          } catch (error) {
            restoreStateSnapshot(snapshot);
            throw error;
          }

        case 'state.reset':
          snapshot = stateSnapshot();
          try {
            store.reset();
            value = {
              state: cloneJson(store.get()),
              serialized: exportedState(),
              storageMode: storageMode()
            };
            activeResultId = null;
            render(action, value);
            return value;
          } catch (error) {
            restoreStateSnapshot(snapshot);
            throw error;
          }

        case 'ui.setMode':
          snapshot = stateSnapshot();
          try {
            setMode(input.mode);
          } catch (error) {
            restoreStateSnapshot(snapshot);
            throw error;
          }
          if (typeof view.setMode === 'function') {
            try {
              view.setMode(input.mode);
            } catch (error) {
              restoreStateSnapshot(snapshot);
              throw viewError('set the semantic mode');
            }
          }
          return { mode: input.mode };

        case 'prompt.get':
          return { prompt: prompt };

        case 'prompt.build':
          return { prompt: buildPrompt(input.app) };

        case 'prompt.copy':
          value = buildPrompt(input.app);
          if (await copyText(value) === false) {
            throw controllerError('COPY_FAILED', 'The prompt could not be copied.', true);
          }
          return { copied: true, prompt: value };

        default:
          throw controllerError('UNKNOWN_ACTION', 'Unknown semantic action.', false);
      }
    }

    async function runMission(input) {
      var started = now();
      try {
        validateMission(input);
      } catch (error) {
        return failure(
          'runMission',
          error && error.code ? error.code : 'INVALID_INPUT',
          errorMessage(error),
          false
        );
      }

      var stopOnError = input.stopOnError !== false;
      var steps = [];
      var failed = false;
      for (var index = 0; index < input.steps.length; index += 1) {
        var declared = input.steps[index];
        var result = await dispatch(declared.action, declared.input);
        var trace = {
          index: index,
          action: declared.action,
          ok: result.ok
        };
        if (result.ok) {
          trace.data = result.data;
          trace.meta = result.meta;
        } else {
          trace.error = result.error;
          failed = true;
        }
        steps.push(trace);
        if (failed && stopOnError) {
          break;
        }
      }

      var data = {
        status: failed ? 'failed' : 'completed',
        completedSteps: steps.filter(function (step) { return step.ok; }).length,
        declaredSteps: input.steps.length,
        stoppedOnError: failed && stopOnError,
        steps: steps
      };
      if (failed) {
        var missionFailure = failure(
          'runMission',
          'MISSION_FAILED',
          'The mission did not complete successfully.',
          false
        );
        missionFailure.data = data;
        return missionFailure;
      }
      return success('runMission', data, started);
    }

    async function selfTest() {
      var started = now();
      var checks = [];
      var snapshot;

      try {
        var actionCapabilities = capabilities();
        var names = actionCapabilities.actions.map(function (action) {
          return action.name;
        });
        var missing = ACTION_NAMES.filter(function (name) {
          return names.indexOf(name) === -1;
        });
        var inspectable = actionCapabilities.actions.filter(function (action) {
          return typeof action.description === 'string' &&
            action.description.length > 0 &&
            isPlainObject(action.inputSchema) &&
            typeof action.mutatesState === 'boolean';
        }).length;
        checks.push({
          name: 'capabilities',
          passed: actionCapabilities.apiVersion === '1.0' &&
            missing.length === 0 &&
            names.length === ACTION_NAMES.length &&
            inspectable === ACTION_NAMES.length,
          evidence: {
            apiVersion: actionCapabilities.apiVersion,
            declaredActions: names.length,
            requiredActions: ACTION_NAMES.length,
            inspectableActions: inspectable,
            missing: missing
          }
        });
      } catch (error) {
        checks.push(failedCheck('capabilities', error));
      }

      try {
        snapshot = exportedState();
        store.importState(snapshot);
        var roundTrip = exportedState();
        checks.push({
          name: 'state-export-import',
          passed: roundTrip === snapshot,
          evidence: {
            byteLength: snapshot.length,
            byteExact: roundTrip === snapshot,
            storageMode: storageMode()
          }
        });
      } catch (error) {
        checks.push(failedCheck('state-export-import', error));
      }

      try {
        var candidate = citationCandidate();
        var validation = candidate
          ? jsonResult(engine.validateCitation(cloneJson(candidate)))
          : { ok: false, reason: 'No citation candidate was produced.' };
        checks.push({
          name: 'engine-citation-validation',
          passed: Boolean(candidate) && citationValidationPassed(validation),
          evidence: {
            candidateFound: Boolean(candidate),
            sourceId: candidate && candidate.sourceId ? candidate.sourceId : null,
            validation: validation
          }
        });
      } catch (error) {
        checks.push(failedCheck('engine-citation-validation', error));
      }

      try {
        var probe = 'self-test semantic app';
        var built = buildPrompt(probe);
        var expected = prompt.replace('{APP}', probe);
        checks.push({
          name: 'prompt-contract',
          passed: countPlaceholder(prompt) === 1 &&
            built === expected &&
            built.indexOf('{APP}') === -1,
          evidence: {
            placeholderCount: countPlaceholder(prompt),
            exactReplacement: built === expected,
            sourceLength: prompt.length,
            builtLength: built.length
          }
        });
      } catch (error) {
        checks.push(failedCheck('prompt-contract', error));
      }

      return success('selfTest', {
        passed: checks.every(function (check) { return check.passed; }),
        checks: checks
      }, started);
    }

    function getSources(input) {
      var sourceIds = [];
      if (input && typeof input.sourceId === 'string') {
        sourceIds.push(input.sourceId);
      } else if (input && Array.isArray(input.sourceIds)) {
        sourceIds = input.sourceIds.slice();
      } else if (input && Array.isArray(input.citations)) {
        sourceIds = input.citations.map(function (citation) {
          assertValidCitation(citation);
          return citation.sourceId;
        });
      }
      sourceIds = uniqueStrings(sourceIds);

      var sources;
      if (typeof engine.getSources === 'function') {
        sources = engine.getSources(sourceIds.length ? sourceIds : undefined);
      } else if (typeof engine.sources === 'function') {
        sources = engine.sources(sourceIds.length ? sourceIds : undefined);
      } else if (sourceIds.length && typeof engine.getSource === 'function') {
        sources = sourceIds.map(function (sourceId) {
          return engine.getSource(sourceId);
        });
      } else if (sourceIds.length && typeof engine.source === 'function') {
        sources = sourceIds.map(function (sourceId) {
          return engine.source(sourceId);
        });
      } else {
        throw controllerError(
          'DEPENDENCY_ERROR',
          'The engine does not expose a source lookup method.',
          false
        );
      }

      if (sources && !Array.isArray(sources) && Array.isArray(sources.sources)) {
        sources = sources.sources;
      }
      if (!Array.isArray(sources)) {
        sources = sources == null ? [] : [sources];
      }
      return { sources: jsonResult(sources).filter(Boolean) };
    }

    function sourceForCitation(citation) {
      var source;
      if (typeof engine.getSource === 'function') {
        source = engine.getSource(citation.sourceId);
      } else if (typeof engine.source === 'function') {
        source = engine.source(citation.sourceId);
      } else if (typeof engine.getSources === 'function') {
        source = engine.getSources([citation.sourceId]);
      } else if (typeof engine.sources === 'function') {
        source = engine.sources([citation.sourceId]);
      }
      if (source && Array.isArray(source.sources)) {
        source = source.sources[0];
      } else if (Array.isArray(source)) {
        source = source[0];
      }
      return source || {
        sourceId: citation.sourceId,
        citation: cloneJson(citation)
      };
    }

    function assertValidCitation(citation) {
      var validation = jsonResult(engine.validateCitation(cloneJson(citation)));
      if (!citationValidationPassed(validation)) {
        throw controllerError(
          'INVALID_CITATION',
          validation.message || validation.reason || 'Citation validation failed.',
          false
        );
      }
    }

    function pinCitation(citation) {
      if (hasPinnedCitation(citation)) {
        return false;
      }
      store.update(function (state) {
        if (!Array.isArray(state.pinnedCitations)) {
          state.pinnedCitations = [];
        }
        state.pinnedCitations.push(cloneJson(citation));
      });
      return true;
    }

    function hasPinnedCitation(citation) {
      var serialized = stableStringify(citation);
      var current = store.get();
      var pinned = Array.isArray(current.pinnedCitations)
        ? current.pinnedCitations
        : [];
      return pinned.some(function (item) {
        return stableStringify(item) === serialized;
      });
    }

    function recordActivity(action, text, result, save) {
      store.update(function (state) {
        if (!Array.isArray(state.history)) {
          state.history = [];
        }
        state.history.push({
          action: action,
          input: text,
          status: result && typeof result.status === 'string'
            ? result.status
            : 'completed'
        });
        if (save) {
          if (!Array.isArray(state.savedQuestions)) {
            state.savedQuestions = [];
          }
          if (!state.savedQuestions.some(function (item) {
            return item && item.question === text;
          })) {
            state.savedQuestions.push({ question: text });
          }
        }
      });
    }

    function setMode(mode) {
      var current = store.get();
      if (current.preferences && current.preferences.mode === mode) {
        return;
      }
      store.update(function (state) {
        if (!state.preferences || !isPlainObject(state.preferences)) {
          state.preferences = {};
        }
        state.preferences.mode = mode;
      });
    }

    function render(action, data) {
      if (typeof view.render !== 'function') {
        return;
      }
      try {
        view.render(cloneJson(data), action);
      } catch (error) {
        throw viewError('render ' + action);
      }
    }

    function setActiveResult(action, result) {
      activeResultId = result && typeof result.id === 'string' && result.id
        ? result.id
        : action + ':' + stateRevision();
    }

    function stateSnapshot() {
      return {
        serialized: exportedState(),
        activeResultId: activeResultId
      };
    }

    function restoreStateSnapshot(snapshot) {
      try {
        store.importState(snapshot.serialized);
      } catch (error) {
        // Preserve the original action error.
      }
      activeResultId = snapshot.activeResultId;
    }

    function storageMode() {
      if (typeof store.storageMode !== 'function') {
        return 'memory';
      }
      var mode = store.storageMode();
      return typeof mode === 'string' ? mode : 'memory';
    }

    function exportedState() {
      var serialized = store.exportState();
      if (typeof serialized !== 'string') {
        throw controllerError(
          'DEPENDENCY_ERROR',
          'The state store returned a non-string export.',
          false
        );
      }
      return serialized;
    }

    function buildPrompt(app) {
      return prompt.replace('{APP}', app);
    }

    function citationCandidate() {
      var result = engine.answer('source truth');
      var candidate = findCitation(result);
      if (candidate) {
        return candidate;
      }
      return findCitation(engine.search('source truth', { limit: 5 }));
    }

    function success(action, data, started) {
      return {
        ok: true,
        action: action,
        data: jsonResult(data),
        meta: {
          corpusSha256: corpusSha256,
          stateRevision: stateRevision(),
          durationMs: durationSince(started)
        }
      };
    }

    function stateRevision() {
      try {
        var state = store.get();
        return Number.isInteger(state.revision) && state.revision >= 0
          ? state.revision
          : 0;
      } catch (error) {
        return 0;
      }
    }

    return Object.freeze({
      version: VERSION,
      capabilities: capabilities,
      inspect: inspect,
      dispatch: dispatch,
      runMission: runMission,
      selfTest: selfTest
    });
  }

  function noInputSchema() {
    return objectInputSchema([], {});
  }

  function queryInputSchema(field) {
    var properties = {
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      sourceTypes: {
        type: 'array',
        minItems: 1,
        maxItems: SOURCE_TYPES.length,
        uniqueItems: true,
        items: { type: 'string', enum: SOURCE_TYPES.slice() }
      }
    };
    properties[field] = {
      type: 'string',
      minLength: 1,
      maxLength: MAX_TEXT_LENGTH
    };
    return objectInputSchema([field], properties);
  }

  function citationInputSchema() {
    return objectInputSchema(
      ['citation'],
      { citation: { type: 'object' } }
    );
  }

  function sourcesInputSchema() {
    var schema = objectInputSchema([], {
      sourceId: { type: 'string', minLength: 1, maxLength: 500 },
      sourceIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        uniqueItems: true,
        items: { type: 'string', minLength: 1, maxLength: 500 }
      },
      citations: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'object' }
      }
    });
    schema.oneOf = [
      { required: ['sourceId'] },
      { required: ['sourceIds'] },
      { required: ['citations'] }
    ];
    return schema;
  }

  function promptInputSchema() {
    return objectInputSchema(
      ['app'],
      { app: { type: 'string', minLength: 1, maxLength: 500 } }
    );
  }

  function objectInputSchema(required, properties) {
    return {
      type: 'object',
      required: required.slice(),
      additionalProperties: false,
      properties: properties
    };
  }

  function validateInput(action, input) {
    assertSafeJson(input);
    switch (action) {
      case 'corpus.status':
      case 'state.get':
      case 'state.export':
      case 'state.reset':
      case 'prompt.get':
        validateNoInput(input);
        return;
      case 'search.query':
        validateQueryInput(input, 'query');
        return;
      case 'answer.ask':
      case 'evolution.compare':
      case 'challenge.run':
        validateQueryInput(input, 'question');
        return;
      case 'sources.get':
        validateSourcesInput(input);
        return;
      case 'citation.open':
      case 'citation.pin':
        validateObject(input, ['citation'], []);
        if (!isPlainObject(input.citation)) {
          invalidInput('citation must be a plain JSON object.');
        }
        return;
      case 'state.import':
        validateObject(input, ['serialized'], []);
        if (typeof input.serialized !== 'string' || !input.serialized.length) {
          invalidInput('serialized must be a non-empty string.');
        }
        if (input.serialized.length > MAX_IMPORT_LENGTH) {
          invalidInput('serialized exceeds the import size limit.');
        }
        return;
      case 'ui.setMode':
        validateObject(input, ['mode'], []);
        if (MODES.indexOf(input.mode) === -1) {
          invalidInput('mode is not supported.');
        }
        return;
      case 'prompt.build':
      case 'prompt.copy':
        validateObject(input, ['app'], []);
        validateText(input.app, 'app', 500);
        if (input.app.indexOf('\n') !== -1 || input.app.indexOf('\r') !== -1) {
          invalidInput('app must be a single line.');
        }
        if (input.app.indexOf('{APP}') !== -1) {
          invalidInput('app must not contain the prompt placeholder.');
        }
        return;
      default:
        invalidInput('Unsupported input.');
    }
  }

  function validateMission(input) {
    assertSafeJson(input);
    validateObject(input, ['steps'], ['stopOnError']);
    if (!Array.isArray(input.steps) || input.steps.length === 0) {
      invalidInput('steps must be a non-empty array.');
    }
    if (input.steps.length > MAX_MISSION_STEPS) {
      invalidInput('steps exceeds the mission step limit.');
    }
    if (
      Object.prototype.hasOwnProperty.call(input, 'stopOnError') &&
      typeof input.stopOnError !== 'boolean'
    ) {
      invalidInput('stopOnError must be a boolean.');
    }
    input.steps.forEach(function (step) {
      validateObject(step, ['action'], ['input']);
      if (typeof step.action !== 'string' || !step.action.length) {
        invalidInput('Every mission step must declare an action.');
      }
      if (step.action === 'runMission' || step.action === 'selfTest') {
        invalidInput('Missions cannot recursively invoke controller methods.');
      }
    });
  }

  function validateQueryInput(input, field) {
    validateObject(input, [field], ['limit', 'sourceTypes']);
    validateText(input[field], field, MAX_TEXT_LENGTH);
    if (Object.prototype.hasOwnProperty.call(input, 'limit')) {
      if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) {
        invalidInput('limit must be an integer from 1 through 100.');
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, 'sourceTypes')) {
      if (
        !Array.isArray(input.sourceTypes) ||
        input.sourceTypes.length === 0 ||
        input.sourceTypes.length > SOURCE_TYPES.length
      ) {
        invalidInput('sourceTypes must be a non-empty array.');
      }
      var unique = uniqueStrings(input.sourceTypes);
      if (
        unique.length !== input.sourceTypes.length ||
        unique.some(function (sourceType) {
          return SOURCE_TYPES.indexOf(sourceType) === -1;
        })
      ) {
        invalidInput('sourceTypes contains an unsupported or duplicate value.');
      }
    }
  }

  function validateSourcesInput(input) {
    validateObject(input, [], ['sourceId', 'sourceIds', 'citations']);
    var declared = ['sourceId', 'sourceIds', 'citations'].filter(function (key) {
      return Object.prototype.hasOwnProperty.call(input, key);
    });
    if (declared.length > 1) {
      invalidInput('Declare only one source lookup form.');
    }
    if (declared.length !== 1) {
      invalidInput('Declare exactly one source lookup form.');
    }
    if (declared[0] === 'sourceId') {
      validateText(input.sourceId, 'sourceId', 500);
      return;
    }
    var values = input[declared[0]];
    if (!Array.isArray(values) || values.length === 0 || values.length > 100) {
      invalidInput(declared[0] + ' must be a non-empty array with at most 100 items.');
    }
    if (declared[0] === 'sourceIds') {
      values.forEach(function (sourceId) {
        validateText(sourceId, 'sourceId', 500);
      });
      if (uniqueStrings(values).length !== values.length) {
        invalidInput('sourceIds must not contain duplicates.');
      }
    } else {
      values.forEach(function (citation) {
        if (!isPlainObject(citation)) {
          invalidInput('Every citation must be a plain JSON object.');
        }
      });
    }
  }

  function validateNoInput(input) {
    if (input === undefined || input === null) {
      return;
    }
    if (!isPlainObject(input) || Object.keys(input).length !== 0) {
      invalidInput('This action does not accept input.');
    }
  }

  function validateObject(input, required, optional) {
    if (!isPlainObject(input)) {
      invalidInput('Input must be a plain JSON object.');
    }
    var allowed = required.concat(optional);
    var keys = Object.keys(input);
    required.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) {
        invalidInput('Missing required input: ' + key + '.');
      }
    });
    keys.forEach(function (key) {
      if (allowed.indexOf(key) === -1) {
        invalidInput('Unknown input field: ' + key + '.');
      }
    });
  }

  function validateText(value, name, maximum) {
    if (
      typeof value !== 'string' ||
      !value.length ||
      value !== value.trim() ||
      value.length > maximum
    ) {
      invalidInput(name + ' must be a non-empty trimmed string.');
    }
  }

  function assertSafeJson(value, seen) {
    if (value === undefined || value === null) {
      return;
    }
    var type = typeof value;
    if (type === 'string') {
      if (/^\s*javascript\s*:/i.test(value)) {
        invalidInput('Executable input is not accepted.');
      }
      return;
    }
    if (type === 'number') {
      if (!Number.isFinite(value)) {
        invalidInput('Input numbers must be finite.');
      }
      return;
    }
    if (type === 'boolean') {
      return;
    }
    if (type !== 'object') {
      invalidInput('Input must be JSON-serializable data.');
    }

    seen = seen || [];
    if (seen.indexOf(value) !== -1) {
      invalidInput('Cyclic input is not accepted.');
    }
    seen.push(value);

    if (!Array.isArray(value) && !isPlainObject(value)) {
      invalidInput('DOM nodes, events, and class instances are not accepted.');
    }
    if (Object.getOwnPropertySymbols(value).length) {
      invalidInput('Symbol properties are not accepted.');
    }
    var descriptors = Object.getOwnPropertyDescriptors(value);
    Object.keys(descriptors).forEach(function (key) {
      if (Array.isArray(value) && key === 'length') {
        return;
      }
      var normalized = key.toLowerCase().replace(/[-_\s]/g, '');
      if (FORBIDDEN_KEYS[normalized]) {
        invalidInput('Control-shaped input is not accepted.');
      }
      if (!Object.prototype.hasOwnProperty.call(descriptors[key], 'value')) {
        invalidInput('Accessor properties are not accepted.');
      }
      assertSafeJson(descriptors[key].value, seen);
    });
    seen.pop();
  }

  function queryOptions(input) {
    var options = {};
    if (Object.prototype.hasOwnProperty.call(input, 'limit')) {
      options.limit = input.limit;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'sourceTypes')) {
      options.sourceTypes = input.sourceTypes.slice();
    }
    return options;
  }

  function findCitation(value, seen) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    seen = seen || [];
    if (seen.indexOf(value) !== -1) {
      return null;
    }
    seen.push(value);
    if (
      typeof value.sourceId === 'string' &&
      value.locator &&
      typeof value.locator === 'object'
    ) {
      return cloneJson(value);
    }
    var keys = Object.keys(value);
    for (var index = 0; index < keys.length; index += 1) {
      var candidate = findCitation(value[keys[index]], seen);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  function citationValidationPassed(validation) {
    return validation === true || Boolean(validation && validation.ok === true);
  }

  function failedCheck(name, error) {
    return {
      name: name,
      passed: false,
      evidence: {
        error: errorMessage(error),
        code: error && error.code ? error.code : 'SELF_TEST_ERROR'
      }
    };
  }

  function jsonResult(value) {
    try {
      return cloneJson(value);
    } catch (error) {
      throw controllerError(
        'DEPENDENCY_ERROR',
        'A dependency returned data that is not JSON-serializable.',
        false
      );
    }
  }

  function cloneJson(value) {
    if (value === undefined) {
      return null;
    }
    assertSafeOutput(value, []);
    return JSON.parse(JSON.stringify(value));
  }

  function assertSafeOutput(value, seen) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      return;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError('Output numbers must be finite.');
      }
      return;
    }
    if (typeof value !== 'object') {
      throw new TypeError('Output must contain JSON data only.');
    }
    if (seen.indexOf(value) !== -1) {
      throw new TypeError('Output must not contain cycles.');
    }
    seen.push(value);
    if (!Array.isArray(value) && !isPlainObject(value)) {
      throw new TypeError('Output must not contain class instances or DOM data.');
    }
    if (Object.getOwnPropertySymbols(value).length) {
      throw new TypeError('Output must not contain symbol properties.');
    }
    var descriptors = Object.getOwnPropertyDescriptors(value);
    Object.keys(descriptors).forEach(function (key) {
      if (Array.isArray(value) && key === 'length') {
        return;
      }
      var normalized = key.toLowerCase().replace(/[-_\s]/g, '');
      if (FORBIDDEN_KEYS[normalized]) {
        throw new TypeError('Output must not contain control-shaped fields.');
      }
      if (!Object.prototype.hasOwnProperty.call(descriptors[key], 'value')) {
        throw new TypeError('Output must not contain accessor properties.');
      }
      assertSafeOutput(descriptors[key].value, seen);
    });
    seen.pop();
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return '[' + value.map(stableStringify).join(',') + ']';
    }
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + stableStringify(value[key]);
    }).join(',') + '}';
  }

  function uniqueStrings(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      if (typeof value !== 'string' || seen[value]) {
        return false;
      }
      seen[value] = true;
      return true;
    });
  }

  function countPlaceholder(prompt) {
    return prompt.split('{APP}').length - 1;
  }

  function requireMethod(value, method, name) {
    if (!value || typeof value[method] !== 'function') {
      throw new TypeError(name + '.' + method + ' must be a function');
    }
  }

  function isPlainObject(value) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function controllerError(code, message, retryable) {
    var error = new Error(message);
    error.code = code;
    error.retryable = Boolean(retryable);
    return error;
  }

  function viewError(effect) {
    return controllerError(
      'VIEW_ERROR',
      'The view adapter could not ' + effect + '.',
      false
    );
  }

  function invalidInput(message) {
    throw controllerError('INVALID_INPUT', message, false);
  }

  function failure(action, code, message, retryable) {
    return {
      ok: false,
      action: action,
      error: {
        code: code,
        message: message,
        retryable: Boolean(retryable)
      }
    };
  }

  function errorMessage(error) {
    return error && typeof error.message === 'string'
      ? error.message
      : 'The action failed.';
  }

  function now() {
    if (
      typeof performance !== 'undefined' &&
      performance &&
      typeof performance.now === 'function'
    ) {
      return performance.now();
    }
    return Date.now();
  }

  function durationSince(started) {
    var duration = now() - started;
    if (!Number.isFinite(duration) || duration < 0) {
      return 0;
    }
    return Math.round(duration * 1000) / 1000;
  }

  return Object.freeze({
    createController: createController
  });
}));
