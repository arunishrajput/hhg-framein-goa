/**
 * Format B — Builder ID. docs/03-ARTBOARD-SPEC.md §2.
 */
import { ARTBOARD, COLOR, EVENT, FONT } from '../tokens'
import { drawTrackedText, fitText, roundRect, hardShadow, type Ctx2D, type Focal } from '../primitives'
import { drawRing } from '../ring'

export interface BuilderIdSpec {
  format: 'id'
  photo: ImageBitmap
  focal: Focal
  name: string
  role: string
  handle?: string
  builderClass: string
  builderId: string
}

const { w: W, h: H } = ARTBOARD.id

// Column labels are this artboard's own structural chrome (docs/03 §2's table headers), not
// EVENT/brand content shared elsewhere — kept local alongside the rest of this file's geometry
// constants, the same way pfp.ts keeps its own layout numbers local.
const LABEL = {
  name: 'NAME',
  role: 'STACK / ROLE',
  class: 'BUILDER CLASS',
  handle: 'HANDLE',
} as const

const LABEL_FONT = `700 26px "${FONT.mono}"`
const LABEL_TRACKING = 26 * 0.2
const COLUMN_LEFT = 880
const COLUMN_RIGHT = 1436
const COLUMN_WIDTH = COLUMN_RIGHT - COLUMN_LEFT
const LINE_HEIGHT_RATIO = 1.05

interface Row {
  label: string
  labelBaselineY: number
  valueBaselineY: number
  value: string
  font: (size: number) => string
  color: string
  maxSize: number
  minSize: number
  maxLines: number
}

export function drawBuilderId(ctx: Ctx2D, spec: BuilderIdSpec): void {
  ctx.clearRect(0, 0, W, H)

  // Bleed
  ctx.fillStyle = COLOR.green
  ctx.fillRect(0, 0, W, H)

  // Card shadow + card
  hardShadow(ctx, 12, 12, COLOR.greenDeep, () => roundRect(ctx, 80, 80, 1428, 1840, 40))
  roundRect(ctx, 80, 80, 1428, 1840, 40)
  ctx.fillStyle = COLOR.cream
  ctx.fill()

  // गोवा accent — drawn under (before) the header row so the header text stays fully legible
  ctx.save()
  ctx.translate(1250, 250)
  ctx.rotate((-8 * Math.PI) / 180)
  ctx.font = `700 160px "${FONT.deva}"`
  ctx.fillStyle = COLOR.yellow
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(EVENT.deva, 0, 0)
  ctx.restore()

  // Header
  ctx.beginPath()
  ctx.arc(150, 176, 14, 0, Math.PI * 2)
  ctx.fillStyle = COLOR.pink
  ctx.fill()

  drawTrackedText(ctx, 'BUILDER ID', 196, 192, {
    font: `700 46px "${FONT.display}"`,
    color: COLOR.pink,
    tracking: 46 * 0.18,
  })
  drawTrackedText(ctx, spec.builderId, 1436, 192, {
    font: `700 38px "${FONT.mono}"`,
    color: COLOR.inkSoft,
    tracking: 38 * 0.1,
    align: 'right',
  })

  ctx.beginPath()
  ctx.moveTo(150, 268)
  ctx.lineTo(1436, 268)
  ctx.strokeStyle = COLOR.rule
  ctx.lineWidth = 3
  ctx.stroke()

  // Hero row — the shared ring at R=268, upper-arc band text only
  const dayMonth = EVENT.dates.replace(` ${EVENT.year}`, '')
  drawRing(ctx, {
    cx: 500,
    cy: 800,
    R: 268,
    photo: spec.photo,
    focal: spec.focal,
    bandText: { upper: `${EVENT.nameShort} ${EVENT.year} · ${dayMonth} · `, fontSize: 18 },
  })

  // Text column
  const rows: Row[] = [
    {
      label: LABEL.name,
      labelBaselineY: 560,
      valueBaselineY: 660,
      value: spec.name,
      font: (s) => `700 ${s}px "${FONT.display}"`,
      color: COLOR.ink,
      maxSize: 104,
      minSize: 56,
      maxLines: 2,
    },
    {
      label: LABEL.role,
      labelBaselineY: 800,
      valueBaselineY: 872,
      value: spec.role,
      font: (s) => `400 ${s}px "${FONT.mono}"`,
      color: COLOR.ink,
      maxSize: 42,
      minSize: 28,
      maxLines: 2,
    },
    {
      label: LABEL.class,
      labelBaselineY: 1010,
      valueBaselineY: 1090,
      value: spec.builderClass,
      font: (s) => `italic 700 ${s}px "${FONT.display}"`,
      color: COLOR.pink,
      maxSize: 66,
      minSize: 40,
      maxLines: 1,
    },
  ]
  if (spec.handle) {
    rows.push({
      label: LABEL.handle,
      labelBaselineY: 1210,
      valueBaselineY: 1266,
      value: `@${spec.handle.replace(/^@/, '')}`,
      font: (s) => `400 ${s}px "${FONT.mono}"`,
      color: COLOR.inkSoft,
      maxSize: 38,
      minSize: 38,
      maxLines: 1,
    })
  }

  for (const row of rows) {
    drawTrackedText(ctx, row.label, COLUMN_LEFT, row.labelBaselineY, {
      font: LABEL_FONT,
      color: COLOR.inkSoft,
      tracking: LABEL_TRACKING,
    })

    ctx.beginPath()
    ctx.moveTo(COLUMN_LEFT, row.labelBaselineY + 8)
    ctx.lineTo(COLUMN_RIGHT, row.labelBaselineY + 8)
    ctx.strokeStyle = COLOR.rule
    ctx.lineWidth = 2
    ctx.stroke()

    const { size, lines } = fitText(ctx, row.value, COLUMN_WIDTH, {
      font: row.font,
      maxSize: row.maxSize,
      minSize: row.minSize,
      maxLines: row.maxLines,
    })
    ctx.font = row.font(size)
    ctx.fillStyle = row.color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    lines.forEach((line, i) => {
      ctx.fillText(line, COLUMN_LEFT, row.valueBaselineY + i * size * LINE_HEIGHT_RATIO)
    })
  }

  // Day rail
  const dayFont = `700 30px "${FONT.mono}"`
  const dayTracking = 30 * 0.14
  const PILL_H = 84
  const PILL_GAP = 24
  const PILL_PAD = 36
  const pillY = 1458
  let pillX = 150
  ctx.font = dayFont
  EVENT.days.forEach((day, i) => {
    const textWidth = Array.from(day).reduce((w, g) => w + ctx.measureText(g).width, 0)
    const pillW = textWidth + dayTracking * Math.max(0, day.length - 1) + PILL_PAD * 2

    roundRect(ctx, pillX, pillY, pillW, PILL_H, 999)
    ctx.fillStyle = COLOR.green
    ctx.fill()

    if (i === 0) {
      roundRect(ctx, pillX + 2, pillY + 2, pillW - 4, PILL_H - 4, 999 - 2)
      ctx.strokeStyle = COLOR.yellow
      ctx.lineWidth = 4
      ctx.stroke()
    }

    drawTrackedText(ctx, day, pillX + pillW / 2, pillY + PILL_H / 2, {
      font: dayFont,
      color: COLOR.cream,
      tracking: dayTracking,
      align: 'center',
      baseline: 'middle',
    })

    pillX += pillW + PILL_GAP
  })

  // Data block
  drawTrackedText(ctx, EVENT.coords, 150, 1660, { font: `400 34px "${FONT.mono}"`, color: COLOR.inkSoft })
  drawTrackedText(ctx, EVENT.dates, 150, 1740, { font: `400 34px "${FONT.mono}"`, color: COLOR.inkSoft })

  const taglineWords = EVENT.tagline.split(' ')
  const taglineLine1 = taglineWords.slice(0, 2).join(' ')
  const taglineLine2 = taglineWords.slice(2).join(' ')
  const taglineFont = `700 56px "${FONT.display}"`
  drawTrackedText(ctx, taglineLine1, 1436, 1660, { font: taglineFont, color: COLOR.green, align: 'right' })
  drawTrackedText(ctx, taglineLine2, 1436, 1740, { font: taglineFont, color: COLOR.green, align: 'right' })

  // Footer
  roundRect(ctx, 80, 1810, 1428, 110, [0, 0, 40, 40])
  ctx.fillStyle = COLOR.pink
  ctx.fill()

  drawTrackedText(ctx, `${EVENT.tag} · ${EVENT.site}`, 150, 1878, {
    font: `700 34px "${FONT.mono}"`,
    color: COLOR.cream,
    tracking: 34 * 0.12,
  })

  // 2:47 stamp
  ctx.beginPath()
  ctx.arc(1400, 1865, 62, 0, Math.PI * 2)
  ctx.strokeStyle = COLOR.cream
  ctx.lineWidth = 4
  ctx.stroke()

  const [stampTime, stampMeridiem] = EVENT.signatureTime.split(' ')
  ctx.save()
  ctx.translate(1400, 1865)
  ctx.rotate((-8 * Math.PI) / 180)
  ctx.fillStyle = COLOR.cream
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 30px "${FONT.mono}"`
  ctx.fillText(stampTime, 0, -8)
  ctx.font = `700 20px "${FONT.mono}"`
  ctx.fillText(stampMeridiem, 0, 18)
  ctx.restore()
}
