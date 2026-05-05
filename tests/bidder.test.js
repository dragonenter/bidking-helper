import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestBids } from '../core/bidder.js';

test('suggestBids in R1 uses 2.0× burst multiplier', () => {
  const r = suggestBids({ expected: 10, p5: 7, p95: 13 }, 1);
  // Burst threshold = expected * 2.0 = 20 (offer this to break the round)
  // Conservative = p5 (don't lose money on bad combos)
  assert.equal(r.burst, 20);
  assert.equal(r.conservative, 7);
  assert.equal(r.aggressive, 13);
});

test('suggestBids in R5 has no burst multiplier (highest wins)', () => {
  const r = suggestBids({ expected: 10, p5: 7, p95: 13 }, 5);
  assert.equal(r.burst, null);
  assert.equal(r.conservative, 7);
  assert.equal(r.aggressive, 9.5); // expected * 0.95
});

test('suggestBids handles zero combos gracefully', () => {
  const r = suggestBids({ expected: 0, p5: 0, p95: 0, combos: 0 }, 3);
  assert.equal(r.burst, 0);
  assert.equal(r.conservative, 0);
});
