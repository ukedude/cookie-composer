import { describe, expect, it } from 'vitest'
import { easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic } from './easing'

describe('easeInCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeInCubic(0)).toBe(0)
    expect(easeInCubic(1)).toBe(1)
  })

  it('is back-loaded (slow start)', () => {
    expect(easeInCubic(0.5)).toBeLessThan(0.5)
  })
})

describe('easeInOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('is symmetric around the midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
  })
})

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('is front-loaded (fast start)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('easeOutBack', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutBack(0)).toBeCloseTo(0)
    expect(easeOutBack(1)).toBeCloseTo(1)
  })

  it('overshoots past 1 before settling', () => {
    const samples = Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100))
    expect(Math.max(...samples)).toBeGreaterThan(1)
  })
})
