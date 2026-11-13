import type { GifPalette } from 'gifenc'
import { encodeIndexedFrames, type EncodeProgress, type IndexedFrame } from './gifEncode'

export interface WorkerFrame {
  buffer: ArrayBuffer
  delayMs: number
}

export interface WorkerEncodeRequest {
  type: 'encode'
  width: number
  height: number
  framePalette: GifPalette
  transparentIndex: number
  frames: WorkerFrame[]
}

export type WorkerResponse =
  | { type: 'progress'; progress: EncodeProgress }
  | { type: 'done'; bytes: Uint8Array; encodeMs: number }
  | { type: 'error'; message: string }

// `DedicatedWorkerGlobalScope` isn't resolvable while `tsc -b` is building this project alongside
// the DOM-lib app project in the same invocation. `MessageEvent`/`Transferable` are defined
// identically by both the DOM and WebWorker libs, so this minimal structural type sidesteps the
// clash entirely instead of depending on whichever global lib happens to be loaded.
declare const self: {
  onmessage: ((event: MessageEvent<WorkerEncodeRequest>) => void) | null
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void
}

self.onmessage = async (event: MessageEvent<WorkerEncodeRequest>) => {
  const { width, height, framePalette, transparentIndex, frames } = event.data
  const start = performance.now()

  try {
    const indexedFrames: IndexedFrame[] = frames.map((frame) => ({
      indices: new Uint8Array(frame.buffer),
      delayMs: frame.delayMs,
    }))

    const bytes = await encodeIndexedFrames(
      { width, height, framePalette, transparentIndex, frames: indexedFrames },
      (progress) => {
        self.postMessage({ type: 'progress', progress } satisfies WorkerResponse)
      },
    )

    const encodeMs = performance.now() - start
    self.postMessage({ type: 'done', bytes, encodeMs } satisfies WorkerResponse, [bytes.buffer])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({ type: 'error', message } satisfies WorkerResponse)
  }
}
