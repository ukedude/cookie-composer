/**
 * gifenc ships no TypeScript types. Shapes here are taken from the installed package's own
 * source (node_modules/gifenc/src/index.js, palettize.js, pnnquant2.js) and README, verified
 * against gifenc@1.0.3 — narrowed to the surface this project actually uses.
 */
declare module 'gifenc' {
  export type GifColor = [number, number, number] | [number, number, number, number]
  export type GifPalette = GifColor[]

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: Record<string, unknown>,
  ): GifPalette

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: 'rgb565' | 'rgb444' | 'rgba4444',
  ): Uint8Array

  export interface GifWriteFrameOptions {
    palette?: GifPalette
    first?: boolean
    transparent?: boolean
    transparentIndex?: number
    delay?: number
    repeat?: number
    dispose?: number
    colorDepth?: number
  }

  export interface GifEncoderInstance {
    reset(): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    readonly buffer: ArrayBuffer
    writeHeader(): void
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifWriteFrameOptions): void
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GifEncoderInstance
}
