#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const OrderLifecycle = require("../js/order-lifecycle.js");
const root = path.resolve(__dirname, "..");

function makeStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}
const store = makeStorage();
const now = Date.now();
const makeOrder = (id, createdAt) => ({
  orderId: id,
  createdAt,
  expiresAt: createdAt + OrderLifecycle.EDIT_WINDOW_MS,
  locked: false,
  customer: { firstName: "Клієнт", lastName: "Тест", email: "test@example.ua" },
  items: [{ id: "com-900-485", price: 4300, qty: 10 }],
  subtotal: 43000,
});

const first = makeOrder(OrderLifecycle.generateId(now, store), now);
OrderLifecycle.createOrder(first, store);
assert.equal(OrderLifecycle.getOrders(store).length, 1);
const second = makeOrder(OrderLifecycle.generateId(now, store), now + 1);
OrderLifecycle.createOrder(second, store);
assert.notEqual(first.orderId, second.orderId);
assert.equal(OrderLifecycle.getOrder(first.orderId, store).orderId, first.orderId);
assert.equal(OrderLifecycle.getOrder(second.orderId, store).orderId, second.orderId);
assert.equal(OrderLifecycle.getOrders(store).length, 2, "both unfinished orders must remain accessible");
assert.equal(OrderLifecycle.isEditable(OrderLifecycle.getOrder(first.orderId, store), now + 2), true);
assert.equal(OrderLifecycle.isEditable(OrderLifecycle.getOrder(second.orderId, store), now + 2), true);
assert.equal(OrderLifecycle.readActive(store).orderId, second.orderId, "latest pointer should be newest order");
assert.equal(OrderLifecycle.readHistory(store).some(o => o.orderId === first.orderId), true);

// Edit the older order without replacing the newer order or extending its timer.
OrderLifecycle.saveOrder({ ...first, subtotal: 47000, delivery: { city: "Львів" } }, store);
assert.equal(OrderLifecycle.getOrder(first.orderId, store).subtotal, 47000);
assert.equal(OrderLifecycle.getOrder(first.orderId, store).expiresAt, first.expiresAt);
assert.equal(OrderLifecycle.getOrder(second.orderId, store).subtotal, 43000);
assert.equal(OrderLifecycle.readActive(store).orderId, second.orderId);
// Release the older order; the second order remains editable.
OrderLifecycle.saveOrder(OrderLifecycle.release(OrderLifecycle.getOrder(first.orderId, store), now + 3), store);
assert.equal(OrderLifecycle.getOrder(first.orderId, store).statusCode, "processing");
assert.equal(OrderLifecycle.isEditable(OrderLifecycle.getOrder(second.orderId, store), now + 3), true);

// Same millisecond ID collisions must not overwrite another order.
const sameNow = OrderLifecycle.generateId(now, store);
assert.notEqual(sameNow, first.orderId);
assert.notEqual(sameNow, second.orderId);

// Auth account history must include both orders and show their separate state.
const context = {
  localStorage: store,
  OrderLifecycle,
  document: { addEventListener() {} },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/account.js"), "utf8") + "\nthis.authTest = AuthManager;", context);
const customerOrders = context.authTest.getOrders();
assert.equal(customerOrders.length, 2);
assert.equal(customerOrders.find(o => o.orderId === first.orderId).statusCode, "processing");
assert.equal(customerOrders.find(o => o.orderId === second.orderId).statusCode, "active");

for (const route of ["cart.html", "en/cart.html"]) {
  const code = fs.readFileSync(path.join(root, route), "utf8");
  assert.match(code, /OrderLifecycle\.createOrder\(orderPayload\)/);
  assert.match(code, /OrderLifecycle\.saveOrder\(orderPayload\)/);
  assert.match(code, /OrderLifecycle\.getOrder\(editOrderId\)/);
  assert.match(code, /OrderLifecycle\.generateId\(now\)/);
  assert.match(code, /order-status\.html\?order=/);
}
for (const route of ["order-status.html", "en/order-status.html"]) {
  const code = fs.readFileSync(path.join(root, route), "utf8");
  assert.match(code, /OrderLifecycle\.getOrder\(requestedOrderId\)/);
  assert.match(code, /OrderLifecycle\.saveOrder\(order\)/);
  assert.match(code, /cart\.html\?edit=/);
}
for (const route of ["account.html", "en/account.html"]) {
  const code = fs.readFileSync(path.join(root, route), "utf8");
  assert.match(code, /order-status\.html\?order=\$\{encodeURIComponent\(ord\.orderId\)\}/);
}
const adminSource = fs.readFileSync(path.join(root, "js/admin.js"), "utf8");
assert.match(adminSource, /Never regenerate the archive from loadAllOrders\(\)/);
assert.match(adminSource, /const currentList = OrderLifecycle\.readHistory\(\);/, "demo orders must not overwrite still-editable records");
assert.match(adminSource, /OrderLifecycle\.isEditable\(ord, now\)/);
console.log("PASS: multiple independent unfinished orders, editing, release, unique IDs, account, admin, both languages");
