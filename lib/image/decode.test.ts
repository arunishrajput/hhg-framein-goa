import { describe, expect, it } from 'vitest'
import { sniffHeicBrand } from './decode'

function header(ftyp: string, brand: string): Uint8Array {
  const bytes = new Uint8Array(12)
  const chars = `????${ftyp}${brand}`.slice(0, 12) // first 4 bytes (box size) are irrelevant
  for (let i = 0; i < 12; i++) bytes[i] = chars.charCodeAt(i)
  return bytes
}

describe('sniffHeicBrand', () => {
  it.each(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])('accepts brand %s', (brand) => {
    expect(sniffHeicBrand(header('ftyp', brand))).toBe(true)
  })

  it('rejects a JPEG header', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    expect(sniffHeicBrand(jpeg)).toBe(false)
  })

  it('rejects a PNG header', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    expect(sniffHeicBrand(png)).toBe(false)
  })

  it('rejects an mp4 (ftyp box, non-HEIC brand)', () => {
    expect(sniffHeicBrand(header('ftyp', 'isom'))).toBe(false)
  })

  it('rejects a buffer shorter than 12 bytes', () => {
    expect(sniffHeicBrand(new Uint8Array(8))).toBe(false)
  })

  it('does not trust a MIME type — brand only, from the bytes', () => {
    // A HEIC file dropped from the iOS Files app: real ftyp/heic bytes, no accompanying file.type.
    expect(sniffHeicBrand(header('ftyp', 'heic'))).toBe(true)
  })
})
