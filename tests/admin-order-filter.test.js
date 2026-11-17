#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { matchesOrderFilter } = require('../js/admin.js');
const finance = require('../js/order-finance.js');
const root = path.join(__dirname, '..');
const paidProof = {
  verified: true, provider: 'liqpay', orderId: 'AK-1', amount: 43000, currency: 'UAH',
};
const paid = {
  orderId: 'AK-1', statusCode: 'processing', payment: 'Оплата банківською картою',
  subtotal: 43000, paymentStatus: 'paid', paymentVerification: paidProof,
};
const pending = { ...paid, orderId: 'AK-2', paymentVerification: null, paymentStatus: 'unpaid' };
const unverified = { ...paid, paymentVerification: null };
const cash = { ...paid, orderId: 'AK-3', payment: 'Готівка', paymentVerification: null };
const google = { ...paid, orderId: 'AK-4', payment: 'Google Pay', paymentVerification: null };
const selections = ['payment:paid', 'payment:unpaid', 'payment:cash-on-delivery'];
for (const value of selections) assert.equal(matchesOrderFilter(paid, value, finance), value === 'payment:paid');
assert.equal(matchesOrderFilter(pending, 'payment:unpaid', finance), true);
assert.equal(matchesOrderFilter(google, 'payment:unpaid', finance), true);
assert.equal(matchesOrderFilter(unverified, 'payment:paid', finance), false, 'Unverified localStorage paid is never trusted');
assert.equal(matchesOrderFilter(cash, 'payment:cash-on-delivery', finance), true);
assert.equal(matchesOrderFilter(cash, 'payment:unpaid', finance), false);
assert.equal(matchesOrderFilter(cash, 'all', finance), true);
assert.equal(matchesOrderFilter(cash, 'processing', finance), true);
assert.equal(matchesOrderFilter(paid, 'shipped', finance), false);
assert.equal(matchesOrderFilter(pending, 'payment:paid', finance), false);
assert.equal(matchesOrderFilter(paid, 'payment:unpaid', finance), false);
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
assert.doesNotMatch(html, /<option value="active">Прийнято<\/option>/);
for (const value of selections) assert.ok(html.includes(`value="${value}"`), `Missing ${value}`);
const script = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
assert.match(script, /function scrollToOrderCard\(orderId\)/);
assert.match(script, /saveOrderEditor\(form\)[\s\S]*?scrollToOrderCard\(id\);/);
assert.match(script, /data-cancel-order-edit[\s\S]*?scrollToOrderCard\(orderId\);/);
assert.match(script, /PIPELINE_STEPS = \[[\s\S]*?1\. Оформлено/);
assert.doesNotMatch(script, /OrderFinance\.acceptedGreen\(/, 'Progress pipeline should not imply payment has cleared');
assert.match(script, /admin-order-card__badges/, 'Payment state visible at top of order card');
console.log('PASS: payment filters, status pipeline, card header, and shared scroll for save/cancel');
