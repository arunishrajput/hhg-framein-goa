/**
 * Format A — PFP Frame. docs/03-ARTBOARD-SPEC.md §1.
 */
import { ARTBOARD, COLOR, EVENT, FONT, PIP_ANGLE_DEG } from '../tokens'
import {
  clipCircle,
  coverDrawImage,
  dashedOrbit,
  palmGlyph,
  textOnArc,
  type Ctx2D,
  type Focal,
} from '../primitives'

export interface PfpSpec {
  format: 'pfp'
  photo: ImageBitmap
  focal: Focal
}

const { w: W, h: H } = ARTBOARD.pfp
const CENTER = W / 2

// docs/03 §1: the pip breaks the circle at r=567 pre-scale, so the whole composition scales
// 0.895 about centre to bring it back inside r=512. Geometry below is written at the pre-scale
// numbers from the spec table; only this one factor makes it fit the mask.
const GLOBAL_SCALE = 0.895

const PHOTO_R = 430
const HAIRLINE_R = 436
const HAIRLINE_STROKE = 6
const BAND_R = 463
const BAND_STROKE = 48
const ORBIT_R = 498
const ORBIT_STROKE = 10
const ORBIT_DASH: [number, number] = [26, 22]
const ORBIT_DASH_OFFSET = 13
const PIP_R = 64

const BAND_FONT_SIZE = 26
const BAND_TRACKING = BAND_FONT_SIZE * 0.16 // 0.16em
const BAND_FONT = `700 ${BAND_FONT_SIZE}px "${FONT.mono}"`

// Each band text occupies one semicircle: upper reads across the top (centred 270°, standard
// canvas angle convention — see textOnArc), lower across the bottom (centred 90°), meeting at
// the left/right seams with no gap and no overlap.
const ARC_SPAN_RAD = Math.PI

export function drawPfp(ctx: Ctx2D, spec: PfpSpec): void {
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(CENTER, CENTER)
  ctx.scale(GLOBAL_SCALE, GLOBAL_SCALE)
  ctx.translate(-CENTER, -CENTER)

  clipCircle(ctx, CENTER, CENTER, PHOTO_R, () => {
    coverDrawImage(ctx, spec.photo, CENTER, CENTER, PHOTO_R * 2, PHOTO_R * 2, spec.focal)
  })

  strokeCircle(ctx, HAIRLINE_R, HAIRLINE_STROKE, COLOR.cream)
  strokeCircle(ctx, BAND_R, BAND_STROKE, COLOR.green)

  const dayMonth = EVENT.dates.replace(` ${EVENT.year}`, '')
  const upperUnit = `${EVENT.name} ${EVENT.year} · ${dayMonth} · ${EVENT.place} · `
  const lowerUnit = `${EVENT.tag} · ${EVENT.signatureTime} · `

  textOnArc(
    ctx,
    repeatToFill(ctx, upperUnit, BAND_R, BAND_FONT, BAND_TRACKING, ARC_SPAN_RAD),
    CENTER,
    CENTER,
    BAND_R,
    270,
    { font: BAND_FONT, color: COLOR.cream, tracking: BAND_TRACKING, align: 'center' },
  )

  textOnArc(
    ctx,
    repeatToFill(ctx, lowerUnit, BAND_R, BAND_FONT, BAND_TRACKING, ARC_SPAN_RAD),
    CENTER,
    CENTER,
    BAND_R,
    90,
    {
      font: BAND_FONT,
      color: COLOR.cream,
      tracking: BAND_TRACKING,
      align: 'center',
      flip: true,
      alpha: 0.78,
    },
  )

  dashedOrbit(ctx, CENTER, CENTER, ORBIT_R, ORBIT_STROKE, ORBIT_DASH, COLOR.pink, ORBIT_DASH_OFFSET)

  // Clock convention here (0° = 12 o'clock, clockwise) — the signature angle, distinct from
  // textOnArc's standard trig convention above. See docs/03 §0 and CLAUDE.md §2.
  const pipAngleRad = (PIP_ANGLE_DEG * Math.PI) / 180
  const pipX = CENTER + ORBIT_R * Math.sin(pipAngleRad)
  const pipY = CENTER - ORBIT_R * Math.cos(pipAngleRad)

  ctx.beginPath()
  ctx.arc(pipX, pipY, PIP_R, 0, Math.PI * 2)
  ctx.fillStyle = COLOR.yellow
  ctx.fill()

  palmGlyph(ctx, pipX, pipY, PIP_R, COLOR.green)

  ctx.restore()
}

function strokeCircle(ctx: Ctx2D, r: number, stroke: number, color: string): void {
  ctx.beginPath()
  ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2)
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
