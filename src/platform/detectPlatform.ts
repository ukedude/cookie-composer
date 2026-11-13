export type IosBrowser = 'safari' | 'chrome' | 'other-ios' | null

export function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    navigatorWithStandalone.standalone === true
  )
}

export function detectIosBrowser(ua: string = navigator.userAgent): IosBrowser {
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  if (!isIos) return null
  if (/CriOS/.test(ua)) return 'chrome'
  if (/Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) return 'safari'
  return 'other-ios'
}
