import Image from 'next/image'
import { Generator } from '@/components/Generator'
import { EVENT } from '@/lib/render/tokens'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-hhg-cream">
      <header className="relative overflow-hidden bg-hhg-green">
        <Image
          src="/brand/goa-sunrise.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 pt-14 pb-16 text-center sm:px-8 sm:pt-20 sm:pb-24">
          <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-hhg-cream">
            {EVENT.name} · {EVENT.year}
            <Image
              src="/brand/goa-hindi.svg"
              alt=""
              width={40}
              height={40}
              className="h-6 w-auto"
            />
          </p>
          <h1 className="font-display text-[44px] leading-[1.02] font-extrabold tracking-[-0.02em] text-hhg-cream sm:text-[64px]">
            Frame In Goa
          </h1>
          <p className="max-w-md font-mono text-[15px] leading-[1.55] text-hhg-cream">
            No login. No crop tool. Auto-framed in seconds — download and post to X.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-8">
        <Generator />
      </main>

      <footer className="relative mt-8 overflow-hidden bg-hhg-green py-14">
        <Image
          src="/brand/goa-palms.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 text-center sm:px-8">
          <p className="font-mono text-xs tracking-[0.14em] text-hhg-cream uppercase">
            {EVENT.dates} · {EVENT.place}
          </p>
          <p className="font-display text-sm font-bold text-hhg-yellow">
            {EVENT.tagline}
          </p>
        </div>
      </footer>
    </div>
  )
}
