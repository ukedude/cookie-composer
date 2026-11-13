import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shareOrDownloadMp4 } from './share'

const blob = new Blob(['x'], { type: 'video/mp4' })

describe('shareOrDownloadMp4', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares the file with the right name and mime type when canShare returns true', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    const result = await shareOrDownloadMp4(blob)

    expect(result).toEqual({ method: 'share' })
    const arg = share.mock.calls[0][0]
    expect(arg.files[0].name).toBe('kindness-cookie.mp4')
    expect(arg.files[0].type).toBe('video/mp4')
  })

  it('falls back to a download link when canShare is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const anchor = { click: vi.fn(), href: '', download: '' }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement)

    const result = await shareOrDownloadMp4(blob)

    expect(result).toEqual({ method: 'download' })
    expect(anchor.download).toBe('kindness-cookie.mp4')

    vi.mocked(document.createElement).mockRestore()
  })
})
