import type { Pose } from './types'
import { POSE_TIMES } from './timeline'
import {
  clamp01,
  lerp,
  PAPER_RADIUS_FACTOR,
  SLIP_LENGTH_FACTOR,
  SLIP_REVEAL_WIDTH_FACTOR,
} from './geometry'

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

const BASE_SLIP_LENGTH_FACTOR = SLIP_LENGTH_FACTOR * (2 * PAPER_RADIUS_FACTOR)
/** slipScale at full reveal so the slip ends up SLIP_REVEAL_WIDTH_FACTOR of canvas size. */
const REVEAL_SLIP_SCALE = SLIP_REVEAL_WIDTH_FACTOR / BASE_SLIP_LENGTH_FACTOR

/** Keyframe poses aligned with POSE_TIMES: closed, half, open, revealed. */
export const KEYFRAMES: readonly Pose[] = [
  {
    sceneRotation: degToRad(15),
    paperOpacity: 1,
    fold1: Math.PI,
    fold2: Math.PI,
    slipScale: 1,
    slipOpacity: 1,
    textOpacity: 0,
  },
  {
    sceneRotation: 0,
    paperOpacity: 1,
    fold1: Math.PI,
    fold2: 0,
    slipScale: 1,
    slipOpacity: 1,
    textOpacity: 0,
  },
  {
    sceneRotation: 0,
    paperOpacity: 1,
    fold1: 0,
    fold2: 0,
    slipScale: 1,
    slipOpacity: 1,
    textOpacity: 0,
  },
  {
    sceneRotation: 0,
    paperOpacity: 0,
    fold1: 0,
    fold2: 0,
    slipScale: REVEAL_SLIP_SCALE,
    slipOpacity: 1,
    textOpacity: 1,
  },
]

const POSE_KEYS = [
  'sceneRotation',
  'paperOpacity',
  'fold1',
  'fold2',
  'slipScale',
  'slipOpacity',
  'textOpacity',
] as const satisfies readonly (keyof Pose)[]

function lerpPose(a: Pose, b: Pose, u: number): Pose {
  const result = {} as Pose
  for (const key of POSE_KEYS) {
    result[key] = lerp(a[key], b[key], u)
  }
  return result
}

/** Blend linearly between the nearest two keyframes for t in 0..1. */
export function getPose(t: number): Pose {
  const clamped = clamp01(t)
  const lastIndex = POSE_TIMES.length - 1

  if (clamped <= POSE_TIMES[0]) return KEYFRAMES[0]
  if (clamped >= POSE_TIMES[lastIndex]) return KEYFRAMES[lastIndex]

  const segment = POSE_TIMES.findIndex((_, i) => i < lastIndex && clamped <= POSE_TIMES[i + 1])
  const t0 = POSE_TIMES[segment]
  const t1 = POSE_TIMES[segment + 1]
  const localU = (clamped - t0) / (t1 - t0)
  return lerpPose(KEYFRAMES[segment], KEYFRAMES[segment + 1], localU)
}
