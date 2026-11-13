import { useState } from 'react'
import { shareOrDownloadGif } from '../export'
import styles from './GifResult.module.css'

interface GifResultProps {
  url: string
  blob: Blob
  message: string
  byteLength: number
  fps: number
  size: number
  maxColors: number
  adjustments: string[]
  showCustomPaperNotice: boolean
  onPlayAgain: () => void
  onMakeAnother: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function GifResult({
  url,
  blob,
  message,
  byteLength,
  fps,
  size,
  maxColors,
  adjustments,
  showCustomPaperNotice,
  onPlayAgain,
  onMakeAnother,
}: GifResultProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleShare() {
    setShareError(false)
    setIsSharing(true)
    // No await before this call — shareOrDownloadGif builds the File and checks canShare
    // synchronously so the click's user-activation gesture is still attached when it calls
    // navigator.share().
    void shareOrDownloadGif(blob)
      .catch(() => setShareError(true))
      .finally(() => setIsSharing(false))
  }

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) return
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard denial/failure is non-fatal — leave the button as-is.
    }
  }

  return (
    <div className={styles.result}>
      <img src={url} alt="Your fortune cookie GIF" className={styles.gif} />
      <button type="button" className={styles.primary} disabled={isSharing} onClick={handleShare}>
        Share GIF
      </button>
      {shareError && <p className={styles.error}>Couldn't share — try again.</p>}
      <p className={styles.meta}>
        {formatBytes(byteLength)} · {fps}fps · {size}×{size}px · {maxColors} colors
      </p>
      {showCustomPaperNotice && (
        <p className={styles.notice}>
          This GIF is {formatBytes(byteLength)} — photos you add often have more fine detail than
          the built-in papers, which can push size closer to the 1 MB limit.
        </p>
      )}
      {adjustments.length > 0 && (
        <ul className={styles.adjustments}>
          {adjustments.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy message text'}
        </button>
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
