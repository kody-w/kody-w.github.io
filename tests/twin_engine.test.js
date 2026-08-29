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

test('rejects a mutated corpus carrying stale declared hashes', () => {
  const forged = structuredClone(fixture);
  forged.records[0].text = 'FORGED PERSONAL CLAIM: I secretly endorse this.';
  assert.equal(Engine.validateCorpus(forged).ok, false);
  assert.throws(() => Engine.createEngine(forged));
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

test('answer evidence itself supports the meaningful query tokens', () => {
  const engine = Engine.createEngine(fixture);
  const answer = engine.answer('agents evidence');
  assert.equal(answer.status, 'answered');
  assert.ok(answer.claims.length > 0);
  answer.claims.forEach((claim) => {
    const evidence = String(claim.citation.quote || claim.citation.value).toLowerCase();
    assert.match(evidence, /agents/);
    assert.match(evidence, /evidence/);
  });
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

  test('challenge abstains when no explicit corpus relation applies', () => {
    const engine = Engine.createEngine(fixture);
    const result = engine.challenge('agents evidence');
    assert.equal(result.counterevidence.length, 0);
    assert.notEqual(result.status, 'evidence-found');
  });
});

test('citation corruption fails validation', () => {
  const engine = Engine.createEngine(fixture);
  const result = engine.answer('source truth');
  const corrupted = structuredClone(result.claims[0].citation);
  corrupted.quote += ' changed';
  assert.equal(engine.validateCitation(corrupted).ok, false);

  const forgedTitle = structuredClone(result.claims[0].citation);
  forgedTitle.title = 'A more convenient title';
  assert.equal(engine.validateCitation(forgedTitle).ok, false);

  const forgedUrl = structuredClone(result.claims[0].citation);
  forgedUrl.sourceUrl = 'https://evil.example/forged';
  assert.equal(engine.validateCitation(forgedUrl).ok, false);
});
