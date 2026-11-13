export interface Config {
  message: string
  paper: ImageBitmap | HTMLImageElement
  slipColor: string
  inkColor: string
  fontFamily: string
  background: string
}

export interface Pose {
  /** Whole-scene tilt, radians. Nonzero only during the closed-wobble/unfold handoff. */
  sceneRotation: number
  /** Horizontal hinge: bottom half vs top half. 0..PI. */
  fold1: number
  /** Vertical hinge: right half vs left half. 0..PI. */
  fold2: number
  /** Slip's grip point (its left-edge vertical midpoint), x, radius-normalized. */
  gripX: number
  /** Slip's grip point y, radius-normalized. */
  gripY: number
  /** Slip's rotation about the grip point, radians, ctx.rotate convention. */
  slipAngle: number
  slipScale: number
  /** Paint order: 'inside' sits between the back half and the front flap; 'front' is painted last. */
  slipLayer: 'inside' | 'front'
}
