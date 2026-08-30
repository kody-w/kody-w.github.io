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

function sha256(value) {
  return Promise.resolve(
    crypto.createHash('sha256').update(value).digest('hex')
  );
}

function bindingFor(receipt) {
  return {
    releaseSha256: receipt.twinRelease.releaseSha256,
    sourceManifestSha256: corpus.sourceManifestSha256,
    corpusSha256: corpus.corpusSha256
  };
}

function receiptWithFreshDigest(receipt) {
  const updated = structuredClone(receipt);
  delete updated.receiptSha256;
  updated.receiptSha256 = crypto
    .createHash('sha256')
    .update(Tribunal.canonicalStringify(updated))
    .digest('hex');
  return updated;
}

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

test('committed receipt replays exactly and carries a canonical digest', async () => {
  const receipt = JSON.parse(
    fs.readFileSync(
      path.join(root, 'api', 'frame-06-evidence-tribunal.json'),
      'utf8'
    )
  );
  assert.equal(receipt.topic, "Kody's local-first product philosophy");
  assert.equal(receipt.question, 'What is the source of truth?');
  assert.equal(receipt.twinRelease.corpusSha256, corpus.corpusSha256);
  assert.equal(
    receipt.twinRelease.sourceManifestSha256,
    corpus.sourceManifestSha256
  );
  assert.deepEqual(
    receipt.result,
    tribunal.run(receipt.question, { limit: 6 })
  );
  const digestPayload = structuredClone(receipt);
  delete digestPayload.receiptSha256;
  const expected = crypto
    .createHash('sha256')
    .update(Tribunal.canonicalStringify(digestPayload))
    .digest('hex');
  assert.equal(receipt.receiptSha256, expected);
  assert.deepEqual(
    await tribunal.verifyReceipt(receipt, bindingFor(receipt), sha256),
    {
      ok: true,
      code: 'VERIFIED',
      receiptSha256: receipt.receiptSha256,
      releaseSha256: receipt.twinRelease.releaseSha256,
      corpusSha256: corpus.corpusSha256
    }
  );
});

test('receipt verification rejects schema, identity, release, corpus, digest, and replay mutations', async () => {
  const receipt = JSON.parse(
    fs.readFileSync(
      path.join(root, 'api', 'frame-06-evidence-tribunal.json'),
      'utf8'
    )
  );
  const binding = bindingFor(receipt);
  const mutations = [
    ['schema', (value) => { value.schema = 'forged/1'; }],
    ['identity', (value) => { value.surface = '/public-twin/forged/'; }],
    ['release', (value) => { value.twinRelease.releaseSha256 = '0'.repeat(64); }],
    ['corpus', (value) => { value.twinRelease.corpusSha256 = '0'.repeat(64); }],
    ['digest', (value) => { value.receiptSha256 = '0'.repeat(64); }]
  ];
  for (const [name, mutate] of mutations) {
    const forged = structuredClone(receipt);
    mutate(forged);
    const verification = await tribunal.verifyReceipt(forged, binding, sha256);
    assert.equal(verification.ok, false, name);
  }

  const forgedReplay = structuredClone(receipt);
  forgedReplay.result.status = 'supported';
  const resignedReplay = receiptWithFreshDigest(forgedReplay);
  const replayVerification = await tribunal.verifyReceipt(
    resignedReplay,
    binding,
    sha256
  );
  assert.deepEqual(replayVerification, {
    ok: false,
    code: 'REPLAY_MISMATCH'
  });
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
  assert.match(app, /serviceWorker\.register/);
  assert.match(app, /updateViaCache: 'none'/);
  assert.match(app, /\/public-twin\/__release-lease__/);
  assert.match(app, /verifyReceipt/);
  assert.match(page, /id="tribunal-result-status"[^>]*aria-live="polite"/);
  assert.match(page, /id="tribunal-result-status"[^>]*><\/p>/);
  assert.match(app, /render\(receipt\.result, false\)/);
  assert.match(app, /render\(result, true\)/);
  assert.doesNotMatch(page + app, /\.innerHTML\s*=/);
});
