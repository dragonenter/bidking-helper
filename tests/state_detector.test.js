import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grayscaleMean, grayscaleStd, darkRatio, yellowStrength, detectGameState } from '../ui/state_detector.js';

// ---------------------------------------------------------------------------
// Helper: create a fake canvas-like object filled with a single RGBA color.
// ---------------------------------------------------------------------------
function fakeCanvas(width, height, fill = [128, 128, 128, 255]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return {
    width,
    height,
    getContext: () => ({
      getImageData: () => ({ data, width, height }),
      drawImage: () => {},
      putImageData: () => {},
    }),
  };
}

/**
 * Create a fake canvas where the top half is one color and the bottom half
 * is another (useful for std-deviation tests).
 */
function fakeCanvasTwoHalves(width, height, topFill, bottomFill) {
  const data = new Uint8ClampedArray(width * height * 4);
  const halfH = Math.floor(height / 2);
  for (let y = 0; y < height; y++) {
    const fill = y < halfH ? topFill : bottomFill;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i]     = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];
    }
  }
  return {
    width,
    height,
    getContext: () => ({
      getImageData: () => ({ data, width, height }),
      drawImage: () => {},
      putImageData: () => {},
    }),
  };
}

// ---------------------------------------------------------------------------
// grayscaleMean tests
// ---------------------------------------------------------------------------
test('grayscaleMean of solid 128 gray canvas equals ~128', () => {
  const c = fakeCanvas(10, 10, [128, 128, 128, 255]);
  assert.ok(Math.abs(grayscaleMean(c) - 128) < 0.5);
});

test('grayscaleMean of pure white canvas equals 255', () => {
  const c = fakeCanvas(5, 5, [255, 255, 255, 255]);
  assert.ok(Math.abs(grayscaleMean(c) - 255) < 0.5);
});

test('grayscaleMean of pure black canvas equals 0', () => {
  const c = fakeCanvas(5, 5, [0, 0, 0, 255]);
  assert.ok(Math.abs(grayscaleMean(c) - 0) < 0.5);
});

// ---------------------------------------------------------------------------
// grayscaleStd tests
// ---------------------------------------------------------------------------
test('grayscaleStd of solid-color canvas is 0', () => {
  const c = fakeCanvas(10, 10, [200, 200, 200, 255]);
  assert.ok(grayscaleStd(c) < 0.01);
});

test('grayscaleStd of two-half canvas is non-zero', () => {
  const c = fakeCanvasTwoHalves(10, 10, [0, 0, 0, 255], [255, 255, 255, 255]);
  assert.ok(grayscaleStd(c) > 50, 'expected high std for black/white split');
});

// ---------------------------------------------------------------------------
// darkRatio tests
// ---------------------------------------------------------------------------
test('darkRatio of solid 50-gray with threshold 80 equals 1.0', () => {
  const c = fakeCanvas(10, 10, [50, 50, 50, 255]);
  assert.strictEqual(darkRatio(c, 80), 1.0);
});

test('darkRatio of solid 200-gray with threshold 80 equals 0.0', () => {
  const c = fakeCanvas(10, 10, [200, 200, 200, 255]);
  assert.strictEqual(darkRatio(c, 80), 0.0);
});

test('darkRatio default threshold is 80', () => {
  const c = fakeCanvas(10, 10, [80, 80, 80, 255]);
  // 80 <= 80 → counts as dark
  assert.strictEqual(darkRatio(c), 1.0);
});

// ---------------------------------------------------------------------------
// yellowStrength tests
// ---------------------------------------------------------------------------
test('yellowStrength of a yellow canvas (R=255,G=255,B=0) is 1.0', () => {
  const c = fakeCanvas(10, 10, [255, 255, 0, 255]);
  assert.strictEqual(yellowStrength(c), 1.0);
});

test('yellowStrength of a blue canvas is 0.0', () => {
  const c = fakeCanvas(10, 10, [0, 0, 255, 255]);
  assert.strictEqual(yellowStrength(c), 0.0);
});

// ---------------------------------------------------------------------------
// detectGameState — smoke test with a fake frame (all-gray, unknown state)
// ---------------------------------------------------------------------------
test('detectGameState returns a valid result object for a gray frame', () => {
  // A uniform gray frame will produce zero scores → unknown state
  // We need a drawImage-capable fake canvas for the crop step.
  const w = 200, h = 200;
  const data = new Uint8ClampedArray(w * h * 4).fill(128);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  const frameCanvas = {
    width: w, height: h,
    getContext: () => ({
      getImageData: (x, y, cw, ch) => {
        const slice = new Uint8ClampedArray(cw * ch * 4).fill(128);
        for (let i = 3; i < slice.length; i += 4) slice[i] = 255;
        return { data: slice, width: cw, height: ch };
      },
      drawImage: () => {},
    }),
  };
  const result = detectGameState(frameCanvas);
  assert.ok(typeof result.state === 'string', 'state should be a string');
  assert.ok(typeof result.confidence === 'number', 'confidence should be a number');
  assert.ok(typeof result.scores === 'object', 'scores should be an object');
  assert.ok(typeof result.metrics === 'object', 'metrics should be an object');
  const validStates = ['bid_overlay', 'main_screen', 'tool_strip', 'reveal_overlay', 'unknown'];
  assert.ok(validStates.includes(result.state), `unexpected state: ${result.state}`);
});
