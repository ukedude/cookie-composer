import { describe, expect, it } from 'vitest'
import { HOLD_SECONDS, MOTION_SECONDS } from '../scene'
import { buildMp4FrameTimings } from './mp4Timeline'

const FPS = 30

describe('buildMp4FrameTimings', () => {
  it('produces motion frames at 30fps plus 120 hold frames', () => {
    const timings = buildMp4FrameTimings({ fps: FPS, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS })

    const motionFrameCount = Math.ceil(MOTION_SECONDS * FPS)
    const holdFrameCount = Math.round(HOLD_SECONDS * FPS)
    expect(holdFrameCount).toBe(120)
    expect(timings).toHaveLength(motionFrameCount + holdFrameCount)
  })

  it('has strictly increasing timestamps', () => {
    const timings = buildMp4FrameTimings({ fps: FPS, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS })

    for (let i = 1; i < timings.length; i++) {
      expect(timings[i].timestampSeconds).toBeGreaterThan(timings[i - 1].timestampSeconds)
    }
  })

  it('holds exactly 120 frames at t=1', () => {
    const timings = buildMp4FrameTimings({ fps: FPS, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS })

    const holdFrames = timings.filter((frame) => frame.t === 1)
    expect(holdFrames).toHaveLength(120)
  })

  it('reaches a total duration within one frame of MOTION_SECONDS + HOLD_SECONDS', () => {
    const timings = buildMp4FrameTimings({ fps: FPS, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS })

    const last = timings.at(-1)!
    const totalDuration = last.timestampSeconds + last.durationSeconds
    expect(totalDuration).toBeCloseTo(MOTION_SECONDS + HOLD_SECONDS, 1)
  })

  it('every frame has a constant duration of 1/fps', () => {
    const timings = buildMp4FrameTimings({ fps: FPS, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS })

    for (const frame of timings) {
      expect(frame.durationSeconds).toBeCloseTo(1 / FPS)
    }
  })
})
