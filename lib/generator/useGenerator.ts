'use client'

/**
 * The one `useReducer` this product needs (CLAUDE.md §4). Owns the whole photo pipeline for
 * Format A: decode -> auto-frame -> render, plus the manual "Adjust" override on top of it.
 *
 * States follow docs/05 P2 exactly: idle -> decoding -> framing -> ready -> error.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { render } from '@/lib/render'
import type { Focal } from '@/lib/render/primitives'
import { decodeImage, DecodeError, DECODE_ERROR } from '@/lib/image/decode'
import { autoframe, warmAutoframe } from '@/lib/image/autoframe'

export type GeneratorStatus = 'idle' | 'decoding' | 'framing' | 'ready' | 'error'

export interface GeneratorState {
  status: GeneratorStatus
  focal: Focal | null
  dataUrl: string | null
  blob: Blob | null
  error: string | null
  /** e.g. "Converting iPhone photo…" while status === 'decoding'. docs/02 §7. */
  detail: string | null
}

type Action =
  | { type: 'DECODE_START' }
  | { type: 'CONVERTING' }
  | { type: 'FRAME_START' }
  | { type: 'RENDERED'; focal: Focal; dataUrl: string; blob: Blob }
  | { type: 'ADJUSTED'; focal: Focal; dataUrl: string; blob: Blob }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: GeneratorState = {
  status: 'idle',
  focal: null,
  dataUrl: null,
  blob: null,
  error: null,
  detail: null,
}

function reducer(state: GeneratorState, action: Action): GeneratorState {
  switch (action.type) {
    case 'DECODE_START':
      return { ...initialState, status: 'decoding' }
    case 'CONVERTING':
      return { ...state, status: 'decoding', detail: 'Converting iPhone photo…' }
    case 'FRAME_START':
      return { ...state, status: 'framing', detail: null }
    case 'RENDERED':
      return {
        status: 'ready',
        focal: action.focal,
        dataUrl: action.dataUrl,
        blob: action.blob,
        error: null,
        detail: null,
      }
    case 'ADJUSTED':
      return { ...state, focal: action.focal, dataUrl: action.dataUrl, blob: action.blob }
    case 'ERROR':
      return { status: 'error', focal: null, dataUrl: null, blob: null, error: action.message, detail: null }
    case 'RESET':
      return initialState
  }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

export function useGenerator() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Mutable pipeline plumbing that must never trigger a re-render on its own — object-URL and
  // in-flight-request bookkeeping lives in refs, not state (docs/04 §3: revoke on every re-render).
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const focalRef = useRef<Focal | null>(null)
  const dataUrlRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)
  const adjustSeqRef = useRef(0)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    warmAutoframe() // speculative — by the time a photo lands the model is usually warm
  }, [])

  useEffect(() => {
    return () => {
      if (throttleRef.current != null) clearTimeout(throttleRef.current)
      if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
      bitmapRef.current?.close()
    }
  }, [])

  const revokePrevious = useCallback(() => {
    if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
  }, [])

  const loadFile = useCallback(
    async (file: File) => {
      const requestId = ++requestIdRef.current

      bitmapRef.current?.close()
      bitmapRef.current = null
      focalRef.current = null
      revokePrevious() // whatever was on screen (or mid-render) for the last file is gone now
      dataUrlRef.current = null
      dispatch({ type: 'DECODE_START' })

      let bitmap: ImageBitmap
      try {
        bitmap = await decodeImage(file, {
          onHeicDetected: () => {
            if (requestId === requestIdRef.current) dispatch({ type: 'CONVERTING' })
          },
        })
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        const message = err instanceof DecodeError ? err.message : DECODE_ERROR.unreadable
        dispatch({ type: 'ERROR', message })
        return
      }

      if (requestId !== requestIdRef.current) {
        bitmap.close() // a newer file landed while this one was decoding
        return
      }

      dispatch({ type: 'FRAME_START' })
      const focal = await autoframe(bitmap)

      if (requestId !== requestIdRef.current) {
        bitmap.close()
        return
      }

      try {
        const { blob, dataUrl } = await render({ format: 'pfp', photo: bitmap, focal })
        if (requestId !== requestIdRef.current) {
          URL.revokeObjectURL(dataUrl)
          bitmap.close()
          return
        }
        revokePrevious()
        bitmapRef.current = bitmap
        focalRef.current = focal
        dataUrlRef.current = dataUrl
        dispatch({ type: 'RENDERED', focal, dataUrl, blob })
      } catch {
        bitmap.close()
        dispatch({ type: 'ERROR', message: "That photo didn't render. Try a different one." })
      }
    },
    [revokePrevious],
  )

  /**
   * Manual pan/zoom from the Adjust drawer. Throttled to one render in flight per ~frame.
   * setTimeout, not requestAnimationFrame — rAF callbacks are suspended for as long as the
   * document stays hidden/unfocused, which would permanently wedge this throttle (the flag it
   * sets never gets cleared) the moment a tab loses focus mid-drag.
   */
  const adjustFocal = useCallback(
    (partial: Partial<Focal>) => {
      const bitmap = bitmapRef.current
      const current = focalRef.current
      if (!bitmap || !current) return

      const next: Focal = {
        x: clamp01(partial.x ?? current.x),
        y: clamp01(partial.y ?? current.y),
        zoom: Math.max(1, Math.min(3, partial.zoom ?? current.zoom ?? 1)),
      }
      focalRef.current = next

      if (throttleRef.current != null) return // already queued — it'll pick up focalRef.current
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null
        const seq = ++adjustSeqRef.current
        const f = focalRef.current
        const bmp = bitmapRef.current
        if (!f || !bmp) return

        render({ format: 'pfp', photo: bmp, focal: f }).then(
          ({ blob, dataUrl }) => {
            if (seq !== adjustSeqRef.current) {
              URL.revokeObjectURL(dataUrl) // superseded by a later adjust before this one resolved
              return
            }
            revokePrevious()
            dataUrlRef.current = dataUrl
            dispatch({ type: 'ADJUSTED', focal: f, dataUrl, blob })
          },
          () => {}, // adjust re-renders fail silently — the last good preview stays on screen
        )
      }, 16)
    },
    [revokePrevious],
  )

  const reset = useCallback(() => {
    requestIdRef.current++
    if (throttleRef.current != null) clearTimeout(throttleRef.current)
    throttleRef.current = null
    if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
    dataUrlRef.current = null
    bitmapRef.current?.close()
    bitmapRef.current = null
    focalRef.current = null
    dispatch({ type: 'RESET' })
  }, [])

  const download = useCallback(() => {
    if (!state.dataUrl) return
    const a = document.createElement('a')
    a.href = state.dataUrl
    a.download = 'hhgoa-2026-pfp.png'
    a.click()
  }, [state.dataUrl])

  return { state, loadFile, adjustFocal, reset, download }
}
