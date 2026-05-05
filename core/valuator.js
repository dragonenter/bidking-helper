// core/valuator.js
import { GLOBAL_EXACT } from '../data/globals.js';

/**
 * Compute expected vault value, plus 5/95 percentiles, given feasible combos
 * and an optional category.
 *
 * Each combo is valued as:
 *   V(combo) = count_purple × purpleItem
 *            + count_gold   × orangeItem
 *            + count_red    × redItem
 * (counts of blue/green/white treated as zero contribution in v1)
 *
 * If category is null, GLOBAL_EXACT is used.
 */
export function valuate(combos, category) {
  const src = category ?? GLOBAL_EXACT;
  const purpleItem = src.purpleItem;
  const orangeItem = src.orangeItem;
  const redItem = src.redItem;

  if (combos.length === 0) {
    return { expected: 0, p5: 0, p95: 0, combos: 0 };
  }

  const values = combos.map(
    (c) =>
      (c.count_purple ?? 0) * purpleItem +
      (c.count_gold ?? 0) * orangeItem +
      (c.count_red ?? 0) * redItem
  );
  values.sort((a, b) => a - b);

  const expected = values.reduce((s, v) => s + v, 0) / values.length;
  const p5 = percentile(values, 0.05);
  const p95 = percentile(values, 0.95);

  return { expected, p5, p95, combos: combos.length, min: values[0], max: values[values.length - 1] };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}
