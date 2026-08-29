const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const Engine = require('../js/twin-engine.js');
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'api', 'twin-corpus.json'), 'utf8')
);
const engine = Engine.createEngine(corpus);
const root = path.join(__dirname, '..');

function markdownFiles(directory) {
  return fs.readdirSync(path.join(root, directory))
    .filter((name) => name.endsWith('.md'));
}

function declaredAuthor(directory, name) {
  const source = fs.readFileSync(path.join(root, directory, name), 'utf8');
  const frontMatter = source.split(/^---\s*$/m)[1] || '';
  const match = frontMatter.match(/^author:\s*(.+?)\s*$/m);
  return match ? match[1].replace(/^['"]|['"]$/g, '') : null;
}

function recordBySuffix(suffix) {
  const record = corpus.records.find((item) => item.sourcePath.endsWith(suffix));
  assert.ok(record, suffix);
  return record;
}

function hasSingleClauseWith(text, terms) {
  return String(text)
    .toLowerCase()
    .split(/[.!?;\n]+/)
    .some((clause) => terms.every((term) => clause.includes(term)));
}

test('real corpus preserves source counts and authorship boundaries', () => {
  const posts = markdownFiles('_posts');
  const fieldNotes = markdownFiles('_twin_posts');
  const works = JSON.parse(
    fs.readFileSync(path.join(root, 'api', 'works.json'), 'utf8')
  ).repos;
  assert.equal(corpus.records.length, posts.length + fieldNotes.length + works.length);
  assert.equal(
    corpus.records.filter((item) => item.sourceType === 'post').length,
    posts.length
  );
  assert.equal(
    corpus.records.filter((item) => item.sourceType === 'field_note').length,
    fieldNotes.length
  );
  assert.equal(
    corpus.records.filter((item) => item.sourceType === 'work').length,
    works.length
  );

  const authoredFieldNotes = corpus.records.filter(
    (item) => item.sourceType === 'field_note' && item.author === 'obsidian'
  );
  assert.equal(
    authoredFieldNotes.length,
    fieldNotes.filter(
      (name) => declaredAuthor('_twin_posts', name) === 'obsidian'
    ).length
  );
  const unattributedPosts = corpus.records.filter(
    (item) => item.sourceType === 'post' && item.author === null
  );
  assert.equal(
    unattributedPosts.length,
    posts.filter((name) => declaredAuthor('_posts', name) === null).length
  );
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
  if (answer.status === 'answered') {
    assert.ok(answer.claims.length > 0);
    answer.claims.forEach((claim) => {
      const evidence = String(claim.citation.quote || claim.citation.value).toLowerCase();
      assert.equal(
        hasSingleClauseWith(evidence, ['evidence', 'not', 'demo']),
        true,
        evidence
      );
    });
  } else {
    assert.equal(answer.status, 'insufficient-evidence');
    assert.deepEqual(answer.claims, []);
  }
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
    assert.equal(hasSingleClauseWith(text, ['not', 'evidence']), true, text);
    assert.doesNotMatch(text, /not decorative lore[\s\S]*operational evidence/i);
  });

  const source = engine.answer('What is not the source of truth?');
  if (source.status === 'answered') {
    source.claims.forEach((claim) => {
      const text = String(claim.citation.quote || claim.citation.value).toLowerCase();
      assert.equal(
        ['not', 'never', 'without'].some((qualifier) =>
          hasSingleClauseWith(text, [qualifier, 'source', 'truth'])
        ),
        true,
        text
      );
    });
  } else {
    assert.equal(source.status, 'insufficient-evidence');
    assert.deepEqual(source.claims, []);
  }

  const always = engine.answer('What is always evidence?');
  if (always.status === 'answered') {
    always.claims.forEach((claim) => {
      const text = String(claim.citation.quote || claim.citation.value).toLowerCase();
      assert.equal(hasSingleClauseWith(text, ['always', 'evidence']), true, text);
    });
  } else {
    assert.equal(always.status, 'insufficient-evidence');
    assert.deepEqual(always.claims, []);
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

  const trailingConstraint =
    `source truth ${'the '.repeat(30)}not cloud`;
  const trailing = engine.answer(trailingConstraint);
  assert.equal(trailing.status, 'insufficient-evidence');
  assert.deepEqual(trailing.claims, []);
});

test('modal qualifiers remain in the same clause as their subject', () => {
  for (const [question, modal] of [
    ['What should agents do?', 'should'],
    ['What must agents do?', 'must'],
    ['What cannot agents do?', 'cannot'],
    ['What can agents do?', 'can']
  ]) {
    const answer = engine.answer(question);
    if (answer.status === 'answered') {
      assert.ok(answer.claims.length > 0, question);
      answer.claims.forEach((claim) => {
        const text = String(claim.citation.quote || claim.citation.value).toLowerCase();
        assert.equal(hasSingleClauseWith(text, [modal, 'agents']), true, `${question}: ${text}`);
      });
    } else {
      assert.equal(answer.status, 'insufficient-evidence', question);
      assert.deepEqual(answer.claims, [], question);
    }
  }
});
