import { useEffect, useReducer, useState } from 'react'
import type { Config } from '../scene'
import { ColorSwatchGroup } from './ColorSwatchGroup'
import {
  composerReducer,
  INK_COLORS,
  SLIP_COLORS,
  type ComposerAction,
  type ComposerState,
} from './composerState'
import { initComposerState, saveComposerSettings } from './composerStorage'
import { MessageInput } from './MessageInput'
import { PaperPicker } from './PaperPicker'
import styles from './Composer.module.css'
import { Preview } from './Preview'
import { usePaperImage } from './usePaperImage'

export { composerReducer, type ComposerAction, type ComposerState }

const CANVAS_SIZE = 480
const BACKGROUND = '#f2e8d4'
const FONT_FAMILY = "Georgia, 'Times New Roman', serif"
const DEBOUNCE_MS = 150

export function Composer() {
  const [state, dispatch] = useReducer(composerReducer, undefined, initComposerState)
  const [isMessageFocused, setIsMessageFocused] = useState(false)
  const paperImage = usePaperImage(state.paperId)
  const [previewConfig, setPreviewConfig] = useState<Config | null>(null)

  useEffect(() => {
    if (!paperImage) return
    const timer = setTimeout(() => {
      setPreviewConfig({
        message: state.message,
        paper: paperImage,
        slipColor: state.slipColor,
        inkColor: state.inkColor,
        fontFamily: FONT_FAMILY,
        background: BACKGROUND,
      })
      saveComposerSettings(state)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state, paperImage])

  return (
    <div className={styles.composer}>
      <div className={`${styles.previewWrap} ${isMessageFocused ? styles.compact : ''}`}>
        <Preview config={previewConfig} size={CANVAS_SIZE} initialT={1} showEndKey={state} />
      </div>

      <MessageInput
        message={state.message}
        onChange={(message) => dispatch({ type: 'message/set', message })}
        onFocus={() => setIsMessageFocused(true)}
        onBlur={() => setIsMessageFocused(false)}
      />

      <PaperPicker
        selectedId={state.paperId}
        onSelect={(paperId) => dispatch({ type: 'paper/select', paperId })}
      />

      <ColorSwatchGroup
        legend="Slip color"
        variant="slip"
        options={SLIP_COLORS}
        selectedHex={state.slipColor}
        onSelect={(color) => dispatch({ type: 'slipColor/select', color })}
      />

      <ColorSwatchGroup
        legend="Ink color"
        variant="ink"
        options={INK_COLORS}
        selectedHex={state.inkColor}
        onSelect={(color) => dispatch({ type: 'inkColor/select', color })}
      />

      <button type="button" className={styles.cta} disabled>
        Create GIF
      </button>
    </div>
  )
}
