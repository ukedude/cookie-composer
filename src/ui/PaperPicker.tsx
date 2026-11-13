import { useEffect, useRef, useState } from 'react'
import { isStandalone } from '../platform/detectPlatform'
import {
  deleteCustomPaper,
  DEFAULT_PAPER_ID,
  listCustomPapers,
  PAPER_MANIFEST,
  saveCustomPaper,
  shouldWarnAboutStorage,
  type CustomPaper,
  type PaperManifestEntry,
} from '../papers'
import { PaperCropper } from './PaperCropper'
import { readStandaloneDialogDismissed, StandaloneStorageDialog } from './StandaloneStorageDialog'
import styles from './PaperPicker.module.css'

interface PaperPickerProps {
  papers?: PaperManifestEntry[]
  selectedId: string
  onSelect: (id: string) => void
}

export function PaperPicker({ papers = PAPER_MANIFEST, selectedId, onSelect }: PaperPickerProps) {
  const [customPapers, setCustomPapers] = useState<CustomPaper[]>([])
  const [editMode, setEditMode] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showStorageDialog, setShowStorageDialog] = useState(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const thumbUrlsRef = useRef<Map<string, string>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listCustomPapers()
      .then((loaded) => {
        setCustomPapers(loaded)
        setStorageWarning(shouldWarnAboutStorage(loaded.length))
      })
      .catch(() => {
        // IndexedDB unavailable (e.g. strict private browsing, or no IndexedDB in this test
        // environment) — degrade to bundled-papers-only rather than leaving this unresolved.
      })
  }, [])

  // Revoke URLs for papers that are no longer in the list (post-delete). New papers get their
  // URL created lazily in getThumbUrl below, during render — not here — so a freshly added
  // paper's thumbnail is available on the very first paint instead of one render late (a ref
  // mutation alone wouldn't trigger the re-render needed to pick up a URL created after the fact).
  useEffect(() => {
    const urls = thumbUrlsRef.current
    const currentIds = new Set(customPapers.map((p) => p.id))
    for (const [id, url] of urls) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url)
        urls.delete(id)
      }
    }
  }, [customPapers])

  useEffect(() => {
    const urls = thumbUrlsRef.current
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  function getThumbUrl(paper: CustomPaper): string {
    const cached = thumbUrlsRef.current.get(paper.id)
    if (cached) return cached
    const url = URL.createObjectURL(paper.blob)
    thumbUrlsRef.current.set(paper.id, url)
    return url
  }

  function handleAddClick() {
    if (isStandalone() || readStandaloneDialogDismissed()) {
      fileInputRef.current?.click()
      return
    }
    setShowStorageDialog(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setPendingFile(file)
  }

  async function handleCropSave(blob: Blob) {
    const saved = await saveCustomPaper(blob)
    const next = [...customPapers, saved]
    setCustomPapers(next)
    setStorageWarning(shouldWarnAboutStorage(next.length))
    setPendingFile(null)
    onSelect(saved.id)
  }

  function handleDeleteTile(paper: CustomPaper) {
    if (!window.confirm(`Delete "${paper.name}"?`)) return
    void deleteCustomPaper(paper.id).then(() => {
      const next = customPapers.filter((p) => p.id !== paper.id)
      setCustomPapers(next)
      setStorageWarning(shouldWarnAboutStorage(next.length))
      if (selectedId === paper.id) onSelect(DEFAULT_PAPER_ID)
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Paper pattern</span>
        {customPapers.length > 0 && (
          <button type="button" className={styles.editToggle} onClick={() => setEditMode((v) => !v)}>
            {editMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <div className={styles.row} role="group" aria-label="Paper pattern">
        {papers.map((paper) => (
          <div key={paper.id} className={styles.tileWrap}>
            <button
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
          </div>
        ))}

        {customPapers.map((paper) => (
          <div key={paper.id} className={styles.tileWrap}>
            <button
              type="button"
              className={styles.tile}
              aria-pressed={paper.id === selectedId}
              aria-label={paper.name}
              onClick={editMode ? undefined : () => onSelect(paper.id)}
            >
              <img src={getThumbUrl(paper)} alt="" className={styles.thumb} />
            </button>
            {editMode && (
              <button
                type="button"
                className={styles.deleteBadge}
                aria-label={`Delete ${paper.name}`}
                onClick={() => handleDeleteTile(paper)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={styles.addTile}
          aria-label="Add your own paper"
          onClick={handleAddClick}
        >
          +
        </button>
      </div>

      {storageWarning && (
        <p className={styles.warning}>
          You have {customPapers.length} custom papers — consider deleting a few to save space.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showStorageDialog && (
        <StandaloneStorageDialog
          onCancel={() => setShowStorageDialog(false)}
          onContinue={() => {
            setShowStorageDialog(false)
            fileInputRef.current?.click()
          }}
        />
      )}

      {pendingFile && (
        <PaperCropper
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onSave={handleCropSave}
        />
      )}
    </div>
  )
}
