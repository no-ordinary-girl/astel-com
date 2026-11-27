#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const memory = new Map();
const storage = {
  getItem(k) { return memory.has(k) ? memory.get(k) : null; },
  setItem(k, v) { memory.set(k, String(v)); },
  removeItem(k) { memory.delete(k); },
};
const context = {
  localStorage: storage,
  document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/account.js"), "utf8") + "\nthis.auth = AuthManager;", context);
const auth = context.auth;
const initial = {
  email: "initial@example.com", firstName: "Ірина", lastName: "Стара", phone: "+380500000000",
  authMethod: "E-mail", address: { city: "Київ", carrierKey: "nova", carrierName: "Нова Пошта", type: "Відділення", branch: "Відділення 15" },
  preferredPayment: "Готівка",
};
storage.setItem("astelkom_auth_user", JSON.stringify(initial));
const order = {
  orderId: "AK-2026", customer: { firstName: "Олена", lastName: "Нова", email: "new@example.com", phone: "+380501234567" },
  delivery: { city: "Львів", carrierKey: "meest", carrierName: "Meest ПОШТА", type: "Поштомат", branch: "Поштомат 28" },
  payment: "Оплата банківською картою",
};
assert.equal(auth.syncProfileFromNewOrder(order, "initial@example.com"), true);
const after = auth.getUser();
assert.equal(after.firstName, "Олена");
assert.equal(after.lastName, "Нова");
assert.equal(after.email, "new@example.com");
assert.equal(after.phone, "+380501234567");
assert.equal(after.address.city, "Львів");
assert.equal(after.address.carrierKey, "meest");
assert.equal(after.address.type, "Поштомат");
assert.equal(after.address.branch, "Поштомат 28");
assert.equal(after.preferredPayment, "Оплата банківською картою");
assert.equal(after.authMethod, "E-mail");
assert.equal(auth.syncProfileFromNewOrder(order, "initial@example.com"), false, "old session must not overwrite changed account");
assert.equal(auth.syncProfileFromNewOrder(order, "new@example.com"), false, "unchanged checkout is a no-op");
const anotherCustomer = { ...order, customer: { ...order.customer, firstName: "Тест" } };
assert.equal(auth.syncProfileFromNewOrder(anotherCustomer, "other@example.com"), false);
assert.equal(auth.getUser().firstName, "Олена");
assert.equal(auth.syncProfileFromNewOrder({ ...order, delivery: {} }, "new@example.com"), false, "invalid preferred delivery cannot be stored");
auth.logout();
assert.equal(auth.syncProfileFromNewOrder(order, "new@example.com"), false, "guest cannot create an account");
assert.equal(auth.getUser(), null);
for (const page of ["cart.html", "en/cart.html"]) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(source, /AuthManager\.syncProfileFromNewOrder\(orderPayload, checkoutAccountEmailAtStart\)/);
  assert.match(source, /AuthManager\.syncProfileFromEditedOrder\(existingOrder, orderPayload\)/);
  assert.match(source, /CheckoutAutocomplete\.init\(/);
  assert.match(source, /js\/checkout-autocomplete\.js/);
  assert.match(source, /user\.preferredPayment/);
}
for (const page of ["account.html", "en/account.html"]) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(source, /id="saved-payment-text"/);
  assert.match(source, /user\.preferredPayment/);
}
const directory = fs.readFileSync(path.join(root, "js/delivery-data.js"), "utf8");
assert.match(directory, /if \(!apiKey\) return null;/);
console.log("PASS: normal checkout synchronizes signed-in account contact, delivery, and preferred payment; no guest or cross-session overwrite");
