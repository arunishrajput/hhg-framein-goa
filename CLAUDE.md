# CLAUDE.md — Frame In Goa

> Operating manual for Claude Code on this repo. Read this fully before the first edit of any session.
> Deeper context lives in `docs/`. When this file and `docs/` disagree, **this file wins**.

---

## 1. What we are building

A zero-friction web tool for the **Hacker House Goa 2026 (HH Goa) Task #1 shortlisting challenge**.

A person lands on the page, drops in a photo, and within a couple of seconds has a branded HH Goa 2026
graphic they can download and post to X. Three output formats:

| Format | Name | Canvas | Purpose |
|---|---|---|---|
| A | **PFP Frame** | 1024 × 1024 | Ready-to-use X profile picture, survives circular crop |
| B | **Builder ID** | 1600 × 2000 (4:5) | Event badge as a post image |
| C | **Crew Card** | 1600 × 900 (16:9) | 2–4 teammates in one combined frame |

**Format C is expected to ship, and it is also cut line 1.** Both are true and they don't conflict:
hhgoa.com's own task blurb asks for a combined team frame and almost every competitor skipped it, so
it's the highest-value differentiator available — but the task PDF doesn't require it, so Formats A
and B satisfy the brief alone. That makes it the first thing to drop if P3 overruns. Nothing about
that changes how seriously you build it. See `docs/05` §Cut lines.

**Hard deadline: 11:59 pm IST, 13 August 2026.** All other dates live in `docs/09-SCHEDULE.md` and are
Arunish's to manage. You work in the phases defined in `docs/05-BUILD-PLAN.md` — do not pace yourself
against the calendar or infer from today's date whether the project is ahead or behind. If a phase is
dragging, say so and name the cut line you'd recommend; the decision is Arunish's.

---

## 2. Non-negotiables

These come straight from the brief. Breaking any one of them invalidates the submission.

1. **No login. No signup. No email gate.** Not before the result, not after. No modal asking for anything.
2. **No manual cropping required.** The tool auto-frames every photo. Manual nudge exists as an
   escape hatch, never as a step.
3. **Real downloadable file.** `.png` on disk, not a screenshot-of-a-div, not canvas-only-on-screen.
4. **Working Share to X** with a pre-filled caption containing **`#FrameInGoa`**.
   If sharing by link, the link's OG preview must show *the actual generated graphic*, never a default.
5. **Mobile-first.** Most judges will open this on a phone. Test on a real device, not just devtools.
6. **Fast.** Upload → visible result under 2 s on mid-tier Android over 4G. No full-screen loader.
7. **On-brand.** Unmistakably HH Goa 2026 — not a generic badge with a logo pasted on.
   Every colour, every string comes from `docs/02-DESIGN-SYSTEM.md`. Do not invent brand colours.

> ⚠️ **Hashtag check.** Every official source (both task PDFs, hhgoa.com) says `#FrameInGoa`.
> One third-party recap post on X claimed `#FramedInGoa`. We use **`EVENT.tag = '#FrameInGoa'`** as the
> primary and canonical tag, with **`EVENT.tagAlt = '#FramedInGoa'`** carried in every caption after it.
> Both are tokens, never literals. Do not remove either without checking with Arunish. (`docs/10` D4.)

---

## 3. Commands

```bash
pnpm dev          # local dev, http://localhost:3000
pnpm build        # production build — must pass with zero TS errors before any deploy
pnpm lint         # eslint + prettier check
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest — render-contract + title-generator tests
pnpm test:visual  # playwright: renders all 3 artboards against fixture photos, writes to test-output/
pnpm analyze      # bundle size report — first-load JS budget is 180 KB gzip
```

Before **any** `git push` to `main` (which auto-deploys to production):
`pnpm typecheck && pnpm lint && pnpm build && pnpm test`

---

## 4. Stack — locked, do not substitute

- **Next.js 15** (App Router) + **TypeScript strict** — chosen specifically for the dynamic OG route.
- **Tailwind CSS v4** with brand tokens defined as CSS custom properties in `app/globals.css`.
- **Canvas 2D** for all graphic generation. **Never** `html-to-image`, `html2canvas`, `dom-to-image`,
  or SVG-foreignObject. They are slow, font-flaky, and produce different output across browsers.
- **Vercel Blob** for the share-link image host.
- `heic-to` (lazy, dynamic import, only when the file is HEIC/HEIF).
- `@mediapipe/tasks-vision` (lazy, background, hard-timeouted) for face-aware auto-framing.
- **No state library.** React `useReducer` in one `useGenerator()` hook is enough.
- **No UI component library.** The design is too specific; shadcn would fight it.

---

## 5. File map

```
app/
  layout.tsx                 root metadata, fonts, theme colour
  page.tsx                   the single-page generator
  s/[id]/page.tsx            share landing page — generateMetadata() emits the real OG image
  api/share/route.ts         POST png blob -> { id, url }; runtime = 'nodejs'
  opengraph-image.tsx        static fallback OG for the root URL only
lib/
  render/
    artboards/pfp.ts         drawPfp(ctx, spec)
    artboards/builderId.ts   drawBuilderId(ctx, spec)
    artboards/crew.ts        drawCrew(ctx, spec)
    primitives.ts            dashedOrbit, textOnArc, roundRect, hardShadow, fitText, coverDrawImage
    tokens.ts                COLOR, EVENT, TEAM, ARTBOARD, PIP_ANGLE_DEG — single source of truth
    index.ts                 render(spec): Promise<Blob> — the ONLY public entry point
  image/
    decode.ts                file -> ImageBitmap (HEIC branch, EXIF orientation, max-2048 downscale)
    autoframe.ts             face detect w/ 800 ms timeout -> focal point, else rule-of-thirds fallback
  identity/
    builderClass.ts          247 deterministic classes (19 adjectives x 13 nouns)
    builderId.ts             HHG-2026-XXXX from a stable hash
  share/
    xIntent.ts               caption builder + x.com/intent/post URL
    webShare.ts              navigator.share({ files }) with capability probe
components/                  dumb presentational only; zero canvas logic lives here
docs/                        the specs — read before implementing, update when reality diverges
```

**Rule:** `lib/render/tokens.ts` owns every colour and every fixed string in the project. The CSS
custom properties in `app/globals.css` are **generated** from `COLOR` at build time — never hand-typed
as a second list. Grep for a bare hex outside `tokens.ts` and you should find nothing.

**Rule:** every pixel that ends up in a PNG is drawn by code under `lib/render/`.
If you are tempted to style a preview `<div>` to look like the output, stop — render the real canvas
and show it in an `<img>`. One renderer, one truth. Preview drift is how these projects lose.

---

## 6. The render contract

`lib/render/index.ts` exposes exactly one function:

```ts
export async function render(spec: CardSpec): Promise<{ blob: Blob; dataUrl: string }>
```

Invariants Claude Code must never break:

1. **Pure and deterministic.** Same `CardSpec` → byte-identical PNG. No `Date.now()`, no `Math.random()`
   inside the render path. Randomness happens once, upstream, and is captured in the spec as a seed.
2. **Fonts are awaited.** `await document.fonts.ready` before the first `ctx.fillText`, always.
   Skipping this is the #1 cause of "works locally, wrong font in production."
3. **Fixed output pixels.** Canvas is always the artboard size from `docs/03`. Never DPR-scaled — the
   output is a file, not a screen.
4. **Cover-fit, never stretch.** Photos go through `coverDrawImage()` with the focal point from
   `autoframe.ts`. Aspect ratio is never distorted.
5. **Every string is a token.** Dates, coordinates, taglines, hashtags come from `lib/render/tokens.ts`.
   No string literals in artboard files.
6. **Long input never breaks layout.** Names, roles and team names run through `fitText()`, which
   shrinks then ellipsises. Test with a 40-character name every time you touch a text block.

---

## 7. The share pipeline — read this twice

This is our biggest scoring edge over the field, and the easiest thing to get subtly wrong.

**Mobile path (preferred):** if `navigator.canShare({ files: [png] })` is true, call `navigator.share()`
with the file attached plus the caption. The image lands directly in the composer. Best possible UX.

**Universal path (always available):**
1. `POST /api/share` with the PNG → uploads to Vercel Blob → returns `{ id, url }`.
2. Open `https://x.com/intent/post?text=<caption>&url=https://<host>/s/<id>`.
3. `/s/[id]` runs `generateMetadata()` and emits `og:image` = the blob URL,
   `twitter:card=summary_large_image`, plus a real page showing the graphic and a "make your own" CTA.

Requirements on that OG image, all mandatory:
- Absolute `https://` URL. Never relative. Never `localhost`.
- `og:image:width` and `og:image:height` explicitly set.
- Served as `image/png` with a long cache header.
- A **fresh `id` per share** — X caches OG data per URL, so reusing an id shows a stale graphic.

The photo is uploaded **only when the user taps Share**, never on upload. Say so in the UI copy.
That sentence is both true and a trust signal; keep it.

**When the PNG downloads, exactly:**

| Path | Download? | Why |
|---|---|---|
| Native share succeeds | **No** | The file is attached to the composer already. A duplicate in the camera roll is user-hostile. |
| Link path | **Yes, before the upload starts** | Native images outperform link cards on X, so many people will attach it manually anyway — and if the upload dies they already have the file. |
| Upload fails | Already downloaded | Open the intent with `text` only, toast: `Saved your PNG. Attach it to the post.` |

The flow must never dead-end. (`docs/10-DECISIONS.md` D3.)

---

## 8. Definition of done (per feature)

A feature is done when all of these are true — not when it renders once on your machine:

- [ ] Works on a real iPhone (Safari) and a real Android (Chrome), portrait and landscape
- [ ] Works with a HEIC photo straight off an iPhone
- [ ] Works with a 4:3 landscape photo where the face is off-centre and near an edge
- [ ] Works with a 12 MP photo without a Safari memory crash
- [ ] Keyboard reachable, visible focus ring, `prefers-reduced-motion` respected
- [ ] No layout shift on load; no unstyled font flash
- [ ] Error state written in the interface's voice, saying what to do next
- [ ] `pnpm build` clean, first-load JS still under budget

---

## 9. Working agreements with Arunish

**Decide yourself, don't ask:** naming, file structure, helper signatures, easing curves, micro-copy
that follows the voice in `docs/02`, test fixtures, commit messages.

**Ask before doing:** adding a dependency, adding a server route, changing the artboard geometry in
`docs/03`, changing any brand hex, changing the default caption, anything that touches the share URL
shape.

**Working style:** Arunish learns by seeing it run. Prefer shipping a rough visible thing over
describing a perfect plan. When a decision is genuinely 50/50, build both and show them side by side
rather than writing paragraphs about it.

**Commit discipline:** small commits, imperative subject, one concern each. Every commit must build.
Push to `main` only after the gate in §3 passes.

**Scope pressure is real.** Cut lines are triggered by *phase state*, not by the clock — the table in
`docs/05` §Cut lines defines exactly when each becomes available. If a phase is dragging, say so early,
name the cut you'd recommend, and wait for Arunish to call it. Never pull a cut line unilaterally, and
never infer urgency from the current date.

---

## 10. Known traps

- **iOS Safari canvas memory.** Downscale the source bitmap to max 2048 px on the long edge *before*
  drawing. A raw 48 MP photo will crash the tab.
- **EXIF rotation.** Use `createImageBitmap(file, { imageOrientation: 'from-image' })`. Without it,
  every iPhone portrait comes in sideways.
- **HEIC.** iOS often converts on `<input type=file>` — but not from the Files app. Sniff the magic
  bytes, not the extension (`.heic` files sometimes arrive with an empty MIME type).
- **X circular crop.** Format A is masked to a circle on profile pages. Nothing meaningful may sit in
  the square's corners, and the dashed orbit must stay inside r = 512.
- **`twitter.com` vs `x.com`.** Use `x.com/intent/post`. The old `twitter.com/intent/tweet` still
  redirects but adds a hop.
- **Pink on cream is 3.83:1.** `#EA3380` is an accent, never body text. Details in `docs/02` §4.
- **Vercel Blob in dev.** Needs `BLOB_READ_WRITE_TOKEN` in `.env.local`; without it the share route
  must degrade gracefully rather than throw.

---

## 11. Doc index

| File | Read it when |
|---|---|
| `docs/00-BRIEF-AND-INTEL.md` | You need the source requirements or competitor landscape |
| `docs/01-PRD.md` | Scoping a feature, writing acceptance criteria |
| `docs/02-DESIGN-SYSTEM.md` | Any colour, type, spacing, motion or copy decision |
| `docs/03-ARTBOARD-SPEC.md` | Implementing or changing a renderer — exact pixel geometry |
| `docs/04-ARCHITECTURE.md` | Data flow, share pipeline, performance budgets, risks |
| `docs/05-BUILD-PLAN.md` | Starting a session — the Status block says what phase we're in |
| `docs/06-CLAUDE-CODE-PROMPTS.md` | Copy-paste kickoff prompts per phase |
| `docs/07-QA-AND-LAUNCH.md` | Pre-deploy and pre-submit checklists |
| `docs/08-X-POST-PLAYBOOK.md` | Writing the post, the thread, the timing |
| `docs/09-SCHEDULE.md` | **Arunish's calendar — not yours.** Every date in the project lives here |
| `docs/10-DECISIONS.md` | **Read at session start.** Settled ambiguities — do not re-open these |
