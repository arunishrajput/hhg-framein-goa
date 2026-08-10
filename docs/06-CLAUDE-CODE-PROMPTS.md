# 06 — Claude Code Prompts

Copy-paste these at the start of each phase. They are written to be pasted whole, without editing.

A note on how these are shaped: each one names the phase, points at the specs, states the acceptance
criteria, and names what *not* to do. The "don't" lines matter more than the "do" lines — Claude Code
will find the happy path on its own; what it needs from you is the constraints.

---

## Session 0 — Bootstrap (run once)

```
Read CLAUDE.md and every file in docs/ before writing any code. Read docs/10-DECISIONS.md
carefully — six contradictions in an earlier draft are settled there and must not be re-opened. Then summarise back to me,
in under 200 words: what we're building, the three artboards, the one thing that makes our
share flow different from the competition, and the six phases. If anything in the docs is
ambiguous or contradictory, list it — don't paper over it.

Work in phases, not against a calendar. docs/09 is mine to manage, not yours — don't read
today's date and decide we're behind.

Don't write code yet.
```

---

## P0 — Scaffold

```
P0 from docs/05-BUILD-PLAN.md. Scaffold the project. Update the Status block when done.

- Next.js 15 App Router, TypeScript strict, Tailwind v4, ESLint. No src/ dir, alias @/*.
- app/globals.css: the nine CSS custom properties from docs/02 §2, verbatim hexes.
- app/fonts.ts: Bodoni Moda, Space Mono, Noto Sans Devanagari via next/font/google exactly
  as specified in docs/02 §3.
- lib/render/tokens.ts: COLOR, EVENT, PIP_ANGLE_DEG, ARTBOARD from docs/03 §0.
- Root layout: metadataBase from NEXT_PUBLIC_SITE_URL, theme-color #2E673E.
- Landing shell only: hero, three-segment format switch (PFP / BUILDER ID / CREW), empty
  drop zone. Static — no upload logic yet.

The empty drop zone must already contain a static inline-SVG version of the ring (green disc,
pink dashed orbit, yellow pip at 83.5°) so the user sees the product before uploading.

Follow docs/02 for every visual decision. Hard shadows only — a blurred box-shadow anywhere
is a bug. No gradients. Don't install any UI or state library.

When it builds, tell me and I'll deploy.
```

---

## P1 — PFP renderer

```
P1. Build the canvas renderer for Format A.

Start with lib/render/primitives.ts and unit-test textOnArc and fitText in isolation before
using them anywhere. Those two cause every downstream bug.

Then lib/render/artboards/pfp.ts, following docs/03 §1 exactly — including the 0.895 global
scale about centre, the curved band text on both arcs, and the palm pip at PIP_ANGLE_DEG.

Then lib/render/index.ts exposing render(spec) per the contract in CLAUDE.md §6. It must
await document.fonts.ready before the first fillText.

Add a dev-only /lab route that renders every artboard against every fixture in a grid, with a
toggle that overlays an r=512 circle so I can verify nothing crosses the X profile-picture mask.

Constraints:
- Canvas 2D only. Not html-to-image, not html2canvas, not SVG foreignObject.
- The palm is an inline SVG path, never the 🌴 emoji.
- No Math.random or Date.now anywhere in lib/render.
- Fixed output pixels — do not scale the canvas by devicePixelRatio.

Put three test photos in public/fixtures/ (portrait tight, landscape wide, square group) —
generate placeholder images if you don't have real ones.
```

---

## P2 — Photo pipeline

```
P2. Real photos in, no crop step.

lib/image/decode.ts:
- Sniff magic bytes for HEIC (ftyp + heic/heix/mif1/msf1). Don't trust file.type — HEIC from
  the iOS Files app often has an empty MIME type.
- HEIC branch: dynamic import of heic-to, so the decoder never enters the main bundle.
- createImageBitmap(blob, { imageOrientation: 'from-image' }) — this is what fixes sideways
  iPhone portraits.
- Downscale to max 2048px on the long edge before returning. Non-negotiable: iOS Safari will
  crash the tab on a 48MP photo otherwise.

lib/image/autoframe.ts per docs/04 §2:
- MediaPipe face detector, lazy-loaded, warmed speculatively when the drop zone mounts.
- Hard 800ms race. On timeout, resolve the fallback and abandon the detection.
- Multi-face: largest area × centrality, deterministic tie-break.
- Focal biased 0.12×boxHeight upward. Fallback { x: 0.5, y: 0.38 }.
- Completely silent — never surface a "face detected" state either way.

Then wire the drop zone (click, drag-drop, paste, mobile camera), the useGenerator reducer,
the reveal animation from docs/02 §6 with its reduced-motion path, and the optional collapsed
"Adjust" drawer.

Acceptance: all six fixtures in docs/03 §5 frame acceptably with zero manual input. Prove it by
committing the /lab screenshots.

Then unplug the face model entirely and show me the product still works — that's the real test.
```

---

## P3 — Builder ID and Crew

```
P3. Formats B and C.

lib/identity/builderClass.ts: exactly 247 classes from 19 adjectives × 13 nouns. Deterministic
from name+handle; reroll(seed) advances. Vocabulary is Goa + AI + crypto + shipping — kokum,
susegad, monsoon, feni, tide, laterite, protocol, ledger, latency, shipwright, cartographer.
Banned: ninja, rockstar, guru, wizard, hero, sensei, samurai. Unit-test that all 247 are unique,
stable across runs, and that no adjective/noun pair reads badly.

lib/identity/builderId.ts: HHG-2026-XXXX, four base36 chars from a stable hash.

lib/render/artboards/builderId.ts: docs/03 §2 exactly. Every y-coordinate and font size in that
table is deliberate.

Then the form — Name, Stack/Role, X handle (optional), class chip with reroll. Live re-render on a
120ms trailing debounce.

Critical: Format B must render with placeholder text the instant a photo lands, before any field
is filled. Never gate the preview behind the form — that's the signup-gate failure mode wearing a
different hat.

Then lib/render/artboards/crew.ts per docs/03 §3, plus multi-slot upload for 2–4 members.

Before you say done, render the text-stress case: name "Bartholomew Vengeance Chatterjee-Rao",
role "Distributed Systems · Rust · Zero-Knowledge Proofs". Nothing may overflow.
```

---

## P4 — Share pipeline

```
P4. This is the part that wins or loses the task — read docs/04 §4 and CLAUDE.md §7 in full
before touching anything.

app/api/share/route.ts — runtime = 'nodejs' (edge will not work with the Blob SDK). Validate the
PNG magic bytes and a 6MB cap. nanoid(10). put() to Vercel Blob with a one-year cache header and
addRandomSuffix: false. Rate limit 20/min by IP. No auth.

app/s/[id]/page.tsx with generateMetadata:
- og:image = the absolute blob URL, with width and height declared
- twitter:card = summary_large_image (without this X shows a tiny thumbnail and our entire edge
  disappears)
- Fresh id per share — X caches OG per URL, so reuse shows a stale image
- Page body: the graphic large, the person's name, one "Make yours" CTA

Client orchestration:
- If navigator.canShare({files}) — native share with the file attached. Best path on mobile.
- Otherwise: download the PNG first (so they always have it), then upload, then open the intent.
- THE POPUP WORKAROUND: open a blank tab synchronously inside the click handler and set its
  location once the upload resolves. If you await before window.open, Safari eats it and share
  silently does nothing on iPhone. This is the single most likely bug in the whole project.

Then deliberately break each path and show me it degrades: unset BLOB_READ_WRITE_TOKEN, kill the
network mid-upload, deny the share sheet.

Done when I've posted a real test tweet from a real iPhone and X's Card Validator shows our actual
generated graphic on the production URL.
```

---

## P5 — Polish and ship

```
P5. Ship it.

Work through docs/07-QA-AND-LAUNCH.md top to bottom. For each failure, fix it and note what broke.

Then:
- pnpm analyze — first-load JS must be under 180KB gzip. If it isn't, find what leaked into the
  main bundle; it's almost certainly the HEIC decoder or the face model failing to code-split.
- Lighthouse mobile ≥ 90.
- Full keyboard path with visible focus. Alt text on the preview. prefers-reduced-motion honoured.
- README: screenshot, live link, two-line architecture note, how to run. The organisers review the
  GitHub repo, so this matters.

Then generate my real assets and tell me when they're ready to download:
1. My PFP frame
2. My Builder ID
3. The team Crew Card

Don't refactor anything at this stage. If it works, it ships.
```

---

## Useful mid-session prompts

**When something looks wrong but you can't say why**
```
Render Format B at /lab with the three portrait fixtures, screenshot it, and critique your own
output against docs/02 and docs/03. Be specific about what's off — spacing, weight, alignment,
optical centring. Then fix only the worst one and show me before and after.
```

**When you're stuck on a bug**
```
Stop patching. State the bug as a hypothesis with a falsifiable test, run the test, and tell me
the result before changing any code.
```

**When it's running slow**
```
Instrument the pipeline with performance.mark from file-select to preview-visible, run it on the
huge.jpg fixture with CPU throttled 4x, and give me the breakdown by stage against the budget
table in docs/04 §5. Then fix only the stage that's over.
```

**When you're about to add a dependency**
```
Before installing that: what does it weigh gzipped, does it code-split cleanly, and how many lines
would it take to write the 20% of it we actually use? CLAUDE.md §9 says ask first — so ask.
```

**End-of-session close-out**
```
Run the gate: pnpm typecheck && pnpm lint && pnpm build && pnpm test. Then update the checkboxes in
docs/05, and if anything we built diverged from the specs, update docs/03 or docs/04 to match
reality — don't leave the docs lying. Then commit and push.
```
