#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const AdminDelivery = require('../js/admin-delivery.js');

// Address entry must ALWAYS be a normal editable input, with optional
// suggestions; an empty native <select> must never block order editing.
assert.match(source, /<input name="branch" type="text" list="admin-branch-list-/);
assert.match(source, /data-admin-branch-input/);
assert.match(source, /data-admin-branch-options/);
assert.doesNotMatch(source, /name="branchChoice"|name="branchManual"|data-admin-branch-select/);
assert.match(source, /const branch = String\(data\.get\("branch"\) \|\| ""\)\.trim\(\);/);
assert.match(source, /orderAddressDrafts\.set\(form\.dataset\.orderEditor, e\.target\.value\)/);

const dashboardStart = source.indexOf('function renderDashboard()');
const initStart = source.indexOf('ordersContainer.querySelectorAll("[data-order-editor]").forEach', dashboardStart);
const clientsStart = source.indexOf('clientsTbody.innerHTML = clients.map', dashboardStart);
assert.ok(initStart > dashboardStart && initStart < clientsStart,
  'Suggestions must be rebuilt for existing editors after each dashboard render');

const functionStart = source.indexOf('async function refreshAdminBranches(form)');
const functionEnd = source.indexOf('ordersContainer.addEventListener("change",', functionStart);
assert.ok(functionStart > 0 && functionEnd > functionStart);
const saved = {orderId:'AK-1234', delivery:{
  city:'Київ', carrierKey:'nova', type:'Відділення',
  branch:'Відділення №15: вул. Машинобудівна, 44'
}};
const previous = {orderId:'AK-5678', delivery:{...saved.delivery,
  branch:'Відділення №16: вул. Січових Стрільців, 1'}};
const fakeDocument = {createElement(tag) {
  assert.equal(tag, 'option');
  return {value:''};
}};
const refresh = vm.runInNewContext(`(${source.slice(functionStart, functionEnd).trim()})`, {
  document:fakeDocument, AdminDelivery, loadAllOrders:() => [saved,previous]
});

function makeEditor(city='Київ', address=saved.delivery.branch) {
  const input = {value:address, required:true};
  const options = {items:[], replaceChildren(){this.items=[];}, append(opt){this.items.push(opt);}};
  const hint = {textContent:''};
  const parts = {
    '[data-admin-branch-input]':input,
    '[data-admin-branch-options]':options,
    '[data-admin-delivery-hint]':hint,
  };
  return {dataset:{orderEditor:saved.orderId}, isConnected:true,
    elements:{city:{value:city},carrierKey:{value:'nova'},deliveryType:{value:'Відділення'}},
    querySelector(selector){return parts[selector];}, input,options,hint};
}

(async () => {
  const initial = makeEditor();
  await refresh(initial);
  assert.equal(initial.input.value, saved.delivery.branch);
  assert.equal(initial.options.items.length, 2);
  assert.ok(initial.hint.textContent.includes('попередніх замовлень'));

  // Simulate a rebuilt editor. Its saved address is still editable; suggestions
  // are restored after rebuilding without replacing the typed input value.
  const reconstructed = makeEditor();
  await refresh(reconstructed);
  assert.equal(reconstructed.input.value, saved.delivery.branch);
  assert.equal(reconstructed.options.items.length, 2);
  reconstructed.input.value = 'Моя адреса, будинок 12';
  await refresh(reconstructed);
  assert.equal(reconstructed.input.value, 'Моя адреса, будинок 12');

  // With no known branches, entering an entirely new address still works.
  const otherCity = makeEditor('Одеса', 'нова адреса');
  await refresh(otherCity);
  assert.equal(otherCity.options.items.length, 0);
  assert.equal(otherCity.input.value, 'нова адреса');
  assert.equal(otherCity.input.required, true);
  assert.ok(otherCity.hint.textContent.includes('Введіть адресу вручну'));

  // Verified suggestions may arrive asynchronously, but must not wipe text.
  const verified = vm.runInNewContext(`(${source.slice(functionStart,functionEnd).trim()})`, {
    document:fakeDocument,
    loadAllOrders:() => [saved,previous],
    AdminDelivery:{...AdminDelivery, fetchVerifiedBranches:async()=>['Новий пункт 12']}
  });
  const typed = makeEditor('Київ','Власна адреса');
  await verified(typed);
  assert.equal(typed.input.value,'Власна адреса');
  assert.ok(typed.options.items.some(x=>x.value==='Новий пункт 12'));

  // Saving must use the text field directly, not a stale dropdown selection.
  const saveStart = source.indexOf('function saveOrderEditor(form)');
  const saveEnd = source.indexOf('function renderDashboard()', saveStart);
  let stored = null;
  const draftCache = new Map([[saved.orderId,'Нова ручна адреса']]);
  const save = vm.runInNewContext(`(${source.slice(saveStart,saveEnd).trim()})`, {
    loadAllOrders:() => [{...saved,statusCode:'processing',payment:'Готівка',items:[],subtotal:0}],
    FormData: class { constructor(form) {this.form=form;} get(key) {return this.form.values[key];} },
    OrderFinance:{validateEdits:()=>120},
    payMethods:['Готівка'], CARRIERS:{nova:'Нова Пошта'},
    editingOrderIds:new Set([saved.orderId]), orderAddressDrafts:draftCache,
    writeOrder:(order)=>{stored=order;},renderDashboard:()=>{},scrollToOrderCard:()=>{},
    showUndoToast:()=>{}, PRODUCTS_DATA:{},CartManager:{getMinQty:()=>1}
  });
  save({dataset:{orderEditor:saved.orderId}, values:{
    firstName:'Ірина',lastName:'Тест',phone:'+380501234567',email:'test@example.com',
    city:'Київ',branch:'Нова ручна адреса',deliveryType:'Відділення',
    carrierKey:'nova',payment:'Готівка'
  }, querySelectorAll:()=>[]});
  assert.equal(stored.delivery.branch,'Нова ручна адреса');
  assert.equal(draftCache.size,0);
  console.log('PASS: editable address persists, suggestions are optional, saving uses typed text');
})().catch(error=>{console.error(error);process.exitCode=1;});
