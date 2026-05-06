// ui/roi.js
// ROI (region-of-interest) manager: persistence, overlay drawing, mouse-drag editor.

const STORAGE_KEY = 'bidking-helper-roi-v1';

/**
 * Load ROI from localStorage. Returns null if not set.
 * Shape: { x: 0..1, y: 0..1, w: 0..1, h: 0..1 } — all relative to source frame.
 */
export function loadRoi() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (typeof r.x !== 'number' || typeof r.y !== 'number'
      || typeof r.w !== 'number' || typeof r.h !== 'number') return null;
    return r;
  } catch { return null; }
}

export function saveRoi(roi) {
  if (roi === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(roi));
}

/**
 * Draw the ROI rectangle onto an existing canvas context.
 * canvas dimensions are the (scaled) preview size.
 * roi is relative (0..1).
 */
export function drawRoiOverlay(canvas, ctx, roi) {
  if (!roi) return;
  ctx.save();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(
    Math.round(roi.x * canvas.width),
    Math.round(roi.y * canvas.height),
    Math.round(roi.w * canvas.width),
    Math.round(roi.h * canvas.height)
  );
  ctx.restore();
}

/**
 * Crop a frame canvas to the ROI region. Returns a NEW canvas at native source resolution.
 * Used by Phase 1.3 OCR.
 */
export function cropFrameToRoi(frameCanvas, roi) {
  if (!roi) return null;
  const sx = Math.round(roi.x * frameCanvas.width);
  const sy = Math.round(roi.y * frameCanvas.height);
  const sw = Math.round(roi.w * frameCanvas.width);
  const sh = Math.round(roi.h * frameCanvas.height);
  if (sw <= 0 || sh <= 0) return null;
  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext('2d');
  ctx.drawImage(frameCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

/**
 * Attach a drag-to-draw editor to the preview canvas.
 * canvas: HTMLCanvasElement (the preview)
 * onCommit: called with new {x,y,w,h} when user releases mouse (or null to cancel)
 *
 * Returns { enable, disable, isEnabled } controls.
 */
export function setupRoiEditor(canvas, onCommit) {
  let enabled = false;
  let dragStart = null;
  let dragCurrent = null;

  function getRelativePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function onMouseDown(e) {
    if (!enabled) return;
    e.preventDefault();
    dragStart = getRelativePos(e);
    dragCurrent = dragStart;
  }

  function onMouseMove(e) {
    if (!enabled || !dragStart) return;
    dragCurrent = getRelativePos(e);
  }

  function onMouseUp(e) {
    if (!enabled || !dragStart) return;
    const end = getRelativePos(e);
    const x = Math.max(0, Math.min(dragStart.x, end.x));
    const y = Math.max(0, Math.min(dragStart.y, end.y));
    const w = Math.min(1 - x, Math.abs(end.x - dragStart.x));
    const h = Math.min(1 - y, Math.abs(end.y - dragStart.y));
    dragStart = null;
    dragCurrent = null;
    if (w < 0.01 || h < 0.01) {
      // Too small, treat as click — cancel without committing
      onCommit(null);
      return;
    }
    onCommit({ x, y, w, h });
  }

  function onMouseLeave() {
    dragStart = null;
    dragCurrent = null;
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);

  return {
    enable() { enabled = true; canvas.style.cursor = 'crosshair'; },
    disable() { enabled = false; canvas.style.cursor = ''; dragStart = null; dragCurrent = null; },
    isEnabled() { return enabled; },
    getDragRect() {
      if (!dragStart || !dragCurrent) return null;
      const x = Math.max(0, Math.min(dragStart.x, dragCurrent.x));
      const y = Math.max(0, Math.min(dragStart.y, dragCurrent.y));
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      return { x, y, w, h };
    },
  };
}
