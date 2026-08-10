'use client'

import { useState, type KeyboardEvent } from 'react'
import type { Format } from '@/lib/render/tokens'

const OPTIONS: { format: Format; label: string }[] = [
  { format: 'pfp', label: 'PFP' },
  { format: 'id', label: 'Builder ID' },
  { format: 'crew', label: 'Crew' },
]

export function FormatSwitch({
  onChange,
}: {
  onChange?: (format: Format) => void
}) {
  const [active, setActive] = useState<Format>('pfp')

  function select(format: Format) {
    setActive(format)
    onChange?.(format)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + dir + OPTIONS.length) % OPTIONS.length
    const next = OPTIONS[nextIndex]
    select(next.format)
    const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[nextIndex]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Card format"
      className="inline-flex rounded-full border-2 border-hhg-green p-1"
    >
      {OPTIONS.map(({ format, label }, index) => {
        const selected = format === active
        return (
          <button
            key={format}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(format)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`rounded-full px-4 py-2 font-mono text-[15px] font-bold uppercase tracking-[0.10em] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-hhg-yellow focus-visible:outline-offset-2 ${
              selected ? 'bg-hhg-green text-hhg-cream' : 'text-hhg-ink-soft'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
