#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(dir,'js/products-data.js'),'utf8');
const data=new Map();
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
function context(){const c=vm.createContext({localStorage:storage});vm.runInContext(src,c);return c;}
let c=context();const run=code=>vm.runInContext(code,c);
const pdf='idb-pdf:'+ 'a'.repeat(36);
assert(run(`CatalogManager.validPdfSource(${JSON.stringify(pdf)})`));
assert(run(`CatalogManager.validPdfSource('assets/downloads/pasport_modemu_som_900_485_4g_new.pdf')`));
assert.throws(()=>run('CatalogManager.addCategory("Тестова категорія", "")'),/англійською/);
assert.throws(()=>run(`CatalogManager.addProduct(${JSON.stringify({id:'no-english',title:'Тестовий товар',titleEn:'',price:100,category:'gsm',saleTermsCode:'wholesale',images:['assets/images/logo-main.svg']})})`),/Англійська/);
const sections=[{type:'custom',title:'Комплектація',titleEn:'Package contents',rows:[{label:'Порт',labelEn:'Port',value:'RS485',valueEn:'RS485'}]}];
const docs=[{title:'Паспорт',titleEn:'Datasheet',url:pdf,download:'datasheet.pdf'}];
run(`CatalogManager.updateProduct('com-900-485',${JSON.stringify({description:['Новий опис'],descriptionEn:['Updated description'],techSpecs:[],generalSpecs:[],specSections:sections,docs})})`);
assert.equal(run(`PRODUCTS_DATA['com-900-485'].descriptionEn[0]`),'Updated description');
assert.equal(run(`PRODUCTS_DATA['com-900-485'].specSections[0].rows[0].labelEn`),'Port');
c=context();
assert.equal(vm.runInContext(`PRODUCTS_DATA['com-900-485'].docs[0].url`,c),pdf);
const html=fs.readFileSync(path.join(dir,'admin.html'),'utf8');
assert(html.includes('name="descriptionEn"'));
assert(html.includes('js/product-file-store.js'));
assert(!html.includes('до 950 КБ')&&!html.includes('До 950 КБ'));
for(const filename of ['product.html','docs.html','en/product.html','en/docs.html']){
 const page=fs.readFileSync(path.join(dir,filename),'utf8');
 assert(page.includes('js/product-file-store.js'),`${filename} missing file storage`);
 assert(page.includes('AstelProductFiles.hydrate'),`${filename} missing PDF hydration`);
}
const editor=fs.readFileSync(path.join(dir,'js/admin-new-product.js'),'utf8');
assert(editor.includes('labelEn')&&editor.includes('valueEn'));
assert(!editor.includes('950000'));
assert(editor.includes('data-spec-title-en'));
console.log('PASS: bilingual catalog content, large-PDF references, existing-product editing and public downloads');
