'use client'

/**
 * The Secondary button from docs/02 §5 (cream fill, 2px green border, green text, same press
 * behaviour as Primary) doing the one thing docs/02 §7's voice table asks for: "Share" -> "Post
 * on X". Dumb — the click just forwards to whatever useShare().share the caller already bound.
 */
import type { CSSProperties } from 'react'
import type { ShareStatus } from '@/lib/share/useShare'

export function ShareButton({
  status,
  onShare,
  staggerIndex,
}: {
  status: ShareStatus
  onShare: () => void
  staggerIndex?: number
}) {
  const busy = status === 'sharing' || status === 'uploading'
  const label = status === 'uploading' ? 'Uploading…' : 'Post on X'

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      style={staggerIndex != null ? ({ '--stagger-index': staggerIndex } as CSSProperties) : undefined}
      className={`${staggerIndex != null ? 'reveal-item ' : ''}rounded-full border-2 border-hhg-green bg-hhg-cream px-7 py-3.5 font-mono text-[15px] font-bold uppercase tracking-[0.10em] text-hhg-green shadow-[6px_6px_0_var(--hhg-green-deep)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_var(--hhg-green-deep)] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {label}
    </button>
  )
}
