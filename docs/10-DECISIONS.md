# 10 — Decisions

Ambiguities and contradictions that have been found and settled. **Do not re-open these.** If you
think one is wrong, say so and wait — don't quietly implement the other reading.

Add to this file whenever a new contradiction gets resolved. One entry per decision: what was
ambiguous, what was decided, and why the loser lost.

---

## D1 · Format C is both expected and cut line 1

**Was ambiguous:** `CLAUDE.md` called Format C "not optional… scored", the PRD scoped it P1, and the
build plan listed it as the first thing to sacrifice. Three different priorities.

**Decided:** all three are correct and the wording was sloppy. Format C is **expected to ship and is
also cut line 1**. hhgoa.com's task blurb explicitly asks for a combined team frame and nearly every
competitor skipped it, so it's the single biggest differentiator available. But the task **PDF**
doesn't require it, and Formats A and B satisfy the brief on their own — which is exactly what makes
it the safest thing to drop under pressure.

**Why it isn't a contradiction:** "highest value" and "first to cut" are the same property viewed from
two directions. A cut line is not a statement about importance; it's a statement about what can be
removed without breaking the submission.

**Build it as if it's shipping.** Only Arunish pulls the cut line.

---

## D2 · The pip angle outranks the Crew Card tilt

**Was ambiguous:** `docs/02` §1 said the pip sits at 83.5° on every card, invariant. `docs/03` §3 then
rotated each crew member's *entire* ring unit by `(-6 + 4i)°`, pip included — so no member actually
landed on 83.5°.

**Decided:** `docs/03` §3 was wrong and is now fixed. The per-member tilt applies to the **photo,
hairline, green band and band text only**. The pip is drawn after `ctx.restore()`, positioned at
`PIP_ANGLE_DEG` in unrotated canvas space relative to that member's centre.

**Why the pip won:** the signature is the one thing carried identically across all three artboards.
It's what makes a PFP, a Builder ID and a Crew Card read as the same product, and it's the detail the
launch thread is built around (`docs/08` tweet 3). The tilt is a texture; the pip is the identity.
Textures give way.

**What it should look like:** four bands laid down by hand at slightly different angles, four suns at
the same point in the same sky. Slightly odd on purpose. **If it looks wrong on screen, drop the
tilt — never the pip angle.**

---

## D3 · When the PNG downloads

**Was ambiguous:** `CLAUDE.md` §7 implied the download only happened as an upload-failure fallback.
`docs/04` §4c downloaded unconditionally before even attempting the upload.

**Decided:** `docs/04` was right for the link path, and neither doc covered the native path properly.
Final behaviour, now in `CLAUDE.md` §7:

| Path | Download? |
|---|---|
| Native share succeeds (`canShare({files})`) | **No** — the file is already attached; a duplicate in the camera roll is user-hostile |
| Link path | **Yes, before the upload starts** |
| Upload fails | Already downloaded — intent with `text` only, plus the toast |

**Why download before uploading on the link path:** native images out-perform link cards on X, so a
meaningful share of people will attach the file manually even though our OG preview works. And if the
upload dies mid-flight they already have the artefact. The cost is one extra file in Downloads; the
benefit is that the flow cannot dead-end.

---

## D4 · Both hashtags are tokens

**Was ambiguous:** the caption hardcoded `#FrameInGoa` and `#FramedInGoa`, but `EVENT` defined only
one tag — so the secondary tag had nowhere to live, breaking the "every string is a token" rule.

**Decided:** `EVENT.tag = '#FrameInGoa'` (primary, used by every official source) and
`EVENT.tagAlt = '#FramedInGoa'` (secondary, from one third-party town-hall recap). Both appear in
every caption, primary first.

**Why carry both:** twelve characters removes the only failure mode that would invalidate an otherwise
complete submission. Cheap insurance against a spelling we can't verify.

---

## D5 · `tokens.ts` generates the CSS, not the other way round

**Was ambiguous:** `COLOR` in `docs/03` listed eight colours while `globals.css` in `docs/02` listed
ten, and both claimed to be the source of truth.

**Decided:** `lib/render/tokens.ts` owns all ten. `app/globals.css` custom properties are **generated
from `COLOR` at build time**. The CSS block in `docs/02` §2 is documentation of the output, not a
second list to maintain.

**Why generate rather than just adding the two missing entries:** the missing colours were a symptom.
The real problem was two hand-maintained lists that can silently drift, and a green that's four hex
digits off in one place is exactly the bug you don't find until someone screenshots it.

---

## D6 · Team identity lives in `tokens.ts`

**Was ambiguous:** PRD §10 Q1 asked what team name and handle to use for the caption signature and was
never answered.

**Decided:** a `TEAM` const in `lib/render/tokens.ts`, alongside `EVENT`.

```ts
export const TEAM = {
  name:   'Nether Navigator',
  handle: '@arunishrajput',
  repo:   'https://github.com/arunishrajput/HHG-FRAMEIN-GOA',
} as const
```

Used in exactly three places: the Crew Card's default team name, the caption signature in
`lib/share/xIntent.ts`, and the README. Nowhere else.

All fields are final. No placeholders remain in `TEAM`.

---

## D7 · Ship on `*.vercel.app`, no custom domain

**Decided:** production origin is the Vercel project URL — `https://hhg-framein-goa.vercel.app`,
assuming the Vercel project is named after the repo. Set it in `NEXT_PUBLIC_SITE_URL` and nowhere else.

**What this costs:** a link preview from a `*.vercel.app` subdomain reads slightly more like a
submission and slightly less like a product. Accepted — it costs nothing functional, and every OG
mechanic works identically.

**The rule that still matters:** `NEXT_PUBLIC_SITE_URL` remains the **only** place an origin appears.
Not in a component, not in a test fixture, not in a share helper. This is what keeps a late change of
mind cheap — right up until the post goes out, after which the origin is frozen because every share
link already in the wild points at it.

**Confirm the real URL before P4 ships.** Vercel derives the subdomain from the project name, and if
`hhg-framein-goa` is taken it will silently append a suffix. Check the actual deployment URL and set
the env var from what Vercel gives you, not from what this doc predicts.

---

## D8 · Crew Card opens with three slots

**Decided:** the Crew Card renders three member slots by default, with add/remove down to 2 and up to 4.

**Why three:** hhgoa.com's own FAQ says *"Teams of 1–3 people are encouraged, but solo participants are
also accepted."* Three is the modal team size for this event, so it's the layout most people will land
on without touching anything. Supporting four costs nothing and covers the edge.

---

## Still open

Nothing blocking. Two things to confirm rather than decide:

| # | Confirm | By |
|---|---|---|
| 1 | The GitHub username is `arunishrajput` (assumed from the X handle) — fix `TEAM.repo` if not | P5 |
| 2 | The real Vercel deployment URL, and `NEXT_PUBLIC_SITE_URL` set to match it | P4 |
| 3 | `Nether Navigator` matches the team name registered on Devfolio **exactly** | Before submitting |
