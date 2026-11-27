// Regression guard for logged-in checkout initializing its city/branch pickers.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

for (const file of ['cart.html', 'en/cart.html']) {
  test(`${file}: signed-in checkout cannot skip autocomplete initialization`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const initAt = html.indexOf('CheckoutAutocomplete.init({');
    const loginReplacementAt = html.indexOf('returningTabPane.innerHTML =');
    assert.ok(initAt > 0 && loginReplacementAt > initAt,
      'dropdowns must initialize before the login form is removed');
    assert.match(html, /loginForm\?\.addEventListener\("submit"/,
      'the removed login form must not receive event listeners');
    assert.match(html, /\.getElementById\("forgot-pass-btn"\)\s*\?\.addEventListener/,
      'the removed password-recovery button must not receive event listeners');
    assert.equal(html.match(/CheckoutAutocomplete\.init\(\{/g)?.length, 1,
      'do not attach duplicate picker listeners');
  });
}

test('saved city/branch values do not prevent opening suggestions', () => {
  const js = fs.readFileSync(path.join(root, 'js/checkout-autocomplete.js'), 'utf8');
  assert.match(js, /picker\.getRows\(showAll \? "" : picker\.input\.value\)/);
  assert.match(js, /input\.addEventListener\("focus", \(\) => open\(picker, true\)\)/);
  assert.match(js, /input\.addEventListener\("input", \(\) => open\(picker\)\)/);
});
