const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/admin-customers.css'), 'utf8');
assert.match(js, /class="admin-client-order__state admin-client-order__state--\$\{/);
for (const code of ['active', 'processing', 'shipped', 'completed', 'canceled']) {
  assert.match(js, new RegExp('"' + code + '"'), 'Missing order status code ' + code);
}
const styles = {
  processing: '#b45309',
  shipped: '#1d4ed8',
  completed: '#059669',
  canceled: '#dc2626',
};
for (const [code, color] of Object.entries(styles)) {
  const block = css.match(new RegExp('\\.admin-client-order__state--' + code + '\\s*\\{([^}]+)\\}'));
  assert.ok(block, 'Missing status CSS: ' + code);
  assert.match(block[1], new RegExp('color:\\s*' + color, 'i'));
  assert.match(block[1], /background:/);
}
assert.match(css, /\.admin-client-order__state\s*\{/);
console.log('Client order status mapping/colors OK');
