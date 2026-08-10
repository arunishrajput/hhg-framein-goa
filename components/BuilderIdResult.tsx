'use client'

/**
 * Everything the DropZone shows once a photo has landed for Format B: the decode/frame skeleton,
 * the ready result (image + live form beside it, per docs/01's flow diagram — fields never gate
 * the preview), and the error state.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { RingMark } from './RingMark'
import { AdjustDrawer } from './AdjustDrawer'
import { Field } from './Field'
import { ClassChip } from './ClassChip'
import { ShareButton } from './ShareButton'
import { Toast } from './Toast'
import type { useBuilderIdGenerator } from '@/lib/generator/useBuilderIdGenerator'
import type { ShareStatus } from '@/lib/share/useShare'

export function BuilderIdResult({
  generator,
  onShare,
  shareStatus,
}: {
  generator: ReturnType<typeof useBuilderIdGenerator>
  onShare: () => void
  shareStatus: ShareStatus
}) {
  const [playReveal, setPlayReveal] = useState(false)
  const prevStatusRef = useRef(generator.photoStatus)

  useEffect(() => {
    if (generator.photoStatus === 'ready' && prevStatusRef.current !== 'ready') {
      setPlayReveal(true)
    }
    prevStatusRef.current = generator.photoStatus
  }, [generator.photoStatus])

  if (generator.photoStatus === 'error') {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-hhg-rule bg-hhg-cream px-8 py-10 text-center">
        <p className="font-mono text-[15px] leading-[1.55] text-hhg-ink">{generator.photoError}</p>
      </div>
    )
  }

  if (generator.photoStatus === 'ready' && generator.dataUrl && generator.focal) {
    return (
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="mx-auto w-full max-w-[340px] md:sticky md:top-6 md:mx-0 md:w-[58%] md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- this is the render output itself, not an optimizable asset */}
          <img
            src={generator.dataUrl}
            alt="Your HH Goa 2026 Builder ID, ready to download"
            width={1600}
            height={2000}
            className={`aspect-[4/5] w-full rounded-[20px] ${playReveal ? 'reveal' : ''}`}
            onAnimationEnd={() => setPlayReveal(false)}
          />
        </div>

        <div className="flex w-full flex-col gap-4 md:w-[42%]">
          <div
            style={{ '--stagger-index': 0 } as CSSProperties}
            className="reveal-item flex flex-col gap-4"
          >
            <Field label="Name" value={generator.name} onChange={generator.setName} placeholder="Your name" />
            <Field
              label="Stack / Role"
              value={generator.role}
              onChange={generator.setRole}
              placeholder="Full-stack · Embedded"
            />
            <Field
              label="X handle (optional)"
              value={generator.handle}
              onChange={generator.setHandle}
              placeholder="yourhandle"
            />
          </div>

          <div style={{ '--stagger-index': 1 } as CSSProperties} className="reveal-item">
            <ClassChip label={generator.classLabel} onReroll={generator.rerollClass} />
          </div>

          {generator.renderError && (
            <p className="font-mono text-xs text-hhg-ink-soft">{generator.renderError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generator.download}
              style={{ '--stagger-index': 2 } as CSSProperties}
              className="reveal-item rounded-full bg-hhg-pink px-7 py-3.5 font-mono text-[18px] font-bold uppercase tracking-[0.10em] text-hhg-cream shadow-[6px_6px_0_var(--hhg-green-deep)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_var(--hhg-green-deep)]"
            >
              Download PNG
            </button>
            <ShareButton status={shareStatus} onShare={onShare} staggerIndex={2} />
          </div>

          <AdjustDrawer focal={generator.focal} onChange={generator.adjustFocal} />
        </div>
        <Toast message={shareStatus === 'saved-only' ? 'Saved your PNG. Attach it to the post.' : null} />
      </div>
    )
  }

  // decoding | framing — same silent skeleton as Format A (docs/01 flow, docs/02 §7)
  return (
    <div className="flex aspect-[4/5] w-full max-w-[340px] flex-col items-center justify-center gap-4 rounded-[20px] bg-hhg-cream-2">
      <RingMark className="h-28 w-28 shrink-0" />
      {generator.photoDetail && (
        <p className="font-mono text-xs tracking-[0.04em] text-hhg-ink-soft">{generator.photoDetail}</p>
      )}
    </div>
  )
}
