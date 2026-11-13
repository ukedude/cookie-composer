import { describe, expect, it } from 'vitest'
import { walkTopLevelBoxes } from './mp4Boxes'

function makeBox(type: string, payloadSize: number): Uint8Array {
  const size = 8 + payloadSize
  const box = new Uint8Array(size)
  const view = new DataView(box.buffer)
  view.setUint32(0, size)
  for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i)
  return box
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const buffer = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    buffer.set(part, offset)
    offset += part.length
  }
  return buffer
}

describe('walkTopLevelBoxes', () => {
  it('reads ftyp, moov, mdat in order when that is the real order', () => {
    const buffer = concat(makeBox('ftyp', 16), makeBox('moov', 200), makeBox('mdat', 5000))

    const boxes = walkTopLevelBoxes(buffer)

    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'moov', 'mdat'])
  })

  it('reports the true order even when moov comes after mdat (fast-start violation)', () => {
    const buffer = concat(makeBox('ftyp', 16), makeBox('mdat', 5000), makeBox('moov', 200))

    const boxes = walkTopLevelBoxes(buffer)

    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'mdat', 'moov'])
    const moovIndex = boxes.findIndex((b) => b.type === 'moov')
    const mdatIndex = boxes.findIndex((b) => b.type === 'mdat')
    expect(moovIndex).toBeGreaterThan(mdatIndex)
  })

  it('reports correct start offsets and sizes', () => {
    const buffer = concat(makeBox('ftyp', 16), makeBox('moov', 200))

    const boxes = walkTopLevelBoxes(buffer)

    expect(boxes[0]).toEqual({ type: 'ftyp', start: 0, size: 24 })
    expect(boxes[1]).toEqual({ type: 'moov', start: 24, size: 208 })
  })

  it('treats a size-0 box as extending to the end of the buffer', () => {
    const ftyp = makeBox('ftyp', 16)
    const mdat = makeBox('mdat', 100)
    new DataView(mdat.buffer).setUint32(0, 0) // size === 0 means "to EOF"
    const buffer = concat(ftyp, mdat)

    const boxes = walkTopLevelBoxes(buffer)

    expect(boxes).toHaveLength(2)
    expect(boxes[1]).toEqual({ type: 'mdat', start: 24, size: buffer.length - 24 })
  })

  it('returns an empty list for an empty buffer', () => {
    expect(walkTopLevelBoxes(new Uint8Array(0))).toEqual([])
  })
})
