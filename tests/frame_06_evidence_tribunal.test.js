const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const Engine = require('../js/twin-engine.js');
const Tribunal = require('../js/frame-06-evidence-tribunal.js');
const corpus = JSON.parse(
  fs.readFileSync(path.join(root, 'api', 'twin-corpus.json'), 'utf8')
);
const engine = Engine.createEngine(corpus);
const tribunal = Tribunal.createTribunal(engine);

function everyFact(result) {
  return result.chambers.answer.facts
    .concat(result.chambers.evolution.facts)
    .concat(result.chambers.challenge.thesisFacts)
    .concat(
      result.chambers.challenge.strongestFact
        ? [result.chambers.challenge.strongestFact]
        : []
    );
}

test('runs all three chambers deterministically for one question', () => {
  const question = 'What is the source of truth?';
  const first = tribunal.run(question, { limit: 6 });
  const second = tribunal.run(question, { limit: 6 });
  assert.deepEqual(first, second);
  assert.equal(first.question, question);
  assert.equal(first.chambers.answer.status, 'supported');
  assert.equal(first.chambers.evolution.status, 'supported');
  assert.equal(first.chambers.challenge.status, 'supported');
  assert.equal(first.chambers.challenge.strongestFact.relation, 'qualifies');
});

test('keeps exact facts separate from bounded inferences', () => {
  const result = tribunal.run('What is the source of truth?', { limit: 6 });
  const facts = everyFact(result);
  assert.ok(facts.length > 0);
  facts.forEach((fact) => {
    assert.equal(fact.kind, 'fact');
    assert.equal(engine.validateCitation(fact.citation).ok, true);
    assert.deepEqual(
      fact.evidence,
      fact.citation.locator.kind === 'text'
        ? fact.citation.quote
        : fact.citation.value
    );
  });
  ['answer', 'evolution', 'challenge'].forEach((name) => {
    const value = result.chambers[name].inference;
    assert.equal(value.kind, 'inference');
    assert.ok(value.supportedBy.length > 0);
  });
});

test('abstains without publishing claims when evidence is insufficient', () => {
  const result = tribunal.run("What is Kody's favorite pizza?");
  assert.equal(result.status, 'abstained');
  assert.deepEqual(result.chambers.answer.facts, []);
  assert.equal(result.chambers.answer.inference, null);
  assert.deepEqual(result.citations, []);
  assert.ok(result.abstentions.length > 0);
});

test('committed receipt replays exactly and carries a valid digest', () => {
  const receipt = JSON.parse(
    fs.readFileSync(
      path.join(root, 'api', 'frame-06-evidence-tribunal.json'),
      'utf8'
    )
  );
  assert.equal(receipt.topic, "Kody's local-first product philosophy");
  assert.equal(receipt.question, 'What is the source of truth?');
  assert.equal(receipt.corpusSha256, corpus.corpusSha256);
  assert.deepEqual(
    receipt.result,
    tribunal.run(receipt.question, { limit: 6 })
  );
  const digestPayload = structuredClone(receipt);
  delete digestPayload.receiptSha256;
  const expected = crypto
    .createHash('sha256')
    .update(`${JSON.stringify(digestPayload, null, 2)}\n`)
    .digest('hex');
  assert.equal(receipt.receiptSha256, expected);
});

test('page and browser API use the shared corpus and engine', () => {
  const page = fs.readFileSync(
    path.join(root, 'public-twin', 'tribunal', 'index.html'),
    'utf8'
  );
  const app = fs.readFileSync(
    path.join(root, 'js', 'frame-06-evidence-tribunal-app.js'),
    'utf8'
  );
  assert.match(page, /permalink: \/public-twin\/tribunal\//);
  assert.match(page, /Answer/);
  assert.match(page, /Evolution/);
  assert.match(page, /Strongest qualification/);
  assert.match(page, /Facts remain exact evidence/);
  assert.match(page, /Unsupported claims become abstentions/);
  assert.match(app, /\/api\/twin-corpus\.json/);
  assert.match(app, /KodyTwinEngine\.createEngine/);
  assert.match(app, /KodyEvidenceTribunalCore\.createTribunal/);
  assert.doesNotMatch(page + app, /\.innerHTML\s*=/);
});
