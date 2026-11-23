const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

test('admin dependencies are kept intact when changing fixed categories', () => {
  const customerCSS = '<link rel="stylesheet" href="css/admin-customers.css" />';
  const customerScript = '<script src="js/admin-customers.js"></script>';
  assert.ok(admin.includes(customerCSS), 'customer styling must remain loaded');
  assert.ok(admin.includes(customerScript), 'customer module must remain loaded');
  assert.ok(admin.indexOf(customerScript) < admin.indexOf('<script src="js/admin.js"></script>'),
    'customer module must run before admin.js');
  assert.ok(admin.includes('<th>Деталі</th>'), 'customer details column must remain visible');
  assert.match(admin, /П'ять базових категорій/);
});
