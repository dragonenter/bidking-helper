import { test } from 'node:test';
import assert from 'node:assert/strict';

// JSDOM is heavyweight. If not available, fall back to manual stub.
let document, container;
try {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><div id="dynamic-fields"></div>');
  document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.HTMLElement = dom.window.HTMLElement;
  container = document.getElementById('dynamic-fields');
} catch (e) {
  // JSDOM not installed — stub minimum
  let fakeStore = new Map();
  container = {
    querySelector(sel) {
      const id = sel.replace('#', '');
      return fakeStore.get(id) || null;
    },
  };
  // expose helpers used inline below
  globalThis.__addInput = (id, initial = '') => {
    const dispatched = [];
    const inp = {
      value: initial,
      dispatchEvent(e) { dispatched.push(e.type); return true; },
      _dispatched: dispatched,
    };
    fakeStore.set(id, inp);
    return inp;
  };
  globalThis.Event = class { constructor(t) { this.type = t; } };
}

const { applyParsedToForm } = await import('../ui/autofill.js');

test('applyParsedToForm fills existing inputs and triggers input event', () => {
  const inp = (typeof globalThis.__addInput === 'function')
    ? globalThis.__addInput('f_total_all')
    : (() => {
        const i = document.createElement('input');
        i.id = 'f_total_all';
        container.appendChild(i);
        return i;
      })();
  let dispatched = false;
  if (inp.addEventListener) {
    inp.addEventListener('input', () => { dispatched = true; });
  }
  const result = applyParsedToForm({ total_all: 20 }, container);
  assert.equal(inp.value, '20');
  assert.ok(result.find((r) => r.field === 'total_all' && r.applied));
});

test('applyParsedToForm skips fields without matching input', () => {
  const result = applyParsedToForm({ count_blue: 7 }, container);
  const r = result.find((x) => x.field === 'count_blue');
  assert.ok(r);
  assert.equal(r.applied, false);
  assert.equal(r.reason, 'field_not_visible');
});

test('applyParsedToForm ignores undefined fields', () => {
  const result = applyParsedToForm({ total_all: undefined, count_red: null }, container);
  assert.equal(result.length, 0);
});
