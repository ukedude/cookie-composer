import { describe, expect, it } from 'vitest'
import { applyBrightnessContrast } from './autoCorrect'

describe('applyBrightnessContrast', () => {
  it('brightens mid-tones', () => {
    const data = new Uint8ClampedArray([100, 100, 100, 255])
    applyBrightnessContrast(data)
    expect(data[0]).toBeGreaterThan(100)
    expect(data[1]).toBeGreaterThan(100)
    expect(data[2]).toBeGreaterThan(100)
  })

  it('leaves alpha untouched', () => {
    const data = new Uint8ClampedArray([100, 150, 200, 128])
    applyBrightnessContrast(data)
    expect(data[3]).toBe(128)
  })

  it('operates independently across multiple pixels', () => {
    const data = new Uint8ClampedArray([10, 10, 10, 255, 240, 240, 240, 255])
    const before = Array.from(data)
    applyBrightnessContrast(data)
    expect(data[0]).not.toBe(before[0])
    expect(data[4]).not.toBe(before[4])
  })

  it('stays within the valid byte range', () => {
    const data = new Uint8ClampedArray([250, 250, 250, 255])
    applyBrightnessContrast(data, 50, 50)
    expect(data[0]).toBeLessThanOrEqual(255)
    expect(data[0]).toBeGreaterThanOrEqual(0)
  })
})
