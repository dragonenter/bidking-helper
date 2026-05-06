// ui/ocr.js
// OCR engine with lazy CDN loading.
//
// PaddleOCR.js CDN (@paddlejs-models/ocr) is not available as a browser ESM
// (returns 404 / "Module is not defined" at runtime) as of 2026-05.
// Engine used: Tesseract.js v5 + aggressive preprocessing
//   - grayscale conversion (sarkozyfan-style ImageOps.grayscale port)
//   - 2× upscale before recognition
//   - PSM 6 (uniform block of text)
// Estimated cold-start: 5-15 seconds (Chinese chi_sim model ~10MB via CDN).

const TESSERACT_URL = 'https://esm.sh/tesseract.js@5.0.4';
const TESSDATA_PATH = 'https://tessdata.projectnaptha.com/4.0.0';

let workerPromise = null;
let lastError = null;
const ENGINE_NAME = 'Tesseract.js (fallback, preprocessing)';

/**
 * Grayscale-convert a canvas in-place, return a new canvas with grayscale pixels.
 * Port of sarkozyfan's `ImageOps.grayscale(frame).convert("RGB")`.
 */
function applyGrayscale(srcCanvas) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h);
  const gray = new Uint8ClampedArray(src.data.length);
  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    // ITU-R BT.601 luma
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = luma;
    gray[i + 1] = luma;
    gray[i + 2] = luma;
    gray[i + 3] = src.data[i + 3];
  }
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.putImageData(new ImageData(gray, w, h), 0, 0);
  return out;
}

/**
 * Scale canvas by 2× for better OCR accuracy on small UI text.
 */
function upscale2x(srcCanvas) {
  const out = document.createElement('canvas');
  out.width = srcCanvas.width * 2;
  out.height = srcCanvas.height * 2;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);
  return out;
}

/**
 * Preprocess canvas for Tesseract: grayscale + 2× upscale.
 */
function preprocessCanvas(canvas) {
  const gray = applyGrayscale(canvas);
  return upscale2x(gray);
}

/**
 * Lazy-init Tesseract worker with chi_sim (simplified Chinese) + PSM 6.
 * First call may take 5-15 seconds (model download).
 */
async function getWorker() {
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    const Tesseract = await import(/* @vite-ignore */ TESSERACT_URL);
    const create = Tesseract.createWorker || Tesseract.default?.createWorker;
    if (!create) throw new Error('Tesseract.createWorker not available');

    const worker = await create('chi_sim', 1, {
      langPath: TESSDATA_PATH,
      logger: () => {}, // suppress noisy progress logs
    });
    // PSM 6 = assume a single uniform block of text
    await worker.setParameters({ tessedit_pageseg_mode: '6' });
    return worker;
  })();

  workerPromise.catch((err) => {
    lastError = err;
    workerPromise = null; // allow retry
  });

  return workerPromise;
}

/**
 * Run OCR on a canvas. Applies grayscale + upscale preprocessing.
 * Returns the recognized text (string).
 * Lazy-loads Tesseract on first call.
 */
export async function recognize(canvas) {
  const worker = await getWorker();
  const processed = preprocessCanvas(canvas);
  const result = await worker.recognize(processed);
  return result.data.text || '';
}

/**
 * OCR the full canvas (same as recognize — provided for multi-region pipeline).
 */
export async function recognizeFull(canvas) {
  return recognize(canvas);
}

/**
 * Crop frame to ROI then recognize.
 * @param {HTMLCanvasElement} frame - source frame
 * @param {{x,y,w,h}} roi - relative coords (0..1)
 */
export async function recognizeRegion(frame, roi) {
  const w = Math.round(roi.w * frame.width);
  const h = Math.round(roi.h * frame.height);
  const x = Math.round(roi.x * frame.width);
  const y = Math.round(roi.y * frame.height);
  if (w < 1 || h < 1) return '';

  const crop = document.createElement('canvas');
  crop.width = w;
  crop.height = h;
  crop.getContext('2d').drawImage(frame, x, y, w, h, 0, 0, w, h);
  return recognize(crop);
}

export function getEngineName() {
  return ENGINE_NAME;
}

export function getLastError() {
  return lastError;
}

export function isReady() {
  return workerPromise !== null && lastError === null;
}
