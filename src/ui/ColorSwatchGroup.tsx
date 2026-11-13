import type { ColorOption } from './composerState'
import styles from './ColorSwatchGroup.module.css'

interface ColorSwatchGroupProps {
  legend: string
  options: ColorOption[]
  selectedHex: string
  onSelect: (hex: string) => void
  variant: 'slip' | 'ink'
}

export function ColorSwatchGroup({
  legend,
  options,
  selectedHex,
  onSelect,
  variant,
}: ColorSwatchGroupProps) {
  return (
    <div className={styles.group}>
      <span className={styles.legend}>{legend}</span>
      <div className={styles.row} role="group" aria-label={legend}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={variant === 'slip' ? styles.slipSwatch : styles.inkSwatch}
            style={{ backgroundColor: option.hex }}
            aria-pressed={option.hex === selectedHex}
            aria-label={option.label}
            onClick={() => onSelect(option.hex)}
          />
        ))}
      </div>
    </div>
  )
}
