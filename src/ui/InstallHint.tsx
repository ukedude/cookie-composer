import { useState } from 'react'
import { detectIosBrowser, isStandalone } from '../platform/detectPlatform'
import styles from './InstallHint.module.css'

const DISMISSED_KEY = 'install-hint-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Storage disabled (e.g. private browsing) — the note may just reappear next visit.
  }
}

const COPY: Record<'safari' | 'chrome', string> = {
  safari: "Install Cookie Composer: tap the Share icon, then “Add to Home Screen.”",
  chrome:
    "Install Cookie Composer: tap the Share icon in the address bar, then “Add to Home Screen.”",
}

export function InstallHint() {
  const [dismissed, setDismissed] = useState(readDismissed)
  const [browser] = useState(detectIosBrowser)
  const [standalone] = useState(isStandalone)

  if (dismissed || standalone || browser === null || browser === 'other-ios') return null

  return (
    <div className={styles.hint}>
      <p className={styles.text}>{COPY[browser]}</p>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss"
        onClick={() => {
          writeDismissed()
          setDismissed(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
