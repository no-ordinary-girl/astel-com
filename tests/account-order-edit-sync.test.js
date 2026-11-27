#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const data = new Map();
const storage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); },
};
const ctx = {
  localStorage: storage,
  document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js/account.js"), "utf8") + "\nthis.auth = AuthManager;", ctx);
const auth = ctx.auth;
const currentUser = {
  firstName: "Ірина", lastName: "Тестова", phone: "+380501111111",
  email: "old@example.com", authMethod: "E-mail", address: { city: "Київ", branch: "Відділення 15" },
};
const order = { orderId: "AK-100", customer: {
  firstName: "Ірина", lastName: "Тестова", email: "old@example.com", phone: "+380501111111",
}, delivery: { city: "Київ", branch: "Відділення 15" } };
const changed = { ...order, customer: { ...order.customer,
  firstName: "Олена", lastName: "Нова", email: "new@example.com", phone: "+380502222222",
}, delivery: { city: "Львів", branch: "Відділення 20" } };
storage.setItem("astelkom_auth_user", JSON.stringify(currentUser));
assert.equal(auth.syncProfileFromEditedOrder(order, changed), true);
let updated = auth.getUser();
assert.equal(updated.firstName, "Олена");
assert.equal(updated.lastName, "Нова");
assert.equal(updated.phone, "+380502222222");
assert.equal(updated.email, "new@example.com");
assert.equal(updated.authMethod, "E-mail", "retain unrelated profile settings");
assert.equal(updated.address.city, "Львів", "explicitly changed delivery becomes the new checkout preference");

// Editing an unrelated order, even in the same browser, must not modify profile.
assert.equal(auth.syncProfileFromEditedOrder({ ...order, orderId: "AK-101" }, changed), false);
assert.equal(auth.syncProfileFromEditedOrder({ ...order, customer: { ...order.customer, email: "stranger@example.com" } }, changed), false);
assert.equal(auth.getUser().email, "new@example.com");

// Repeated save with no real changes should be a no-op; preserve profile edits.
const unchanged = { ...changed, customer: { ...changed.customer } };
assert.equal(auth.syncProfileFromEditedOrder(changed, unchanged), false);
assert.equal(auth.getUser().email, "new@example.com");

// Only contact fields changed in an order are propagated, not stale unchanged values.
const modifiedProfile = { ...updated, lastName: "Оновлено в кабінеті" };
storage.setItem("astelkom_auth_user", JSON.stringify(modifiedProfile));
const nextOrder = { ...changed, customer: { ...changed.customer, firstName: "Марія" } };
assert.equal(auth.syncProfileFromEditedOrder(changed, nextOrder), true);
assert.equal(auth.getUser().lastName, "Оновлено в кабінеті");
assert.equal(auth.getUser().firstName, "Марія");
assert.equal(auth.getUser().address.city, "Львів");

// Optional phone removal should remain empty in the account, not revert to demo phone.
const phoneCleared = { ...nextOrder, customer: { ...nextOrder.customer, phone: "" } };
assert.equal(auth.syncProfileFromEditedOrder(nextOrder, phoneCleared), true);
assert.equal(auth.getUser().phone, "");

// Changing only the order's payment method updates the saved next-checkout
// preference without rewriting the customer's contact or delivery values.
const paidOrder = { ...phoneCleared, payment: "Готівка" };
const cardOrder = { ...paidOrder, payment: "Оплата банківською картою" };
assert.equal(auth.syncProfileFromEditedOrder(paidOrder, cardOrder), true);
assert.equal(auth.getUser().preferredPayment, "Оплата банківською картою");
assert.equal(auth.getUser().address.city, "Львів");

// Guest edits must not silently create an account.
auth.logout();
assert.equal(auth.syncProfileFromEditedOrder(order, changed), false);
assert.equal(auth.getUser(), null);

for (const page of ["cart.html", "en/cart.html"]) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(source, /OrderLifecycle\.saveOrder\(orderPayload\);/);
  assert.match(source, /AuthManager\.syncProfileFromEditedOrder\(existingOrder, orderPayload\)/);
  assert.match(source, /if \(isEditingOrder && existingOrder && typeof AuthManager/);
  assert.match(source, /OrderLifecycle\.isEditable\(existingOrder, now\)/);
}
for (const page of ["account.html", "en/account.html"]) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(source, /const user = AuthManager\.getUser\(\)/);
  assert.match(source, /document\.getElementById\("prof-fname"\)\.value = firstName/);
  assert.match(source, /user\.phone \?\? "\+380501234567"/);
}
console.log("PASS: edited order synchronizes changed contact/delivery/payment preferences; original order history stays independent");
