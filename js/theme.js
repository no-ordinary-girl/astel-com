/*
 * Android authored-theme compatibility experiment.
 *
 * Samsung Internet and Xiaomi's Mi Browser sometimes apply their own darkening
 * even when the website has authored dark CSS. We cannot read or override those
 * browsers' force-dark preferences reliably. Keep the standard declaration
 * <meta name="color-scheme" content="light dark"> intact; when the reported
 * user preference is dark, use Astel-Com's original [data-theme="dark"] CSS.
 *
 * A CSS-only "only dark"/"only light" safeguard is scoped to the two affected
 * browsers. Unsupported browsers safely ignore the "only" keyword. This is
 * best effort, not a way to defeat browser-enforced recoloring.
 */
const ThemeManager = (() => {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isSamsungInternet = isAndroid && /SamsungBrowser/i.test(ua);
  const isXiaomiBrowser = isAndroid && /MiuiBrowser|XiaoMiBrowser/i.test(ua);
  const isAndroidWebView = isAndroid && /; wv\)/i.test(ua);
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let currentMode = 'auto';

  // Applied before CSS loads because this script is already in <head>.
  // The browser signal is for a CSS compatibility rule, never for UI changes.
  if (isSamsungInternet) {
    document.documentElement.setAttribute('data-theme-browser', 'samsung');
  } else if (isXiaomiBrowser) {
    document.documentElement.setAttribute('data-theme-browser', 'xiaomi');
  }

  function shouldUseCustomDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // Do not turn Samsung's light-phone appearance dark automatically.
    return (isSamsungInternet || isXiaomiBrowser || isAndroidWebView) && darkQuery.matches;
  }

  function applyTheme() {
    const dark = shouldUseCustomDark(currentMode);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Do NOT rewrite the two-scheme <meta> to just "dark" or "light": Samsung
    // uses that early declaration when deciding whether authored CSS is present.
    document.querySelectorAll('.features-image').forEach((img) => {
      const src = dark ? 'assets/images/com-900-white.png' : 'assets/images/com-900.png';
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });

    // Use the existing supplied white partner logos, without color filters.
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
    // For dev/testing only; intentionally no visitor-facing theme switcher.
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
