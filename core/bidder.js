import { ROUND_RULES } from '../data/globals.js';

/**
 * Convert a vault valuation { expected, p5, p95 } into per-round bid suggestions.
 *   burst:        bid required to trigger early-end multiplier (R1-R4 only)
 *   conservative: 5th-percentile valuation — safe bid that won't lose money on bad combos
 *   aggressive:   95th-percentile (R1-R4) or expected × 0.95 (R5)
 */
export function suggestBids({ expected, p5, p95 }, round) {
  const rule = ROUND_RULES[round];
  if (!rule) throw new Error(`unknown round: ${round}`);

  const burst = round < 5 ? expected * rule.multiplier : null;
  const conservative = p5;
  const aggressive = round < 5 ? p95 : expected * 0.95;

  return { burst, conservative, aggressive, rule: rule.label };
}
