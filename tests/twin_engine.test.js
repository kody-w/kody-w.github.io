const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const Engine = require('../js/twin-engine.js');
const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'twin-corpus.json'), 'utf8')
);

function citationIsExact(citation) {
  const record = fixture.records.find((item) => item.id === citation.sourceId);
  assert.ok(record, citation.sourceId);
  if (citation.locator.kind === 'text') {
    assert.equal(
      citation.quote,
      record.text.slice(citation.locator.start, citation.locator.end)
    );
  } else {
    assert.equal(citation.value, record.structured.value);
  }
}

test('validates and indexes the declared corpus schema', () => {
  const validation = Engine.validateCorpus(fixture);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors));
  const engine = Engine.createEngine(fixture);
  assert.equal(engine.stats().records, 6);
});

test('rejects missing provenance and protocol-relative source URLs', () => {
  const missingManifest = structuredClone(fixture);
  delete missingManifest.sourceManifest;
  assert.equal(Engine.validateCorpus(missingManifest).ok, false);

  const unsafeUrl = structuredClone(fixture);
  unsafeUrl.records[0].sourceUrl = '//evil.example/source';
  assert.equal(Engine.validateCorpus(unsafeUrl).ok, false);
});

test('search and answers are deterministic exact evidence', () => {
  const engine = Engine.createEngine(fixture);
  const first = engine.answer('Where is the source of truth?');
  const second = engine.answer('Where is the source of truth?');
  assert.deepEqual(first, second);
  assert.equal(first.status, 'answered');
  assert.ok(first.claims.length > 0);
  first.claims.forEach((claim) => citationIsExact(claim.citation));
});

test('unsupported questions abstain instead of manufacturing a voice', () => {
  const engine = Engine.createEngine(fixture);
  const answer = engine.answer("What is Kody's favorite pizza?");
  assert.equal(answer.status, 'insufficient-evidence');
  assert.deepEqual(answer.claims, []);
});

test('evolution uses distinct sources in ascending time order', () => {
  const engine = Engine.createEngine(fixture);
  const result = engine.evolution('agents evidence');
  assert.ok(result.items.length >= 2);
  assert.equal(new Set(result.items.map((item) => item.citation.sourceId)).size, result.items.length);
  assert.deepEqual(
    result.items.map((item) => item.at),
    result.items.map((item) => item.at).slice().sort()
  );
  result.items.forEach((item) => citationIsExact(item.citation));
});

test('challenge uses an explicit relation and never challenges with itself', () => {
  const engine = Engine.createEngine(fixture);
  const result = engine.challenge('What is the source of truth?');
  assert.ok(result.thesis.length > 0);
  assert.ok(result.counterevidence.length > 0);
  const thesisIds = new Set(result.thesis.map((item) => item.citation.sourceId));
  result.counterevidence.forEach((item) => {
    assert.equal(item.relation, 'qualifies');
    assert.equal(thesisIds.has(item.citation.sourceId), false);
    citationIsExact(item.citation);
  });
});

test('citation corruption fails validation', () => {
  const engine = Engine.createEngine(fixture);
  const result = engine.answer('source truth');
  const corrupted = structuredClone(result.claims[0].citation);
  corrupted.quote += ' changed';
  assert.equal(engine.validateCitation(corrupted).ok, false);
});
