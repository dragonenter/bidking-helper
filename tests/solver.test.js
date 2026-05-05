// tests/solver.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPossiblePairs } from '../core/solver.js';

test('getPossiblePairs returns (count, totalGrids) pairs matching truncated avg', () => {
  // avg=0.5 means actual avg ∈ [0.50, 0.51); valid (k, G) pairs:
  //   k=2: G=1 (0.50)
  //   k=4: G=2 (0.50)
  //   k=6: G=3 (0.50)
  //   ...
  const pairs = getPossiblePairs(0.5, 6);
  const counts = pairs.map((p) => p.count);
  assert.ok(counts.includes(2));
  assert.ok(counts.includes(4));
  assert.ok(counts.includes(6));
});

test('getPossiblePairs respects upper bound', () => {
  const pairs = getPossiblePairs(0.5, 3);
  assert.ok(pairs.every((p) => p.count <= 3));
});

test('getPossiblePairs returns nothing for impossible avg', () => {
  // avg=0.005 is between 0.00 and 0.01; for any k ≤ 20,
  // the window [0.005k, 0.015k) contains no integer (since 0.015*20 = 0.3 < 1).
  // So no valid (k, G) pair exists within maxCount=20.
  const pairs = getPossiblePairs(0.005, 20);
  assert.equal(pairs.length, 0);
});

// tests/solver.test.js (append)
import { enumerateCombos } from '../core/solver.js';

test('enumerateCombos with total=10 and victor_total_all=4 yields combos summing to 4', () => {
  const combos = enumerateCombos({
    total_all: 10,
    victor_total_all: 4,
  });
  assert.ok(combos.length > 0);
  for (const c of combos) {
    const purplePlusGoldPlusRed = c.count_purple + c.count_gold + c.count_red;
    assert.equal(purplePlusGoldPlusRed, 4);
    // blue + white + green = total_all - victor_total_all = 10 - 4 = 6
    assert.equal(c.count_blue + (c.count_wg ?? 0), 6);
  }
});

test('enumerateCombos with full lavin info collapses to 1 combo', () => {
  const combos = enumerateCombos({
    count_blue: 2,
    count_purple: 3,
    count_gold: 4,
    count_red: 1,
    wg_total: 5,
  });
  assert.equal(combos.length, 1);
  assert.equal(combos[0].count_red, 1);
  assert.equal(combos[0].count_blue + combos[0].count_purple, 5);
});

test('enumerateCombos with avg_gold=0.5 and total_all=10 returns combos with gold pairs', () => {
  const combos = enumerateCombos({
    total_all: 10,
    avg_gold: 0.5,
  });
  assert.ok(combos.length > 0);
  for (const c of combos) {
    assert.ok(c.grid_gold !== null);
    // For each gold count k > 0, grid_gold ≈ k · 0.5x
    if (c.count_gold > 0) {
      const actual = c.grid_gold / c.count_gold;
      assert.ok(actual >= 0.5 && actual < 0.51);
    }
  }
});
