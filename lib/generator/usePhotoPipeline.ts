'use client'

/**
 * The decode -> auto-frame -> adjust pipeline for a single photo slot, shared by the Builder ID
 * form (one slot) and the Crew form (2-4 slots) so neither duplicates it. Deliberately does *not*
 * call render() or own any dataUrl/blob — this hook's job ends at "here is a ready bitmap +
 * focal," and it's cheap/unthrottled to update, so pan/zoom drags stay responsive. Whoever
 * consumes bitmap+focal (a CardSpec-assembling hook) owns the render throttle.
 *
 * PFP's own useGenerator.ts predates this file and keeps its self-contained pipeline+render
 * combo as shipped in P2 — not worth the regression risk of retrofitting it onto this hook for a
 * purely cosmetic dedupe (same call made for pfp.ts's renderer and ring.ts in P3).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Focal } from '@/lib/render/primitives'
import { decodeImage, DecodeError, DECODE_ERROR } from '@/lib/image/decode'
import { autoframe, warmAutoframe } from '@/lib/image/autoframe'

export type PhotoStatus = 'idle' | 'decoding' | 'framing' | 'ready' | 'error'

export interface PhotoPipelineState {
  status: PhotoStatus
  bitmap: ImageBitmap | null
  focal: Focal | null
  error: string | null
  /** e.g. "Converting iPhone photo…" while status === 'decoding'. docs/02 §7. */
  detail: string | null
}

type Action =
  | { type: 'DECODE_START' }
  | { type: 'CONVERTING' }
  | { type: 'FRAME_START' }
  | { type: 'READY'; bitmap: ImageBitmap; focal: Focal }
  | { type: 'ADJUSTED'; focal: Focal }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: PhotoPipelineState = {
  status: 'idle',
  bitmap: null,
  focal: null,
  error: null,
  detail: null,
}

function reducer(state: PhotoPipelineState, action: Action): PhotoPipelineState {
  switch (action.type) {
    case 'DECODE_START':
      return { ...initialState, status: 'decoding' }
    case 'CONVERTING':
      return { ...state, status: 'decoding', detail: 'Converting iPhone photo…' }
    case 'FRAME_START':
      return { ...state, status: 'framing', detail: null }
    case 'READY':
      return { status: 'ready', bitmap: action.bitmap, focal: action.focal, error: null, detail: null }
    case 'ADJUSTED':
      return { ...state, focal: action.focal }
    case 'ERROR':
      return { status: 'error', bitmap: null, focal: null, error: action.message, detail: null }
    case 'RESET':
      return initialState
  }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

export function usePhotoPipeline() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const bitmapRef = useRef<ImageBitmap | null>(null)
  const focalRef = useRef<Focal | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    warmAutoframe() // speculative — by the time a photo lands the model is usually warm
  }, [])

  useEffect(() => {
    focalRef.current = state.focal
  }, [state.focal])

  useEffect(() => {
    return () => {
      bitmapRef.current?.close()
    }
  }, [])

  const loadFile = useCallback(async (file: File) => {
    const requestId = ++requestIdRef.current

    bitmapRef.current?.close()
    bitmapRef.current = null
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

    bitmapRef.current = bitmap
    dispatch({ type: 'READY', bitmap, focal })
  }, [])

  const adjustFocal = useCallback((partial: Partial<Focal>) => {
    const current = focalRef.current
    if (!current || !bitmapRef.current) return

    dispatch({
      type: 'ADJUSTED',
      focal: {
        x: clamp01(partial.x ?? current.x),
        y: clamp01(partial.y ?? current.y),
        zoom: Math.max(1, Math.min(3, partial.zoom ?? current.zoom ?? 1)),
      },
    })
  }, [])

  const reset = useCallback(() => {
    requestIdRef.current++
    bitmapRef.current?.close()
    bitmapRef.current = null
    dispatch({ type: 'RESET' })
  }, [])

  return { state, loadFile, adjustFocal, reset }
}
