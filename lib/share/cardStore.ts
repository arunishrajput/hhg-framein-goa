/**
 * Card metadata lookup for /s/[id] (docs/04 §4a-b). The PNG lives at `cards/${id}.png`, a sibling
 * JSON blob at `meta/${id}.json` carries { id, url, format, name, createdAt } — no KV needed.
 * Looked up by exact pathname via list()'s prefix filter, which works without ever having to know
 * the store's hostname up front (see route.ts: it's only known after the first put() resolves).
 */
import { list } from '@vercel/blob'
import type { Format } from '@/lib/render/tokens'

export interface CardMeta {
  id: string
  url: string
  format: Format
  name: string | null
  createdAt: string
}

export async function getCard(id: string): Promise<CardMeta | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null

  const { blobs } = await list({ prefix: `meta/${id}.json`, limit: 1 })
  const metaBlob = blobs[0]
  if (!metaBlob) return null

  const res = await fetch(metaBlob.url, { cache: 'no-store' })
  if (!res.ok) return null

  return (await res.json()) as CardMeta
}
