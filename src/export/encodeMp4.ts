import { drawFrame, type Config } from '../scene'
import { createCaptureContext } from './captureCanvas'
import { buildMp4FrameTimings } from './mp4Timeline'
import { yieldToEventLoop } from './yieldToEventLoop'

export interface Mp4EncodeOptions {
  fps: number
  size: number
  bitrate: number
  motionSeconds: number
  holdSeconds: number
}

export type Mp4Progress = { phase: 'encoding'; frameIndex: number; totalFrames: number }

class Mp4EncodeCancelledError extends Error {}

/**
 * Draws every frame of the storyboard (plus the real, duplicated hold frames) onto a throwaway
 * canvas via drawFrame, feeding each one into a Mediabunny CanvasSource/Output to produce a
 * fast-start MP4. mediabunny is imported dynamically so it never lands in the main bundle.
 *
 * Deliberately does not set `fullCodecString`: Mediabunny's default avc1 profile selection already
 * picks Constrained Baseline specifically on WebKit (a workaround for a known Safari encoder-stall
 * bug) and High profile elsewhere, which is exactly the Main/Baseline-style fallback this app
 * needs — and it's better-informed than a static attempt list would be, since iPhone Safari is
 * this app's primary target (see CLAUDE.md).
 */
export async function encodeMp4(
  config: Config,
  options: Mp4EncodeOptions,
  onProgress?: (progress: Mp4Progress) => void,
  shouldAbort?: () => boolean,
): Promise<Uint8Array> {
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, Quality } = await import('mediabunny')

  const ctx = createCaptureContext(options.size)
  const canvas = ctx.canvas as HTMLCanvasElement | OffscreenCanvas

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  })
  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    quality: new Quality({ bitrate: options.bitrate, bitrateMode: 'constant' }),
    keyFrameInterval: 2,
  })
  output.addVideoTrack(videoSource, { frameRate: options.fps })

  await output.start()

  const timings = buildMp4FrameTimings({
    fps: options.fps,
    motionSeconds: options.motionSeconds,
    holdSeconds: options.holdSeconds,
  })

  try {
    for (let i = 0; i < timings.length; i++) {
      if (shouldAbort?.()) throw new Mp4EncodeCancelledError()

      const timing = timings[i]
      drawFrame(ctx, timing.t, config)
      await videoSource.add(timing.timestampSeconds, timing.durationSeconds)

      onProgress?.({ phase: 'encoding', frameIndex: i + 1, totalFrames: timings.length })
      if (i % 5 === 4) await yieldToEventLoop()
    }
  } catch (err) {
    await output.cancel()
    throw err
  }

  await output.finalize()
  const buffer = output.target.buffer
  if (!buffer) throw new Error('MP4 encode finished with no output buffer.')
  return new Uint8Array(buffer)
}
