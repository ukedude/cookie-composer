import type { Config, Pose } from './types'
import { getPose } from './pose'
import {
  buildQuarterDiscPath,
  clamp01,
  coverFitSource,
  isFlapBackSide,
  PAPER_RADIUS_FACTOR,
  SLIP_HEIGHT_FACTOR,
  SLIP_LENGTH_FACTOR,
  type Flap,
} from './geometry'
import { fitText, type MeasureFn } from './text'

const SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)'
const BACK_SIDE_DARKEN = 'rgba(0, 0, 0, 0.1)'
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

  ctx.translate(size / 2, size / 2)
  ctx.rotate(pose.sceneRotation)

  drawFoldedPaper(ctx, pose, config, radius)

  if (pose.textOpacity > 0) {
    drawRevealedText(ctx, pose, config, radius)
  }

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
    if (pose.paperOpacity <= 0) return
    const flap: Flap = side === 'left' ? 'top-left' : 'top-right'
    ctx.save()
    if (side === 'right') ctx.scale(Math.cos(pose.fold2), 1)
    drawFlap(ctx, flap, pose, config, radius, paperRect)
    ctx.restore()
  }
  const paintBottom = (side: Side) => {
    if (pose.paperOpacity <= 0) return
    const flap: Flap = side === 'left' ? 'bottom-left' : 'bottom-right'
    ctx.save()
    if (side === 'right') ctx.scale(Math.cos(pose.fold2), 1)
    ctx.scale(1, Math.cos(pose.fold1))
    drawFlap(ctx, flap, pose, config, radius, paperRect)
    ctx.restore()
  }
  // Whenever the two halves are coincident (fold2 === 0, i.e. not mid-fold along
  // the vertical hinge), draw the slip as one shape so it casts a single shadow
  // with no seam down the middle; otherwise each side's half is drawn separately.
  const paintSlip = () => {
    if (pose.slipOpacity <= 0) return
    if (pose.fold2 === 0) {
      drawFullSlip(ctx, pose, config, radius)
      return
    }
    drawSlipHalf(ctx, 'left', pose, config, radius)
    ctx.save()
    ctx.scale(Math.cos(pose.fold2), 1)
    drawSlipHalf(ctx, 'right', pose, config, radius)
    ctx.restore()
  }

  // Tucking rule: once the bottom flaps have folded past vertical (toward the viewer),
  // they land on top of the top flaps and the slip, hiding everything but the overhang.
  if (bottomFoldedOverTop) {
    paintTop('left')
    paintTop('right')
    paintSlip()
    paintBottom('left')
    paintBottom('right')
  } else {
    paintBottom('left')
    paintBottom('right')
    paintTop('left')
    paintTop('right')
    paintSlip()
  }

  drawCreaseLines(ctx, pose, radius)
}

/** Faint crease where a hinge has flattened — fades in as that fold angle approaches 0. */
function drawCreaseLines(ctx: CanvasRenderingContext2D, pose: Pose, radius: number): void {
  const creaseAlpha = (fold: number) =>
    clamp01(1 - fold / (Math.PI / 2)) * 0.12 * pose.paperOpacity

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
  ctx.globalAlpha *= pose.paperOpacity
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

function slipDimensions(radius: number, slipScale: number) {
  const diameter = radius * 2
  return {
    halfLength: (SLIP_LENGTH_FACTOR * diameter * slipScale) / 2,
    height: SLIP_HEIGHT_FACTOR * diameter * slipScale,
  }
}

function drawSlipHalf(
  ctx: CanvasRenderingContext2D,
  side: Side,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const { halfLength, height } = slipDimensions(radius, pose.slipScale)
  const x0 = side === 'left' ? -halfLength : 0
  const x1 = side === 'left' ? 0 : halfLength
  const roundedEnd: Side = side
  paintSlipPath(ctx, pose, config, buildHalfSlipPath(x0, x1, height, roundedEnd))
}

/** The slip once both halves are coincident (fold2 === 0) — one shape, one shadow, no seam. */
function drawFullSlip(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const { halfLength, height } = slipDimensions(radius, pose.slipScale)
  paintSlipPath(ctx, pose, config, buildFullSlipPath(halfLength, height))
}

function paintSlipPath(ctx: CanvasRenderingContext2D, pose: Pose, config: Config, path: Path2D): void {
  ctx.save()
  ctx.globalAlpha *= pose.slipOpacity

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
function buildHalfSlipPath(x0: number, x1: number, height: number, roundedEnd: Side): Path2D {
  const y0 = -height / 2
  const y1 = height / 2
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

/** Full rounded-rect slip outline, used once the two halves are coincident. */
function buildFullSlipPath(halfLength: number, height: number): Path2D {
  const x0 = -halfLength
  const x1 = halfLength
  const y0 = -height / 2
  const y1 = height / 2
  const cornerRadius = Math.min(height * SLIP_CORNER_RATIO, halfLength)
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

function drawRevealedText(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  config: Config,
  radius: number,
): void {
  const { halfLength, height } = slipDimensions(radius, pose.slipScale)
  const maxWidth = halfLength * 2 * 0.85
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

  ctx.save()
  ctx.globalAlpha *= pose.textOpacity
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

