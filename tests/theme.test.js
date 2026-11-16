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

function img(src, darkSrc = null) {
  return {
    src,
    dataset: darkSrc ? { lightSrc: src, darkSrc } : {},
    getAttribute(name) { return this[name]; },
    setAttribute(name, value) { this[name] = value; },
  };
}
function simulate(ua, initialPrefersDark) {
  const illustration = img('assets/images/com-900.png');
  const images = logos.map(([light, dark]) =>
    img(`assets/images/${light}`, `assets/images/${dark}`));
  const html = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const meta = { attrs: { content: 'light dark' }, setAttribute(k, v) { this.attrs[k] = v; } };
  const listeners = {};
  const query = {
    matches: initialPrefersDark,
    addEventListener(type, callback) { listeners[type] = callback; },
  };
  const context = {
    navigator: { userAgent: ua },
    window: { matchMedia: () => query },
    document: {
      readyState: 'complete',
      documentElement: html,
      querySelector: selector => selector === 'meta[name="color-scheme"]' ? meta : null,
      querySelectorAll(selector) {
        if (selector === '.features-image') return [illustration];
        if (selector === '.trusted__logo[data-dark-src][data-light-src]') return images;
        return [];
      },
    },
  };
  vm.runInNewContext(source + '\nthis.ThemeManager = ThemeManager;', context);
  return { manager: context.ThemeManager, html, illustration, images, meta, query, listeners };
}
function expectTheme(site, dark) {
  assert.equal(site.manager.getTheme(), dark ? 'dark' : 'light');
  assert.equal(site.html.attrs['data-theme'], dark ? 'dark' : 'light');
  assert.equal(site.meta.attrs.content, dark ? 'dark' : 'light');
  assert.equal(site.illustration.src, `assets/images/com-900${dark ? '-white' : ''}.png`);
  for (const [i, [light, white]] of logos.entries()) {
    assert.equal(site.images[i].src, `assets/images/${dark ? white : light}`);
  }
}

const samsungUa = 'Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/125 Mobile';
const samsungLight = simulate(samsungUa, false);
expectTheme(samsungLight, false); // Essential: Samsung + phone light != site dark.
// Changing the OS preference while the page is open must switch all images too.
samsungLight.query.matches = true;
samsungLight.listeners.change();
expectTheme(samsungLight, true);
samsungLight.query.matches = false;
samsungLight.listeners.change();
expectTheme(samsungLight, false);
const samsungDark = simulate(samsungUa, true);
expectTheme(samsungDark, true);
samsungDark.manager.setTheme('light');
expectTheme(samsungDark, false);
samsungDark.manager.setTheme('auto');
expectTheme(samsungDark, true);

const desktop = simulate('Mozilla/5.0 (Windows NT 10.0) Chrome/126', true);
expectTheme(desktop, false); // Desktop still defaults to light.
const miui = simulate('Mozilla/5.0 (Linux; Android 14) MiuiBrowser/17', true);
expectTheme(miui, true);

for (const locale of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(ROOT, locale), 'utf8');
  for (const [light, white] of logos) {
    assert(html.includes(`data-light-src="assets/images/${light}"`), `${locale}: ${light}`);
    assert(html.includes(`data-dark-src="assets/images/${white}"`), `${locale}: ${white}`);
    assert(fs.existsSync(path.join(ROOT, 'assets/images', white)), `Missing ${white}`);
  }
  assert.equal((html.match(/data-dark-src="assets\/images\//g) || []).length, 8,
    `${locale}: exactly 8 dark partner logos`);
}
assert.match(css, /html\[data-theme="dark"\] \.trusted__logo\s*\{\s*filter:\s*none;/);
assert(!source.includes('theme-compat-toggle'), 'Do not add a visitor-facing toggle');
console.log('PASS: Samsung device light/dark, changes while open, image switching, 8 partner logos, English parity');
