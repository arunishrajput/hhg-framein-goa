# 02 — Design System

Every colour below was sampled from HH Goa's own task card artwork, not eyeballed. These are the
brand's actual values. **Do not adjust them, do not add a sixth accent, do not introduce a gradient.**

> **These hexes live in `lib/render/tokens.ts`, and `globals.css` is generated from it.** The CSS block
> in §2 is documentation of the output, not a second list to maintain by hand. Change a colour in one
> place only. (`docs/10-DECISIONS.md` D5.)

---

## 1. Direction

HH Goa's visual world is flat vector illustration: deep jungle green, cream paper, one hot pink, one
sun yellow, hard offset shadows with no blur, dashed orbit rings, palm pips, condensed Didone display
type over wide-tracked monospace. It is a poster, not a dashboard.

Our output should look like it was cut from the same sheet as the event's own task card — because it
literally is. The illustration on that card is *a green disc, ringed by a pink dashed orbit, with a
yellow palm pip, and a tilted ID card in front of it.* That is our product, drawn by the client, before
we started. We are building their illustration into a working tool.

**Signature element: the 2:47 clock.** The pink dashed orbit is a clock face, and the yellow palm pip
always sits at the hour-hand angle for 2:47 — **83.5° clockwise from twelve** — a nod to 2:47 PM Studio.
Every frame, every card, every crew photo carries the same pip at the same angle. This is invariant and
it outranks every other visual rule: where something else would move the pip — the per-member tilt on
the Crew Card, for instance — the pip wins and the other thing gives way. One idea, stated
three times, never explained in the UI. It is the line in the X post that makes people look twice.

Everything else stays quiet. No secondary flourish, no particle effects, no gradient mesh.

---

## 2. Palette

```css
:root {
  /* Core — sampled from HH Goa task card */
  --hhg-cream:      #FFFBEA;  /* paper, card fill, text on green */
  --hhg-green:      #2E673E;  /* primary surface, ring band, brand voice */
  --hhg-green-deep: #224D2E;  /* hard shadow, deep surface, pressed state */
  --hhg-pink:       #EA3380;  /* accent — orbit, eyebrows, primary button */
  --hhg-yellow:     #F9E24C;  /* the palm pip, highlights, focus ring */

  /* Neutrals */
  --hhg-ink:        #33322F;  /* body text on cream */
  --hhg-ink-soft:   #4D4B46;  /* labels, secondary text */
  --hhg-rule:       #CCC9BB;  /* hairlines, dividers, disabled */
  --hhg-cream-2:    #FEFAE9;  /* barely-there inset fill */
  --hhg-green-mid:  #4D7D58;  /* green-on-green separators only */
}
```

### Roles

| Token | Use | Never |
|---|---|---|
| `cream` | Page background, card fill, text on green | As an accent |
| `green` | Ring band, primary surfaces, brand text on cream | As body text under 16 px |
| `green-deep` | Hard offset shadows, pressed states | For text on green |
| `pink` | Dashed orbit, eyebrow labels, primary CTA fill | **Body text of any size on cream** |
| `yellow` | The palm pip, focus ring, one highlight per view | As a large fill area |
| `ink` | All body text | On green |

### Contrast (WCAG, computed)

| Pair | Ratio | Verdict |
|---|---|---|
| ink on cream | **12.36** | AAA — default body |
| ink-soft on cream | **8.40** | AAA — labels |
| green on cream | **6.47** | AA all sizes — brand text, headings |
| cream on green | **6.47** | AA all sizes |
| cream on green-deep | **9.33** | AAA |
| yellow on green | **5.12** | AA all sizes |
| yellow on green-deep | **7.38** | AAA |
| ink on yellow | **9.77** | AAA |
| **pink on cream** | **3.83** | ⚠️ Large text only (≥ 24 px bold / ≥ 30 px regular). Not body. |
| **cream on pink** | **3.83** | ⚠️ Buttons ≥ 18 px bold only |
| **pink on green** | **1.69** | ❌ Never. Not even decoratively — it vibrates. |

The pink limitation is the one rule people break. Eyebrows and CTAs are fine because they're large and
bold. A 14 px pink caption is not, and it will look cheap on a phone in daylight.

---

## 3. Typography

Three faces, three jobs, no more. All self-hosted via `next/font/google` — never a `<link>` to
fonts.googleapis.com, and never a canvas draw before `document.fonts.ready`.

```ts
// app/fonts.ts
import { Bodoni_Moda, Space_Mono, Noto_Sans_Devanagari } from 'next/font/google'

export const display = Bodoni_Moda({        // headlines, names, taglines
  subsets: ['latin'], weight: ['600','700','800'], style: ['normal','italic'],
  variable: '--font-display', display: 'swap',
})
export const mono = Space_Mono({            // everything else — UI, labels, data
  subsets: ['latin'], weight: ['400','700'],
  variable: '--font-mono', display: 'swap',
})
export const deva = Noto_Sans_Devanagari({  // गोवा accent only
  subsets: ['devanagari'], weight: ['700'],
  variable: '--font-deva', display: 'swap',
})
```

**Why these.** HH Goa's own display face is a condensed high-contrast Didone — Bodoni Moda is the
closest freely-licensed match, and its optical sizing keeps the thin strokes alive at 128 px on the card.
Their body face is a wide-tracked typewriter mono — Space Mono has the same slightly-off, drawn quality
rather than the sterile feel of a coding mono. Devanagari appears on their site as `goa_hindi.svg`;
Noto Sans Devanagari Bold sits next to Bodoni without clashing.

### Scale — interface

| Role | Face | Size / line | Tracking | Case |
|---|---|---|---|---|
| Hero | display 800 | 44 / 1.02 | −0.02em | Title |
| Section head | display 700 | 28 / 1.15 | −0.01em | Title |
| Eyebrow | mono 700 | 12 / 1.0 | **0.22em** | UPPER |
| Body | mono 400 | 15 / 1.55 | 0 | sentence |
| Label | mono 700 | 12 / 1.2 | 0.14em | UPPER |
| Button | mono 700 | 15 / 1.0 | 0.10em | UPPER |
| Micro | mono 400 | 12 / 1.4 | 0.04em | sentence |

Hero scales to 64 px above 768 px width. Everything else is fixed — a mono UI at a constant size reads
as deliberate; fluid mono reads as a bug.

### Scale — artboards
Canvas type sizes are absolute pixel values in `docs/03`, not derived from this table. They are
different objects at a different viewing distance and must not be linked.

### Rules

- Tracking on uppercase mono is load-bearing. Below `0.10em` it looks like a mistake.
- Never mix display and mono inside a single line.
- Sentence case in prose, UPPER only for eyebrows, labels, and buttons.
- One italic per view, maximum — reserved for the Builder Class.

---

## 4. Space, shape, depth

```
Space scale (px):  4  8  12  16  24  32  48  64  96
Radius:            sm 6   md 12   lg 20   pill 999
Hairline:          1px solid var(--hhg-rule)
```

**Shadows are hard.** No blur, ever. Flat vector depth:

```css
--shadow-hard:   6px 6px 0 var(--hhg-green-deep);
--shadow-hard-l: 10px 10px 0 var(--hhg-green-deep);
--shadow-press:  2px 2px 0 var(--hhg-green-deep);
```

A blurred `box-shadow` anywhere in this project is a bug. It's the single fastest way to make the work
look like a generic template instead of HH Goa.

**Layout.** Single column on mobile with a 16 px gutter. From 900 px, a two-column split: preview left
(sticky, 58%), controls right (42%). Max content width 1120 px. The preview never scrolls out of view
on desktop — people iterate on the card while typing, and watching it change is the whole delight.

---

## 5. Components

**Drop zone** — cream fill, 2 px dashed `--hhg-rule` border, radius lg, min-height 240 px. Contains a
static preview of the ring so the user sees the product before they commit. Hover/drag-over: border
becomes `--hhg-pink`, fill becomes `--hhg-cream-2`. Never animates on idle.

**Format switch** — three-segment pill, mono 700 uppercase, tracking 0.10em. Active segment is
`--hhg-green` fill with cream text; inactive is transparent with `--hhg-ink-soft`. `role="tablist"`,
arrow-key navigable.

**Primary button** — `--hhg-pink` fill, cream text, radius pill, `--shadow-hard`, 14/28 px padding.
Active state translates 4 px down-right and swaps to `--shadow-press` — the button physically presses.
Disabled: `--hhg-rule` fill, no shadow, `cursor: not-allowed`.

**Secondary button** — cream fill, 2 px `--hhg-green` border, green text, same press behaviour.

**Field** — cream-2 fill, 2 px `--hhg-rule` border, radius md, mono 15 px, 12/14 px padding. Label is an
eyebrow above, not a placeholder. Focus: border `--hhg-green`, plus a 3 px `--hhg-yellow` outline
offset 2 px.

**Class chip** — the generated Builder Class, shown as an inline pill in `--hhg-yellow` with ink text,
display italic, with a `↻` reroll button. Reroll spins the icon 360° once. This is the most-touched
control in the product; make it feel good.

**Toast** — bottom-centre on mobile, bottom-right on desktop. Green fill, cream text, hard shadow,
auto-dismiss at 4 s, `role="status"`.

---

## 6. Motion

Motion serves two moments and nothing else: **the reveal** (photo lands → card assembles) and **the
press** (buttons, reroll). Everything else is static.

```css
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast:  120ms;   /* presses */
--dur-base:  240ms;   /* state changes */
--dur-reveal:520ms;   /* the one orchestrated moment */
```

**The reveal**, staged, total 520 ms:
1. `0 ms` — the ring is already on screen (it was in the empty drop zone), so it doesn't animate
2. `0–240 ms` — photo scales 0.94 → 1 with opacity 0 → 1 inside the circular mask
3. `120–400 ms` — the pink orbit draws itself clockwise from the pip via `stroke-dashoffset`
4. `280–520 ms` — the yellow pip pops: scale 0 → 1.12 → 1
5. `360–520 ms` — text rows fade up 8 px, 40 ms stagger

That sequence is the product's one piece of theatre. Do it once, do it well, don't repeat it on every
keystroke — subsequent re-renders are instant and unanimated.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```
Under reduced motion the reveal becomes a single 100 ms opacity fade. Never zero — a hard cut reads as
a glitch.

---

## 7. Voice

Short. Concrete. A little dry. Never exclamatory, never "Awesome!", never emoji in interface text
(emoji are fine in the X caption, which is a different medium).

| Instead of | Write |
|---|---|
| "Upload your image to get started!" | "Drop a photo. Any size, any crop." |
| "Generating your amazing card..." | "Building your card" |
| "Oops! Something went wrong 😢" | "That file didn't decode. Try a JPG or PNG." |
| "Download" | "Download PNG" |
| "Share" | "Post on X" |
| "No image selected" | "Add a photo to see your card." |

**Rules.** A button names exactly what happens, and the resulting toast uses the same word: "Download
PNG" → "Saved". Errors say what happened and what to do next, in the interface's voice, and never
apologise. Empty states are invitations, not statements of absence.

**Strings to get right:**
- HEIC in progress: `Converting iPhone photo…`
- Face detection: **silent**. Never surface it. If it worked the user won't notice; if it didn't they
  shouldn't.
- Share, mobile: `Opening share sheet…`
- Share, desktop: `Saved your PNG and opened X. Attach it or post the link — the preview shows your card.`
- Privacy line, shown once under the drop zone: `Your photo stays in your browser. Nothing is uploaded until you post.`

---

## 8. Anti-checklist

If any of these are true, stop and fix it before moving on:

- [ ] A blurred shadow exists anywhere
- [ ] A gradient exists anywhere
- [ ] Pink is used as body text on cream
- [ ] A colour outside §2 is in the codebase
- [ ] A generic mono (system-ui monospace, Roboto Mono) is rendering instead of Space Mono
- [ ] The card looks like it would work for any hackathon with the logo swapped
- [ ] A loading spinner is visible for longer than 200 ms
- [ ] An emoji appears in interface chrome
- [ ] The preview and the downloaded PNG differ in any way
