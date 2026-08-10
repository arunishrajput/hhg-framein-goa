# 09 — Schedule

> **This doc is for Arunish, not for Claude Code.** It holds every date in the project so that no
> other doc has to. Claude Code works in phases (`docs/05`) and does not pace itself against a
> calendar it can't observe — if you want it to hurry or cut scope, tell it directly and name the
> cut line from `docs/05`.

---

## The fixed dates

| | Date | Note |
|---|---|---|
| **Hard deadline** | **11:59 pm IST, Wed 13 Aug 2026** | Form closes. No second chance. |
| Target: post the thread | **Mon 11 Aug, 7–9 pm IST** | Peak Indian tech X, weekday |
| Target: submit the form | **Tue 12 Aug** | One submission per team |
| Buffer | **Wed 13 Aug** | Deliberately unplanned |

## Why not use the deadline

Two reasons, both worth the discipline:

1. **The Radar score accrues.** `hhgoa.com/radar` is a live board scored on engagement, not views. A
   post that lands on deadline night gets one evening of replies while earlier posts got three.
2. **Every project of this shape overruns.** Two days of slack is what turns "the share flow broke on
   iPhone" from a disaster into a Tuesday morning.

## Phase-to-day mapping (guidance only)

This is a sighting shot, not a commitment. If a phase runs long, the answer is a cut line from
`docs/05`, not a later post date.

```
 Sat 9   →  P0 scaffold, P1 pfp renderer
 Sun 10  →  P2 photo pipeline, P3 id + crew
 Mon 11  →  P4 share pipeline, P5 polish  →  POST ~7–9 pm
 Tue 12  →  submit the form, work the thread
 Wed 13  →  buffer
```

**Decision point: end of Sunday.** If P4 hasn't started, pull cut line 1 (Format C). If P4 hasn't
started by Monday midday, pull cut line 2 (face detection) as well. Those are your calls to make —
say them out loud to Claude Code rather than letting it infer.

---

## Monday — before you post

Run `docs/07-QA-AND-LAUNCH.md` §9 in full. The two that bite:

- **Confirm the production origin before posting.** We're on `*.vercel.app` (`docs/10` D7), so this is
  a check rather than a task: verify `NEXT_PUBLIC_SITE_URL` matches the real deployment URL exactly.
  Changing the origin after the post orphans every share link already in the wild.
- **Make the repo public before tweet 4 goes out.** The town-hall recap says GitHub gets reviewed.

Then `docs/08-X-POST-PLAYBOOK.md` for the thread. Stay free for two hours afterwards — replying is
the score.

## Tuesday — before you submit

Run `docs/07` §10. Read the whole Google Form before filling any field. One submission per team means
a typo in the live link is unrecoverable.

Form: `https://forms.gle/jM5hTaGvsrfEfixPA`

## Wednesday

Nothing planned. Check the Radar, keep replying, ship a fix only if something is actually broken.

---

## If you're behind

In order, and only in this order:

1. Pull cut line 1 (Format C). Formats A and B satisfy the PDF brief alone.
2. Pull cut line 2 (face detection). Framing gets slightly worse on off-centre photos; nobody notices.
3. Slip the post to **Tue 12 Aug evening**, submit Wednesday morning. Costs you a day of engagement.
4. Slip the post to Wednesday. **Last resort** — this leaves zero margin on a hard deadline, and if
   anything breaks between posting and submitting you have no time to fix it.

Do not slip past step 4. A submitted good tool beats an unsubmitted great one by an infinite margin.
