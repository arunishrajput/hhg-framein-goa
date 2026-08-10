import { describe, expect, it } from 'vitest'
import { FALLBACK_FOCAL, focalFromBox, pickBestFace, scoreFace, type FaceBox } from './autoframe'

const IMG_W = 1000
const IMG_H = 1000

describe('scoreFace', () => {
  it('scores a centred face higher than an equal-size edge face', () => {
    const centre: FaceBox = { originX: 400, originY: 400, width: 200, height: 200 }
    const edge: FaceBox = { originX: 0, originY: 0, width: 200, height: 200 }
    expect(scoreFace(centre, IMG_W, IMG_H)).toBeGreaterThan(scoreFace(edge, IMG_W, IMG_H))
  })

  it('scores a bigger central face higher than a smaller central face', () => {
    const big: FaceBox = { originX: 300, originY: 300, width: 400, height: 400 }
    const small: FaceBox = { originX: 400, originY: 400, width: 100, height: 100 }
    expect(scoreFace(big, IMG_W, IMG_H)).toBeGreaterThan(scoreFace(small, IMG_W, IMG_H))
  })

  it('lets a slightly smaller central face beat a bigger edge face', () => {
    const bigAtEdge: FaceBox = { originX: 0, originY: 0, width: 260, height: 260 }
    const smallerCentred: FaceBox = { originX: 400, originY: 400, width: 220, height: 220 }
    expect(scoreFace(smallerCentred, IMG_W, IMG_H)).toBeGreaterThan(scoreFace(bigAtEdge, IMG_W, IMG_H))
  })
})

describe('pickBestFace', () => {
  it('picks the single face when there is only one', () => {
    const only: FaceBox = { originX: 100, originY: 100, width: 200, height: 200 }
    expect(pickBestFace([only], IMG_W, IMG_H)).toBe(only)
  })

  it('picks the largest×most-central face among several', () => {
    const tiny: FaceBox = { originX: 900, originY: 10, width: 40, height: 40 }
    const central: FaceBox = { originX: 400, originY: 400, width: 200, height: 200 }
    const edge: FaceBox = { originX: 0, originY: 900, width: 90, height: 90 }
    expect(pickBestFace([tiny, central, edge], IMG_W, IMG_H)).toBe(central)
  })

  it('breaks exact ties deterministically toward the leftmost box', () => {
    // Powers of two throughout so both centres land on exact binary fractions and the mirror
    // symmetry about x=0.5 produces a bit-identical score, not just an approximate one.
    const dim = 1024
    const left: FaceBox = { originX: 128, originY: 400, width: 256, height: 256 }
    const right: FaceBox = { originX: 640, originY: 400, width: 256, height: 256 }
    expect(scoreFace(left, dim, dim)).toBe(scoreFace(right, dim, dim))
    expect(pickBestFace([right, left], dim, dim)).toBe(left)
    expect(pickBestFace([left, right], dim, dim)).toBe(left)
  })
})

describe('focalFromBox', () => {
  it('centres x on the box centre', () => {
    const box: FaceBox = { originX: 300, originY: 300, width: 200, height: 200 }
    const focal = focalFromBox(box, IMG_W, IMG_H)
    expect(focal.x).toBeCloseTo(0.4)
  })

  it('biases y upward by 0.12×boxHeight relative to the box centre', () => {
    const box: FaceBox = { originX: 300, originY: 300, width: 200, height: 200 }
    const focal = focalFromBox(box, IMG_W, IMG_H)
    const rawCenterY = 0.4
    expect(focal.y).toBeLessThan(rawCenterY)
    expect(focal.y).toBeCloseTo(rawCenterY - 0.12 * 0.2)
  })

  it('clamps to [0,1] for a box that spills past the image edge', () => {
    const box: FaceBox = { originX: -50, originY: -50, width: 200, height: 200 }
    const focal = focalFromBox(box, IMG_W, IMG_H)
    expect(focal.x).toBeGreaterThanOrEqual(0)
    expect(focal.y).toBeGreaterThanOrEqual(0)
  })
})

describe('FALLBACK_FOCAL', () => {
  it('is the documented rule-of-thirds point, upper-biased', () => {
    expect(FALLBACK_FOCAL).toEqual({ x: 0.5, y: 0.38 })
  })
})
