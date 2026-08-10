/**
 * The signature ring system — docs/03 §0, docs/02 §1: "used at three scales... every frame, every
 * card, every crew photo carries the same pip at the same angle." Shared by builderId.ts and
 * crew.ts. pfp.ts predates this file and keeps its own inlined copy (docs/03 §1's 0.895
 * global-scale wrapper is specific to Format A and already shipped/verified — not worth the
 * regression risk of retrofitting it onto this module for a purely cosmetic dedupe).
 *
 * All layer radii are ratios of R (docs/03 §0's table), so the same function reproduces pfp.ts's
 * hardcoded R=430 numbers exactly at that R, and docs/03 §2/§3's R=268/R=128 numbers at those.
 */
import { COLOR, FONT, PIP_ANGLE_DEG } from './tokens'
import {
  clipCircle,
  coverDrawImage,
  dashedOrbit,
  palmGlyph,
  textOnArc,
  type Ctx2D,
  type Focal,
} from './primitives'

export interface RingBandText {
  /** Repeated-to-fill unit text for the upper arc (centred 270°, reads left-to-right). */
  upper?: string
  /** Repeated-to-fill unit text for the lower arc (centred 90°, flipped so it reads upright). */
  lower?: string
  fontSize: number
  /** Defaults to fontSize × 0.16 — docs/03 §1's ratio, "load-bearing" per docs/02 §3. */
  tracking?: number
}

export interface RingSpec {
  cx: number
  cy: number
  R: number
  photo: ImageBitmap
  focal: Focal
  /** docs/10 D2: the pip is invariant — this always defaults to PIP_ANGLE_DEG. */
  pipAngleDeg?: number
  bandText?: RingBandText
  /** docs/03 §3's per-member Crew Card tilt. Rotates the photo/hairline/band/band-text only —
   * the orbit and pip are always drawn afterward, in unrotated space (docs/10 D2). */
  rotationDeg?: number
}

function strokeCircle(ctx: Ctx2D, cx: number, cy: number, r: number, stroke: number, color: string): void {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = stroke
  ctx.stroke()
}

/** Repeats `unit` whole (never mid-phrase) until it spans at least `targetSpanRad` at radius `r`. */
function repeatToFill(
  ctx: Ctx2D,
  unit: string,
  r: number,
  font: string,
  tracking: number,
  targetSpanRad: number,
): string {
  ctx.save()
  ctx.font = font
  let total = 0
  let result = ''
  do {
    for (const glyph of Array.from(unit)) {
      total += (ctx.measureText(glyph).width + tracking) / r
    }
    result += unit
  } while (total < targetSpanRad)
  ctx.restore()
  return result
}

const ARC_SPAN_RAD = Math.PI // each band text occupies one semicircle — see pfp.ts's note

export function drawRing(ctx: Ctx2D, spec: RingSpec): void {
  const { cx, cy, R, photo, focal, bandText, rotationDeg = 0 } = spec
  const pipAngleDeg = spec.pipAngleDeg ?? PIP_ANGLE_DEG

  const HAIRLINE_R = R * 1.014
  const HAIRLINE_STROKE = R * 0.014
  const BAND_R = R * 1.077
  const BAND_STROKE = R * 0.112
  const ORBIT_R = R * 1.158
  const ORBIT_STROKE = R * 0.023
  const ORBIT_DASH: [number, number] = [R * 0.06, R * 0.051]
  const ORBIT_DASH_OFFSET = ORBIT_DASH[0] / 2 // keeps a dash off the pip at any R — see file header
  const PIP_R = R * 0.149

  ctx.save()
  if (rotationDeg !== 0) {
    ctx.translate(cx, cy)
    ctx.rotate((rotationDeg * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }

  clipCircle(ctx, cx, cy, R, () => {
    coverDrawImage(ctx, photo, cx, cy, R * 2, R * 2, focal)
  })
  strokeCircle(ctx, cx, cy, HAIRLINE_R, HAIRLINE_STROKE, COLOR.cream)
  strokeCircle(ctx, cx, cy, BAND_R, BAND_STROKE, COLOR.green)

  if (bandText) {
    const font = `700 ${bandText.fontSize}px "${FONT.mono}"`
    const tracking = bandText.tracking ?? bandText.fontSize * 0.16

    if (bandText.upper) {
      textOnArc(
        ctx,
        repeatToFill(ctx, bandText.upper, BAND_R, font, tracking, ARC_SPAN_RAD),
        cx,
        cy,
        BAND_R,
        270,
        { font, color: COLOR.cream, tracking, align: 'center' },
      )
    }
    if (bandText.lower) {
      textOnArc(
        ctx,
        repeatToFill(ctx, bandText.lower, BAND_R, font, tracking, ARC_SPAN_RAD),
        cx,
        cy,
        BAND_R,
        90,
        { font, color: COLOR.cream, tracking, align: 'center', flip: true, alpha: 0.78 },
      )
    }
  }

  ctx.restore()

  dashedOrbit(ctx, cx, cy, ORBIT_R, ORBIT_STROKE, ORBIT_DASH, COLOR.pink, ORBIT_DASH_OFFSET)

  const pipAngleRad = (pipAngleDeg * Math.PI) / 180
  const pipX = cx + ORBIT_R * Math.sin(pipAngleRad)
  const pipY = cy - ORBIT_R * Math.cos(pipAngleRad)

  ctx.beginPath()
  ctx.arc(pipX, pipY, PIP_R, 0, Math.PI * 2)
  ctx.fillStyle = COLOR.yellow
  ctx.fill()

  palmGlyph(ctx, pipX, pipY, PIP_R, COLOR.green)
}
