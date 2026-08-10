import type { Metadata, Viewport } from 'next'
import { display, mono, deva } from './fonts'
import { COLOR, EVENT } from '@/lib/render/tokens'
import './globals.css'

// NEXT_PUBLIC_SITE_URL is the only place an origin appears anywhere in the repo (docs/10 D7).
// The localhost fallback is dev-only so the repo stays clone-and-run without secrets (docs/04 §6).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Frame In Goa',
  description: `Drop a photo, get your ${EVENT.name} ${EVENT.year} frame. No login, no crop, no signup. ${EVENT.tag}`,
}

export const viewport: Viewport = {
  themeColor: COLOR.green,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${deva.variable}`}>
      <body className="font-mono antialiased">{children}</body>
    </html>
  )
}
