#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const storage=new Map();
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
function start(){const ctx=vm.createContext({localStorage});vm.runInContext(fs.readFileSync(path.join(root,'js/products-data.js'),'utf8'),ctx);return ctx;}
let ctx=start(),run=x=>vm.runInContext(x,ctx);
assert.equal(run('Object.keys(PRODUCTS_DATA).length'),15);
const specs=[{type:'tech',rows:[{label:'Частота',value:'900 MHz'}]},
             {type:'general',rows:[{label:'Виробник',value:'Астел-Ком'}]},
             {type:'tech',rows:[{label:'Інтерфейс',value:'RS485'}]}];
const pdf='data:application/pdf;base64,JVBERi0xLjQK';
const docs=[{title:'Паспорт модему',titleEn:'Datasheet',url:pdf,download:'passport.pdf'}];
const payload={id:'demo-device-2026',title:'Тестовий пристрій',titleEn:'Test Device',price:3500,
  category:'gsm',saleTermsCode:'wholesale',inStock:true,
  images:['assets/images/logo-main.svg'],specSections:specs,docs};
run(`CatalogManager.addProduct(${JSON.stringify(payload)})`);
assert.equal(run('PRODUCTS_DATA["demo-device-2026"].specSections.length'),3);
assert.equal(run('PRODUCTS_DATA["demo-device-2026"].docs[0].url'),pdf);
assert.equal(run('CatalogManager.validPdfSource("javascript:alert(1)")'),false);
assert.throws(()=>run(`CatalogManager.addProduct(${JSON.stringify({...payload,id:'invalid-pdf',docs:[{...docs[0],url:'javascript:alert(1)'}]})})`),/PDF/);
assert.throws(()=>run(`CatalogManager.addProduct(${JSON.stringify({...payload,id:'invalid-specs',specSections:[{type:'other',rows:specs[0].rows}]})})`),/таблиці/);
ctx=start();run=x=>vm.runInContext(x,ctx);
assert.equal(run('PRODUCTS_DATA["demo-device-2026"].specSections[2].rows[0].value'),'RS485');
assert.equal(run('PRODUCTS_DATA["demo-device-2026"].docs[0].download'),'passport.pdf');
run('CatalogManager.deleteProduct("demo-device-2026")');
assert.equal(run('Boolean(PRODUCTS_DATA["demo-device-2026"])'),false);
assert.equal(Object.hasOwn(JSON.parse(storage.get('astelkom_catalog_custom_products')),'demo-device-2026'),false);
run('CatalogManager.deleteProduct("com-900-485")');
assert.equal(run('Boolean(PRODUCTS_DATA["com-900-485"])'),false);
assert.equal(run('Object.keys(PRODUCTS_DATA).length'),14);
ctx=start();run=x=>vm.runInContext(x,ctx);
assert.equal(run('Boolean(PRODUCTS_DATA["com-900-485"])'),false,'built-in deletion persists after reload');
assert.equal(run('CatalogManager.readDeleted()["com-900-485"]'),true);
const html=fs.readFileSync(path.join(root,'admin.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/admin.js'),'utf8');
const product=fs.readFileSync(path.join(root,'product.html'),'utf8');
const docsPage=fs.readFileSync(path.join(root,'docs.html'),'utf8');
assert.match(html,/data-spec-sections/);assert.match(html,/data-doc-rows/);
assert.match(js,/productDrafts\.set/);assert.match(js,/data-save-product/);
assert.match(js,/CatalogManager\.deleteProduct/);
assert.match(product,/extraSpecsSection/);assert.match(docsPage,/escapeHtml\(d.url\)/);
console.log('PASS: draft-first inventory, persistent deletion, repeatable specs, safe PDF documents');
