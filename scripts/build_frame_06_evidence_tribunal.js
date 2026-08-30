#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'api', 'frame-06-evidence-tribunal.json');
const QUESTION = 'What is the source of truth?';
const Engine = require(path.join(ROOT, 'js', 'twin-engine.js'));
const Tribunal = require(path.join(ROOT, 'js', 'frame-06-evidence-tribunal.js'));

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function build() {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'api', 'twin-corpus.json'), 'utf8')
  );
  const engine = Engine.createEngine(corpus);
  const result = Tribunal.createTribunal(engine).run(QUESTION, { limit: 6 });
  const payload = {
    schema: 'kodyw-frame-06-receipt/1.0',
    frame: '06',
    surface: '/public-twin/tribunal/',
    topic: "Kody's local-first product philosophy",
    question: QUESTION,
    generator: 'scripts/build_frame_06_evidence_tribunal.js',
    corpusSha256: corpus.corpusSha256,
    result
  };
  payload.receiptSha256 = crypto
    .createHash('sha256')
    .update(stableJson(payload))
    .digest('hex');
  return stableJson(payload);
}

const expected = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== expected) {
    console.error('Frame 06 tribunal receipt is stale. Run the builder.');
    process.exit(1);
  }
  console.log('Frame 06 tribunal receipt is current.');
} else {
  fs.writeFileSync(OUTPUT, expected);
  console.log(path.relative(ROOT, OUTPUT));
}
