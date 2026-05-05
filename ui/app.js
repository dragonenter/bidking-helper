// ui/app.js
import { populateRoleSelect, populateCategorySelect, renderFields, readFieldValues } from './form.js';
import { ROLES } from '../data/roles.js';
import { CATEGORY_DATA } from '../data/categories.js';
import { enumerateCombos } from '../core/solver.js';
import { valuate } from '../core/valuator.js';
import { suggestBids } from '../core/bidder.js';

const STORAGE_KEY = 'bidking-helper-state-v1';

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return n.toFixed(2);
}

function render(state) {
  const role = state.role || Object.keys(ROLES)[0];
  const round = Number(state.round || 1);
  const fields = state.fields ?? {};

  // Populate select values
  $('role').value = role;
  $('category').value = state.category || '';
  $('round').value = String(round);

  // Render dynamic input fields
  renderFields($('dynamic-fields'), role, round, fields);

  // Bind change listeners on the inputs
  for (const input of $('dynamic-fields').querySelectorAll('input[data-field]')) {
    input.addEventListener('input', () => {
      state.fields = readFieldValues($('dynamic-fields'));
      saveState(state);
      compute(state);
    });
  }

  compute(state);
}

function compute(state) {
  const result = $('result');
  result.innerHTML = '';

  const constraints = readFieldValues($('dynamic-fields'));
  const combos = enumerateCombos(constraints);

  if (combos.length === 0) {
    result.innerHTML = '<div class="error">无可行组合：检查输入是否冲突或超出最大值</div>';
    return;
  }

  const cat = CATEGORY_DATA.find((c) => c.id === state.category) ?? null;
  const v = valuate(combos, cat);
  const round = Number(state.round || 1);
  const bids = suggestBids(v, round);

  result.innerHTML = `
    <div class="metric expected">
      <div class="label">期望价值</div>
      <div class="value">${fmt(v.expected)}</div>
    </div>
    <div class="metric range">
      <div class="label">价值区间（5%~95% 分位）</div>
      <div class="value">${fmt(v.p5)} ~ ${fmt(v.p95)}</div>
    </div>
    <div class="metric bid">
      <div class="label">出价建议（${bids.rule}）</div>
      <div class="value">
        ${bids.burst !== null ? `速胜: ${fmt(bids.burst)} | ` : ''}保守: ${fmt(bids.conservative)} | 激进: ${fmt(bids.aggressive)}
      </div>
    </div>
    <div class="combos-info">当前可行组合数：<strong>${v.combos}</strong>（越少表示信息越充分）</div>
  `;
}

function init() {
  populateRoleSelect($('role'));
  populateCategorySelect($('category'));

  const state = loadState();

  $('role').addEventListener('change', (e) => {
    state.role = e.target.value;
    state.fields = {};
    saveState(state);
    render(state);
  });

  $('category').addEventListener('change', (e) => {
    state.category = e.target.value;
    saveState(state);
    compute(state);
  });

  $('round').addEventListener('change', (e) => {
    state.round = Number(e.target.value);
    saveState(state);
    render(state);
  });

  $('reset').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  render(state);
}

init();
