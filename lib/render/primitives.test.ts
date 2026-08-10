import { describe, expect, it } from 'vitest'
import { fitText, textOnArc, type Ctx2D } from './primitives'

/**
 * A minimal stand-in for CanvasRenderingContext2D that tracks the save/translate/rotate transform
 * stack with plain affine math and records every fillText call's resolved world position and
 * rotation. Real canvas (jsdom, node-canvas) isn't needed — textOnArc and fitText only ever touch
 * this subset of the API, and this lets the geometry be asserted directly instead of eyeballed.
 */
class MockCtx2D {
  font = '16px sans'
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 0
  lineCap = 'butt'
  textAlign = 'start'
  textBaseline = 'alphabetic'
  globalAlpha = 1

  readonly calls: { glyph: string; x: number; y: number; angleDeg: number }[] = []

  private stack: { ox: number; oy: number; angle: number }[] = []
  private ox = 0
  private oy = 0
  private angle = 0

  constructor(private widthOf: (text: string, font: string) => number) {}

  save() {
    this.stack.push({ ox: this.ox, oy: this.oy, angle: this.angle })
  }

  restore() {
    const top = this.stack.pop()
    if (top) {
      this.ox = top.ox
      this.oy = top.oy
      this.angle = top.angle
    }
  }

  translate(dx: number, dy: number) {
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    this.ox += dx * cos - dy * sin
    this.oy += dx * sin + dy * cos
  }

  rotate(theta: number) {
    this.angle += theta
  }

  measureText(text: string) {
    return { width: this.widthOf(text, this.font) } as TextMetrics
  }

  fillText(text: string, x: number, y: number) {
    const cos = Math.cos(this.angle)
    const sin = Math.sin(this.angle)
    this.calls.push({
      glyph: text,
      x: this.ox + x * cos - y * sin,
      y: this.oy + x * sin + y * cos,
      angleDeg: (this.angle * 180) / Math.PI,
    })
  }
}

function arcCtx(constantGlyphWidth = 20) {
  return new MockCtx2D(() => constantGlyphWidth) as unknown as Ctx2D & MockCtx2D
}

function posAngle(call: { x: number; y: number }) {
  return Math.atan2(call.y, call.x)
}

/** Wraps to (-π, π] so angles like 270° and -90° compare equal. */
function normalizeAngle(rad: number) {
  return Math.atan2(Math.sin(rad), Math.cos(rad))
}

describe('textOnArc', () => {
  it('advances clockwise (increasing angle) by default', () => {
    const ctx = arcCtx()
    textOnArc(ctx, 'AB', 0, 0, 100, 0, { font: '16px x', color: '#000' })

    expect(ctx.calls).toHaveLength(2)
    expect(posAngle(ctx.calls[1])).toBeGreaterThan(posAngle(ctx.calls[0]))
  })

  it('flip reverses traversal to counter-clockwise', () => {
    const ctx = arcCtx()
    textOnArc(ctx, 'AB', 0, 0, 100, 0, { font: '16px x', color: '#000', flip: true })

    expect(posAngle(ctx.calls[1])).toBeLessThan(posAngle(ctx.calls[0]))
  })

  it('orients glyphs tangent and outward-facing when not flipped', () => {
    const ctx = arcCtx()
    textOnArc(ctx, 'AB', 0, 0, 100, 0, { font: '16px x', color: '#000' })

    for (const call of ctx.calls) {
      const expectedOrientRad = posAngle(call) + Math.PI / 2
      expect((call.angleDeg * Math.PI) / 180).toBeCloseTo(expectedOrientRad, 6)
    }
  })

  it('orients glyphs inward-facing when flipped, so bottom text reads upright', () => {
    const ctx = arcCtx()
    textOnArc(ctx, 'AB', 0, 0, 100, 90, { font: '16px x', color: '#000', flip: true })

    for (const call of ctx.calls) {
      const expectedOrientRad = posAngle(call) - Math.PI / 2
      expect((call.angleDeg * Math.PI) / 180).toBeCloseTo(expectedOrientRad, 6)
    }
  })

  it('centers text symmetrically about the target angle when align is center', () => {
    const ctx = arcCtx()
    const targetDeg = 270
    textOnArc(ctx, 'AAAA', 0, 0, 100, targetDeg, {
      font: '16px x',
      color: '#000',
      align: 'center',
    })

    const first = posAngle(ctx.calls[0])
    const last = posAngle(ctx.calls[ctx.calls.length - 1])
    const targetRad = normalizeAngle((targetDeg * Math.PI) / 180)
    expect(normalizeAngle((first + last) / 2)).toBeCloseTo(targetRad, 6)
  })

  it('tracking widens the angular gap between glyphs', () => {
    const noTracking = arcCtx()
    textOnArc(noTracking, 'AB', 0, 0, 100, 0, { font: '16px x', color: '#000' })
    const tightSpan = posAngle(noTracking.calls[1]) - posAngle(noTracking.calls[0])

    const withTracking = arcCtx()
    textOnArc(withTracking, 'AB', 0, 0, 100, 0, {
      font: '16px x',
      color: '#000',
      tracking: 50,
    })
    const widerSpan = posAngle(withTracking.calls[1]) - posAngle(withTracking.calls[0])

    expect(widerSpan).toBeGreaterThan(tightSpan)
  })
})

function fitCtx() {
  const widthOf = (text: string, font: string) => {
    const match = /(\d+(?:\.\d+)?)px/.exec(font)
    const size = match ? Number(match[1]) : 16
    return text.length * size * 0.6
  }
  return new MockCtx2D(widthOf) as unknown as Ctx2D
}

function widthAt(text: string, size: number) {
  return text.length * size * 0.6
}

describe('fitText', () => {
  it('keeps maxSize and a single line when the text already fits', () => {
    const ctx = fitCtx()
    const result = fitText(ctx, 'Hi', 200, {
      font: (size) => `${size}px x`,
      maxSize: 40,
      minSize: 20,
      maxLines: 2,
    })

    expect(result.size).toBe(40)
    expect(result.lines).toEqual(['Hi'])
  })

  it('shrinks below maxSize when the text does not fit, keeping every line inside maxWidth', () => {
    const ctx = fitCtx()
    const text = 'Bartholomew Vengeance Chatterjee-Rao'
    const maxWidth = 400
    const result = fitText(ctx, text, maxWidth, {
      font: (size) => `${size}px x`,
      maxSize: 104,
      minSize: 56,
      maxLines: 2,
    })

    expect(result.size).toBeLessThan(104)
    expect(result.size).toBeGreaterThanOrEqual(56)
    expect(result.lines.length).toBeLessThanOrEqual(2)
    for (const line of result.lines) {
      expect(widthAt(line, result.size)).toBeLessThanOrEqual(maxWidth + 1e-6)
    }
  })

  it('clamps to minSize and ellipsises the last line when nothing fits', () => {
    const ctx = fitCtx()
    const text = 'Distributed Systems Rust Zero Knowledge Proofs and then some more words after that'
    const maxWidth = 120
    const result = fitText(ctx, text, maxWidth, {
      font: (size) => `${size}px x`,
      maxSize: 66,
      minSize: 40,
      maxLines: 1,
    })

    expect(result.size).toBe(40)
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0].endsWith('…')).toBe(true)
    expect(widthAt(result.lines[0], result.size)).toBeLessThanOrEqual(maxWidth)
  })

  it('allowing more lines never forces a smaller size than a tighter maxLines', () => {
    const ctx1 = fitCtx()
    const ctx2 = fitCtx()
    const text = 'Full-stack . Embedded . Distributed Systems'
    const maxWidth = 300
    const opts = { font: (size: number) => `${size}px x`, maxSize: 60, minSize: 20 }

    const oneLine = fitText(ctx1, text, maxWidth, { ...opts, maxLines: 1 })
    const twoLines = fitText(ctx2, text, maxWidth, { ...opts, maxLines: 2 })

    expect(twoLines.size).toBeGreaterThanOrEqual(oneLine.size)
  })
})
