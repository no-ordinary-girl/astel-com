#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const delivery=require('../js/admin-delivery.js');
const finance=require('../js/order-finance.js');
const orders=[
  {delivery:{city:'Львів',carrierKey:'nova',type:'Відділення',branch:'Відділення №4: вул. Городоцька, 359'}},
  {delivery:{city:'Львів',carrierKey:'nova',type:'Відділення',branch:'Відділення №4: вул. Городоцька, 359'}},
  {delivery:{city:'Львів',carrierKey:'nova',type:'Поштомат',branch:'Поштомат 3'}},
  {delivery:{city:'Київ',carrierKey:'nova',type:'Відділення',branch:'Відділення 1'}}
];
assert.deepEqual(delivery.orderBranches(orders,'Львів','nova','Відділення'),['Відділення №4: вул. Городоцька, 359']);
assert.deepEqual(delivery.orderBranches(orders,'Львів','nova','Поштомат'),['Поштомат 3']);
assert.deepEqual(delivery.orderBranches(orders,'Одеса','nova','Відділення'),[]);
assert.equal(delivery.uniqueBranches(['1','1',' 2 ']).length,2);
(async()=>{
  assert.equal(await delivery.fetchVerifiedBranches('Львів','nova','Відділення'),null,'No API endpoint configured: no fabricated branches');
  const script=fs.readFileSync(path.join(root,'js/admin.js'),'utf8');
  assert.match(script,/function scrollToOrderCard\(orderId\)/);
  assert.match(script,/scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.match(script,/data-admin-city/);
  assert.match(script,/data-admin-branch-select/);
  assert.match(script,/!editingOrderIds\.has\(String\(ord\.orderId\)\)/);
  assert.doesNotMatch(script,/data-payment-status/);
  assert.match(script,/class="admin-edit-line__price"/);
  assert.equal(finance.paymentStatus({payment:'Оплата банківською картою',paymentStatus:'paid'}),'unpaid');
  assert.equal(finance.paymentStatus({orderId:'id',payment:'Оплата банківською картою',paymentStatus:'paid',paymentVerification:{verified:true,provider:'liqpay',orderId:'id',amount:100,currency:'UAH'},subtotal:100}),'paid');
  assert.equal(finance.paymentStatus({payment:'Готівка',paymentStatus:'unpaid'}),'cash-on-delivery');
  assert.equal(finance.paymentStatus({orderId:'id',payment:'Оплата банківською картою',paymentStatus:'paid',paymentVerification:{verified:true,provider:'liqpay',orderId:'id',amount:100,currency:'UAH'},subtotal:150}),'unpaid','Amount edits invalidate payment proof');
  assert.equal(finance.paymentLabel({payment:'Готівка'},'en'),'Pay on delivery');
  console.log('PASS: delivery dropdown data, payment status, and admin editor wiring');
})().catch(e=>{console.error(e);process.exitCode=1});
