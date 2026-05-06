// core/valuator.js
import { GLOBAL_EXACT, CONSERVATIVE, MARKET_GRID, RED_GRID_BOUNDS } from '../data/globals.js';

/**
 * Compute vault valuations across three models, plus red count distribution.
 *
 * Returns:
 *   {
 *     items_category:     { expected, p5, p95, min, max }  — 品类件价 (per-item × category avg)
 *     items_conservative: { expected, p5, p95, min, max }  — 保底价 (gold×2 + red×10)
 *     grid_market:        { expectedLow, expectedHigh, p5Low, p95High, min, max }  — 格价范围
 *     redDistribution:    { '0': 0.12, '1': 0.35, ... }   — uniform prior over combos
 *     combos:             N
 *   }
 *
 * @param {object[]} combos  — feasible combos from enumerateCombos()
 * @param {object|null} category — category entry from CATEGORY_DATA, or null → GLOBAL_EXACT
 */
export function valuate(combos, category) {
  if (combos.length === 0) {
    return {
      items_category:     { expected: 0, p5: 0, p95: 0, min: 0, max: 0 },
      items_conservative: { expected: 0, p5: 0, p95: 0, min: 0, max: 0 },
      grid_market:        { expectedLow: 0, expectedHigh: 0, p5Low: 0, p95High: 0, min: 0, max: 0 },
      redDistribution:    {},
      combos: 0,
    };
  }

  // ── 品类件价 ──────────────────────────────────────────────────────────────
  const src = category ?? GLOBAL_EXACT;
  const purpleItem = src.purpleItem;
  const orangeItem = src.orangeItem;
  const redItem    = src.redItem;

  const catValues = combos.map(
    (c) =>
      (c.count_purple ?? 0) * purpleItem +
      (c.count_gold   ?? 0) * orangeItem +
      (c.count_red    ?? 0) * redItem
  );
  catValues.sort((a, b) => a - b);

  // ── 保底价 ────────────────────────────────────────────────────────────────
  const consvValues = combos.map(
    (c) =>
      (c.count_gold ?? 0) * CONSERVATIVE.goldItem +
      (c.count_red  ?? 0) * CONSERVATIVE.redItem
  );
  consvValues.sort((a, b) => a - b);

  // ── 格价范围 ──────────────────────────────────────────────────────────────
  // For each combo compute [gridLow, gridHigh]
  const gridPairs = combos.map((c) => {
    const gGold   = c.grid_gold   ?? 0;
    const gPurple = c.grid_purple ?? 0;

    // If grid_red is pinned, use it for both low and high
    // If not, use count_red × floor / count_red × ceil
    const cntRed = c.count_red ?? 0;
    const redGridLow  = c.grid_red !== null && c.grid_red !== undefined
      ? c.grid_red
      : cntRed * RED_GRID_BOUNDS.floor;
    const redGridHigh = c.grid_red !== null && c.grid_red !== undefined
      ? c.grid_red
      : cntRed * RED_GRID_BOUNDS.ceil;

    const low  = gGold * MARKET_GRID.goldGrid
               + gPurple * MARKET_GRID.purpleGrid
               + redGridLow  * MARKET_GRID.redGridMin;
    const high = gGold * MARKET_GRID.goldGrid
               + gPurple * MARKET_GRID.purpleGrid
               + redGridHigh * MARKET_GRID.redGridMax;

    return { low, high };
  });

  const gridLows  = gridPairs.map((p) => p.low).sort((a, b) => a - b);
  const gridHighs = gridPairs.map((p) => p.high).sort((a, b) => a - b);
  const gridMids  = gridPairs.map((p) => (p.low + p.high) / 2).sort((a, b) => a - b);

  const expectedLow  = gridLows.reduce((s, v) => s + v, 0)  / gridLows.length;
  const expectedHigh = gridHighs.reduce((s, v) => s + v, 0) / gridHighs.length;

  // ── 红件数概率分布 ─────────────────────────────────────────────────────────
  const redCounts = {};
  for (const c of combos) {
    const k = String(c.count_red ?? 0);
    redCounts[k] = (redCounts[k] ?? 0) + 1;
  }
  const redDistribution = {};
  for (const [k, cnt] of Object.entries(redCounts)) {
    redDistribution[k] = cnt / combos.length;
  }

  return {
    items_category: {
      expected: catValues.reduce((s, v) => s + v, 0) / catValues.length,
      p5:  percentile(catValues, 0.05),
      p95: percentile(catValues, 0.95),
      min: catValues[0],
      max: catValues[catValues.length - 1],
    },
    items_conservative: {
      expected: consvValues.reduce((s, v) => s + v, 0) / consvValues.length,
      p5:  percentile(consvValues, 0.05),
      p95: percentile(consvValues, 0.95),
      min: consvValues[0],
      max: consvValues[consvValues.length - 1],
    },
    grid_market: {
      expectedLow,
      expectedHigh,
      p5Low:   percentile(gridMids, 0.05),
      p95High: percentile(gridMids, 0.95),
      min: gridLows[0],
      max: gridHighs[gridHighs.length - 1],
    },
    redDistribution,
    combos: combos.length,
  };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}
