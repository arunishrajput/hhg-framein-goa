/**
 * HHG-2026-XXXX identity numbers. docs/01 §7, docs/06 P3: four base36 chars from a stable hash.
 */
import { EVENT } from '../render/tokens'
import { hashString, normalize } from './hash'

const CODE_SPACE = 36 ** 4 // 1,679,616 — the full range of a 4-digit base36 code

function code(seedInput: string): string {
  const seed = hashString(seedInput)
  return (seed % CODE_SPACE).toString(36).toUpperCase().padStart(4, '0')
}

/** Deterministic from name + handle — same person always gets the same id. */
export function builderId(name: string, handle: string): string {
  return `HHG-${EVENT.year}-${code(`id::${normalize(name)}::${normalize(handle)}`)}`
}

/** Deterministic from the team name and every member's name, order-sensitive. */
export function crewId(teamName: string, memberNames: string[]): string {
  const key = [normalize(teamName), ...memberNames.map(normalize)].join('::')
  return `HHG-${EVENT.year}-CREW-${code(`crew::${key}`)}`
}
