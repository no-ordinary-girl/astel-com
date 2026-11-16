#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/theme.js'), 'utf8');
function simulate(ua, prefersDark) {
  const memory = {};
  const html = { dataset: {}, style: {} };
  const meta = { setAttribute(name, value) { this[name] = value; } };
  const context = {
    navigator: { userAgent: ua },
    window: { matchMedia: () => ({matches: prefersDark, addEventListener() {}}) },
    document: {
      readyState: 'loading',
      documentElement: html,
      head: {prepend() {}},
      createElement: () => ({setAttribute(name, value) {this[name] = value;}}),
      querySelector: () => meta,
      querySelectorAll: () => [],
      addEventListener() {},
    },
    localStorage: {
      getItem: key => memory[key] || null,
      setItem: (key, val) => {memory[key] = val;},
      removeItem: key => {delete memory[key];},
    },
  };
  vm.runInNewContext(source + '\nthis.ThemeManager = ThemeManager;', context);
  return {theme: context.ThemeManager, html};
}
const samsung = simulate('Mozilla/5.0 (Linux; Android 15) SamsungBrowser/28.0 Chrome/125 Mobile', false);
assert.equal(samsung.html.dataset.theme, 'dark');
samsung.theme.setTheme('light');
assert.equal(samsung.html.dataset.theme, 'light');
const desktop = simulate('Mozilla/5.0 (Windows NT 10.0) Chrome/126', true);
assert.equal(desktop.html.dataset.theme, 'light');
const miui = simulate('Mozilla/5.0 (Linux; Android 14) MiuiBrowser/17', true);
assert.equal(miui.html.dataset.theme, 'dark');
console.log('PASS: Samsung fallback, user override, desktop and Android media-query branches');
