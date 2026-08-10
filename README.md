# Frame In Goa — docs bundle

Everything needed to build and ship the **HH Goa 2026 Task #1** submission with Claude Code.

**Deadline:** 11:59 pm IST, 13 Aug 2026 · **Ship target:** post 11 Aug, submit 12 Aug.

Claude Code works in phases (`docs/05`); every date lives in `docs/09` and is yours to manage.

## Project identity — all settled

| | |
|---|---|
| Team | **Nether Navigator** |
| X | **@arunishrajput** |
| Repo | **HHG-FRAMEIN-GOA** |
| Deploy | Vercel, `*.vercel.app` — no custom domain (`docs/10` D7) |
| Crew Card default | 3 slots, supports 2–4 (`docs/10` D8) |

Team name, handle and repo live in `TEAM` in `lib/render/tokens.ts`. The origin lives in
`NEXT_PUBLIC_SITE_URL` and **nowhere else** — not in a component, not in a test fixture.
Confirm the real Vercel URL at P4 and set the env var from what Vercel actually gives you.

## How to use this

1. Create the repo, drop `CLAUDE.md` at the root and this `docs/` folder beside it.
2. Open Claude Code in that directory.
3. Paste the **Session 0 — Bootstrap** prompt from `docs/06-CLAUDE-CODE-PROMPTS.md`.
   Let it read everything and summarise back before it writes a line of code.
4. Then work through the phase prompts in order.

`CLAUDE.md` is the file Claude Code reads every session. If you change one thing in this bundle,
change that one — it wins over everything in `docs/`.

## The files

| File | What it is |
|---|---|
| `CLAUDE.md` | The operating manual — non-negotiables, stack, render contract, share pipeline, traps |
| `docs/00-BRIEF-AND-INTEL.md` | The task, the extra requirements hidden on hhgoa.com, the leaderboard, what 6+ competitors already shipped |
| `docs/01-PRD.md` | Scope, users, flow, success criteria, what we're explicitly not building |
| `docs/02-DESIGN-SYSTEM.md` | Exact brand palette (sampled from HH Goa's own artwork), type, motion, voice |
| `docs/03-ARTBOARD-SPEC.md` | Pixel-exact geometry for all three output graphics |
| `docs/04-ARCHITECTURE.md` | Data flow, image pipeline, the OG-image share pipeline, perf budgets, risk register |
| `docs/05-BUILD-PLAN.md` | Six phases with exit criteria and cut lines — no dates, by design |
| `docs/06-CLAUDE-CODE-PROMPTS.md` | Copy-paste prompts, one per phase |
| `docs/07-QA-AND-LAUNCH.md` | Device matrix, torture tests, pre-post and pre-submit checklists |
| `docs/08-X-POST-PLAYBOOK.md` | Caption copy, the launch thread, timing, and why the post is scored |
| `docs/09-SCHEDULE.md` | Your calendar — every date in the project, kept out of Claude Code's way |
| `docs/10-DECISIONS.md` | Settled ambiguities with rationale, so no session re-litigates them |

## The three-sentence version

Everyone is building the same green-and-palm badge with a random title and a download button.
We win on the three things the brief actually names and the field actually missed: **auto-framing any
photo without a crop step**, **a share link whose preview is the real generated graphic**, and
**artwork drawn from HH Goa's own visual language** rather than a logo pasted on a template.
Then we pair it with a how-to post, because the leaderboard scores replies, not impressions.
