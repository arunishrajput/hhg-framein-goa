/**
 * The pre-filled X caption per format (docs/08 §2) and the x.com/intent/post URL builder
 * (docs/04 §4c). `x.com`, never `twitter.com` — the old host adds a redirect hop (CLAUDE.md §10).
 *
 * Only the two hashtags are tokens here (EVENT.tag/tagAlt, docs/10 D4) — the surrounding copy is
 * the playbook's voice from docs/08, which this file exists to hold (CLAUDE.md §5 file map).
 */
import { EVENT } from '@/lib/render/tokens'

export type CaptionInput =
  | { format: 'pfp' }
  | { format: 'id'; name: string; builderClass: string }
  | { format: 'crew'; teamName: string }

const HASHTAGS = `${EVENT.tag} ${EVENT.tagAlt}`

export function buildCaption(input: CaptionInput): string {
  switch (input.format) {
    case 'pfp':
      return [
        'Locked in for Hacker House Goa 2026 🌴',
        '',
        "Made my frame in about 10 seconds — drop a photo, that's it.",
        'Make yours ↓',
        '',
        HASHTAGS,
      ].join('\n')
    case 'id':
      return [
        `${input.name} · ${input.builderClass}`,
        'HH Goa 2026 · 28–31 Oct · Goa',
        '',
        'Built a generator for these. Drop a photo, get your ID.',
        'Make yours ↓',
        '',
        HASHTAGS,
      ].join('\n')
    case 'crew':
      return [
        `${input.teamName}, assembled 🌴`,
        'HH Goa 2026 · 28–31 Oct',
        '',
        "One photo each, one card. Make your crew's ↓",
        '',
        HASHTAGS,
      ].join('\n')
  }
}

/**
 * `shareUrl` is optional so the upload-failed fallback can still open the intent with just the
 * caption text (docs/04 §4c, docs/10 D3) — the flow must never dead-end.
 */
export function xIntentUrl(caption: string, shareUrl?: string): string {
  const params = new URLSearchParams({ text: caption })
  if (shareUrl) params.set('url', shareUrl)
  return `https://x.com/intent/post?${params.toString()}`
}
