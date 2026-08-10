# 01 — Product Requirements Document

**Product:** Frame In Goa
**Owner:** Arunish
**Status:** Approved for build · 9 Aug 2026
**Ship:** 11 Aug 2026 (post) · 12 Aug (form) · 13 Aug 11:59 pm IST (hard deadline)

---

## 1. Problem

Twenty thousand people registered for HH Goa 2026 and five thousand are competing for a seat. They all
want to show they're in it. Right now that means either posting a plain screenshot or fighting an image
editor to line a photo up inside a frame. There's no fast, phone-friendly way to turn a photo into
something that unmistakably says *HH Goa 2026* and is worth posting.

## 2. Goal

A person opens the site on their phone, drops in a photo, and thirty seconds later has posted a
graphic to X that other people want to copy. No account, no crop tool, no thinking.

## 3. Success criteria

| | Measure | Target |
|---|---|---|
| P0 | Upload → visible result, mid-tier Android on 4G | < 2.0 s |
| P0 | Taps from landing to a downloaded file | ≤ 3 |
| P0 | X link preview shows the generated graphic | 100% of shares |
| P0 | Photos that need manual repositioning | < 10% |
| P1 | Lighthouse mobile performance | ≥ 90 |
| P1 | First-load JS | < 180 KB gzip |
| P1 | Works on iOS 16+ Safari, Android Chrome 110+, desktop Chrome/Safari/Firefox | pass |

Outcome measures (not controllable, but what we're optimising toward): the post gets replies and
reposts rather than just impressions; strangers generate their own cards using our tool.

## 4. Users

**Primary — the HH Goa applicant.** On a phone, probably in a hurry, has one selfie handy, wants to
post something that looks like they belong. Cares about looking good, not about features.

**Secondary — the HH Goa judge.** Opens the link on a laptop, tries to break it in ninety seconds:
a landscape photo, a weird aspect ratio, no name filled in. Checks whether the share flow actually
works. Then possibly opens the GitHub repo.

**Tertiary — the teammate.** Sent a link by the primary user, wants their face on the crew card.

## 5. Scope

### In — P0 (must ship, in this order)

**F1 · Photo input**
Tap-anywhere drop zone. Accepts JPG, PNG, WebP, HEIC/HEIF. Drag-and-drop on desktop, camera or gallery
on mobile. Paste-from-clipboard on desktop. EXIF orientation honoured. Source downscaled to 2048 px on
the long edge before any drawing. Clear, non-blaming error for unsupported or corrupt files.

**F2 · Auto-framing**
The photo is fitted to the target slot automatically, with the subject's face centred where possible.
Face detection runs in the background with a hard 800 ms timeout; on miss or timeout, fall back to a
rule-of-thirds crop biased toward the upper third. A collapsed "Adjust" affordance offers drag and
zoom for the minority who want it. **The default path never asks the user to crop.**

**F3 · Format A — PFP Frame** (1024×1024)
Photo in a circular slot, wrapped in the HH Goa ring: cream hairline, green band with curved event
text, pink dashed orbit, yellow palm pip at the 2:47 hour angle. Designed to survive X's circular mask.

**F4 · Format B — Builder ID** (1600×2000)
Fields: Name (required), Stack/Role (required), X handle (optional). Generated: Builder Class and
Builder ID number, both deterministic from the inputs, with a reroll on the class. Full geometry in
`docs/03`.

**F5 · Download**
One tap → real PNG on disk. Filename `hhgoa-2026-{format}-{slug}.png`.

**F6 · Share to X**
Mobile: `navigator.share()` with the file attached where supported. Universal: upload to blob, open
`x.com/intent/post` with a pre-filled caption and a `/s/[id]` link whose OG preview is the graphic.
Caption is editable in-app before sharing. Full pipeline in `CLAUDE.md` §7.

**F7 · Share landing page** (`/s/[id]`)
Shows the graphic large, names the person, and has one CTA: "Make yours". This page is the growth
loop — every share is an ad for the tool, which is exactly what the leaderboard rewards.

### In — P1 (ship if Day 2 ends on time)

**F8 · Format C — Crew Card** (1600×900) — 2–4 people in one combined frame, per-person name, one shared
crew class, add/remove/reorder slots. *P1 here means "expected to ship, first to be cut" — it's the
site's explicit ask and the field's biggest gap, but the PDF brief is satisfied without it. See
`docs/10-DECISIONS.md` D1.*

**F9 · Caption editor** — a text area pre-filled with the default caption, with the hashtags pinned and
non-deletable.

### In — P2 (only with genuine slack)

- **F10** Sample photo ("try it without uploading") for judges who won't upload their own face
- **F11** 9:16 story variant of Format B
- **F12** Keyboard shortcuts on desktop (`D` download, `S` share, `R` reroll class)

### Out — explicitly not building

Accounts, saved cards, a gallery of others' cards, analytics dashboards, QR codes, PDF export,
LinkedIn/Instagram share buttons, print-ready output, i18n, a backend database, AI image generation
of any kind, video output. Each of these either isn't in the brief, is already done better by a
competitor, or costs a day we don't have.

## 6. The flow

```
   ┌────────────────────────────────────────────────────────┐
   │  LANDING — one screen, no scroll needed on a phone      │
   │  headline · format switch (PFP / ID / CREW) · drop zone │
   └───────────────────────────┬────────────────────────────┘
                               │ pick a photo
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │  decode → EXIF → downscale → auto-frame                 │
   │  ~200–600 ms · skeleton with the ring already drawn     │
   │  (HEIC adds ~1 s and says so: "Converting iPhone photo")│
   └───────────────────────────┬────────────────────────────┘
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │  RESULT — live canvas preview, already correct          │
   │  Format B/C: fields appear beside it, card updates live │
   │  optional ▸ Adjust  ·  ↻ reroll class                   │
   │                                                          │
   │  [ Download PNG ]   [ Post on X ]                        │
   └────────────────────────────────────────────────────────┘
```

**Rule:** the result is visible before any field is filled. Format B renders with placeholder text the
instant a photo lands. Never gate the preview behind a form — that's the "signup gate" failure mode in
a different costume.

## 7. Content requirements

- **Builder Class** — exactly **247** possible classes, from 19 adjectives × 13 nouns. Deterministic
  from name + handle so the same person always gets the same class; reroll advances a seed. Vocabulary
  is Goa + AI + crypto + shipping, never generic ("Ninja", "Rockstar", "Guru" are banned).
- **Builder ID** — `HHG-2026-XXXX`, four base36 chars from a stable hash of name + handle.
- All event strings (dates, coordinates, taglines, day names) come from `lib/render/tokens.ts`.

## 8. Non-functional requirements

**Performance** — see §3. Budget breakdown in `docs/04` §5.
**Privacy** — photos are processed entirely in the browser. Nothing leaves the device until the user
taps Post on X, and only the finished graphic is uploaded then. This is stated in the UI, once, plainly.
**Accessibility** — WCAG AA on all text, visible focus rings, full keyboard path, `prefers-reduced-motion`
honoured, meaningful alt text on the generated preview.
**Resilience** — every network call has a fallback that keeps the user moving. Blob upload failure
degrades to download-plus-intent. Face detection failure is invisible. HEIC conversion failure asks for
a JPG in one friendly sentence.
**Browser support** — iOS Safari 16+, Android Chrome 110+, desktop Chrome/Edge/Safari/Firefox current-1.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Two days of build slip into deadline day | Fatal | Post 11 Aug, form 12 Aug; cut F8 then F2's face model, in that order |
| X caches a stale OG image | High — kills the differentiator | Fresh blob id per share; verify with X's Card Validator before posting |
| iOS Safari canvas crash on large photos | High | Hard 2048 px downscale before draw; test with a real 48 MP photo |
| Face model bloats bundle or hangs | Medium | Lazy-load, background, 800 ms timeout, silent fallback |
| Fonts not loaded when canvas draws | Medium — silently wrong output | `await document.fonts.ready` in the render entry point |
| Hashtag ambiguity (`#FrameInGoa` vs `#FramedInGoa`) | Medium — could invalidate | Caption carries both; `#FrameInGoa` first |
| Vercel Blob quota or token missing in prod | Medium | Check env at build; graceful degrade; alternative is Cloudflare R2 |

## 10. Open questions

| # | Question | Status |
|---|---|---|
| 1 | Team name and handle for the caption signature | ✅ **Resolved** — `TEAM` in `lib/render/tokens.ts`: *Nether Navigator*, `@arunishrajput`, repo `HHG-FRAMEIN-GOA`. No placeholders remain |
| 2 | Repo public before the post, or at submission? | ✅ **Resolved** — public before the post, per `docs/08` tweet 4. The town-hall recap says GitHub is reviewed |
| 3 | Custom domain or `*.vercel.app`? | ✅ **Resolved** — `*.vercel.app`, no custom domain. `NEXT_PUBLIC_SITE_URL` remains the *only* place the origin appears |
| 4 | Crew Card default member count | ✅ **Resolved** — opens on 3, supports 2–4. hhgoa.com's FAQ says teams of 1–3 |

Full rationale for every resolved item is in `docs/10-DECISIONS.md`.
