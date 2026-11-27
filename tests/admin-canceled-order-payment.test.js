const assert = require('node:assert/strict');
const test = require('node:test');
const payments = require('../js/admin-payments.js');

const store = () => ({
  values: new Map(),
  getItem(key) { return this.values.get(key) ?? null; },
  setItem(key, value) { this.values.set(key, String(value)); },
});
const order = (statusCode) => ({ orderId: 'AK-PAY-CANCEL', subtotal: 50000, payment: 'Готівка', statusCode });

test('Cancelled orders show unavailable notice, not payment controls', () => {
  const output = payments.panel(order('canceled'));
  assert.match(output, /Розрахунки та оплата недоступні/);
  assert.match(output, /Раніше створені платіжні записи збережено/);
  assert.doesNotMatch(output, /data-payment-(?:full|add|refund|confirm|void)/);
  assert.doesNotMatch(output, /Підтвердити оплату/);
});

test('Active orders retain payment controls', () => {
  const output = payments.panel(order('processing'));
  assert.match(output, /data-payment-full/);
  assert.match(output, /data-payment-add/);
});

test('Cancel blocks edits while preserving old payment records; restore makes them accessible', () => {
  const cache = store();
  const created = payments.recordConfirmed(order('processing'), {
    type: 'payment', amount: '20000', method: 'cash'
  }, cache);
  assert.equal(payments.summary(order('canceled'), cache).received, 2000000);
  const stored = cache.getItem(payments.KEY);
  const canceled = order('canceled');
  assert.throws(() => payments.recordConfirmed(canceled, {
    type: 'payment', amount: '30000', method: 'cash'
  }, cache), /недоступні/);
  assert.throws(() => payments.add(canceled, {
    type: 'payment', amount: '200', method: 'cash'
  }, cache), /недоступні/);
  assert.throws(() => payments.changeState(canceled, created.id, 'void', cache), /недоступні/);
  assert.equal(cache.getItem(payments.KEY), stored);
  const restored = order('processing');
  assert.equal(payments.summary(restored, cache).received, 2000000);
  assert.equal(payments.panel(restored).includes('data-payment-full'), true);
});
