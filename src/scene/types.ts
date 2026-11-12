export interface Config {
  message: string
  paper: ImageBitmap | HTMLImageElement
  slipColor: string
  inkColor: string
  fontFamily: string
  background: string
}

export interface Pose {
  /** Whole-scene tilt, radians. */
  sceneRotation: number
  paperOpacity: number
  /** Horizontal hinge: bottom half vs top half. 0..PI. */
  fold1: number
  /** Vertical hinge: right half vs left half. 0..PI. */
  fold2: number
  slipScale: number
  slipOpacity: number
  /** 1 = slip's bottom edge rests on the fold1 crease (tucked in the fold); 0 = centered on canvas. */
  slipLift: number
  textOpacity: number
}
