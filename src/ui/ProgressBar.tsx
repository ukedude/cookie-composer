import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  label: string
  /** Omit both value and max for an indeterminate (sliding) bar. */
  value?: number
  max?: number
}

export function ProgressBar({ label, value, max }: ProgressBarProps) {
  const determinate = value !== undefined && max !== undefined && max > 0
  const percent = determinate ? Math.min(100, Math.round((value / max) * 100)) : undefined

  return (
    <div className={styles.progressBar}>
      <div
        className={`${styles.track} ${determinate ? '' : styles.indeterminate}`}
        role="progressbar"
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuenow={determinate ? value : undefined}
        aria-valuemax={determinate ? max : undefined}
      >
        <div className={styles.fill} style={determinate ? { width: `${percent}%` } : undefined} />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
