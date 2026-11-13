import { describe, expect, it } from 'vitest'
import {
  FINAL_GRIP_Y,
  FINAL_SLIP_SCALE,
  getPose,
  KEYFRAMES,
  SEGMENT_SECONDS,
  T_CLEAR,
} from './pose'
import { flapBounds, slipBoundingBoxMaxY, SLIP_LENGTH_FACTOR, type Flap } from './geometry'
import { MOTION_SECONDS } from './timeline'

const NUMERIC_KEYS = ['sceneRotation', 'fold1', 'fold2', 'gripX', 'gripY', 'slipAngle', 'slipScale'] as const
const EPS = 1e-6

function secondsToT(seconds: number): number {
  return seconds / MOTION_SECONDS
}

describe('getPose continuity', () => {
  it('has no pop across any interior segment boundary', () => {
    const interiorBoundaries = SEGMENT_SECONDS.slice(1, -1)
    for (const boundary of interiorBoundaries) {
      const before = getPose(secondsToT(boundary - EPS))
      const after = getPose(secondsToT(boundary + EPS))
      for (const key of NUMERIC_KEYS) {
        expect(after[key]).toBeCloseTo(before[key], 3)
      }
    }
  })

  it('returns the exact keyframe values at each boundary time', () => {
    SEGMENT_SECONDS.forEach((seconds, i) => {
      const pose = getPose(secondsToT(seconds))
      for (const key of NUMERIC_KEYS) {
        expect(pose[key]).toBeCloseTo(KEYFRAMES[i][key], 5)
      }
    })
  })
})

describe('slipLayer latch', () => {
  it('is "inside" before T_CLEAR and "front" from T_CLEAR onward, never flipping back', () => {
    const steps = 200
    for (let i = 0; i <= steps; i++) {
      const seconds = (i / steps) * MOTION_SECONDS
      const pose = getPose(secondsToT(seconds))
      if (seconds < T_CLEAR - 1e-3) {
        expect(pose.slipLayer).toBe('inside')
      } else if (seconds > T_CLEAR + 1e-3) {
        expect(pose.slipLayer).toBe('front')
      }
    }
  })

  it('has actually cleared the front flap top edge at T_CLEAR', () => {
    const pose = getPose(secondsToT(T_CLEAR))
    const maxY = slipBoundingBoxMaxY(pose.gripY, pose.slipAngle, pose.slipScale)
    expect(maxY).toBeLessThanOrEqual(Math.cos(pose.fold1) + 1e-6)
  })

  it('stays "front" during the final descent even though the slip is lower than the flap edge again', () => {
    const pose = getPose(secondsToT(3.7))
    const maxY = slipBoundingBoxMaxY(pose.gripY, pose.slipAngle, pose.slipScale)
    expect(maxY).toBeGreaterThan(Math.cos(pose.fold1)) // raw condition would say 'inside'
    expect(pose.slipLayer).toBe('front') // but the latch keeps it 'front'
  })
})

describe('slip stays in (or above) the crease through the peel', () => {
  it('never dips below the crease from t=0 through the end of the peel (seconds=2.0)', () => {
    const steps = 200
    for (let i = 0; i <= steps; i++) {
      const seconds = (i / steps) * 2.0
      const pose = getPose(secondsToT(seconds))
      const maxY = slipBoundingBoxMaxY(pose.gripY, pose.slipAngle, pose.slipScale)
      expect(maxY).toBeLessThanOrEqual(1e-6)
    }
  })
})

describe('final pose', () => {
  it('reaches FINAL_SLIP_SCALE, horizontally centered, vertically at the cookie midpoint', () => {
    const pose = getPose(1)
    expect(pose.slipScale).toBeCloseTo(FINAL_SLIP_SCALE)
    expect(pose.gripX + SLIP_LENGTH_FACTOR * pose.slipScale).toBeCloseTo(0)
    expect(pose.gripY).toBeCloseTo(FINAL_GRIP_Y)
  })
})

describe('closed pose silhouette', () => {
  it('keeps every paper flap within the top-left quadrant at t=0', () => {
    const pose = getPose(0)
    const radius = 100
    const flaps: Flap[] = ['top-left', 'bottom-left', 'top-right', 'bottom-right']
    const epsilon = 1e-9

    for (const flap of flaps) {
      const bounds = flapBounds(flap, pose.fold1, pose.fold2, radius)
      expect(bounds.maxX).toBeLessThanOrEqual(epsilon)
      expect(bounds.maxY).toBeLessThanOrEqual(epsilon)
    }
  })
})
