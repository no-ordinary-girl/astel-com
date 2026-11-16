/*
 * Light theme by default (independent of the operating system).
 *
 * The site starts in its authored light theme on every platform, including
 * systems that prefer dark colors. The existing custom dark CSS is retained for
 * future/manual development use, but there is no visitor-facing theme toggle.
 *
 * Browser-enforced darkening (e.g. Samsung Internet's Force Dark) may still
 * override the authored palette; this API cannot detect or disable it.
 */
const ThemeManager = (() => {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let currentMode = 'light';

  function shouldUseCustomDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return darkQuery.matches;
  }

  function applyTheme() {
    const dark = shouldUseCustomDark(currentMode);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // HTML metadata advertises the light theme; CSS opts out of automatic
    // browser darkening where supported.
    document.querySelectorAll('.features-image').forEach((img) => {
      const src = dark ? 'assets/images/com-900-white.png' : 'assets/images/com-900.png';
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });

    // Use the supplied white partner logos only for the custom dark theme.
    document.querySelectorAll('.trusted__logo[data-dark-src][data-light-src]').forEach((img) => {
      const src = dark ? img.dataset.darkSrc : img.dataset.lightSrc;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
  }

  const onPreferenceChange = () => {
    if (currentMode === 'auto') applyTheme();
  };
  if (darkQuery.addEventListener) {
    darkQuery.addEventListener('change', onPreferenceChange);
  } else if (darkQuery.addListener) {
    darkQuery.addListener(onPreferenceChange);
  }

  return {
    // Developer-only override; visitors always start in light mode.
    setTheme(mode = 'auto') {
      if (!['auto', 'dark', 'light'].includes(mode)) return;
      currentMode = mode;
      applyTheme();
    },
    getTheme() {
      return shouldUseCustomDark(currentMode) ? 'dark' : 'light';
    },
  };
})();
