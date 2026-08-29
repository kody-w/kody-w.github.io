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

function createController(options = {}) {
  const clipboard = { value: '' };
  const view = options.view || {
    mode: 'answer',
    source: null,
    failRender: false,
    failMode: false,
    render() {
      if (this.failRender) throw new Error('render failed');
    },
    setMode(mode) {
      if (this.failMode) throw new Error('mode failed');
      this.mode = mode;
    },
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
  assert.equal(capabilities.apiVersion, '1.0');
  assert.equal(
    capabilities.actions.every(
      (action) =>
        typeof action.description === 'string' &&
        action.description.length > 0 &&
        action.inputSchema &&
        typeof action.inputSchema === 'object' &&
        typeof action.mutatesState === 'boolean'
    ),
    true
  );
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

test('inspection and citation opening expose semantic provenance', async () => {
  const { controller, view } = createController();
  const answer = await controller.dispatch('answer.ask', {
    question: 'Where is the source of truth?'
  });
  const citation = answer.data.claims[0].citation;
  const opened = await controller.dispatch('citation.open', { citation });
  assert.equal(opened.ok, true);
  assert.equal(view.source.citation.sourceId, citation.sourceId);
  assert.equal(view.source.source.id, citation.sourceId);

  const inspection = controller.inspect();
  assert.equal(inspection.ready, true);
  assert.equal(inspection.route, '/twin/');
  assert.equal(inspection.mode, 'answer');
  assert.equal(inspection.stateRevision > 0, true);
  assert.equal(typeof inspection.activeResultId, 'string');
  assert.equal(
    inspection.controls.some(
      (control) => control.action === 'citation.open' && control.enabled
    ),
    true
  );
});

test('view failures roll back state-changing semantic actions', async () => {
  const { controller, view } = createController();
  await controller.dispatch('answer.ask', { question: 'source truth' });
  const populated = (await controller.dispatch('state.export')).data.serialized;

  view.failRender = true;
  const reset = await controller.dispatch('state.reset');
  assert.equal(reset.ok, false);
  assert.equal(reset.error.code, 'VIEW_ERROR');
  assert.equal(
    (await controller.dispatch('state.export')).data.serialized,
    populated
  );

  view.failRender = false;
  await controller.dispatch('state.reset');
  const empty = (await controller.dispatch('state.export')).data.serialized;
  view.failRender = true;
  const imported = await controller.dispatch('state.import', {
    serialized: populated
  });
  assert.equal(imported.ok, false);
  assert.equal(imported.error.code, 'VIEW_ERROR');
  assert.equal(
    (await controller.dispatch('state.export')).data.serialized,
    empty
  );

  view.failRender = false;
  view.failMode = true;
  const beforeMode = (await controller.dispatch('state.export')).data.serialized;
  const mode = await controller.dispatch('ui.setMode', { mode: 'challenge' });
  assert.equal(mode.ok, false);
  assert.equal(mode.error.code, 'VIEW_ERROR');
  assert.equal(
    (await controller.dispatch('state.export')).data.serialized,
    beforeMode
  );
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

test('state import rejects forged pinned evidence transactionally', async () => {
  const { controller } = createController();
  const before = (await controller.dispatch('state.export')).data.serialized;
  const forged = JSON.parse(before);
  forged.pinnedCitations.push({
    sourceId: 'post:agents-as-tools',
    sourceSha256: '1111111111111111111111111111111111111111111111111111111111111111',
    sourceType: 'post',
    title: 'Forged evidence',
    author: 'Kody Wildfeuer',
    date: '2024-01-02',
    timeBasis: 'published',
    sourceUrl: 'https://evil.example/forged',
    locator: { kind: 'text', start: 0, end: 10 },
    quote: 'I secretly'
  });
  const imported = await controller.dispatch('state.import', {
    serialized: JSON.stringify(forged)
  });
  assert.equal(imported.ok, false);
  assert.equal(
    (await controller.dispatch('state.export')).data.serialized,
    before
  );
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
