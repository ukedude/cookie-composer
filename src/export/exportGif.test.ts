import { describe, expect, it } from 'vitest'
import { EXPORT_ATTEMPTS } from './exportGif'

describe('EXPORT_ATTEMPTS', () => {
  it('has exactly 4 rungs in cumulative fps/size/maxColors order', () => {
    expect(EXPORT_ATTEMPTS).toEqual([
      { fps: 15, size: 480, maxColors: 256 },
      { fps: 15, size: 480, maxColors: 128, note: expect.any(String) },
      { fps: 12, size: 480, maxColors: 128, note: expect.any(String) },
      { fps: 12, size: 400, maxColors: 128, note: expect.any(String) },
    ])
  })

  it('carries a non-empty human-readable note on every rung past the first', () => {
    for (const rung of EXPORT_ATTEMPTS.slice(1)) {
      expect(rung.note?.length).toBeGreaterThan(0)
    }
  })

  it('has no note on the first rung', () => {
    expect(EXPORT_ATTEMPTS[0].note).toBeUndefined()
  })
})
