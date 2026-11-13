import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AUTO_CORRECT_FILTER,
  clampPan,
  clampZoom,
  computeSourceRect,
  decodeWorkingBitmap,
  exportCroppedJpeg,
  MAX_ZOOM,
  MIN_ZOOM,
  supportsCanvasFilter,
  type CropCenter,
} from '../papers'
import styles from './PaperCropper.module.css'

const VIEWPORT_SIZE = 288

type DecodeError = 'heic' | 'generic'

function isLikelyHeic(file: File): boolean {
  return /\.hei[cf]$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif'
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

interface PaperCropperProps {
  file: File
  onCancel: () => void
  onSave: (blob: Blob) => void
}

export function PaperCropper({ file, onCancel, onSave }: PaperCropperProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [error, setError] = useState<DecodeError | null>(null)
  const [center, setCenter] = useState<CropCenter>({ cx: 0.5, cy: 0.5 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [autoCorrect, setAutoCorrect] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startCenter: CropCenter } | null>(
    null,
  )
  const pinchRef = useRef<{ startDistance: number; startZoom: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    let decoded: ImageBitmap | null = null
    setError(null)
    setBitmap(null)
    decodeWorkingBitmap(file)
      .then((bmp) => {
        if (cancelled) {
          bmp.close()
          return
        }
        decoded = bmp
        setCenter({ cx: 0.5, cy: 0.5 })
        setZoom(MIN_ZOOM)
        setBitmap(bmp)
      })
      .catch(() => {
        if (!cancelled) setError(isLikelyHeic(file) ? 'heic' : 'generic')
      })
    return () => {
      cancelled = true
      decoded?.close()
    }
  }, [file])

  useEffect(() => {
    if (!bitmap) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const rect = computeSourceRect(bitmap.width, bitmap.height, center, zoom)
    ctx.filter = autoCorrect && supportsCanvasFilter() ? AUTO_CORRECT_FILTER : 'none'
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    ctx.drawImage(bitmap, rect.sx, rect.sy, rect.sWidth, rect.sHeight, 0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
  }, [bitmap, center, zoom, autoCorrect])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!bitmap) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 1) {
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startCenter: center }
      pinchRef.current = null
    } else if (pointersRef.current.size === 2) {
      dragRef.current = null
      const [a, b] = Array.from(pointersRef.current.values())
      pinchRef.current = { startDistance: distance(a, b), startZoom: zoom }
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!bitmap || !pointersRef.current.has(e.pointerId)) return
    e.preventDefault()
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values())
      const ratio = distance(a, b) / pinchRef.current.startDistance
      setZoom(clampZoom(pinchRef.current.startZoom * ratio))
      return
    }

    if (pointersRef.current.size === 1 && dragRef.current && dragRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const rect = computeSourceRect(bitmap.width, bitmap.height, dragRef.current.startCenter, zoom)
      const imagePxPerViewportPx = rect.sWidth / VIEWPORT_SIZE
      const nextCenter = {
        cx: dragRef.current.startCenter.cx - (dx * imagePxPerViewportPx) / bitmap.width,
        cy: dragRef.current.startCenter.cy - (dy * imagePxPerViewportPx) / bitmap.height,
      }
      setCenter(clampPan(nextCenter, zoom, bitmap.width, bitmap.height))
    }
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) {
      dragRef.current = null
    } else if (pointersRef.current.size === 1) {
      const [[pointerId, pos]] = Array.from(pointersRef.current.entries())
      dragRef.current = { pointerId, startX: pos.x, startY: pos.y, startCenter: center }
    }
  }

  function handleZoomSlider(value: number) {
    if (!bitmap) return
    const next = clampZoom(value)
    setZoom(next)
    setCenter((c) => clampPan(c, next, bitmap.width, bitmap.height))
  }

  async function handleUsePhoto() {
    if (!bitmap || isSaving) return
    setIsSaving(true)
    try {
      const blob = await exportCroppedJpeg(bitmap, center, zoom, { autoCorrect })
      onSave(blob)
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Crop your paper photo">
        {error && (
          <div className={styles.message}>
            <p>
              {error === 'heic'
                ? "This photo's HEIC format isn't supported here — try a different photo, or a screenshot of it."
                : "Couldn't open this photo. Try a different one."}
            </p>
            <button type="button" className={styles.secondary} onClick={onCancel}>
              Close
            </button>
          </div>
        )}

        {!error && !bitmap && <p className={styles.message}>Opening photo…</p>}

        {!error && bitmap && (
          <>
            <div
              className={styles.viewport}
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <canvas ref={canvasRef} width={VIEWPORT_SIZE} height={VIEWPORT_SIZE} className={styles.canvas} />
              <div className={styles.mask} />
            </div>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomSlider(Number(e.target.value))}
              aria-label="Zoom"
              className={styles.zoomSlider}
            />

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={autoCorrect}
                onChange={(e) => setAutoCorrect(e.target.checked)}
              />
              Brighten photo
            </label>

            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={onCancel} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className={styles.primary} onClick={handleUsePhoto} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Use Photo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
