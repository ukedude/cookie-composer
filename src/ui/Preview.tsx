import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { drawFrame, MOTION_SECONDS, type Config } from '../scene'
import styles from './Preview.module.css'

interface PreviewProps {
  /** null while the paper image is still loading — the canvas renders regardless, just undrawn. */
  config: Config | null
  size: number
}

function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('debug') === '1'
}

/** Live preview: owns the canvas, requestAnimationFrame playback, and the scrub bar. Both this and
 * the (future) GIF exporter call the same pure drawFrame, so they always match. */
export function Preview({ config, size }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)
  const playStartTRef = useRef(0)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !config) return
    drawFrame(ctx, t, config)
  }, [t, config])

  useEffect(() => {
    if (!playing) return

    const startT = playStartTRef.current
    let startTime: number | null = null

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsedSeconds = (now - startTime) / 1000
      const next = Math.min(1, startT + elapsedSeconds / MOTION_SECONDS)
      setT(next)
      if (next >= 1) {
        setPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing])

  const handlePlay = useCallback(() => {
    setT((current) => {
      const startT = current >= 1 ? 0 : current
      playStartTRef.current = startT
      return startT
    })
    setPlaying(true)
  }, [])

  const handleScrub = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPlaying(false)
    setT(Number(event.target.value))
  }, [])

  const label = t >= 1 ? 'Replay' : 'Play'

  return (
    <div className={styles.preview}>
      <canvas ref={canvasRef} width={size} height={size} className={styles.canvas} aria-label="Cookie preview" />
      <div className={styles.controls}>
        <button type="button" onClick={handlePlay} disabled={playing}>
          {label}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={handleScrub}
          aria-label="Scrub"
          className={styles.scrub}
        />
      </div>
      {isDebugMode() && (
        <div className={styles.debug}>
          <label htmlFor="debug-t">Preview time (debug): {t.toFixed(3)}</label>
          <input
            id="debug-t"
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={t}
            onChange={handleScrub}
            aria-label="Preview time (debug)"
          />
        </div>
      )}
    </div>
  )
}
