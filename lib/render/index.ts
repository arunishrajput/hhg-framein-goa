/**
 * The render contract. CLAUDE.md §6: pure, deterministic, fixed output pixels, fonts always
 * awaited before the first fillText. This file is the only place other code should import from
 * lib/render — artboards and primitives are implementation detail behind render(spec).
 */
import { ARTBOARD } from './tokens'
import type { Ctx2D } from './primitives'
import { drawPfp, type PfpSpec } from './artboards/pfp'
import { drawBuilderId, type BuilderIdSpec } from './artboards/builderId'
import { drawCrew, type CrewSpec } from './artboards/crew'

export type CardSpec = PfpSpec | BuilderIdSpec | CrewSpec
export type { PfpSpec, BuilderIdSpec, CrewSpec }
export type { CrewMember } from './artboards/crew'

export interface RenderResult {
  blob: Blob
  dataUrl: string
}

// A record of DrawFns keyed by format can't be called generically here — TypeScript widens
// `DRAW[spec.format]` to a union of function types, and calling a union of functions requires
// `spec` to satisfy the intersection of their parameter types, which collapses to `never` once
// the variants' non-discriminant fields diverge. A switch lets each case narrow `spec` on its own.
function draw(ctx: Ctx2D, spec: CardSpec): void {
  switch (spec.format) {
    case 'pfp':
      return drawPfp(ctx, spec)
    case 'id':
      return drawBuilderId(ctx, spec)
    case 'crew':
      return drawCrew(ctx, spec)
  }
}

export async function render(spec: CardSpec): Promise<RenderResult> {
  await document.fonts.ready

  const { w, h } = ARTBOARD[spec.format]
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d') as Ctx2D | null
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.textBaseline = 'alphabetic'
  draw(ctx, spec)

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
