# 04 — Architecture

---

## 1. Shape of the system

Almost everything runs in the browser. There is exactly one server responsibility — hosting the
generated PNG so that X's crawler can see it in a link preview — and it is deliberately the thinnest
thing we could build.

```
┌─ browser ───────────────────────────────────────────────────────────┐
│                                                                      │
│  File  ─→ decode.ts ─→ ImageBitmap ─→ autoframe.ts ─→ focal point     │
│            │ HEIC?          │ EXIF                │ face or thirds    │
│            └ heic-to        └ max 2048px          └ 800 ms timeout    │
│                                        │                             │
│  fields ──→ identity/ ──→ class + id ──┤                             │
│                                        ▼                             │
│                                   CardSpec                           │
│                                        │                             │
│                              lib/render/index.ts                     │
│                          (canvas 2D, deterministic)                  │
│                                        │                             │
│                        ┌───────────────┴────────────────┐            │
│                        ▼                                ▼            │
│                    <img> preview                   PNG Blob          │
│                                                  ╱          ╲        │
│                                    download ────╯            ╲       │
│                                                               ▼      │
└───────────────────────────────────────────────────────────────┼──────┘
                                                                │
                          POST /api/share  ──────────────────────┘
                                   │
                      ┌────────────▼───────────┐
                      │  Vercel Blob           │
                      │  → https://…/{id}.png  │
                      └────────────┬───────────┘
                                   ▼
                      /s/{id}  generateMetadata()
                      og:image = blob URL
                                   │
                                   ▼
                    x.com/intent/post?text=…&url=…/s/{id}
```

`CardSpec` is the seam. Everything upstream is input gathering; everything downstream is pure
rendering. Keep that boundary clean and the whole thing stays testable.

```ts
type CardSpec =
  | { format: 'pfp';   photo: ImageBitmap; focal: Focal }
  | { format: 'id';    photo: ImageBitmap; focal: Focal;
      name: string; role: string; handle?: string;
      builderClass: string; builderId: string }
  | { format: 'crew';  teamName: string; crewClass: string; crewId: string;
      members: { photo: ImageBitmap; focal: Focal; name: string }[] }  // 2–4
```

---

## 2. Image pipeline

**Decode** (`lib/image/decode.ts`)

1. Sniff the first 12 bytes. `ftyp` + (`heic`|`heix`|`mif1`|`msf1`) → HEIC branch. Do **not** trust
   `file.type` — HEIC from the iOS Files app frequently arrives with an empty MIME type.
2. HEIC branch: `const { heicTo } = await import('heic-to')` — dynamic, so the ~600 KB decoder never
   enters the main bundle. Convert to JPEG at quality 0.92. Show `Converting iPhone photo…`.
3. `createImageBitmap(blob, { imageOrientation: 'from-image' })` — this is what fixes sideways iPhone
   portraits. Without it roughly a third of real uploads come in rotated.
4. If the long edge exceeds 2048, re-bitmap with `resizeWidth`/`resizeHeight` and
   `resizeQuality: 'high'`. Non-negotiable — a 48 MP photo will crash iOS Safari's canvas otherwise.
5. Errors: unreadable → `That file didn't decode. Try a JPG or PNG.` Zero-byte → `That file is empty.`
   Never surface the raw exception.

**Auto-frame** (`lib/image/autoframe.ts`)

Returns a normalised focal point `{ x, y }` in 0–1 source space.

- **Preferred:** MediaPipe Face Detector (BlazeFace short-range) via `@mediapipe/tasks-vision`.
  Loaded lazily and *speculatively* — kick off the model fetch when the drop zone first mounts, so by
  the time the user has picked a photo it is usually warm.
- **Hard 800 ms timeout** from the moment the bitmap is ready. Race the detection against a timer; on
  timeout, resolve with the fallback and let the detection promise die.
- **Multi-face:** pick the box with the largest `area × centrality` score, so a big face at the edge
  loses to a slightly smaller one in the middle. Deterministic tie-break by leftmost box.
- **Focal from box:** `x = box.centerX`, `y = box.centerY - 0.12 × box.height` — biased slightly up,
  because a face centred in a circle looks like a mugshot and a face at 45% height looks like a portrait.
- **Fallback:** `{ x: 0.5, y: 0.38 }`. The upper-third bias is right far more often than dead centre
  for photos of people.
- **Never surface it.** No "face detected!" toast. Success is invisible; failure is invisible.

If the model refuses to load at all — CDN blocked, WASM unsupported — the whole feature no-ops and the
product still works. That is the test: unplug the model and the tool must be indistinguishable except
for slightly worse framing on off-centre photos.

---

## 3. Render

One module, one entry point, canvas 2D only.

```ts
export async function render(spec: CardSpec): Promise<{ blob: Blob; dataUrl: string }> {
  await document.fonts.ready           // invariant #2 — never skip
  const { w, h } = ARTBOARD[spec.format]
  const canvas = new OffscreenCanvas(w, h)   // fall back to <canvas> where unsupported
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'
  DRAW[spec.format](ctx, spec)
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return { blob, dataUrl: URL.createObjectURL(blob) }
}
```

`OffscreenCanvas` keeps the main thread free; Safari 16.4+ supports it, and the `<canvas>` fallback
covers the rest. **Do not** move rendering into a Worker in v1 — transferring `ImageBitmap`s plus
loading fonts in a worker context is a half-day of yak-shaving for ~40 ms.

**Preview:** set the `<img>` `src` to the object URL. The preview *is* the output — there is no second
code path that could drift. Revoke the previous object URL on every re-render or you'll leak memory
across keystrokes.

**Debounce:** re-render on a 120 ms trailing debounce while typing. Below that, the canvas work
competes with keystroke handling on cheap Androids.

---

## 4. Share pipeline

### 4a. `POST /api/share`

```ts
export const runtime = 'nodejs'      // Blob SDK needs it; edge runtime will not work
export const maxDuration = 15

// body: multipart/form-data { file: Blob, format: 'pfp'|'id'|'crew', name?: string }
// 1. validate: content-type image/png, size ≤ 6 MB, magic bytes are a real PNG
// 2. id = nanoid(10)
// 3. put(`cards/${id}.png`, file, { access: 'public', contentType: 'image/png',
//      cacheControlMaxAge: 31536000, addRandomSuffix: false })
// 4. store { id, url, format, name, createdAt } — Vercel KV, or a second tiny JSON blob at meta/${id}.json
// 5. return { id, url }
```

Guards: reject non-PNG, reject oversize, rate-limit by IP to 20/minute. No auth — there's nothing to
protect and an auth check would violate the no-login rule in spirit.

### 4b. `/s/[id]`

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const card = await getCard(params.id)
  if (!card) return { title: 'Frame In Goa' }
  const { W, H } = ARTBOARD[card.format]
  return {
    title: `${card.name ?? 'A builder'} · HH Goa 2026`,
    description: 'Made with Frame In Goa. Drop a photo, get your HH Goa 2026 frame. #FrameInGoa',
    openGraph: { images: [{ url: card.url, width: W, height: H }], type: 'website' },
    twitter:   { card: 'summary_large_image', images: [card.url] },
  }
}
```

Non-negotiables on this route:
- `card.url` is absolute `https://`. Set `metadataBase` in the root layout so relative URLs can't sneak in.
- `twitter:card` is `summary_large_image`. Without it X renders a tiny thumbnail and the whole
  differentiator evaporates.
- Width and height are declared. X uses them to reserve the card.
- A **fresh id per share**. X caches OG data per URL — reusing an id shows a stale image.
- The page itself renders the graphic large plus one CTA, "Make yours". Every share becomes an ad for
  the tool, which is exactly the behaviour the Radar's engagement score rewards.

### 4c. Client orchestration

```
onShare():
  caption = buildCaption(spec)                       // see docs/08
  if (navigator.canShare?.({ files: [pngFile] })):
      await navigator.share({ files: [pngFile], text: caption })
      // image lands directly in the composer — best case, mobile
      return
  triggerDownload(pngBlob)                           // so they always have the file
  { id } = await postShare(pngBlob)                  // ~1–2 s, show inline progress not a modal
  window.open(`https://x.com/intent/post?text=${enc(caption)}&url=${enc(`${origin}/s/${id}`)}`, '_blank')
```

`window.open` must be called from within the original click's task where possible, or Safari's popup
blocker eats it. Since the blob upload is async, **open the tab first with `about:blank` and set its
`location` when the id returns.** This is the standard workaround and it is the difference between
"share works" and "share works except on iPhone".

Failure path: upload fails → the file is already downloaded → open the intent with `text` only and
toast `Saved your PNG. Attach it to the post.` The flow never dead-ends.

---

## 5. Performance budget

| Stage | Budget | How |
|---|---|---|
| First-load JS | **180 KB gzip** | No UI library, no state library, HEIC + face model both dynamic |
| LCP (mobile 4G) | **< 1.5 s** | Static shell, `next/font` self-hosted, hero is text + inline SVG ring |
| Decode (JPG/PNG) | < 250 ms | `createImageBitmap`, no `<img>` round-trip |
| Decode (HEIC) | < 1.5 s | Lazy WASM, honest progress text |
| Auto-frame | ≤ 800 ms | Hard timeout, speculative model warm-up |
| Render one artboard | **< 120 ms** | Canvas 2D; measure with `performance.mark` in dev |
| Re-render on keystroke | < 60 ms | Debounce 120 ms; photo bitmap cached, not re-decoded |
| Blob upload | < 2 s on 4G | PNG is 0.8–2 MB; upload only on share |

Assert the render budget in CI: `pnpm test` fails if any artboard exceeds 200 ms on the fixture set.

**No full-screen loader, ever.** States are inline and progressive: the ring is drawn before the photo
exists, so the user always sees the product taking shape rather than a spinner.

---

## 6. Environment

```bash
BLOB_READ_WRITE_TOKEN=      # Vercel Blob; auto-injected in prod, needed in .env.local for dev
NEXT_PUBLIC_SITE_URL=       # absolute origin, used for metadataBase and share URLs.
                            # Production: the Vercel deployment URL (expected
                            # https://hhg-framein-goa.vercel.app — confirm at P4, Vercel
                            # appends a suffix if the project name is taken).
                            # This is the ONLY place an origin appears anywhere in the repo.
KV_REST_API_URL=            # optional — only if using KV for card metadata
KV_REST_API_TOKEN=
```

If `BLOB_READ_WRITE_TOKEN` is absent, `/api/share` returns `503` with a documented shape and the client
takes the download-plus-intent path. Local dev must work without any secrets — that keeps the repo
clone-and-run for anyone reviewing it.

---

## 7. Deployment

Vercel, `main` auto-deploys to production. Preview deploys on every PR.
`next.config.ts`: `images.unoptimized = true` (we serve one blob PNG and generate the rest ourselves),
and a `Cache-Control: public, max-age=31536000, immutable` header on `/cards/*`.

**Custom domain:** decided against (`docs/10` D7). We ship on `*.vercel.app`. Every OG mechanic works
identically; the only cost is that the link preview reads slightly more like a submission. The origin
is frozen the moment the post goes out, because every share link already in the wild points at it — so
confirm the real deployment URL at P4 and don't touch it after.

---

## 8. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Trigger to act |
|---|---|---|---|---|---|
| R1 | X shows a blank/stale OG preview | Med | **Fatal to our edge** | Fresh id per share; validate with X's Card Validator on the real prod URL before posting | Any preview test that isn't the graphic |
| R2 | iOS Safari canvas crash | Med | High | 2048 px downscale before draw | Any tab reload on a real iPhone |
| R3 | Popup blocked on iOS share | High if naive | High | Open blank tab synchronously, set location after upload | Share silently does nothing on iPhone |
| R4 | Face model bloats or hangs | Med | Med | Lazy + speculative + 800 ms timeout + silent fallback | Bundle > 180 KB, or decode > 1 s |
| R5 | Fonts not ready at first draw | Med | Med — wrong output, silently | `await document.fonts.ready`; visual test asserts glyph widths | Fallback font in any test PNG |
| R6 | Build slips past 12 Aug | Med | High | Cut order: Format C → face model → caption editor | Day 2 ends with share pipeline unfinished |
| R7 | Blob quota / token missing in prod | Low | High | Env check at build; documented 503 fallback | Any 5xx from `/api/share` in prod |
| R8 | Hashtag is actually `#FramedInGoa` | Low | **Fatal** | Caption carries both tags | — |
| R9 | Someone ships the same idea better | Med | Med | Our edge is the sum of three things, not one; the how-to post is hard to copy in two days | — |
