// ui/capture.js
// Browser screen capture controller using getDisplayMedia API.
// Captures user-selected window/screen and renders frames to a canvas.

let stream = null;
let video = null;
let captureInterval = null;

const FRAME_INTERVAL_MS = 1000;  // 1 frame per second (good enough for now)

/**
 * Start screen capture. Browser will prompt user to pick a window/screen.
 * Returns a Promise that resolves when stream is active, rejects on permission denial.
 */
export async function startCapture(onFrame) {
  if (stream) return; // already running

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'never',
        frameRate: { ideal: 5, max: 10 }, // we don't need high fps
      },
      audio: false,
    });
  } catch (err) {
    throw new Error(`屏幕共享被拒绝或失败: ${err.message}`);
  }

  // Hidden video element to play the stream
  video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  await video.play();

  // Per frame: draw to a canvas and call onFrame with the canvas
  captureInterval = setInterval(() => {
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    if (onFrame) onFrame(canvas);
  }, FRAME_INTERVAL_MS);

  // Stop on user-initiated end (e.g., user clicks "Stop sharing" in Chrome bar)
  stream.getVideoTracks()[0].onended = () => {
    stopCapture();
  };
}

export function stopCapture() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (video) {
    video.srcObject = null;
    video = null;
  }
}

export function isCapturing() {
  return stream !== null;
}
