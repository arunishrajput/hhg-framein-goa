'use client'

/**
 * Format B state: the photo pipeline plus Name/Stack-Role/Handle fields and the Builder Class
 * chip, assembled into a BuilderIdSpec and rendered on a 120ms trailing debounce while typing
 * (docs/04 §3) — except the very first render once a photo lands, which fires immediately so the
 * placeholder-filled preview shows up instantly (docs/05 P3: "never gate the preview behind the
 * form").
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { render, type BuilderIdSpec } from '@/lib/render'
import { usePhotoPipeline } from './usePhotoPipeline'
import { builderClass, classFromSeed, reroll } from '@/lib/identity/builderClass'
import { builderId } from '@/lib/identity/builderId'
import { buildCaption } from '@/lib/share/xIntent'

const PLACEHOLDER_NAME = 'Your Name'
const PLACEHOLDER_ROLE = 'Your Stack · Role'
const DEBOUNCE_MS = 120

function slugify(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'builder'
  )
}

export function useBuilderIdGenerator() {
  const photo = usePhotoPipeline()

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [handle, setHandle] = useState('')
  const [classSeed, setClassSeed] = useState(() => builderClass('', '').seed)

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  const dataUrlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderSeqRef = useRef(0)
  const hasRenderedOnceRef = useRef(false)

  // Deterministic from name + handle (docs/06 P3). Any manual reroll is a temporary override on
  // top of that base — the next identity edit supersedes it, same as typing a new name should.
  useEffect(() => {
    setClassSeed(builderClass(name, handle).seed)
  }, [name, handle])

  const classLabel = useMemo(() => classFromSeed(classSeed).label, [classSeed])

  const rerollClass = useCallback(() => {
    setClassSeed((seed) => reroll(seed).seed)
  }, [])

  useEffect(() => {
    const bitmap = photo.state.bitmap
    const focal = photo.state.focal
    if (!bitmap || !focal) return

    function doRender() {
      const seq = ++renderSeqRef.current
      const spec: BuilderIdSpec = {
        format: 'id',
        photo: bitmap!,
        focal: focal!,
        name: name.trim() || PLACEHOLDER_NAME,
        role: role.trim() || PLACEHOLDER_ROLE,
        handle: handle.trim() || undefined,
        builderClass: classFromSeed(classSeed).label,
        builderId: builderId(name || 'placeholder', handle),
      }
      render(spec).then(
        (result) => {
          if (seq !== renderSeqRef.current) {
            URL.revokeObjectURL(result.dataUrl) // superseded before this one resolved
            return
          }
          if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
          dataUrlRef.current = result.dataUrl
          setDataUrl(result.dataUrl)
          setBlob(result.blob)
          setRenderError(null)
        },
        () => setRenderError("That card didn't render. Try again."),
      )
    }

    if (!hasRenderedOnceRef.current) {
      hasRenderedOnceRef.current = true
      doRender()
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(doRender, DEBOUNCE_MS)
  }, [photo.state.bitmap, photo.state.focal, name, role, handle, classSeed])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (dataUrlRef.current) URL.revokeObjectURL(dataUrlRef.current)
    }
  }, [])

  const download = useCallback(() => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `hhgoa-2026-id-${slugify(name)}.png`
    a.click()
  }, [dataUrl, name])

  // Mirrors the fallback the render spec itself uses, so a shared caption never names someone
  // differently than the card in the same PNG does.
  const displayName = name.trim() || PLACEHOLDER_NAME
  const caption = useMemo(
    () => buildCaption({ format: 'id', name: displayName, builderClass: classLabel }),
    [displayName, classLabel],
  )

  return {
    photoStatus: photo.state.status,
    photoDetail: photo.state.detail,
    photoError: photo.state.error,
    loadFile: photo.loadFile,
    adjustFocal: photo.adjustFocal,
    focal: photo.state.focal,
    name,
    setName,
    role,
    setRole,
    handle,
    setHandle,
    classLabel,
    rerollClass,
    dataUrl,
    blob,
    renderError,
    download,
    caption,
    filename: `hhgoa-2026-id-${slugify(name)}.png`,
  }
}
