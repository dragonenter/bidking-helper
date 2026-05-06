// ui/ocr.js
// Tesseract.js wrapper with lazy CDN loading.
// First call to recognize() triggers ~10MB Chinese model download (cached in IndexedDB).

const TESSERACT_URL = 'https://esm.sh/tesseract.js@5.0.4';
const TESSDATA_PATH = 'https://tessdata.projectnaptha.com/4.0.0';

let workerPromise = null;
let lastError = null;

/**
 * Lazy-init Tesseract worker with chi_sim (simplified Chinese).
 * Returns a Promise<Worker>. First call may take 5-10 seconds (model download).
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
    return worker;
  })();

  workerPromise.catch((err) => {
    lastError = err;
    workerPromise = null; // allow retry
  });

  return workerPromise;
}

/**
 * Run OCR on a canvas. Returns the recognized text (string).
 * Lazy-loads Tesseract on first call.
 */
export async function recognize(canvas) {
  const worker = await getWorker();
  const result = await worker.recognize(canvas);
  return result.data.text || '';
}

export function getLastError() {
  return lastError;
}

export function isReady() {
  return workerPromise !== null && lastError === null;
}
