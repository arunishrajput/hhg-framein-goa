import { ImageResponse } from 'next/og'
import { COLOR, EVENT } from '@/lib/render/tokens'

export const runtime = 'edge'
export const alt = 'Frame In Goa — HH Goa 2026'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Static fallback for the root URL only. Per-share graphics are dynamic — see app/s/[id].
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLOR.green,
          color: COLOR.cream,
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, opacity: 0.85 }}>
          {EVENT.name} · {EVENT.year}
        </div>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, marginTop: 20 }}>
          Frame In Goa
        </div>
        <div style={{ display: 'flex', fontSize: 26, marginTop: 20, color: COLOR.yellow }}>
          {EVENT.tagline}
        </div>
      </div>
    ),
    { ...size }
  )
}
