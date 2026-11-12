/** Measures the pixel width of `text` set in `fontPx`px of `fontFamily`. */
export type MeasureFn = (text: string, fontPx: number, fontFamily: string) => number

export interface FitTextOptions {
  maxWidth: number
  maxHeight: number
  fontFamily: string
  maxLines?: number
  minFontSize?: number
  maxFontSize?: number
  lineHeightRatio?: number
}

export interface FitTextResult {
  lines: string[]
  fontSize: number
}

interface Token {
  text: string
  forceOwnLine: boolean
}

function hardBreakWord(
  word: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  measure: MeasureFn,
): string[] {
  const chunks: string[] = []
  let current = ''
  for (const char of word) {
    const candidate = current + char
    if (!current || measure(candidate, fontSize, fontFamily) <= maxWidth) {
      current = candidate
    } else {
      chunks.push(current)
      current = char
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function tokenize(
  message: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  measure: MeasureFn,
): Token[] {
  const words = message.split(/\s+/).filter(Boolean)
  const tokens: Token[] = []
  for (const word of words) {
    if (measure(word, fontSize, fontFamily) <= maxWidth) {
      tokens.push({ text: word, forceOwnLine: false })
    } else {
      for (const chunk of hardBreakWord(word, fontSize, fontFamily, maxWidth, measure)) {
        tokens.push({ text: chunk, forceOwnLine: true })
      }
    }
  }
  return tokens
}

function wrapTokens(
  tokens: Token[],
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  measure: MeasureFn,
): string[] {
  const lines: string[] = []
  let current = ''
  for (const token of tokens) {
    if (token.forceOwnLine) {
      if (current) {
        lines.push(current)
        current = ''
      }
      lines.push(token.text)
      continue
    }
    const candidate = current ? `${current} ${token.text}` : token.text
    if (measure(candidate, fontSize, fontFamily) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = token.text
    }
  }
  if (current) lines.push(current)
  return lines
}

function wrapAtSize(
  message: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  measure: MeasureFn,
): string[] {
  const tokens = tokenize(message, fontSize, fontFamily, maxWidth, measure)
  return wrapTokens(tokens, fontSize, fontFamily, maxWidth, measure)
}

function truncateWithEllipsis(
  line: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  measure: MeasureFn,
): string {
  let truncated = line
  while (truncated.length > 0 && measure(`${truncated}…`, fontSize, fontFamily) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

/**
 * Wraps `message` to at most `maxLines` lines, shrinking the font size from
 * `maxFontSize` down to `minFontSize` until it fits `maxWidth` x `maxHeight`.
 * If it still doesn't fit at `minFontSize`, the last line is truncated with an ellipsis.
 */
export function fitText(
  message: string,
  options: FitTextOptions,
  measure: MeasureFn,
): FitTextResult {
  const {
    maxWidth,
    maxHeight,
    fontFamily,
    maxLines = 3,
    minFontSize = 10,
    maxFontSize = 28,
    lineHeightRatio = 1.25,
  } = options
  const trimmed = message.trim()

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize--) {
    const lines = wrapAtSize(trimmed, fontSize, fontFamily, maxWidth, measure)
    const totalHeight = lines.length * fontSize * lineHeightRatio
    if (lines.length <= maxLines && totalHeight <= maxHeight) {
      return { lines, fontSize }
    }
  }

  const lines = wrapAtSize(trimmed, minFontSize, fontFamily, maxWidth, measure).slice(0, maxLines)
  const lastIndex = lines.length - 1
  if (lastIndex >= 0) {
    lines[lastIndex] = truncateWithEllipsis(
      lines[lastIndex],
      minFontSize,
      fontFamily,
      maxWidth,
      measure,
    )
  }
  return { lines, fontSize: minFontSize }
}
