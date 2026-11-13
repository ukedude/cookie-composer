import { describe, expect, it } from 'vitest'
import { CUSTOM_ID_PREFIX, isCustomPaperId, makeCustomPaperId } from './customPaperId'

describe('isCustomPaperId', () => {
  it('recognizes ids with the custom prefix', () => {
    expect(isCustomPaperId('custom:abc')).toBe(true)
  })

  it('rejects bundled-style ids', () => {
    expect(isCustomPaperId('sample-1')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isCustomPaperId('')).toBe(false)
  })
})

describe('makeCustomPaperId', () => {
  it('always starts with the custom prefix', () => {
    expect(makeCustomPaperId().startsWith(CUSTOM_ID_PREFIX)).toBe(true)
  })

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => makeCustomPaperId()))
    expect(ids.size).toBe(20)
  })
})
