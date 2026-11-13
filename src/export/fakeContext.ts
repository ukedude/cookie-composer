import { vi } from 'vitest'
import type { Config } from '../scene'

/** jsdom doesn't implement Path2D; drawFrame builds several, so stub a no-op version. Shared by
 * every export test that calls the real drawFrame (same stub as src/scene/drawFrame.test.ts). */
export class FakePath2D {
  moveTo(): void {}
  lineTo(): void {}
  arc(): void {}
  arcTo(): void {}
  closePath(): void {}
}

/** A hand-rolled fake 2D context, extended from drawFrame.test.ts's version with getImageData so
 * captureFrames/buildPalette can be exercised without a real canvas. getImageData always returns
 * the same fixed pixel pattern regardless of what was "drawn" (the fake ctx never actually
 * renders) — which conveniently makes every captured frame after the first look identical to its
 * predecessor, exercising the frame-differencing path without extra setup. */
export function createFakeContext(size: number) {
  const calls = { fillText: vi.fn(), getImageData: vi.fn() }
  const gradient = { addColorStop: vi.fn() }
  const pixelData = new Uint8ClampedArray(size * size * 4).fill(42)

  const ctx = {
    canvas: { width: size, height: size },
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    clip: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    measureText: vi.fn(() => ({ width: 10 })),
    fillText: calls.fillText,
    getImageData: calls.getImageData.mockImplementation(
      (_x: number, _y: number, w: number, h: number) =>
        ({ data: pixelData, width: w, height: h }) as unknown as ImageData,
    ),
    get fillStyle() {
      return ''
    },
    set fillStyle(_v: unknown) {},
    get strokeStyle() {
      return ''
    },
    set strokeStyle(_v: unknown) {},
    get font() {
      return ''
    },
    set font(_v: unknown) {},
    get textAlign() {
      return 'center'
    },
    set textAlign(_v: unknown) {},
    get textBaseline() {
      return 'middle'
    },
    set textBaseline(_v: unknown) {},
    get globalAlpha() {
      return 1
    },
    set globalAlpha(_v: unknown) {},
    get shadowColor() {
      return ''
    },
    set shadowColor(_v: unknown) {},
    get shadowBlur() {
      return 0
    },
    set shadowBlur(_v: unknown) {},
    get shadowOffsetY() {
      return 0
    },
    set shadowOffsetY(_v: unknown) {},
    get lineWidth() {
      return 1
    },
    set lineWidth(_v: unknown) {},
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

export function makeFakeConfig(): Config {
  return {
    message: 'You are capable of wonderful things.',
    paper: { width: 100, height: 100 } as unknown as HTMLImageElement,
    slipColor: '#ffffff',
    inkColor: '#3a2e22',
    fontFamily: 'sans-serif',
    background: '#f2e8d4',
  }
}

/** Stubs `OffscreenCanvas` globally so `createCaptureContext` picks the fake context above. */
export function stubOffscreenCanvas(ctx: CanvasRenderingContext2D) {
  class FakeOffscreenCanvas {
    width: number
    height: number
    constructor(width: number, height: number) {
      this.width = width
      this.height = height
    }
    getContext() {
      return ctx
    }
  }
  vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas)
}
