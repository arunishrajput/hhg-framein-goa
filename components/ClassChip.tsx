'use client'

/**
 * docs/02 §5: the generated Builder/Crew Class, an inline yellow pill with a reroll button that
 * spins 360° once per press — "the most-touched control in the product; make it feel good."
 */
import { useState } from 'react'

export function ClassChip({ label, onReroll }: { label: string; onReroll: () => void }) {
  const [spin, setSpin] = useState(false)

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-hhg-yellow py-2 pr-3 pl-4">
      <span className="font-display text-sm text-hhg-ink italic">{label}</span>
      <button
        type="button"
        aria-label="Reroll class"
        onClick={() => {
          onReroll()
          setSpin(true)
        }}
        onAnimationEnd={() => setSpin(false)}
        className={`rounded-full text-hhg-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-hhg-green focus-visible:outline-offset-2 ${spin ? 'animate-[spin_400ms_ease-out_1]' : ''}`}
      >
        ↻
      </button>
    </div>
  )
}
