const assert = require('node:assert/strict');
const path = require('node:path');
const NativeDate = Date;
let simulatedTime = new NativeDate(2026, 10, 27, 14, 0, 0).getTime();

// Drive the local-calendar date across midnight without waiting for a real day.
global.Date = class MockDate extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [simulatedTime])); }
  static now() { return simulatedTime; }
};

const elements = new Map();
const el = (id) => {
  if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', value: 'all', attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } });
  return elements.get(id);
};
const handlers = {};
const timers = [];
const windowHandlers = {};
const panel = { addEventListener() {} };
global.document = {
  hidden: false,
  getElementById(id) {
    if (id === 'panel-activity') return panel;
    if (id === 'admin-activity-manager') return null;
    if (['admin-activity-list', 'tab-count-activity', 'admin-activity-total', 'admin-activity-today', 'admin-activity-people', 'admin-activity-matches'].includes(id)) return el(id);
    return null;
  },
  addEventListener(name, listener) { handlers[name] = listener; },
  querySelectorAll() { return []; },
};
global.window = {
  addEventListener(name, listener) { windowHandlers[name] = listener; },
  setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
};
const store = { value: [], getItem() { return JSON.stringify(this.value); } };
global.localStorage = store;
const activity = require(path.join(__dirname, '../js/admin-activity.js'));
const entry = (id, date, type = 'order') => ({
  id, createdAt: date.getTime(), actorName: 'Сергій', type,
  action: 'updated', entityId: id, entityType: 'order', summary: `Запис ${id}`, detail: '',
});
store.value = [
  entry('today-1', new NativeDate(2026, 10, 27, 0, 0, 1)),
  entry('today-2', new NativeDate(2026, 10, 27, 12, 0), 'payment'),
  entry('yesterday', new NativeDate(2026, 10, 26, 23, 59, 59)),
];
handlers.DOMContentLoaded();
assert.equal(el('tab-count-activity').textContent, '2', 'tab badge counts only actions on the local calendar day');
assert.equal(el('admin-activity-total').textContent, '3', 'journal retains total history');
assert.equal(el('admin-activity-today').textContent, '2', 'today stat and tab badge match');
assert.equal(el('tab-count-activity').attrs['aria-label'], 'Дій сьогодні: 2');
assert.equal(timers.length, 1);
assert.ok(timers[0].delay > 0 && timers[0].delay < 24 * 3600 * 1000);

// The badge is independent of journal filters.
activity.renderGlobal();
assert.equal(el('tab-count-activity').textContent, '2');

// When the admin page is kept open past midnight, the timer refreshes the badge.
simulatedTime = new NativeDate(2026, 10, 28, 0, 0, 1).getTime();
timers.shift().callback();
assert.equal(el('tab-count-activity').textContent, '0');
assert.equal(el('admin-activity-total').textContent, '3');
assert.equal(timers.length, 1, 'next local-midnight refresh is scheduled');

// Returning to a browser tab refreshes the badge after new local events.
store.value.unshift(entry('new-day', new NativeDate(2026, 10, 28, 0, 0, 1)));
windowHandlers.focus();
assert.equal(el('tab-count-activity').textContent, '1');
assert.equal(el('admin-activity-today').textContent, '1');
assert.equal(el('admin-activity-total').textContent, '4');
console.log('Daily activity badge, retained history, midnight rollover: OK');
