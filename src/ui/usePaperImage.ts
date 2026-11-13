import { useEffect, useRef, useState } from 'react'
import { flipImageVertically, getCustomPaper, isCustomPaperId, loadPaperImage, PAPER_MANIFEST } from '../papers'

const bundledCache = new Map<string, HTMLImageElement | ImageBitmap>()
const customCache = new Map<string, ImageBitmap>()

/** Resolves a paper id (bundled or custom) to its loaded image, caching decoded images across
 * selections so flipping back and forth between papers doesn't redecode. `onCustomPaperMissing`
 * fires when a `custom:` id can't be resolved — e.g. it was saved in a different storage context
 * (browser tab vs. installed home-screen app) — so the caller can fall back to a valid paper. */
export function usePaperImage(
  paperId: string,
  onCustomPaperMissing?: (id: string) => void,
): HTMLImageElement | ImageBitmap | null {
  const [image, setImage] = useState<HTMLImageElement | ImageBitmap | null>(
    bundledCache.get(paperId) ?? customCache.get(paperId) ?? null,
  )
  const requestIdRef = useRef(0)
  const onMissingRef = useRef(onCustomPaperMissing)
  onMissingRef.current = onCustomPaperMissing

  useEffect(() => {
    const cachedBundled = bundledCache.get(paperId)
    if (cachedBundled) {
      setImage(cachedBundled)
      return
    }
    const cachedCustom = customCache.get(paperId)
    if (cachedCustom) {
      setImage(cachedCustom)
      return
    }

    const requestId = ++requestIdRef.current

    if (isCustomPaperId(paperId)) {
      setImage(null)
      getCustomPaper(paperId)
        .then((record) => {
          if (!record) throw new Error(`Custom paper not found: ${paperId}`)
          return createImageBitmap(record.blob)
        })
        .then((bitmap) => {
          customCache.set(paperId, bitmap)
          if (requestIdRef.current === requestId) setImage(bitmap)
        })
        .catch(() => {
          if (requestIdRef.current === requestId) onMissingRef.current?.(paperId)
        })
      return
    }

    const entry = PAPER_MANIFEST.find((p) => p.id === paperId)
    if (!entry) {
      setImage(null)
      return
    }

    setImage(null)
    loadPaperImage(entry.path)
      .then((img): HTMLImageElement | ImageBitmap | Promise<ImageBitmap> =>
        entry.flipY ? flipImageVertically(img) : img,
      )
      .then((img) => {
        bundledCache.set(paperId, img)
        if (requestIdRef.current === requestId) setImage(img)
      })
  }, [paperId])

  return image
}
