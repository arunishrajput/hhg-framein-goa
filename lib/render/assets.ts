/**
 * Static brand assets the render pipeline draws itself, as opposed to user-supplied photos
 * (lib/image/decode.ts). Loaded once from /public/brand and memoized — every subsequent render()
 * call reuses the same element instead of re-fetching. Still deterministic: the source file is a
 * fixed asset in the repo, not user input, so it doesn't break the "same spec -> same PNG" contract.
 */

let devaMarkPromise: Promise<HTMLImageElement> | null = null

/**
 * The गोवा wordmark (yellow fill, pink outline). Loaded as an HTMLImageElement, not via
 * createImageBitmap — this SVG uses an <mask> layer for its pink outline, and Chrome's
 * createImageBitmap SVG decoder rejects it outright ("source image could not be decoded") even
 * though the same file renders fine as a normal image. drawImage() accepts HTMLImageElement on
 * both CanvasRenderingContext2D and OffscreenCanvasRenderingContext2D, and rasterizes an SVG
 * source crisply at whatever destination size it's drawn at, so no pre-sizing is needed either.
 */
export function loadDevaMark(): Promise<HTMLImageElement> {
  devaMarkPromise ??= new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('goa-hindi.svg failed to load'))
    img.src = '/brand/goa-hindi.svg'
  })
  return devaMarkPromise
}
