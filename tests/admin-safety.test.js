#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const {escapeHtml,normalizeTtn,isValidTtn,safeImageUrl}=require('../js/admin.js');
assert.equal(escapeHtml('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(escapeHtml(`a'&b`),'a&#39;&amp;b');
assert.equal(escapeHtml(undefined),'');
assert.equal(normalizeTtn('  ab 123  '),'AB123');
assert.equal(isValidTtn('20450918273645','nova'),true);
assert.equal(isValidTtn('1234','nova'),false);
assert.equal(isValidTtn('RR123456789UA','ukr'),true);
assert.equal(isValidTtn('RR12345UA','ukr'),false);
assert.equal(isValidTtn('MEEST-1234567','meest'),true);
assert.equal(isValidTtn('<svg/onload=1>','meest'),false);
assert.equal(safeImageUrl('assets/images/items/СОМ-900-485.png'),'assets/images/items/СОМ-900-485.png');
assert.equal(safeImageUrl('https://attacker.invalid/a.png'),'assets/images/logo-main.svg');
assert.equal(safeImageUrl('assets/images/../secret.svg'),'assets/images/logo-main.svg');
console.log('PASS: admin escaping, tracking-number and image URL validation');
