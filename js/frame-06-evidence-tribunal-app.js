(() => {
  'use strict';

  const CORPUS_URL = '/api/twin-corpus.json';
  const RECEIPT_URL = '/api/frame-06-evidence-tribunal.json';
  const SHELL_MANIFEST_URL = '/public-twin/shell-manifest.json';
  const SHA256 = /^[0-9a-f]{64}$/;
  const elements = {
    form: document.getElementById('tribunal-form'),
    question: document.getElementById('tribunal-question'),
    submit: document.getElementById('tribunal-submit'),
    status: document.getElementById('tribunal-runtime-status'),
    verdict: document.getElementById('tribunal-verdict-heading'),
    verdictSummary: document.getElementById('tribunal-verdict-summary'),
    resultStatus: document.getElementById('tribunal-result-status'),
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
  let hearingCount = 0;

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

  function responseType(response) {
    return (response.headers.get('Content-Type') || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
  }

  function requireJsonResponse(response, label) {
    if (!response.ok || responseType(response) !== 'application/json') {
      throw new Error(`${label} did not return validated JSON.`);
    }
  }

  async function sha256Bytes(value) {
    const digest = await crypto.subtle.digest('SHA-256', value);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function sha256Text(value) {
    return sha256Bytes(new TextEncoder().encode(value));
  }

  function validShellManifest(manifest) {
    return manifest &&
      manifest.schema === 'kodyw-twin-shell/1.0' &&
      typeof manifest.releaseSha256 === 'string' &&
      SHA256.test(manifest.releaseSha256) &&
      typeof manifest.sourceSha256 === 'string' &&
      SHA256.test(manifest.sourceSha256) &&
      Array.isArray(manifest.assets);
  }

  function receiptAsset(manifest) {
    const matches = manifest.assets.filter((asset) =>
      asset.url === RECEIPT_URL &&
      typeof asset.sha256 === 'string' &&
      SHA256.test(asset.sha256) &&
      Array.isArray(asset.contentTypes) &&
      asset.contentTypes.includes('application/json')
    );
    return matches.length === 1 ? matches[0] : null;
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return 'offline shell unavailable';
    }
    const registration = await navigator.serviceWorker.register(
      '/public-twin/sw.js',
      {
        scope: '/public-twin/',
        updateViaCache: 'none'
      }
    );
    return registration.scope ? 'offline shell registered' : 'offline shell pending';
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

  function render(result, announce) {
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
    if (announce) {
      hearingCount += 1;
      elements.resultStatus.textContent = supported
        ? `Hearing ${hearingCount} complete. ${result.citations.length} validated citations. Answer, Evolution, and Challenge results are ready below.`
        : `Hearing ${hearingCount} complete. The tribunal abstained because the corpus could not support the answer.`;
    }
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
    render(result, true);
    return Promise.resolve({ ok: true, action, data: result });
  }

  async function boot() {
    try {
      const workerRegistration = registerServiceWorker().catch(() =>
        'offline shell registration failed'
      );
      const [corpusResponse, receiptResponse, manifestResponse] = await Promise.all([
        fetch(CORPUS_URL, { cache: 'no-store', credentials: 'same-origin' }),
        fetch(RECEIPT_URL, { cache: 'no-store', credentials: 'same-origin' }),
        fetch(SHELL_MANIFEST_URL, {
          cache: 'no-store',
          credentials: 'same-origin'
        })
      ]);
      requireJsonResponse(corpusResponse, 'The corpus');
      requireJsonResponse(receiptResponse, 'The committed receipt');
      requireJsonResponse(manifestResponse, 'The Twin shell manifest');
      const corpus = await corpusResponse.json();
      const receiptBytes = await receiptResponse.arrayBuffer();
      const receiptText = new TextDecoder().decode(receiptBytes);
      const receipt = JSON.parse(receiptText);
      const shellManifest = await manifestResponse.json();
      const validation = window.KodyTwinEngine.validateCorpus(corpus);
      const declaredReceipt = validShellManifest(shellManifest)
        ? receiptAsset(shellManifest)
        : null;
      if (!validation.ok || !declaredReceipt ||
          await sha256Bytes(receiptBytes) !== declaredReceipt.sha256) {
        throw new Error('The receipt is not part of the validated Twin release.');
      }
      const engine = window.KodyTwinEngine.createEngine(corpus);
      tribunal = window.KodyEvidenceTribunalCore.createTribunal(engine);
      const receiptValidation = await tribunal.verifyReceipt(
        receipt,
        {
          releaseSha256: shellManifest.releaseSha256,
          sourceManifestSha256: corpus.sourceManifestSha256,
          corpusSha256: corpus.corpusSha256
        },
        sha256Text
      );
      if (!receiptValidation.ok) {
        throw new Error(`Receipt verification failed: ${receiptValidation.code}.`);
      }
      receiptVerified = true;
      render(receipt.result, false);
      const workerState = await workerRegistration;
      elements.status.textContent =
        `Receipt verified · ${corpus.stats.total.toLocaleString()} public records · ${workerState} · ${receipt.receiptSha256.slice(0, 12)}…`;
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
