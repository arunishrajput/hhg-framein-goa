/**
 * Small deterministic string/integer hashing shared by builderClass.ts and builderId.ts. Pure
 * 32-bit integer arithmetic throughout — no floating point, so results are identical across every
 * JS engine and every run, unlike e.g. Math.sin/cos (see RingMark.tsx's hydration fix).
 */

/** djb2 — deterministic, stable across runs and engines. */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

/** Murmur3-style integer finalizer, used to scramble a seed before reducing it mod N so that
 * adjacent seeds (e.g. consecutive rerolls) don't map to adjacent, visually-similar outputs. */
export function mixInt(x: number): number {
  x = x >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x45d9f3b)
  x ^= x >>> 16
  x = Math.imul(x, 0x45d9f3b)
  x ^= x >>> 16
  return x >>> 0
}

export function normalize(s: string): string {
  return s.trim().toLowerCase()
}
