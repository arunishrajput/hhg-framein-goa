'use client'

/**
 * Collapsed-by-default pan/zoom override on top of auto-frame. docs/01 F2, docs/05 P2. Dumb —
 * only ever calls back with a partial Focal; lib/generator owns what that does to the render.
 */
import { useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import type { Focal } from '@/lib/render/primitives'

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const KEY_ZOOM_STEP = 0.05
const KEY_PAN_STEP = 0.02

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function AdjustDrawer({
  focal,
  onChange,
}: {
  focal: Focal
  onChange: (partial: Partial<Focal>) => void
}) {
  const [open, setOpen] = useState(false)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastMid = useRef<{ x: number; y: number } | null>(null)
  const lastDist = useRef<number | null>(null)

  const zoom = focal.zoom ?? 1

  function surfaceSize(): number {
    const rect = surfaceRef.current?.getBoundingClientRect()
    return rect ? Math.max(1, Math.min(rect.width, rect.height)) : 1
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some input sources (synthetic events, certain touch edge cases) never register a capture-
      // able pointer session — panning still works without capture, just without the guarantee
      // that a fast drag stays bound to this element if the cursor leaves it.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      lastDist.current = Math.hypot(a.x - b.x, a.y - b.y)
      lastMid.current = null
    } else {
      lastMid.current = { x: e.clientX, y: e.clientY }
      lastDist.current = null
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (lastDist.current != null && lastDist.current > 0) {
        onChange({ zoom: clamp(zoom * (dist / lastDist.current), ZOOM_MIN, ZOOM_MAX) })
      }
      lastDist.current = dist
      return
    }

    if (lastMid.current) {
      const size = surfaceSize()
      const dx = (e.clientX - lastMid.current.x) / size / zoom
      const dy = (e.clientY - lastMid.current.y) / size / zoom
      onChange({ x: focal.x - dx, y: focal.y - dy })
    }
    lastMid.current = { x: e.clientX, y: e.clientY }
  }

  function endPointer(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId)
    lastDist.current = null
    const remaining = Array.from(pointers.current.values())
    lastMid.current = remaining.length === 1 ? remaining[0] : null
  }

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault()
    onChange({ zoom: clamp(zoom * (1 - e.deltaY * 0.001), ZOOM_MIN, ZOOM_MAX) })
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowLeft':
        onChange({ x: focal.x - KEY_PAN_STEP })
        break
      case 'ArrowRight':
        onChange({ x: focal.x + KEY_PAN_STEP })
        break
      case 'ArrowUp':
        onChange({ y: focal.y - KEY_PAN_STEP })
        break
      case 'ArrowDown':
        onChange({ y: focal.y + KEY_PAN_STEP })
        break
      case '+':
      case '=':
        onChange({ zoom: clamp(zoom + KEY_ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
        break
      case '-':
        onChange({ zoom: clamp(zoom - KEY_ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
        break
      default:
        return
    }
    e.preventDefault()
  }

  return (
    <div className="reveal-item" style={{ '--stagger-index': 2 } as CSSProperties}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-mono text-xs font-bold uppercase tracking-[0.10em] text-hhg-ink-soft hover:text-hhg-ink"
      >
        {open ? '▾' : '▸'} Adjust
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <div
            ref={surfaceRef}
            role="group"
            aria-label="Drag to reposition the photo. Scroll, pinch, or use arrow and +/- keys to zoom."
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            className="flex h-16 w-full cursor-grab touch-none items-center justify-center rounded-md border-2 border-hhg-rule bg-hhg-cream-2 font-mono text-xs text-hhg-ink-soft outline-none focus-visible:border-hhg-green focus-visible:outline focus-visible:outline-3 focus-visible:outline-hhg-yellow focus-visible:outline-offset-2 active:cursor-grabbing"
          >
            drag to pan · scroll or pinch to zoom
          </div>

          <label className="flex items-center gap-3 font-mono text-xs text-hhg-ink-soft">
            Zoom
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              onChange={(e) => onChange({ zoom: Number(e.target.value) })}
              className="w-full accent-hhg-green"
            />
          </label>
        </div>
      )}
    </div>
  )
}
