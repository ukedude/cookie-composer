import { describe, expect, it } from 'vitest'
import { clamp01, coverFitSource, lerp } from './geometry'

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
