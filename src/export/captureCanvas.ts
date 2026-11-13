/**
 * Shared by buildPalette and captureFrames: a 2D context to draw `drawFrame` into without ever
 * attaching anything to the DOM. Prefers OffscreenCanvas; falls back to a detached <canvas> for
 * environments (older WebKit builds) where OffscreenCanvas is missing or its 2D context is
 * incomplete.
 */
export function createCaptureContext(size: number): CanvasRenderingContext2D {
  if (typeof OffscreenCanvas !== 'undefined') {
    const offscreen = new OffscreenCanvas(size, size)
    const offscreenCtx = offscreen.getContext('2d')
    if (offscreenCtx && typeof offscreenCtx.fillText === 'function') {
      return offscreenCtx as unknown as CanvasRenderingContext2D
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to create a 2D canvas context for GIF export.')
  return ctx
}
