import { DEFAULT_PAPER_ID } from '../papers'

export const MESSAGE_MAX_LENGTH = 80

export interface ColorOption {
  id: string
  label: string
  hex: string
}

export const SLIP_COLORS: ColorOption[] = [
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'pale-pink', label: 'Pale pink', hex: '#F6DDE2' },
  { id: 'pale-blue', label: 'Pale blue', hex: '#DCE8F6' },
  { id: 'pale-yellow', label: 'Pale yellow', hex: '#F8F0D0' },
  { id: 'kraft', label: 'Kraft', hex: '#C9A876' },
]

export const INK_COLORS: ColorOption[] = [
  { id: 'charcoal', label: 'Charcoal', hex: '#3A2E22' },
  { id: 'deep-red', label: 'Deep red', hex: '#7A1E1E' },
]

export const DEFAULT_SLIP_COLOR = SLIP_COLORS[0].hex
export const DEFAULT_INK_COLOR = INK_COLORS[0].hex

export interface ComposerState {
  message: string
  paperId: string
  slipColor: string
  inkColor: string
}

export const INITIAL_STATE: ComposerState = {
  message: '',
  paperId: DEFAULT_PAPER_ID,
  slipColor: DEFAULT_SLIP_COLOR,
  inkColor: DEFAULT_INK_COLOR,
}

export type ComposerAction =
  | { type: 'message/set'; message: string }
  | { type: 'paper/select'; paperId: string }
  | { type: 'slipColor/select'; color: string }
  | { type: 'inkColor/select'; color: string }

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'message/set':
      return { ...state, message: action.message.slice(0, MESSAGE_MAX_LENGTH) }
    case 'paper/select':
      return { ...state, paperId: action.paperId }
    case 'slipColor/select':
      return { ...state, slipColor: action.color }
    case 'inkColor/select':
      return { ...state, inkColor: action.color }
  }
}
