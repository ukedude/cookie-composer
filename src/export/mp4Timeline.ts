export interface Mp4FrameTiming {
  /** t value to pass to drawFrame, 0..1. */
  t: number
  /** Seconds, monotonically increasing, starts at 0. */
  timestampSeconds: number
  /** Seconds this frame occupies. */
  durationSeconds: number
}

export interface Mp4TimingOptions {
  fps: number
  motionSeconds: number
  holdSeconds: number
}

/**
 * Pure frame-timing schedule for MP4 capture: motion frames at the same t formula captureFrames.ts
 * uses for GIF, followed by real duplicate frames at t=1 for the hold — unlike the GIF path, which
 * holds via a single frame with a long delay (a trick video re-encoders like WhatsApp's don't honor).
 */
export function buildMp4FrameTimings({ fps, motionSeconds, holdSeconds }: Mp4TimingOptions): Mp4FrameTiming[] {
  const durationSeconds = 1 / fps
  const timings: Mp4FrameTiming[] = []

  const motionFrameCount = Math.ceil(motionSeconds * fps)
  for (let i = 0; i < motionFrameCount; i++) {
    const t = Math.min(1, i / fps / motionSeconds)
    timings.push({ t, timestampSeconds: i * durationSeconds, durationSeconds })
  }

  const holdFrameCount = Math.round(holdSeconds * fps)
  for (let i = 0; i < holdFrameCount; i++) {
    timings.push({ t: 1, timestampSeconds: (motionFrameCount + i) * durationSeconds, durationSeconds })
  }

  return timings
}
