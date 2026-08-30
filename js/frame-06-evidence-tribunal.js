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
  var MAX_QUESTION_LENGTH = 500;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
    createTribunal: createTribunal
  });
}));
