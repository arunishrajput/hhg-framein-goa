'use client'

/**
 * Dev-only render grid — every artboard × every fixture, with an r=512 mask overlay toggle to
 * verify nothing crosses the X profile-picture circular crop. Never shipped: gated on NODE_ENV.
 *
 * Runs the real pipeline (decodeImage -> autoframe -> render), not a hand-picked focal point —
 * this grid *is* the P2 exit-criterion evidence (docs/05): all six docs/03 §5 fixtures framing
 * acceptably with zero manual input.
 */
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { render, type CardSpec } from '@/lib/render'
import { decodeImage } from '@/lib/image/decode'
import { autoframe, warmAutoframe } from '@/lib/image/autoframe'

if (process.env.NODE_ENV === 'production') {
  notFound()
}

const FIXTURES = [
  'portrait-tight.jpg',
  'landscape-wide.jpg',
  'square-group.jpg',
  'low-res.png',
  'huge.jpg',
  'heic-sample.heic',
] as const

const FORMATS: CardSpec['format'][] = ['pfp']

interface Cell {
  format: CardSpec['format']
  fixture: string
  dataUrl: string | null
  error: string | null
  focal: { x: number; y: number } | null
}

function cellKey(format: string, fixture: string) {
  return `${format}::${fixture}`
}

export default function LabPage() {
  const [cells, setCells] = useState<Map<string, Cell>>(() => {
    const initial = new Map<string, Cell>()
    for (const format of FORMATS) {
      for (const fixture of FIXTURES) {
        initial.set(cellKey(format, fixture), { format, fixture, dataUrl: null, error: null, focal: null })
      }
    }
    return initial
  })
  const [showMask, setShowMask] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      // In the real app, warmAutoframe() fires the moment the drop zone mounts — often seconds
      // before a photo lands, so the model is warm well before autoframe() ever races its 800ms
      // timeout. Awaiting it here puts every fixture on that same steady-state footing instead of
      // making the first one or two pay a cold CDN+WASM fetch inside their own timeout budget.
      await warmAutoframe()

      for (const fixture of FIXTURES) {
        let bitmap: ImageBitmap
        let focal: { x: number; y: number }
        try {
          const res = await fetch(`/fixtures/${fixture}`)
          const blob = await res.blob()
          bitmap = await decodeImage(blob) // the real pipeline: HEIC sniff, orientation, 2048px cap
          focal = await autoframe(bitmap) // the real face-or-fallback pipeline, not a hand-picked point
        } catch (err) {
          if (cancelled) return
          for (const format of FORMATS) {
            setCells((prev) => {
              const next = new Map(prev)
              next.set(cellKey(format, fixture), {
                format,
                fixture,
                dataUrl: null,
                error: `decode/autoframe failed: ${String(err)}`,
                focal: null,
              })
              return next
            })
          }
          continue
        }

        for (const format of FORMATS) {
          try {
            const spec = { format, photo: bitmap, focal } as CardSpec
            const { dataUrl } = await render(spec)
            if (cancelled) return
            setCells((prev) => {
              const next = new Map(prev)
              next.set(cellKey(format, fixture), { format, fixture, dataUrl, error: null, focal })
              return next
            })
          } catch (err) {
            if (cancelled) return
            setCells((prev) => {
              const next = new Map(prev)
              next.set(cellKey(format, fixture), {
                format,
                fixture,
                dataUrl: null,
                error: String(err),
                focal,
              })
              return next
            })
          }
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-neutral-900 p-6 font-mono text-sm text-neutral-100">
      <h1 className="text-lg font-bold">/lab — render grid</h1>
      <label className="mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={showMask}
          onChange={(e) => setShowMask(e.target.checked)}
        />
        overlay r=512 X profile-picture mask
      </label>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {Array.from(cells.values()).map((cell) => (
          <div key={cellKey(cell.format, cell.fixture)} className="rounded border border-neutral-700 p-3">
            <p className="mb-2 text-xs text-neutral-400">
              {cell.format} · {cell.fixture}
              {cell.focal && ` · focal (${cell.focal.x.toFixed(2)}, ${cell.focal.y.toFixed(2)})`}
            </p>
            <div className="relative aspect-square w-full max-w-[280px] bg-neutral-800">
              {cell.dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- this is the render output itself, not an optimizable asset
                <img src={cell.dataUrl} alt={`${cell.format} ${cell.fixture}`} className="h-full w-full" />
              )}
              {cell.error && <p className="p-2 text-red-400">{cell.error}</p>}
              {showMask && cell.dataUrl && (
                <svg
                  viewBox="0 0 1024 1024"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  <circle cx={512} cy={512} r={512} fill="none" stroke="red" strokeWidth={6} />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
