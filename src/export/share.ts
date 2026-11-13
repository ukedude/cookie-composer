export interface ShareResult {
  method: 'share' | 'download' | 'cancelled'
}

export async function shareOrDownloadGif(
  blob: Blob,
  filename = 'kindness-cookie.gif',
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/gif' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return { method: 'share' }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { method: 'cancelled' }
      }
      throw err
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  return { method: 'download' }
}
