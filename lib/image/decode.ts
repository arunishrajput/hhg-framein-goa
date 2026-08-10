/**
 * File -> ImageBitmap. docs/04 §2, CLAUDE.md §10.
 *
 * Never trust `file.type` — HEIC dropped from the iOS Files app frequently arrives with an empty
 * MIME type, so branching is done from the container's own magic bytes instead.
 */

const MAX_DIMENSION = 2048

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])

/** User-facing copy — voice per docs/02 §7. Never surface the raw exception underneath these. */
export const DECODE_ERROR = {
  empty: 'That file is empty.',
  unreadable: "That file didn't decode. Try a JPG or PNG.",
} as const

export class DecodeError extends Error {}

function bytesToAscii(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += String.fromCharCode(byte)
  return out
}

/**
 * ISO base media file format signature: bytes 4–8 are the literal string "ftyp", bytes 8–12 are
 * the major brand. HEIC/HEIF containers use one of a handful of brands — pure and sync so it's
 * testable without touching the Blob/File APIs at all.
 */
export function sniffHeicBrand(header: Uint8Array): boolean {
  if (header.length < 12) return false
  if (bytesToAscii(header.subarray(4, 8)) !== 'ftyp') return false
  const brand = bytesToAscii(header.subarray(8, 12)).replace(/\0/g, '').trim()
  return HEIC_BRANDS.has(brand)
}

async function readHeader(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(0, 12).arrayBuffer())
}

async function toBitmap(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: 'from-image' })
  } catch {
    throw new DecodeError(DECODE_ERROR.unreadable)
  }
}

async function downscale(bitmap: ImageBitmap): Promise<ImageBitmap> {
  const longEdge = Math.max(bitmap.width, bitmap.height)
  if (longEdge <= MAX_DIMENSION) return bitmap

  const scale = MAX_DIMENSION / longEdge
  const resized = await createImageBitmap(bitmap, {
    resizeWidth: Math.round(bitmap.width * scale),
    resizeHeight: Math.round(bitmap.height * scale),
    resizeQuality: 'high',
  })
  bitmap.close()
  return resized
}

export interface DecodeOptions {
  /** Fired the instant the HEIC branch is entered, before the (slower) conversion starts. */
  onHeicDetected?: () => void
}

/**
 * Decodes any user-dropped photo into an orientation-correct, ≤2048px-long-edge ImageBitmap.
 * HEIC goes through a JPEG conversion step first so the rest of the pipeline never special-cases
 * the format again.
 */
export async function decodeImage(file: Blob, opts: DecodeOptions = {}): Promise<ImageBitmap> {
  if (file.size === 0) {
    throw new DecodeError(DECODE_ERROR.empty)
  }

  let source: Blob = file
  const header = await readHeader(file)
  if (sniffHeicBrand(header)) {
    opts.onHeicDetected?.()
    try {
      const { heicTo } = await import('heic-to/next')
      source = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
    } catch {
      throw new DecodeError(DECODE_ERROR.unreadable)
    }
  }

  const bitmap = await toBitmap(source)
  return downscale(bitmap)
}
