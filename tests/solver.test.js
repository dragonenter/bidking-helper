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
