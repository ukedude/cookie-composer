import { useEffect, useRef, useState } from 'react'
import { loadPaperImage, PAPER_MANIFEST } from '../papers'

const imageCache = new Map<string, HTMLImageElement>()

/** Resolves a paper id to its loaded image, caching decoded images across selections so flipping
 * back and forth between papers doesn't redecode. */
export function usePaperImage(paperId: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(imageCache.get(paperId) ?? null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const cached = imageCache.get(paperId)
    if (cached) {
      setImage(cached)
      return
    }

    const entry = PAPER_MANIFEST.find((p) => p.id === paperId)
    if (!entry) {
      setImage(null)
      return
    }

    const requestId = ++requestIdRef.current
    setImage(null)
    loadPaperImage(entry.path).then((img) => {
      imageCache.set(paperId, img)
      if (requestIdRef.current === requestId) setImage(img)
    })
  }, [paperId])

  return image
}
