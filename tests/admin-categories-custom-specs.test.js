#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/products-data.js'),'utf8');
const store=new Map();
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
function ctx(){const c=vm.createContext({localStorage:storage});vm.runInContext(source,c);return c;}
let context=ctx();const run=code=>vm.runInContext(code,context);
const key=run('CatalogManager.addCategory("Промислові сенсори","Industrial Sensors")');
assert.equal(run(`CatalogManager.getCategoryName(${JSON.stringify(key)},true)`),'Industrial Sensors');
assert.equal(run(`CatalogManager.CATEGORIES[${JSON.stringify(key)}]`),'Промислові сенсори');
const custom={id:'sensor-dev',title:'Тестовий сенсор',titleEn:'Test sensor',price:100,category:key,
 saleTermsCode:'retail',images:['assets/images/logo-main.svg'],specSections:[{type:'custom',title:'Комплектація',titleEn:'Package Contents',rows:[{label:'Кабель',labelEn:'Cable',value:'1 шт.',valueEn:'1 pc'}]}],docs:[]};
run(`CatalogManager.addProduct(${JSON.stringify(custom)})`);
assert.equal(run('PRODUCTS_DATA["sensor-dev"].categoryName'),'Промислові сенсори');
assert.throws(()=>run(`CatalogManager.deleteCategory(${JSON.stringify(key)})`),/використовують/);
assert.throws(()=>run(`CatalogManager.addProduct(${JSON.stringify({...custom,id:'not-valid',specSections:[{type:'custom',title:'',rows:custom.specSections[0].rows}]})})`),/таблиці/);
context=ctx();const again=code=>vm.runInContext(code,context);
assert.equal(again('PRODUCTS_DATA["sensor-dev"].specSections[0].titleEn'),'Package Contents');
assert.equal(again(`CatalogManager.getCategoryName(${JSON.stringify(key)},true)`),'Industrial Sensors');
again('CatalogManager.deleteProduct("sensor-dev")');again(`CatalogManager.deleteCategory(${JSON.stringify(key)})`);
context=ctx();assert.equal(vm.runInContext(`CatalogManager.CATEGORIES[${JSON.stringify(key)}]`,context),undefined);
console.log('PASS custom categories: persistence, in-use protection, deletion; custom spec titles persist');
