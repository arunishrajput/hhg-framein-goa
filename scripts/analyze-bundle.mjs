// Bundle size report for the `/` route — reads Next's own build manifest instead of
// pulling in @next/bundle-analyzer as a new dependency for one number we can compute directly.
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUDGET_BYTES = 180 * 1024
const root = process.cwd()
const manifestPath = join(root, '.next/app-build-manifest.json')

if (!existsSync(manifestPath)) {
  console.error('No .next/app-build-manifest.json found — run `next build` first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const files = (manifest.pages['/page'] ?? []).filter((f) => f.endsWith('.js'))

let total = 0
const rows = files.map((f) => {
  const bytes = readFileSync(join(root, '.next', f))
  const gzip = gzipSync(bytes).length
  total += gzip
  return { file: f, raw: bytes.length, gzip }
})

rows.sort((a, b) => b.gzip - a.gzip)

console.log('\nFirst-load JS for / (route bundle), gzip:\n')
for (const r of rows) {
  console.log(
    `  ${(r.gzip / 1024).toFixed(1).padStart(6)} kB gzip  ` +
      `(${(r.raw / 1024).toFixed(1).padStart(7)} kB raw)  ${r.file}`,
  )
}
console.log(`\n  TOTAL: ${(total / 1024).toFixed(1)} kB gzip  (budget: ${BUDGET_BYTES / 1024} kB)\n`)

const flagged = ['heic-to', '@mediapipe', 'tasks-vision']
let leaked = false
for (const r of rows) {
  const src = readFileSync(join(root, '.next', r.file), 'utf8')
  for (const needle of flagged) {
    // Only flag if the literal package specifier is inlined (an eager import), not a
    // dynamic import() call site (those reference a chunk id, not the package string).
    if (src.includes(`"${needle}`) || src.includes(`'${needle}`)) {
      console.warn(`  ⚠ ${r.file} appears to reference "${needle}" as a static import`)
      leaked = true
    }
  }
}
if (!leaked) {
  console.log('  heic-to and @mediapipe/tasks-vision: absent from the main chunk (code-split OK)\n')
}

if (total > BUDGET_BYTES) {
  console.error(`  FAIL: ${(total / 1024).toFixed(1)} kB exceeds the 180 kB gzip budget\n`)
  process.exit(1)
}
console.log('  PASS: under budget\n')
