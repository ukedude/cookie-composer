import type { Pose } from './types'
import { MOTION_SECONDS, SEGMENT_SECONDS } from './timeline'
import {
  clamp01,
  FINAL_SLIP_WIDTH_FACTOR,
  lerp,
  PAPER_RADIUS_FACTOR,
  SLIP_HEIGHT_FACTOR,
  SLIP_LENGTH_FACTOR,
  slipBoundingBoxMaxY,
} from './geometry'
import { easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic } from './easing'

export { SEGMENT_SECONDS }

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// --- Closed-pose idle wobble (segment 0, 0s..0.5s) ---------------------------------------------

export const BASE_ROTATION = degToRad(15)
export const WOBBLE_AMPLITUDE = degToRad(2)
export const WOBBLE_FREQUENCY_HZ = 2
const WOBBLE_DURATION = SEGMENT_SECONDS[1]

/** 1 at s=0, eases smoothly to 0 at s=WOBBLE_DURATION — no snap at the unfold handoff. */
function wobbleEnvelope(seconds: number): number {
  return (1 - seconds / WOBBLE_DURATION) ** 2
}

function wobbleRotation(seconds: number): number {
  const wobble = WOBBLE_AMPLITUDE * Math.sin(2 * Math.PI * WOBBLE_FREQUENCY_HZ * seconds)
  return BASE_ROTATION + wobble * wobbleEnvelope(seconds)
}

/** sceneRotation at the end of the wobble segment — computed, not hardcoded, so it stays exactly
 * continuous with wobbleRotation() even if the envelope or frequency are retuned later. */
export const ROTATION_AT_HANDOFF = wobbleRotation(WOBBLE_DURATION)

// --- Slip rest position (segments 1-2, flat in the crease) -------------------------------------

const REST_GRIP_X = -SLIP_LENGTH_FACTOR
const REST_GRIP_Y = -SLIP_HEIGHT_FACTOR

// --- Peel (segment 3): slip tilts up at its left end while its right end stays pinned to the crease

export const TILT_ANGLE = degToRad(12)

/** gripY such that the slip's right (far) end stays exactly on the crease (y = REST_GRIP_Y) at the
 * given tilt — this is re-evaluated every frame during the peel, not just at its endpoints. */
function peelGripY(angle: number): number {
  return REST_GRIP_Y - 2 * SLIP_LENGTH_FACTOR * Math.sin(angle)
}

export const PEEL_END_GRIP_Y = peelGripY(TILT_ANGLE)

// --- Rise (segment 4): constant tilt, straight up until clear of the whole cookie --------------

export const RISE_Y = -1.85

// --- Final pose (segment 6 end): centered, grown to FINAL_SLIP_WIDTH_FACTOR of canvas width ----

export const FINAL_SLIP_SCALE = FINAL_SLIP_WIDTH_FACTOR / (SLIP_LENGTH_FACTOR * 2 * PAPER_RADIUS_FACTOR)
export const FINAL_GRIP_X = -SLIP_LENGTH_FACTOR * FINAL_SLIP_SCALE
export const FINAL_GRIP_Y = -0.5
export const EASE_BACK_OVERSHOOT = 1.2

const FOLD1_CLOSED = Math.PI
const FOLD1_TIPPED = degToRad(157.5)

type RawPose = Omit<Pose, 'slipLayer'>

/** Keyframe poses aligned with SEGMENT_SECONDS. slipLayer is derived separately — see getPose. */
export const KEYFRAMES: readonly RawPose[] = [
  // 0 (t=0s) closed. sceneRotation here is unused directly — segment 0 drives it via wobbleRotation.
  {
    sceneRotation: BASE_ROTATION,
    fold1: FOLD1_CLOSED,
    fold2: Math.PI,
    gripX: REST_GRIP_X,
    gripY: REST_GRIP_Y,
    slipAngle: 0,
    slipScale: 1,
  },
  // 1 (t=0.5s) end of the wobble, start of the fold2 unfold.
  {
    sceneRotation: ROTATION_AT_HANDOFF,
    fold1: FOLD1_CLOSED,
    fold2: Math.PI,
    gripX: REST_GRIP_X,
    gripY: REST_GRIP_Y,
    slipAngle: 0,
    slipScale: 1,
  },
  // 2 (t=1.3s) fold2 open — half circle.
  {
    sceneRotation: 0,
    fold1: FOLD1_CLOSED,
    fold2: 0,
    gripX: REST_GRIP_X,
    gripY: REST_GRIP_Y,
    slipAngle: 0,
    slipScale: 1,
  },
  // 3 (t=1.7s) front flap tipped forward — slip still flat in the crease.
  {
    sceneRotation: 0,
    fold1: FOLD1_TIPPED,
    fold2: 0,
    gripX: REST_GRIP_X,
    gripY: REST_GRIP_Y,
    slipAngle: 0,
    slipScale: 1,
  },
  // 4 (t=2.0s) peel done — left end lifted, right end still pinned to the crease.
  {
    sceneRotation: 0,
    fold1: FOLD1_TIPPED,
    fold2: 0,
    gripX: REST_GRIP_X,
    gripY: PEEL_END_GRIP_Y,
    slipAngle: TILT_ANGLE,
    slipScale: 1,
  },
  // 5 (t=2.5s) risen clear of the whole cookie, still tilted.
  {
    sceneRotation: 0,
    fold1: FOLD1_TIPPED,
    fold2: 0,
    gripX: REST_GRIP_X,
    gripY: RISE_Y,
    slipAngle: TILT_ANGLE,
    slipScale: 1,
  },
  // 6 (t=2.8s) leveled — tilt removed, position held.
  {
    sceneRotation: 0,
    fold1: FOLD1_TIPPED,
    fold2: 0,
    gripX: REST_GRIP_X,
    gripY: RISE_Y,
    slipAngle: 0,
    slipScale: 1,
  },
  // 7 (t=3.9s) final/held — centered, grown to full size.
  {
    sceneRotation: 0,
    fold1: FOLD1_TIPPED,
    fold2: 0,
    gripX: FINAL_GRIP_X,
    gripY: FINAL_GRIP_Y,
    slipAngle: 0,
    slipScale: FINAL_SLIP_SCALE,
  },
] as const

type Easing = (u: number) => number

/** Easing for each segment, aligned with KEYFRAMES[i] -> KEYFRAMES[i+1] for i = 1..6 (segment 0 is
 * the wobble special-case, handled directly by rawPoseAt). */
const EASING_BY_SEGMENT: readonly Easing[] = [
  easeInOutCubic, // 1->2 fold2 opens
  easeInOutCubic, // 2->3 front flap tips
  easeInCubic, // 3->4 peel
  easeOutCubic, // 4->5 rise
  easeInOutCubic, // 5->6 level
  (u: number) => easeOutBack(u, EASE_BACK_OVERSHOOT), // 6->7 descend, grow, settle
]

const POSE_KEYS = [
  'sceneRotation',
  'fold1',
  'fold2',
  'gripX',
  'gripY',
  'slipAngle',
  'slipScale',
] as const satisfies readonly (keyof RawPose)[]

function lerpRawPose(a: RawPose, b: RawPose, u: number): RawPose {
  const result = {} as RawPose
  for (const key of POSE_KEYS) {
    result[key] = lerp(a[key], b[key], u)
  }
  return result
}

/** Raw pose (everything but slipLayer) as a pure function of elapsed seconds. Used both by
 * getPose and by the one-time T_CLEAR sampling below. */
function rawPoseAt(seconds: number): RawPose {
  if (seconds <= SEGMENT_SECONDS[1]) {
    return { ...KEYFRAMES[0], sceneRotation: wobbleRotation(seconds) }
  }

  const lastIndex = SEGMENT_SECONDS.length - 1
  if (seconds >= SEGMENT_SECONDS[lastIndex]) {
    return KEYFRAMES[lastIndex]
  }

  const segment = SEGMENT_SECONDS.findIndex(
    (_, i) => i < lastIndex && seconds <= SEGMENT_SECONDS[i + 1],
  )
  const t0 = SEGMENT_SECONDS[segment]
  const t1 = SEGMENT_SECONDS[segment + 1]
  const localU = (seconds - t0) / (t1 - t0)
  const eased = EASING_BY_SEGMENT[segment - 1](localU)
  const pose = lerpRawPose(KEYFRAMES[segment], KEYFRAMES[segment + 1], eased)

  if (segment === 3) {
    // Peel: gripY is pinned to the crease via the current (already-eased) slipAngle, not an
    // independent lerp — sin() isn't linear in the eased progress, so a naive parallel lerp of
    // gripY would drift off the crease mid-segment.
    return { ...pose, gripY: peelGripY(pose.slipAngle) }
  }
  return pose
}

/** First time (seconds) the slip's bounding box clears the front flap's top edge, computed once at
 * module load by sampling. slipLayer latches to 'front' from this point on — see Correction 1 in
 * the Phase 2 plan: re-deriving the raw condition every frame would flip the slip back behind the
 * flap as it descends past this height on its way to its (lower) final resting pose. */
const T_CLEAR = (() => {
  const steps = 2000
  for (let i = 0; i <= steps; i++) {
    const seconds = (i / steps) * MOTION_SECONDS
    const pose = rawPoseAt(seconds)
    const maxY = slipBoundingBoxMaxY(pose.gripY, pose.slipAngle, pose.slipScale)
    if (maxY <= Math.cos(pose.fold1)) {
      return seconds
    }
  }
  return MOTION_SECONDS
})()

export { T_CLEAR }

/** Blend across the storyboard's segments for t in 0..1 (seconds = t * MOTION_SECONDS). */
export function getPose(t: number): Pose {
  const seconds = clamp01(t) * MOTION_SECONDS
  const pose = rawPoseAt(seconds)
  return { ...pose, slipLayer: seconds >= T_CLEAR ? 'front' : 'inside' }
}
