#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../js/theme.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/global.css'), 'utf8');

function simulate(ua, prefersDark) {
  const images = [
    { src: 'assets/images/com-900.png', getAttribute(k) { return this[k]; }, setAttribute(k, v) { this[k] = v; } },
  ];
  const html = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const meta = { attrs: { content: 'light dark' }, setAttribute(k, v) { this.attrs[k] = v; } };
  const listeners = {};
  const context = {
    navigator: { userAgent: ua },
    window: { matchMedia: () => ({ matches: prefersDark, addEventListener(type, fn) { listeners[type] = fn; } }) },
    document: {
      readyState: 'complete',
      documentElement: html,
      querySelector: selector => selector === 'meta[name="color-scheme"]' ? meta : null,
      querySelectorAll: selector => selector === '.features-image' ? images : [],
    },
  };
  vm.runInNewContext(source + '\nthis.ThemeManager = ThemeManager;', context);
  return { manager: context.ThemeManager, html, images, meta, listeners };
}

for (const prefersDark of [false, true]) {
  const samsung = simulate('Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/125 Mobile', prefersDark);
  assert.equal(samsung.html.attrs['data-theme'], 'dark', 'Samsung must render the custom dark theme');
  assert.equal(samsung.meta.attrs.content, 'dark', 'Indicate authored dark palette to browser');
  assert.equal(samsung.images[0].src, 'assets/images/com-900-white.png', 'Use the white line drawing');
  assert.equal(samsung.manager.getTheme(), 'dark');
  samsung.manager.setTheme('light');
  assert.equal(samsung.manager.getTheme(), 'light', 'Explicit programmatic light mode remains available');
  assert.equal(samsung.meta.attrs.content, 'light');
  assert.equal(samsung.images[0].src, 'assets/images/com-900.png');
  samsung.manager.setTheme('auto');
  assert.equal(samsung.manager.getTheme(), 'dark', 'Auto restores authored dark on Samsung');
}

const desktop = simulate('Mozilla/5.0 (Windows NT 10.0) Chrome/126', true);
assert.equal(desktop.manager.getTheme(), 'light');
assert.equal(desktop.meta.attrs.content, 'light');
const miui = simulate('Mozilla/5.0 (Linux; Android 14) MiuiBrowser/17', true);
assert.equal(miui.manager.getTheme(), 'dark');
assert.equal(miui.images[0].src, 'assets/images/com-900-white.png');

assert(!source.includes('theme-compat-toggle'), 'No injected Samsung theme toggle');
assert(!css.includes('.theme-compat-toggle'), 'No unused toggle styling');
assert(!source.includes("'only light'"), 'No forced only-light scheme override');
assert(css.includes('html[data-theme="dark"] .trusted__logo'), 'Preserve original partner logo contrast rules');
console.log('PASS: Samsung custom dark theme, no toggle, desktop and Android theme branches');
