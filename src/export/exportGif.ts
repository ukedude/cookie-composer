import type { Config } from '../scene'
import { buildPalette } from './buildPalette'
import { captureFrames } from './captureFrames'
import type { EncodeProgress } from './gifEncode'
import { runEncode } from './runEncode'

export interface RungSettings {
  fps: number
  size: number
  maxColors: number
  /** Shown to the user only for rungs past the first — explains what was reduced and why. */
  note?: string
}

export interface AttemptResult extends RungSettings {
  byteLength: number
}

export interface ExportResult {
  blob: Blob
  byteLength: number
  fps: number
  size: number
  maxColors: number
  encodeMs: number
  /** Human-readable notes for every rung beyond the first that was actually attempted. */
  adjustments: string[]
  /** Every rung tried, with its resulting byte size — for comparing results across papers. */
  attempts: AttemptResult[]
}

export type ExportPhase =
  | { phase: 'preparing' }
  | { phase: 'capturing' }
  | EncodeProgress
  | { phase: 'retrying'; reason: string }

/**
 * Cumulative retry ladder: frame differencing (always on, in captureFrames) is the primary size
 * lever, so this only reaches for fps/size/palette reductions if differencing alone isn't enough.
 * Each rung keeps every previous reduction and adds exactly one more.
 */
export const EXPORT_ATTEMPTS: RungSettings[] = [
  { fps: 15, size: 480, maxColors: 256 },
  { fps: 15, size: 480, maxColors: 128, note: 'Reduced the color palette to keep the file under 1 MB.' },
  { fps: 12, size: 480, maxColors: 128, note: 'Reduced to 12 fps to keep the file under 1 MB.' },
  { fps: 12, size: 400, maxColors: 128, note: 'Reduced to 400×400px to keep the file under 1 MB.' },
]

const MAX_GIF_BYTES = 1_000_000

/**
 * Captures, encodes, and (if needed) retries at reduced settings until the GIF is under 1MB or
 * the ladder runs out — this is the public entry point Composer calls.
 */
export async function exportGif(config: Config, onProgress?: (phase: ExportPhase) => void): Promise<ExportResult> {
  onProgress?.({ phase: 'preparing' })
  await document.fonts.ready
  if (config.paper instanceof HTMLImageElement) {
    await config.paper.decode().catch(() => {})
  }

  const attempts: AttemptResult[] = []
  let bytes: Uint8Array | null = null
  let encodeMs = 0
  let usedRung: RungSettings = EXPORT_ATTEMPTS[0]

  for (let i = 0; i < EXPORT_ATTEMPTS.length; i++) {
    const rung = EXPORT_ATTEMPTS[i]
    if (i > 0) onProgress?.({ phase: 'retrying', reason: rung.note ?? '' })

    onProgress?.({ phase: 'capturing' })
    const { mappingPalette, framePalette, transparentIndex } = buildPalette(config, {
      size: rung.size,
      maxColors: rung.maxColors,
    })
    const frames = captureFrames(config, { fps: rung.fps, size: rung.size }, mappingPalette, transparentIndex)

    const result = await runEncode(
      { width: rung.size, height: rung.size, framePalette, transparentIndex, frames },
      (progress) => onProgress?.(progress),
    )

    console.log(
      `[cookie-composer] rung ${i + 1}/${EXPORT_ATTEMPTS.length} (${rung.fps}fps, ${rung.size}px, ${rung.maxColors} colors): ${result.bytes.byteLength} bytes`,
    )
    attempts.push({ ...rung, byteLength: result.bytes.byteLength })
    bytes = result.bytes
    encodeMs = result.encodeMs
    usedRung = rung

    if (result.bytes.byteLength <= MAX_GIF_BYTES || i === EXPORT_ATTEMPTS.length - 1) break
  }

  // Unreachable: EXPORT_ATTEMPTS is a fixed non-empty array, so the loop above always assigns.
  if (!bytes) throw new Error('GIF export produced no output.')

  console.log(
    `[cookie-composer] encoded in ${encodeMs.toFixed(0)}ms @ ${usedRung.fps}fps ${usedRung.size}px ${usedRung.maxColors} colors, ${bytes.byteLength} bytes`,
  )

  return {
    // gif.bytes() always backs a real ArrayBuffer (gifenc's internal stream owns it outright);
    // Uint8Array#buffer is just typed ArrayBufferLike to allow for the SharedArrayBuffer case.
    blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/gif' }),
    byteLength: bytes.byteLength,
    fps: usedRung.fps,
    size: usedRung.size,
    maxColors: usedRung.maxColors,
    encodeMs,
    adjustments: attempts
      .slice(1, attempts.length)
      .map((a) => a.note)
      .filter((note): note is string => Boolean(note)),
    attempts,
  }
}
