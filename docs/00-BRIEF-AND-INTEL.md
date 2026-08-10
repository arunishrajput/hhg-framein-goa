# 00 — Brief & Competitive Intel

Research date: **9 August 2026**. Sources: both task PDFs, hhgoa.com homepage, hhgoa.com/radar
leaderboard, hhgoa.com/terms, and public competitor repos/deployments found via search.

---

## 1. The task, restated

Build a web tool where someone uploads a photo and instantly gets back a branded HH Goa 2026 graphic,
ready to download and share on X. Pick Format A (PFP frame/overlay), Format B (Builder ID card), or both.

**Required flow:** upload (jpg/png/HEIC) → optional quick fields (Format B) → near-instant generation →
download → Share to X with a pre-filled caption.

**Requirements:** speed; handles real photos of any orientation and crop; unmistakably on-brand;
a real downloadable image file; a working share flow with `#FrameInGoa`; mobile-friendly.
No login wall, no signup gate, works in one pass.

**Submit:** live working link via `https://forms.gle/jM5hTaGvsrfEfixPA`, plus the X post.
**Deadline:** 11:59 pm, 13 August 2026. **One submission per team.**

⚠️ A submission is flagged as an error if the X post does not contain the hashtag.

---

## 2. What the PDFs miss — extra signal from hhgoa.com

The homepage task card carries seven bullets the PDFs don't spell out. These read like the actual
judging rubric, and two of them are requirements in disguise:

| Bullet from the site | What it actually demands |
|---|---|
| Instantly recognizable HH Goa 2026 identity | Brand fidelity is scored, not assumed |
| 1-click download + 1-click Share to X | Two taps total, not "download then manually attach" |
| Works on any photo — no manual cropping | **Auto-framing is a requirement, not a nice-to-have** |
| Personalized: name, stack, a generated builder class | The class must be *generated*, not picked from a dropdown |
| Seconds from upload to shareable output | Perceived latency is scored |
| Get to the top of the ladder and win the exclusive HH Goa ID | There is a public ranking; see §4 |
| Use #FrameInGoa to get featured in the Radar | The post feeds the leaderboard |

And the task blurb itself: *"Use that same generator to bring your teammates into one combined frame.
Post it on X with a quick how-to on generating your own #FrameInGoa post using your generator."*

Two things fall out of that sentence that most entrants have missed:

1. **A combined multi-person frame is explicitly requested.** → our Format C, Crew Card.
2. **The post must be a how-to**, not a "here's my submission" brag. → see `docs/08`.

---

## 3. Event facts worth putting *into* the artwork

These are what make the output unmistakably this event rather than a generic badge.

- Hacker House Goa 2026 · **28–31 October 2026** · Goa, India
- Organised by **2:47 PM Studio** — the "2:47" is their signature; we use it as our clock motif
- **247 builders** selected (the number echoes 2:47)
- Tagline: **"Less Noise. More Signal."**
- Positioning line: **"4 days. one rhythm. everything intentional."**
- The four days are named: **Genesis Day / Day of Triangle / Build Day / Launch Day**
- Goa coordinates commonly used in the scene: **15.2993° N, 74.1240° E**
- The site uses Devanagari **गोवा** as a graphic element — on-brand to echo
- Framing of the event: AI × Crypto builder residency, private beach resort, palms and sunrise motifs
- Handles: `@247pmstudio` on X, `hhgoa.com`

---

## 4. The W Celeb Radar — how ranking actually works

`hhgoa.com/radar` is a live public leaderboard of Task #1, listing team name, X profile, post link,
**Views**, and **Score**. As of 9 Aug it had 24 teams.

Critically, **score is not views**:

| Rank | Team | Views | Score |
|---|---|---|---|
| 1 | Craftorā | 451 | 60 |
| 2 | Team Gravity | 1.6 K | 38 |
| 3 | Tech Hawks | 525 | 30 |
| 11 | TEAM EX | 937 | 5 |

The #1 team has a third of #2's views and nearly double the score. Rank 11 has more views than rank 3
and a sixth of the score. So score is something like weighted engagement (likes + reposts + replies +
quotes) and/or a manual quality mark — **not reach**. Buying eyeballs does nothing; a post that makes
people *reply and repost* is what moves you.

Two direct implications for us:

- **The post is a deliverable, not an afterthought.** Budget real time for it. `docs/08` handles this.
- **Post early.** Score accrues over time and the board is live. Every day we sit on it is engagement
  we don't bank. Target: post the evening of **11 August**, submit the form **12 August**, keep the
  deadline day as pure buffer.

Also note from the town-hall recap: selection in Task 1 makes a team eligible for onsite; later tasks
are optional. The social post is mandatory but is one factor alongside a GitHub/Devfolio review —
**so the repo will be looked at.** Keep it public, keep the README good, keep commit history clean.

---

## 5. What the competition has already shipped

Six-plus public submissions were already live on 9 Aug. Patterns across them:

**Everybody has:** photo upload, a circular PFP frame, a builder ID card, a random builder-title
generator, PNG download, a Share-to-X button, Vercel deploy, Next.js or Vite + Tailwind.

**Some have:** HEIC via `heic2any`, drag-to-reposition + zoom sliders, LinkedIn/Instagram share,
`html-to-image` export, a QR code on the card, a public builder profile page.

**Almost nobody has:**

| Gap | Why it matters | Our answer |
|---|---|---|
| A genuinely combined **team** frame | Explicitly requested on the site | Format C, Crew Card |
| **Automatic** framing | Site says "no manual cropping" — sliders are the opposite of that | Face-aware auto-frame, sliders demoted to optional nudge |
| A share link whose **OG preview is the actual graphic** | The brief calls this out by name; most punt to "download and attach manually" | Blob + `/s/[id]` dynamic OG |
| Sub-second render | Several use `html-to-image`, which is slow and font-flaky | Pure Canvas 2D |
| Brand fidelity beyond colours | Most are "green + palm emoji" | Exact hexes, real event strings, the 2:47 clock motif |

**Direct feature-parity risks** — things a competitor already did that we should either beat or skip:
`Sahajananda-ai/hh-goa-frame-generator` has a passport/stamp aesthetic with an MRZ strip and a
Devanagari header. `Tuxhar01/hhg-builder-toolkit` has 250+ titles, QR codes, PDF export and a public
builder profile route. **Do not copy either.** Our exactly-247 title space and the 2:47 clock are our
differentiators; QR codes and PDF export are already taken and are not in the brief — skip both.

---

## 6. Our thesis in one paragraph

Everyone is building the same green-and-palm badge with a random title and a download button. We win
on three axes the brief actually names and the field actually missed: **the frame auto-fits any photo
without asking the user to crop**, **the share link's preview is the real generated graphic**, and
**the artwork is drawn from HH Goa's own visual language** — their exact palette, their dashed orbit
ring, their 2:47 signature, their day names — rather than a logo pasted onto a generic template.
Then we pair it with a how-to post that teaches people to make their own, because the leaderboard
rewards replies and reposts, not impressions.
