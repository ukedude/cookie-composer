import { describe, expect, it } from 'vitest'
import { compositeFrame, diffAgainstPrevious } from './frameDiff'

const TRANSPARENT = 255

describe('diffAgainstPrevious', () => {
  it('returns the first frame unchanged when there is no previous frame', () => {
    const current = new Uint8Array([1, 2, 3, 4])
    expect(diffAgainstPrevious(current, null, TRANSPARENT)).toEqual(current)
  })

  it('diffs an identical frame to all-transparent', () => {
    const previous = new Uint8Array([5, 6, 7, 8])
    const current = new Uint8Array([5, 6, 7, 8])
    const diffed = diffAgainstPrevious(current, previous, TRANSPARENT)
    expect(diffed).toEqual(new Uint8Array([TRANSPARENT, TRANSPARENT, TRANSPARENT, TRANSPARENT]))
  })

  it('keeps only the changed pixels, transparent everywhere else', () => {
    const previous = new Uint8Array([1, 2, 3, 4, 5])
    const current = new Uint8Array([1, 9, 3, 4, 0])
    const diffed = diffAgainstPrevious(current, previous, TRANSPARENT)
    expect(diffed).toEqual(new Uint8Array([TRANSPARENT, 9, TRANSPARENT, TRANSPARENT, 0]))
  })
})

describe('compositeFrame', () => {
  it('round-trips an identical frame back to the original', () => {
    const previous = new Uint8Array([5, 6, 7, 8])
    const current = new Uint8Array([5, 6, 7, 8])
    const diffed = diffAgainstPrevious(current, previous, TRANSPARENT)
    expect(compositeFrame(diffed, previous, TRANSPARENT)).toEqual(current)
  })

  it('round-trips a partially changed frame back to the original', () => {
    const previous = new Uint8Array([1, 2, 3, 4, 5])
    const current = new Uint8Array([1, 9, 3, 4, 0])
    const diffed = diffAgainstPrevious(current, previous, TRANSPARENT)
    expect(compositeFrame(diffed, previous, TRANSPARENT)).toEqual(current)
  })
})
