#!/usr/bin/env node
'use strict';

/** Check the shared static layout on every HTML page. Run: node tests/layout.test.js */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderPage } = require('../scripts/sync-layout.js');

const ROOT = path.resolve(__dirname, '..');

function countClassTags(html, tagName, className) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || [];
  return tags.filter((tag) => {
    const classes = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
    return classes && classes[2].split(/\s+/).includes(className);
  }).length;
}

function countSiteNavScripts(html) {
  const scripts = html.match(/<script\b[^>]*>/gi) || [];
  return scripts.filter((tag) => {
    const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    return source && source[2] === 'js/site-nav.js';
  }).length;
}

function main() {
  const pages = fs.readdirSync(ROOT)
    .filter((file) => file.endsWith('.html') && fs.statSync(path.join(ROOT, file)).isFile())
    .sort();
  assert.ok(pages.length > 0, 'No HTML pages found');

  for (const pageName of pages) {
    const html = fs.readFileSync(path.join(ROOT, pageName), 'utf8');
    assert.equal(countClassTags(html, 'header', 'header'), 1, `${pageName}: expected one .header`);
    assert.equal(countClassTags(html, 'footer', 'footer'), 1, `${pageName}: expected one .footer`);
    assert.equal(countSiteNavScripts(html), 1, `${pageName}: expected one site-nav.js script`);
    for (const part of ['HEADER', 'FOOTER']) {
      assert.equal(html.split(`SHARED:${part}:START`).length - 1, 1, `${pageName}: missing/duplicate ${part} start`);
      assert.equal(html.split(`SHARED:${part}:END`).length - 1, 1, `${pageName}: missing/duplicate ${part} end`);
    }
    // Catch a page whose generated markup is out of sync with its templates.
    assert.equal(html, renderPage(html, pageName), `${pageName}: rerun node scripts/sync-layout.js`);
    console.log(`PASS ${pageName}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
}
