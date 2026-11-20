#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const i18n=require('../js/i18n.js');
global.I18nManager=i18n;
const editor=require('../js/admin-new-product.js');
const t=editor.englishFromDictionary;
assert.equal(t('Стандарт зв’язку'),'Communication Standard');
assert.equal(editor.englishInitial('Стандарт зв’язку','Стандарт зв’язку'),'Communication Standard');
assert.equal(editor.englishInitial('Стандарт зв’язку','Custom English'),'Custom English');
assert.equal(t('Інтерфейс RS485 — 1 шт.\nІнтерфейс USB — 1 шт.'),'RS485 interface — 1 pc\nUSB interface — 1 pc');
assert.equal(t('Досі не перекладений технічний вислів'),'', 'Do not copy untranslated Ukrainian into English fields');
const c=vm.createContext({localStorage:{getItem:()=>null,setItem:()=>{}}});
vm.runInContext(fs.readFileSync(path.join(base,'js/products-data.js'),'utf8'),c);
const products=vm.runInContext('Object.values(PRODUCTS_DATA).map(p=>({description:p.description,techSpecs:p.techSpecs,generalSpecs:p.generalSpecs}))',c);
for(const product of products){
  for(const paragraph of product.description||[]) assert(!/[А-Яа-яІіЇїЄєҐґ]/.test(t(paragraph)),`Missing English description: ${paragraph.slice(0,50)}`);
  for(const row of [...product.techSpecs||[],...product.generalSpecs||[]]){
    for(const text of [row.label,row.value]) assert(!/[А-Яа-яІіЇїЄєҐґ]/.test(t(text)),`Missing English specification: ${text.slice(0,50)}`);
  }
}
const admin=fs.readFileSync(path.join(base,'js/admin.js'),'utf8');
const html=fs.readFileSync(path.join(base,'admin.html'),'utf8');
const css=fs.readFileSync(path.join(base,'css/admin-photos.css'),'utf8');
assert.match(admin,/renderDetailsRow\(p\)/);
assert.match(admin,/\$\{renderPhotoEditor\(p,getDraft\(p\.id\)\.images\)\}/);
assert.doesNotMatch(admin,/<tr class="admin-photo-editor-row"/);
assert.match(admin,/data-product-content-toggle|admin-product-content-toggle/);
assert.match(html,/data-editor-language-tabs/);
assert.match(css,/data-editor-field-lang/);
assert.match(css,/data-editor-language="en"/);
assert.match(editor.selectLanguage.toString(),/aria-selected/);
console.log('PASS: collapsible photo editor, two-language tabs, all built-in text translated via i18n dictionary');
