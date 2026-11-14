#!/usr/bin/env node
'use strict';

/**
 * Copy the shared header/footer templates into each top-level HTML page.
 *
 * Run: node scripts/sync-layout.js
 * No dependencies or runtime HTML fetching: pages stay ordinary static HTML.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS = path.join(ROOT, 'partials');

const ACTIVE_PAGE = {
  'index.html': 'home',
  'about_us.html': 'about',
  'products.html': 'products',
  'product.html': 'products',
  'docs.html': 'docs',
  'downloads.html': 'downloads',
};

function renderHeader(pageName) {
  let template = fs.readFileSync(path.join(PARTIALS, 'header.html'), 'utf8').trimEnd();
  const active = ACTIVE_PAGE[pageName] || '';
  const replacements = {
    account_href: pageName === 'account.html' ? 'account.html' : 'login.html',
    account_active: pageName === 'account.html' ? ' is-logged-in' : '',
  };

  for (const item of ['home', 'about', 'products', 'downloads', 'docs']) {
    replacements[`${item}_active`] = item === active ? ' header__link--active' : '';
  }
  replacements.more_active = ['products', 'downloads', 'docs'].includes(active)
    ? ' header__link--active'
    : '';
  for (const item of ['products', 'downloads', 'docs']) {
    replacements[`more_${item}_active`] = item === active ? ' header__more-link--active' : '';
  }

  for (const [name, value] of Object.entries(replacements)) {
    template = template.replaceAll(`{{${name}}}`, value);
  }
  if (/\{\{\w+\}\}/.test(template)) {
    throw new Error(`Unresolved header placeholder for ${pageName}`);
  }
  return template;
}

function renderFooter(pageName) {
  let template = fs.readFileSync(path.join(PARTIALS, 'footer.html'), 'utf8').trimEnd();
  if (pageName === 'order-status.html') {
    // Preserve the original compact footer without the map on the order-status page.
    const mapBlock = /\n\s*<div class="footer__map">[\s\S]*?<\/div>(?=\n\s*<\/div>\n\s*<\/footer>)/g;
    let removed = 0;
    template = template.replace(mapBlock, () => {
      removed += 1;
      return '';
    });
    if (removed !== 1) {
      throw new Error('Could not identify exactly one footer map in partials/footer.html');
    }
  }
  return template;
}

function syncBlock(html, part, content) {
  const tag = part.toLowerCase();
  const markerStart = `<!-- SHARED:${part}:START — edit partials/${tag}.html -->`;
  const markerEnd = `<!-- SHARED:${part}:END -->`;
  const generated = `    ${markerStart}\n    ${content}\n    ${markerEnd}`;

  const existingGenerated = new RegExp(
    `^    <!-- SHARED:${part}:START[^\\n]*\\n[\\s\\S]*?^    <!-- SHARED:${part}:END -->`,
    'm',
  );
  if (existingGenerated.test(html)) {
    return html.replace(existingGenerated, generated);
  }

  const originalTag = new RegExp(`^    <${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'm');
  if (!originalTag.test(html)) {
    throw new Error(`Expected exactly one <${tag}> block or SHARED:${part} markers`);
  }
  return html.replace(originalTag, generated);
}

function renderPage(html, pageName) {
  return syncBlock(
    syncBlock(html, 'HEADER', renderHeader(pageName)),
    'FOOTER',
    renderFooter(pageName),
  );
}

function main() {
  const pages = fs.readdirSync(ROOT)
    .filter((file) => file.endsWith('.html') && fs.statSync(path.join(ROOT, file)).isFile())
    .sort();

  for (const pageName of pages) {
    const filePath = path.join(ROOT, pageName);
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = renderPage(original, pageName);
    if (updated === original) {
      process.stdout.write(`unchanged ${pageName}\n`);
    } else {
      fs.writeFileSync(filePath, updated, 'utf8');
      process.stdout.write(`updated ${pageName}\n`);
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Layout sync failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { renderHeader, renderFooter, syncBlock, renderPage };
