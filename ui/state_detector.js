// ui/state_detector.js
// Pixel-statistics game-state classifier.
// Port of sarkozyfan's analyze_screenshot.py lines 116-250
// (grayscale_mean, grayscale_std, dark_ratio, yellow_strength, detect_state).

/**
 * Extract greyscale pixel array (0-255) from a canvas-like object.
 * Returns Float32Array of length width*height.
 */
function getGrayPixels(canvas) {
  const ctx = canvas.getContext('2d');
  const cw = canvas.width;
  const ch = canvas.height;
  const { data, width, height } = ctx.getImageData(0, 0, cw, ch);
  const pixels = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // ITU-R BT.601 luma — same formula sarkozyfan uses via PIL "L" mode
    pixels[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return pixels;
}

/**
 * Extract raw RGBA pixel array from a canvas.
 */
function getRGBAData(canvas) {
  const ctx = canvas.getContext('2d');
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

/**
 * Returns the mean grayscale value (0..255) of the canvas.
 * Port of sarkozyfan's grayscale_mean().
 */
export function grayscaleMean(canvas) {
  const pixels = getGrayPixels(canvas);
  if (pixels.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) sum += pixels[i];
  return sum / pixels.length;
}

/**
 * Returns the standard deviation of grayscale values (0..255) of the canvas.
 * Port of sarkozyfan's grayscale_std().
 */
export function grayscaleStd(canvas) {
  const pixels = getGrayPixels(canvas);
  if (pixels.length === 0) return 0;
  const mean = grayscaleMean(canvas);
  let variance = 0;
  for (let i = 0; i < pixels.length; i++) {
    const diff = pixels[i] - mean;
    variance += diff * diff;
  }
  return Math.sqrt(variance / pixels.length);
}

/**
 * Returns the fraction of pixels with grayscale <= threshold (0..1).
 * Port of sarkozyfan's dark_ratio().
 * @param {*} canvas
 * @param {number} threshold default 80
 */
export function darkRatio(canvas, threshold = 80) {
  const pixels = getGrayPixels(canvas);
  if (pixels.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i] <= threshold) count++;
  }
  return count / pixels.length;
}

/**
 * Returns the fraction of yellow pixels (R>=180, G>=180, B<=120) in 0..1.
 * Port of sarkozyfan's yellow_strength().
 */
export function yellowStrength(canvas) {
  const data = getRGBAData(canvas);
  if (data.length === 0) return 0;
  const pixelCount = data.length / 4;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= 180 && data[i + 1] >= 180 && data[i + 2] <= 120) count++;
  }
  return count / pixelCount;
}

/**
 * Clamp value to [0, 1].
 * Port of sarkozyfan's clamp01().
 */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Create a new blank canvas (browser or node-test environment).
 */
function createBlankCanvas(w, h) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  // Node.js / test environment: return a lightweight fake canvas
  // that delegates drawImage via pixel copy from the source's getImageData.
  const data = new Uint8ClampedArray(w * h * 4);
  const ctx = {
    _data: data, _w: w, _h: h,
    drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh) {
      // Simple nearest-neighbour copy; adequate for unit tests.
      const srcCtx = src.getContext('2d');
      const srcData = srcCtx.getImageData(sx, sy, sw, sh);
      for (let py = 0; py < dh; py++) {
        for (let px = 0; px < dw; px++) {
          const srcX = Math.floor(px * sw / dw);
          const srcY = Math.floor(py * sh / dh);
          const si = (srcY * sw + srcX) * 4;
          const di = ((dy + py) * w + (dx + px)) * 4;
          data[di]     = srcData.data[si];
          data[di + 1] = srcData.data[si + 1];
          data[di + 2] = srcData.data[si + 2];
          data[di + 3] = srcData.data[si + 3];
        }
      }
    },
    getImageData(x, y, iw, ih) {
      return { data, width: iw, height: ih };
    },
  };
  return { width: w, height: h, getContext: () => ctx };
}

/**
 * Crop a full-frame canvas to a relative ROI {x, y, w, h} (0..1).
 * Returns a new canvas containing only that region.
 */
function cropROI(frameCanvas, roi) {
  const fw = frameCanvas.width;
  const fh = frameCanvas.height;
  const x = Math.round(roi.x * fw);
  const y = Math.round(roi.y * fh);
  const w = Math.max(1, Math.round(roi.w * fw));
  const h = Math.max(1, Math.round(roi.h * fh));

  const out = createBlankCanvas(w, h);
  out.getContext('2d').drawImage(frameCanvas, x, y, w, h, 0, 0, w, h);
  return out;
}

/**
 * Default ROI definitions (relative 0..1 coordinates).
 * These match sarkozyfan's roi_config.json ROI names at a 1280×720 reference.
 * Callers may override by passing their own rois object.
 */
export const DEFAULT_ROIS = {
  bid_overlay_panel:   { x: 0.26, y: 0.30, w: 0.48, h: 0.40 },
  tool_strip_panel:    { x: 0.00, y: 0.74, w: 1.00, h: 0.18 },
  reveal_cards_area:   { x: 0.05, y: 0.12, w: 0.55, h: 0.65 },
  reveal_right_info:   { x: 0.62, y: 0.12, w: 0.34, h: 0.65 },
  main_bid_button:     { x: 0.38, y: 0.84, w: 0.25, h: 0.10 },
  confirm_bid_button:  { x: 0.35, y: 0.62, w: 0.30, h: 0.09 },
};

/**
 * Detect game state from a frame canvas using pixel statistics.
 *
 * Port of sarkozyfan's detect_state() in analyze_screenshot.py lines 151-250.
 *
 * @param {HTMLCanvasElement} frameCanvas  Full game window frame.
 * @param {object} [rois]  Optional override for ROI definitions (same keys as DEFAULT_ROIS).
 * @returns {{ state: string, confidence: number, scores: object, metrics: object }}
 *   state is one of: 'bid_overlay' | 'main_screen' | 'tool_strip' | 'reveal_overlay' | 'unknown'
 */
export function detectGameState(frameCanvas, rois = DEFAULT_ROIS) {
  // Merge with defaults so callers don't have to supply all keys
  const resolvedRois = Object.assign({}, DEFAULT_ROIS, rois);

  const bidOverlay   = cropROI(frameCanvas, resolvedRois.bid_overlay_panel);
  const toolStrip    = cropROI(frameCanvas, resolvedRois.tool_strip_panel);
  const revealCards  = cropROI(frameCanvas, resolvedRois.reveal_cards_area);
  const revealInfo   = cropROI(frameCanvas, resolvedRois.reveal_right_info);
  const mainBid      = cropROI(frameCanvas, resolvedRois.main_bid_button);
  const confirmBid   = cropROI(frameCanvas, resolvedRois.confirm_bid_button);

  // Compute pixel metrics — exact names / formulas from sarkozyfan
  const metrics = {
    bid_overlay_dark_ratio:     darkRatio(bidOverlay, 95),
    tool_strip_dark_ratio:      darkRatio(toolStrip, 95),
    tool_strip_mean_gray:       grayscaleMean(toolStrip),
    tool_strip_std_gray:        grayscaleStd(toolStrip),
    reveal_cards_mean_gray:     grayscaleMean(revealCards),
    reveal_cards_std_gray:      grayscaleStd(revealCards),
    reveal_info_dark_ratio:     darkRatio(revealInfo, 95),
    reveal_info_mean_gray:      grayscaleMean(revealInfo),
    reveal_info_std_gray:       grayscaleStd(revealInfo),
    main_bid_yellow_strength:   yellowStrength(mainBid),
    main_bid_mean_gray:         grayscaleMean(mainBid),
    confirm_bid_yellow_strength: yellowStrength(confirmBid),
    confirm_bid_mean_gray:      grayscaleMean(confirmBid),
  };

  // Score formulas — directly ported from analyze_screenshot.py lines 175-194
  const scores = {
    bid_overlay: (
      clamp01((metrics.confirm_bid_yellow_strength - 0.72) / 0.18) * 0.80
      + clamp01((metrics.confirm_bid_mean_gray - 150.0) / 60.0) * 0.10
      + clamp01((metrics.bid_overlay_dark_ratio - 0.82) / 0.12) * 0.10
    ),
    main_screen: (
      clamp01((metrics.main_bid_yellow_strength - 0.68) / 0.16) * 0.75
      + clamp01((metrics.main_bid_mean_gray - 160.0) / 60.0) * 0.15
      + clamp01((100.0 - metrics.tool_strip_mean_gray) / 80.0) * 0.10
    ),
    tool_strip: (
      clamp01((metrics.tool_strip_mean_gray - 110.0) / 35.0) * 0.70
      + clamp01((0.55 - metrics.tool_strip_dark_ratio) / 0.25) * 0.20
      + clamp01((metrics.tool_strip_std_gray - 45.0) / 30.0) * 0.10
    ),
    reveal_overlay: (
      clamp01((metrics.reveal_cards_mean_gray - 56.0) / 10.0) * 0.55
      + clamp01((20.0 - metrics.reveal_cards_std_gray) / 12.0) * 0.25
      + clamp01((0.94 - metrics.reveal_info_dark_ratio) / 0.08) * 0.20
    ),
  };

  // State selection — thresholds from analyze_screenshot.py lines 198-208
  let state;
  if (scores.bid_overlay >= 0.75) {
    state = 'bid_overlay';
  } else if (scores.main_screen >= 0.75) {
    state = 'main_screen';
  } else if (scores.tool_strip >= 0.70) {
    state = 'tool_strip';
  } else if (scores.reveal_overlay >= 0.55) {
    state = 'reveal_overlay';
  } else {
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    state = best[1] >= 0.40 ? best[0] : 'unknown';
  }

  const confidence = state === 'unknown' ? 0 : Math.round(scores[state] * 10000) / 10000;

  return { state, confidence, scores, metrics };
}
