// Run with: node tests/cart-rules.test.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const storage = new Map();
const localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, value); },
};
const document = {
  addEventListener() {},
  querySelectorAll() { return []; },
};
function evaluate(source, context) {
  return vm.runInContext(source, context);
}
function load(filename, context) {
  evaluate(fs.readFileSync(path.join(root, "js", filename), "utf8"), context);
}
const context = vm.createContext({ document, localStorage });
load("products-data.js", context);
load("cart.js", context);
evaluate("CartManager.showToast = () => {};", context);

const policies = evaluate(
  "Object.values(PRODUCTS_DATA).map(({id, saleTermsCode, minOrderQty}) => ({id, saleTermsCode, minOrderQty}))",
  context,
);
assert.equal(policies.length, 15);
for (const product of policies) {
  const expected = product.saleTermsCode === "retail" ? 1 : 10;
  assert.equal(product.minOrderQty, expected, `Wrong minimum for ${product.id}`);
  assert.equal(evaluate(`CartManager.getMinQty(${JSON.stringify(product.id)})`, context), expected);
}
assert.equal(policies.filter((item) => item.minOrderQty === 1).length, 6);

evaluate('CartManager.addItem(PRODUCTS_DATA["battery-iwl220"], 1)', context);
evaluate('CartManager.addItem(PRODUCTS_DATA["com-900-485"], 10)', context);
const expectedCart = [["battery-iwl220", 1, 1], ["com-900-485", 10, 10]];
const snapshot = 'CartManager.getCart().map(({id, qty, minQty}) => [id, qty, minQty])';
assert.deepEqual(JSON.parse(JSON.stringify(evaluate(snapshot, context))), expectedCart);

// A page without products-data.js can still render the existing cart correctly.
const noCatalog = vm.createContext({ document, localStorage });
load("cart.js", noCatalog);
assert.deepEqual(JSON.parse(JSON.stringify(evaluate(snapshot, noCatalog))), expectedCart);
evaluate('CartManager.updateQty("battery-iwl220", 0)', noCatalog);
assert.equal(evaluate('CartManager.getCart().find((item) => item.id === "battery-iwl220").qty', noCatalog), 1);
console.log("PASS: product minimum quantities and saved cart compatibility");
