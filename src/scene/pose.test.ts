import { describe, expect, it } from 'vitest'
import { getPose, KEYFRAMES } from './pose'
import { POSE_TIMES } from './timeline'
import { flapBounds, slipBounds, type Flap } from './geometry'

describe('getPose', () => {
  it('returns the exact keyframe values at each keyframe time', () => {
    POSE_TIMES.forEach((time, i) => {
      expect(getPose(time)).toEqual(KEYFRAMES[i])
    })
  })

  it('clamps outside 0..1', () => {
    expect(getPose(-1)).toEqual(KEYFRAMES[0])
    expect(getPose(2)).toEqual(KEYFRAMES[KEYFRAMES.length - 1])
  })

  it('interpolates fold2 while pinning fold1 in the closed-to-half segment', () => {
    const midpoint = getPose(0.165) // halfway between t=0 and t=0.33
    expect(midpoint.fold1).toBeCloseTo(KEYFRAMES[0].fold1)
    expect(midpoint.fold2).toBeCloseTo(Math.PI / 2, 2)
    expect(midpoint.sceneRotation).toBeCloseTo(KEYFRAMES[0].sceneRotation / 2, 2)
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

describe('slip vertical position', () => {
  it('rests its bottom edge on the fold1 crease at the half and open poses', () => {
    const radius = 100
    for (const t of [0.33, 0.66]) {
      const pose = getPose(t)
      const { bottom } = slipBounds(radius, pose.slipScale, pose.slipLift)
      expect(bottom).toBeCloseTo(0)
    }
  })

  it('is centered on the canvas once fully revealed', () => {
    const radius = 100
    const pose = getPose(1)
    const { top, bottom } = slipBounds(radius, pose.slipScale, pose.slipLift)
    expect(top + bottom).toBeCloseTo(0)
  })
})
