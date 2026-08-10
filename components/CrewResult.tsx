'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CrewSlot } from './CrewSlot'
import { Field } from './Field'
import { ClassChip } from './ClassChip'
import { ShareButton } from './ShareButton'
import { Toast } from './Toast'
import type { useCrewGenerator } from '@/lib/generator/useCrewGenerator'
import type { ShareStatus } from '@/lib/share/useShare'

export function CrewResult({
  generator,
  onShare,
  shareStatus,
}: {
  generator: ReturnType<typeof useCrewGenerator>
  onShare: () => void
  shareStatus: ShareStatus
}) {
  const [playReveal, setPlayReveal] = useState(false)
  const wasReady = useRef(false)

  useEffect(() => {
    if (generator.dataUrl && !wasReady.current) {
      setPlayReveal(true)
    }
    wasReady.current = generator.dataUrl != null
  }, [generator.dataUrl])

  const remaining = generator.members.filter((m) => m.photoStatus !== 'ready').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-center gap-4">
        {generator.members.map((member, position) => (
          <CrewSlot
            key={member.slotIndex}
            member={member}
            canRemove={generator.canRemove}
            canMoveLeft={position > 0}
            canMoveRight={position < generator.members.length - 1}
            onRemove={() => generator.removeMember(position)}
            onMoveLeft={() => generator.moveMember(position, -1)}
            onMoveRight={() => generator.moveMember(position, 1)}
          />
        ))}
        {generator.canAdd && (
          <button
            type="button"
            onClick={generator.addMember}
            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-hhg-rule font-mono text-2xl text-hhg-ink-soft hover:border-hhg-pink hover:text-hhg-pink"
            aria-label="Add a crew member"
          >
            +
          </button>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Field label="Team name" value={generator.teamName} onChange={generator.setTeamName} placeholder="Your Crew" />
        <ClassChip label={generator.classLabel} onReroll={generator.rerollClass} />
      </div>

      {generator.dataUrl ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- this is the render output itself, not an optimizable asset */}
          <img
            src={generator.dataUrl}
            alt="Your HH Goa 2026 Crew Card, ready to download"
            width={1600}
            height={900}
            className={`aspect-[16/9] w-full rounded-[20px] ${playReveal ? 'reveal' : ''}`}
            onAnimationEnd={() => setPlayReveal(false)}
          />
          {generator.renderError && (
            <p className="font-mono text-xs text-hhg-ink-soft">{generator.renderError}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={generator.download}
              style={{ '--stagger-index': 1 } as CSSProperties}
              className="reveal-item rounded-full bg-hhg-pink px-7 py-3.5 font-mono text-[15px] font-bold uppercase tracking-[0.10em] text-hhg-cream shadow-[6px_6px_0_var(--hhg-green-deep)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_var(--hhg-green-deep)]"
            >
              Download PNG
            </button>
            <ShareButton status={shareStatus} onShare={onShare} staggerIndex={1} />
          </div>
        </div>
      ) : (
        <p className="text-center font-mono text-xs tracking-[0.04em] text-hhg-ink-soft">
          {remaining > 0
            ? `Add a photo for ${remaining} more ${remaining === 1 ? 'member' : 'members'} to see the card.`
            : 'Building your card…'}
        </p>
      )}
      <Toast message={shareStatus === 'saved-only' ? 'Saved your PNG. Attach it to the post.' : null} />
    </div>
  )
}
