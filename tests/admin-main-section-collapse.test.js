"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const adminSource = fs.readFileSync(path.join(__dirname, "../js/admin.js"), "utf8");
const activitySource = fs.readFileSync(path.join(__dirname, "../js/admin-activity.js"), "utf8");

const match = adminSource.match(/    function closeNestedAdminPanels\(\) \{[\s\S]*?\n    \}\n\n    \/\/ Switch Admin Tabs/);
assert.ok(match, "Main-section cleanup must exist");
assert.match(adminSource, /if \(!btn\.classList\.contains\("is-active"\)\) closeNestedAdminPanels\(\)/);
assert.match(activitySource, /function closeOrderHistories\(\)/);

function node(attrs = {}) {
  const classNames = new Set(attrs.classes || []);
  return {
    hidden: attrs.hidden ?? false,
    textContent: attrs.textContent || "",
    properties: {},
    setAttribute(k, v) { this.properties[k] = String(v); },
    classList: { remove(k) { classNames.delete(k); }, contains(k) { return classNames.has(k); } },
  };
}

function makeScenario() {
  const orderTab = node({ classes: ["is-active"] });
  const orderPane = node();
  const orderControls = node({ hidden: true });
  const noteButton = node({ textContent: "Скасувати" });
  const noteForm = node();
  noteForm.elements = { note: { value: "Текст чернетки" } };
  const groups = new Map([
    ["[data-order-tab]", [orderTab]],
    ["[data-order-pane]", [orderPane]],
    [".admin-order-card__controls", [orderControls]],
    ["[data-admin-order-note-compose]", [noteButton]],
    ["[data-admin-order-note-form]", [noteForm]],
  ]);
  const savedProductField = { value: "Не збережена зміна" };
  let clientRenders = 0;
  let collapsedProduct = null;
  const states = {
    activeOrderPanes: new Map([["o1", "edit"]]),
    editingOrderIds: new Set(["o1"]),
    expandedOrderNoteIds: new Set(["o1"]),
    openOrderNoteComposers: new Set(["o1"]),
    expandedClientKeys: new Set(["client1"]),
    customerSelectedOrders: new Map([["client1", "o1"]]),
    openClientNoteComposers: new Set(["client1::o1"]),
    detailOpen: new Set(["product1"]),
    ordersContainer: { querySelectorAll: (selector) => groups.get(selector) || [] },
    AstelAdminActivity: { closeOrderHistories() { this.called = (this.called || 0) + 1; } },
    renderClientsTable() { clientRenders += 1; },
    buildClientsList: () => [],
    loadAllOrders: () => [],
    showDetails(id) { collapsedProduct = id; },
  };
  const close = vm.runInNewContext(`(${match[0].split("\n\n    // Switch Admin Tabs")[0].trim()})`, states);
  return { states, close, orderTab, orderPane, orderControls, noteButton, noteForm, savedProductField,
    get clientRenders() { return clientRenders; }, get collapsedProduct() { return collapsedProduct; } };
}

test("switching main admin tabs collapses nested order, customer and product sections", () => {
  const s = makeScenario();
  s.close();
  const t = s.states;
  for (const name of ["activeOrderPanes", "editingOrderIds", "expandedOrderNoteIds", "openOrderNoteComposers", "expandedClientKeys", "customerSelectedOrders", "openClientNoteComposers", "detailOpen"])
    assert.equal(t[name].size, 0, `${name} must be reset`);
  assert.equal(s.orderTab.classList.contains("is-active"), false);
  assert.equal(s.orderTab.properties["aria-expanded"], "false");
  assert.equal(s.orderPane.hidden, true);
  assert.equal(s.orderControls.hidden, false);
  assert.equal(s.noteForm.hidden, true);
  assert.equal(s.noteButton.textContent, "+ Додати примітку");
  assert.equal(s.noteForm.elements.note.value, "Текст чернетки", "Closing must not discard typed notes");
  assert.equal(s.savedProductField.value, "Не збережена зміна", "Closing must not discard product drafts");
  assert.equal(t.AstelAdminActivity.called, 1);
  assert.equal(s.collapsedProduct, "product1");
});

test("switching away from clients renders collapsed client details", () => {
  const s = makeScenario();
  s.close();
  assert.equal(s.clientRenders, 1);
});

test("switching other tabs does not need to rerender closed clients", () => {
  const s = makeScenario();
  s.states.expandedClientKeys.clear();
  s.close();
  assert.equal(s.clientRenders, 0);
});
