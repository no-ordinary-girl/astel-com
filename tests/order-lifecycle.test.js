#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lifecycle = require("../js/order-lifecycle.js");
const root = path.resolve(__dirname, "..");
const now = 1_800_000_000_000;
const active = { orderId: "AK-test", locked: false, createdAt: now, expiresAt: now + lifecycle.EDIT_WINDOW_MS };
assert.equal(lifecycle.EDIT_WINDOW_MS, 900000);
assert.equal(lifecycle.isEditable(active, now), true);
assert.equal(lifecycle.isEditable(active, active.expiresAt - 1), true);
assert.equal(lifecycle.isEditable(active, active.expiresAt), false);
assert.equal(lifecycle.isReleased(active, now), false);
assert.equal(lifecycle.isReleased(active, active.expiresAt), true);
assert.equal(lifecycle.isEditable({ ...active, locked: true }, now), false);
assert.equal(lifecycle.isEditable({ ...active, expiresAt: NaN }, now), false);
const released = lifecycle.release(active, now);
assert.equal(released.locked, true);
assert.equal(released.statusCode, "processing");
assert.equal(released.finalizedAt, now);
assert.equal(lifecycle.isEditable(released, now), false);
assert.equal(active.locked, false, "release must not mutate input");
assert.equal(lifecycle.release({ ...active, statusCode: "shipped" }, now).statusCode, "shipped", "finalized orders must not be downgraded");
for (const file of ["order-status.html", "en/order-status.html"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(source, /OrderLifecycle\.release\(order\)/);
  assert.doesNotMatch(source, /finalizeOrderOnExit|beforeunload|visibilitychange/, "leaving the page must not submit an order");
  assert.match(source, /js\/order-lifecycle\.js/);
}
for (const file of ["cart.html", "en/cart.html"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(source, /OrderLifecycle\.isEditable\(existingOrder, now\)/, "expired edits must be blocked");
  assert.match(source, /js\/order-lifecycle\.js/);
}
const admin = fs.readFileSync(path.join(root, "js/admin.js"), "utf8");
assert.match(admin, /OrderLifecycle\.isEditable\(act, now\)/);
assert.match(admin, /OrderLifecycle\.isEditable\(ord, now\)/);
assert.match(admin, /window\.addEventListener\("storage"/);
console.log("PASS: 15-minute edit window, release, customer navigation, admin visibility, both languages");
