// Learn with Kody — copy-prompt button
(function () {
  const btn = document.querySelector('.lwk-copy-btn');
  if (!btn) return;
  const targetId = btn.dataset.copyTarget;
  const target = targetId && document.getElementById(targetId);
  if (!target) return;

  const labelEl = btn.querySelector('.lwk-copy-label');
  const original = labelEl ? labelEl.textContent : 'Copy';

  btn.addEventListener('click', async () => {
    const text = target.value || target.textContent || '';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        target.removeAttribute('aria-hidden');
        target.style.position = 'absolute';
        target.style.left = '-9999px';
        target.select();
        document.execCommand('copy');
        target.setAttribute('aria-hidden', 'true');
        target.style.position = '';
        target.style.left = '';
      }
      btn.classList.add('is-copied');
      if (labelEl) labelEl.textContent = 'Copied';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        if (labelEl) labelEl.textContent = original;
      }, 1600);
    } catch (e) {
      if (labelEl) labelEl.textContent = 'Press Ctrl+C';
    }
  });
})();
