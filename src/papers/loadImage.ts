export function loadPaperImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load paper image: ${path}`))
    img.src = `${import.meta.env.BASE_URL}${path}`
  })
}
