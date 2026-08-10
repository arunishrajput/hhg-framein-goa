'use client'

/**
 * Dev-only render grid — every artboard × every fixture, with an r=512 mask overlay toggle to
 * verify nothing crosses the X profile-picture circular crop. Never shipped: gated on NODE_ENV.
 *
 * Runs the real pipeline (decodeImage -> autoframe -> render), not a hand-picked focal point —
 * this grid *is* the P2 exit-criterion evidence (docs/05): all six docs/03 §5 fixtures framing
 * acceptably with zero manual input. P3 adds Formats B and C plus the text-stress case docs/03 §5
 * calls for: nothing may overflow on any of the three artboards.
 */
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { render, type CardSpec, type CrewMember } from '@/lib/render'
import { ARTBOARD } from '@/lib/render/tokens'
import type { Focal } from '@/lib/render/primitives'
import { decodeImage } from '@/lib/image/decode'
import { autoframe, warmAutoframe } from '@/lib/image/autoframe'
import { builderClass } from '@/lib/identity/builderClass'
import { builderId, crewId } from '@/lib/identity/builderId'

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

const TEXT_STRESS_NAME = 'Bartholomew Vengeance Chatterjee-Rao'
const TEXT_STRESS_ROLE = 'Distributed Systems · Rust · Zero-Knowledge Proofs'
const TEXT_STRESS_TEAM = 'The Extraordinarily Long-Winded Nether Navigator Collective'

interface Photo {
  bitmap: ImageBitmap
  focal: Focal
}

interface Cell {
  key: string
  format: CardSpec['format']
  label: string
  dataUrl: string | null
  error: string | null
}

async function loadPhoto(fixture: string): Promise<Photo> {
  const res = await fetch(`/fixtures/${fixture}`)
  const blob = await res.blob()
  const bitmap = await decodeImage(blob)
  const focal = await autoframe(bitmap)
  return { bitmap, focal }
}

export default function LabPage() {
  const [cells, setCells] = useState<Cell[]>([])
  const [showMask, setShowMask] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      await warmAutoframe() // see docs/05 P2 notes — puts every fixture on the same warm footing

      const photos = new Map<string, Photo>()
      for (const fixture of FIXTURES) {
        try {
          photos.set(fixture, await loadPhoto(fixture))
        } catch (err) {
          if (cancelled) return
          setCells((prev) => [
            ...prev,
            { key: `pfp::${fixture}`, format: 'pfp', label: fixture, dataUrl: null, error: String(err) },
          ])
        }
      }
      if (cancelled) return

      async function addCell(key: string, format: CardSpec['format'], label: string, spec: CardSpec) {
        try {
          const { dataUrl } = await render(spec)
          if (cancelled) return
          setCells((prev) => [...prev, { key, format, label, dataUrl, error: null }])
        } catch (err) {
          if (cancelled) return
          setCells((prev) => [...prev, { key, format, label, dataUrl: null, error: String(err) }])
        }
      }

      // Format A + B against every fixture
      for (const fixture of FIXTURES) {
        const photo = photos.get(fixture)
        if (!photo) continue

        await addCell(`pfp::${fixture}`, 'pfp', fixture, {
          format: 'pfp',
          photo: photo.bitmap,
          focal: photo.focal,
        })

        const name = 'Arunish Kumar'
        const handle = 'arunishrajput'
        await addCell(`id::${fixture}`, 'id', fixture, {
          format: 'id',
          photo: photo.bitmap,
          focal: photo.focal,
          name,
          role: 'Full-stack · Embedded',
          handle,
          builderClass: builderClass(name, handle).label,
          builderId: builderId(name, handle),
        })
      }

      // Format B text-stress case — docs/03 §5
      const stressPhoto = photos.get('portrait-tight.jpg')
      if (stressPhoto) {
        await addCell('id::text-stress', 'id', 'TEXT STRESS', {
          format: 'id',
          photo: stressPhoto.bitmap,
          focal: stressPhoto.focal,
          name: TEXT_STRESS_NAME,
          role: TEXT_STRESS_ROLE,
          handle: 'a-very-long-handle-for-testing',
          builderClass: builderClass(TEXT_STRESS_NAME, '@stress').label,
          builderId: builderId(TEXT_STRESS_NAME, '@stress'),
        })
      }

      // Format C — n=2,3,4, reusing the decoded fixtures as crew members
      const order = FIXTURES.filter((f) => photos.has(f))
      function membersFor(fixtures: string[]): CrewMember[] {
        return fixtures.map((f, i) => {
          const photo = photos.get(f)!
          return { photo: photo.bitmap, focal: photo.focal, name: `Member ${i + 1}` }
        })
      }

      for (const n of [2, 3, 4]) {
        const fixtures = order.slice(0, n)
        if (fixtures.length < n) continue
        const teamName = 'Nether Navigator'
        const memberNames = fixtures.map((_, i) => `Member ${i + 1}`)
        await addCell(`crew::n${n}`, 'crew', `crew n=${n}`, {
          format: 'crew',
          teamName,
          crewClass: builderClass(teamName, `crew-${n}`).label,
          crewId: crewId(teamName, memberNames),
          members: membersFor(fixtures),
        })
      }

      // Format C text-stress case
      const stressFixtures = order.slice(0, 4)
      if (stressFixtures.length === 4) {
        const members = membersFor(stressFixtures)
        members[0] = { ...members[0], name: TEXT_STRESS_NAME }
        await addCell('crew::text-stress', 'crew', 'crew TEXT STRESS', {
          format: 'crew',
          teamName: TEXT_STRESS_TEAM,
          crewClass: builderClass(TEXT_STRESS_TEAM, 'stress').label,
          crewId: crewId(TEXT_STRESS_TEAM, members.map((m) => m.name)),
          members,
        })
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
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
        overlay r=512 X profile-picture mask (Format A only)
      </label>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {cells.map((cell) => {
          const { w, h } = ARTBOARD[cell.format]
          return (
            <div key={cell.key} className="rounded border border-neutral-700 p-3">
              <p className="mb-2 text-xs text-neutral-400">
                {cell.format} · {cell.label}
              </p>
              <div
                className="relative w-full max-w-[320px] bg-neutral-800"
                style={{ aspectRatio: `${w} / ${h}` }}
              >
                {cell.dataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- this is the render output itself, not an optimizable asset
                  <img src={cell.dataUrl} alt={`${cell.format} ${cell.label}`} className="h-full w-full" />
                )}
                {cell.error && <p className="p-2 text-red-400">{cell.error}</p>}
                {showMask && cell.format === 'pfp' && cell.dataUrl && (
                  <svg viewBox="0 0 1024 1024" className="pointer-events-none absolute inset-0 h-full w-full">
                    <circle cx={512} cy={512} r={512} fill="none" stroke="red" strokeWidth={6} />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
