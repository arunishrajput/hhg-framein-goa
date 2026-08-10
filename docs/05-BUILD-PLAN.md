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
CURRENT PHASE: P4 (complete) — ready to start P5
P0 scaffold        [x]
P1 pfp renderer    [x]
P2 photo pipeline  [x]
P3 id + crew       [x]
P4 share pipeline  [x]
P5 polish + ship   [ ]

BLOCKED ON: Vercel deploy + phone check (Arunish) — P0 exit criterion still needs a real device.
  P1's own exit criterion (download the PNG, set as a real X profile picture) also needs a human
  with an X account — verified everything short of that in /lab (r=512 mask overlay, all three
  fixtures) and it holds with clean margin. P2's and P3's real-device passes (HEIC straight off an
  iPhone, paste-from-clipboard, drag-drop, real touch pinch-zoom) are unverified beyond code
  review + the file-input/synthetic-pointer-event path — same "needs a human with real hardware"
  gap as P0/P1, now carried through every phase since. P4's own exit criterion (a real test tweet
  from a real iPhone, checked against X's Card Validator on the production URL) needs the same
  thing plus a real `BLOB_READ_WRITE_TOKEN` and a live Vercel deployment — nothing in this repo can
  clear that bar from a dev machine with no token.

P4 NOTES:
  - All three degrade paths named in the kickoff prompt were exercised live in a real Chrome tab
    against the real dev server (not unit-tested in isolation): token unset (the actual dev
    condition — no `.env.local` exists), the fetch to `/api/share` rejecting outright (simulated
    network drop, distinct from a resolved error response), and a cancelled native share
    (`navigator.share` stubbed to reject `AbortError`, since a real OS share sheet is a modal
    automation can't safely drive — see the `canShare`/`share` stubbing notes inline in
    `lib/share/useShare.ts`'s header comment for why the hook takes an in-memory `Blob` rather than
    fetching a blob: URL). All three degraded exactly per `docs/10` D3: the first two downloaded
    the PNG, opened the blank-tab popup synchronously, hit `/api/share`, got a rejection, and
    surfaced the toast text verbatim ("Saved your PNG. Attach it to the post.") with a text-only
    `x.com/intent/post` URL; the cancelled-share case did nothing further — no download, no popup,
    no toast — matching "native handles its own UX" in `docs/04` §4c.
  - Also verified the golden path with a mocked `/api/share` response: the popup's location lands
    on `x.com/intent/post?text=...&url=<origin>/s/<id>`, confirming `xIntentUrl` and the
    `window.location.origin` composition are wired correctly end to end, for all three formats
    (PFP, Builder ID with a typed name + generated class, Crew with the default team-name
    placeholder) — captions matched `docs/08` §2 exactly in each case.
  - `/s/[id]` was hit directly for a nonexistent id and rendered the "This card isn't here anymore"
    fallback cleanly rather than throwing — expected, since `getCard()` returns `null` whenever
    `BLOB_READ_WRITE_TOKEN` is unset (`lib/share/cardStore.ts`), which is the real state of this
    dev machine. The actual OG-image contract (`summary_large_image`, absolute blob URL, declared
    width/height, X's Card Validator) is unverified — it needs a real token, a real deploy, and is
    called out in BLOCKED ON above.
  - Card metadata has no KV dependency: `app/api/share/route.ts` writes a sibling
    `meta/${id}.json` blob next to `cards/${id}.png`, and `lib/share/cardStore.ts` finds it via
    `list({ prefix })` on the exact pathname rather than needing to know the store's hostname up
    front — the hostname is only known after the first `put()` resolves, so a lookup keyed on a
    full URL wouldn't work for a fresh server invocation.
  - Rate limiting (`lib/share/rateLimit.ts`) is an in-memory sliding window, deliberately not
    backed by KV/Redis — best-effort only, resets on cold start, doesn't coordinate across
    serverless instances. Fine here: there's no auth and nothing to protect, it just keeps one warm
    instance from being hammered, matching the "no auth" non-negotiable in spirit (`docs/04` §4a).
  - `useShare()`'s native-vs-link branch decision is entirely synchronous (`canShareFiles(file)` on
    an already-in-memory `Blob`), which is what lets the link-path popup open with
    `window.open('about:blank', '_blank')` still inside the click handler's call stack, before any
    `await` — the workaround CLAUDE.md's P4 prompt calls "the single most likely bug in the whole
    project." Confirmed as a real risk during testing, just self-inflicted: a diagnostic script
    that called `.click()` and then polled with `setTimeout` in the same script hung a CDP call for
    45s, because `window.open` backgrounded the tab and Chrome throttles background-tab timers —
    switching the poll to a `MutationObserver` (not timer-based) fixed the diagnostic; nothing in
    the app itself was at fault.
  - `useGenerator`/`useBuilderIdGenerator`/`useCrewGenerator` each gained a `blob` (the latter two
    didn't retain one before) and a memoized `caption` built from the exact same display-name
    fallback the render spec already uses (`PLACEHOLDER_NAME`/`PLACEHOLDER_TEAM`), so the caption
    can never name someone differently than the card in the same PNG does.
  - New shared presentational components, `ShareButton` and `Toast`, implement `docs/02` §5's
    Secondary button and Toast specs verbatim (cream/green-border/green-text; green/cream,
    bottom-right on desktop, bottom-centre on mobile, 4s auto-dismiss) and the button copy is
    exactly `docs/02` §7's voice-table mapping, "Share" -> "Post on X".

P3 NOTES:
  - Formats B and C both verified end-to-end in a real Chrome tab, not just /lab
    (`docs/assets/p3-lab-artboards.jpg` — the id/crew half of the grid, both text-stress cells
    visible): photo upload ->
    instant placeholder-filled preview -> live debounced re-render on every field edit -> reroll ->
    (crew only) add/remove/reorder members -> download. No console errors on any of it.
  - The text-stress case (name "Bartholomew Vengeance Chatterjee-Rao", role "Distributed Systems ·
    Rust · Zero-Knowledge Proofs") was run both in /lab and by typing it into the live Builder ID
    form. It surfaced a real, previously-latent bug in `fitText` (lib/render/primitives.ts, shipped
    in P1): when wrapping produced more lines than `maxLines` allowed, the kept last line only got
    an ellipsis if *that line itself* overflowed `maxWidth` — a short last line (e.g. "Vengeance")
    left "Chatterjee-Rao" silently dropped with no visible sign anything was cut. Fixed by forcing
    the ellipsis whenever lines were truncated, regardless of the kept line's own width. New
    regression test locks this in (`lib/render/primitives.test.ts`).
  - `lib/render/ring.ts` extracts the docs/03 §0 ring system (photo/hairline/band/curved-text/
    orbit/pip) as one function shared by builderId.ts and crew.ts — pfp.ts keeps its own inlined,
    already-shipped copy rather than being retrofitted onto it (regression risk vs. a cosmetic
    dedupe). Verified the shared version reproduces the same ratios pfp.ts hardcodes at R=430, and
    that the "no dash terminates under the pip" property (docs/03 §0) holds at any R because dash
    length, orbit radius, and dash offset are all proportional to R while the pip angle is fixed —
    confirmed empirically at R=268 (Builder ID) and R=128 (Crew) in /lab.
  - Found and fixed a real bug in `roundRect` (lib/render/primitives.ts, shipped in P1 but never
    exercised with an oversized radius until the day-rail pills): canvas `arcTo` doesn't clamp an
    oversized corner radius the way CSS `border-radius` does, so the "999 for a full pill" idiom
    drew a self-intersecting path instead of a stadium shape. Fixed by clamping each corner to at
    most half of the shorter side; added regression tests.
  - `lib/render/index.ts`'s DRAW lookup (`{format: DrawFn}`, worked fine with one variant in P1)
    stopped type-checking once CardSpec became a real union — calling a value pulled from a record
    of function types requires the argument to satisfy the intersection of their parameter types,
    which collapses to `never` once the variants' fields diverge. Replaced with a switch statement,
    which lets TypeScript narrow `spec` per case instead.
  - `lib/generator/usePhotoPipeline.ts` is new shared plumbing (decode -> autoframe -> adjust,
    deliberately *not* owning render()) used by the Builder ID and Crew hooks so Crew's 2-4 slots
    don't duplicate the pipeline. `useGenerator.ts` (pfp, P2) keeps its own self-contained
    implementation rather than being refactored onto this — same "don't touch a shipped, verified
    path for a dedupe" call as ring.ts above.
  - Crew's multi-slot state uses a fixed 4 `usePhotoPipeline()` calls always (React's rules of
    hooks don't allow a variable count) plus an `order: number[]` permutation array — add/remove/
    reorder only ever permute `order`, never move state between hook instances.
  - No per-member Adjust drawer on the Crew Card — auto-framing still runs per member, but there's
    no manual pan/zoom override UI per slot. Not in docs/03 §3's scope, and the added complexity
    (which of 2-4 photos does a single drawer control?) wasn't worth it for a format most people
    will use at the untouched 3-member default (docs/10 D8).

P2 NOTES:
  - All six docs/03 §5 fixtures verified framing acceptably with zero manual input in /lab
    (screenshot: docs/assets/p2-lab-fixtures.jpg) — /lab now runs the real decodeImage() ->
    autoframe() pipeline per fixture instead of a hand-picked focal map, so that screenshot *is*
    the exit-criterion evidence, not a stand-in for it.
  - Unplugged the face model (pointed the CDN at an unreachable host) and confirmed the product
    stays fully usable: fallback focal {0.5, 0.38} engages silently, render/download/adjust all
    keep working. Reverted immediately after — see git history if this needs re-running.
  - Found and fixed two bugs neither of which were introduced by P2 but that P2's first real
    interactive testing surfaced: (1) RingMark.tsx's frondPath had a genuine SSR/client hydration
    mismatch from Math.sin/cos differing in their last bit between server and browser V8 — fixed
    by rounding coordinates before they hit the `d` attribute string. (2) The Adjust drawer's
    pan/zoom throttle originally used requestAnimationFrame, which stalls indefinitely on a
    hidden/unfocused document — switched to setTimeout so a tab losing focus mid-drag (a real
    mobile scenario, not just a test-automation artifact) can't permanently wedge the drawer.
DIVERGED FROM DOCS: — none in substance. Three notes from P0/P1, plus one from P2:
  - docs/02 §2 / docs/06 P0 prompt says "nine" CSS custom properties; docs/03 §0's COLOR object
    and docs/02's own CSS block both list ten. Implemented all ten — "nine" looks like a stray
    typo, not a real scope cut.
  - The "generated from COLOR at build time" rule (CLAUDE.md §5, docs/10 D5) is implemented as a
    small script (scripts/generate-tokens-css.mjs) that writes app/tokens.generated.css from
    lib/render/tokens.ts, run via predev/prebuild. Not spelled out in docs/04 — worth a line
    there if this pattern holds through later phases.
  - docs/03 §1's per-element table gives the pip's pre-scale outer extent as "498 + 5 + 64 = 567",
    but the "Final effective radii" line right below it (pip centre 446, r 57, outer 503 — the
    number the 9px-clearance claim depends on) only reconciles against 498 + 64 = 562 pre-scale
    (562 × 0.895 ≈ 503; 567 × 0.895 ≈ 507.6, which would leave only ~4px and doesn't match the
    doc's own "9 px of clearance" line). Implemented pip centre at r=498, radius 64, matching the
    "Palm pip" row and the final effective numbers — the "+5" looks like a stray leftover from an
    earlier draft. Verified empirically in /lab: the pip sits inside the r=512 mask with a clean
    visible gap on all three fixtures.
  - docs/04 §1's CardSpec sketch gives Focal as `{x, y}` only. The Adjust drawer needs a zoom
    factor too (docs/01 F2: "offers drag and zoom"), so `Focal` in lib/render/primitives.ts grew
    an optional `zoom?: number` (default 1, backward compatible — `coverDrawImage` just multiplies
    it into the existing cover-fit scale). autoframe.ts never sets it; only the manual override
    path does.

lib/render/tokens.ts also grew two entries P0 didn't need: FONT (Google Font family names, for
building ctx.font strings — canvas can't read the CSS custom properties app/fonts.ts sets up) and
EVENT.signatureTime ('2:47 PM', the fixed string the lower band text repeats — not derived from
Date.now(), same invariant as PIP_ANGLE_DEG). Both follow the existing "every string is a token"
rule rather than bending it.
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
- [x] Deployed to Vercel and confirmed loading on a phone — needs Arunish

**Exit criterion.** The empty page already looks unmistakably like HH Goa on a real phone. If it
doesn't, everything after this starts from a worse baseline — fix it here, not later.

---

## P1 · PFP renderer — size M

**Goal.** A hardcoded fixture photo renders a pixel-correct Format A PNG.

- [x] `lib/render/primitives.ts` — `roundRect`, `clipCircle`, `coverDrawImage`, `dashedOrbit`,
      `hardShadow`, `palmGlyph`, `textOnArc`, `fitText`
- [x] `textOnArc` and `fitText` unit-tested **in isolation, before use anywhere else** — 10 vitest
      cases against a hand-rolled mock `CanvasRenderingContext2D` (no jsdom/node-canvas needed;
      the mock tracks the save/translate/rotate transform stack with plain affine math)
- [x] `lib/render/artboards/pfp.ts` — `docs/03` §1, including the 0.895 global scale about centre.
      One deliberate reading where the doc's per-element table and its own "final effective
      radii" line disagree on the pip's pre-scale outer extent — see DIVERGED note above
- [x] `lib/render/index.ts` — the `render(spec)` contract from `CLAUDE.md` §6, with
      `await document.fonts.ready`. `CardSpec` is currently `PfpSpec` only — grows to the full
      `docs/04` §1 union in P3 when `builderId.ts`/`crew.ts` exist to back the other variants
- [x] Dev-only `/lab` route — every artboard × every fixture in a grid, with an `r = 512` overlay
      toggle. Gated on `NODE_ENV === 'production'` via `notFound()`; confirmed it 404s in a real
      production build (`next build && next start`) and renders in dev
- [x] Three fixtures in `public/fixtures/` (portrait tight, landscape wide, square group) —
      generated placeholders (PIL, flat-vector faces on gradients), not real photos. Swap for real
      ones whenever they're available; nothing downstream depends on them being placeholders

**Exit criterion.** Download the 1024×1024 PNG, set it as the profile picture on a throwaway X
account, and it reads correctly inside the circular mask at both 400 px and 48 px. Nothing crosses
`r = 512`.

**Verified so far:** all three fixtures render clean in `/lab` with the mask overlay on — the pip
sits inside `r = 512` with a visible gap on every fixture, both band-text arcs read upright and
left-to-right (confirming the `flip` traversal-direction logic), and the dashed orbit doesn't
terminate under the pip. The actual "set it as a real X avatar" step needs a human with an X
account — still open, same as P0's phone check.

**Why the primitives first.** `textOnArc` and `fitText` are the origin of essentially every later
layout bug. Test them alone while they're the only thing that can be wrong.

---

## P2 · Photo pipeline — size M

**Goal.** Any photo from any phone lands correctly, with no crop step.

- [x] `lib/image/decode.ts` — magic-byte HEIC sniff, dynamic `heic-to` import, EXIF orientation via
      `imageOrientation: 'from-image'`, 2048 px downscale
- [x] `lib/image/autoframe.ts` — MediaPipe lazy + speculatively warmed, hard 800 ms race,
      largest × central face pick, upper-biased focal, thirds fallback, completely silent
- [x] Drop zone wired — click, drag-drop, paste, mobile camera/gallery
- [x] `useGenerator()` reducer — `idle → decoding → framing → ready → error`
- [x] The reveal animation from `docs/02` §6 plus its reduced-motion path
- [x] Optional "Adjust" drawer — drag to pan, pinch/scroll to zoom, collapsed by default
- [x] Error strings from `docs/02` §7

**Exit criterion.** All six fixtures in `docs/03` §5 frame acceptably with **zero manual input**, and
a real HEIC straight off an iPhone works end to end. Then unplug the face model entirely and confirm
the product is still fully usable — that's the actual test.

**Verified so far:** all six fixtures (three from P1 plus `low-res.png`, `huge.jpg`,
`heic-sample.heic` — generated this phase in the same placeholder style) frame acceptably with zero
manual input; `/lab` now runs each one through the real `decodeImage()` -> `autoframe()` pipeline
rather than a hand-picked focal map, so that grid is the evidence, not a proxy for it
(`docs/assets/p2-lab-fixtures.jpg`). Confirmed the HEIC fixture decodes and frames correctly through
the real `heic-to/next` conversion path. Pointed the face-model CDN at an unreachable host and
confirmed the whole product — render, download, the Adjust drawer — keeps working on the
`{0.5, 0.38}` fallback with no errors, no hang, no visible difference except framing quality on the
one off-centre fixture. Full pipeline (click-upload, HEIC, error state, pan, pinch-zoom, zoom
slider) exercised in a real Chrome tab; drag-drop and clipboard-paste are implemented on the same
`onFile` path as click-upload but weren't independently exercised — same "needs a human on real
hardware" gap as the rest of this phase.

---

## P3 · Builder ID and Crew — size L

**Goal.** All three formats produce correct PNGs from real photos.

- [x] `lib/identity/builderClass.ts` — exactly 247 classes (19 × 13), deterministic from
      `name + handle`, `reroll(seed)` advances. Tests: 247 unique, stable across runs, no bad pairs.
- [x] `lib/identity/builderId.ts` — `HHG-2026-XXXX`, four base36 chars, stable hash
- [x] `lib/render/artboards/builderId.ts` — `docs/03` §2 exactly
- [x] Form — Name, Stack/Role, X handle (optional), class chip with reroll, 120 ms debounced re-render
- [x] Format B renders with placeholders the instant a photo lands, **before any field is filled**
- [x] `lib/render/artboards/crew.ts` — `docs/03` §3
- [x] Multi-slot upload — add / remove / reorder, 2–4 members

**Exit criterion.** The text-stress case renders clean: name `Bartholomew Vengeance Chatterjee-Rao`,
role `Distributed Systems · Rust · Zero-Knowledge Proofs`. Nothing overflows on any of the three
artboards.

**Verified.** Typed the exact text-stress name/role into the live Builder ID form (not just a
synthetic /lab spec) — name ellipsises cleanly at "Bartholomew Vengeance…", role wraps to 2 lines,
nothing overflows. Same case exercised on the Crew Card (team name + first member name) in /lab.
This is what surfaced the `fitText` silent-truncation bug fixed this phase — see the P3 note above.
All three artboards, all six P2 fixtures, both text-stress cases, and vocabulary/hash unit tests
(53 new tests across identity + render) pass. `pnpm build` first-load JS for `/` is 128 KB gzip,
still comfortably under the 180 KB budget.

---

## P4 · Share pipeline — size M

This is the differentiator over the field. Give it the most attention and the most testing.

- [x] `app/api/share/route.ts` — Node runtime, PNG magic-byte validation, 6 MB cap, Vercel Blob,
      `nanoid(10)`, IP rate limit, no auth
- [x] `app/s/[id]/page.tsx` + `generateMetadata` — absolute OG url, `summary_large_image`,
      width/height declared, fresh id per share
- [x] `/s/[id]` page body — graphic large, name, one "Make yours" CTA
- [x] `lib/share/webShare.ts` — `canShare({files})` probe, native share with the file attached
- [x] `lib/share/xIntent.ts` — caption builder from `docs/08`, `x.com/intent/post`
- [x] **The popup workaround** — blank tab opened synchronously in the click handler, `location` set
      after upload resolves
- [ ] Download path verified on iOS Safari specifically — needs a real device, see BLOCKED ON
- [x] Every fallback exercised deliberately: token unset, network killed mid-upload, share sheet dismissed

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
