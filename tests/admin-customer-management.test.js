#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Manager = require("../js/admin-customers.js");

const entries = new Map();
const storage = {
  getItem(k) { return entries.has(k) ? entries.get(k) : null; },
  setItem(k, v) { entries.set(k, String(v)); },
};
const customer = { firstName: "Олександр", lastName: "Ковальчук", phone: "+380679876543", email: "Kovalchuk@Energy.UA" };
const key = Manager.keyFor(customer);
assert.equal(key, "email:kovalchuk@energy.ua");
assert.equal(Manager.keyFor({ phone: "+380 50 123 45 67" }), "phone:380501234567");
assert.equal(Manager.keyFor({}), "");
assert.equal(Manager.profileFor(Manager.read(storage), key).status, "normal");
Manager.setStatus(storage, key, "attention");
assert.equal(Manager.profileFor(Manager.read(storage), key).status, "attention");
Manager.setStatus(storage, key, "restricted");
assert.equal(Manager.profileFor(Manager.read(storage), key).status, "restricted");
assert.throws(() => Manager.setStatus(storage, key, "blocked"), /Невідомий/);
assert.throws(() => Manager.addNote(storage, key, "  "), /Напишіть/);
assert.throws(() => Manager.addNote(storage, key, "a".repeat(1001)), /1000/);
Manager.addNote(storage, key, "Уточнити адресу", 1732000000000);
Manager.addNote(storage, key, '<img src=x onerror="evil()">', 1732000001000);
let profile = Manager.profileFor(Manager.read(storage), key);
assert.equal(profile.notes.length, 2);
assert.equal(profile.notes[0].text, '<img src=x onerror="evil()">');
Manager.deleteNote(storage, key, profile.notes[0].id);
profile = Manager.profileFor(Manager.read(storage), key);
assert.equal(profile.notes.length, 1);
assert.equal(profile.notes[0].text, "Уточнити адресу");
assert.equal(profile.status, "restricted", "Removing a note must not reset client status");
const orders = [
  { orderId: "AK-2", createdAt: 200, customer: { ...customer, email: "kovalchuk@energy.ua" }, statusCode: "canceled", subtotal: 200, delivery: { city: "Львів", carrierName: "Нова Пошта", branch: "№4" } },
  { orderId: "AK-1", createdAt: 100, customer, statusCode: "completed", subtotal: 1000, delivery: { city: "Львів", carrierName: "Нова Пошта", branch: "№4" } },
  { orderId: "AK-1", createdAt: 100, customer, statusCode: "completed", subtotal: 1000 },
];
const clients = Manager.buildClients(orders, customer);
assert.equal(clients.length, 1);
assert.equal(clients[0].ordersCount, 2, "Do not duplicate orders with the same ID");
assert.deepEqual(clients[0].orders.map((o) => o.orderId), ["AK-2", "AK-1"]);
assert.equal(clients[0].totalSpent, 1000, "Canceled orders do not count toward customer subtotal");
assert.match(clients[0].address, /Львів/);
assert.equal(Manager.profileFor(Manager.read(storage), key).notes.length, 1, "Profile survives rebuilding customer list");
// The UI exposes only two states: gray (normal) and red (attention).
assert.equal(Manager.toggleAttention(storage, key).status, "normal", "Old restricted flag becomes normal");
assert.equal(Manager.toggleAttention(storage, key).status, "attention");
assert.equal(Manager.toggleAttention(storage, key).status, "normal");

// Notes must be attached to an actual order belonging to the customer.
assert.throws(() => Manager.addOrderNote(storage, key, "AK-OTHER", "Тест", ["AK-1"]), /замовлення цього клієнта/);
assert.throws(() => Manager.addOrderNote(storage, key, "AK-1", " ", ["AK-1"]), /Напишіть/);
Manager.addOrderNote(storage, key, "AK-1", "Уточнити дату відвантаження", ["AK-1", "AK-2"], 1732000002000);
Manager.addOrderNote(storage, key, "AK-2", "Повторно зателефонувати", ["AK-1", "AK-2"], 1732000003000);
profile = Manager.profileFor(Manager.read(storage), key);
assert.equal(Manager.notesForOrder(profile, "AK-1").length, 1);
assert.equal(Manager.notesForOrder(profile, "AK-2").length, 1);
assert.equal(Manager.countOrderNotes(profile, ["AK-1", "AK-2"]), 2);
assert.equal(profile.notes.length, 1, "Old unassigned notes are preserved, not silently reassigned");
const toDelete = Manager.notesForOrder(profile, "AK-1")[0].id;
Manager.deleteOrderNote(storage, key, "AK-1", toDelete, ["AK-1", "AK-2"]);
profile = Manager.profileFor(Manager.read(storage), key);
assert.equal(Manager.notesForOrder(profile, "AK-1").length, 0);
assert.equal(Manager.notesForOrder(profile, "AK-2").length, 1, "Deleting a note cannot affect another order");
Manager.assignLegacyNote(storage, key, profile.notes[0].id, "AK-1", ["AK-1", "AK-2"]);
profile = Manager.profileFor(Manager.read(storage), key);
assert.equal(profile.notes.length, 0);
assert.equal(Manager.notesForOrder(profile, "AK-1")[0].text, "Уточнити адресу");
assert.equal(profile.status, "normal", "Notes must not change attention status");

entries.set(Manager.STORAGE_KEY, "invalid json");
assert.deepEqual(Manager.read(storage), {});

const root = path.join(__dirname, "..");
const admin = fs.readFileSync(path.join(root, "admin.html"), "utf8");
const js = fs.readFileSync(path.join(root, "js/admin.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/admin-customers.css"), "utf8");
assert.match(admin, /js\/admin-customers\.js/);
assert.match(admin, /admin-customers\.css/);
assert.match(admin, /id="admin-clients-tbody"/);
assert.match(js, /data-client-details/);
assert.match(js, /data-toggle-client/);
assert.match(js, /data-toggle-client-attention/, "Customer indicator is clickable");
assert.match(js, /data-order-id/, "Notes are scoped to a particular order");
assert.match(js, /data-client-notes-for-order/, "History rows link directly to their notes");
assert.match(js, /data-client-order/);
assert.match(js, /data-client-note-form/);
assert.doesNotMatch(js, /<select class="admin-select" data-client-status/, "Do not show a status dropdown");
assert.match(js, /data-delete-client-note/);
assert.match(js, /esc\(note\.text\)/, "Manager notes must be escaped before HTML rendering");
assert.match(js, /confirmAdminDelete\(/, "Use existing custom deletion confirmation for notes");
assert.match(css, /admin-client-order__note-panel/);
console.log("PASS: customer statuses, history, notes, storage, safety, and admin integration");
