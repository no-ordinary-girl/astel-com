const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const payment = require('../js/admin-payments.js');
const finance = require('../js/order-finance.js');

const source = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const stylesheet = fs.readFileSync(path.join(__dirname, '../css/admin-operations.css'), 'utf8');
for (const key of ['notes', 'edit', 'payments', 'warranty', 'history']) {
  assert.match(source, new RegExp(`\\["${key}",`), `Missing workspace tab: ${key}`);
}
assert.match(source, /aria-expanded=/);
assert.match(source, /setOrderPane\(/);
assert.match(stylesheet, /\.admin-order-workspace__panel\[hidden\]/);

const store = {
  data: new Map(),
  getItem(key) { return this.data.get(key) || null; },
  setItem(key, value) { this.data.set(key, String(value)); },
};
const order = { orderId: 'AK-WORKSPACE', subtotal: 50000, payment: 'Готівка', statusCode: 'completed', recognizedRevenue: 50000 };
assert.equal(payment.summary(order, store).remaining, 5000000);
const confirmed = payment.recordConfirmed(order, { type: 'payment', amount: '20000', method: 'cash' }, store);
assert.equal(confirmed.status, 'confirmed');
assert.equal(payment.summary(order, store).received, 2000000);
assert.equal(payment.status(order, store), 'partial');
const pending = payment.add(order, { type: 'payment', amount: '10000', method: 'bank' }, store);
assert.equal(pending.status, 'pending');
assert.equal(payment.summary(order, store).received, 2000000);
payment.changeState(order, pending.id, 'confirmed', store);
assert.equal(payment.summary(order, store).received, 3000000);
const refund = payment.recordConfirmed(order, { type: 'refund', amount: '5000', method: 'bank' }, store);
assert.equal(refund.status, 'confirmed');
assert.equal(payment.summary(order, store).received, 2500000);
assert.equal(finance.contribution(order), 50000);
assert.match(payment.panel(order), /data-payment-full/);
assert.match(payment.panel(order), /data-payment-add/);
assert.doesNotMatch(payment.panel(order), /<details/);
console.log('order workspace and one-step reconciliation checks OK');
