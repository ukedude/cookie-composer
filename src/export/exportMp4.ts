import { HOLD_SECONDS, MOTION_SECONDS, type Config } from '../scene'
import { encodeMp4, type Mp4Progress } from './encodeMp4'
import { checkMp4Support } from './mp4Support'

export type Mp4ExportOutcome =
  | { ok: true; blob: Blob; byteLength: number }
  | { ok: false; reason: string }

export type Mp4ExportPhase = { phase: 'preparing' } | Mp4Progress

const MP4_FPS = 30
const MP4_SIZE = 720
const MP4_BITRATE = 1_500_000 // ~1.5 Mbps; at ~7.9s total this lands around 1.5MB, under the 2MB budget.

/**
 * Single-attempt MP4 build (no retry ladder like exportGif's — the fixed settings above already
 * comfortably clear the size budget). Returns a discriminated outcome rather than null/throwing so
 * Composer can hide the "Share video" button on any failure while still having a reason to log or
 * show behind ?debug=1 (unsupported codec, a cancelled/superseded build, or an encode/mux error are
 * all treated identically by the UI).
 */
export async function exportMp4(
  config: Config,
  onProgress?: (phase: Mp4ExportPhase) => void,
  shouldAbort?: () => boolean,
): Promise<Mp4ExportOutcome> {
  const support = await checkMp4Support(MP4_SIZE)
  if (!support.supported) {
    console.info('[mp4] unavailable:', support.reason)
    return { ok: false, reason: support.reason ?? 'unsupported' }
  }

  onProgress?.({ phase: 'preparing' })
  await document.fonts.ready
  if (config.paper instanceof HTMLImageElement) {
    await config.paper.decode().catch(() => {})
  }

  try {
    const bytes = await encodeMp4(
      config,
      { fps: MP4_FPS, size: MP4_SIZE, bitrate: MP4_BITRATE, motionSeconds: MOTION_SECONDS, holdSeconds: HOLD_SECONDS },
      onProgress,
      shouldAbort,
    )
    return {
      ok: true,
      // bytes always backs a real ArrayBuffer (encodeMp4 constructs it from BufferTarget.buffer,
      // never a SharedArrayBuffer); Uint8Array#buffer is just typed ArrayBufferLike for that case.
      blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'video/mp4' }),
      byteLength: bytes.byteLength,
    }
  } catch (err) {
    if (shouldAbort?.()) return { ok: false, reason: 'cancelled' }
    console.warn('[mp4] build failed:', err)
    return { ok: false, reason: 'build-failed' }
  }
}
