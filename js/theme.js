/*
 * Android browser darkening compatibility.
 * Samsung Internet's "Force Dark mode for web content" may not update
 * prefers-color-scheme or expose transformed colors to getComputedStyle().
 * There is no reliable web API to read that browser setting.
 *
 * In auto mode we therefore DEFAULT to the custom dark palette on Samsung
 * Internet for Android, and offer a per-site Light/Dark override in the header.
 * Ordinary desktop browsers always remain light unless explicitly overridden.
 */
const ThemeManager = (() => {
  const KEY = 'astelkom_theme_preference';
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isSamsung = isAndroid && /SamsungBrowser/i.test(ua);
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function preference() {
    try { const p = localStorage.getItem(KEY); return p === 'dark' || p === 'light' ? p : 'auto'; }
    catch { return 'auto'; }
  }

  function isDark(mode = preference()) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // Samsung Internet's force-dark state is not reliably observable.
    if (isSamsung) return true;
    // Other mobile browsers honouring the media query (e.g. some MIUI/WebViews).
    return isAndroid && /MiuiBrowser|wv\)/i.test(ua) && darkQuery.matches;
  }

  function setMeta(scheme) {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'color-scheme';
      document.head.prepend(meta);
    }
    meta.setAttribute('content', scheme);
  }

  function apply(mode = preference()) {
    const dark = isDark(mode);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'only light';
    setMeta(dark ? 'dark' : 'only light');
    document.querySelectorAll('.features-image').forEach(img => {
      const src = dark ? 'assets/images/com-900-white.png' : 'assets/images/com-900.png';
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
    document.querySelectorAll('.theme-compat-toggle').forEach(btn => {
      const next = dark ? 'light' : 'dark';
      btn.setAttribute('aria-label', next === 'light' ? 'Use light theme' : 'Use dark theme');
      btn.setAttribute('title', next === 'light' ? 'Use light theme' : 'Use dark theme');
      btn.setAttribute('aria-pressed', String(dark));
      btn.textContent = dark ? '☀' : '☾';
    });
  }

  function setTheme(mode) {
    if (!['auto', 'dark', 'light'].includes(mode)) return;
    try { if (mode === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); }
    catch { /* Still update the current page. */ }
    apply(mode);
  }

  function addSamsungOverride() {
    // Only Samsung Internet needs the fallback override; desktop UI stays unchanged.
    if (!isSamsung || document.querySelector('.theme-compat-toggle')) return;
    const holder = document.querySelector('.header__utils') || document.querySelector('.header__top-controls');
    if (!holder) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-compat-toggle';
    btn.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'));
    holder.prepend(btn);
    apply();
  }

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { apply(); addSamsungOverride(); }, { once: true });
  } else addSamsungOverride();
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', () => { if (preference() === 'auto') apply(); });
  else if (darkQuery.addListener) darkQuery.addListener(() => { if (preference() === 'auto') apply(); });
  return { setTheme, getTheme: () => (isDark() ? 'dark' : 'light') };
})();
