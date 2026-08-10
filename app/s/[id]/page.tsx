/**
 * The share landing page (docs/04 §4b, CLAUDE.md §7). generateMetadata() is the whole point of
 * this route: it's what lets X's crawler see the actual generated card as the link preview
 * instead of a default thumbnail. A fresh `id` per share keeps X from caching a stale image
 * against a reused URL.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCard } from '@/lib/share/cardStore'
import { ARTBOARD, EVENT } from '@/lib/render/tokens'

export const runtime = 'nodejs' // Blob SDK needs it — same constraint as the API route.

interface Props {
  params: Promise<{ id: string }>
}

const CTA_CLASS =
  'rounded-full bg-hhg-pink px-7 py-3.5 font-mono text-[18px] font-bold uppercase tracking-[0.10em] text-hhg-cream shadow-[6px_6px_0_var(--hhg-green-deep)] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_var(--hhg-green-deep)]'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const card = await getCard(id)

  if (!card) {
    return { title: 'Frame In Goa' }
  }

  const { w, h } = ARTBOARD[card.format]
  const title = card.name ? `${card.name} · ${EVENT.nameShort} ${EVENT.year}` : `${EVENT.nameShort} ${EVENT.year}`
  const description = `Made with Frame In Goa. Drop a photo, get your ${EVENT.nameShort} ${EVENT.year} frame. ${EVENT.tag}`

  return {
    title,
    description,
    alternates: { canonical: `/s/${id}` },
    openGraph: {
      title,
      description,
      url: `/s/${id}`,
      type: 'website',
      images: [{ url: card.url, width: w, height: h }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [card.url],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params
  const card = await getCard(id)

  if (!card) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hhg-cream px-6 py-16 text-center">
        <p className="max-w-xs font-mono text-[15px] leading-[1.55] text-hhg-ink">
          This card isn&apos;t here anymore.
        </p>
        <Link href="/" className={CTA_CLASS}>
          Make yours
        </Link>
      </main>
    )
  }

  const { w, h } = ARTBOARD[card.format]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-hhg-cream px-6 py-12">
      <div className="w-full max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- served straight from Blob, not an optimizable local asset */}
        <img
          src={card.url}
          alt={card.name ? `${card.name}'s ${EVENT.nameShort} ${EVENT.year} frame` : `${EVENT.nameShort} ${EVENT.year} frame`}
          width={w}
          height={h}
          className="w-full rounded-[20px]"
        />
      </div>
      {card.name && <p className="font-mono text-lg text-hhg-ink">{card.name}</p>}
      <Link href="/" className={CTA_CLASS}>
        Make yours
      </Link>
    </main>
  )
}
