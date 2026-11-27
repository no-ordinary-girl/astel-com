#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { orderItemNeedsAvailabilityNotice } = require('../js/admin.js');

const catalog = {
  discontinued: {id:'discontinued', inStock:false},
  ready: {id:'ready', inStock:true},
  legacy: {id:'legacy'},
};
for (const status of ['active', 'processing', 'shipped']) {
  assert.equal(orderItemNeedsAvailabilityNotice(status, 'discontinued', catalog), true, status);
  assert.equal(orderItemNeedsAvailabilityNotice(status, 'ready', catalog), false, status);
  assert.equal(orderItemNeedsAvailabilityNotice(status, 'legacy', catalog), false, status);
  assert.equal(orderItemNeedsAvailabilityNotice(status, 'deleted-product', catalog), false, status);
}
for (const status of ['completed', 'canceled']) {
  assert.equal(orderItemNeedsAvailabilityNotice(status, 'discontinued', catalog), false, status);
}
assert.equal(orderItemNeedsAvailabilityNotice('processing','discontinued',undefined), false);
const js = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/admin.css'), 'utf8');
assert.match(js, /admin-order-item__availability[^`]*?Немає в наявності/);
assert.match(js, /window\.addEventListener\("astel:catalog-updated", \(\) => \{[\s\S]*?admin-order-item__availability/);
assert.match(css, /\.admin-order-item__availability\[hidden\]\s*\{\s*display:\s*none;/);
console.log('PASS: unavailable catalog item marked in unfinished orders only and refreshed on updates');
