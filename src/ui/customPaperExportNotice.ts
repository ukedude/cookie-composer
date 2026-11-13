const STORAGE_KEY = 'custom-paper-export-notice-shown:v1'

function readShownIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function hasShownExportNotice(paperId: string): boolean {
  return readShownIds().includes(paperId)
}

export function markExportNoticeShown(paperId: string): void {
  try {
    const ids = readShownIds()
    if (ids.includes(paperId)) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, paperId]))
  } catch {
    // Private browsing, quota exceeded, or storage disabled — the notice may just reappear.
  }
}
