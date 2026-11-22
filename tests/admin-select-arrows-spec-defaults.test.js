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
assert.match(editor.createSpecSection.toString(),/data\.type\)\?data\.type:'custom'/);
assert.match(editor.createSpecSection.toString(),/type==='custom'\?'':DEFAULT_TITLES\[type\]\.uk/);
console.log('PASS matching dropdown arrows and empty default new-table title');
