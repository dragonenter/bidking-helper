// tests/roi.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Stub localStorage for Node environment
globalThis.localStorage = {
  store: {},
  getItem(k) { return this.store[k] ?? null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
};

const { loadRoi, saveRoi } = await import('../ui/roi.js');

test('saveRoi + loadRoi round-trip', () => {
  saveRoi({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 });
  assert.deepEqual(loadRoi(), { x: 0.1, y: 0.2, w: 0.3, h: 0.4 });
});

test('loadRoi returns null when not set', () => {
  saveRoi(null);
  assert.equal(loadRoi(), null);
});

test('loadRoi returns null on malformed data', () => {
  globalThis.localStorage.setItem('bidking-helper-roi-v1', 'not json');
  assert.equal(loadRoi(), null);
});
