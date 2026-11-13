export interface PaperManifestEntry {
  id: string
  name: string
  path: string
  /** The fold1 hinge (see geometry.flapScale) mirrors whichever flap folds over the other —
   * invisible for symmetric patterns, but upside-down for directional artwork like this one.
   * Flipping the decoded bitmap once here cancels that mirror for the dominant flap, without
   * touching the shared fold geometry or any other paper. The thumbnail still reads from `path`
   * directly, so the picker swatch stays right-side up. */
  flipY?: boolean
}

export const PAPER_MANIFEST: PaperManifestEntry[] = [
  { id: 'sample-1', name: 'Terracotta dot', path: 'papers/sample-1.png' },
  { id: 'sample-2', name: 'Sage stripe', path: 'papers/sample-2.png' },
  { id: 'alpacas', name: 'Alpacas', path: 'papers/alpacas.jpg', flipY: true },
]

export const DEFAULT_PAPER_ID = PAPER_MANIFEST[0].id
