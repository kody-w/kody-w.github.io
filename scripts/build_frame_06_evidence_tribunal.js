#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'api', 'frame-06-evidence-tribunal.json');
const Engine = require(path.join(ROOT, 'js', 'twin-engine.js'));
const Tribunal = require(path.join(ROOT, 'js', 'frame-06-evidence-tribunal.js'));

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function receiptDigest(payload) {
  return crypto
    .createHash('sha256')
    .update(Tribunal.canonicalStringify(payload))
    .digest('hex');
}

function build(corpus, releaseSha256) {
  if (!/^[0-9a-f]{64}$/.test(releaseSha256)) {
    throw new Error('A valid Twin release SHA-256 is required.');
  }
  const engine = Engine.createEngine(corpus);
  const result = Tribunal.createTribunal(engine).run(
    Tribunal.receiptIdentity.question,
    { limit: 6 }
  );
  const payload = {
    schema: Tribunal.receiptSchema,
    frame: Tribunal.receiptIdentity.frame,
    surface: Tribunal.receiptIdentity.surface,
    topic: Tribunal.receiptIdentity.topic,
    question: Tribunal.receiptIdentity.question,
    generator: Tribunal.receiptIdentity.generator,
    twinRelease: {
      schema: Tribunal.releaseSchema,
      releaseSha256,
      sourceManifestSha256: corpus.sourceManifestSha256,
      corpusSha256: corpus.corpusSha256
    },
    result
  };
  payload.receiptSha256 = receiptDigest(payload);
  return stableJson(payload);
}

function inputFromDisk() {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'api', 'twin-corpus.json'), 'utf8')
  );
  const shellManifest = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'public-twin', 'shell-manifest.json'),
      'utf8'
    )
  );
  return {
    corpus,
    releaseSha256: shellManifest.releaseSha256
  };
}

function inputFromStdin() {
  const envelope = JSON.parse(fs.readFileSync(0, 'utf8'));
  return {
    corpus: envelope.corpus,
    releaseSha256: envelope.releaseSha256
  };
}

const input = process.argv.includes('--stdin') ? inputFromStdin() : inputFromDisk();
const expected = build(input.corpus, input.releaseSha256);
if (process.argv.includes('--stdout')) {
  process.stdout.write(expected);
} else if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== expected) {
    console.error('Frame 06 tribunal receipt is stale. Run the builder.');
    process.exit(1);
  }
  console.log('Frame 06 tribunal receipt is current.');
} else {
  fs.writeFileSync(OUTPUT, expected);
  console.log(path.relative(ROOT, OUTPUT));
}
