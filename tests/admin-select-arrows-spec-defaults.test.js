#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/admin-photos.css'),'utf8');
const editor=require('../js/admin-new-product.js');
const svg=fs.readFileSync(path.join(root,'assets/images/admin-select-chevron.svg'),'utf8');
assert.match(css,/\.admin-new-product-form\.admin-language-editor select\[name="category"\]/);
assert.match(css,/\.admin-new-product-form\.admin-language-editor select\[name="saleTermsCode"\]/);
assert.match(css,/#admin-status-filter\s*\{/);
assert.match(css,/padding-right:\s*30px/);
assert.match(css,/background-position:\s*right 10px center/);
assert.match(css,/background-image:\s*url\("\.\.\/assets\/images\/admin-select-chevron\.svg"\)/);
assert.match(svg,/<path d="m6 9 6 6 6-6"\/>/);
// Exercise generated markup instead of depending on JS source formatting.
const originalDocument = global.document;
global.document = {
  createElement() {
    return {
      className: '',
      innerHTML: '',
      querySelector() { return {append() {}}; },
    };
  },
};
try {
  const fresh = editor.createSpecSection();
  assert.match(fresh.innerHTML, /data-spec-title\s+placeholder="Назва таблиці українською"[^>]*value=""/);
  assert.match(fresh.innerHTML, /data-spec-title-en\s+placeholder="Переклад назви таблиці англійською"[^>]*value=""/);
  assert.doesNotMatch(fresh.innerHTML, /value="Technical Specifications"/);
  const existing = editor.createSpecSection({type:'tech',rows:[{}]});
  assert.match(existing.innerHTML, /value="Технічні характеристики"/);
  assert.match(existing.innerHTML, /value="Technical Specifications"/);
  const named = editor.createSpecSection({type:'custom',title:'Моя таблиця',titleEn:'My table'});
  assert.match(named.innerHTML, /value="Моя таблиця"/);
  assert.match(named.innerHTML, /value="My table"/);
} finally {
  if (originalDocument === undefined) delete global.document;
  else global.document = originalDocument;
}
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
assert.match(html,/name="title"[\s\S]*?placeholder="Назва товару"/);
assert.match(html,/name="titleEn"[\s\S]*?placeholder="Переклад назви товару"/);
assert.match(html,/Назва товару англійською/);
console.log('PASS matching dropdown arrows and blank new-table titles');
