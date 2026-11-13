import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Config } from '../scene'
import { exportGif, type ExportPhase } from '../export'
import { ColorSwatchGroup } from './ColorSwatchGroup'
import {
  composerReducer,
  INK_COLORS,
  SLIP_COLORS,
  type ComposerAction,
  type ComposerState,
} from './composerState'
import { initComposerState, saveComposerSettings } from './composerStorage'
import { GifResult } from './GifResult'
import { InstallHint } from './InstallHint'
import { MessageInput } from './MessageInput'
import { PaperPicker } from './PaperPicker'
import { ProgressBar } from './ProgressBar'
import { UpdateBanner } from './UpdateBanner'
import styles from './Composer.module.css'
import { Preview } from './Preview'
import { usePaperImage } from './usePaperImage'

export { composerReducer, type ComposerAction, type ComposerState }

const CANVAS_SIZE = 480
const BACKGROUND = '#f2e8d4'
const FONT_FAMILY = "Georgia, 'Times New Roman', serif"
const DEBOUNCE_MS = 150

type ExportStatus = 'idle' | 'done' | 'error' | ExportPhase

interface CompletedExport {
  blob: Blob
  url: string
  byteLength: number
  fps: number
  size: number
  maxColors: number
  adjustments: string[]
}

function toProgressProps(phase: ExportPhase): { label: string; value?: number; max?: number } {
  switch (phase.phase) {
    case 'preparing':
      return { label: 'Preparing…' }
    case 'capturing':
      return { label: 'Capturing frames…' }
    case 'encoding':
      return { label: 'Encoding…', value: phase.frameIndex, max: phase.totalFrames }
    case 'retrying':
      return { label: phase.reason || 'Retrying at a smaller size…' }
  }
}

export function Composer() {
  const [state, dispatch] = useReducer(composerReducer, undefined, initComposerState)
  const [isMessageFocused, setIsMessageFocused] = useState(false)
  const paperImage = usePaperImage(state.paperId)
  const [previewConfig, setPreviewConfig] = useState<Config | null>(null)

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [exportResult, setExportResult] = useState<CompletedExport | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const exportUrlRef = useRef<string | null>(null)
  const isExporting = typeof exportStatus === 'object'

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

  useEffect(() => {
    return () => {
      if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current)
    }
  }, [])

  const handleCreateGif = useCallback(async () => {
    if (!previewConfig) return
    setExportError(null)
    setExportStatus({ phase: 'preparing' })
    try {
      // Capture from previewConfig, not state — it's the config Preview is currently showing;
      // re-deriving from state would race ahead of what the user can see.
      const result = await exportGif(previewConfig, setExportStatus)
      if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current)
      const url = URL.createObjectURL(result.blob)
      exportUrlRef.current = url
      setExportResult({
        blob: result.blob,
        url,
        byteLength: result.byteLength,
        fps: result.fps,
        size: result.size,
        maxColors: result.maxColors,
        adjustments: result.adjustments,
      })
      setExportStatus('done')
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'GIF export failed.')
      setExportStatus('error')
    }
  }, [previewConfig])

  const handlePlayAgain = useCallback(() => {
    setExportResult((current) => {
      if (!current) return current
      if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current)
      const url = URL.createObjectURL(current.blob)
      exportUrlRef.current = url
      return { ...current, url }
    })
  }, [])

  const handleMakeAnother = useCallback(() => {
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current)
      exportUrlRef.current = null
    }
    setExportResult(null)
    setExportError(null)
    setExportStatus('idle')
  }, [])

  const showResult = exportStatus === 'done' && exportResult !== null
  // Sticky/shrunk "compact" mode is only for the keyboard-open case — never while a finished GIF
  // is showing in the same slot, so nothing stays pinned or overlaps once a result is up.
  const isCompact = isMessageFocused && !showResult

  return (
    <div className={styles.composer}>
      <UpdateBanner />
      <InstallHint />
      <div className={`${styles.previewWrap} ${isCompact ? styles.compact : ''}`}>
        {showResult && exportResult ? (
          <GifResult
            url={exportResult.url}
            blob={exportResult.blob}
            message={state.message}
            byteLength={exportResult.byteLength}
            fps={exportResult.fps}
            size={exportResult.size}
            maxColors={exportResult.maxColors}
            adjustments={exportResult.adjustments}
            onPlayAgain={handlePlayAgain}
            onMakeAnother={handleMakeAnother}
          />
        ) : (
          <Preview config={previewConfig} size={CANVAS_SIZE} initialT={1} showEndKey={state} />
        )}
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

      <button
        type="button"
        className={styles.cta}
        disabled={!previewConfig || isExporting}
        onClick={handleCreateGif}
      >
        Create GIF
      </button>

      {typeof exportStatus === 'object' && <ProgressBar {...toProgressProps(exportStatus)} />}

      {exportStatus === 'error' && exportError && <p className={styles.error}>{exportError}</p>}
    </div>
  )
}
