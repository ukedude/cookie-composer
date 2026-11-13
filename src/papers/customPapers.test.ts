import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createStore: vi.fn(() => 'store-token'),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  values: vi.fn(),
}))

vi.mock('idb-keyval', () => mocks)

import {
  CUSTOM_PAPER_WARN_THRESHOLD,
  deleteCustomPaper,
  getCustomPaper,
  listCustomPapers,
  saveCustomPaper,
  shouldWarnAboutStorage,
} from './customPapers'

function makePaper(id: string, createdAt: number) {
  return { id, name: id, blob: new Blob(['x']), createdAt }
}

describe('customPapers', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.set.mockReset().mockResolvedValue(undefined)
    mocks.del.mockReset().mockResolvedValue(undefined)
    mocks.values.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listCustomPapers sorts ascending by createdAt', async () => {
    mocks.values.mockResolvedValue([makePaper('b', 200), makePaper('a', 100)])
    const result = await listCustomPapers()
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('getCustomPaper delegates to idb-keyval get', async () => {
    mocks.get.mockResolvedValue(makePaper('a', 100))
    const result = await getCustomPaper('a')
    expect(result?.id).toBe('a')
    expect(mocks.get).toHaveBeenCalledWith('a', 'store-token')
  })

  it('saveCustomPaper writes a well-formed CustomPaper and names it sequentially', async () => {
    mocks.values.mockResolvedValue([makePaper('a', 100)])
    const blob = new Blob(['photo'])
    const saved = await saveCustomPaper(blob)
    expect(saved.name).toBe('My paper 2')
    expect(saved.blob).toBe(blob)
    expect(mocks.set).toHaveBeenCalledWith(saved.id, saved, 'store-token')
  })

  it('calls navigator.storage.persist only when this is the first custom paper', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', { storage: { persist } })

    mocks.values.mockResolvedValue([])
    await saveCustomPaper(new Blob(['photo']))
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('does not call navigator.storage.persist when custom papers already exist', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', { storage: { persist } })

    mocks.values.mockResolvedValue([makePaper('a', 100)])
    await saveCustomPaper(new Blob(['photo']))
    expect(persist).not.toHaveBeenCalled()
  })

  it('deleteCustomPaper delegates to idb-keyval del', async () => {
    await deleteCustomPaper('a')
    expect(mocks.del).toHaveBeenCalledWith('a', 'store-token')
  })

  it('shouldWarnAboutStorage is false at the threshold and true just beyond it', () => {
    expect(shouldWarnAboutStorage(CUSTOM_PAPER_WARN_THRESHOLD)).toBe(false)
    expect(shouldWarnAboutStorage(CUSTOM_PAPER_WARN_THRESHOLD + 1)).toBe(true)
  })
})
