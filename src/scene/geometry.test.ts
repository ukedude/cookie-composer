import { describe, expect, it } from 'vitest'
import {
  clamp01,
  coverFitSource,
  lerp,
  SLIP_HEIGHT_FACTOR,
  slipBoundingBoxMaxY,
} from './geometry'

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(4, 2, 0.5)).toBe(3)
  })
})

describe('clamp01', () => {
  it('clamps to the unit range', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(2)).toBe(1)
  })
})

describe('coverFitSource', () => {
  it('crops a wide image to a centered square', () => {
    const rect = coverFitSource(200, 100, 50, 50)
    expect(rect.sh).toBeCloseTo(100)
    expect(rect.sw).toBeCloseTo(100)
    expect(rect.sx).toBeCloseTo(50)
    expect(rect.sy).toBeCloseTo(0)
  })

  it('crops a tall image to a centered square', () => {
    const rect = coverFitSource(100, 200, 50, 50)
    expect(rect.sw).toBeCloseTo(100)
    expect(rect.sh).toBeCloseTo(100)
    expect(rect.sx).toBeCloseTo(0)
    expect(rect.sy).toBeCloseTo(50)
  })

  it('leaves a square image uncropped for a square target', () => {
    const rect = coverFitSource(100, 100, 50, 50)
    expect(rect.sw).toBeCloseTo(100)
    expect(rect.sh).toBeCloseTo(100)
    expect(rect.sx).toBeCloseTo(0)
    expect(rect.sy).toBeCloseTo(0)
  })
})

describe('slipBoundingBoxMaxY', () => {
  it('reduces to the bottom edge when unrotated', () => {
    expect(slipBoundingBoxMaxY(-0.2, 0, 1)).toBeCloseTo(-0.2 + SLIP_HEIGHT_FACTOR)
  })

  it('swings the far end down to the slip length when standing up at 90deg', () => {
    const gripY = -1
    const maxY = slipBoundingBoxMaxY(gripY, Math.PI / 2, 1)
    expect(maxY).toBeCloseTo(gripY + 2 * 1.1) // length = 2 * SLIP_LENGTH_FACTOR * slipScale
  })

  it('scales with slipScale', () => {
    const atScale1 = slipBoundingBoxMaxY(0, 0, 1)
    const atScale2 = slipBoundingBoxMaxY(0, 0, 2)
    expect(atScale2).toBeCloseTo(atScale1 * 2)
  })
})
