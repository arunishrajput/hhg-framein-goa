import { DropZone } from '@/components/DropZone'
import { FormatSwitch } from '@/components/FormatSwitch'
import { EVENT } from '@/lib/render/tokens'

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-12 sm:px-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-hhg-pink">
          {EVENT.name} · {EVENT.year}
        </p>
        <h1 className="font-display text-[44px] leading-[1.02] font-extrabold tracking-[-0.02em] text-hhg-green sm:text-[64px]">
          Frame In Goa
        </h1>
        <p className="max-w-md font-mono text-[15px] leading-[1.55] text-hhg-ink">
          No login. No crop tool. Auto-framed in seconds — download and post to X.
        </p>
      </header>

      <div className="flex justify-center">
        <FormatSwitch />
      </div>

      <DropZone />

      <footer className="flex flex-col items-center gap-2 pt-4 text-center">
        <p className="font-mono text-xs tracking-[0.14em] text-hhg-ink-soft uppercase">
          {EVENT.dates} · {EVENT.place}
        </p>
        <p className="font-display text-sm font-bold text-hhg-green">
          {EVENT.tagline}
        </p>
      </footer>
    </div>
  )
}
