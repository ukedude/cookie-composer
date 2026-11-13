export interface PaperManifestEntry {
  id: string
  name: string
  path: string
}

export const PAPER_MANIFEST: PaperManifestEntry[] = [
  { id: 'sample-1', name: 'Terracotta dot', path: 'papers/sample-1.png' },
  { id: 'sample-2', name: 'Sage stripe', path: 'papers/sample-2.png' },
  { id: 'alpacas', name: 'Alpacas', path: 'papers/alpacas.jpg' },
]

export const DEFAULT_PAPER_ID = PAPER_MANIFEST[0].id
