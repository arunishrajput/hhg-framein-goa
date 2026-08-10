/**
 * ImageBitmap -> focal point. docs/04 §2, CLAUDE.md §10.
 *
 * Preferred path is an on-device face detector; it is lazy, speculatively warmed, and raced
 * against a hard timeout. This never surfaces success or failure to the user — see docs/02 §7.
 * If the model never loads at all (CDN blocked, WASM unsupported, anything), every call below
 * resolves to the fallback. That's the whole point: unplug the model and the product still works.
 */
import type { Focal } from '../render/primitives'

const TIMEOUT_MS = 800
const UPWARD_BIAS = 0.12 // × box height — a face at 45% height reads as a portrait, not a mugshot

/** Rule-of-thirds fallback. Right far more often than dead centre for photos of people. */
export const FALLBACK_FOCAL: Focal = { x: 0.5, y: 0.38 }

export interface FaceBox {
  originX: number
  originY: number
  width: number
  height: number
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * area × centrality — a big face at the edge loses to a slightly smaller one in the middle.
 * Both terms are normalised 0–1 so the product is comparable across boxes and images.
 */
export function scoreFace(box: FaceBox, imageWidth: number, imageHeight: number): number {
  const area = (box.width * box.height) / (imageWidth * imageHeight)

  const centerX = (box.originX + box.width / 2) / imageWidth
  const centerY = (box.originY + box.height / 2) / imageHeight
  const dist = Math.hypot(centerX - 0.5, centerY - 0.5)
  const maxDist = Math.hypot(0.5, 0.5)
  const centrality = 1 - dist / maxDist

  return area * centrality
}

/** Largest × central score wins; exact ties break deterministically toward the leftmost box. */
export function pickBestFace(boxes: FaceBox[], imageWidth: number, imageHeight: number): FaceBox {
  let best = boxes[0]
  let bestScore = scoreFace(best, imageWidth, imageHeight)

  for (let i = 1; i < boxes.length; i++) {
    const box = boxes[i]
    const score = scoreFace(box, imageWidth, imageHeight)
    if (score > bestScore || (score === bestScore && box.originX < best.originX)) {
      best = box
      bestScore = score
    }
  }

  return best
}

export function focalFromBox(box: FaceBox, imageWidth: number, imageHeight: number): Focal {
  const x = (box.originX + box.width / 2) / imageWidth
  const y = (box.originY + box.height / 2) / imageHeight - (UPWARD_BIAS * box.height) / imageHeight
  return { x: clamp01(x), y: clamp01(y) }
}

// -- model loading: lazy, singleton, speculative --------------------------------------------

interface Detector {
  detect(image: ImageBitmap): { detections: Array<{ boundingBox?: FaceBox }> }
}

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

let detectorPromise: Promise<Detector | null> | null = null

function loadDetector(): Promise<Detector | null> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
        return await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'IMAGE',
        })
      } catch {
        return null
      }
    })()
  }
  return detectorPromise
}

/**
 * Kick off the model fetch speculatively — call once, as soon as the drop zone mounts. Returns
 * the load promise so a caller *can* await steady-state (dev tooling only — production fires this
 * and moves on, exactly as speculative warming implies).
 */
export function warmAutoframe(): Promise<void> {
  return loadDetector().then(() => undefined)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

async function detectFocal(bitmap: ImageBitmap): Promise<Focal | null> {
  const detector = await loadDetector()
  if (!detector) return null

  const boxes = detector
    .detect(bitmap)
    .detections.map((d) => d.boundingBox)
    .filter((box): box is FaceBox => box != null)

  if (boxes.length === 0) return null
  return focalFromBox(pickBestFace(boxes, bitmap.width, bitmap.height), bitmap.width, bitmap.height)
}

/** Never throws, never surfaces state either way. Always resolves within ~TIMEOUT_MS. */
export async function autoframe(bitmap: ImageBitmap): Promise<Focal> {
  try {
    const focal = await withTimeout(detectFocal(bitmap), TIMEOUT_MS)
    return focal ?? FALLBACK_FOCAL
  } catch {
    return FALLBACK_FOCAL
  }
}
