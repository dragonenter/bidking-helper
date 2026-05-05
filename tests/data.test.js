import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLOBAL_EXACT, GRID_PRICES, ROUND_RULES } from '../data/globals.js';
import { CATEGORY_DATA } from '../data/categories.js';
import { ROLES } from '../data/roles.js';

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

test('CATEGORY_DATA has all 10 categories with required fields', () => {
  assert.equal(CATEGORY_DATA.length, 10);
  for (const cat of CATEGORY_DATA) {
    assert.ok(cat.id);
    assert.ok(cat.name);
    assert.equal(typeof cat.purpleItem, 'number');
    assert.equal(typeof cat.orangeItem, 'number');
    assert.equal(typeof cat.redItem, 'number');
    assert.equal(typeof cat.orangeGridMin, 'number');
    assert.equal(typeof cat.orangeGridMax, 'number');
    assert.equal(typeof cat.purpleGrid, 'number');
    assert.equal(typeof cat.redGridMin, 'number');
    assert.equal(typeof cat.redGridMax, 'number');
  }
});

test('CATEGORY_DATA matches sarkozyfan known values for 武器装备', () => {
  const weapons = CATEGORY_DATA.find((c) => c.name === '武器装备');
  assert.equal(weapons.redItem, 27.71);
  assert.equal(weapons.purpleGrid, 0.21);
});

test('ROLES contains all 7 v1 characters', () => {
  const expected = ['victor', 'ahmad', 'lavin', 'ethan', 'isabella', 'aisha', 'oldman'];
  for (const id of expected) {
    assert.ok(ROLES[id], `role ${id} missing`);
    assert.ok(ROLES[id].label);
    assert.ok(ROLES[id].fieldsByRound);
  }
});

test('ahmad role has fields per round 1..5', () => {
  const ahmad = ROLES.ahmad;
  for (const r of [1, 2, 3, 4, 5]) {
    assert.ok(Array.isArray(ahmad.fieldsByRound[r]));
  }
  assert.deepEqual(ahmad.fieldsByRound[2], ['avg_gold']);
});
