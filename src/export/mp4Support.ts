export interface Mp4SupportResult {
  supported: boolean
  codec?: string
  reason?: string
}

/**
 * Decides up front whether an MP4 can be built at all, before spending any time encoding. Bails
 * out before importing mediabunny if VideoEncoder plainly doesn't exist, so that chunk is never
 * fetched for browsers that have no chance of using it.
 */
export async function checkMp4Support(size: number): Promise<Mp4SupportResult> {
  if (typeof VideoEncoder === 'undefined') {
    return { supported: false, reason: 'VideoEncoder not available' }
  }

  try {
    const { Mp4OutputFormat, getFirstEncodableVideoCodec } = await import('mediabunny')
    const candidates = new Mp4OutputFormat().getSupportedVideoCodecs()
    const codec = await getFirstEncodableVideoCodec(candidates, { width: size, height: size })
    if (!codec) {
      return { supported: false, reason: 'No encodable video codec for MP4 at this size' }
    }
    return { supported: true, codec }
  } catch (err) {
    return { supported: false, reason: err instanceof Error ? err.message : 'Unknown MP4 support error' }
  }
}
