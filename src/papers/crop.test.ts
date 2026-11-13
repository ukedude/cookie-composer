import { describe, expect, it } from 'vitest'
import {
  clampPan,
  clampZoom,
  computeDownscaledSize,
  computeSourceRect,
  MAX_ZOOM,
  MIN_ZOOM,
} from './crop'

describe('computeDownscaledSize', () => {
  it('leaves an image under the max long edge unchanged', () => {
    expect(computeDownscaledSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('scales a landscape image down preserving aspect ratio', () => {
    const result = computeDownscaledSize(4000, 3000, 1600)
    expect(result.width).toBe(1600)
    expect(result.height).toBe(1200)
  })

  it('scales a portrait image down preserving aspect ratio', () => {
    const result = computeDownscaledSize(3000, 4000, 1600)
    expect(result.height).toBe(1600)
    expect(result.width).toBe(1200)
  })
})

describe('clampZoom', () => {
  it('clamps below the minimum', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM)
  })

  it('clamps above the maximum', () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM)
  })

  it('leaves an in-range value untouched', () => {
    expect(clampZoom(2)).toBe(2)
  })
})

describe('clampPan', () => {
  it('keeps the viewport fully inside a square image at zoom 1 (no movement possible)', () => {
    const result = clampPan({ cx: 0.9, cy: 0.1 }, 1, 1000, 1000)
    expect(result).toEqual({ cx: 0.5, cy: 0.5 })
  })

  it('allows horizontal movement on a landscape image at zoom 1, but not vertical', () => {
    const result = clampPan({ cx: 0.9, cy: 0.9 }, 1, 2000, 1000)
    expect(result.cx).toBe(0.75)
    expect(result.cy).toBe(0.5)
  })

  it('allows more movement once zoomed in', () => {
    const result = clampPan({ cx: 0.95, cy: 0.5 }, 2, 1000, 1000)
    expect(result.cx).toBeCloseTo(0.75)
  })
})

describe('computeSourceRect', () => {
  it('returns the full image for a centered square image at zoom 1', () => {
    const rect = computeSourceRect(1000, 1000, { cx: 0.5, cy: 0.5 }, 1)
    expect(rect).toEqual({ sx: 0, sy: 0, sWidth: 1000, sHeight: 1000 })
  })

  it('returns a smaller centered square when zoomed in', () => {
    const rect = computeSourceRect(1000, 1000, { cx: 0.5, cy: 0.5 }, 2)
    expect(rect).toEqual({ sx: 250, sy: 250, sWidth: 500, sHeight: 500 })
  })

  it('returns a centered square crop of a landscape image at zoom 1', () => {
    const rect = computeSourceRect(2000, 1000, { cx: 0.5, cy: 0.5 }, 1)
    expect(rect).toEqual({ sx: 500, sy: 0, sWidth: 1000, sHeight: 1000 })
  })
})
