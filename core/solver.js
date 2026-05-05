// core/solver.js
// Adapted from Oldzc/BidKing-Calculator (HTML) and VCY019/Bid-King-Calculator (Python).
// The game displays avg-grid truncated to 2 decimals. Given displayed value D,
// real avg ∈ [D, D+0.01). For count k, totalGrids G must satisfy
//   k·D ≤ G < k·(D+0.01)
// We enumerate all (k, G) within k ≤ maxCount.

export function getPossiblePairs(avgValue, maxCount = 20) {
  const pairs = [];
  for (let k = 1; k <= maxCount; k++) {
    const left = avgValue * k;
    const right = (avgValue + 0.01) * k;
    const startG = Math.ceil(left - 1e-9);
    if (startG < right - 1e-9) {
      pairs.push({
        count: k,
        totalGrids: startG,
        actualAvg: startG / k,
      });
    }
  }
  return pairs;
}

// core/solver.js (append)

const QUALITY_KEYS = ['blue', 'purple', 'gold', 'red'];
const MAX_PER_QUALITY = 20;
const MAX_TOTAL = 60;

/**
 * Enumerate all feasible combos satisfying the given constraints.
 * Constraints (all optional):
 *   total_all              total items
 *   victor_total_all       sum of purple+gold+red (Victor sees this)
 *   wg_total               sum of white+green
 *   count_<color>          exact count for a quality
 *   grid_<color>           exact total grids for a quality
 *   avg_<color>            displayed avg-grid for a quality (truncated to 0.01)
 *   highest_quality        'red' | 'gold' | 'purple' | 'blue' (max quality present)
 *
 * Returns array of:
 *   { count_blue, count_purple, count_gold, count_red,
 *     grid_blue, grid_purple, grid_gold, grid_red,
 *     count_wg }
 *   grid_* may be null when no avg/grid constraint pinned it.
 */
export function enumerateCombos(constraints = {}) {
  const c = constraints;
  const totalAll = c.total_all ?? null;
  const victorSum = c.victor_total_all ?? null;
  const wgTotal = c.wg_total ?? null;

  // Per-quality count candidates
  const candidates = {};
  for (const q of QUALITY_KEYS) {
    const cnt = c[`count_${q}`];
    const avg = c[`avg_${q}`];
    if (cnt !== undefined && cnt !== null) {
      candidates[q] = [{ count: cnt, totalGrids: c[`grid_${q}`] ?? null }];
    } else if (avg !== undefined && avg !== null) {
      const pairs = getPossiblePairs(avg, MAX_PER_QUALITY);
      candidates[q] = [{ count: 0, totalGrids: 0 }, ...pairs.map((p) => ({ count: p.count, totalGrids: p.totalGrids }))];
    } else {
      // No info — enumerate 0..MAX_PER_QUALITY counts (totalGrids unknown)
      candidates[q] = Array.from({ length: MAX_PER_QUALITY + 1 }, (_, k) => ({ count: k, totalGrids: null }));
    }
  }

  const out = [];
  for (const b of candidates.blue) {
    for (const p of candidates.purple) {
      for (const g of candidates.gold) {
        for (const r of candidates.red) {
          const sum = b.count + p.count + g.count + r.count;
          const pgr = p.count + g.count + r.count;

          if (victorSum !== null && pgr !== victorSum) continue;

          let countWG = null;
          if (wgTotal !== null) countWG = wgTotal;

          if (totalAll !== null) {
            const wg = totalAll - sum;
            if (wg < 0) continue;
            if (countWG !== null && countWG !== wg) continue;
            countWG = wg;
          }

          if (sum > MAX_TOTAL) continue;

          // highest_quality filter: ensures no higher quality has count > 0
          if (c.highest_quality) {
            const order = ['blue', 'purple', 'gold', 'red'];
            const idx = order.indexOf(c.highest_quality);
            if (idx === -1) continue;
            for (let i = idx + 1; i < order.length; i++) {
              const k = order[i];
              const cnt = { blue: b.count, purple: p.count, gold: g.count, red: r.count }[k];
              if (cnt > 0) { /* skip combo */ }
            }
            const higherSum = order.slice(idx + 1).reduce((s, k) => {
              const cnt = { blue: b.count, purple: p.count, gold: g.count, red: r.count }[k];
              return s + cnt;
            }, 0);
            if (higherSum > 0) continue;
            // The chosen highest quality must have count > 0
            const own = { blue: b.count, purple: p.count, gold: g.count, red: r.count }[c.highest_quality];
            if (own === 0) continue;
          }

          out.push({
            count_blue: b.count,
            count_purple: p.count,
            count_gold: g.count,
            count_red: r.count,
            grid_blue: b.totalGrids,
            grid_purple: p.totalGrids,
            grid_gold: g.totalGrids,
            grid_red: r.totalGrids,
            count_wg: countWG,
          });
        }
      }
    }
  }
  return out;
}
