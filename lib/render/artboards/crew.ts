/**
 * Format C — Crew Card. docs/03-ARTBOARD-SPEC.md §3.
 */
import { ARTBOARD, COLOR, EVENT, FONT } from '../tokens'
import { drawTrackedText, fitText, roundRect, hardShadow, type Ctx2D, type Focal } from '../primitives'
import { drawRing } from '../ring'

export interface CrewMember {
  photo: ImageBitmap
  focal: Focal
  name: string
}

export interface CrewSpec {
  format: 'crew'
  teamName: string
  crewClass: string
  crewId: string
  members: CrewMember[] // 2–4, docs/10 D8
}

const { w: W, h: H } = ARTBOARD.crew

// docs/03 §3: the naive even-distribution formula overlaps at n=4, so these are the doc's own
// explicit override values, not a derived formula.
const CENTERS_X: Record<number, number[]> = {
  2: [560, 1040],
  3: [430, 800, 1170],
  4: [330, 653, 976, 1299],
}
const PHOTO_CY = 400
const PHOTO_R = 128
const NAME_Y = 600
const NAME_FIT_WIDTH = 300

export function drawCrew(ctx: Ctx2D, spec: CrewSpec): void {
  ctx.clearRect(0, 0, W, H)

  const n = Math.min(4, Math.max(2, spec.members.length))
  const members = spec.members.slice(0, n)
  const centersX = CENTERS_X[n]

  // Bleed
  ctx.fillStyle = COLOR.green
  ctx.fillRect(0, 0, W, H)

  // Card shadow + card
  hardShadow(ctx, 10, 10, COLOR.greenDeep, () => roundRect(ctx, 60, 60, 1480, 780, 36))
  roundRect(ctx, 60, 60, 1480, 780, 36)
  ctx.fillStyle = COLOR.cream
  ctx.fill()

  // Header
  drawTrackedText(ctx, 'CREW', 130, 150, {
    font: `700 40px "${FONT.display}"`,
    color: COLOR.pink,
    tracking: 40 * 0.18,
  })
  drawTrackedText(ctx, spec.crewId, 1470, 150, {
    font: `700 30px "${FONT.mono}"`,
    color: COLOR.inkSoft,
    tracking: 30 * 0.1,
    align: 'right',
  })

  // Photo units — only the first carries curved band text; at R=128 it's noise for the rest
  // (docs/03 §3), and the per-member tilt never touches the pip (docs/10 D2).
  const dayMonth = EVENT.dates.replace(` ${EVENT.year}`, '')
  members.forEach((member, i) => {
    const cx = centersX[i]

    drawRing(ctx, {
      cx,
      cy: PHOTO_CY,
      R: PHOTO_R,
      photo: member.photo,
      focal: member.focal,
      rotationDeg: -6 + 4 * i,
      bandText:
        i === 0
          ? { upper: `${EVENT.nameShort} ${EVENT.year} · ${dayMonth} · `, fontSize: 14 }
          : undefined,
    })

    const { size, lines } = fitText(ctx, member.name, NAME_FIT_WIDTH, {
      font: (s) => `700 ${s}px "${FONT.mono}"`,
      maxSize: 34,
      minSize: 20,
      maxLines: 1,
    })
    ctx.font = `700 ${size}px "${FONT.mono}"`
    ctx.fillStyle = COLOR.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(lines[0], cx, NAME_Y)
  })

  // Team name + crew class
  const { size: teamSize, lines: teamLines } = fitText(ctx, spec.teamName, 800, {
    font: (s) => `800 ${s}px "${FONT.display}"`,
    maxSize: 88,
    minSize: 48,
    maxLines: 1,
  })
  ctx.font = `800 ${teamSize}px "${FONT.display}"`
  ctx.fillStyle = COLOR.ink
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(teamLines[0], 130, 740)

  // No explicit fit width is given for crew class in docs/03 §3, but CLAUDE.md §6's "long input
  // never breaks layout" invariant is project-wide — 500px keeps it clear of the team name even
  // when that's at its own 800px max.
  const { size: classSize, lines: classLines } = fitText(ctx, spec.crewClass, 500, {
    font: (s) => `italic 700 ${s}px "${FONT.display}"`,
    maxSize: 48,
    minSize: 28,
    maxLines: 1,
  })
  ctx.font = `italic 700 ${classSize}px "${FONT.display}"`
  ctx.fillStyle = COLOR.pink
  ctx.textAlign = 'right'
  ctx.fillText(classLines[0], 1470, 740)

  // Footer strip
  roundRect(ctx, 60, 790, 1480, 50, [0, 0, 36, 36])
  ctx.fillStyle = COLOR.pink
  ctx.fill()

  drawTrackedText(ctx, `${EVENT.tag} · ${EVENT.dates} · ${EVENT.site}`, 800, 815, {
    font: `700 28px "${FONT.mono}"`,
    color: COLOR.cream,
    tracking: 28 * 0.12,
    align: 'center',
    baseline: 'middle',
  })
}
