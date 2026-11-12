// One-off script: generate two placeholder paper textures as PNGs using only
// Node built-ins (no new npm dependency). Run manually:
//   node scripts/generate-sample-papers.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SIZE = 1024

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgb) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: RGB
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  const raw = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3)
    raw[rowStart] = 0 // filter type: none
    rgb.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3)
  }
  const idatData = deflateSync(raw)

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeRgbBuffer(width, height, pixelFn) {
  const buf = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y)
      const i = (y * width + x) * 3
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
    }
  }
  return buf
}

function polkaDotPattern(x, y) {
  const bg = [245, 233, 211] // cream
  const dot = [201, 123, 74] // warm terracotta
  const spacing = 128
  const radius = 34
  const cx = Math.round(x / spacing) * spacing
  const cy = Math.round(y / spacing) * spacing
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= radius) {
    const edge = Math.min(1, (radius - dist) / 4)
    return lerpColor(bg, dot, edge)
  }
  return bg
}

function stripePattern(x, y) {
  const bg = [232, 237, 225] // pale sage
  const stripe = [138, 161, 126] // mid sage
  const width = 48
  const diag = (x + y) % (width * 2)
  const t = diag < width ? diag / width : 1 - (diag - width) / width
  const eased = t * t * (3 - 2 * t)
  return lerpColor(bg, stripe, eased)
}

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'papers')

const paper1 = encodePng(SIZE, SIZE, makeRgbBuffer(SIZE, SIZE, polkaDotPattern))
writeFileSync(join(outDir, 'sample-1.png'), paper1)

const paper2 = encodePng(SIZE, SIZE, makeRgbBuffer(SIZE, SIZE, stripePattern))
writeFileSync(join(outDir, 'sample-2.png'), paper2)

console.log('Wrote public/papers/sample-1.png and sample-2.png')
