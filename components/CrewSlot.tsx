'use client'

/**
 * One member's photo + name + reorder/remove controls. No per-slot Adjust drawer — the combined
 * Crew Card preview below already shows each photo in place; a from-scratch per-member pan/zoom
 * UI wasn't in docs/03 §3's scope and adds real complexity for a format most people won't touch
 * (docs/10 D8: teams of 1-3 land on the default 3 slots and never need to add/remove at all).
 */
import { useId } from 'react'
import type { useCrewGenerator } from '@/lib/generator/useCrewGenerator'

type Member = ReturnType<typeof useCrewGenerator>['members'][number]

export function CrewSlot({
  member,
  canRemove,
  canMoveLeft,
  canMoveRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  member: Member
  canRemove: boolean
  canMoveLeft: boolean
  canMoveRight: boolean
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
}) {
  const inputId = useId()

  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <label
        htmlFor={inputId}
        className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-2xl transition-colors ${
          member.photoStatus === 'ready'
            ? 'border-hhg-green bg-hhg-green text-hhg-cream'
            : member.photoStatus === 'error'
              ? 'border-hhg-pink bg-hhg-cream-2 text-hhg-pink'
              : 'border-hhg-rule bg-hhg-cream-2 text-hhg-ink-soft hover:border-hhg-pink'
        }`}
        title={member.photoError ?? undefined}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) member.loadFile(file)
            e.target.value = ''
          }}
        />
        {member.photoStatus === 'ready' && '✓'}
        {member.photoStatus === 'error' && '!'}
        {(member.photoStatus === 'decoding' || member.photoStatus === 'framing') && '…'}
        {member.photoStatus === 'idle' && '+'}
      </label>

      <input
        type="text"
        value={member.name}
        onChange={(e) => member.setName(e.target.value)}
        placeholder={`Member ${member.position + 1}`}
        className="w-full rounded-md border-2 border-hhg-rule bg-hhg-cream-2 px-1.5 py-1 text-center font-mono text-xs text-hhg-ink outline-none focus-visible:border-hhg-green focus-visible:outline focus-visible:outline-3 focus-visible:outline-hhg-yellow focus-visible:outline-offset-2"
      />

      <div className="flex gap-2 font-mono text-xs text-hhg-ink-soft">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          aria-label="Move earlier"
          className="disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove member"
          className="disabled:opacity-30"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          aria-label="Move later"
          className="disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  )
}
