import type { Config, Pose } from './types'
import { getPose } from './pose'
import {
  buildQuarterDiscPath,
  clamp01,
  coverFitSource,
  CREASE_Y_FACTOR,
  isFlapBackSide,
  PAPER_RADIUS_FACTOR,
  SLIP_HEIGHT_FACTOR,
  SLIP_LENGTH_FACTOR,
  type Flap,
} from './geometry'
import { fitText, type MeasureFn } from './text'

const SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)'
const BACK_SIDE_DARKEN = 'rgba(0, 0, 0, 0.1)'
const GAP_SHADOW_COLOR = 'rgba(0, 0, 0, 0.25)'
const SLIP_CORNER_RATIO = 0.3
const SLIP_SHADOW_COLOR = 'rgba(0, 0, 0, 0.18)'
const SLIP_SHADOW_BLUR = 8
const SLIP_SHADOW_OFFSET_Y = 2
const SLIP_BORDER_COLOR = '#D8D2C8'
const SLIP_BORDER_WIDTH = 1

type Side = 'left' | 'right'

/** The single source of truth for every frame: the live preview and the GIF exporter both call this. */
export function drawFrame(ctx: CanvasRenderingContext2D, t: number, config: Config): void {
  const size = ctx.canvas.width
  const pose = getPose(t)
  const radius = PAPER_RADIUS_FACTOR * size

  ctx.save()
  ctx.fillStyle = config.background
  ctx.fillRect(0, 0, size, size)

  ctx.translate(size / 2, size * CREASE_Y_FACTOR)
  ctx.rotate(pose.sceneRotation)

  drawFoldedPaper(ctx, pose, config, radius)

  ctx.restore()
}

function drawFoldedPaper(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const diameter = radius * 2
  const paperRect = coverFitSource(config.paper.width, config.paper.height, diameter, diameter)
  const bottomFoldedOverTop = Math.cos(pose.fold1) < 0

  const paintTop = (side: Side) => {
    const flap: Flap = side === 'left' ? 'top-left' : 'top-right'
    ctx.save()
    if (side === 'right') ctx.scale(Math.cos(pose.fold2), 1)
    drawFlap(ctx, flap, pose, config, radius, paperRect)
    ctx.restore()
  }
  const paintBottom = (side: Side) => {
    const flap: Flap = side === 'left' ? 'bottom-left' : 'bottom-right'
    ctx.save()
    if (side === 'right') ctx.scale(Math.cos(pose.fold2), 1)
    ctx.scale(1, Math.cos(pose.fold1))
    drawFlap(ctx, flap, pose, config, radius, paperRect)
    ctx.restore()
  }
  const paintSlipNow = () => paintSlip(ctx, pose, config, radius)

  // Tucking rule: once the bottom flaps have folded past vertical (toward the viewer), they land
  // on top of the top flaps, hiding everything but the overhang — true for this whole storyboard
  // since fold1 never returns past vertical once the front flap settles at its tipped angle.
  if (bottomFoldedOverTop) {
    paintTop('left')
    paintTop('right')
    drawGapShadow(ctx, pose, radius)
    if (pose.slipLayer === 'inside') paintSlipNow()
    paintBottom('left')
    paintBottom('right')
    if (pose.slipLayer === 'front') paintSlipNow()
  } else {
    // Unreachable in this storyboard — kept for robustness if fold1 ever moves past vertical again.
    paintBottom('left')
    paintBottom('right')
    paintTop('left')
    paintTop('right')
    paintSlipNow()
  }

  drawCreaseLines(ctx, pose, radius)
}

/**
 * As the front flap tips open (fold1 < PI), its covering extent shrinks, revealing a sliver of the
 * top half that used to be fully hidden underneath it. This paints a soft shadow into that sliver
 * so the opening reads as a gap, not a flat color seam. No-op once fully closed (fold1 >= PI).
 */
function drawGapShadow(ctx: CanvasRenderingContext2D, pose: Pose, radius: number): void {
  if (pose.fold1 >= Math.PI) return

  const gapTop = -radius
  const gapBottom = radius * Math.cos(pose.fold1)

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.clip()

  const gradient = ctx.createLinearGradient(0, gapTop, 0, gapBottom)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, GAP_SHADOW_COLOR)
  ctx.fillStyle = gradient
  ctx.fillRect(-radius, gapTop, radius * 2, gapBottom - gapTop)
  ctx.restore()
}

/** Faint crease where a hinge has flattened — fades in as that fold angle approaches 0. */
function drawCreaseLines(ctx: CanvasRenderingContext2D, pose: Pose, radius: number): void {
  const creaseAlpha = (fold: number) => clamp01(1 - fold / (Math.PI / 2)) * 0.12

  const vAlpha = creaseAlpha(pose.fold2)
  if (vAlpha > 0) {
    ctx.strokeStyle = `rgba(0, 0, 0, ${vAlpha})`
    ctx.beginPath()
    ctx.moveTo(0, -radius)
    ctx.lineTo(0, radius)
    ctx.stroke()
  }

  const hAlpha = creaseAlpha(pose.fold1)
  if (hAlpha > 0) {
    ctx.strokeStyle = `rgba(0, 0, 0, ${hAlpha})`
    ctx.beginPath()
    ctx.moveTo(-radius, 0)
    ctx.lineTo(radius, 0)
    ctx.stroke()
  }
}

function drawFlap(
  ctx: CanvasRenderingContext2D,
  flap: Flap,
  pose: Pose,
  config: Config,
  radius: number,
  paperRect: ReturnType<typeof coverFitSource>,
): void {
  ctx.save()
  ctx.shadowColor = SHADOW_COLOR
  ctx.shadowBlur = radius * 0.2
  ctx.shadowOffsetY = radius * 0.1
  ctx.clip(buildQuarterDiscPath(radius, flap))

  // The active transform (a fold's negative scale) mirrors this draw automatically,
  // so the same source crop stays aligned with the rest of the paper across the fold.
  ctx.drawImage(
    config.paper,
    paperRect.sx,
    paperRect.sy,
    paperRect.sw,
    paperRect.sh,
    -radius,
    -radius,
    radius * 2,
    radius * 2,
  )

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  if (isFlapBackSide(flap, pose.fold1, pose.fold2)) {
    ctx.fillStyle = BACK_SIDE_DARKEN
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
  }

  const shading = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
  shading.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shading.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  ctx.fillStyle = shading
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2)

  ctx.restore()
}

/** Dispatches to the two-half split render (while fold2 still separates left/right) or the single
 * grip-rotated piece (once the halves are coincident). */
function paintSlip(ctx: CanvasRenderingContext2D, pose: Pose, config: Config, radius: number): void {
  if (pose.fold2 === 0) {
    drawGrippedSlip(ctx, pose, config, radius)
    return
  }
  drawSlipHalf(ctx, 'left', pose, config, radius)
  ctx.save()
  ctx.scale(Math.cos(pose.fold2), 1)
  drawSlipHalf(ctx, 'right', pose, config, radius)
  ctx.restore()
}

/** Half-slip extents while the slip still rests flat in the crease (slipAngle is always 0 here,
 * so no rotation is needed — the fold2 scale-about-the-paper-center transform wouldn't commute
 * with a grip-relative rotation anyway). */
function drawSlipHalf(
  ctx: CanvasRenderingContext2D,
  side: Side,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const halfLength = SLIP_LENGTH_FACTOR * radius * pose.slipScale
  const halfHeight = SLIP_HEIGHT_FACTOR * radius * pose.slipScale
  const centerY = pose.gripY * radius
  const top = centerY - halfHeight
  const bottom = centerY + halfHeight
  const x0 = side === 'left' ? -halfLength : 0
  const x1 = side === 'left' ? 0 : halfLength
  paintSlipPath(ctx, config, buildHalfSlipPath(x0, x1, top, bottom, side))
}

/** The slip once both halves are coincident (fold2 === 0) and may be tilted — one piece, rotated
 * about its grip point (the left-edge vertical midpoint), with the message glued to it. */
function drawGrippedSlip(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const length = 2 * SLIP_LENGTH_FACTOR * radius * pose.slipScale
  const height = 2 * SLIP_HEIGHT_FACTOR * radius * pose.slipScale

  ctx.save()
  ctx.translate(pose.gripX * radius, pose.gripY * radius)
  ctx.rotate(pose.slipAngle)

  paintSlipPath(ctx, config, buildGripSlipPath(length, height))
  drawSlipText(ctx, config, length, height)

  ctx.restore()
}

function paintSlipPath(ctx: CanvasRenderingContext2D, config: Config, path: Path2D): void {
  ctx.save()

  ctx.shadowColor = SLIP_SHADOW_COLOR
  ctx.shadowBlur = SLIP_SHADOW_BLUR
  ctx.shadowOffsetY = SLIP_SHADOW_OFFSET_Y
  ctx.fillStyle = config.slipColor
  ctx.fill(path)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = SLIP_BORDER_COLOR
  ctx.lineWidth = SLIP_BORDER_WIDTH
  ctx.stroke(path)

  ctx.restore()
}

/**
 * Half-slip outline, left open at the inner (seam) edge: fill() always treats a
 * subpath as closed, so this still fills the full rect, but stroke() won't draw a
 * border down the middle where the two halves meet.
 */
function buildHalfSlipPath(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  roundedEnd: Side,
): Path2D {
  const height = y1 - y0
  const cornerRadius = Math.min(height * SLIP_CORNER_RATIO, (x1 - x0) / 2)
  const path = new Path2D()

  if (roundedEnd === 'left') {
    path.moveTo(x1, y0)
    path.lineTo(x0 + cornerRadius, y0)
    path.arcTo(x0, y0, x0, y0 + cornerRadius, cornerRadius)
    path.lineTo(x0, y1 - cornerRadius)
    path.arcTo(x0, y1, x0 + cornerRadius, y1, cornerRadius)
    path.lineTo(x1, y1)
  } else {
    path.moveTo(x0, y0)
    path.lineTo(x1 - cornerRadius, y0)
    path.arcTo(x1, y0, x1, y0 + cornerRadius, cornerRadius)
    path.lineTo(x1, y1 - cornerRadius)
    path.arcTo(x1, y1, x1 - cornerRadius, y1, cornerRadius)
    path.lineTo(x0, y1)
  }
  return path
}

/**
 * Full rounded-rect slip outline in grip-local coordinates: the grip (rotation pivot) sits at the
 * left-edge vertical midpoint, local origin — x spans [0, length], not symmetric about x=0.
 */
function buildGripSlipPath(length: number, height: number): Path2D {
  const x0 = 0
  const x1 = length
  const y0 = -height / 2
  const y1 = height / 2
  const cornerRadius = Math.min(height * SLIP_CORNER_RATIO, length / 2)
  const path = new Path2D()

  path.moveTo(x0 + cornerRadius, y0)
  path.lineTo(x1 - cornerRadius, y0)
  path.arcTo(x1, y0, x1, y0 + cornerRadius, cornerRadius)
  path.lineTo(x1, y1 - cornerRadius)
  path.arcTo(x1, y1, x1 - cornerRadius, y1, cornerRadius)
  path.lineTo(x0 + cornerRadius, y1)
  path.arcTo(x0, y1, x0, y1 - cornerRadius, cornerRadius)
  path.lineTo(x0, y0 + cornerRadius)
  path.arcTo(x0, y0, x0 + cornerRadius, y0, cornerRadius)
  path.closePath()
  return path
}

/** Draws the message centered on the slip. Called with ctx already translated+rotated to the
 * slip's grip frame, so this only needs one more translate to reach the rect's center. */
function drawSlipText(ctx: CanvasRenderingContext2D, config: Config, length: number, height: number): void {
  ctx.save()
  ctx.translate(length / 2, 0)

  const maxWidth = length * 0.85
  const maxHeight = height * 0.8

  const measure: MeasureFn = (text, fontPx, fontFamily) => {
    ctx.font = `${fontPx}px ${fontFamily}`
    return ctx.measureText(text).width
  }

  const { lines, fontSize } = fitText(
    config.message,
    { maxWidth, maxHeight, fontFamily: config.fontFamily },
    measure,
  )

  ctx.fillStyle = config.inkColor
  ctx.font = `${fontSize}px ${config.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lineHeight = fontSize * 1.25
  const startY = -((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, startY + i * lineHeight)
  })

  ctx.restore()
}
