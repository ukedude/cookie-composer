import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hasShownExportNotice, markExportNoticeShown } from './customPaperExportNotice'

describe('customPaperExportNotice', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('is false before anything has been marked', () => {
    expect(hasShownExportNotice('custom:a')).toBe(false)
  })

  it('becomes true after marking', () => {
    markExportNoticeShown('custom:a')
    expect(hasShownExportNotice('custom:a')).toBe(true)
  })

  it('tracks ids independently', () => {
    markExportNoticeShown('custom:a')
    expect(hasShownExportNotice('custom:b')).toBe(false)
  })

  it('does not throw for corrupt JSON and treats it as unshown', () => {
    window.localStorage.setItem('custom-paper-export-notice-shown:v1', 'not json')
    expect(hasShownExportNotice('custom:a')).toBe(false)
  })
})
