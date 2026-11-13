// Bundled papers, upload + crop, and IndexedDB storage live here.
export { PAPER_MANIFEST, DEFAULT_PAPER_ID, type PaperManifestEntry } from './manifest'
export { flipImageVertically, loadPaperImage } from './loadImage'
export { AUTO_CORRECT_FILTER, supportsCanvasFilter } from './autoCorrect'
export { CUSTOM_ID_PREFIX, isCustomPaperId, makeCustomPaperId } from './customPaperId'
export {
  CUSTOM_PAPER_WARN_THRESHOLD,
  deleteCustomPaper,
  getCustomPaper,
  listCustomPapers,
  saveCustomPaper,
  shouldWarnAboutStorage,
  type CustomPaper,
} from './customPapers'
export {
  CROP_JPEG_QUALITY,
  CROP_OUTPUT_SIZE,
  clampPan,
  clampZoom,
  computeDownscaledSize,
  computeSourceRect,
  decodeWorkingBitmap,
  exportCroppedJpeg,
  MAX_ZOOM,
  MIN_ZOOM,
  type CropCenter,
} from './crop'
