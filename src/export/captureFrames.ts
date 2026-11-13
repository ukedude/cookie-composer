import { applyPalette, type GifPalette } from 'gifenc'
import { drawFrame, HOLD_SECONDS, MOTION_SECONDS, type Config } from '../scene'
import { createCaptureContext } from './captureCanvas'
import { diffAgainstPrevious } from './frameDiff'
import type { IndexedFrame } from './gifEncode'

export interface CaptureOptions {
  fps: number
  size: number
}

/**
 * Renders the whole motion (plus one held final frame) onto a throwaway canvas, converting each
 * frame to palette indices and diffing it against the previous frame immediately so the raw RGBA
 * buffer is never retained past the iteration that produced it.
 */
export function captureFrames(
  config: Config,
  { fps, size }: CaptureOptions,
  mappingPalette: GifPalette,
  transparentIndex: number,
): IndexedFrame[] {
  const ctx = createCaptureContext(size)
  const frames: IndexedFrame[] = []
  let previousIndices: Uint8Array | null = null

  const captureAt = (t: number, delayMs: number) => {
    drawFrame(ctx, t, config)
    const { data } = ctx.getImageData(0, 0, size, size)
    const indices = applyPalette(data, mappingPalette)
    const diffed = diffAgainstPrevious(indices, previousIndices, transparentIndex)
    previousIndices = indices
    frames.push({ indices: diffed, delayMs })
  }

  const frameDurationMs = 1000 / fps
  const motionFrameCount = Math.ceil(MOTION_SECONDS * fps)
  for (let i = 0; i < motionFrameCount; i++) {
    const t = Math.min(1, i / fps / MOTION_SECONDS)
    captureAt(t, frameDurationMs)
  }
  captureAt(1, HOLD_SECONDS * 1000)

  return frames
}
