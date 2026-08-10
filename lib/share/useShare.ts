'use client'

/**
 * Client share orchestration (docs/04 §4c, CLAUDE.md §7). The one thing this hook must never get
 * wrong: on the link path, the blank tab is opened *synchronously* inside the caller's click
 * handler, before any `await`. Await first and Safari's popup blocker silently eats it — share
 * then does nothing on iPhone with no error at all (docs/04 R3). That's why `share()` takes an
 * already-decoded `Blob` (every generator hook already has one in memory) rather than fetching a
 * blob: URL itself — no await stands between the click and `window.open`.
 *
 * docs/10 D3 table, exactly:
 *   native share succeeds -> no download (file's already attached, a camera-roll dupe is hostile)
 *   link path             -> download first, always, before the upload starts
 *   upload fails          -> already downloaded; open the intent text-only + toast
 */
import { useCallback, useRef, useState } from 'react'
import { canShareFiles } from './webShare'
import { xIntentUrl } from './xIntent'
import type { Format } from '@/lib/render/tokens'

export type ShareStatus = 'idle' | 'sharing' | 'uploading' | 'shared' | 'saved-only'

export interface ShareMeta {
  format: Format
  name?: string
}

const RESET_DELAY_MS = 4000

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function postShare(blob: Blob, filename: string, meta: ShareMeta): Promise<{ id: string }> {
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('format', meta.format)
  if (meta.name) form.append('name', meta.name)

  const res = await fetch('/api/share', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`share upload failed: ${res.status}`)
  return res.json()
}

export function useShare() {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => setStatus('idle'), RESET_DELAY_MS)
  }, [])

  const share = useCallback(
    (blob: Blob, filename: string, caption: string, meta: ShareMeta) => {
      const file = new File([blob], filename, { type: 'image/png' })

      if (canShareFiles(file)) {
        setStatus('sharing')
        navigator.share({ files: [file], text: caption }).then(
          () => setStatus('idle'),
          () => setStatus('idle'), // cancelled or failed — respect it silently, no fallback popup
        )
        return
      }

      // Link path. Open the tab now, synchronously — see file header.
      const popup = window.open('about:blank', '_blank')

      downloadBlob(blob, filename)
      setStatus('uploading')

      postShare(blob, filename, meta).then(
        ({ id }) => {
          const shareUrl = `${window.location.origin}/s/${id}`
          if (popup) popup.location.href = xIntentUrl(caption, shareUrl)
          setStatus('shared')
          scheduleReset()
        },
        () => {
          if (popup) popup.location.href = xIntentUrl(caption)
          setStatus('saved-only')
          scheduleReset()
        },
      )
    },
    [scheduleReset],
  )

  return { share, status }
}
