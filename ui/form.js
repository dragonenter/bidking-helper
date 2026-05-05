// ui/form.js
import { ROLES, FIELD_LABELS } from '../data/roles.js';
import { CATEGORY_DATA } from '../data/categories.js';

export function populateRoleSelect(selectEl) {
  selectEl.innerHTML = '';
  for (const [id, def] of Object.entries(ROLES)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = def.label;
    selectEl.appendChild(opt);
  }
}

export function populateCategorySelect(selectEl) {
  // Keep first 'no-category' option, append CATEGORY_DATA
  for (const cat of CATEGORY_DATA) {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    selectEl.appendChild(opt);
  }
}

/**
 * Render input fields for the chosen role, accumulating fields from rounds 1..currentRound.
 * Returns the union set of field names rendered.
 */
export function renderFields(containerEl, roleId, currentRound, savedValues = {}) {
  containerEl.innerHTML = '';
  const role = ROLES[roleId];
  if (!role) return new Set();

  const fields = new Set();
  for (let r = 1; r <= currentRound; r++) {
    for (const f of role.fieldsByRound[r] ?? []) fields.add(f);
  }

  for (const fname of fields) {
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('label');
    label.textContent = FIELD_LABELS[fname] ?? fname;
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = fname === 'highest_quality' ? 'text' : 'number';
    input.id = `f_${fname}`;
    input.dataset.field = fname;
    input.placeholder = fname === 'highest_quality' ? 'red/gold/purple/blue' : '输入数值';
    input.step = fname.startsWith('avg_') ? '0.01' : '1';
    if (savedValues[fname] !== undefined) input.value = savedValues[fname];
    row.appendChild(input);
    containerEl.appendChild(row);
  }
  return fields;
}

/**
 * Read current input values from rendered fields.
 */
export function readFieldValues(containerEl) {
  const out = {};
  for (const input of containerEl.querySelectorAll('input[data-field]')) {
    const f = input.dataset.field;
    const v = input.value.trim();
    if (v === '') continue;
    if (f === 'highest_quality') {
      out[f] = v;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      out[f] = n;
    }
  }
  return out;
}
