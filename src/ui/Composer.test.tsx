import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PAPER_ID } from '../papers'
import { composerReducer, type ComposerState } from './Composer'
import { INITIAL_STATE } from './composerState'
import { initComposerState, loadComposerSettings, saveComposerSettings } from './composerStorage'

const STORAGE_KEY = 'cookie-composer:settings:v1'

describe('composerReducer', () => {
  it('clamps the message to 80 characters', () => {
    const longMessage = 'x'.repeat(100)
    const next = composerReducer(INITIAL_STATE, { type: 'message/set', message: longMessage })
    expect(next.message).toHaveLength(80)
  })

  it('updates paperId on paper/select', () => {
    const next = composerReducer(INITIAL_STATE, { type: 'paper/select', paperId: 'sample-2' })
    expect(next.paperId).toBe('sample-2')
  })

  it('updates slipColor on slipColor/select', () => {
    const next = composerReducer(INITIAL_STATE, { type: 'slipColor/select', color: '#C9A876' })
    expect(next.slipColor).toBe('#C9A876')
  })

  it('updates inkColor on inkColor/select', () => {
    const next = composerReducer(INITIAL_STATE, { type: 'inkColor/select', color: '#7A1E1E' })
    expect(next.inkColor).toBe('#7A1E1E')
  })

  it('leaves other fields untouched', () => {
    const next = composerReducer(INITIAL_STATE, { type: 'message/set', message: 'hi' })
    expect(next.paperId).toBe(INITIAL_STATE.paperId)
    expect(next.slipColor).toBe(INITIAL_STATE.slipColor)
    expect(next.inkColor).toBe(INITIAL_STATE.inkColor)
  })
})

describe('composerStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  afterEach(() => {
    window.localStorage.clear()
  })

  it('round-trips a saved state', () => {
    const state: ComposerState = {
      message: 'Be kind to yourself.',
      paperId: 'sample-2',
      slipColor: '#DCE8F6',
      inkColor: '#7A1E1E',
    }
    saveComposerSettings(state)
    expect(loadComposerSettings()).toEqual(state)
  })

  it('returns null for corrupt JSON instead of throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json')
    expect(loadComposerSettings()).toBeNull()
  })

  it('returns null when nothing is saved yet', () => {
    expect(loadComposerSettings()).toBeNull()
  })

  it('drops an unrecognized paperId or color instead of accepting it', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ message: 'hi', paperId: 'unknown', slipColor: '#000000', inkColor: '#7A1E1E' }),
    )
    const result = loadComposerSettings()
    expect(result).toEqual({ message: 'hi', inkColor: '#7A1E1E' })
  })

  it('keeps a custom: prefixed paperId instead of dropping it', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ message: 'hi', paperId: 'custom:abc123' }),
    )
    const result = loadComposerSettings()
    expect(result).toEqual({ message: 'hi', paperId: 'custom:abc123' })
  })

  it('initComposerState falls back to defaults with nothing saved', () => {
    expect(initComposerState()).toEqual({ ...INITIAL_STATE, paperId: DEFAULT_PAPER_ID })
  })

  it('initComposerState merges saved fields over defaults', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ message: 'Saved message' }))
    expect(initComposerState()).toEqual({ ...INITIAL_STATE, message: 'Saved message' })
  })
})
