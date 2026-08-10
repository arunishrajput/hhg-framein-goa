'use client'

/**
 * Everything the DropZone shows once a photo has landed: the decode/frame skeleton, the ready
 * result with its one-time reveal, and the error state. Never styles a stand-in for the output —
 * the <img> src is always the real render() PNG (CLAUDE.md §5).
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { RingMark } from './RingMark'
import { AdjustDrawer } from './AdjustDrawer'
import { ShareButton } from './ShareButton'
import { Toast } from './Toast'
import type { GeneratorState } from '@/lib/generator/useGenerator'
import type { Focal } from '@/lib/render/primitives'
import type { ShareStatus } from '@/lib/share/useShare'

export function ResultPreview({
  state,
  onDownload,
  adjustFocal,
  onShare,
  shareStatus,
}: {
  state: GeneratorState
  onDownload: () => void
  adjustFocal: (partial: Partial<Focal>) => void
  onShare: () => void
  shareStatus: ShareStatus
}) {
  const [playReveal, setPlayReveal] = useState(false)
  const prevStatusRef = useRef(state.status)

  useEffect(() => {
    if (state.status === 'ready' && prevStatusRef.current !== 'ready') {
      setPlayReveal(true)
    }
    prevStatusRef.current = state.status
  }, [state.status])

  if (state.status === 'error') {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-hhg-rule bg-hhg-cream px-8 py-10 text-center">
        <p className="font-mono text-[15px] leading-[1.55] text-hhg-ink">{state.error}</p>
      </div>
    )
  }

  if (state.status === 'ready' && state.dataUrl && state.focal) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-[360px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- this is the render output itself, not an optimizable asset */}
          <img
            src={state.dataUrl}
            alt="Your HH Goa 2026 PFP frame, ready to download"
            width={1024}
            height={1024}
            className={`aspect-square w-full ${playReveal ? 'reveal' : ''}`}
            onAnimationEnd={() => setPlayReveal(false)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDownload}
            style={{ '--stagger-index': 1 } as CSSProperties}
            className="reveal-item rounded-full bg-hhg-pink px-7 py-3.5 font-mono text-[18px] font-bold uppercase tracking-[0.10em] text-hhg-cream shadow-[6px_6px_0_var(--hhg-green-deep)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_var(--hhg-green-deep)]"
          >
            Download PNG
          </button>
          <ShareButton status={shareStatus} onShare={onShare} staggerIndex={1} />
        </div>

        <AdjustDrawer focal={state.focal} onChange={adjustFocal} />
        <Toast message={shareStatus === 'saved-only' ? 'Saved your PNG. Attach it to the post.' : null} />
      </div>
    )
  }

  // decoding | framing — the ring is already on screen, so nothing animates in. Only the HEIC
  // conversion gets a status line; everything else stays silent (docs/01 flow, docs/02 §7).
  return (
    <div className="flex aspect-square w-full max-w-[360px] flex-col items-center justify-center gap-4 rounded-[20px] bg-hhg-cream-2">
      <RingMark className="h-28 w-28 shrink-0" />
      {state.detail && (
        <p className="font-mono text-xs tracking-[0.04em] text-hhg-ink-soft">{state.detail}</p>
      )}
    </div>
  )
}
