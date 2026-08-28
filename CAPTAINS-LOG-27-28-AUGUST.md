# CAPTAIN'S LOG — 27–28 AUGUST 2026
**Ingram Manor LLC · one session, from a retrieval bug to a four-day blindness**

THE STANDING SLIP holds what is open. The field journals hold the narrative.
**Nothing held what was DONE** — and after a session that shipped three bug
fixes, a feature end to end, four instruments, six documents and a new register,
that gap is the reason this file exists.

A log is not a victory sheet. It records what was built, **what was found**, what
is running, and what is still only claimed — including the assistant's own errors,
because a log that records only the wins is a log nobody can trust the rest of.

> **THE HONEST CONSTRAINT.** The captain deploys, pushes, runs SQL and verifies by
> opening. The assistant reads, reasons and writes files but cannot reach, push,
> or see the result. **Every "running" below is the captain's word, not the
> assistant's.** Every "unverified" is stated as such.

---

## I · WHAT IS RUNNING

Confirmed by the captain during the session.

| | |
|---|---|
| **amenti-mint** | deployed — version chip moved `1bd3fd41` → `b7370fa3`. `GET /memory?figure=lincoln` returned **401**, which proves the route exists and refuses an unauthenticated read. A route that does not exist cannot refuse you. |
| **amenti-proxy** | deployed — `b8cb28ac` → `4d8a8c97`, and redeployed later the same night. |
| **`figure_memory`** | table live in Supabase, RLS on, no policy, service-role only. |
| **the memory routes** | `GET`/`POST /memory`, **twelve checks green against the live database** from a signed-in browser. |
| **`amenti-chat.js`, `amenti-memory.js`, `amenti-visits.js`, `Page1.html`** | pushed to `Amenti.live` root. |
| **`amenti-qr.js`** | pushed; `hall.html` bumped to `?v=4`. |
| **`SOURCES.semantics.json`** | pushed — 123 → 142 paths across the session. |
| **`SPEC-SURFACES.md`, `SURFACES.semantics.json`** | pushed. |

---

## II · WHAT WAS BUILT

### Figure memory — end to end
Table, routes, read, writer, doctrine. A figure now remembers a signed-in reader
across sessions: a short list of facts, capped at ten, per reader per figure,
overwritten rather than accumulated.

- **The read** puts the facts into the prompt as recollection. The name goes
  through the *existing* `nameGuidance`, which already said *hold it in reserve* —
  memory inherits §4.5 rather than writing a second rule beside it.
- **The writer** is one model call at the end of a conversation, through the same
  proxy as everything else. It costs **$0.0122** — two turns' worth of chat.
- **The trigger** sits in `tune()`, above the reassignment of `active`.

### The visit reading
`AmentiVisits` + `POST /visit` + `GET /visits`. Records the *shape* of a visit —
turns, tokens, seconds, channel — and nothing about who made it. `sendBeacon` on
`pagehide`, because most conversations end by closing the tab.

### Prompt caching
The builders now return `{ head, tail }`. The head is the figure and is
byte-identical for every reader talking to them; the tail is the reader. The
proxy marks the head cacheable. **Measured: 1,938 tokens, 87% of the prompt.**

### Voice, priced and metered
Cache hits counted, `/listen` counted, and `GET /spend` reads back every counter.

### The surface register
`SPEC-SURFACES.md`, `SURFACES.semantics.json`, `probes/probe-surfaces.mjs`,
`surfaces.html` — the eighteenth pane. **19 surfaces authored.**

### Documents
The Three Gates · §4.6 of the conversation doctrine · What an Hour Costs, in two
editions · Nothing Maps the Surfaces · The Prompt Nobody Caches · the prospectus
and Studios corrected.

---

## III · WHAT WAS FOUND

**The findings are worth more than the features.** Each of these was live, none
was being looked for, and most surfaced because something was being *tested*
rather than read.

### In the code

**Three ReferenceErrors in the proxy.** `sceneTag` undeclared in two record
builders, `publication` undeclared in `/article/put`. All three throw at runtime
only; `node --check` passes, because an undeclared identifier is legal syntax.
Two fire only on a **cache miss** — the first visit of a day — which is exactly
why they survived. `/article/put` wrote successfully and *then* threw.

**The lean prompt took the memory parameter and never rendered it.** Memory would
have worked on the full prompt and vanished on the lean one, with nothing to say
which path a reader was on.

**A foreign key that would have broken memory for most of the library.** The
assistant tied `figure_key` to `public.characters`, reasoning that a memory of a
figure who does not exist is a bug. `characters` holds **38 rows and no George
Washington** — it is the generation pipeline's staging table, not the roster of
1,011. Caught on the first write ever attempted, by a probe using a throwaway
key. It would otherwise have been caught by a reader, as a 502 explaining nothing.

**The counters kept only 36 hours.** Built to feed the breaker, which asks only
about today — correct for that job, and it meant weeks of spend data had been
written and evaporated. `/spend` returned one day. **Everything before 28 August
is gone.** Now 400 days.

**`quiz-close` is duplicated** — slip #3, found by hand weeks ago and re-found by
the surface walk in the first minute of testing whether the walk was feasible.

**`hall.html` contains no `<input>`.** The Ask box is built at runtime.

### In the registers

**Nothing mapped the surfaces.** `SOURCES.json` maps documents, `FLEET_MANIFEST`
maps files, `PANES` maps panes. **Nothing mapped the places a person can act** —
and the same gap was found nine times in one day, every time by tripping over it.

**`hall.html` and `Page2.html` were in no register at all** — they fell through
the seam between a walk that matched only `.md` and `.json` and a manifest that
maps files rather than places. **Two live reader surfaces, unchosen by anybody.**

**`prologue` was a duplicate id** across two paths, one of them a 404.

### The four-day blindness — found on the 28th

The Harbor showed **⚠ NO READING** and every pane was empty. The chain had been
broken since 24 August and the alarm had been firing four times a day.

**`fleet-semantics.js` had been overwritten with `SOURCES.semantics.json`.**
Commit `3f1534b`, 24 Aug: THE CLAIMS replaced wholesale by the source index.
Two registers, similar names, one paste into the wrong editor tab. Everything
downstream followed — `merge.js` threw, no fresh manifest was written, and the
Glass Gate published the last good copy from the 25th, for ninety hours.

**And it stayed hidden because of TWO instruments failing the same rule.**

`merge.js` guards its READING with a clear refusal and threw its CLAIMS straight
into `new Function()` — so the fault surfaced as a raw Node `SyntaxError`, under
a step marked `continue-on-error`, collapsed in the UI.

Then the gate — which fires on *not-wired OR merge-failed* — printed only the
NOT WIRED text. **NOT WIRED was 0 the entire time**, and said so in its own
summary table two sections above, while the gate announced a script-tag bug in
capital letters. **The alarm was accurate about there being a fire and wrong
about which building.**

That is PROBE CORPS Rule 2 — *attribute, never infer* — broken by the workflow
whose own header cites it.

### The commit message that was never foreign

For a year `index.html` recorded that the Harbor had been destroyed by an alien
commit reading *"Update fmt.Println message from 'Hello' to 'Goodbye'"* — a Go
hello-world that wandered in from nowhere.

**It was Copilot.** On the 28th, restoring `fleet-semantics.js`, GitHub
pre-filled the message box with *"Change greeting from 'Hello' to 'Goodbye'"* —
the same sentence. Copilot writes from the diff, and a large replacement it
cannot summarise gets a generic placeholder about greetings. Somebody on 17
August accepted it without reading.

**No intruder. A normal edit wearing a nonsense label** — and the label made an
ordinary accident look like an attack for twelve months. Corrected in the
Harbor's header on 28 Aug.

### The one that reframed the voice work

**There are two voice economies, not one.** `amenti-voice.js` says it outright:
*the counsel's text is unique every turn and NEVER hits the archive; the recital's
boundaries ARE the cache key.* The R2 archive — the thing the Studios document
leans on — serves the recital. **A spoken conversation pays full price on every
turn.**

---

## IV · WHAT THE ASSISTANT GOT WRONG

Recorded because the next session inherits the habits, not just the files.

**Priced half an hour and called it an hour.** *What an Hour Costs* measured
Anthropic tokens and put "voice is unmeasured" in a footnote — for a product
whose premise is *talking* to the dead. The captain caught it. Those figures had
already reached the investment memorandum.

**Stated the breaker two different wrong ways.** First as five conversations a
day — a 180-turn hour presented as normal, and alarming for that reason. Then as
five hundred, an overcorrection with no arithmetic behind it. **The measured
answer is 48 ten-turn visits.** Drawn, it argues with neither.

**Overclaimed the lean prompt at "a third".** It is 25%. Said before it was
computed.

**Assumed a rate that was already measured.** 15 characters per second was
presented as a finding. `probe20` had measured it on live hardware and
`amenti-voice.js` records it. The same fault twice in an hour — arriving at
something by assumption that the captain had already written down.

**Edited `amenti-chat.js` before reading it.** Made the change, *then* checked
whether it was safe. For the most sensitive file in the repo that is backwards,
and the captain was right to ask.

**And the probe caught itself, twice.** Its first run declared six working
surfaces ADRIFT — the hall's Ask box, the mic, the speaker toggle, TALK TO, the
quiz. The stamp meant *the walk cannot see this* when it should have meant *a
claim the walk contradicts*. **A register reporting a live surface as missing is
worse than no register**, and it is precisely the confidently-wrong failure the
instrument exists to catch.

---

## V · WHAT IS NOT DONE

Ends in a check the captain can perform by opening something.

| move | done when |
|---|---|
| **The dial, heard** | Press the speaker on a figure. The announcement, the tone, the ring — and the ring stops on the first word. *Never heard on real hardware.* |
| **A figure remembering someone** | Sign in, talk to Lincoln five or six turns, mention something, leave, come back. He knows your name without being told. *Never seen.* |
| **The QR tag** | Scan the code. The URL ends `?via=qr`. Then `GET /visits` shows `via: {"qr": 1}`. |
| **The proxy redeploy** | The 400-day TTL and the `via` counting shipped after the last confirmed deploy. `GET /spend` shows more than one day, eventually. |
| **`probe-surfaces` in Actions** | It needs a rung and a `GITHUB_TOKEN`. Until it runs, `SURFACES.json` does not exist and the pane shows its degraded message — correctly. |
| **`systemTail` wired in Page1** | Caching does not engage until `window.claude.acceptsSystemTail` is set and the tail forwarded. The proxy handles its absence correctly, so nothing is broken meanwhile. |
| **Slip 17 — the restore test** | Still a prerequisite, and now more so: `figure_memory` is live and will soon hold rows nothing else can rebuild. |
| **`/atlantica/daily` on a fresh date** | Proves the `sceneTag` fix. Today's date hits the cache and proves nothing. |

---

## VI · WHAT THE NUMBERS SAY

Measured, not modelled, except where marked.

```
  one turn            4,152 tokens        $0.0138 text
  a spoken turn                           $0.0205 with voice
  an hour typing                          $1.85
  an hour talking                         $3.69     voice is a third of it
  a ten-turn visit                        $0.21
  the memory writer                       $0.0122   once, per conversation
  a figure remembering you                $0.13     across a long hour
```

**The system prompt is 55% of every turn and is re-sent every time.** The
conversation is the cheaper half of the conversation.

**The anchored window is what makes any of this priceable** — fourteen messages,
never more, so a three-hour conversation costs the same per turn as the first.
That decision was in the code before anybody was counting.

**And the thing that brings a reader back is the cheapest thing in the loop.**

---

## VII · WHAT THE SESSION TAUGHT

**Test the thing, not the claim.** Every finding in §III came from running code
rather than reading it. `node --check` passed on three live crashes.

**A check that fails when a field is ADDED is backwards.** It should fail when
the wrong field is. Two tests broke on additions during this session, and both
were rewritten to name what is allowed rather than count it.

**Read the yard before measuring it.** The chars-per-second rate, the render
equation, the two voice economies — all written down in `fleet-semantics.js` and
`amenti-voice.js` since July, all arrived at independently, all slower for it.

**An alarm that names the wrong cause is worse than a quiet one.** Four days of
red runs, four times a day, every one of them describing a bug that did not
exist. Somebody reading the gate would have gone looking at script tags and
found nothing wrong — because nothing was.

**Read the suggested commit message.** A commit message is the only account of
WHY, and an auto-written one misled this fleet for a year.

**A gap nobody can see is a gap nobody closes.** The probe nearly shipped without
carrying `_stillUnknown` through to the pane: five named gaps, written once and
never seen again. That is the complaint the whole surface register was built on,
recurring inside its own instrument.

---

*Written 28 August 2026 at the end of the session it records. Deploy states are
the captain's confirmations, not the assistant's assumptions. Where this log and
a register disagree, the register is right — this is an account of a day, not a
governing document.*
