import { PAPER_MANIFEST, type PaperManifestEntry } from '../papers'
import styles from './PaperPicker.module.css'

interface PaperPickerProps {
  papers?: PaperManifestEntry[]
  selectedId: string
  onSelect: (id: string) => void
}

export function PaperPicker({ papers = PAPER_MANIFEST, selectedId, onSelect }: PaperPickerProps) {
  return (
    <div className={styles.row} role="group" aria-label="Paper pattern">
      {papers.map((paper) => (
        <button
          key={paper.id}
          type="button"
          className={styles.tile}
          aria-pressed={paper.id === selectedId}
          aria-label={paper.name}
          onClick={() => onSelect(paper.id)}
        >
          <img
            src={`${import.meta.env.BASE_URL}${paper.path}`}
            alt=""
            className={styles.thumb}
          />
        </button>
      ))}
      <button
        type="button"
        className={styles.addTile}
        disabled
        aria-label="Add your own paper (coming soon)"
        title="Add your own paper (coming soon)"
      >
        +
      </button>
    </div>
  )
}
