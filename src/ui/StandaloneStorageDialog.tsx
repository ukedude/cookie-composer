import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './StandaloneStorageDialog.module.css'

const DISMISSED_KEY = 'standalone-storage-dialog-dismissed'

export function readStandaloneDialogDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeStandaloneDialogDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Storage disabled (e.g. private browsing) — the dialog may just reappear next time.
  }
}

interface StandaloneStorageDialogProps {
  onCancel: () => void
  onContinue: () => void
}

export function StandaloneStorageDialog({ onCancel, onContinue }: StandaloneStorageDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  function handleContinue() {
    if (dontShowAgain) writeStandaloneDialogDismissed()
    onContinue()
  }

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Paper storage notice">
        <p className={styles.text}>
          Papers you add here are saved in this browser only. To keep them in your home-screen
          app, add them from there.
        </p>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don&rsquo;t show this again
        </label>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.primary} onClick={handleContinue}>
            Continue anyway
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
