#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'js/theme.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/global.css'), 'utf8');
const logos = [
  ['Kyivstar_logo.svg', 'Kyivstar_logo_white.png'],
  ['uz_logo.svg', 'uz_logo_white.png'],
  ['Dtek-logo.svg', 'dtek_logo_white.png'],
  ['nik_logo.svg', 'nik_logo_white.png'],
  ['cherkasy_logo.svg', 'cherkasy_logo_white.png'],
  ['ternopyl_logo.svg', 'ternopyl_logo_white.png'],
  ['vinnytsia_logo.svg', 'vinnytsia_logo_white.png'],
  ['mykolaiv_logo.svg', 'mykolaiv_logo_white.png'],
];

function image(src, darkSrc) {
  return {
    src,
    dataset: darkSrc ? { lightSrc: src, darkSrc } : {},
    getAttribute(name) { return this[name]; },
    setAttribute(name, value) { this[name] = value; },
  };
}

function simulate(ua, prefersDark, domReady = true, legacyListener = false) {
  const illustration = image('assets/images/com-900.png');
  const images = logos.map(([light, dark]) =>
    image(`assets/images/${light}`, `assets/images/${dark}`));
  const html = { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } };
  const meta = { attrs: { content: 'light' } };
  const listeners = {};
  const query = {
    matches: prefersDark,
    ...(legacyListener
      ? { addListener(fn) { listeners.change = fn; } }
      : { addEventListener(type, fn) { listeners[type] = fn; } }),
  };
  const documentListeners = {};
  const context = {
    navigator: { userAgent: ua },
    window: { matchMedia: expression => {
      assert.equal(expression, '(prefers-color-scheme: dark)');
      return query;
    } },
    document: {
      readyState: domReady ? 'complete' : 'loading',
      documentElement: html,
      addEventListener(type, fn) { documentListeners[type] = fn; },
      querySelectorAll(selector) {
        if (selector === '.features-image') return [illustration];
        if (selector === '.trusted__logo[data-dark-src][data-light-src]') return images;
        return [];
      },
    },
  };
  vm.runInNewContext(source + '\nthis.ThemeManager = ThemeManager;', context);
  return { manager: context.ThemeManager, html, meta, illustration, images, query, listeners, documentListeners };
}

function expectTheme(site, dark) {
  assert.equal(site.manager.getTheme(), dark ? 'dark' : 'light');
  assert.equal(site.html.attrs['data-theme'], dark ? 'dark' : 'light');
  assert.equal(site.html.attrs['data-theme-browser'], undefined,
    'Avoid browser-specific theme flags');
  assert.equal(site.meta.attrs.content, 'light', 'Advertise only the light theme');
  assert.equal(site.illustration.src, `assets/images/com-900${dark ? '-white' : ''}.png`);
  for (const [i, [light, white]] of logos.entries()) {
    assert.equal(site.images[i].src, `assets/images/${dark ? white : light}`);
  }
}

for (const ua of [
  'Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/125 Mobile',
  'Mozilla/5.0 (Linux; Android 15; POCO) Chrome/123 MiuiBrowser/14 Mobile',
  'Mozilla/5.0 (Linux; Android 15) Chrome/126 Mobile Safari',
  'Mozilla/5.0 (Windows NT 10.0) Chrome/126',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15',
]) {
  for (const dark of [false, true]) {
    const site = simulate(ua, dark);
    expectTheme(site, false); // Light even if the OS prefers dark.
    site.query.matches = !dark;
    site.listeners.change();
    expectTheme(site, false); // Ignore system changes in default light mode.
    site.manager.setTheme('dark');
    expectTheme(site, true); // Developer-only override still works.
    site.query.matches = false;
    site.listeners.change();
    expectTheme(site, true);
    site.manager.setTheme('auto');
    expectTheme(site, false);
    site.query.matches = true;
    site.listeners.change();
    expectTheme(site, true); // Only explicit developer opt-in follows the OS.
    site.manager.setTheme('light');
    expectTheme(site, false);
  }
}
const legacy = simulate('Legacy Android WebKit', true, false, true);
expectTheme(legacy, false);
assert.equal(typeof legacy.documentListeners.DOMContentLoaded, 'function');
legacy.documentListeners.DOMContentLoaded();
expectTheme(legacy, false);
legacy.query.matches = false;
legacy.listeners.change();
expectTheme(legacy, false);

for (const locale of ['index.html', 'en/index.html']) {
  const markup = fs.readFileSync(path.join(ROOT, locale), 'utf8');
  assert.match(markup, /<meta name="color-scheme" content="light" \/>/,
    `${locale}: page must advertise both schemes`);
  for (const [light, white] of logos) {
    assert(markup.includes(`data-light-src="assets/images/${light}"`));
    assert(markup.includes(`data-dark-src="assets/images/${white}"`));
    assert(fs.existsSync(path.join(ROOT, 'assets/images', white)));
  }
}
assert.match(css, /html\s*\{[^}]*-webkit-tap-highlight-color:\s*transparent;/);
assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid currentColor;[^}]*outline-offset:\s*3px;/);
assert.match(css, /html\[data-theme="dark"\] \.trusted__logo\s*\{\s*filter:\s*none;/);
assert(!css.includes('color-scheme: only dark'));
assert.match(css, /html\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*only light;/);
assert(!source.includes('theme-compat-toggle'));
console.log('PASS: light default on all browsers, preserved optional dark mode, logos, tap/focus styles');
