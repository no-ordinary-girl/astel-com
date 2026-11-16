#!/usr/bin/env node
'use strict';
// Static-route, metadata and document-label checks; no npm dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const { PAGES } = require('../scripts/build-localized-pages.js');
const i18n = require('../js/i18n.js');
const productsSource = fs.readFileSync(path.join(ROOT, 'js/products-data.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(productsSource + '\nthis.products = PRODUCTS_DATA;', context);
let docsCount = 0;
for (const product of Object.values(context.products)) {
  for (const doc of product.docs || []) {
    docsCount++;
    assert.ok(doc.titleEn && doc.titleEn.length > 20, `Missing English document title: ${product.id}`);
    assert.ok(!/[а-яіїєґ]/i.test(doc.titleEn), `Untranslated document: ${product.id}`);
    assert.equal(typeof doc.url, 'string');
  }
}
assert.equal(docsCount, 8);
for (const file of Object.keys(PAGES)) {
  const uk = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const en = fs.readFileSync(path.join(ROOT, 'en', file), 'utf8');
  assert.match(uk, /<html lang="uk" translate="no" class="notranslate">/);
  assert.match(en, /<html lang="en" translate="no" class="notranslate">/);
  assert.match(uk, /<meta name="google" content="notranslate"\s*\/>/);
  assert.match(en, /<meta name="google" content="notranslate"\s*\/>/);
  for (const [locale, label] of [['uk', 'UA'], ['en', 'EN']]) {
    const pattern = new RegExp(`<a(?=[^>]*class="header__lang-link")(?=[^>]*data-lang="${locale}")[^>]*>\\s*${label}\\s*<\\/a\\s*>`);
    assert.match(uk, pattern);
    assert.match(en, pattern);
  }
  assert.match(en, /<base href="\.\.\/"\s*\/>/);
  assert.match(en, /<meta\s+name="description"\s+content="[^"]+"/);
  assert.match(uk, /<meta\s+name="description"\s+content="[^"]+"/);
  assert.match(en, /<link rel="canonical"/);
  assert.match(en, /<link rel="alternate" hreflang="uk"/);
  assert.match(en, /<link rel="alternate" hreflang="en"/);
  assert.match(en, /<title(?:\s+[^>]*)?>[\x20-\x7e\u2014&;]+<\/title>/);
  assert.match(en, /href="en\/index\.html"/);
  assert.match(en, /src="js\/i18n\.js"/);
  assert.match(en, /src="js\/theme\.js"/);
  assert.match(en, /data-i18n="nav.home"/);
  assert.doesNotMatch(en, /<title(?:\s+[^>]*)?>.*[а-яіїєґ]/i);
}
// Language selection must use stable codes, never browser-modifiable link text.
const i18nSource = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
assert.match(i18nSource, /const chosen = link\.dataset\.lang/);
assert.doesNotMatch(i18nSource, /const chosen = link\.textContent/);
// Account and cart must enter the same desktop-side utilities group at 700px.
const globalCss = fs.readFileSync(path.join(ROOT, 'css/global.css'), 'utf8');
assert.match(globalCss, /@media \(min-width: 700px\) \{\s*\.header__account--mobile \{/);
assert.equal(i18n.keyForBuild('nav.docs', 'en'), 'DOCUMENTATION');
const enDocs = fs.readFileSync(path.join(ROOT, 'en/docs.html'), 'utf8');
assert.match(enDocs, /data-i18n="docs.heading"/);
assert.match(enDocs, /I18nManager.documentTitle\(d\)/);
assert.match(enDocs, /I18nManager.translate\(product.title\)/);
console.log(`PASS: ${Object.keys(PAGES).length} localized page pairs and ${docsCount} explicit document titles`);
