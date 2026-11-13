import { PAPER_MANIFEST } from '../papers'
import {
  INITIAL_STATE,
  INK_COLORS,
  MESSAGE_MAX_LENGTH,
  SLIP_COLORS,
  type ComposerState,
} from './composerState'

const STORAGE_KEY = 'cookie-composer:settings:v1'

export function loadComposerSettings(): Partial<ComposerState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>

    const result: Partial<ComposerState> = {}
    if (typeof parsed.message === 'string') {
      result.message = parsed.message.slice(0, MESSAGE_MAX_LENGTH)
    }
    if (typeof parsed.paperId === 'string' && PAPER_MANIFEST.some((p) => p.id === parsed.paperId)) {
      result.paperId = parsed.paperId
    }
    if (typeof parsed.slipColor === 'string' && SLIP_COLORS.some((c) => c.hex === parsed.slipColor)) {
      result.slipColor = parsed.slipColor
    }
    if (typeof parsed.inkColor === 'string' && INK_COLORS.some((c) => c.hex === parsed.inkColor)) {
      result.inkColor = parsed.inkColor
    }
    return result
  } catch {
    return null
  }
}

export function saveComposerSettings(state: ComposerState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private browsing, quota exceeded, or storage disabled — losing persistence is acceptable.
  }
}

/** useReducer lazy initializer: hydrates synchronously so there's no flash of defaults and no
 * window where a debounced save could overwrite real saved settings. */
export function initComposerState(): ComposerState {
  return { ...INITIAL_STATE, ...(loadComposerSettings() ?? {}) }
}
