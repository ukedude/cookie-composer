import { quantize, type GifPalette } from 'gifenc'
import { drawFrame, type Config } from '../scene'
import { createCaptureContext } from './captureCanvas'

export interface BuiltPalette {
  /** Length <= maxColors - 1. What `applyPalette` maps real pixels against, so it can never
   * itself produce `transparentIndex`. */
  mappingPalette: GifPalette
  /** Length === maxColors. Passed to GIFEncoder as the frame-0 global color table; the entries
   * past `mappingPalette.length` (including `transparentIndex`) are unused placeholders. */
  framePalette: GifPalette
  /** Always maxColors - 1: the palette slot reserved for frame differencing. */
  transparentIndex: number
}

const SAMPLE_TS = [0, 0.2, 0.4, 0.6, 0.8, 1]

/**
 * Quick pre-pass: renders a handful of sample frames (not the full motion) to build one shared
 * palette before the memory-conscious main capture loop starts, so colors don't flicker between
 * frames and so captureFrames never has to go back and re-quantize.
 */
export function buildPalette(
  config: Config,
  { size, maxColors }: { size: number; maxColors: number },
): BuiltPalette {
  const ctx = createCaptureContext(size)
  const frameBytes = size * size * 4
  const sampleBytes = new Uint8ClampedArray(SAMPLE_TS.length * frameBytes)

  SAMPLE_TS.forEach((t, i) => {
    drawFrame(ctx, t, config)
    const { data } = ctx.getImageData(0, 0, size, size)
    sampleBytes.set(data, i * frameBytes)
  })

  const mappingPalette = quantize(sampleBytes, maxColors - 1)
  const framePalette: GifPalette = [...mappingPalette]
  while (framePalette.length < maxColors) framePalette.push([0, 0, 0])

  return { mappingPalette, framePalette, transparentIndex: maxColors - 1 }
}
