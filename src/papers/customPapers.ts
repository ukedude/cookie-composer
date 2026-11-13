import { createStore, del, get, set, values } from 'idb-keyval'
import { makeCustomPaperId } from './customPaperId'

export interface CustomPaper {
  id: string
  name: string
  blob: Blob
  createdAt: number
}

export const CUSTOM_PAPER_WARN_THRESHOLD = 30

const customPapersStore = createStore('cookie-composer-papers-db', 'custom-papers')

export async function listCustomPapers(): Promise<CustomPaper[]> {
  const papers = await values<CustomPaper>(customPapersStore)
  return papers.sort((a, b) => a.createdAt - b.createdAt)
}

export async function getCustomPaper(id: string): Promise<CustomPaper | undefined> {
  return get<CustomPaper>(id, customPapersStore)
}

export async function saveCustomPaper(blob: Blob, name?: string): Promise<CustomPaper> {
  const existing = await listCustomPapers()
  const paper: CustomPaper = {
    id: makeCustomPaperId(),
    name: name ?? `My paper ${existing.length + 1}`,
    blob,
    createdAt: Date.now(),
  }
  await set(paper.id, paper, customPapersStore)
  // Only on the very first custom paper this device has ever stored — correct across reloads
  // since it's derived from the real count, not a separate "have we asked" flag.
  if (existing.length === 0) {
    void navigator.storage?.persist?.()
  }
  return paper
}

export async function deleteCustomPaper(id: string): Promise<void> {
  await del(id, customPapersStore)
}

export function shouldWarnAboutStorage(count: number): boolean {
  return count > CUSTOM_PAPER_WARN_THRESHOLD
}
