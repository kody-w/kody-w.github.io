const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const Engine = require('../js/twin-engine.js');
const TwinState = require('../js/twin-state.js');
const Controller = require('../js/twin-controller.js');

const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'twin-corpus.json'), 'utf8')
);
const prompt = fs.readFileSync(
  path.join(__dirname, '..', 'twin', 'one-sentence-prompt.txt'),
  'utf8'
);

function createController() {
  const clipboard = { value: '' };
  const view = {
    mode: 'answer',
    source: null,
    render() {},
    setMode(mode) { this.mode = mode; },
    openSource(source) { this.source = source; }
  };
  const storage = {
    values: new Map(),
    getItem(key) { return this.values.get(key) || null; },
    setItem(key, value) { this.values.set(key, value); },
    removeItem(key) { this.values.delete(key); }
  };
  return {
    clipboard,
    view,
    controller: Controller.createController({
      engine: Engine.createEngine(corpus),
      store: TwinState.createStore({ storage }),
      view,
      prompt,
      copyText(value) {
        clipboard.value = value;
        return Promise.resolve();
      },
      corpusSha256: corpus.corpusSha256
    })
  };
}

test('capabilities expose every semantic action without coordinate inputs', () => {
  const { controller } = createController();
  const capabilities = controller.capabilities();
  const names = capabilities.actions.map((action) => action.name);
  for (const required of [
    'search.query',
    'answer.ask',
    'evolution.compare',
    'challenge.run',
    'citation.open',
    'citation.pin',
    'state.export',
    'state.import',
    'state.reset',
    'ui.setMode',
    'prompt.get',
    'prompt.build',
    'prompt.copy'
  ]) {
    assert.ok(names.includes(required), required);
  }
  const serialized = JSON.stringify(capabilities);
  for (const forbidden of ['"x"', '"y"', '"selector"', '"xpath"', '"javascript"']) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test('semantic mission completes without selectors or coordinates', async () => {
  const { controller } = createController();
  const mission = await controller.runMission({
    steps: [
      { action: 'answer.ask', input: { question: 'Where is the source of truth?' } },
      { action: 'challenge.run', input: { question: 'Where is the source of truth?' } },
      { action: 'ui.setMode', input: { mode: 'challenge' } },
      { action: 'state.export' },
      { action: 'state.reset' }
    ]
  });
  assert.equal(mission.ok, true);
  assert.equal(mission.data.status, 'completed');
  assert.equal(mission.data.steps.every((step) => step.ok), true);
});

test('unknown and invalid actions fail without state mutation', async () => {
  const { controller } = createController();
  const before = await controller.dispatch('state.export');
  const unknown = await controller.dispatch('browser.click', { x: 10, y: 20 });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error.code, 'UNKNOWN_ACTION');
  const invalid = await controller.dispatch('answer.ask', { question: '' });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, 'INVALID_INPUT');
  const after = await controller.dispatch('state.export');
  assert.equal(after.data.serialized, before.data.serialized);
});

test('prompt actions preserve the one-sentence idea contract exactly', async () => {
  const { controller, clipboard } = createController();
  const built = await controller.dispatch('prompt.build', {
    app: 'a public evidence twin for my work'
  });
  assert.equal(built.ok, true);
  assert.equal(built.data.prompt, prompt.replace('{APP}', 'a public evidence twin for my work'));
  const copied = await controller.dispatch('prompt.copy', {
    app: 'a public evidence twin for my work'
  });
  assert.equal(copied.ok, true);
  assert.equal(clipboard.value, built.data.prompt);
});

test('self-test measures dependencies instead of returning a constant pass', async () => {
  const { controller } = createController();
  const report = await controller.selfTest();
  assert.equal(report.ok, true);
  assert.equal(report.data.passed, true);
  assert.ok(report.data.checks.length >= 4);
  assert.equal(report.data.checks.every((check) => check.passed), true);
  assert.ok(report.data.checks.every((check) => Object.keys(check.evidence).length > 0));
});
