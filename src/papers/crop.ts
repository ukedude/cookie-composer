import { applyBrightnessContrast, AUTO_CORRECT_FILTER, supportsCanvasFilter } from './autoCorrect'

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
export const DOWNSCALE_MAX_LONG_EDGE = 1600
export const CROP_OUTPUT_SIZE = 1024
export const CROP_JPEG_QUALITY = 0.85

export interface CropCenter {
  cx: number
  cy: number
}

export interface SourceRect {
  sx: number
  sy: number
  sWidth: number
  sHeight: number
}

export function computeDownscaledSize(
  width: number,
  height: number,
  maxLongEdge: number = DOWNSCALE_MAX_LONG_EDGE,
): { width: number; height: number } {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxLongEdge) return { width, height }
  const scale = maxLongEdge / longEdge
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function clampZoom(zoom: number, min: number = MIN_ZOOM, max: number = MAX_ZOOM): number {
  return Math.min(max, Math.max(min, zoom))
}

function windowSize(imageWidth: number, imageHeight: number, zoom: number): number {
  return Math.min(imageWidth, imageHeight) / clampZoom(zoom)
}

export function clampPan(
  center: CropCenter,
  zoom: number,
  imageWidth: number,
  imageHeight: number,
): CropCenter {
  const size = windowSize(imageWidth, imageHeight, zoom)
  const halfW = size / 2
  const minCx = halfW / imageWidth
  const maxCx = 1 - halfW / imageWidth
  const minCy = halfW / imageHeight
  const maxCy = 1 - halfW / imageHeight
  const cx = maxCx >= minCx ? Math.min(maxCx, Math.max(minCx, center.cx)) : 0.5
  const cy = maxCy >= minCy ? Math.min(maxCy, Math.max(minCy, center.cy)) : 0.5
  return { cx, cy }
}

export function computeSourceRect(
  imageWidth: number,
  imageHeight: number,
  center: CropCenter,
  zoom: number,
): SourceRect {
  const size = windowSize(imageWidth, imageHeight, zoom)
  return {
    sx: center.cx * imageWidth - size / 2,
    sy: center.cy * imageHeight - size / 2,
    sWidth: size,
    sHeight: size,
  }
}

async function drawToCanvasBitmap(
  source: ImageBitmap,
  width: number,
  height: number,
): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')
  ctx.drawImage(source, 0, 0, width, height)
  return createImageBitmap(canvas)
}

/** Decodes a photo with EXIF rotation applied, downscaled to a working size that keeps the crop
 * UI responsive. A decode failure here (thrown by createImageBitmap) is how HEIC/unsupported
 * formats surface to the caller. */
export async function decodeWorkingBitmap(file: File): Promise<ImageBitmap> {
  const full = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const target = computeDownscaledSize(full.width, full.height)
  if (target.width === full.width && target.height === full.height) {
    return full
  }

  let resized = await createImageBitmap(file, {
    imageOrientation: 'from-image',
    resizeWidth: target.width,
    resizeHeight: target.height,
    resizeQuality: 'medium',
  })

  // Some WebKit versions silently ignore resizeWidth/resizeHeight — verify and fall back to a
  // canvas draw so the working bitmap is actually small (iPhone photos are large even post-EXIF).
  if (resized.width !== target.width || resized.height !== target.height) {
    resized.close()
    resized = await drawToCanvasBitmap(full, target.width, target.height)
  }

  full.close()
  return resized
}

export async function exportCroppedJpeg(
  bitmap: ImageBitmap,
  center: CropCenter,
  zoom: number,
  options: { autoCorrect: boolean },
): Promise<Blob> {
  const rect = computeSourceRect(bitmap.width, bitmap.height, center, zoom)
  const canvas = document.createElement('canvas')
  canvas.width = CROP_OUTPUT_SIZE
  canvas.height = CROP_OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')

  const useFilter = options.autoCorrect && supportsCanvasFilter()
  if (useFilter) ctx.filter = AUTO_CORRECT_FILTER
  ctx.drawImage(
    bitmap,
    rect.sx,
    rect.sy,
    rect.sWidth,
    rect.sHeight,
    0,
    0,
    CROP_OUTPUT_SIZE,
    CROP_OUTPUT_SIZE,
  )

  if (options.autoCorrect && !supportsCanvasFilter()) {
    const imageData = ctx.getImageData(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE)
    applyBrightnessContrast(imageData.data)
    ctx.putImageData(imageData, 0, 0)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG.'))),
      'image/jpeg',
      CROP_JPEG_QUALITY,
    )
  })
}
