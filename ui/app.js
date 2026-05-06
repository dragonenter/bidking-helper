// ui/app.js
import { populateRoleSelect, populateCategorySelect, renderFields, readFieldValues } from './form.js';
import { ROLES } from '../data/roles.js';
import { CATEGORY_DATA } from '../data/categories.js';
import { enumerateCombos } from '../core/solver.js';
import { valuate } from '../core/valuator.js';
import { suggestBids } from '../core/bidder.js';
import { startCapture, stopCapture, isCapturing } from './capture.js';

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

function fmtW(n) {
  if (n === null || n === undefined) return '—w';
  return `${n.toFixed(2)}w`;
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
  // Bid suggestions based on items_category (most accurate when category is known)
  const bids = suggestBids(v.items_category, round);

  // Build red count distribution display
  const redDistEntries = Object.entries(v.redDistribution)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, frac]) => `红 ${k} 件: ${Math.round(frac * 100)}%`)
    .join(' | ');

  result.innerHTML = `
    <div class="metric expected">
      <div class="label">保底价（金×2+红×10）</div>
      <div class="value">${fmtW(v.items_conservative.expected)}</div>
      <div class="sub">区间: ${fmtW(v.items_conservative.p5)} ~ ${fmtW(v.items_conservative.p95)}</div>
    </div>
    <div class="metric range">
      <div class="label">品类件价（期望）</div>
      <div class="value">${fmtW(v.items_category.expected)}</div>
      <div class="sub">区间: ${fmtW(v.items_category.p5)} ~ ${fmtW(v.items_category.p95)}</div>
    </div>
    <div class="metric grid">
      <div class="label">格价范围</div>
      <div class="value">${fmtW(v.grid_market.expectedLow)} ~ ${fmtW(v.grid_market.expectedHigh)}</div>
    </div>
    <div class="metric bid">
      <div class="label">出价建议（${bids.rule}）</div>
      <div class="value">
        ${bids.burst !== null ? `速胜: ${fmtW(bids.burst)} | ` : ''}保守: ${fmtW(bids.conservative)} | 激进: ${fmtW(bids.aggressive)}
      </div>
    </div>
    <div class="combos-info">当前可行组合数：<strong>${v.combos}</strong>（越少表示信息越充分）</div>
    ${redDistEntries ? `<div class="red-dist">红件分布: ${redDistEntries}</div>` : ''}
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

  // --- Phase 1.1 screen capture wiring ---
  const captureBtn = $('capture-toggle');
  const statusEl = $('capture-status');
  const previewContainer = $('preview-container');
  const previewCanvas = $('preview-canvas');
  const resolutionEl = $('preview-resolution');
  const fpsEl = $('preview-fps');
  let frameCount = 0;
  let lastFpsUpdate = Date.now();

  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? 'var(--red)' : 'var(--muted)';
  }

  function setRunning(running) {
    captureBtn.textContent = running ? '⏹ 停止监控' : '📷 开始监控游戏';
    captureBtn.classList.toggle('primary', !running);
    captureBtn.classList.toggle('danger', running);
    previewContainer.hidden = !running;
  }

  captureBtn.addEventListener('click', async () => {
    if (isCapturing()) {
      stopCapture();
      setRunning(false);
      setStatus('已停止');
      return;
    }
    try {
      setStatus('请在弹窗中选择游戏窗口...');
      await startCapture((frame) => {
        // Draw to preview at scaled-down size
        const ctx = previewCanvas.getContext('2d');
        const scale = Math.min(320 / frame.width, 180 / frame.height);
        previewCanvas.width = Math.round(frame.width * scale);
        previewCanvas.height = Math.round(frame.height * scale);
        ctx.drawImage(frame, 0, 0, previewCanvas.width, previewCanvas.height);

        resolutionEl.textContent = `源分辨率: ${frame.width}×${frame.height}`;
        frameCount++;
        const now = Date.now();
        if (now - lastFpsUpdate >= 1000) {
          fpsEl.textContent = `${frameCount} fps`;
          frameCount = 0;
          lastFpsUpdate = now;
        }
      });
      setRunning(true);
      setStatus('正在监控');
    } catch (err) {
      setStatus(err.message, true);
      setRunning(false);
    }
  });
}

init();
