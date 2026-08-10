# 08 — X Post Playbook

The post is not the announcement of the deliverable. On this task, the post **is** a deliverable, and
it's the one that moves the leaderboard.

---

## 1. What we know about scoring

`hhgoa.com/radar` publishes Views and Score side by side, and they don't track each other. The #1 team
had 451 views and a score of 60; the #2 team had 1.6 K views and a score of 38; a team at rank 11 had
937 views and a score of 5. So Score is weighted engagement — replies, reposts, quotes, likes — and/or
a manual quality mark. **Reach is not the lever. Response is.**

Second signal, from the task text itself: *"Post it on X with a quick how-to on generating your own
#FrameInGoa post using your generator."* The organisers asked for a **how-to**, not a showcase. Almost
every submission so far posted "here's what I built 🚀." A post that teaches people to use the tool is
both what was asked for and the format that actually generates replies.

So the strategy is: **make it about the reader, not about us.**

---

## 2. The default in-app caption

This is what `lib/share/xIntent.ts` pre-fills. Keep it short — long pre-filled captions get deleted.

**Format A (PFP):**
```
Locked in for Hacker House Goa 2026 🌴

Made my frame in about 10 seconds — drop a photo, that's it.
Make yours ↓

#FrameInGoa #FramedInGoa
```

**Format B (Builder ID):**
```
{name} · {builderClass}
HH Goa 2026 · 28–31 Oct · Goa

Built a generator for these. Drop a photo, get your ID.
Make yours ↓

#FrameInGoa #FramedInGoa
```

**Format C (Crew):**
```
{teamName}, assembled 🌴
HH Goa 2026 · 28–31 Oct

One photo each, one card. Make your crew's ↓

#FrameInGoa #FramedInGoa
```

Both hashtags are included deliberately. Every official source says `#FrameInGoa`; one third-party
recap claimed `#FramedInGoa`. Carrying both costs twelve characters and removes the only failure mode
that would invalidate an otherwise perfect submission. `#FrameInGoa` goes first.

In code these are `EVENT.tag` and `EVENT.tagAlt`, never string literals. Team name and handle come
from `TEAM` in the same file. (`docs/10-DECISIONS.md` D4, D6.)

The `↓` matters — it points at the link preview card, which is the generated graphic. That's the whole
trick: the preview does the selling.

---

## 3. The launch thread

Post **Monday 11 August, between 7 and 9 pm IST**. That window is peak Indian tech X, it's a weekday,
and it leaves two full days for the score to accumulate before the deadline.

### Tweet 1 — the hook (image attached, not a link)

Attach the Crew Card. It's the most visually striking of the three and it's the format nobody else
built. Lead with the artefact.

```
Made a thing for Hacker House Goa 2026.

Drop a photo → get your builder ID, PFP frame, or a whole crew card.
No signup. No cropping. About 4 seconds.

Here's how to make your own 🧵

#FrameInGoa #FramedInGoa
```

Attach the image directly here — don't rely on the link preview for tweet 1. Native images
outperform link cards on impressions, and we want the reach on the opener.

### Tweet 2 — the how-to (this is the tweet the task asked for)

```
1. open <link>
2. drop any photo — landscape, off-centre, HEIC from your iPhone, doesn't matter
3. pick PFP / Builder ID / Crew
4. type your name + stack
5. download, or hit Post on X and it fills the caption for you

that's it. no account, nothing to install.
```

The URL goes here, in tweet 2, not tweet 1. Link-in-reply preserves tweet 1's reach while keeping the
link one tap away for anyone who read past the hook.

### Tweet 3 — the detail people repost

This is where the 2:47 clock earns its keep. Small, specific, delightful details are the most reposted
thing in builder-tool threads.

```
detail nobody asked for:

the yellow palm sits at 83.5° on every frame — the hour hand's angle at 2:47.

@247pmstudio, if you know you know 🌴
```

Attach a close crop of the ring showing the pip. Tagging the organisers here is natural rather than
desperate, because the tweet is a compliment to their brand, not a request for attention.

### Tweet 4 — the build note (for the GitHub reviewers)

```
built with Claude Code in ~2 days.

everything renders client-side on canvas — your photo never leaves your browser until you
hit share. face detection auto-frames the crop so you never touch a slider.

the share link's preview is your actual generated card, not a stock thumbnail.

repo: <github link>
```

This tweet exists for one reader: the organiser doing the GitHub/Devfolio review. It states the three
technical differentiators plainly and hands them the repo.

### Tweet 5 — the ask

```
if you're applying to HH Goa, make yours and drop it below 👇
I'll repost the good ones.

#FrameInGoa
```

An explicit, low-effort call to action. "Drop it below" converts far better than "check it out"
because it names the action. And every card someone posts in your replies is engagement on **your**
post — which is the thing the Radar is scoring.

---

## 4. The screen recording

Record on a phone, portrait, 15–20 seconds, no voiceover, no captions, no music.

Show: home screen → tap link → drop a photo from the camera roll → the card appears → tap download →
done. One continuous take. Do not speed it up. **The whole point is that it's genuinely this fast**,
and a sped-up video quietly admits it isn't.

Attach this to tweet 2, next to the how-to text.

---

## 5. Working the thread

The two hours after posting are worth more than the two days before it.

- Reply to **every single reply**, within minutes, with something substantive. Not "thanks!".
- Quote-tweet the best cards people make. This gives them reach, which makes them share more, which
  loops back.
- If someone reports a bug, thank them, fix it, and reply when it's live. Publicly handling a bug well
  is worth more than never having one.
- Post a follow-up the next morning: a grid of the best cards people made. New tweet in the thread,
  fresh distribution, and it makes the tool look adopted rather than submitted.

**Don't:** buy engagement, mass-tag unrelated accounts, spam the hashtag with duplicate posts, or DM
strangers. The Radar is watched by humans and it's a small scene.

---

## 6. Post checklist

- [ ] `#FrameInGoa` is in tweet 1 — spelled with capital F, I, G
- [ ] The live link works from a device that's never seen it
- [ ] Tweet 1's attached image is the Crew Card, uploaded natively
- [ ] Tweet 2 has the link and the screen recording
- [ ] `@247pmstudio` is tagged once, in tweet 3, and it reads as a compliment
- [ ] The repo is public before tweet 4 goes out
- [ ] Every link opened and verified after posting
- [ ] Free for the next two hours to reply

---

## 7. A note on tone

Every other submission opens with "🚀 Excited to share my submission for the HH Goa 2026 shortlisting
challenge! ✨ Features: 🎨 ... 📱 ... ⚡ ...". That format reads as a résumé bullet, and it's why those
posts get views but not replies.

Write like you built something you think is cool and you want people to use it. Lowercase is fine.
One emoji per tweet, maximum. No feature bullet lists. No "excited to share". Lead with what the
reader gets, not with what you did.
