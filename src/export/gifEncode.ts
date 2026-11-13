import { GIFEncoder, type GifPalette } from 'gifenc'
import { yieldToEventLoop } from './yieldToEventLoop'

export interface IndexedFrame {
  /** Palette-index-per-pixel, already diffed against the previous frame (frame 0 is the
   * exception: it has no previous frame, so it's the full, un-diffed image). */
  indices: Uint8Array
  delayMs: number
}

export interface GifEncodeInput {
  width: number
  height: number
  /** The padded, maxColors-length palette — passed to GIFEncoder only on frame 0, which writes
   * the GIF's single global color table. */
  framePalette: GifPalette
  transparentIndex: number
  frames: IndexedFrame[]
}

export type EncodeProgress = { phase: 'encoding'; frameIndex: number; totalFrames: number }

/**
 * DOM-free GIF bitstream writer, shared verbatim by the worker path and the main-thread fallback
 * (runEncode.ts picks one or the other). Quantization already happened in buildPalette — this
 * only writes frames that are already palette-indexed and diffed against their predecessor.
 */
export async function encodeIndexedFrames(
  input: GifEncodeInput,
  onProgress?: (progress: EncodeProgress) => void,
): Promise<Uint8Array> {
  const { width, height, framePalette, transparentIndex, frames } = input
  const gif = GIFEncoder()

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    if (i === 0) {
      // gifenc's default `auto: true` mode always treats the very first writeFrame call as the
      // header frame (node_modules/gifenc/src/index.js, GIFEncoder().writeFrame: in auto mode,
      // `if (!hasInit) { first = true; writeHeader(); hasInit = true }`, ignoring any `first`
      // option) — it requires `palette` on that call and throws otherwise.
      // `repeat: -1` skips the NETSCAPE2.0 loop-count extension entirely: it's only written
      // `if (repeat >= 0)` inside that same `first` branch. By the GIF89a spec, a stream with no
      // loop extension plays exactly once — verified by reading that branch, not guessed.
      gif.writeFrame(frame.indices, width, height, {
        palette: framePalette,
        repeat: -1,
        delay: frame.delayMs,
        // dispose: 1 = "do not dispose" (GIF89a Graphic Control Extension disposal method bits,
        // written by encodeGraphicControlExt). Needed on every frame, including this one, so the
        // *next* frame's transparent pixels reveal this frame's content — gifenc's own default
        // for a transparent frame is `disp = 2` ("restore to background"), which would erase it.
        dispose: 1,
      })
    } else {
      gif.writeFrame(frame.indices, width, height, {
        delay: frame.delayMs,
        transparent: true,
        transparentIndex,
        dispose: 1,
      })
    }

    onProgress?.({ phase: 'encoding', frameIndex: i + 1, totalFrames: frames.length })
    if (i % 5 === 4) await yieldToEventLoop()
  }

  gif.finish()
  return gif.bytes()
}
