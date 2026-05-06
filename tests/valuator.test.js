// tests/valuator.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valuate } from '../core/valuator.js';
import { CATEGORY_DATA } from '../data/categories.js';

test('valuate items_category sums purple+gold+red items × per-item average for chosen category', () => {
  const combos = [
    { count_purple: 2, count_gold: 1, count_red: 0, grid_purple: 1, grid_gold: 1, grid_red: 0 },
  ];
  const cat = CATEGORY_DATA.find((c) => c.name === '武器装备');
  const r = valuate(combos, cat);
  // Expected: 2*1.22 + 1*5.10 + 0*27.71 = 7.54
  assert.equal(Math.round(r.items_category.expected * 100) / 100, 7.54);
  assert.equal(r.combos, 1);
});

test('valuate items_category produces p5 ≤ expected ≤ p95 across many combos', () => {
  const combos = Array.from({ length: 50 }, (_, i) => ({
    count_purple: i, count_gold: 1, count_red: 0,
    grid_purple: null, grid_gold: null, grid_red: null,
  }));
  const cat = CATEGORY_DATA[0];
  const r = valuate(combos, cat);
  assert.ok(r.items_category.p5 <= r.items_category.expected);
  assert.ok(r.items_category.expected <= r.items_category.p95);
});

test('valuate items_category without category falls back to GLOBAL_EXACT', () => {
  const combos = [{ count_purple: 0, count_gold: 0, count_red: 1, grid_purple: 0, grid_gold: 0, grid_red: 5 }];
  const r = valuate(combos, null);
  // GLOBAL_EXACT.redItem = 22.972 → expected ≈ 22.972
  assert.ok(Math.abs(r.items_category.expected - 22.972) < 0.01);
});

test('redDistribution keys sum to 1.0', () => {
  const combos = [
    { count_purple: 1, count_gold: 1, count_red: 0, grid_purple: null, grid_gold: null, grid_red: null },
    { count_purple: 1, count_gold: 1, count_red: 1, grid_purple: null, grid_gold: null, grid_red: null },
    { count_purple: 1, count_gold: 1, count_red: 2, grid_purple: null, grid_gold: null, grid_red: null },
  ];
  const r = valuate(combos, null);
  const total = Object.values(r.redDistribution).reduce((s, v) => s + v, 0);
  assert.ok(Math.abs(total - 1.0) < 1e-9);
});

test('items_conservative.expected for combo {count_gold:1, count_red:1} equals 12.0', () => {
  const combos = [{ count_gold: 1, count_red: 1, count_purple: 0, count_blue: 0,
                    grid_gold: null, grid_red: null, grid_purple: null, grid_blue: null }];
  const r = valuate(combos, null);
  // 1*2.0 + 1*10.0 = 12.0
  assert.equal(r.items_conservative.expected, 12.0);
});

test('grid_market returns numeric values when grid fields are filled', () => {
  const combos = [{ count_gold: 2, count_red: 1, count_purple: 3, count_blue: 0,
                    grid_gold: 4, grid_red: 5, grid_purple: 6, grid_blue: null }];
  const r = valuate(combos, null);
  assert.ok(typeof r.grid_market.expectedLow === 'number');
  assert.ok(typeof r.grid_market.expectedHigh === 'number');
  assert.ok(r.grid_market.expectedLow <= r.grid_market.expectedHigh);
});
