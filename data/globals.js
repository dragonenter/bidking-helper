// data/globals.js
// Source: sarkozyfan/bidking-bot manual_bidking_advisor.py + price_config.json

export const GLOBAL_EXACT = {
  purpleItem: 0.891,
  orangeItem: 4.661,
  redItem: 22.972,
  orangeGrid: 1.13,
  purpleGrid: 0.28,
  redGridMin: 4.77,
  redGridMax: 6.78,
};

// CONSERVATIVE valuation: per-item floor estimate (worst-case)
// Source: wstwxl/Bidking-web
export const CONSERVATIVE = {
  goldItem: 2.0,   // 金件保守 2w
  redItem: 10.0,   // 红件保守 10w
};

// MARKET_GRID valuation: per-grid market estimate
// Source: wstwxl/Bidking-web
export const MARKET_GRID = {
  goldGrid: 1.13,
  purpleGrid: 0.28,
  redGridMin: 4.77,
  redGridMax: 6.78,
};

// Uncertainty range for unknown red avg-grid (grids per red item)
// Source: wstwxl/Bidking-web
export const RED_GRID_BOUNDS = {
  floor: 1,   // assume 1 grid per red item (floor)
  ceil: 18,   // assume 18 grids per red item (ceiling)
};

export const GRID_PRICES = {
  white: 0.0,
  green: 0.0,
  blue: 0.0,
  purple: 0.28,
  gold: 1.13,
  red: 4.77,
};

export const ROUND_RULES = {
  1: { multiplier: 2.0, label: '两倍出价第二直接获得' },
  2: { multiplier: 1.6, label: '1.6 倍出价第二直接获得' },
  3: { multiplier: 1.4, label: '1.4 倍出价第二直接获得' },
  4: { multiplier: 1.2, label: '1.2 倍出价第二直接获得' },
  5: { multiplier: 1.0, label: '最高价获胜' },
};
