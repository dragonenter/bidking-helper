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
