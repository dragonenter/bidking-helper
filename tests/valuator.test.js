// tests/valuator.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuate } from '../core/valuator.js';
import { CATEGORY_DATA } from '../data/categories.js';

test('valuate sums purple+gold+red items × per-item average for chosen category', () => {
  const combos = [
    { count_purple: 2, count_gold: 1, count_red: 0, grid_purple: 1, grid_gold: 1, grid_red: 0 },
  ];
  const cat = CATEGORY_DATA.find((c) => c.name === '武器装备');
  const r = valuate(combos, cat);
  // Expected: 2*1.22 + 1*5.10 + 0*27.71 = 7.54
  assert.equal(Math.round(r.expected * 100) / 100, 7.54);
  assert.equal(r.combos, 1);
});

test('valuate produces p5 ≤ expected ≤ p95 across many combos', () => {
  const combos = Array.from({ length: 50 }, (_, i) => ({
    count_purple: i, count_gold: 1, count_red: 0,
    grid_purple: null, grid_gold: null, grid_red: null,
  }));
  const cat = CATEGORY_DATA[0];
  const r = valuate(combos, cat);
  assert.ok(r.p5 <= r.expected);
  assert.ok(r.expected <= r.p95);
});

test('valuate without category falls back to GLOBAL_EXACT', () => {
  const combos = [{ count_purple: 0, count_gold: 0, count_red: 1, grid_purple: 0, grid_gold: 0, grid_red: 5 }];
  const r = valuate(combos, null);
  // GLOBAL_EXACT.redItem = 22.972 → expected ≈ 22.972
  assert.ok(Math.abs(r.expected - 22.972) < 0.01);
});
