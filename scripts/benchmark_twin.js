#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const Engine = require(path.join(root, 'js', 'twin-engine.js'));
const corpus = JSON.parse(
  fs.readFileSync(path.join(root, 'api', 'twin-corpus.json'), 'utf8')
);
const engine = Engine.createEngine(corpus);

const queries = [
  'digital twin',
  'local first',
  'agent autonomy',
  'GitHub as infrastructure',
  'evidence not demos',
  'source of truth',
  'RAPP',
  'simulation',
  'persistent authorship',
  'offline software'
];

const operations = {
  search: {
    budgetMs: 100,
    run(query) {
      return engine.search(query, { limit: 8 });
    }
  },
  answer: {
    budgetMs: 200,
    run(query) {
      return engine.answer(query, { limit: 5 });
    }
  },
  evolution: {
    budgetMs: 300,
    run(query) {
      return engine.evolution(query, { limit: 8 });
    }
  },
  challenge: {
    budgetMs: 300,
    run(query) {
      return engine.challenge(query, { limit: 6 });
    }
  }
};

function percentile(values, fraction) {
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function measure(operation) {
  queries.slice(0, 3).forEach((query) => operation.run(query));
  const samples = [];
  for (let round = 0; round < 3; round += 1) {
    queries.forEach((query) => {
      const started = performance.now();
      const result = operation.run(query);
      const elapsed = performance.now() - started;
      if (!result || typeof result !== 'object') {
        throw new Error('operation returned no measurable result');
      }
      samples.push(elapsed);
    });
  }
  return {
    samples,
    medianMs: percentile(samples, 0.5),
    p95Ms: percentile(samples, 0.95),
    maxMs: Math.max(...samples)
  };
}

const report = {
  runtime: process.version,
  platform: `${process.platform}/${process.arch}`,
  records: corpus.records.length,
  queries: queries.length,
  rounds: 3,
  results: {}
};
let failed = false;

Object.entries(operations).forEach(([name, operation]) => {
  const measured = measure(operation);
  report.results[name] = {
    budgetMs: operation.budgetMs,
    medianMs: Number(measured.medianMs.toFixed(3)),
    p95Ms: Number(measured.p95Ms.toFixed(3)),
    maxMs: Number(measured.maxMs.toFixed(3))
  };
  if (measured.p95Ms > operation.budgetMs) {
    failed = true;
  }
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = failed ? 1 : 0;
