/*
 * Theme compatibility for Android browsers.
 *
 * Samsung Internet has its own user-controlled "Force Dark mode for web content"
 * feature. It can darken pages independently of CSS and does not reliably expose
 * that switch to JavaScript. Do not force the site's custom dark CSS merely
 * because Samsung Internet is detected: this can lead to double-darkening and
 * make images or logos unreadable.
 *
 * On Samsung Internet, leave the site's light palette alone and let the
 * browser honor the visitor's own dark-mode setting. No site theme toggle.
 * The original custom dark palette is left intact for browsers that support it.
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

    // Samsung handles forced darkening itself. User-agent detection cannot tell
    // whether the visitor enabled it. Do not apply a second dark theme.
    if (isSamsungInternet) return false;

    // Other Android browsers can opt into the site's original dark palette.
    return isAndroid && /MiuiBrowser|wv\)/i.test(ua) && darkQuery.matches;
  }

  function applyTheme() {
    const dark = shouldUseCustomDark(currentMode);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Keep Samsung Internet's native color handling in control. In particular,
    // don't set `only light`, which can suppress browser-provided darkening.
    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme && !isSamsungInternet) {
      scheme.setAttribute('content', dark ? 'dark' : 'light dark');
    }

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
