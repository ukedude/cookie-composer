import { describe, expect, it } from 'vitest'
import type { GifPalette } from 'gifenc'
import { encodeIndexedFrames, type EncodeProgress, type IndexedFrame } from './gifEncode'

const PALETTE: GifPalette = [
  [0, 0, 0],
  [255, 255, 255],
]
const TRANSPARENT_INDEX = 2

// 2x2 pixel frames (4 index bytes each)
const FRAMES: IndexedFrame[] = [
  { indices: new Uint8Array([0, 1, 0, 1]), delayMs: 70 },
  { indices: new Uint8Array([TRANSPARENT_INDEX, 1, TRANSPARENT_INDEX, TRANSPARENT_INDEX]), delayMs: 70 },
  { indices: new Uint8Array([TRANSPARENT_INDEX, TRANSPARENT_INDEX, TRANSPARENT_INDEX, TRANSPARENT_INDEX]), delayMs: 4000 },
]

function bytesContain(bytes: Uint8Array, text: string): boolean {
  const needle = Array.from(text, (c) => c.charCodeAt(0))
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) continue outer
    }
    return true
  }
  return false
}

/** Scans for Graphic Control Extension blocks (0x21 0xF9 0x04 <packed> <delayLo> <delayHi>
 * <transparentIndex> 0x00) to verify per-frame dispose/transparent bits land as expected. */
function findGCEBlocks(bytes: Uint8Array) {
  const blocks: { packed: number; transparentIndex: number }[] = []
  for (let i = 0; i < bytes.length - 7; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
      blocks.push({ packed: bytes[i + 3], transparentIndex: bytes[i + 6] })
    }
  }
  return blocks
}

describe('encodeIndexedFrames', () => {
  it('writes a valid GIF89a header', async () => {
    const bytes = await encodeIndexedFrames({ width: 2, height: 2, framePalette: PALETTE, transparentIndex: TRANSPARENT_INDEX, frames: FRAMES })
    expect(bytesContain(bytes.slice(0, 6), 'GIF89a')).toBe(true)
  })

  it('omits the NETSCAPE2.0 loop extension, so the GIF plays once', async () => {
    const bytes = await encodeIndexedFrames({ width: 2, height: 2, framePalette: PALETTE, transparentIndex: TRANSPARENT_INDEX, frames: FRAMES })
    expect(bytesContain(bytes, 'NETSCAPE2.0')).toBe(false)
  })

  it('reports progress with increasing frameIndex up to totalFrames', async () => {
    const progress: EncodeProgress[] = []
    await encodeIndexedFrames(
      { width: 2, height: 2, framePalette: PALETTE, transparentIndex: TRANSPARENT_INDEX, frames: FRAMES },
      (p) => progress.push(p),
    )
    expect(progress.map((p) => p.frameIndex)).toEqual([1, 2, 3])
    expect(progress.every((p) => p.totalFrames === 3)).toBe(true)
  })

  it('writes dispose=1 on every frame, and transparent only after the first', async () => {
    const bytes = await encodeIndexedFrames({ width: 2, height: 2, framePalette: PALETTE, transparentIndex: TRANSPARENT_INDEX, frames: FRAMES })
    const gceBlocks = findGCEBlocks(bytes)
    expect(gceBlocks).toHaveLength(3)

    // packed = (dispose << 2) | transparentFlag; dispose=1 for every frame.
    expect(gceBlocks[0].packed).toBe(0b0100) // dispose=1, transparent=0 (base frame)
    expect(gceBlocks[1].packed).toBe(0b0101) // dispose=1, transparent=1
    expect(gceBlocks[2].packed).toBe(0b0101)
    expect(gceBlocks[1].transparentIndex).toBe(TRANSPARENT_INDEX)
    expect(gceBlocks[2].transparentIndex).toBe(TRANSPARENT_INDEX)
  })
})
