/**
 * Canvas 2D drawing primitives shared by every artboard. Pure functions only — no state, no
 * randomness, no Date.now(). See docs/03-ARTBOARD-SPEC.md §4 for the contract each of these follows.
 */

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface Focal {
  x: number
  y: number
  /** Manual "Adjust" zoom multiplier, ≥ 1. Omitted/1 reproduces the plain cover-fit. */
  zoom?: number
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}

/** Builds a rounded-rect path. Caller fills/strokes — this never touches fillStyle. */
export function roundRect(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | [number, number, number, number],
): void {
  const [tl, tr, br, bl] =
    typeof radius === 'number' ? [radius, radius, radius, radius] : radius

  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
}

/** Clips to a circle for the duration of `draw`, then restores. */
export function clipCircle(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  r: number,
  draw: () => void,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  draw()
  ctx.restore()
}

/**
 * Cover-fit draw, centred at (cx, cy) into a w×h box, never distorting aspect ratio. `focal` is
 * normalised 0–1 in source-image space and is clamped so the drawn image still fully covers the
 * box — a focal point near an edge pulls the crop that way without ever exposing padding.
 */
export function coverDrawImage(
  ctx: Ctx2D,
  bmp: ImageBitmap,
  cx: number,
  cy: number,
  w: number,
  h: number,
  focal: Focal,
): void {
  const zoom = Math.max(1, focal.zoom ?? 1)
  const scale = Math.max(w / bmp.width, h / bmp.height) * zoom
  const scaledW = bmp.width * scale
  const scaledH = bmp.height * scale

  const maxOffsetX = Math.max(0, scaledW - w)
  const maxOffsetY = Math.max(0, scaledH - h)
  const offsetX = clamp(focal.x * scaledW - w / 2, 0, maxOffsetX)
  const offsetY = clamp(focal.y * scaledH - h / 2, 0, maxOffsetY)

  const dx = cx - w / 2 - offsetX
  const dy = cy - h / 2 - offsetY
  ctx.drawImage(bmp, dx, dy, scaledW, scaledH)
}

/** Strokes a dashed circle. `offset` phase-shifts the dash pattern (docs/03 §1: keep a dash off the pip). */
export function dashedOrbit(
  ctx: Ctx2D,
  cx: number,
  cy: number,
  r: number,
  stroke: number,
  dash: [number, number],
  color: string,
  offset = 0,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = stroke
  ctx.lineCap = 'round'
  ctx.setLineDash(dash)
  ctx.lineDashOffset = offset
  ctx.stroke()
  ctx.restore()
}

/**
 * The hand-drawn 5-frond palm, inline path only — never the emoji (docs/03 §0). `size` is the pip
 * radius; the glyph is scaled to match components/RingMark.tsx's proportions so the empty-state SVG
 * and the rendered PNG read as the same mark.
 */
const FROND_ANGLES_DEG = [-55, -27, 0, 27, 55]

export function palmGlyph(ctx: Ctx2D, cx: number, cy: number, size: number, color: string): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.16
  ctx.lineCap = 'round'

  for (const angleDeg of FROND_ANGLES_DEG) {
    const rad = (angleDeg * Math.PI) / 180
    const tipR = size * 0.62
    const baseX = 0
    const baseY = size * 0.38
    const tipX = tipR * Math.sin(rad)
    const tipY = -tipR * Math.cos(rad) + size * 0.05
    const ctrlX = tipX * 0.55
    const ctrlY = (baseY + tipY) * 0.4

    ctx.beginPath()
    ctx.moveTo(baseX, baseY)
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY)
    ctx.stroke()
  }

  ctx.restore()
}

/** Draws twice offset — the shadow copy, then the caller draws the real thing on top. */
export function hardShadow(
  ctx: Ctx2D,
  dx: number,
  dy: number,
  color: string,
  draw: () => void,
): void {
  ctx.save()
  ctx.translate(dx, dy)
  draw()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

/**
 * Draws `text` along a circle of radius `r` centred at (cx, cy). Angles follow the standard canvas
 * convention (0° = 3 o'clock, increasing clockwise) — matches docs/03 §1's "centred at 270°" (top) /
 * "centred at 90°" (bottom) callouts, which is a different convention from PIP_ANGLE_DEG's "clockwise
 * from twelve". `flip` orients glyphs inward instead of outward AND reverses the traversal direction —
 * both are required together so text along the bottom of the ring reads upright, left to right,
 * instead of upside down.
 */
export interface TextOnArcOptions {
  font: string
  color: string
  tracking?: number // px, added between glyphs
  flip?: boolean
  alpha?: number
  align?: 'start' | 'center'
}

export function textOnArc(
  ctx: Ctx2D,
  text: string,
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
  opts: TextOnArcOptions,
): void {
  const { font, color, tracking = 0, flip = false, alpha = 1, align = 'start' } = opts
  const direction = flip ? -1 : 1
  const glyphs = Array.from(text)

  ctx.save()
  ctx.font = font

  let totalAngle = 0
  for (const glyph of glyphs) {
    totalAngle += (ctx.measureText(glyph).width + tracking) / r
  }
  totalAngle -= tracking / r // no trailing gap after the last glyph

  let angleRad = (angleDeg * Math.PI) / 180
  if (align === 'center') {
    angleRad -= direction * (totalAngle / 2)
  }

  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(cx, cy)

  for (const glyph of glyphs) {
    const halfAdvance = ctx.measureText(glyph).width / 2 / r
    angleRad += direction * halfAdvance

    const orient = flip ? angleRad - Math.PI / 2 : angleRad + Math.PI / 2
    const px = r * Math.cos(angleRad)
    const py = r * Math.sin(angleRad)

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(orient)
    ctx.fillText(glyph, 0, 0)
    ctx.restore()

    angleRad += direction * halfAdvance + direction * (tracking / r)
  }

  ctx.restore()
}

/**
 * Binary-searches the largest font size in [minSize, maxSize] whose greedy word-wrap fits within
 * `maxLines` lines of `maxWidth`. If nothing fits even at minSize, clamps to minSize and ellipsises
 * the last line. `font` builds a ctx.font string for a given size so callers can fix weight/family.
 */
export interface FitTextOptions {
  font: (size: number) => string
  maxSize: number
  minSize: number
  maxLines: number
}

export interface FitTextResult {
  size: number
  lines: string[]
}

function wrapLines(ctx: Ctx2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = words[0]
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = words[i]
    }
  }
  lines.push(current)
  return lines
}

function ellipsise(ctx: Ctx2D, text: string, maxWidth: number): string {
  const ELLIPSIS = '…'
  if (ctx.measureText(text).width <= maxWidth) return text

  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const candidate = text.slice(0, mid).trimEnd() + ELLIPSIS
    if (ctx.measureText(candidate).width <= maxWidth) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return lo === 0 ? ELLIPSIS : text.slice(0, lo).trimEnd() + ELLIPSIS
}

export function fitText(
  ctx: Ctx2D,
  text: string,
  maxWidth: number,
  opts: FitTextOptions,
): FitTextResult {
  const { font, maxSize, minSize, maxLines } = opts

  function tryFit(size: number): string[] | null {
    ctx.font = font(size)
    const lines = wrapLines(ctx, text, maxWidth)
    if (lines.length > maxLines) return null
    for (const line of lines) {
      if (ctx.measureText(line).width > maxWidth) return null
    }
    return lines
  }

  let lo = minSize
  let hi = maxSize
  let bestSize: number | null = null
  let bestLines: string[] | null = null

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const lines = tryFit(mid)
    if (lines) {
      bestSize = mid
      bestLines = lines
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (bestLines && bestSize !== null) {
    return { size: bestSize, lines: bestLines }
  }

  ctx.font = font(minSize)
  let lines = wrapLines(ctx, text, maxWidth)
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
  }
  const lastIndex = lines.length - 1
  lines[lastIndex] = ellipsise(ctx, lines[lastIndex], maxWidth)
  return { size: minSize, lines }
}
