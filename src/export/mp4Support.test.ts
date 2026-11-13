import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('mediabunny', () => ({
  Mp4OutputFormat: class {
    getSupportedVideoCodecs() {
      return ['avc']
    }
  },
  getFirstEncodableVideoCodec: vi.fn(),
}))

import * as mediabunny from 'mediabunny'
import { checkMp4Support } from './mp4Support'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('checkMp4Support', () => {
  it('reports unsupported without importing mediabunny when VideoEncoder is missing', async () => {
    vi.stubGlobal('VideoEncoder', undefined)

    const result = await checkMp4Support(720)

    expect(result).toEqual({ supported: false, reason: 'VideoEncoder not available' })
    expect(mediabunny.getFirstEncodableVideoCodec).not.toHaveBeenCalled()
  })

  it('reports supported with the resolved codec when encoding is possible', async () => {
    vi.stubGlobal('VideoEncoder', class {})
    vi.mocked(mediabunny.getFirstEncodableVideoCodec).mockResolvedValue('avc')

    const result = await checkMp4Support(720)

    expect(result).toEqual({ supported: true, codec: 'avc' })
    expect(mediabunny.getFirstEncodableVideoCodec).toHaveBeenCalledWith(['avc'], { width: 720, height: 720 })
  })

  it('reports unsupported with a reason when no codec is encodable', async () => {
    vi.stubGlobal('VideoEncoder', class {})
    vi.mocked(mediabunny.getFirstEncodableVideoCodec).mockResolvedValue(null)

    const result = await checkMp4Support(720)

    expect(result).toEqual({ supported: false, reason: 'No encodable video codec for MP4 at this size' })
  })

  it('reports unsupported with the error message when mediabunny throws', async () => {
    vi.stubGlobal('VideoEncoder', class {})
    vi.mocked(mediabunny.getFirstEncodableVideoCodec).mockRejectedValue(new Error('boom'))

    const result = await checkMp4Support(720)

    expect(result).toEqual({ supported: false, reason: 'boom' })
  })
})
