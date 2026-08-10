/**
 * POST /api/share — the one server responsibility in the app (docs/04 §1, CLAUDE.md §7).
 * multipart/form-data { file: image/png, format: 'pfp'|'id'|'crew', name?: string } -> { id, url }.
 *
 * Node runtime is required — the Blob SDK doesn't run on edge (CLAUDE.md §4, §10).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'
import { isRateLimited } from '@/lib/share/rateLimit'
import type { CardMeta } from '@/lib/share/cardStore'
import type { Format } from '@/lib/render/tokens'

export const runtime = 'nodejs'
export const maxDuration = 15

const MAX_BYTES = 6 * 1024 * 1024
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const VALID_FORMATS: readonly Format[] = ['pfp', 'id', 'crew']

function isPng(bytes: Buffer): boolean {
  if (bytes.length < PNG_MAGIC.length) return false
  return PNG_MAGIC.every((byte, i) => bytes[i] === byte)
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  // docs/04 §6: no token in dev/preview must degrade to a documented 503, never throw.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'share_unavailable' }, { status: 503 })
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }
  if (file.type && file.type !== 'image/png') {
    return NextResponse.json({ error: 'invalid_content_type' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  if (!isPng(bytes)) {
    return NextResponse.json({ error: 'invalid_png' }, { status: 400 })
  }

  const formatRaw = form.get('format')
  const format: Format = VALID_FORMATS.includes(formatRaw as Format) ? (formatRaw as Format) : 'pfp'
  const nameRaw = form.get('name')
  const name = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim().slice(0, 80) : null

  const id = nanoid(10)

  const png = await put(`cards/${id}.png`, bytes, {
    access: 'public',
    contentType: 'image/png',
    cacheControlMaxAge: 31536000,
    addRandomSuffix: false,
  })

  const meta: CardMeta = { id, url: png.url, format, name, createdAt: new Date().toISOString() }
  await put(`meta/${id}.json`, JSON.stringify(meta), {
    access: 'public',
    contentType: 'application/json',
    cacheControlMaxAge: 31536000,
    addRandomSuffix: false,
  })

  return NextResponse.json({ id, url: png.url })
}
