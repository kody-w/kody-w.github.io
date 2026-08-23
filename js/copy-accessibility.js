// Accessible, dependency-free copy controls for code and explicitly marked AI prompts.
(function (window, document) {
  'use strict';

  const ENHANCED = 'copyEnhanced';
  const LINE_NUMBER_SELECTOR = '.lineno, .line-number, [data-line-number], .rouge-gutter';

  function stableHash(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function extractText(code) {
    const clean = code.cloneNode(true);
    if (typeof clean.querySelectorAll === 'function') {
      clean.querySelectorAll(LINE_NUMBER_SELECTOR).forEach((node) => node.remove());
    }
    return clean.textContent || '';
  }

  function restoreSelection(selection, ranges) {
    if (!selection) return;
    try {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    } catch (error) {
      // A saved range can become stale if the page changes during a copy.
    }
  }

  function focusWithoutScrolling(element) {
    if (!element || typeof element.focus !== 'function') return;
    try {
      element.focus({ preventScroll: true });
    } catch (error) {
      try {
        element.focus();
      } catch (focusError) {
        // Copying can still succeed when a sandbox blocks scripted focus.
      }
    }
  }

  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    const selection = window.getSelection ? window.getSelection() : null;
    const ranges = [];
    const activeElement = document.activeElement;

    if (selection) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        ranges.push(selection.getRangeAt(index).cloneRange());
      }
    }

    textarea.value = text;
    textarea.readOnly = true;
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    let copied = false;
    try {
      focusWithoutScrolling(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      copied = typeof document.execCommand === 'function' && document.execCommand('copy');
    } catch (error) {
      copied = false;
    } finally {
      textarea.remove();
      restoreSelection(selection, ranges);
      focusWithoutScrolling(activeElement);
    }

    return copied;
  }

  async function copyText(text) {
    try {
      if (window.isSecureContext && window.navigator.clipboard &&
          typeof window.navigator.clipboard.writeText === 'function') {
        await window.navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // Sandboxed frames can expose the API while denying clipboard access.
    }
    return legacyCopy(text);
  }

  function selectSource(source) {
    const selection = window.getSelection && window.getSelection();
    if (!selection || !document.createRange) return;
    focusWithoutScrolling(source);
    const range = document.createRange();
    range.selectNodeContents(source);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function highlightPrompt(prompt) {
    if (prompt.dataset.copyHighlighted === 'true') return;
    prompt.dataset.copyHighlighted = 'true';
    const encodedHighlights = prompt.dataset.highlights;
    if (!encodedHighlights) return;

    let highlights;
    try {
      highlights = JSON.parse(encodedHighlights);
    } catch (error) {
      return;
    }

    if (!Array.isArray(highlights)) highlights = [highlights];
    const terms = Array.from(new Set(
      highlights.filter((term) => typeof term === 'string' && term.length)
    )).sort((left, right) => right.length - left.length);
    if (!terms.length) return;

    const escapePattern = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(terms.map(escapePattern).join('|'), 'g');
    const text = prompt.textContent;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      fragment.appendChild(document.createTextNode(text.slice(offset, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'lwk-prompt-key';
      mark.textContent = match[0];
      fragment.appendChild(mark);
      offset = match.index + match[0].length;
    }

    if (!offset) return;
    fragment.appendChild(document.createTextNode(text.slice(offset)));
    prompt.textContent = '';
    prompt.appendChild(fragment);
  }

  function setCopyState(button, status, kind, copied, source) {
    const label = button.querySelector('.copy-button-label, .lwk-copy-label');
    const originalLabel = button.dataset.copyLabel || `Copy ${kind}`;
    window.clearTimeout(Number(button.dataset.copyTimer || 0));
    button.classList.toggle('is-copied', copied);

    if (copied) {
      if (label) label.textContent = 'Copied';
      status.textContent = `${kind[0].toUpperCase()}${kind.slice(1)} copied to clipboard.`;
    } else {
      selectSource(source);
      if (label) label.textContent = 'Press Ctrl/Cmd+C';
      status.textContent = `Automatic copy is unavailable. The complete ${kind} is selected; press Control or Command plus C to copy.`;
    }

    const timer = window.setTimeout(() => {
      button.classList.remove('is-copied');
      if (label) label.textContent = originalLabel;
    }, copied ? 1600 : 5000);
    button.dataset.copyTimer = String(timer);
  }

  function bindCopy(button, status, source, kind, getText) {
    if (button.dataset[ENHANCED] === 'true') return;
    button.dataset[ENHANCED] = 'true';
    button.dataset.copyLabel = `Copy ${kind}`;
    button.addEventListener('click', async () => {
      status.textContent = '';
      const copied = await copyText(getText());
      setCopyState(button, status, kind, copied, source);
    });
  }

  function uniqueAnchor(text, doc) {
    const base = `code-${stableHash(text)}`;
    let anchor = base;
    let suffix = 2;
    while (doc.getElementById(anchor)) {
      anchor = `${base}-${suffix}`;
      suffix += 1;
    }
    return anchor;
  }

  function enhanceCode(code) {
    if (code.closest('[data-copy-prompt], .lwk-prompt, .lineno, .rouge-gutter, [data-no-copy]')) return;
    const pre = code.parentElement;
    if (!pre || pre.dataset[ENHANCED] === 'true') return;

    const text = extractText(code);
    const wrapper = document.createElement('div');
    const toolbar = document.createElement('div');
    const anchor = document.createElement('a');
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const label = document.createElement('span');
    const status = document.createElement('span');
    const anchorId = uniqueAnchor(text, document);
    const statusId = `${anchorId}-status`;

    wrapper.className = 'copy-code-block';
    wrapper.dataset.copyCode = 'true';
    wrapper.id = anchorId;
    toolbar.className = 'copy-code-toolbar';
    anchor.className = 'copy-code-anchor';
    anchor.href = `#${anchorId}`;
    anchor.setAttribute('aria-label', 'Link to this code block');
    anchor.textContent = '#';
    button.type = 'button';
    button.className = 'copy-code-button';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('aria-describedby', statusId);
    icon.className = 'copy-code-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '⧉';
    label.className = 'copy-button-label';
    label.textContent = 'Copy code';
    status.className = 'copy-code-status';
    status.id = statusId;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(toolbar);
    toolbar.appendChild(anchor);
    button.appendChild(icon);
    button.appendChild(label);
    toolbar.appendChild(button);
    wrapper.appendChild(pre);
    wrapper.appendChild(status);
    pre.dataset[ENHANCED] = 'true';
    bindCopy(button, status, code, 'code', () => extractText(code));
  }

  function enhancePrompt(section) {
    const prompt = section.querySelector('.ai-prompt-text, .lwk-prompt-text');
    const button = section.querySelector('[data-copy-action="prompt"], .lwk-copy-btn');
    const status = section.querySelector('.lwk-copy-status');
    if (!prompt || !button || !status) return;
    highlightPrompt(prompt);
    bindCopy(button, status, prompt, 'prompt', () => prompt.textContent || '');
  }

  function init(root) {
    const scope = root || document;
    scope.querySelectorAll('pre > code').forEach(enhanceCode);
    scope.querySelectorAll('[data-copy-prompt], .lwk-prompt').forEach(enhancePrompt);
  }

  window.CopyAccessibility = Object.freeze({
    init,
    copyText,
    extractText,
    stableHash
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  } else {
    init(document);
  }
})(window, document);
