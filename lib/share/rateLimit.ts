/**
 * In-memory sliding-window limiter for POST /api/share (docs/04 §4a: 20/min by IP, no auth).
 * Best-effort only — module state resets on cold start and isn't shared across serverless
 * instances. That's fine here: there's nothing to protect, this just keeps a single warm
 * instance from being hammered.
 */
const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const hits = new Map<string, number[]>()

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_REQUESTS
}
