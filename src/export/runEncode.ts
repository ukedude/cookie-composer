import { encodeIndexedFrames, type EncodeProgress, type GifEncodeInput } from './gifEncode'
import type { WorkerEncodeRequest, WorkerFrame, WorkerResponse } from './gif.worker'

export interface RunEncodeResult {
  bytes: Uint8Array
  encodeMs: number
}

export function canUseWorkerEncoding(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Encodes on a worker when available, transparently falling back to the inline path — not just
 * rejecting — if construction or an early `onerror` indicates the worker is unusable. This is
 * what makes WebKit/iPhone Chrome builds without working module workers degrade cleanly instead
 * of hanging with no result.
 */
export async function runEncode(
  input: GifEncodeInput,
  onProgress?: (progress: EncodeProgress) => void,
): Promise<RunEncodeResult> {
  if (canUseWorkerEncoding()) {
    try {
      return await runEncodeInWorker(input, onProgress)
    } catch {
      // Worker construction or an early message failed — retry inline below.
    }
  }
  return runEncodeInline(input, onProgress)
}

async function runEncodeInline(
  input: GifEncodeInput,
  onProgress?: (progress: EncodeProgress) => void,
): Promise<RunEncodeResult> {
  const start = performance.now()
  const bytes = await encodeIndexedFrames(input, onProgress)
  return { bytes, encodeMs: performance.now() - start }
}

function runEncodeInWorker(
  input: GifEncodeInput,
  onProgress?: (progress: EncodeProgress) => void,
): Promise<RunEncodeResult> {
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module' })
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
      return
    }

    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      worker.terminate()
      fn()
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        onProgress?.(message.progress)
      } else if (message.type === 'done') {
        finish(() => resolve({ bytes: message.bytes, encodeMs: message.encodeMs }))
      } else {
        finish(() => reject(new Error(message.message)))
      }
    }

    worker.onerror = () => {
      finish(() => reject(new Error('GIF encoding worker failed.')))
    }

    // Uint8Array#buffer is typed ArrayBufferLike (it could in principle wrap a SharedArrayBuffer),
    // but ours always comes from `new Uint8Array(length)` in captureFrames/frameDiff, so it's
    // always a real, transferable ArrayBuffer.
    const frames: WorkerFrame[] = input.frames.map((frame) => ({
      buffer: frame.indices.buffer as ArrayBuffer,
      delayMs: frame.delayMs,
    }))
    const request: WorkerEncodeRequest = {
      type: 'encode',
      width: input.width,
      height: input.height,
      framePalette: input.framePalette,
      transparentIndex: input.transparentIndex,
      frames,
    }
    worker.postMessage(
      request,
      frames.map((frame) => frame.buffer),
    )
  })
}
