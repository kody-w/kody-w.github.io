(() => {
  'use strict';

  const CORPUS_URL = '/api/twin-corpus.json';
  const RECEIPT_URL = '/api/frame-06-evidence-tribunal.json';
  const elements = {
    form: document.getElementById('tribunal-form'),
    question: document.getElementById('tribunal-question'),
    submit: document.getElementById('tribunal-submit'),
    status: document.getElementById('tribunal-runtime-status'),
    verdict: document.getElementById('tribunal-verdict-heading'),
    verdictSummary: document.getElementById('tribunal-verdict-summary'),
    citationList: document.getElementById('tribunal-citation-list'),
    citationCount: document.getElementById('tribunal-citation-count'),
    chambers: {
      answer: document.querySelector('[data-chamber-body="answer"]'),
      evolution: document.querySelector('[data-chamber-body="evolution"]'),
      challenge: document.querySelector('[data-chamber-body="challenge"]')
    }
  };
  let tribunal = null;
  let receiptVerified = false;

  function create(tag, className, content) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (content != null) {
      node.textContent = String(content);
    }
    return node;
  }

  function clear(node) {
    node.textContent = '';
  }

  function locatorText(citation) {
    if (citation.locator.kind === 'text') {
      return `text:${citation.locator.start}-${citation.locator.end}`;
    }
    return `json-pointer:${citation.locator.pointer}`;
  }

  function renderFact(fact, index) {
    const article = create('article', 'tribunal-fact');
    const label = create('p', 'tribunal-label', `Fact ${String(index + 1).padStart(2, '0')} · ${fact.role}`);
    const quote = create('blockquote', '', fact.evidence);
    const source = create('a', 'tribunal-source', `${fact.citation.title} →`);
    source.href = fact.citation.sourceUrl;
    const detail = create(
      'code',
      'tribunal-provenance',
      `${fact.citation.sourceId} · ${fact.citation.date} · ${locatorText(fact.citation)} · sha256:${fact.citation.sourceSha256}`
    );
    article.append(label, quote, source, detail);
    return article;
  }

  function renderInference(value) {
    if (!value) {
      return null;
    }
    const aside = create('aside', 'tribunal-inference');
    aside.append(
      create('p', 'tribunal-label', 'Inference · explicitly labeled'),
      create('p', '', value.statement),
      create('code', '', `supported by ${value.supportedBy.join(' · ')}`)
    );
    return aside;
  }

  function renderAbstention(chamber, message) {
    const panel = create('div', 'tribunal-abstention');
    panel.append(
      create('p', 'tribunal-label', `${chamber} abstains`),
      create('p', '', message)
    );
    return panel;
  }

  function renderAnswer(chamber) {
    const target = elements.chambers.answer;
    clear(target);
    if (chamber.status !== 'supported') {
      target.append(renderAbstention('Answer', 'No exact citation satisfied the answer threshold.'));
      return;
    }
    chamber.facts.forEach((fact, index) => target.append(renderFact(fact, index)));
    target.append(renderInference(chamber.inference));
  }

  function renderEvolution(chamber) {
    const target = elements.chambers.evolution;
    clear(target);
    if (chamber.status !== 'supported') {
      target.append(renderAbstention('Evolution', 'The corpus did not provide two dated exact citations.'));
      return;
    }
    chamber.facts.forEach((fact, index) => {
      const wrapper = create('div', 'tribunal-timeline-item');
      wrapper.append(
        create('time', '', fact.at),
        renderFact(fact, index)
      );
      target.append(wrapper);
    });
    target.append(renderInference(chamber.inference));
  }

  function renderChallenge(chamber) {
    const target = elements.chambers.challenge;
    clear(target);
    if (chamber.status !== 'supported') {
      target.append(renderAbstention('Challenge', 'No explicit corpus relation supported a counterclaim.'));
      return;
    }
    const thesis = create('div', 'tribunal-side');
    thesis.append(create('p', 'tribunal-label', 'Thesis evidence'));
    chamber.thesisFacts.forEach((fact, index) => thesis.append(renderFact(fact, index)));
    const challenge = create('div', 'tribunal-side tribunal-side-challenge');
    challenge.append(
      create('p', 'tribunal-label', `Strongest challenge · ${chamber.strongestFact.relation}`),
      renderFact(chamber.strongestFact, 0)
    );
    target.append(thesis, challenge, renderInference(chamber.inference));
  }

  function renderCitations(citations) {
    clear(elements.citationList);
    elements.citationCount.textContent =
      `${citations.length} validated citation${citations.length === 1 ? '' : 's'}`;
    citations.forEach((citation, index) => {
      const item = create('article', 'tribunal-citation');
      const heading = create('h3', '', `${index + 1}. ${citation.title}`);
      const source = create('a', '', citation.sourceUrl);
      source.href = citation.sourceUrl;
      const evidence = citation.locator.kind === 'text'
        ? citation.quote
        : JSON.stringify(citation.value);
      item.append(
        heading,
        create('p', '', evidence),
        source,
        create(
          'code',
          '',
          `${citation.sourceId}\n${locatorText(citation)}\nsha256:${citation.sourceSha256}`
        )
      );
      elements.citationList.append(item);
    });
  }

  function render(result) {
    const supported = result.status !== 'abstained';
    elements.verdict.textContent = supported
      ? 'Supported, with boundaries'
      : 'The tribunal abstains';
    elements.verdictSummary.textContent = supported
      ? `${result.citations.length} exact citations survived validation. Facts and inferences remain separate below.`
      : 'The corpus could not support an answer, so no inference was published.';
    renderAnswer(result.chambers.answer);
    renderEvolution(result.chambers.evolution);
    renderChallenge(result.chambers.challenge);
    renderCitations(result.citations);
  }

  function dispatch(action, input) {
    if (action !== 'tribunal.run') {
      return Promise.resolve({
        ok: false,
        action,
        error: { code: 'UNKNOWN_ACTION', message: 'Unknown semantic action.' }
      });
    }
    const question = input && typeof input.question === 'string'
      ? input.question
      : '';
    const result = tribunal.run(question, { limit: 6 });
    render(result);
    return Promise.resolve({ ok: true, action, data: result });
  }

  async function boot() {
    try {
      const [corpusResponse, receiptResponse] = await Promise.all([
        fetch(CORPUS_URL, { cache: 'no-store', credentials: 'same-origin' }),
        fetch(RECEIPT_URL, { cache: 'no-store', credentials: 'same-origin' })
      ]);
      if (!corpusResponse.ok || !receiptResponse.ok) {
        throw new Error('The corpus or committed receipt could not be loaded.');
      }
      const corpus = await corpusResponse.json();
      const receipt = await receiptResponse.json();
      const validation = window.KodyTwinEngine.validateCorpus(corpus);
      if (!validation.ok || receipt.corpusSha256 !== corpus.corpusSha256) {
        throw new Error('The receipt does not match the validated corpus.');
      }
      const engine = window.KodyTwinEngine.createEngine(corpus);
      tribunal = window.KodyEvidenceTribunalCore.createTribunal(engine);
      const replay = tribunal.run(receipt.question, { limit: 6 });
      if (JSON.stringify(replay) !== JSON.stringify(receipt.result)) {
        throw new Error('The committed hearing did not replay byte-for-byte.');
      }
      receiptVerified = true;
      render(replay);
      elements.status.textContent =
        `Receipt verified · ${corpus.stats.total.toLocaleString()} public records · ${receipt.receiptSha256.slice(0, 12)}…`;
      elements.submit.disabled = false;
      window.KodyEvidenceTribunal = Object.freeze({
        capabilities: Object.freeze({
          version: '1.0.0',
          action: 'tribunal.run',
          route: '/public-twin/tribunal/',
          jsonOnly: true
        }),
        inspect() {
          return {
            ready: true,
            receiptVerified,
            corpus: tribunal.inspect().corpus
          };
        },
        dispatch
      });
    } catch (error) {
      elements.status.textContent = `Tribunal unavailable: ${error.message}`;
      elements.verdict.textContent = 'The tribunal abstains';
      elements.verdictSummary.textContent =
        'Validation failed, so the surface refused to publish a claim.';
      Object.keys(elements.chambers).forEach((name) => {
        clear(elements.chambers[name]);
        elements.chambers[name].append(
          renderAbstention(name, 'Runtime validation did not complete.')
        );
      });
    }
  }

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!tribunal) {
      return;
    }
    dispatch('tribunal.run', { question: elements.question.value.trim() });
  });

  boot();
})();
