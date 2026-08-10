/**
 * The generated Builder Class. docs/01 §7, docs/06 P3: exactly 247 classes (19 × 13), Goa +
 * AI/crypto/shipping vocabulary, deterministic from name + handle, reroll(seed) advances.
 */
import { hashString, mixInt, normalize } from './hash'

// Each adjective is "[Goa word]-[shipping/tech participle]" — the docs/03 §2 mockup example is
// "Kokum-Fed Shipwright". Curated as a closed set so every one of the 19 × 13 = 247 combinations
// reads fine; no per-pair denylist needed. None of these, nor the nouns below, contain any of the
// banned words (ninja, rockstar, guru, wizard, hero, sensei, samurai).
export const ADJECTIVES = [
  'Kokum-Fed',
  'Susegad-Coded',
  'Monsoon-Born',
  'Feni-Fueled',
  'Tide-Locked',
  'Laterite-Cut',
  'Cashew-Roasted',
  'Coconut-Charted',
  'Konkan-Forged',
  'Mandovi-Mapped',
  'Zuari-Streamed',
  'Backwater-Anchored',
  'Latitude-Signed',
  'Arabian-Routed',
  'Sunset-Compiled',
  'Palm-Rendered',
  'Spice-Traced',
  'Reef-Shipped',
  'Anjuna-Cached',
] as const

export const NOUNS = [
  'Shipwright',
  'Cartographer',
  'Protocol',
  'Ledger',
  'Validator',
  'Compiler',
  'Oracle',
  'Harbormaster',
  'Signal',
  'Vector',
  'Anchor',
  'Pipeline',
  'Custodian',
] as const

export const TOTAL_CLASSES = ADJECTIVES.length * NOUNS.length // 247

export interface BuilderClass {
  label: string
  /** The seed that produced this label — feed it to reroll() to advance. */
  seed: number
}

/** Public so a caller holding just a seed (e.g. after a reroll) can re-derive the label without
 * re-hashing name+handle — used by the Builder ID form to redraw after a debounce settles. */
export function classFromSeed(seed: number): BuilderClass {
  const index = mixInt(seed) % TOTAL_CLASSES
  const adjIndex = Math.floor(index / NOUNS.length)
  const nounIndex = index % NOUNS.length
  return { label: `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`, seed }
}

/** Deterministic from name + handle — same inputs always produce the same class. */
export function builderClass(name: string, handle: string): BuilderClass {
  const seed = hashString(`class::${normalize(name)}::${normalize(handle)}`)
  return classFromSeed(seed)
}

/** Advances the seed by one step and returns the new class. Deterministic — same seed in, same
 * result out, every time. */
export function reroll(seed: number): BuilderClass {
  return classFromSeed(seed + 1)
}
