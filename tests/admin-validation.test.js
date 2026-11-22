#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
assert.match(html, /<html\s+lang="uk"/);
assert.match(html, /<script src="js\/admin-validation\.js"><\/script>/);
const handlers = {};
const document = { addEventListener(name, fn, capture) {
  assert.equal(capture, true, 'validation must listen in capture mode');
  (handlers[name] ||= []).push(fn);
} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/admin-validation.js'), 'utf8'), {document});
const dispatch = (name, target) => { for (const h of handlers[name] || []) h({target}); };
function field(properties = {}) {
  return {
    tagName: 'INPUT', type: 'text', name: '', validity: {},
    setCustomValidity(message) { this.message = message; },
    ...properties,
  };
}
const required = field({validity: {valueMissing: true}});
dispatch('invalid', required);
assert.equal(required.message, 'Заповніть це поле.');
dispatch('input', required);
assert.equal(required.message, '');
const email = field({type: 'email', validity: {typeMismatch: true}});
dispatch('invalid', email);
assert.equal(email.message, 'Введіть коректну адресу електронної пошти.');
const category = field({tagName: 'SELECT', validity: {valueMissing: true}});
dispatch('invalid', category);
assert.equal(category.message, 'Оберіть значення зі списку.');
const photo = field({type: 'file', validity: {valueMissing: true}});
dispatch('invalid', photo);
assert.equal(photo.message, 'Виберіть файл.');
const id = field({name: 'id', validity: {patternMismatch: true}});
dispatch('invalid', id);
assert.match(id.message, /латинські літери/);
const price = field({type: 'number', min: '1', validity: {rangeUnderflow: true}});
dispatch('invalid', price);
assert.equal(price.message, 'Значення має бути не меншим за 1.');
const otherModule = field({validity: {customError: true}, message: 'Інше правило перевірки'});
dispatch('invalid', otherModule);
assert.equal(otherModule.message, 'Інше правило перевірки', 'do not override external custom validity');
console.log('PASS: all built-in admin validation prompts localized to Ukrainian');
