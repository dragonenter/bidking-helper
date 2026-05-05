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
