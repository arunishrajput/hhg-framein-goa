# 03 — Artboard Spec

Exact geometry for the three renderers. Every number here is a constant in `lib/render/tokens.ts`.
Changing anything in this file requires Arunish's sign-off — these numbers are tuned against X's
crop behaviour and are not arbitrary.

Coordinate system: origin top-left, y increases downward. Angles are **clockwise from twelve o'clock**.

---

## 0. Shared constants

`lib/render/tokens.ts` is the **single source of truth for every colour and every string in the
project** — including the CSS custom properties, which are generated from `COLOR` at build time rather
than hand-maintained in `globals.css`. Two hand-kept colour lists will drift; one will not.

```ts
export const COLOR = {
  cream:     '#FFFBEA', green:   '#2E673E', greenDeep: '#224D2E',
  pink:      '#EA3380', yellow:  '#F9E24C', ink:       '#33322F',
  inkSoft:   '#4D4B46', rule:    '#CCC9BB',
  cream2:    '#FEFAE9', greenMid:'#4D7D58',
} as const
// globals.css is generated from this: cream -> --hhg-cream, greenDeep -> --hhg-green-deep, etc.

export const EVENT = {
  name:    'HACKER HOUSE GOA',
  year:    '2026',
  dates:   '28–31 OCT 2026',
  place:   'GOA, INDIA',
  coords:  '15.2993° N  74.1240° E',
  tagline: 'LESS NOISE. MORE SIGNAL.',
  days:    ['GENESIS', 'TRIANGLE', 'BUILD', 'LAUNCH'],
  site:    'HHGOA.COM',
  tag:     '#FrameInGoa',      // primary — every official source uses this
  tagAlt:  '#FramedInGoa',     // secondary — see CLAUDE.md §2. Both go in every caption, tag first.
  deva:    'गोवा',
} as const

export const TEAM = {
  name:   'Nether Navigator',
  handle: '@arunishrajput',
  repo:   'https://github.com/arunishrajput/HHG-FRAMEIN-GOA',
} as const
// Used in exactly three places: the Crew Card's default team name, the caption signature in
// lib/share/xIntent.ts, and the README. Nowhere else.

/** Hour-hand angle for 2:47 → ((2 + 47/60) / 12) × 360 = 83.5°. The signature. */
export const PIP_ANGLE_DEG = 83.5
```

### The ring system

Used at three scales. All three share proportions relative to the photo radius `R`:

| Layer | Radius | Stroke | Colour |
|---|---|---|---|
| Photo disc | `R` | — | photo, clipped |
| Inner hairline | `1.014 R` | `0.014 R` | cream |
| Green band | `1.077 R` | `0.112 R` | green |
| Dashed orbit | `1.158 R` | `0.023 R`, dash `[0.060R, 0.051R]`, round caps | pink |
| Palm pip | centre at `1.158 R` from origin at `PIP_ANGLE_DEG` | radius `0.149 R` | yellow |

Draw order: photo → hairline → band → curved band text → orbit → pip → palm glyph.

The pip is drawn **after** the orbit so it sits on top, and the orbit's dash pattern is phase-offset so
a dash never terminates directly under the pip.

**Palm glyph.** A hand-drawn 5-frond palm as an inline SVG path in `primitives.ts`, filled
`--hhg-green`, scaled to 62% of the pip diameter, centred in the pip. Do **not** use the 🌴 emoji —
it renders differently on every platform and would break determinism.

---

## 1. Artboard A — PFP Frame

**Canvas 1024 × 1024.** Centre `(512, 512)`. `R = 430`.

```
   ┌──────────────────────────────────────┐  1024
   │        · · ─ ─ · ·                    │
   │     ·                  ·              │   dashed orbit  r=498
   │   ·   ┌────────────┐    ·             │   green band    r=463, w=48
   │  ·   │              │  ● ← pip 83.5°  │   hairline      r=436, w=6
   │  ·  │   PHOTO       │   ·             │   photo disc    r=430
   │  ·   │   circular   │  ·              │
   │   ·   └────────────┘  ·               │
   │     ·                ·                │
   │        · · ─ ─ · ·                    │
   └──────────────────────────────────────┘
```

| Element | Value |
|---|---|
| Background | transparent (PNG alpha) — the ring is the artwork, corners must not be filled |
| Photo disc | `r = 430`, cover-fit at the auto-frame focal point |
| Inner hairline | `r = 436`, stroke 6, cream |
| Green band | `r = 463`, stroke 48, green |
| Dashed orbit | `r = 498`, stroke 10, pink, dash `[26, 22]`, `lineCap: 'round'`, dashOffset 13 |
| Palm pip | centre at `83.5°` on `r = 498`, circle `r = 64`, yellow, palm glyph inside |
| Outer extent | `498 + 5 + 64 = 567` at the pip → **exceeds 512** |

⚠️ **The pip is the one thing that breaks the circle.** Two options, and we take the second:

- ~~Shrink everything so the pip fits inside r=512~~ — makes the ring feel thin and timid
- ✅ **Let the pip sit ON the orbit centred at r=498 with pip radius 64**, so its outer edge reaches
  562. Then **shrink the whole composition to a 0.895 scale about centre**, giving an effective outer
  extent of 503. Implement this as a single `ctx.scale()` wrapping the whole draw, so the geometry
  above stays readable and only one number changes.

Final effective radii after the 0.895 scale: photo 385, hairline 390, band 414 (w 43), orbit 446,
pip centre at 446 with r 57, outer extent 503. **9 px of clearance inside the circular mask.** ✓

### Curved band text
Along the green band, upper arc, centred at 270° (top), reading left-to-right:
`HACKER HOUSE GOA 2026 · 28–31 OCT · GOA, INDIA ·` repeated to fill.
Space Mono 700, 26 px (pre-scale), letter-spacing 0.16em, cream, baseline on the band's centre radius.
Use the `textOnArc()` primitive: per-glyph rotate-and-draw, not a font-path hack.

Lower arc, centred at 90°, reading left-to-right (so it is upright at the bottom):
`#FrameInGoa · 2:47 PM · #FrameInGoa · 2:47 PM ·` — same treatment, cream at 78% alpha.

### Notes
- Nothing is drawn outside `r = 503`. The square corners stay transparent so the file also works as a
  raw overlay.
- Test with a face that fills the frame edge-to-edge and a face that is tiny in a wide landscape.

---

## 2. Artboard B — Builder ID

**Canvas 1600 × 2000** (4:5 — the tallest ratio X shows uncropped in the timeline).

```
 ┌────────────────────────────────────────────────────┐ 0
 │ green bleed                                         │
 │  ┌────────────────────────────────────────────┐ 80  │
 │  │ ● BUILDER ID                 HHG-2026-7K2M │ 176 │  header
 │  ├────────────────────────────────────────────┤ 268 │  hairline
 │  │                                            │     │
 │  │    ╭─────╮      NAME                       │     │
 │  │   ( PHOTO )     Arunish Kumar              │ 800 │  hero row
 │  │    ╰─────╯      STACK / ROLE               │     │
 │  │                 Full-stack · Embedded      │     │
 │  │                 BUILDER CLASS              │     │
 │  │                 Kokum-Fed Shipwright       │     │
 │  ├────────────────────────────────────────────┤1420 │
 │  │ GENESIS   TRIANGLE   BUILD   LAUNCH        │1500 │  day rail
 │  │ 15.2993°N 74.1240°E      LESS NOISE.       │1660 │
 │  │ 28–31 OCT 2026           MORE SIGNAL.      │1740 │
 │  ├────────────────────────────────────────────┤     │
 │  │ #FrameInGoa · HHGOA.COM          ⟨2:47 PM⟩ │1880 │  pink footer
 │  └────────────────────────────────────────────┘1920 │
 └────────────────────────────────────────────────────┘ 2000
```

### Surfaces
| Element | Geometry |
|---|---|
| Bleed | full canvas, `green` |
| Card shadow | rect `(92, 92) → (1520, 1932)`, radius 40, `greenDeep`, no blur |
| Card | rect `(80, 80) → (1508, 1920)`, radius 40, `cream` |
| गोवा accent | Noto Devanagari 700, 160 px, `yellow`, rotated −8°, anchored at `(1250, 250)`, drawn **under** the header row at 100% opacity — it is an accent, not a watermark |

### Header (y 120–268)
- Pink dot `r = 14` at `(150, 176)`
- `BUILDER ID` — Bodoni Moda 700, 46 px, tracking 0.18em, `pink`, baseline `(196, 192)`
- `HHG-2026-XXXX` — Space Mono 700, 38 px, tracking 0.10em, `inkSoft`, right-aligned at `x = 1436`
- Hairline `(150, 268) → (1436, 268)`, 3 px, `rule`

### Hero row (y 300–1380)
**Photo unit** — the shared ring system at `R = 268`, centred `(500, 800)`.
Effective: photo 268, hairline 272, band 289 (w 30), orbit 310, pip centre 310 / r 40 at 83.5°.
Curved band text at 18 px: `HH GOA 2026 · 28–31 OCT ·` upper arc only.

**Text column** — left edge `x = 880`, right bound `x = 1436`, so 556 px of usable width.

| Row | Label (Space Mono 700, 26 px, 0.20em, `inkSoft`) | Value |
|---|---|---|
| y 560 / 660 | `NAME` | Bodoni Moda 700, **104 px**, `ink`, `fitText` to 556 px, min 56 px, 2 lines max |
| y 800 / 872 | `STACK / ROLE` | Space Mono 400, 42 px, `ink`, fit to 556, min 28, 2 lines max |
| y 1010 / 1090 | `BUILDER CLASS` | Bodoni Moda 700 **italic**, 66 px, `pink`, fit to 556, min 40 |
| y 1210 / 1266 | `HANDLE` *(omit row entirely if empty)* | Space Mono 400, 38 px, `inkSoft`, prefixed `@` |

Each label sits 8 px above a 2 px `rule` hairline running the column width; the value baseline sits
below it. The hairlines are what make it read as a badge rather than a poster.

### Day rail (y 1440–1560)
Four pills, `green` fill, radius 999, height 84, gap 24, starting `x = 150`.
Each contains `EVENT.days[i]` in Space Mono 700, 30 px, tracking 0.14em, `cream`, padded 36 px.
The pill for the current phase — always index 0 pre-event — carries a 4 px `yellow` inner stroke.

### Data block (y 1620–1790)
- Left, Space Mono 400, 34 px, `inkSoft`, x = 150:
  line 1 `15.2993° N  74.1240° E` (y 1660), line 2 `28–31 OCT 2026` (y 1740)
- Right, Bodoni Moda 700, 56 px, `green`, right-aligned x = 1436, two lines:
  `LESS NOISE.` (y 1660) / `MORE SIGNAL.` (y 1740)

### Footer (y 1810–1920)
- `pink` rect `(80, 1810) → (1508, 1920)`, bottom corners radius 40
- `#FrameInGoa · HHGOA.COM` — Space Mono 700, 34 px, tracking 0.12em, `cream`, at `(150, 1878)`
- **2:47 stamp** — circle `r = 62` centred `(1400, 1865)`, 4 px `cream` stroke, no fill,
  containing `2:47` / `PM` on two lines, Space Mono 700, 30 px / 20 px, `cream`, rotated −8°.
  This is the object that makes people ask what it means. Do not drop it.

---

## 3. Artboard C — Crew Card

**Canvas 1600 × 900** (16:9). Supports 2, 3, or 4 members. **Opens on 3** — hhgoa.com's FAQ says teams
of 1–3, so three is the modal case and the layout most people will never need to change.

```
 ┌──────────────────────────────────────────────────────┐
 │ green bleed                                           │
 │  ┌──────────────────────────────────────────────┐ 60  │
 │  │ ● CREW              HHG-2026-CREW-4M2X       │     │
 │  │  ╭──╮   ╭──╮   ╭──╮   ╭──╮                   │     │
 │  │ ( 01 ) ( 02 ) ( 03 ) ( 04 )                  │ 440 │
 │  │  name   name   name   name                   │ 600 │
 │  │                                              │     │
 │  │  TEAM NAME              CREW CLASS           │ 720 │
 │  │  #FrameInGoa · 28–31 OCT 2026 · HHGOA.COM    │ 830 │
 │  └──────────────────────────────────────────────┘     │
 └──────────────────────────────────────────────────────┘
```

| Element | Geometry |
|---|---|
| Card | `(60, 60) → (1540, 840)`, radius 36, `cream`, shadow offset `(10, 10)` `greenDeep` |
| Header | `CREW` — Bodoni 700, 40 px, 0.18em, `pink`, at `(130, 150)`; crew id right-aligned `x = 1470`, Space Mono 700, 30 px, `inkSoft` |
| Photo units | ring system at `R = 128`. Centres on a row at `y = 400`, evenly distributed across `x ∈ [300, 1300]` for n members. n=2 → x 560, 1040. n=3 → 430, 800, 1170. n=4 → 350, 700, 1050, 1400 → clamp right edge, use 330 / 653 / 976 / 1299 |
| Tilt | member *i* rotated `(-6 + 4i)°` about its own centre — applied to the **photo, hairline, green band and band text only** |
| Pip | drawn **after `ctx.restore()`**, at `PIP_ANGLE_DEG` in unrotated canvas space relative to that member's centre. The tilt never touches it. |
| Overlap | none; 40 px minimum gap. Overlapping circles read as clutter at 4 members |
| Names | Space Mono 700, 34 px, `ink`, centred under each unit at `y = 600`, `fitText` to 300 px |
| Team name | Bodoni 800, 88 px, `ink`, left `x = 130`, baseline `y = 740`, fit to 800 px |
| Crew class | Bodoni 700 italic, 48 px, `pink`, right-aligned `x = 1470`, baseline `y = 740` |
| Footer strip | `pink` rect `(60, 790) → (1540, 840)` with bottom radius 36; `#FrameInGoa · 28–31 OCT 2026 · HHGOA.COM` Space Mono 700, 28 px, 0.12em, `cream`, centred |

Only the first member's ring carries curved band text; the rest carry a plain band. At `R = 128` the
curved text becomes noise, so it's used once as an anchor and then dropped.

**On the tilt/pip split.** The signature angle is invariant across all three artboards — that rule in
`docs/02` §1 wins over the hand-laid look. So the bands tilt and the pips stay locked at 83.5°, which
reads as slightly odd on purpose: four cards laid down by hand, four suns in the same sky. If it
looks wrong on screen, drop the tilt, never the pip angle. (`docs/10-DECISIONS.md` D2.)

---

## 4. Primitives to implement first

```ts
coverDrawImage(ctx, bmp, cx, cy, w, h, focal: {x:number,y:number})
  // focal is normalised 0–1 in source space; cover-fit, never distort, clamp to bounds

clipCircle(ctx, cx, cy, r, draw: () => void)

dashedOrbit(ctx, cx, cy, r, stroke, dash: [number,number], color, offset)

textOnArc(ctx, text, cx, cy, r, startAngleDeg, opts: { font, color, tracking, flip })
  // per-glyph: save, translate to centre, rotate, translate to r, draw, restore
  // advance by measureText(glyph).width + tracking, converted to radians

palmGlyph(ctx, cx, cy, size, color)     // inline path, 5 fronds — no emoji

roundRect(ctx, x, y, w, h, r | [tl,tr,br,bl])

hardShadow(ctx, dx, dy, color, draw: () => void)   // draws twice, offset first

fitText(ctx, text, maxWidth, { font, maxSize, minSize, maxLines }): { size, lines }
  // binary-search the size down; then ellipsise the last line if still over
```

`fitText` is the one to get right. Every text-overflow bug in this product traces back to it, and the
judges *will* type a long name.

---

## 5. Render verification

`pnpm test:visual` renders all three artboards against six fixtures and writes PNGs to `test-output/`:

| Fixture | What it proves |
|---|---|
| `portrait-tight.jpg` (3:4, face fills frame) | No unwanted crop into the forehead |
| `landscape-wide.jpg` (16:9, face far left) | Auto-frame finds the face, doesn't centre-crop it out |
| `square-group.jpg` (1:1, three faces) | Picks the largest/most central face deterministically |
| `low-res.png` (400 × 400) | Upscales without visible ringing |
| `huge.jpg` (48 MP) | Downscale path holds; no Safari crash |
| `heic-sample.heic` | Conversion path produces the same result as its JPG twin |

Plus a text-stress case: name `Bartholomew Vengeance Chatterjee-Rao`, role
`Distributed Systems · Rust · Zero-Knowledge Proofs`. Nothing may overflow the card.
