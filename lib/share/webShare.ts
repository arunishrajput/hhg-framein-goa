/**
 * The native share capability probe (docs/04 §4c). Kept as a pure, synchronous check so callers
 * can decide native-vs-link entirely inline in a click handler — no await before the decision,
 * which is what keeps the popup workaround in useShare.ts intact (CLAUDE.md §7, docs/04 §4c).
 */
export function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  )
}
