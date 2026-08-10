'use client'

/**
 * docs/02 §5: bottom-centre on mobile, bottom-right on desktop, green fill, cream text, hard
 * shadow, role="status". Auto-dismiss is driven by the caller (useShare's 4s reset) — this
 * component just renders or doesn't.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 rounded-md bg-hhg-green px-4 py-3 text-center font-mono text-sm text-hhg-cream shadow-[6px_6px_0_var(--hhg-green-deep)] sm:inset-x-auto sm:right-4 sm:left-auto sm:max-w-xs sm:text-left"
    >
      {message}
    </div>
  )
}
