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

function img(src, darkSrc) {
  return {
    src, dataset: darkSrc ? { lightSrc: src, darkSrc } : {},
    getAttribute(k) { return this[k]; }, setAttribute(k, v) { this[k] = v; },
  };
}
function simulate(ua, prefersDark) {
  const illustration = img('assets/images/com-900.png');
  const images = logos.map(([light, dark]) =>
    img(`assets/images/${light}`, `assets/images/${dark}`));
  const html = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const meta = { attrs: { content: 'light dark' }, setAttribute(k, v) { this.attrs[k] = v; } };
  const listeners = {};
  const query = { matches: prefersDark, addEventListener(kind, fn) { listeners[kind] = fn; } };
  const context = {
    navigator: { userAgent: ua },
    window: { matchMedia: () => query },
    document: {
      readyState: 'complete', documentElement: html,
      querySelector: () => meta,
      querySelectorAll(selector) {
        if (selector === '.features-image') return [illustration];
        if (selector === '.trusted__logo[data-dark-src][data-light-src]') return images;
        return [];
      },
    },
  };
  vm.runInNewContext(source + '\nthis.ThemeManager = ThemeManager;', context);
  return { manager: context.ThemeManager, html, meta, illustration, images, query, listeners };
}
function expectTheme(site, dark, browser) {
  assert.equal(site.manager.getTheme(), dark ? 'dark' : 'light');
  assert.equal(site.html.attrs['data-theme'], dark ? 'dark' : 'light');
  assert.equal(site.html.attrs['data-theme-browser'], browser);
  assert.equal(site.meta.attrs.content, 'light dark', 'The supported scheme declaration must stay intact');
  assert.equal(site.illustration.src, `assets/images/com-900${dark ? '-white' : ''}.png`);
  for (const [i, [light, white]] of logos.entries()) {
    assert.equal(site.images[i].src, `assets/images/${dark ? white : light}`);
  }
}
const samsungUA = 'Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/125 Mobile';
const xiaomiUA = 'Mozilla/5.0 (Linux; Android 15; POCO) Chrome/123 Mobile Safari/537.36 XiaoMi/MiuiBrowser/14.44';
for (const [ua, browser] of [[samsungUA, 'samsung'], [xiaomiUA, 'xiaomi']]) {
  const site = simulate(ua, false);
  expectTheme(site, false, browser); // Phone light must remain light.
  site.query.matches = true;
  site.listeners.change();
  expectTheme(site, true, browser);  // The original dark CSS and logos activate.
  site.query.matches = false;
  site.listeners.change();
  expectTheme(site, false, browser);
  site.manager.setTheme('dark');
  expectTheme(site, true, browser);
  site.manager.setTheme('auto');
  expectTheme(site, false, browser);
}
for (const [ua, dark] of [
  ['Mozilla/5.0 (Windows NT 10.0) Chrome/126', false],
  ['Mozilla/5.0 (Linux; Android 15) Chrome/126 Mobile Safari', false],
]) {
  const site = simulate(ua, true);
  expectTheme(site, dark, undefined);
}
for (const locale of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(ROOT, locale), 'utf8');
  assert.match(html, /<meta name="color-scheme" content="light dark" \/>/,
    `${locale} must advertise both authored themes`);
  for (const [light, white] of logos) {
    assert(html.includes(`data-light-src="assets/images/${light}"`));
    assert(html.includes(`data-dark-src="assets/images/${white}"`));
    assert(fs.existsSync(path.join(ROOT, 'assets/images', white)));
  }
}
assert.match(css, /html\[data-theme-browser="samsung"\]\[data-theme="dark"\]/);
assert.match(css, /html\[data-theme-browser="xiaomi"\]\[data-theme="light"\]/);
assert.match(css, /color-scheme: only dark/);
assert.match(css, /color-scheme: only light/);
assert.match(css, /html\[data-theme="dark"\] \.trusted__logo\s*\{\s*filter:\s*none;/);
assert(!source.includes('theme-compat-toggle'));
console.log('PASS: Samsung/Xiaomi authored color scheme signals, original assets, light/dark preferences, no toggle');
