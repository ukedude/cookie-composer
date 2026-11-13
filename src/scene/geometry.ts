/** Paper circle radius as a fraction of canvas size. */
export const PAPER_RADIUS_FACTOR = 0.32
/** Slip length as a multiple of the paper's diameter (overhangs both straight edges when folded). */
export const SLIP_LENGTH_FACTOR = 1.1
/** Slip height as a multiple of the paper's diameter. */
export const SLIP_HEIGHT_FACTOR = 0.2
/** Target slip width at the end of the animation, as a fraction of canvas size. */
export const FINAL_SLIP_WIDTH_FACTOR = 0.92
/** Where the fold1 crease sits, as a fraction of canvas height (moved down to leave headroom above). */
export const CREASE_Y_FACTOR = 0.62

export function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export interface SourceRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/** Crop rect in source-image space that cover-fits a destW x destH box. */
export function coverFitSource(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
): SourceRect {
  const scale = Math.max(destW / srcW, destH / srcH)
  const sw = destW / scale
  const sh = destH / scale
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh }
}

export type Quadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Canvas arc angles (clockwise from +x) spanning each quadrant, centered at the origin. */
const QUADRANT_ANGLES: Record<Quadrant, readonly [number, number]> = {
  'top-right': [-Math.PI / 2, 0],
  'bottom-right': [0, Math.PI / 2],
  'bottom-left': [Math.PI / 2, Math.PI],
  'top-left': [Math.PI, (3 * Math.PI) / 2],
}

/** A quarter-disc wedge (pie slice) of the given radius, centered at the origin. */
export function buildQuarterDiscPath(radius: number, quadrant: Quadrant): Path2D {
  const [start, end] = QUADRANT_ANGLES[quadrant]
  const path = new Path2D()
  path.moveTo(0, 0)
  path.arc(0, 0, radius, start, end)
  path.closePath()
  return path
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Axis-aligned bounding box of the given quadrant's quarter-disc, centered at the origin. */
export function quadrantBounds(radius: number, quadrant: Quadrant): Bounds {
  const left = quadrant === 'top-left' || quadrant === 'bottom-left'
  const top = quadrant === 'top-left' || quadrant === 'top-right'
  return {
    minX: left ? -radius : 0,
    maxX: left ? 0 : radius,
    minY: top ? -radius : 0,
    maxY: top ? 0 : radius,
  }
}

/** Same four values as Quadrant — a flap's home quadrant doubles as its identity. */
export type Flap = Quadrant

/**
 * Cumulative (x, y) scale applied to a flap by the nested fold transform:
 * fold2 (outer, x-axis) wraps the whole right side; fold1 (inner, y-axis) folds
 * each side's bottom quarter onto its top quarter. top-left is the anchor and is
 * never transformed.
 */
export function flapScale(flap: Flap, fold1: number, fold2: number): readonly [number, number] {
  switch (flap) {
    case 'top-left':
      return [1, 1]
    case 'bottom-left':
      return [1, Math.cos(fold1)]
    case 'top-right':
      return [Math.cos(fold2), 1]
    case 'bottom-right':
      return [Math.cos(fold2), Math.cos(fold1)]
  }
}

/** True once a flap has flipped to show its back (an odd number of its folds past 90°). */
export function isFlapBackSide(flap: Flap, fold1: number, fold2: number): boolean {
  const [sx, sy] = flapScale(flap, fold1, fold2)
  return sx < 0 !== sy < 0
}

/** Bounding box of a flap's quarter-disc after its cumulative fold scale is applied. */
export function flapBounds(flap: Flap, fold1: number, fold2: number, radius: number): Bounds {
  const home = quadrantBounds(radius, flap)
  const [sx, sy] = flapScale(flap, fold1, fold2)
  const x1 = home.minX * sx
  const x2 = home.maxX * sx
  const y1 = home.minY * sy
  const y2 = home.maxY * sy
  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minY: Math.min(y1, y2),
    maxY: Math.max(y1, y2),
  }
}

/**
 * The lowest point (max y) of the slip's rotated bounding box, in radius-normalized units.
 * The slip is a rect anchored at the grip point (its left-edge vertical midpoint, at local
 * origin), extending along local +x to `2 * SLIP_LENGTH_FACTOR * slipScale`, with half-height
 * `SLIP_HEIGHT_FACTOR * slipScale`, rotated by `slipAngle` about the grip and translated to
 * (gripX, gripY). All four corners are checked since rotation can make any of them the lowest.
 */
export function slipBoundingBoxMaxY(
  gripY: number,
  slipAngle: number,
  slipScale: number,
): number {
  const length = 2 * SLIP_LENGTH_FACTOR * slipScale
  const halfHeight = SLIP_HEIGHT_FACTOR * slipScale
  const cos = Math.cos(slipAngle)
  const sin = Math.sin(slipAngle)
  const corners = [
    [0, -halfHeight],
    [length, -halfHeight],
    [length, halfHeight],
    [0, halfHeight],
  ] as const
  return Math.max(...corners.map(([x, y]) => gripY + x * sin + y * cos))
}
