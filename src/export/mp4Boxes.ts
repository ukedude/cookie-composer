export interface Mp4Box {
  type: string
  start: number
  size: number
}

/**
 * Walks the top-level ISO-BMFF boxes of a buffer (ftyp, moov, mdat, ...), reading each box's
 * 4-byte size + 4-byte ASCII type header and skipping to the next box. Used to verify fast-start
 * MP4 output puts moov before mdat. Handles the size===1 64-bit extended-size header; a box with
 * size===0 is treated as extending to the end of the buffer, per the ISO-BMFF spec.
 */
export function walkTopLevelBoxes(buffer: Uint8Array): Mp4Box[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const boxes: Mp4Box[] = []
  let offset = 0

  while (offset + 8 <= buffer.byteLength) {
    const start = offset
    const declaredSize = view.getUint32(offset)
    const type = readAscii(buffer, offset + 4, 4)

    let headerSize = 8
    let size = declaredSize
    if (declaredSize === 1) {
      if (offset + 16 > buffer.byteLength) break
      const high = view.getUint32(offset + 8)
      const low = view.getUint32(offset + 12)
      size = high * 2 ** 32 + low
      headerSize = 16
    } else if (declaredSize === 0) {
      size = buffer.byteLength - offset
    }

    if (size < headerSize) break
    boxes.push({ type, start, size })
    offset += size
  }

  return boxes
}

function readAscii(buffer: Uint8Array, start: number, length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(buffer[start + i])
  }
  return result
}
