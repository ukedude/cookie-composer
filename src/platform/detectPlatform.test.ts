import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectIosBrowser, isStandalone } from './detectPlatform'

const UA = {
  iosSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iosChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0.5993.69 Mobile/15E148 Safari/604.1',
  iosFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/118.0 Mobile/15E148 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
  desktopSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
}

describe('detectIosBrowser', () => {
  it.each([
    [UA.iosSafari, 'safari'],
    [UA.iosChrome, 'chrome'],
    [UA.iosFirefox, 'other-ios'],
    [UA.androidChrome, null],
    [UA.desktopSafari, null],
    [UA.desktopChrome, null],
  ])('classifies %s as %s', (ua, expected) => {
    expect(detectIosBrowser(ua)).toBe(expected)
  })
})

describe('isStandalone', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is true when display-mode is standalone', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('standalone') }))
    expect(isStandalone()).toBe(true)
  })

  it('is true when navigator.standalone is set (Safari)', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('navigator', { ...navigator, standalone: true })
    expect(isStandalone()).toBe(true)
  })

  it('is false otherwise', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('navigator', { ...navigator, standalone: false })
    expect(isStandalone()).toBe(false)
  })
})
