/**
 * Frame-to-frame differencing for GIF size reduction: a frame that mostly repeats the previous
 * one should mostly encode as the transparent sentinel index, so the GIF's LZW compression (and,
 * in practice, just not storing real color data for unchanged pixels) can shrink it dramatically.
 * Pairs with `dispose: 1` ("do not dispose") on every written frame so the decoder keeps the
 * previous frame's pixels in place wherever the current frame is transparent.
 */

/**
 * Replaces every pixel that matches `previous` with `transparentIndex`. `previous === null` means
 * there is nothing to diff against (the first frame), so `current` is returned unchanged — it must
 * be written to the GIF in full, as the base image.
 */
export function diffAgainstPrevious(
  current: Uint8Array,
  previous: Uint8Array | null,
  transparentIndex: number,
): Uint8Array {
  if (previous === null) return current

  const diffed = new Uint8Array(current.length)
  for (let i = 0; i < current.length; i++) {
    diffed[i] = current[i] === previous[i] ? transparentIndex : current[i]
  }
  return diffed
}

/**
 * The inverse of `diffAgainstPrevious`: reconstructs the original frame by filling every
 * transparent-index pixel in `diffed` with the corresponding pixel from `previousComposite`. Used
 * to verify the round trip without needing a real GIF bitstream decoder.
 */
export function compositeFrame(
  diffed: Uint8Array,
  previousComposite: Uint8Array,
  transparentIndex: number,
): Uint8Array {
  const composited = new Uint8Array(diffed.length)
  for (let i = 0; i < diffed.length; i++) {
    composited[i] = diffed[i] === transparentIndex ? previousComposite[i] : diffed[i]
  }
  return composited
}
