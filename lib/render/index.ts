/**
 * The render contract. CLAUDE.md §6: pure, deterministic, fixed output pixels, fonts always
 * awaited before the first fillText. This file is the only place other code should import from
 * lib/render — artboards and primitives are implementation detail behind render(spec).
 */
import { ARTBOARD } from './tokens'
import type { Ctx2D } from './primitives'
import { drawPfp, type PfpSpec } from './artboards/pfp'

export type CardSpec = PfpSpec

export interface RenderResult {
  blob: Blob
  dataUrl: string
}

type DrawFn<S extends CardSpec> = (ctx: Ctx2D, spec: S) => void

const DRAW: { [K in CardSpec['format']]: DrawFn<Extract<CardSpec, { format: K }>> } = {
  pfp: drawPfp,
}

export async function render(spec: CardSpec): Promise<RenderResult> {
  await document.fonts.ready

  const { w, h } = ARTBOARD[spec.format]
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d') as Ctx2D | null
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.textBaseline = 'alphabetic'
  DRAW[spec.format](ctx, spec)

  const blob = await canvasToBlob(canvas)
  return { blob, dataUrl: URL.createObjectURL(blob) }
}

function createCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas
}

function canvasToBlob(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' })
  }
  return new Promise((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob returned null'))
    }, 'image/png')
  })
}
