// ui/app.js
import { populateRoleSelect, populateCategorySelect, renderFields, readFieldValues } from './form.js';
import { ROLES } from '../data/roles.js';
import { CATEGORY_DATA } from '../data/categories.js';
import { enumerateCombos } from '../core/solver.js';
import { valuate } from '../core/valuator.js';
import { suggestBids } from '../core/bidder.js';
import { startCapture, stopCapture, isCapturing } from './capture.js';
import { loadRoi, saveRoi, drawRoiOverlay, setupRoiEditor, cropFrameToRoi } from './roi.js';
import { ROI_PRESETS, PRIMARY_ROI_KEY } from '../data/roi_presets.js';
import { parseCentralInfo } from '../core/parser.js';
import { recognize as ocrRecognize } from './ocr.js';
import { applyParsedToForm, fieldLabel } from './autofill.js';

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

  // --- Phase 1.1 + 1.2 capture + ROI wiring ---
  const captureBtn = $('capture-toggle');
  const roiEditBtn = $('roi-edit');
  const roiClearBtn = $('roi-clear');
  const captureStatusEl = $('capture-status');
  const roiStatusEl = $('roi-status');
  const previewContainer = $('preview-container');
  const previewCanvas = $('preview-canvas');
  const resolutionEl = $('preview-resolution');
  const fpsEl = $('preview-fps');

  let currentRoi = loadRoi();
  let frameCount = 0;
  let lastFpsUpdate = Date.now();
  let lastFrame = null; // most recent source-resolution frame

  const editor = setupRoiEditor(previewCanvas, (roi) => {
    if (roi !== null) {
      currentRoi = roi;
      saveRoi(roi);
      updateRoiStatus();
    }
    editor.disable();
    previewCanvas.classList.remove('editing');
    roiEditBtn.textContent = '✏️ 标定识别区域';
  });

  function updateRoiStatus() {
    if (currentRoi) {
      const pct = (n) => Math.round(n * 100);
      roiStatusEl.textContent = `识别区域: ${pct(currentRoi.w)}%×${pct(currentRoi.h)}% @ (${pct(currentRoi.x)}%,${pct(currentRoi.y)}%)`;
      roiStatusEl.style.color = 'var(--text)';
      roiClearBtn.hidden = false;
    } else {
      roiStatusEl.textContent = '未标定（点 ✏️ 标定识别区域 拖框选择）';
      roiStatusEl.style.color = 'var(--muted)';
      roiClearBtn.hidden = true;
    }
  }

  function setCaptureStatus(text, isError = false) {
    captureStatusEl.textContent = text;
    captureStatusEl.style.color = isError ? 'var(--red)' : 'var(--muted)';
  }

  // Populate preset dropdown
  const roiPresetEl = $('roi-preset');
  const roiControlsEl = $('roi-controls');
  const ocrToggleBtn = $('ocr-toggle');
  const ocrStatusEl = $('ocr-status');
  const ocrDebugEl = $('ocr-debug');
  const ocrTextEl = $('ocr-text');
  const ocrParsedEl = $('ocr-parsed');

  for (const [key, preset] of Object.entries(ROI_PRESETS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = preset.label;
    roiPresetEl.appendChild(opt);
  }

  // OCR state
  let ocrEnabled = false;
  let ocrInFlight = false;
  let ocrLastRunAt = 0;
  const OCR_INTERVAL_MS = 1500;

  function setOcrStatus(text, isError = false) {
    ocrStatusEl.textContent = text;
    ocrStatusEl.style.color = isError ? 'var(--red)' : 'var(--muted)';
  }

  roiPresetEl.addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) return; // custom mode, don't change ROI
    const preset = ROI_PRESETS[key];
    if (!preset) return;
    const c = preset.rois[PRIMARY_ROI_KEY];
    currentRoi = { x: c.x, y: c.y, w: c.w, h: c.h };
    saveRoi(currentRoi);
    updateRoiStatus();
  });

  ocrToggleBtn.addEventListener('click', async () => {
    if (ocrEnabled) {
      ocrEnabled = false;
      ocrToggleBtn.textContent = '🤖 启用自动识别';
      ocrToggleBtn.classList.remove('danger');
      ocrToggleBtn.classList.add('primary');
      setOcrStatus('已关闭');
      ocrDebugEl.hidden = true;
      return;
    }
    if (!currentRoi) {
      setOcrStatus('请先标定识别区域（拖框或选预设）', true);
      return;
    }
    ocrEnabled = true;
    ocrToggleBtn.textContent = '⏹ 停止自动识别';
    ocrToggleBtn.classList.remove('primary');
    ocrToggleBtn.classList.add('danger');
    setOcrStatus('OCR 加载中（首次约需 5-10 秒）...');
    ocrDebugEl.hidden = false;
  });

  async function runOcrOnFrame(frame) {
    if (!ocrEnabled || ocrInFlight || !currentRoi) return;
    const now = Date.now();
    if (now - ocrLastRunAt < OCR_INTERVAL_MS) return;
    ocrLastRunAt = now;
    ocrInFlight = true;

    try {
      const cropped = cropFrameToRoi(frame, currentRoi);
      if (!cropped) { ocrInFlight = false; return; }
      const text = await ocrRecognize(cropped);
      ocrTextEl.textContent = text || '(空)';
      const parsed = parseCentralInfo(text);
      const summary = Object.entries(parsed)
        .filter(([k]) => !['parsed_facts', 'unparsed_lines'].includes(k))
        .map(([k, v]) => `${fieldLabel(k)} (${k}): ${v}`)
        .join('\n');
      ocrParsedEl.textContent = summary || '(无可识别字段)';
      const applied = applyParsedToForm(parsed, $('dynamic-fields'));
      const appliedCount = applied.filter((a) => a.applied).length;
      setOcrStatus(`OCR 完成（自动填入 ${appliedCount} 项）`);
    } catch (err) {
      setOcrStatus(`OCR 失败: ${err.message}`, true);
    } finally {
      ocrInFlight = false;
    }
  }

  function setRunning(running) {
    captureBtn.textContent = running ? '⏹ 停止监控' : '📷 开始监控游戏';
    captureBtn.classList.toggle('primary', !running);
    captureBtn.classList.toggle('danger', running);
    previewContainer.hidden = !running;
    roiControlsEl.hidden = !running;
    ocrToggleBtn.hidden = !running;
    if (!running) {
      roiClearBtn.hidden = true;
    } else {
      updateRoiStatus();
    }
  }

  function renderFrame(frame) {
    lastFrame = frame;
    const ctx = previewCanvas.getContext('2d');
    const scale = Math.min(320 / frame.width, 180 / frame.height);
    previewCanvas.width = Math.round(frame.width * scale);
    previewCanvas.height = Math.round(frame.height * scale);
    ctx.drawImage(frame, 0, 0, previewCanvas.width, previewCanvas.height);

    // Draw ROI overlay (committed)
    drawRoiOverlay(previewCanvas, ctx, currentRoi);
    // Draw drag-in-progress rectangle (yellow)
    const dragRect = editor.getDragRect();
    if (dragRect) {
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(
        Math.round(dragRect.x * previewCanvas.width),
        Math.round(dragRect.y * previewCanvas.height),
        Math.round(dragRect.w * previewCanvas.width),
        Math.round(dragRect.h * previewCanvas.height)
      );
      ctx.restore();
    }

    resolutionEl.textContent = `源分辨率: ${frame.width}×${frame.height}`;
    frameCount++;
    const now = Date.now();
    if (now - lastFpsUpdate >= 1000) {
      fpsEl.textContent = `${frameCount} fps`;
      frameCount = 0;
      lastFpsUpdate = now;
    }

    runOcrOnFrame(frame);
  }

  captureBtn.addEventListener('click', async () => {
    if (isCapturing()) {
      stopCapture();
      setRunning(false);
      setCaptureStatus('已停止');
      return;
    }
    try {
      setCaptureStatus('请在弹窗中选择游戏窗口...');
      await startCapture(renderFrame);
      setRunning(true);
      setCaptureStatus('正在监控');
    } catch (err) {
      setCaptureStatus(err.message, true);
      setRunning(false);
    }
  });

  roiEditBtn.addEventListener('click', () => {
    if (editor.isEnabled()) {
      editor.disable();
      previewCanvas.classList.remove('editing');
      roiEditBtn.textContent = '✏️ 标定识别区域';
      setCaptureStatus('已取消标定');
    } else {
      editor.enable();
      previewCanvas.classList.add('editing');
      roiEditBtn.textContent = '取消';
      setCaptureStatus('在预览框内拖动鼠标框选要识别的区域');
    }
  });

  roiClearBtn.addEventListener('click', () => {
    currentRoi = null;
    saveRoi(null);
    updateRoiStatus();
  });

  // Render frame loop also needs to refresh during drag (mouse move)
  previewCanvas.addEventListener('mousemove', () => {
    if (editor.isEnabled() && lastFrame) renderFrame(lastFrame);
  });

  updateRoiStatus();
}

init();
