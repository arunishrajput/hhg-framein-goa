# 07 — QA & Launch

Run the whole of §1–§5 on the **production URL**, on **real devices**, before the post goes out.
Devtools device emulation does not catch the three bugs most likely to sink this: the iOS popup
blocker, the Safari canvas memory ceiling, and HEIC from the Files app.

---

## 1. The ninety-second judge test

Do this first, cold, on a phone you haven't used for development. This is what an organiser will do.

- [ ] Open the link. Is it obvious what this is and what to do, within two seconds?
- [ ] Upload a landscape photo with the face off to one side. Is the face framed correctly, with no
      crop step?
- [ ] Download. Does a real PNG land in the camera roll / downloads?
- [ ] Tap Post on X. Does the composer open with the caption and the image or link?
- [ ] Does the link preview show the actual graphic?
- [ ] Total elapsed time from opening the link to a posted tweet?

If any of those is a "no" or takes more than ninety seconds, that's the bug to fix. Everything else
is secondary.

---

## 2. Device matrix

| Device | Browser | Must pass |
|---|---|---|
| iPhone (iOS 16+) | Safari | HEIC upload · EXIF rotation · native share sheet with file attached · download to Photos |
| iPhone | Chrome | Same, minus share-sheet differences |
| Android mid-tier | Chrome | Render under 2 s · camera capture · share sheet |
| Android low-end | Chrome | No crash on a 12 MP photo; render under 4 s is acceptable here |
| macOS / Windows | Chrome | Drag-drop · paste from clipboard · popup opens · download |
| macOS | Safari | Popup not blocked · `download` attribute honoured |
| Any | Firefox | Renders and downloads; `canShare` correctly absent, falls back cleanly |

Small-screen check: 360 × 640. Nothing may require horizontal scrolling, and the primary CTA must be
reachable without scrolling past the preview.

---

## 3. Photo torture tests

- [ ] HEIC from an iPhone **camera roll** (usually auto-converted by Safari)
- [ ] HEIC from the iPhone **Files app** (often *not* converted, and with an empty MIME type — this is
      the one that breaks naive implementations)
- [ ] 48 MP photo — no tab crash, no memory warning
- [ ] 400 × 400 low-res — upscales without visible ringing
- [ ] 16:9 landscape, face far left
- [ ] 9:16 portrait, face very close to the top edge
- [ ] Group photo, three faces — deterministic pick, same result on reload
- [ ] Photo with no face at all (a landscape, a dog) — falls back gracefully, never errors
- [ ] Transparent PNG — the alpha doesn't punch a hole in the card
- [ ] Animated GIF — takes frame one, doesn't hang
- [ ] A `.txt` renamed to `.jpg` — friendly error, no stack trace
- [ ] A 0-byte file — friendly error

## 4. Text torture tests

- [ ] Name: `Bartholomew Vengeance Chatterjee-Rao` — fits or ellipsises, never overflows
- [ ] Name: `A` — doesn't look broken at max font size
- [ ] Name: `ಅರುಣೀಶ್` (non-Latin) — renders or degrades visibly, doesn't produce tofu boxes silently
- [ ] Name with emoji — doesn't break `measureText` or the layout
- [ ] Role: `Distributed Systems · Rust · Zero-Knowledge Proofs` — wraps to two lines cleanly
- [ ] All fields empty — Format B still renders with sensible placeholders
- [ ] Handle with and without a leading `@` — normalised to one form
- [ ] Reroll the class fifteen times — no repeat within the first ten, nothing offensive, always fits

## 5. Share-flow verification

This section is the differentiator. Do not skip a line.

- [ ] Post a real test tweet from an iPhone via the native share sheet — image attached correctly
- [ ] Post a real test tweet from desktop via the link path
- [ ] Open the posted tweet on a **different account** — the preview shows the generated graphic
- [ ] Run the production `/s/{id}` URL through X's Card Validator — shows the graphic, not a default
- [ ] Share twice in a row — the second preview shows the *second* graphic, not a cached first
- [ ] Caption contains `#FrameInGoa` exactly, correctly capitalised
- [ ] The `/s/{id}` page loads standalone and its CTA works
- [ ] With `BLOB_READ_WRITE_TOKEN` unset — download-plus-intent fallback fires, with a clear toast
- [ ] With the network killed mid-upload — no hang, no dead end
- [ ] Share sheet dismissed by the user — the app returns to a usable state, no stuck spinner

## 6. Accessibility

- [ ] Full keyboard path: upload → fields → reroll → download → share, all reachable, all visible focus
- [ ] The file input is a real `<input type="file">` under the hood, not a div with a click handler
- [ ] Preview `<img>` has meaningful alt text describing the generated card
- [ ] Format switch is a real `role="tablist"` with arrow-key navigation
- [ ] `prefers-reduced-motion: reduce` — the reveal becomes a short fade, not a hard cut
- [ ] All text meets the contrast table in `docs/02` §2; pink is nowhere used as body text
- [ ] Toasts announce via `role="status"`
- [ ] Zoom to 200% — layout holds

## 7. Performance

- [ ] Lighthouse mobile: performance ≥ 90, accessibility ≥ 95, best practices ≥ 95
- [ ] First-load JS < 180 KB gzip (`pnpm analyze`)
- [ ] HEIC decoder and face model confirmed **absent** from the main chunk
- [ ] Render < 120 ms per artboard on the fixture set
- [ ] Upload → visible result < 2 s on throttled 4G with 4× CPU slowdown
- [ ] No layout shift on font load (CLS < 0.05)
- [ ] No object-URL leak: generate fifty cards in a row, memory returns to baseline

## 8. Content and brand

- [ ] Every colour in the codebase appears in `docs/02` §2 — grep for stray hexes
- [ ] No blurred shadow anywhere (`grep -r "box-shadow" | grep -v " 0 var"`)
- [ ] No gradient anywhere
- [ ] Space Mono and Bodoni Moda actually render — not a system fallback
- [ ] Dates, coordinates, taglines, day names match `EVENT` in tokens, spelled and cased correctly
- [ ] The palm pip is at 83.5° on all three artboards
- [ ] `#FrameInGoa` is spelled correctly everywhere — capital F, capital I, capital G
- [ ] No placeholder or lorem text survives anywhere
- [ ] No emoji in interface chrome

---

## 9. Pre-post checklist — gate on P5 complete

*(Calendar target for this gate: `docs/09-SCHEDULE.md`.)*

- [ ] Production deploy is green and loads on a phone from a cold cache
- [ ] `NEXT_PUBLIC_SITE_URL` verified against the real Vercel deployment URL — **frozen from here;
      changing the origin after posting orphans every share link already in the wild**
- [ ] `NEXT_PUBLIC_SITE_URL` matches the final production origin exactly
- [ ] GitHub repo public, README complete with a screenshot and the live link
- [ ] The three real assets generated and saved: Arunish's PFP, Arunish's Builder ID, the team Crew Card
- [ ] Screen recording captured (see `docs/08` §4)
- [ ] Thread drafted, read aloud once, and checked for the hashtag
- [ ] A friend has used the tool on their own phone and produced a card without being told how

## 10. Pre-submit checklist — gate on the post being live

- [ ] Live link opens in an incognito window on a device that has never seen it
- [ ] X post is live, public, and contains `#FrameInGoa`
- [ ] Post URL copied and ready
- [ ] Team name and team ID exactly as registered on Devfolio
- [ ] Form read completely **before** filling anything — one submission per team, no second chance
- [ ] Every field double-checked, especially the URLs
- [ ] Submit
- [ ] Confirmation screenshot saved
- [ ] Check `hhgoa.com/radar` the next morning to confirm the team appears

---

## 11. If something breaks after the post

Order of operations, in priority order:

1. **The live link is down** → roll back to the last good Vercel deploy immediately. Fix after.
2. **Share previews are blank** → check the blob URL resolves, check `twitter:card`, re-share a fresh
   id to get a new cache entry. Do not delete the post.
3. **A specific device fails** → reply in your own thread with a workaround, ship the fix, reply again
   when it's live. Handling a bug in public *well* reads better than never having one.
4. **Someone finds a genuinely embarrassing bug** → thank them, fix it, credit them in the reply.
   That reply is engagement, and engagement is the score.
