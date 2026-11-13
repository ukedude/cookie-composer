import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GifPalette } from 'gifenc'
import { canUseWorkerEncoding, runEncode } from './runEncode'
import type { IndexedFrame } from './gifEncode'

const PALETTE: GifPalette = [[0, 0, 0], [255, 255, 255]]
const FRAMES: IndexedFrame[] = [
  { indices: new Uint8Array([0, 1, 0, 1]), delayMs: 70 },
  { indices: new Uint8Array([2, 1, 2, 2]), delayMs: 4000 },
]

describe('canUseWorkerEncoding', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is false when Worker is undefined', () => {
    vi.stubGlobal('Worker', undefined)
    expect(canUseWorkerEncoding()).toBe(false)
  })

  it('is true when Worker is defined', () => {
    vi.stubGlobal('Worker', class {})
    expect(canUseWorkerEncoding()).toBe(true)
  })
})

describe('runEncode', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolves via the inline path when no Worker global is available (the jsdom default)', async () => {
    const result = await runEncode({ width: 2, height: 2, framePalette: PALETTE, transparentIndex: 2, frames: FRAMES })
    expect(result.bytes.slice(0, 3)).toEqual(new Uint8Array([0x47, 0x49, 0x46])) // "GIF"
    expect(result.encodeMs).toBeGreaterThanOrEqual(0)
  })
})
