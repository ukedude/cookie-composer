import { describe, expect, it, vi } from 'vitest'
import { drawFrame } from './drawFrame'
import type { Config } from './types'
import { getPose } from './pose'

// jsdom doesn't implement Path2D; drawFrame builds several, so stub a no-op version for this suite.
class FakePath2D {
  moveTo(): void {}
  lineTo(): void {}
  arc(): void {}
  arcTo(): void {}
  closePath(): void {}
}
vi.stubGlobal('Path2D', FakePath2D)

function createFakeContext(size: number) {
  const calls = { fillText: vi.fn() }
  const gradient = { addColorStop: vi.fn() }
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

function makeConfig(): Config {
  return {
    message: 'You are capable of wonderful things.',
    paper: { width: 100, height: 100 } as unknown as HTMLImageElement,
    slipColor: '#ffffff',
    inkColor: '#3a2e22',
    fontFamily: 'sans-serif',
    background: '#f2e8d4',
  }
}

describe('drawFrame', () => {
  it('does not throw across the whole motion', () => {
    const config = makeConfig()
    for (let i = 0; i <= 10; i++) {
      const { ctx } = createFakeContext(480)
      expect(() => drawFrame(ctx, i / 10, config)).not.toThrow()
    }
  })

  it('only draws the message once the halves are coincident (fold2 === 0)', () => {
    const config = makeConfig()
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const { ctx, calls } = createFakeContext(480)
      drawFrame(ctx, t, config)
      const pose = getPose(t)
      if (pose.fold2 === 0) {
        expect(calls.fillText).toHaveBeenCalled()
      } else {
        expect(calls.fillText).not.toHaveBeenCalled()
      }
    }
  })
})
