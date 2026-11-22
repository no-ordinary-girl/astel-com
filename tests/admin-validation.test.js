#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/admin-validation.css'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/admin-validation.js'), 'utf8');

assert.match(html, /<html\s+lang="uk"/);
assert.match(html, /css\/admin-validation\.css/);
assert.match(html, /js\/admin-validation\.js/);
assert.match(html, /id="admin-add-category-form"[^>]*novalidate/);
assert.match(html, /id="admin-new-product-form"[\s\S]*?novalidate/);
assert.match(html, /pattern="\[a-z0-9\\-\]\{3,70\}"/, 'ID pattern must be valid in Chromium Unicode-v mode');
assert.match(admin, /<form novalidate class="admin-order-editor"/);
assert.match(admin, /<form novalidate class="admin-product-details-form/);
assert.match(admin, /AstelAdminValidation\.validateForm\(form\)/);
assert.match(css, /\.admin-validation-invalid/);

const listeners = new Map();
const document = {
  readyState: 'loading',
  addEventListener(name, handler, capture) { (listeners.get(name) || listeners.set(name, []).get(name)).push({ handler, capture }); },
  createElement(tagName) {
    return {
      tagName,
      attributes: {},
      className: '',
      setAttribute(key, value) { this.attributes[key] = value; },
      remove() { this.removed = true; },
    };
  },
};
const sandbox = { document, module: { exports: {} } };
vm.runInNewContext(script, sandbox);
const api = sandbox.module.exports;
const invalidHandlers = listeners.get('invalid');
const submitHandlers = listeners.get('submit');
assert.equal(invalidHandlers[0].capture, true);
assert.equal(submitHandlers[0].capture, true);

function fakeField({ tagName = 'INPUT', type = 'text', name = '', validity = { valid: true }, min = '', max = '' } = {}) {
  const attributes = new Map();
  const classes = new Set();
  return {
    tagName, type, name, validity, min, max,
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    getAttribute: key => attributes.has(key) ? attributes.get(key) : null,
    setAttribute: (key, val) => attributes.set(key, String(val)),
    removeAttribute: key => attributes.delete(key),
    insertAdjacentElement(where, node) { assert.equal(where, 'afterend'); this.lastError = node; },
    focus() { this.focused = true; },
    scrollIntoView() {},
    closest() { return null; },
  };
}
assert.equal(api.messageFor(fakeField({ validity: { valid: false, valueMissing: true } })), 'Заповніть це поле.');
assert.equal(api.messageFor(fakeField({ tagName: 'SELECT', validity: { valid: false, valueMissing: true } })), 'Оберіть значення зі списку.');
assert.equal(api.messageFor(fakeField({ type: 'email', validity: { valid: false, typeMismatch: true } })), 'Введіть коректну адресу електронної пошти.');
assert.match(api.messageFor(fakeField({ name: 'id', validity: { valid: false, patternMismatch: true } })), /лише малі латинські літери/);
assert.match(api.messageFor(fakeField({ type: 'number', min: '1', validity: { valid: false, rangeUnderflow: true } })), /не меншим за 1/);

const one = fakeField({ validity: { valid: false, valueMissing: true } });
const two = fakeField();
const form = {
  matches: name => name === 'form',
  querySelectorAll: () => [one, two],
};
let blocked = false;
submitHandlers[0].handler({ target: form, preventDefault() { blocked = true; }, stopImmediatePropagation() { blocked = true; } });
assert.ok(blocked, 'invalid submit must not reach admin data-saving handlers');
assert.equal(one.lastError.textContent, 'Заповніть це поле.');
assert.ok(one.focused);
assert.equal(one.getAttribute('aria-invalid'), 'true');
one.validity = { valid: true };
api.clearField(one);
assert.equal(one.lastError.removed, true);
assert.equal(one.getAttribute('aria-invalid'), null);
blocked = false;
submitHandlers[0].handler({ target: form, preventDefault() { blocked = true; }, stopImmediatePropagation() { blocked = true; } });
assert.equal(blocked, false, 'valid submits must reach their existing handlers');
console.log('PASS: Ukrainian inline validation, native popup suppression, dynamic form support and lifecycle');
