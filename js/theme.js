/*
 * Android theme compatibility.
 *
 * Use the device/browser-exposed color-scheme preference, including in
 * Samsung Internet. Never force dark mode merely because Samsung Internet
 * is installed: visitors using a light preference must see the light site.
 *
 * Samsung Internet's separate "Force Dark mode for web content" setting
 * is not reliably exposed to JavaScript; it can still recolor the website
 * independently of the custom CSS. The website cannot reliably override
 * that browser setting.
 */
const ThemeManager = (() => {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isSamsungInternet = isAndroid && /SamsungBrowser/i.test(ua);
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let currentMode = 'auto';

  function shouldUseCustomDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;

    // Only use the authored dark palette when Android reports a dark
    // preference. Do not force dark on Samsung Internet in phone light mode.
    const isSupportedAndroidBrowser = isSamsungInternet || /MiuiBrowser|wv\)/i.test(ua);
    return isAndroid && isSupportedAndroidBrowser && darkQuery.matches;
  }

  function applyTheme() {
    const dark = shouldUseCustomDark(currentMode);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Tell browsers this page ALREADY supplies its dark colors, so they can
    // prefer the authored palette to automatic recoloring when supported.
    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute('content', dark ? 'dark' : 'light');

    document.querySelectorAll('.features-image').forEach((img) => {
      const src = dark
        ? 'assets/images/com-900-white.png'
        : 'assets/images/com-900.png';
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });

    // Use real white logo assets rather than a CSS invert filter. Source
    // paths are relative to the document's <base> so this also works in /en/.
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
    // Kept for internal/dev compatibility; no theme control is shown to visitors.
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
