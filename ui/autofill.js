// ui/autofill.js
// Apply parser output to the form inputs and trigger recompute.

import { FIELD_LABELS } from '../data/roles.js';

// Fields the parser may produce → corresponding input IDs (rendered by form.js as f_<fieldname>)
const APPLIABLE_FIELDS = [
  'total_all',
  'victor_total_all',
  'total_grid_all',
  'wg_total',
  'count_blue', 'count_purple', 'count_gold', 'count_red',
  'grid_blue', 'grid_purple', 'grid_gold', 'grid_red',
  'avg_blue', 'avg_purple', 'avg_gold', 'avg_red',
];

/**
 * Apply parsed values to existing form inputs (by id `f_<field>`).
 * Skips fields whose input doesn't exist (because current role doesn't expose them).
 * Returns array of fields actually applied: [{ field, value, applied: true|false, reason? }]
 */
export function applyParsedToForm(parsed, container) {
  const applied = [];
  for (const field of APPLIABLE_FIELDS) {
    if (parsed[field] === undefined || parsed[field] === null) continue;
    const input = container.querySelector(`#f_${field}`);
    if (!input) {
      applied.push({ field, value: parsed[field], applied: false, reason: 'field_not_visible' });
      continue;
    }
    const newValue = String(parsed[field]);
    if (input.value === newValue) {
      applied.push({ field, value: parsed[field], applied: false, reason: 'no_change' });
      continue;
    }
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true })); // triggers existing recompute
    applied.push({ field, value: parsed[field], applied: true });
  }
  return applied;
}

export function fieldLabel(name) {
  return FIELD_LABELS[name] ?? name;
}
