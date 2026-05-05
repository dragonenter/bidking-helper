import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLOBAL_EXACT, GRID_PRICES, ROUND_RULES } from '../data/globals.js';

test('GLOBAL_EXACT carries known sarkozyfan baseline', () => {
  assert.equal(GLOBAL_EXACT.purpleItem, 0.891);
  assert.equal(GLOBAL_EXACT.orangeItem, 4.661);
  assert.equal(GLOBAL_EXACT.redItem, 22.972);
});

test('GRID_PRICES has all six qualities', () => {
  for (const q of ['white', 'green', 'blue', 'purple', 'gold', 'red']) {
    assert.ok(q in GRID_PRICES, `${q} missing`);
  }
  assert.equal(GRID_PRICES.purple, 0.28);
  assert.equal(GRID_PRICES.gold, 1.13);
  assert.equal(GRID_PRICES.red, 4.77);
});

test('ROUND_RULES covers 1..5 with descending multipliers', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((r) => ROUND_RULES[r].multiplier),
    [2.0, 1.6, 1.4, 1.2, 1.0]
  );
});
