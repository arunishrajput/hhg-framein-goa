# 05 — Build Plan

Six phases, strictly ordered. Each phase has an **exit criterion** that is objectively verifiable —
you either can do the thing or you can't. Move on only when the current phase's exit criterion passes.

There are no dates or hour estimates in this file on purpose. Pace depends on the session, and a
calendar you can't observe is a bad thing to make scope decisions against. Cut decisions here are
triggered by **phase state**, not by time. Calendar commitments live in `docs/09-SCHEDULE.md` and are
Arunish's to manage.

---

## Status

> **Claude Code: update this block at the end of every session.** It is how the next session knows
> where it is without guessing.

```
CURRENT PHASE: P0 (complete, not yet deployed)
P0 scaffold        [x]
P1 pfp renderer    [ ]
P2 photo pipeline  [ ]
P3 id + crew       [ ]
P4 share pipeline  [ ]
P5 polish + ship   [ ]

BLOCKED ON: Vercel deploy + phone check (Arunish) — P0 exit criterion needs a real device
DIVERGED FROM DOCS: — none in substance. Two notes:
  - docs/02 §2 / docs/06 P0 prompt says "nine" CSS custom properties; docs/03 §0's COLOR object
    and docs/02's own CSS block both list ten. Implemented all ten — "nine" looks like a stray
    typo, not a real scope cut.
  - The "generated from COLOR at build time" rule (CLAUDE.md §5, docs/10 D5) is implemented as a
    small script (scripts/generate-tokens-css.mjs) that writes app/tokens.generated.css from
    lib/render/tokens.ts, run via predev/prebuild. Not spelled out in docs/04 — worth a line
    there if this pattern holds through later phases.
```

---

## Dependency graph

```
P0 scaffold
 └─→ P1 pfp renderer ──────────────┐
      └─→ P2 photo pipeline ───────┤
           └─→ P3 id + crew ───────┤
                                   └─→ P4 share pipeline ─→ P5 polish + ship
```

P1 must come before P2: build the renderer against a fixture photo first, so when real photos start
arriving you're debugging the decode path only, not the decode path *and* the geometry at once.

P4 depends on P1 only in principle — it just needs *a* PNG — but do it after P3 anyway, because the
OG-preview verification is more meaningful against a finished card.

---

## P0 · Scaffold and tokens — size S

**Goal.** `pnpm dev` shows a branded empty shell. Nothing renders yet, but every colour and font is
already correct.

- [x] `pnpm create next-app` — TypeScript, App Router, Tailwind v4, ESLint, no `src/`, alias `@/*`
- [x] `app/globals.css` — the nine CSS custom properties from `docs/02` §2, verbatim
      (built all ten in `docs/02`/`docs/03`'s own `COLOR` list — see DIVERGED note above)
- [x] `app/fonts.ts` — Bodoni Moda, Space Mono, Noto Sans Devanagari via `next/font/google`
- [x] `lib/render/tokens.ts` — `COLOR`, `EVENT`, `PIP_ANGLE_DEG`, `ARTBOARD` from `docs/03` §0
- [x] Root layout — `metadataBase`, theme colour `#2E673E`, viewport, static OG fallback
- [x] Landing shell — hero, three-segment format switch, empty drop zone. Static, no logic.
- [ ] Deployed to Vercel and confirmed loading on a phone — **still open**, needs Arunish

**Exit criterion.** The empty page already looks unmistakably like HH Goa on a real phone. If it
doesn't, everything after this starts from a worse baseline — fix it here, not later.

---

## P1 · PFP renderer — size M

**Goal.** A hardcoded fixture photo renders a pixel-correct Format A PNG.

- [ ] `lib/render/primitives.ts` — `roundRect`, `clipCircle`, `coverDrawImage`, `dashedOrbit`,
      `hardShadow`, `palmGlyph`, `textOnArc`, `fitText`
- [ ] `textOnArc` and `fitText` unit-tested **in isolation, before use anywhere else**
- [ ] `lib/render/artboards/pfp.ts` — `docs/03` §1 exactly, including the 0.895 global scale
- [ ] `lib/render/index.ts` — the `render(spec)` contract from `CLAUDE.md` §6, with
      `await document.fonts.ready`
- [ ] Dev-only `/lab` route — every artboard × every fixture in a grid, with an `r = 512` overlay toggle
- [ ] Three fixtures in `public/fixtures/` (portrait tight, landscape wide, square group)

**Exit criterion.** Download the 1024×1024 PNG, set it as the profile picture on a throwaway X
account, and it reads correctly inside the circular mask at both 400 px and 48 px. Nothing crosses
`r = 512`.

**Why the primitives first.** `textOnArc` and `fitText` are the origin of essentially every later
layout bug. Test them alone while they're the only thing that can be wrong.

---

## P2 · Photo pipeline — size M

**Goal.** Any photo from any phone lands correctly, with no crop step.

- [ ] `lib/image/decode.ts` — magic-byte HEIC sniff, dynamic `heic-to` import, EXIF orientation via
      `imageOrientation: 'from-image'`, 2048 px downscale
- [ ] `lib/image/autoframe.ts` — MediaPipe lazy + speculatively warmed, hard 800 ms race,
      largest × central face pick, upper-biased focal, thirds fallback, completely silent
- [ ] Drop zone wired — click, drag-drop, paste, mobile camera/gallery
- [ ] `useGenerator()` reducer — `idle → decoding → framing → ready → error`
- [ ] The reveal animation from `docs/02` §6 plus its reduced-motion path
- [ ] Optional "Adjust" drawer — drag to pan, pinch/scroll to zoom, collapsed by default
- [ ] Error strings from `docs/02` §7

**Exit criterion.** All six fixtures in `docs/03` §5 frame acceptably with **zero manual input**, and
a real HEIC straight off an iPhone works end to end. Then unplug the face model entirely and confirm
the product is still fully usable — that's the actual test.

---

## P3 · Builder ID and Crew — size L

**Goal.** All three formats produce correct PNGs from real photos.

- [ ] `lib/identity/builderClass.ts` — exactly 247 classes (19 × 13), deterministic from
      `name + handle`, `reroll(seed)` advances. Tests: 247 unique, stable across runs, no bad pairs.
- [ ] `lib/identity/builderId.ts` — `HHG-2026-XXXX`, four base36 chars, stable hash
- [ ] `lib/render/artboards/builderId.ts` — `docs/03` §2 exactly
- [ ] Form — Name, Stack/Role, X handle (optional), class chip with reroll, 120 ms debounced re-render
- [ ] Format B renders with placeholders the instant a photo lands, **before any field is filled**
- [ ] `lib/render/artboards/crew.ts` — `docs/03` §3
- [ ] Multi-slot upload — add / remove / reorder, 2–4 members

**Exit criterion.** The text-stress case renders clean: name `Bartholomew Vengeance Chatterjee-Rao`,
role `Distributed Systems · Rust · Zero-Knowledge Proofs`. Nothing overflows on any of the three
artboards.

---

## P4 · Share pipeline — size M

This is the differentiator over the field. Give it the most attention and the most testing.

- [ ] `app/api/share/route.ts` — Node runtime, PNG magic-byte validation, 6 MB cap, Vercel Blob,
      `nanoid(10)`, IP rate limit, no auth
- [ ] `app/s/[id]/page.tsx` + `generateMetadata` — absolute OG url, `summary_large_image`,
      width/height declared, fresh id per share
- [ ] `/s/[id]` page body — graphic large, name, one "Make yours" CTA
- [ ] `lib/share/webShare.ts` — `canShare({files})` probe, native share with the file attached
- [ ] `lib/share/xIntent.ts` — caption builder from `docs/08`, `x.com/intent/post`
- [ ] **The popup workaround** — blank tab opened synchronously in the click handler, `location` set
      after upload resolves
- [ ] Download path verified on iOS Safari specifically
- [ ] Every fallback exercised deliberately: token unset, network killed mid-upload, share sheet dismissed

**Exit criterion.** A real test tweet posted from a real iPhone *and* from desktop, and X's Card
Validator shows the actual generated graphic against the **production** URL — not a preview deploy,
not localhost.

---

## P5 · Polish and ship — size M

**Goal.** It's ready for a stranger on a phone.

- [ ] Full pass of `docs/07-QA-AND-LAUNCH.md` §1–§8 on real devices
- [ ] Lighthouse mobile ≥ 90; first-load JS < 180 KB gzip (`pnpm analyze`)
- [ ] HEIC decoder and face model confirmed absent from the main chunk
- [ ] Accessibility — keyboard path end to end, focus rings, alt text, reduced motion
- [ ] README with screenshot, live link, two-line architecture note (**the repo gets reviewed**)
- [ ] Real assets generated and handed over: Arunish's PFP, Arunish's Builder ID, the team Crew Card

**Exit criterion.** Someone who has never seen the tool produces a card on their own phone without
being told how.

**After P5, stop building.** Handover to `docs/09-SCHEDULE.md`. No refactors, no new features. Fix
only what's actually broken.

---

## Cut lines

Cut in this exact order. Do not improvise a different order under pressure.

| Order | Cut | Trigger |
|---|---|---|
| 1 | **Format C (Crew Card)** — the `crew.ts` artboard and multi-slot UI | P3 is in progress and P4 has not started |
| 2 | **Face detection** — fall back to the fixed `{ 0.5, 0.38 }` focal | P4 is in progress and P5 has not started |
| 3 | **The caption editor** — ship the fixed default caption | P5 in progress |
| 4 | **The `/s/[id]` page body** — keep `generateMetadata`, render a bare page | P5 in progress |

Cut 1 is painful because hhgoa.com explicitly asks for a combined team frame and it's our biggest
gap over the field — but the task PDF doesn't require it, and Formats A and B satisfy the brief on
their own. Expected to ship; first to go. Both true (`docs/10-DECISIONS.md` D1). Cut 2 costs slightly worse framing on off-centre photos and
nobody who isn't looking for it will notice.

**Never cut:** auto-framing entirely, the download, the `#FrameInGoa` caption, the mobile layout, or
the OG image. Those four are the brief.

**Arunish decides when to pull a cut line, not Claude Code.** If a phase is dragging, say so and name
the cut you'd recommend — then wait.

---

## Session protocol

**Start of every session**
1. Read `CLAUDE.md`, then this file's Status block, then the doc for the current phase
2. State which phase you're in and what its exit criterion is
3. `git pull && pnpm install && pnpm dev`

**End of every session**
4. `pnpm typecheck && pnpm lint && pnpm build && pnpm test`
5. Commit, push, confirm the Vercel preview deploys and loads on a phone
6. Update the Status block above
7. If anything built diverged from `docs/03` or `docs/04`, update those docs to match reality —
   don't leave the specs lying
