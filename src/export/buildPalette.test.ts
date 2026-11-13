import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPalette } from './buildPalette'
import { createFakeContext, FakePath2D, makeFakeConfig, stubOffscreenCanvas } from './fakeContext'

vi.stubGlobal('Path2D', FakePath2D)

describe('buildPalette', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('Path2D', FakePath2D)
  })

  it('renders only the sample frames, not the full motion', () => {
    const { ctx, calls } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    buildPalette(makeFakeConfig(), { size: 480, maxColors: 256 })

    expect(calls.getImageData).toHaveBeenCalledTimes(6)
  })

  it.each([256, 128])('reserves the last slot (maxColors=%i) as transparentIndex', (maxColors) => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const { transparentIndex, framePalette } = buildPalette(makeFakeConfig(), { size: 480, maxColors })

    expect(transparentIndex).toBe(maxColors - 1)
    expect(framePalette).toHaveLength(maxColors)
  })

  it('keeps the mapping palette within maxColors - 1 entries', () => {
    const { ctx } = createFakeContext(480)
    stubOffscreenCanvas(ctx)

    const { mappingPalette } = buildPalette(makeFakeConfig(), { size: 480, maxColors: 128 })

    expect(mappingPalette.length).toBeLessThanOrEqual(127)
  })
})
