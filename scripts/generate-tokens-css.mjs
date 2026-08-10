// Generates app/tokens.generated.css from lib/render/tokens.ts COLOR.
// Run automatically before `dev` and `build` — see package.json.
// CLAUDE.md §5: "The CSS custom properties in app/globals.css are generated from COLOR
// at build time — never hand-typed as a second list." (docs/10 D5.)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { COLOR } from '../lib/render/tokens.ts'

const CSS_NAME = {
  cream: 'cream',
  green: 'green',
  greenDeep: 'green-deep',
  pink: 'pink',
  yellow: 'yellow',
  ink: 'ink',
  inkSoft: 'ink-soft',
  rule: 'rule',
  cream2: 'cream-2',
  greenMid: 'green-mid',
}

const lines = Object.entries(COLOR)
  .map(([key, hex]) => `  --hhg-${CSS_NAME[key]}: ${hex};`)
  .join('\n')

const out = `/* GENERATED FILE — do not edit by hand.
   Source: lib/render/tokens.ts COLOR. Change a colour there, then \`pnpm gen:tokens\`. */
:root {
${lines}
}
`

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../app/tokens.generated.css')
writeFileSync(outPath, out)
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
