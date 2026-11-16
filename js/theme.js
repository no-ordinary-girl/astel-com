/*
 * Theme compatibility for Android browsers.
 *
 * Restore the site's ORIGINAL custom dark theme on Samsung Internet.
 * Samsung Internet does not reliably report its "Force Dark mode for web content"
 * setting via prefers-color-scheme, so without a user-facing toggle we favor
 * displaying the custom theme on Samsung Internet rather than letting the
 * browser recolor the light theme. This is a browser-wide fallback: Samsung
 * Internet users who disable force-dark will also see the custom dark theme.
 * The CSS palette, image overrides and other styles are unchanged.
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

    // Favor the site's custom authored dark CSS in Samsung Internet. Its
    // force-dark switch is not reliably observable through browser APIs.
    if (isSamsungInternet) return true;

    // Other Android browsers can opt into the site's original dark palette.
    return isAndroid && /MiuiBrowser|wv\)/i.test(ua) && darkQuery.matches;
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
