const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const Engine = require('../js/twin-engine.js');
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'api', 'twin-corpus.json'), 'utf8')
);
const engine = Engine.createEngine(corpus);

function recordBySuffix(suffix) {
  const record = corpus.records.find((item) => item.sourcePath.endsWith(suffix));
  assert.ok(record, suffix);
  return record;
}

test('real corpus preserves source counts and authorship boundaries', () => {
  assert.equal(corpus.records.length, 837);
  assert.equal(corpus.records.filter((item) => item.sourceType === 'post').length, 312);
  assert.equal(corpus.records.filter((item) => item.sourceType === 'field_note').length, 116);
  assert.equal(corpus.records.filter((item) => item.sourceType === 'work').length, 409);

  const authoredFieldNotes = corpus.records.filter(
    (item) => item.sourceType === 'field_note' && item.author === 'obsidian'
  );
  assert.equal(authoredFieldNotes.length, 104);
  const unattributedPosts = corpus.records.filter(
    (item) => item.sourceType === 'post' && item.author === null
  );
  assert.equal(unattributedPosts.length, 220);
});

test('real answer returns the exact deployment-pattern evidence', () => {
  const deployment = recordBySuffix(
    '2026-03-28-the-digital-twin-deployment-pattern.md'
  );
  const answer = engine.answer('local machine source of truth');
  assert.equal(answer.status, 'answered');
  const claim = answer.claims.find(
    (item) => item.citation.sourceId === deployment.id
  );
  assert.ok(claim, JSON.stringify(answer));
  assert.match(claim.citation.quote, /Your local machine is the source of truth/i);
  assert.equal(engine.validateCitation(claim.citation).ok, true);
});

test('real challenge labels the source-of-truth pair as qualification', () => {
  const deployment = recordBySuffix(
    '2026-03-28-the-digital-twin-deployment-pattern.md'
  );
  const markdown = recordBySuffix('2026-04-24-markdown-is-the-spec.md');
  const challenge = engine.challenge('source of truth');
  assert.ok(
    challenge.thesis.some((item) => item.citation.sourceId === deployment.id),
    JSON.stringify(challenge)
  );
  assert.ok(
    challenge.counterevidence.some(
      (item) =>
        item.relation === 'qualifies' &&
        item.citation.sourceId === markdown.id
    ),
    JSON.stringify(challenge)
  );
});

test('real repository evidence remains exact structured provenance', () => {
  const rapp = corpus.records.find(
    (item) =>
      item.sourceType === 'work' &&
      item.sourceUrl === 'https://github.com/kody-w/RAPP'
  );
  assert.ok(rapp);
  const search = engine.search('RAPP', { limit: 20 });
  assert.ok(search.some((item) => item.citation.sourceId === rapp.id));
  const source = engine.source(rapp.id);
  assert.equal(source.id, rapp.id);
  assert.equal(source.structured.pointer.startsWith('/repos/'), true);
});

test('real unsupported question abstains', () => {
  const answer = engine.answer("What is Kody's favorite pizza?");
  assert.equal(answer.status, 'insufficient-evidence');
  assert.deepEqual(answer.claims, []);
});

test('real answer quotes support the meaningful question terms', () => {
  const answer = engine.answer('evidence not demos');
  assert.equal(answer.status, 'answered');
  assert.ok(answer.claims.length > 0);
  answer.claims.forEach((claim) => {
    const evidence = String(claim.citation.quote || claim.citation.value).toLowerCase();
    assert.match(evidence, /evidence/);
    assert.match(evidence, /demo/);
  });
});

test('real challenge does not manufacture relations from transition words', () => {
  const challenge = engine.challenge('agent autonomy');
  assert.equal(challenge.counterevidence.length, 0);
  assert.notEqual(challenge.status, 'evidence-found');
});

test('negation remains a material answer constraint', () => {
  const evidence = engine.answer('What is not evidence?');
  assert.equal(evidence.status, 'answered');
  assert.ok(evidence.claims.length > 0);
  evidence.claims.forEach((claim) => {
    const text = String(claim.citation.quote || claim.citation.value).toLowerCase();
    assert.match(text, /\bnot\b/);
    assert.match(text, /\bevidence\b/);
  });

  const source = engine.answer('What is not the source of truth?');
  if (source.status === 'answered') {
    source.claims.forEach((claim) => {
      const text = String(claim.citation.quote || claim.citation.value).toLowerCase();
      assert.match(text, /\bnot\b|\bnever\b|\bwithout\b/);
      assert.match(text, /\bsource\b/);
      assert.match(text, /\btruth\b/);
    });
  } else {
    assert.equal(source.status, 'insufficient-evidence');
    assert.deepEqual(source.claims, []);
  }
});

test('unsupported material qualifiers force abstention', () => {
  for (const question of [
    'local machine source truth pizza unicorn',
    'source of truth passwords secrets'
  ]) {
    const answer = engine.answer(question);
    assert.equal(answer.status, 'insufficient-evidence', question);
    assert.deepEqual(answer.claims, [], question);
  }
});
