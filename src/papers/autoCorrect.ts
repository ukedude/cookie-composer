export const AUTO_CORRECT_FILTER = 'brightness(1.08) contrast(1.12)'

export function supportsCanvasFilter(): boolean {
  return (
    typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype
  )
}

/** Mutates RGB channels in place to match AUTO_CORRECT_FILTER's effect; alpha is left untouched.
 * Uint8ClampedArray assignment clamps to [0,255] automatically, so no manual clamping is needed. */
export function applyBrightnessContrast(
  data: Uint8ClampedArray,
  brightnessPct = 8,
  contrastPct = 12,
): void {
  const brightnessFactor = 1 + brightnessPct / 100
  const contrastFactor = 1 + contrastPct / 100
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const brightened = data[i + c] * brightnessFactor
      data[i + c] = (brightened - 128) * contrastFactor + 128
    }
  }
}
