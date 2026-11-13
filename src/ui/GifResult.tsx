import styles from './GifResult.module.css'

interface GifResultProps {
  url: string
  byteLength: number
  fps: number
  size: number
  maxColors: number
  adjustments: string[]
  onPlayAgain: () => void
  onMakeAnother: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function GifResult({ url, byteLength, fps, size, maxColors, adjustments, onPlayAgain, onMakeAnother }: GifResultProps) {
  return (
    <div className={styles.result}>
      <img src={url} alt="Your fortune cookie GIF" className={styles.gif} />
      <p className={styles.meta}>
        {formatBytes(byteLength)} · {fps}fps · {size}×{size}px · {maxColors} colors
      </p>
      {adjustments.length > 0 && (
        <ul className={styles.adjustments}>
          {adjustments.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className={styles.secondary} onClick={onMakeAnother}>
          Make another
        </button>
      </div>
    </div>
  )
}
