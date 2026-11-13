import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GifPalette } from 'gifenc'
import { HOLD_SECONDS } from '../scene'
import { captureFrames } from './captureFrames'
import { createFakeContext, FakePath2D, makeFakeConfig, stubOffscreenCanvas } from './fakeContext'

const PALETTE: GifPalette = [
  [0, 0, 0],
  [42, 42, 42],
  [255, 255, 255],
]
const TRANSPARENT_INDEX = 3

describe('captureFrames', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('Path2D', FakePath2D)
  })

  it('captures 59 motion frames plus one held frame at the default 15fps', () => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 15, size: 480 }, PALETTE, TRANSPARENT_INDEX)

    expect(frames).toHaveLength(60)
  })

  it('gives every motion frame a 1000/15 ms delay', () => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 15, size: 480 }, PALETTE, TRANSPARENT_INDEX)

    for (const frame of frames.slice(0, -1)) {
      expect(frame.delayMs).toBeCloseTo(1000 / 15)
    }
  })

  it('holds the final frame for HOLD_SECONDS', () => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 15, size: 480 }, PALETTE, TRANSPARENT_INDEX)

    expect(frames.at(-1)?.delayMs).toBe(HOLD_SECONDS * 1000)
  })

  it('respects custom fps/size', () => {
    const { ctx, calls } = createFakeContext(400)
    stubOffscreenCanvas(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 12, size: 400 }, PALETTE, TRANSPARENT_INDEX)

    expect(frames).toHaveLength(48) // ceil(3.9*12) + 1
    expect(calls.getImageData).toHaveBeenCalledWith(0, 0, 400, 400)
  })

  it('does not diff the first frame, and diffs an unchanged frame to all-transparent', () => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 15, size: 480 }, PALETTE, TRANSPARENT_INDEX)

    expect(frames[0].indices.every((v) => v === TRANSPARENT_INDEX)).toBe(false)
    expect(frames[1].indices.every((v) => v === TRANSPARENT_INDEX)).toBe(true)
  })

  it('falls back to a detached <canvas> when OffscreenCanvas is unavailable', () => {
    vi.stubGlobal('OffscreenCanvas', undefined)
    const { ctx } = createFakeContext(480)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)

    const frames = captureFrames(makeFakeConfig(), { fps: 15, size: 480 }, PALETTE, TRANSPARENT_INDEX)

    expect(frames).toHaveLength(60)
  })
})
