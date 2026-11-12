import { describe, expect, it } from 'vitest'
import { fitText, type MeasureFn } from './text'

// Deterministic fake measure: width scales linearly with character count and font size,
// with no canvas involved — matches text.ts's injected-measure-function design.
const measure: MeasureFn = (text, fontPx) => text.length * fontPx * 0.5

const BASE_OPTIONS = {
  maxWidth: 200,
  maxHeight: 200,
  fontFamily: 'serif',
  maxFontSize: 28,
  minFontSize: 10,
  maxLines: 3,
  lineHeightRatio: 1.25,
}

describe('fitText', () => {
  it('keeps a short message on one line at the max font size', () => {
    const result = fitText('Be kind.', BASE_OPTIONS, measure)
    expect(result.lines).toEqual(['Be kind.'])
    expect(result.fontSize).toBe(BASE_OPTIONS.maxFontSize)
  })

  it('wraps a long message within maxLines and shrinks the font to fit', () => {
    const message =
      'Kindness is a gift you give yourself as much as you give to anyone else, so remember that today and always.'
    const result = fitText(message, BASE_OPTIONS, measure)

    expect(result.lines.length).toBeLessThanOrEqual(BASE_OPTIONS.maxLines)
    expect(result.fontSize).toBeLessThan(BASE_OPTIONS.maxFontSize)
    expect(result.fontSize).toBeGreaterThanOrEqual(BASE_OPTIONS.minFontSize)
    for (const line of result.lines) {
      expect(measure(line, result.fontSize, BASE_OPTIONS.fontFamily)).toBeLessThanOrEqual(
        BASE_OPTIONS.maxWidth,
      )
    }
  })

  it('hard-breaks a single very long word that cannot wrap at word boundaries', () => {
    const longWord = 'A'.repeat(80)
    const result = fitText(longWord, BASE_OPTIONS, measure)

    expect(result.lines.length).toBeLessThanOrEqual(BASE_OPTIONS.maxLines)
    expect(result.lines.length).toBeGreaterThan(0)
    for (const line of result.lines) {
      expect(measure(line, result.fontSize, BASE_OPTIONS.fontFamily)).toBeLessThanOrEqual(
        BASE_OPTIONS.maxWidth,
      )
    }
    // No characters lost and no truncation needed for this input.
    const rejoined = result.lines.join('').replace('…', '')
    expect(rejoined.length).toBe(longWord.length)
  })

  it('terminates and returns a result even when nothing fits within maxLines', () => {
    const message = 'word '.repeat(200).trim()
    const result = fitText(
      message,
      { ...BASE_OPTIONS, maxWidth: 40, maxHeight: 20, minFontSize: 10, maxFontSize: 12 },
      measure,
    )

    expect(result.lines.length).toBeLessThanOrEqual(BASE_OPTIONS.maxLines)
    expect(result.fontSize).toBe(10)
  })
})
