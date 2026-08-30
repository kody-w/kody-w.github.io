(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.KodyEvidenceTribunalCore = api;
  }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var VERSION = '1.0.0';
  var SCHEMA = 'kodyw-public-evidence-tribunal/1.0';
  var RECEIPT_SCHEMA = 'kodyw-frame-06-receipt/1.0';
  var RELEASE_SCHEMA = 'kodyw-twin-release-binding/1.0';
  var MAX_QUESTION_LENGTH = 500;
  var SHA256 = /^[0-9a-f]{64}$/;
  var RECEIPT_IDENTITY = Object.freeze({
    frame: '06',
    surface: '/public-twin/tribunal/',
    topic: "Kody's local-first product philosophy",
    question: 'What is the source of truth?',
    generator: 'scripts/build_frame_06_evidence_tribunal.js'
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonicalStringify(value) {
    if (value === null || typeof value === 'string' ||
        typeof value === 'boolean') {
      return JSON.stringify(value);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError('Canonical JSON requires finite numbers.');
      }
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return '[' + value.map(canonicalStringify).join(',') + ']';
    }
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      throw new TypeError('Canonical JSON accepts JSON values only.');
    }
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + canonicalStringify(value[key]);
    }).join(',') + '}';
  }

  function hasExactKeys(value, expected) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    var actual = Object.keys(value).sort();
    var sortedExpected = expected.slice().sort();
    return actual.length === sortedExpected.length &&
      actual.every(function (key, index) {
        return key === sortedExpected[index];
      });
  }

  function requireMethod(target, name) {
    if (!target || typeof target[name] !== 'function') {
      throw new TypeError('engine.' + name + ' must be a function');
    }
  }

  function normalizeQuestion(question) {
    if (typeof question !== 'string') {
      return '';
    }
    return question.trim().replace(/\s+/g, ' ').slice(0, MAX_QUESTION_LENGTH);
  }

  function citationKey(citation) {
    var locator = citation.locator.kind === 'text'
      ? citation.locator.start + ':' + citation.locator.end
      : citation.locator.pointer;
    return citation.sourceId + '|' + locator;
  }

  function createTribunal(engine) {
    ['stats', 'answer', 'evolution', 'challenge', 'validateCitation']
      .forEach(function (name) {
        requireMethod(engine, name);
      });

    function exactFact(item, role) {
      if (!item || !item.citation ||
          engine.validateCitation(item.citation).ok !== true) {
        throw new Error('The twin engine returned an invalid citation.');
      }
      return {
        kind: 'fact',
        role: role,
        evidence: clone(item.evidence),
        citation: clone(item.citation)
      };
    }

    function inference(statement, facts) {
      return {
        kind: 'inference',
        statement: statement,
        supportedBy: facts.map(function (fact) {
          return citationKey(fact.citation);
        })
      };
    }

    async function verifyReceipt(receipt, binding, sha256) {
      var topLevelKeys = [
        'schema',
        'frame',
        'surface',
        'topic',
        'question',
        'generator',
        'twinRelease',
        'result',
        'receiptSha256'
      ];
      if (!hasExactKeys(receipt, topLevelKeys) ||
          receipt.schema !== RECEIPT_SCHEMA) {
        return { ok: false, code: 'INVALID_RECEIPT_SCHEMA' };
      }
      var identityKeys = Object.keys(RECEIPT_IDENTITY);
      for (var identityIndex = 0;
           identityIndex < identityKeys.length;
           identityIndex += 1) {
        var identityKey = identityKeys[identityIndex];
        if (receipt[identityKey] !== RECEIPT_IDENTITY[identityKey]) {
          return { ok: false, code: 'INVALID_RECEIPT_IDENTITY' };
        }
      }
      var bindingKeys = [
        'releaseSha256',
        'sourceManifestSha256',
        'corpusSha256'
      ];
      if (!binding || !hasExactKeys(binding, bindingKeys)) {
        return { ok: false, code: 'INVALID_RELEASE_BINDING' };
      }
      for (var bindingIndex = 0;
           bindingIndex < bindingKeys.length;
           bindingIndex += 1) {
        if (typeof binding[bindingKeys[bindingIndex]] !== 'string' ||
            !SHA256.test(binding[bindingKeys[bindingIndex]])) {
          return { ok: false, code: 'INVALID_RELEASE_BINDING' };
        }
      }
      if (!hasExactKeys(receipt.twinRelease, [
        'schema',
        'releaseSha256',
        'sourceManifestSha256',
        'corpusSha256'
      ]) || receipt.twinRelease.schema !== RELEASE_SCHEMA ||
          receipt.twinRelease.releaseSha256 !== binding.releaseSha256 ||
          receipt.twinRelease.sourceManifestSha256 !==
            binding.sourceManifestSha256 ||
          receipt.twinRelease.corpusSha256 !== binding.corpusSha256) {
        return { ok: false, code: 'RELEASE_BINDING_MISMATCH' };
      }
      if (!receipt.result || receipt.result.schema !== SCHEMA ||
          receipt.result.question !== RECEIPT_IDENTITY.question ||
          !receipt.result.corpus ||
          receipt.result.corpus.corpusSha256 !== binding.corpusSha256) {
        return { ok: false, code: 'RESULT_IDENTITY_MISMATCH' };
      }
      var replay = run(RECEIPT_IDENTITY.question, { limit: 6 });
      if (canonicalStringify(replay) !== canonicalStringify(receipt.result)) {
        return { ok: false, code: 'REPLAY_MISMATCH' };
      }
      if (typeof receipt.receiptSha256 !== 'string' ||
          !SHA256.test(receipt.receiptSha256) ||
          typeof sha256 !== 'function') {
        return { ok: false, code: 'INVALID_RECEIPT_DIGEST' };
      }
      var digestPayload = clone(receipt);
      delete digestPayload.receiptSha256;
      var computed;
      try {
        computed = await sha256(canonicalStringify(digestPayload));
      } catch (_error) {
        return { ok: false, code: 'RECEIPT_DIGEST_FAILED' };
      }
      if (computed !== receipt.receiptSha256) {
        return { ok: false, code: 'RECEIPT_DIGEST_MISMATCH' };
      }
      return {
        ok: true,
        code: 'VERIFIED',
        receiptSha256: receipt.receiptSha256,
        releaseSha256: binding.releaseSha256,
        corpusSha256: binding.corpusSha256
      };
    }

    function run(question, options) {
      var normalized = normalizeQuestion(question);
      if (!normalized) {
        return abstention('', 'The tribunal requires a non-empty question.');
      }

      var answer = engine.answer(normalized, options);
      var evolution = engine.evolution(normalized, options);
      var challenge = engine.challenge(normalized, options);
      var answerFacts;
      var evolutionFacts;
      var thesisFacts;
      var strongestChallenge;

      try {
        answerFacts = answer.claims.map(function (item) {
          return exactFact(item, 'answer-support');
        });
        evolutionFacts = evolution.items.map(function (item) {
          var fact = exactFact(item, 'dated-evidence');
          fact.at = item.at;
          fact.timeBasis = item.timeBasis;
          return fact;
        });
        thesisFacts = challenge.thesis.map(function (item) {
          return exactFact(item, 'challenge-thesis');
        });
        strongestChallenge = challenge.counterevidence.length
          ? exactFact(challenge.counterevidence[0], 'strongest-challenge')
          : null;
        if (strongestChallenge) {
          strongestChallenge.relation = challenge.counterevidence[0].relation;
        }
      } catch (error) {
        return abstention(
          normalized,
          'Citation validation failed, so the tribunal refused to publish a claim.'
        );
      }

      var citations = [];
      var seen = Object.create(null);
      answerFacts.concat(evolutionFacts, thesisFacts)
        .concat(strongestChallenge ? [strongestChallenge] : [])
        .forEach(function (fact) {
          var key = citationKey(fact.citation);
          if (!seen[key]) {
            seen[key] = true;
            citations.push(clone(fact.citation));
          }
        });

      var answerSupported = answer.status === 'answered' &&
        answerFacts.length > 0;
      var evolutionSupported = evolution.status === 'evidence-timeline' &&
        evolutionFacts.length >= 2;
      var challengeSupported = challenge.status === 'evidence-found' &&
        thesisFacts.length > 0 && Boolean(strongestChallenge);

      return {
        schema: SCHEMA,
        version: VERSION,
        question: normalized,
        status: answerSupported
          ? (challengeSupported ? 'supported-with-challenge' : 'supported')
          : 'abstained',
        boundary: 'Facts are exact corpus evidence. Inferences are labeled and may not add uncited claims.',
        corpus: clone(engine.stats()),
        chambers: {
          answer: {
            status: answerSupported ? 'supported' : 'abstained',
            facts: answerSupported ? answerFacts : [],
            inference: answerSupported
              ? inference(
                'These exact passages meet the twin engine answer threshold; no private intent is inferred.',
                answerFacts
              )
              : null
          },
          evolution: {
            status: evolutionSupported ? 'supported' : 'abstained',
            facts: evolutionSupported ? evolutionFacts : [],
            inference: evolutionSupported
              ? inference(
                'The dated record establishes recurrence across time, not a change in belief.',
                evolutionFacts
              )
              : null
          },
          challenge: {
            status: challengeSupported ? 'supported' : 'abstained',
            thesisFacts: challengeSupported ? thesisFacts : [],
            strongestFact: challengeSupported ? strongestChallenge : null,
            inference: challengeSupported
              ? inference(
                'The corpus declares this evidence as a qualification of the thesis, not as an inferred contradiction.',
                thesisFacts.concat([strongestChallenge])
              )
              : null
          }
        },
        abstentions: [
          answerSupported ? null : {
            chamber: 'answer',
            reason: 'No exact citation satisfied the answer threshold.'
          },
          evolutionSupported ? null : {
            chamber: 'evolution',
            reason: 'Fewer than two dated exact citations satisfied the timeline threshold.'
          },
          challengeSupported ? null : {
            chamber: 'challenge',
            reason: 'No explicit corpus relation supported a challenge.'
          }
        ].filter(Boolean),
        citations: citations
      };
    }

    function abstention(question, reason) {
      return {
        schema: SCHEMA,
        version: VERSION,
        question: question,
        status: 'abstained',
        boundary: 'Facts are exact corpus evidence. Inferences are labeled and may not add uncited claims.',
        corpus: clone(engine.stats()),
        chambers: {
          answer: { status: 'abstained', facts: [], inference: null },
          evolution: { status: 'abstained', facts: [], inference: null },
          challenge: {
            status: 'abstained',
            thesisFacts: [],
            strongestFact: null,
            inference: null
          }
        },
        abstentions: [
          { chamber: 'tribunal', reason: reason }
        ],
        citations: []
      };
    }

    return Object.freeze({
      run: run,
      verifyReceipt: verifyReceipt,
      inspect: function () {
        return {
          schema: SCHEMA,
          version: VERSION,
          action: 'tribunal.run',
          corpus: clone(engine.stats())
        };
      }
    });
  }

  return Object.freeze({
    version: VERSION,
    schema: SCHEMA,
    receiptSchema: RECEIPT_SCHEMA,
    releaseSchema: RELEASE_SCHEMA,
    receiptIdentity: RECEIPT_IDENTITY,
    canonicalStringify: canonicalStringify,
    createTribunal: createTribunal
  });
}));
