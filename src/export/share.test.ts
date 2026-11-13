import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shareOrDownloadGif } from './share'

const blob = new Blob(['x'], { type: 'image/gif' })

describe('shareOrDownloadGif', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares the file when canShare returns true', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    const result = await shareOrDownloadGif(blob)

    expect(result).toEqual({ method: 'share' })
    expect(share).toHaveBeenCalledTimes(1)
    const arg = share.mock.calls[0][0]
    expect(Object.keys(arg)).toEqual(['files'])
    expect(arg.files).toHaveLength(1)
    expect(arg.files[0].name).toBe('kindness-cookie.gif')
    expect(arg.files[0].type).toBe('image/gif')
  })

  it('treats a cancelled share sheet as cancelled, not an error', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    const result = await shareOrDownloadGif(blob)

    expect(result).toEqual({ method: 'cancelled' })
  })

  it('rethrows genuine share errors', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    await expect(shareOrDownloadGif(blob)).rejects.toThrow('boom')
  })

  it('falls back to a download link when canShare is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const anchor = { click: vi.fn(), href: '', download: '' }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement)

    const result = await shareOrDownloadGif(blob)

    expect(result).toEqual({ method: 'download' })
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(anchor.download).toBe('kindness-cookie.gif')

    vi.mocked(document.createElement).mockRestore()
  })

  it('falls back to a download link when canShare returns false', async () => {
    vi.stubGlobal('navigator', { canShare: vi.fn(() => false), share: vi.fn() })
    const anchor = { click: vi.fn(), href: '', download: '' }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement)

    const result = await shareOrDownloadGif(blob)

    expect(result).toEqual({ method: 'download' })
    vi.mocked(document.createElement).mockRestore()
  })
})
