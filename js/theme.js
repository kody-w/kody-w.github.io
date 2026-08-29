// Dark mode toggle with localStorage persistence and system preference detection
(function () {
  var toggle = document.getElementById('theme-toggle');
  var icon = toggle ? toggle.querySelector('i') : null;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      // The visual theme still works when browser persistence is unavailable.
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // Initialize: stored preference > system preference > light
  var initialTheme = storedTheme();
  if (initialTheme) {
    applyTheme(initialTheme);
  } else if (systemDark.matches) {
    applyTheme('dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      applyTheme(next);
    });
  }

  // React to system preference changes (only if no stored preference)
  systemDark.addEventListener('change', function (e) {
    if (!storedTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
})();
