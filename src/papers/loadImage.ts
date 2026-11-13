export function loadPaperImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load paper image: ${path}`))
    img.src = `${import.meta.env.BASE_URL}${path}`
  })
}

/** Vertically mirrors a decoded paper image via Canvas 2D (no reliance on createImageBitmap's
 * `imageOrientation` option, which iPhone Safari didn't support until relatively recently). */
export function flipImageVertically(img: HTMLImageElement): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  ctx.translate(0, canvas.height)
  ctx.scale(1, -1)
  ctx.drawImage(img, 0, 0)
  return createImageBitmap(canvas)
}
