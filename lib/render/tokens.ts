/**
 * Single source of truth for every colour and every fixed string in the project.
 * app/globals.css is generated from COLOR — see scripts/generate-tokens-css.mjs.
 * Never hand-type a hex or an event string anywhere else. (docs/03 §0, docs/10 D5.)
 */

export const COLOR = {
  cream: '#FFFBEA',
  green: '#2E673E',
  greenDeep: '#224D2E',
  pink: '#EA3380',
  yellow: '#F9E24C',
  ink: '#33322F',
  inkSoft: '#4D4B46',
  rule: '#CCC9BB',
  cream2: '#FEFAE9',
  greenMid: '#4D7D58',
} as const

export const EVENT = {
  name: 'HACKER HOUSE GOA',
  year: '2026',
  dates: '28–31 OCT 2026',
  place: 'GOA, INDIA',
  coords: '15.2993° N  74.1240° E',
  tagline: 'LESS NOISE. MORE SIGNAL.',
  days: ['GENESIS', 'TRIANGLE', 'BUILD', 'LAUNCH'],
  site: 'HHGOA.COM',
  tag: '#FrameInGoa', // primary — every official source uses this
  tagAlt: '#FramedInGoa', // secondary — see CLAUDE.md §2. Both go in every caption, tag first.
  deva: 'गोवा',
} as const

export const TEAM = {
  name: 'Nether Navigator',
  handle: '@arunishrajput',
  repo: 'https://github.com/arunishrajput/HHG-FRAMEIN-GOA',
} as const
// Used in exactly three places: the Crew Card's default team name, the caption signature in
// lib/share/xIntent.ts, and the README. Nowhere else. (docs/10 D6.)

/** Hour-hand angle for 2:47 → ((2 + 47/60) / 12) × 360 = 83.5°. The signature. */
export const PIP_ANGLE_DEG = 83.5

/** Fixed output pixel dimensions per format — never DPR-scaled. (docs/03 §1–3.) */
export const ARTBOARD = {
  pfp: { w: 1024, h: 1024 },
  id: { w: 1600, h: 2000 },
  crew: { w: 1600, h: 900 },
} as const

export type Format = keyof typeof ARTBOARD
