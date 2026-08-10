'use client'

/**
 * The one file-intake surface: click, drag-drop, paste, mobile camera/gallery. Always listening
 * regardless of pipeline state, so a photo can be swapped by dropping a new one straight onto the
 * result. Visual content is owned by the caller — this component only ever touches the DOM
 * events, never canvas logic (CLAUDE.md §5: components stay dumb).
 */
import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { RingMark } from './RingMark'
import type { GeneratorStatus } from '@/lib/generator/useGenerator'

export function DropZone({
  status,
  onFile,
  children,
}: {
  status: GeneratorStatus
  onFile: (file: File) => void
  children?: ReactNode
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const isIdle = status === 'idle'

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find(
        (it) => it.kind === 'file' && it.type.startsWith('image/'),
      )
      const file = item?.getAsFile()
      if (file) onFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onFile])

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={
          isIdle
            ? undefined
            : `rounded-[20px] transition-[outline] ${dragOver ? 'outline-2 outline-dashed outline-hhg-pink outline-offset-4' : ''}`
        }
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = '' // so re-picking the same file still fires onChange
          }}
        />

        {isIdle ? (
          <label
            htmlFor={inputId}
            className={`group flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed px-8 py-10 text-center transition-colors ${
              dragOver
                ? 'border-hhg-pink bg-hhg-cream-2'
                : 'border-hhg-rule bg-hhg-cream hover:border-hhg-pink hover:bg-hhg-cream-2'
            }`}
          >
            <RingMark className="h-28 w-28 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[15px] leading-[1.55] text-hhg-ink">
                Drop a photo. Any size, any crop.
              </p>
              <p className="font-mono text-xs tracking-[0.04em] text-hhg-ink-soft">
                JPG, PNG, WebP or HEIC
              </p>
            </div>
          </label>
        ) : (
          children
        )}
      </div>

      {!isIdle && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 font-mono text-xs tracking-[0.04em] text-hhg-ink-soft underline decoration-hhg-rule underline-offset-4 hover:text-hhg-ink"
        >
          Replace photo
        </button>
      )}

      <p className="mt-4 text-center font-mono text-xs leading-[1.4] tracking-[0.04em] text-hhg-ink-soft">
        Your photo stays in your browser. Nothing is uploaded until you post.
      </p>
    </div>
  )
}
