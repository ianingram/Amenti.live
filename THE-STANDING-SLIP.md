# THE STANDING SLIP
**The yard's open work · Ingram Manor LLC · opened 24 August 2026**

Every other slipway plans one build. This one holds the work that is not yet a
build — the loose items, the recorded-not-chased, the things a session
discovers and the next session must not rediscover by accident. It is a slipway,
so it obeys the slipway's law:

> **A MOVE IS NOT DONE WHEN THE FILE IS UPLOADED. IT IS DONE WHEN ITS
> ACCEPTANCE TEST PASSES.**

This is the durable home for open items. When an item grows large enough to need
its own phases, it graduates to its own slipway and leaves here. Until then it
lives here, stated as a move — what it is, what it unblocks, and how you will
know it is done. **The chat is not enough; this file is the memory the chat
cannot keep.**

Kept by hand. Reviewed at the top of a session, not the bottom.

**THE NUMBERS ARE NAMES, NOT RANKS.** They are referenced from the handoff and
from other briefs, so they do not move once given. The order lives in THE
CRITICAL PATH below, and a move added late can outrank one added early.

**AND MOVES LIVE OUTSIDE THIS FILE.** Three addenda hold work that has never
been folded in — `slip/SLIP-ADDENDUM-THE-DAILY-ROTATION.md` (three moves),
`slip/SLIP-ADDENDUM-THE-SECOND-VOICE.md` (two), and
`slip/SLIP-ADDENDUM-THE-EDITIONS.md`. Until they are read and folded in or
cited here as moves, this file is not the whole of the yard's open work and
should not be trusted as if it were.

---

## THE HONEST CONSTRAINT

The same one every slipway names: the captain deploys, uploads, runs SQL, sets
secrets, and verifies by opening. The assistant reads, reasons, and writes files
but cannot reach, push, or see the result. So every move below ends in a check
**the captain can perform by opening something** — not a claim the assistant
can make alone.

---

## THE STANDING WORK — stated as moves

Ordered by how much it hurts to leave undone.

### 1 · Wire `probe-ordnance` to read `fleet.json`
**The keystone of the autonomy step.** The probe still carries its tube cadences
hardcoded in its own body; `fleet.json` now holds the same declaration as a
register. Until the probe reads the register, the two agree only because one was
copied from the other, and they will drift.
- **Unblocks:** changing the fleet becomes editing one declaration; the checker
  and the window both follow. The ship keeps its own schedule honest.
- **Acceptance test:** edit a cadence or state in `fleet.json` alone, run the
  probe, and see the probe's output change to match — with no edit to the probe.

### 2 · Wire THE WEEK's cron
The one red card on the fleet status. Content is loaded in the hold (6 issues);
the tube has fired zero times, almost certainly because the `[triggers]` cron
block was never registered in the Worker's `wrangler.toml`. Diagnosed 13 July,
again 24 Aug.
- **Unblocks:** the weekly issue actually publishes; the first act of resumption.
- **Acceptance test:** dry-run once by hand, confirm the ledger, then arm the
  cron; the following Sunday, `fleet-status.html` shows THE WEEK green.

### 3 · Fix the Amenti Dispatch date sensor
It reports a last-fired date in the future (negative age), which passes a
`< threshold` test and shows green — a broken sensor behind a green lamp. Must be
fixed **without touching the `dailyplanet:` mechanism name** (see
RULING-THE-DISPATCH-TWO-NAMES).
- **Unblocks:** the Dispatch's status can be trusted.
- **Acceptance test:** the probe reports a real, non-negative age for the
  Dispatch, and `fleet-status.html` shows it accordingly.

### 4 · CLOSED BY SUPERSESSION, 31 Aug — and a new number replaces it
The move asked for a 123-entry `SOURCES.semantics.json` describing `fleet.json`
and `fleet-status.html`, with `unindexed: 0`. Read against the register on
31 Aug: **both fleet files are described** — `fleet-declared` and `fleet-status`
carry real glosses — and the index holds **191 entries, not 123.** The upload
landed and then grew. That half is done.

But `unindexed` is **21, not 0**, and it is a different 21: briefs in
`Amenti-Technical-Briefs`, among them `BRIEF-THE-DIRECT-PUSH-QUESTION.md` — the
brief for move #10, sitting outside the index. One path is unreachable, a 404 on
`Amenti.live/main/book/00-the-beach.md`.
- **Unblocks:** nothing further; the drift it named is a different drift now.
- **Acceptance test:** none. This move is closed. The remaining work is #22.

### 5 · BLOCKED, NOT SCHEDULED — the hall's brief-quoting
The move proposed spending ~2,000 chars on a passage (`MAX_BRIEFS` 0 → 1,
`BRIEF_SLICE` → ~2000). **Measured on 31 Aug by `probe-hall-wall`, running the
hall's own functions: there is no budget to spend.** The prompt stands at
**24,208 against a wall of 20,000** with `MAX_BRIEFS` at 0 — over by 4,208
before a single passage is fetched.

It also named the wrong pressure. The slices were what crowded the wall on
24 Aug. What crowds it now is the catalogue growing underneath it, 106 documents
to 190, because the hall declares every document on every question.
- **Unblocks:** nothing, until #12 is fixed. Quoting is not a feature to
  schedule; it is the first thing that becomes affordable again afterwards.
- **Acceptance test:** deferred to #12 and #13. When the prompt fits with room
  to spare, arm one short slice and confirm the proxy does not 413.

### 6 · Teach an instrument to walk the Docket
`probe-ordnance` does not walk the mint tube. The first case-set closed 13 July
with zero arguments submitted — learned because a human read a date, not because
anything watched. A silent court should be seen by an instrument.
- **Unblocks:** the Docket's silence becomes a reading, not a surprise.
- **Acceptance test:** the probe (or a sibling) reports the Docket's real state
  from the mint, and `fleet-status.html` shows it instead of "not walked yet."

### 7 · Verify Amenti Studios Phase One
The podcast tube is marked `planned`. Studios (source material, not spec) says
the keystone — `/speak` content-addressed R2 caching — was "buildable, status
unconfirmed." Confirm whether it ever shipped before treating the tube as live.
- **Unblocks:** the podcast tube's true state is known, not assumed.
- **Acceptance test:** a read of the Worker confirms whether `/speak` persists
  to R2; `fleet.json`'s podcast state is updated to match reality.

### 8 · The deck-card crops
Several cards on the arena deck read too tight — Bram Stoker, Helen Keller,
Seneca named so far. The crop rule (`object-fit:cover; object-position:50% 20%`)
suits most cards; a few need per-card overrides or `contain`. The captain will
**walk the deck and bring the list** rather than change the global rule.
- **Unblocks:** the deck reads right without disturbing the 48 cards that are fine.
- **Acceptance test:** the named cards show their subject fully; the rest are
  unchanged.

### 9 · The churn signal (idea, not yet a build)
`SOURCES.semantics.json` has been edited often lately. Raw edit-counts are
vanity — git already has them. The *useful* form is a finding: a small probe
reads git's own history and flags files churning unusually for their kind, the
way the drift report flags unindexed files. **Recorded as an idea; not worth
building over higher-value work.** Promote to its own slipway if it earns it.
- **Unblocks:** nothing yet — held in reserve.
- **Acceptance test:** n/a until adopted.

---

### 10 · Decide the direct-push workflow (PROPOSED — see its own brief)
The download-edit-upload loop is a tax on every session, and hand-editing is off
the table. A full proposal exists: `BRIEF-THE-DIRECT-PUSH-QUESTION.md` — the
assistant commits to the repo directly via a fine-grained GitHub token, with
safety rails (branch-not-main, diff-then-approve, revert, start-small). NOT
adopted. The captain flagged the real risk: a faster workflow carries faster
mistakes, and the manual slowness has been an unplanned checkpoint the whole
history of the project. Rejected along the way: breaking up Page1 (the monolith
is a VIRTUE in an already-fragmented system — do not fragment the one coherent
artifact). Move: read the brief, decide adopt-or-keep-manual, and if adopt, pick
the rail and the Phase-1 file. The manual road stays open until then.

### 11 · Close the card-originals exposure (DECISION PENDING — the last known hole)
The deck cards and terminal plates on the site (`img/{key}-card.jpg`,
`-terminal.jpg`, `-thumb.jpg`) are baked DISPLAY versions. The ORIGINALS —
full-res source images before cropping — live ONLY on the captain's hard drive.
One copy, one disk, nothing watching it. A true single-point-of-failure, and the
last known hole after the library was closed.

WHAT WE KNOW (read 25 Aug):
- `img/MANIFEST.json` records each image's provenance — `source` (original
  filename, e.g. `openart-sample_…jpg`), `crop` (e.g. "trimmed 16px to 0.571"),
  `prompt_file`, `seed`, `note`. So the RECIPE is known and in the repo.
- But the original FILES are referenced by name only — they are NOT in any repo.
- The crop is lossy: display versions cannot rebuild the originals.

OPTIONS (weighed, not chosen):
- A · private `Amenti-Originals` repo — rides the ARK (add it to the Ark's repo
  list → daily verified off-provider backup automatically); instrumentable later.
  RECOMMENDED fit for this ship. Caveat: full-res images can make a repo heavy.
- B · R2 — cheaper for large binaries, but not versioned and needs its own upload
  path.
- C · external/cloud drive — simple, but uninstrumented (Silent Signature: nothing
  would know or verify it happened).

STANDING RULES: do NOT put originals in the PUBLIC `img/` (masters ≠ display, and
they'd bloat the site). Do NOT delete from the hard drive — add copies, never move.
If a repo is chosen, the ARK's repo list must be extended to include it (it bundles
six today).

Captain not ready to decide (25 Aug) — correctly deferred; moving irreplaceable
source files deserves fresh eyes, not the end of a long session. Move: pick the
home (A/B/C), get the originals off the single drive, confirm the Ark covers it,
then (later) instrument it against the MANIFEST so you can SEE which originals are
safely stored.

---

## ADDED 31 AUGUST 2026 — the hall, the corps, and what the last session left

Eight findings from the 29–30 Aug session reached a log and a handoff and never
reached this file. That is the fault this slip exists to prevent, and it is
recorded here rather than quietly corrected. A ninth — the decision to make Ask
Amenti *one box containing several* — was made in an earlier session and exists
nowhere at all; it survived only because the captain remembered it and said so.

### 12 · CLOSED 31 Aug — Ask Amenti answers again
The engine assembled 24,138 chars against a `SYSTEM_CHARS` of 20,000 and the
Worker refused every question with `system_too_long`. **The trim was never
taken.** #13's door list cleared the wall on its own, so no gloss was degraded
and the same line was not edited twice.
- **Test passed:** `the hall` workflow green at 22:32; the box answers.
- **The stopgap this entry proposed is now moot.** Recorded so nobody trims
  glosses later believing it is still owed.

### 13 · BUILT 31 Aug – 1 Sep — the road was taken, and here is what shipped
The decision was made and the build followed in one night. Read
`BRIEF-THE-BOX-THAT-CONTAINS-SEVERAL.md` for the arithmetic; this is the state.

**THE DOORS.** The catalogue of 191 documents is gone. The hall declares 8
sections and 52 rooms, ~6,390 chars, and a new document inside an existing
section now costs the prompt NOTHING. Room doors carry up to three of their
section titles — that is what lets "betrayal" reach Brutus through "The
overthrow", and it is the whole reason the rich form is paid for.

**TWO CALLS.** `pickRooms` sees only the doors and answers which to open, in
JSON. `buildAnswer` sees what was opened and answers the visitor — and does NOT
carry the door list, which is what pays for the passages.

**THREE KINDS OF DOOR, and they behave differently.**
- A LIBRARY ROOM opens: fetch the room catalogue, fetch up to `MAX_WORKS`
  passages of `WORK_SLICE` each, quote them.
- A SHIP SECTION does not open — **it is already open.** The ship's primary
  source IS the gloss, already in `SOURCES.json`, already loaded. No fetch.
  Trimmed, under `SECTION_BUDGET`, and when the cap bites the hall is told how
  many it did not see.
- NOTHING FOUND sends the bare door list so the hall can name the nearest
  rooms without inventing one.

**THE AUTHORED NOTES ARE CARRIED.** Room and work notes, under one shared
`NOTE_BUDGET`, room notes first. This is not decoration: the room `brutus` is
LUCIUS, not the man who killed Caesar, and the note says so. Without it the hall
opens Lucius's room for a Marcus question and its training supplies the
assassination under a Livy citation.

**THE COVERAGE STATEMENT IS BUILT FROM WHAT HAPPENED**, not from what was asked
for, and the model is required to pass it on. That is the promise that let
retrieval replace declaring everything.

**AND THE HALL KNOWS THE NAV.** Eleven labels and their addresses, read out of
Page1.html. Asked where a thing is, it names a label the visitor can see and
click. `linkable()` now admits `page2`, so the citation is the door.

- **Still open, and it is where the budget grows back:** move F. `HALL.md` is
  5,751 chars — 29% of the wall — carrying the fleet's architecture into a
  question about Livy. Scope the meaning to the lane and thousands come back.
- **Also still open:** move E, the substring guard as a PROBE rather than a
  rule. The hall is now told to quote and told to quote only from the text; the
  second half is a promise, not a test.
- **Acceptance test for what shipped:** ask the hall a historical question; it
  quotes a passage with its edition beneath. Ask it where the timeline is; it
  names INTERFACE. `probe-hall-wall` exits 0.

### 14 · CLOSED 31 Aug — the probe is on a rung
Added to `hall.yml` after `probe-hall`, with `continue-on-error` and a gate
reading `outcome`. **It has now fired both ways in production** — red at 12:24
when the hall did not fit, green at 22:32 when it did. A gate that can only fire
is not a gate.
- Also corrected: `hall.yml` pushed straight at main and lost a race on its
  second real day. It now rebases and retries five times, `patrol.yml`'s
  correction arriving at a second file for the same reason.

### 15 · CLOSED 31 Aug — it reconciled itself
`probe-hall` reads `srcs.counts.reachable`, and the 187-vs-190 gap healed at the
next scheduled run. **The ordering was already right**: `sources.yml` at :22,
`hall.yml` at :42. This entry over-called a transient as a fault. The probe
reports the two counts and says when they diverge.

### 16 · The Probe Corps roster is six weeks stale, and `probe3` carries a false green
`Amenti_Probe_Corps.html` is Rev B, 19 July. It says *when you ask "where are the
probes?", the answer is here*, and for roughly sixteen of them it is not —
`probe-hall`, `probe-citations`, `probe-engine`, `probe-gate`, `probe-library`,
`probe-serves`, `probe-surfaces`, `probe-voice`, `probe-works`, `probe-post`,
`probe-production`, `probe-spells`, `probe21`, `probe-page1`, `probe-roster`,
`probe-panes` are all absent, and `probe-hall-wall` is new.

**Worse, the doctrine and the register disagree about `probe3`.** The roster
calls it THE PHANTOM, guarding script injection. `SOURCES.json` says it is Page1
integrity and that it **carries a false green** — a section reading one file into
two variables and asserting they are equal, an assertion that cannot fail. The
register wins. So a probe that cannot fail is patrolling, and the doctrine points
at a different probe entirely.
- **Unblocks:** the corps' own doctrine stops being a source of false comfort.
- **Acceptance test:** the roster lists every probe in `SOURCES.json`, `probe3`
  is described as the register describes it, and its false-green section either
  asserts something that can fail or is removed and its absence recorded.

### 17 · Caesar may be speaking in the wrong voice
The terminal displays **GAIUS JULIUS CAESAR**; `names.csv` holds **Julius
Caesar**; the voice resolver keys on that exact lowercased string. This is
Lincoln's fault on a different figure, and it is live. Not settleable from the
registers — neither Page1 nor Page2 contains the lookup; it is inside
`amenti-core.bundle.js`.
- **Unblocks:** a figure speaks in the voice he was cast in.
- **Acceptance test:** press CALL on Caesar; the console does **not** say
  `NO GENDER RESOLVED`.

### 18 · The nine rooms that name a translator and stop short of an edition
The citation work is **done** — 550 works, 495 cited, EMPTY zero, 42 of 52 rooms
clean, and `citations.yml` fails the build on an empty source. What remains is
nine rooms naming a translator without an edition. **Not urgent and nothing is
wrong.** Written up in full, with the method and the acceptance test, in
`Amenti.live/main/slip/SLIP-ADDENDUM-THE-EDITIONS.md`.
- **Acceptance test:** read the addendum; do not plan this from memory.

### 19 · The three instruments that never run
`probe-post.mjs`, `probe-serves.mjs`, `probe-works.mjs` sit in `probes/` and
nothing invokes them. Being loaded is not being used. **`probe-serves` first** —
it is the guard against building the same thing twice, and should fire whenever
`SERVES.semantics.json` changes. Two things were built twice in one session
because nothing did.
- **Acceptance test:** each appears in a workflow, and a deliberate fault in the
  register it guards fails a build.

### 20 · Delete `WORKS.semantics.json` if it landed
It duplicates `LIBRARY.json`, which holds 550 properly cited works. Built before
looking. Remove its entry from `SOURCES.semantics.json` too.
- **Acceptance test:** the file is absent and the index does not name it.

### 21 · Four small ones from the 29–30 Aug log
Recorded so they are not rediscovered by accident. None is large.
- **`quiz-close` is declared twice** in the CSS; the later, stale copy is the one
  that runs. Ten minutes.
- **`amenti-visits.js` is never mounted** on Page1 — one counted surface of five.
- **`acceptsSystemTail` is unset.** A 33% saving, measured, unclaimed.
- **The source index does not walk root `.js`,** so the whole engine —
  `amenti-hall.js` included — is invisible to `SOURCES.json`.
- **Acceptance test:** each has its own and each is one line; take them when a
  session is already in that file, not as a campaign.

### 22 · Twenty-one briefs are unindexed
Inherited from the closed #4. The walk reaches 191 paths and 21 are in no
semantics entry, nearly all briefs in `Amenti-Technical-Briefs` — including
`BRIEF-THE-DIRECT-PUSH-QUESTION.md`, the brief for move #10. A brief the index
cannot see is a brief the hall cannot cite.
- **Unblocks:** the drift report reads clean; #10's own brief becomes findable.
- **Acceptance test:** the source index run reports `unindexed: 0`.

---

## ADDED 1 SEPTEMBER 2026 — what the build surfaced

Nine of these were found by the captain asking a question the assistant could
not answer, or by attacking a probe until it admitted a fault. None was found by
reading a register and believing it.

### 23 · The budgets now trade against each other, and only the probe holds them
Call two has FOUR shapes — library passages, the ship's register, nothing-found,
and a mixed pick — against six constants that compete for one 20,000-char wall:
`WORK_SLICE`, `MAX_WORKS`, `SECTION_BUDGET`, `SECTION_GLOSS`, `NOTE_BUDGET`,
`SECTION_IDS`, plus `NAV` and `HALL.md` as fixed cost. Every attempt on 1 Sep to
change one without running `probe-hall-wall` produced a warning or a breach.
- **This is the entry that keeps the rest affordable.** The complexity is only
  safe because an instrument measures it. Do not tune a constant by reasoning.
- **Acceptance test:** none — a standing condition, not a move. Run the probe.

### 24 · `probe-hall-wall` under-reported three times, each for the same reason
It measured a MODEL of the prompt instead of the prompt. Invented filler source
lines (out by 160), a synthetic section block (477), and three shapes counted
where four existed (285, and the missing one was the largest). Each was found by
running the live flow beside it and comparing.
- **Fixed:** it now builds every worst case from the real functions on the real
  registers, and probe and live agree to the character.
- **The lesson generalises:** a probe that constructs its own worst case is
  measuring its author's imagination. Any probe that does this is suspect.
- **Acceptance test:** the reported worst case equals the largest prompt a live
  run produces. Re-check whenever a shape is added.

### 25 · A lifted function closes over things the lift does not take
Five times on 31 Aug–1 Sep a new private constant broke `probe-hall-wall` the
moment it was added — `ROOM_SECTIONS`, `NOTE_BUDGET`, `SECTION_IDS`, `NAV` and
others. Each time it reported UNREAD rather than crashing or passing, which is
the guard working, but the seeded list must be extended by hand every time.
- **Unblocks:** the probe stops needing an edit each time the hall gains a
  constant.
- **Acceptance test:** add a new `var` inside the IIFE that a lifted function
  uses; the probe still measures, without being told the name.

### 26 · `?v=1` is cache-busting that never busts
`hall.html` loads `amenti-hall.js?v=1` and `amenti-hall-box.js?v=1`. The string
never changes, so a browser holds the old file forever. On 1 Sep this cost an
hour: the engine had updated, the box had not, and the answer looked broken in a
way that had nothing to do with the code.
- **Acceptance test:** change the box, reload normally — not hard-reload — and
  see the change.

### 27 · `data-page="timeline"` on Page1 is not a timeline
It is BROWSE — *THE CODEX · BROWSE BY ORDER*, a roster browser indexed
AMENTI/BRW/v1.0. The name outlived the pane. Anyone grepping Page1 for
"timeline" finds a tab and concludes the flagship has one; the assistant did, on
1 Sep. The hall's NAV entry now warns about it, which is a plaster over a name
that lies.
- **Acceptance test:** the section, the button's `data-target`, the CSS selector
  and the router all say `browse`, and nothing on the flagship claims a timeline.

### 28 · The nav is authored in `amenti-hall.js` and will go stale
Eleven labels and their addresses, read out of Page1.html by hand. This is the
same fault as Page2's gloss saying "microphone" for months — a description that
must be updated when the thing changes, and will not be.
- **Unblocks:** the hall stops being able to send a visitor to a door that moved.
- **Acceptance test:** a probe reads the `<a class="mn-*">` tags and the
  `<section data-page>` targets straight out of Page1 and fails when `NAV`
  disagrees with them.

### 29 · A gloss can fall behind its file, and nothing watches for it
`Page2.html` is 1.5 MB holding nine views, a double helix and an events register
from a published sheet. Its gloss said *microphone, chunker, daily generation
path* — accurate when written, and months stale. `SOURCES.json` tracks whether a
file is REACHABLE and whether it is DESCRIBED. It cannot tell that a description
has stopped being true.
- **Why it matters now:** the hall answers from these lines. A stale gloss is
  the same fault as a citation pointing at the wrong edition.
- **Acceptance test:** a reading that flags files whose size or commit history
  has moved far since their gloss was last touched. Related to #9's churn idea,
  pointed at a different question.

### 30 · The BETA strand's events live in a Google Sheet no register knows
Page2's events come from a published Google Sheet fetched at runtime. It is in
no index, walked by no probe, and outside every repo. If it moves or its share
setting changes, the strand empties and nothing on the ship would notice.
- **Acceptance test:** the sheet is named in `SOURCES.semantics.json`, and an
  instrument reads it and reports a row count.

### 31 · The timeline the hall can name but cannot place you on
The roster carries `Birth-Date` AND `Death-Date` for all 1,011 souls — zero
missing, -10000 to 2003 — plus a `Region` column. So "who else was alive in this
year, and where" is exact and needs no new register: at 509 BC, while Brutus
expels the Tarquins, the Buddha, Confucius and Sun Tzu are alive.
- **The captain's intent:** a reader should see where they stand in time and
  what stood beside them. Page2 already does this as a spiral; what is missing
  is the hall being able to POSITION a reader on it after an answer.
- **Known blockers:** 7 of 52 rooms do not join to a roster name
  (`julius-caesar` vs `Gaius Julius Caesar`) — the same mismatch as #17, so one
  fix serves both. Duplicate souls exist (`Buddha` and `Gautama Buddha`;
  `Augustine of Hippo` and `Saint Augustine`) and a timeline shows them twice.
  `Region` holds a misspelling (`North Ameirca`, one soul) and one value that is
  not a region (`Judaea & Rome`).
- **Not a build yet.** A shared script in the shape of `library.js`, surfacing
  first in the hall. Its own slipway when it earns one.

### 32 · An events timeline is downstream of the library, not parallel to it
Cited events need witnesses aboard, and 52 rooms of 1,011 souls is 5%. Three of
four test events had a witness with a room — Herodotus, Josephus, Gibbon — and
that is the good case. **Recorded as held, not planned.** The move that unblocks
it is more rooms.
- **Acceptance test:** n/a until adopted.

### 33 · My prefixed filename is in `probes/` again
`probes/Amenti.live__probes__probe-hall-wall.mjs` — a delivery-naming scheme the
assistant invented, abandoned, and reintroduced. It is junk beside the real file
and it shows in the drift report. Delete it.
- **Acceptance test:** the walk reports it gone; `unindexed` drops by one.

---

## THE CRITICAL PATH — what gates what

Reordered 1 Sep. #12, #14 and #15 are closed and #13 is built; the head of the
path is no longer a live fault but the two things that keep the built thing
honest.

| # | Move | Unblocks |
|---|---|---|
| 1 | Move E: the substring guard as a PROBE (#13) | a quotation is tested, not promised |
| 2 | Move F: scope the meaning to the lane (#13) | ~3,000 chars back for passages |
| 3 | Wire `probe-ordnance` to `fleet.json` (#1) | the autonomy loop closes |
| 4 | Wire THE WEEK's cron (#2) | resumption begins; a press fires |
| 5 | Fix the Dispatch sensor (#3) | the fleet status can be trusted |
| 6 | Walk the Docket + Studios (#6, #7) | the last two tubes become readings |

**#1 and #2 above are the unfinished halves of #13, not new work.** The hall now
tells the model to quote only from the text it was given; nothing checks that it
did. And 29% of the wall carries the fleet's architecture into questions about
Livy.

**And read #23 before touching any constant in `amenti-hall.js`.** Six budgets
trade against one wall across four prompt shapes. Every attempt to tune one by
reasoning on 1 Sep produced a warning or a breach.

Items 8, 9, 16–22 and 24–33 are independent — do them when they surface, not in
sequence.

---

## DECISIONS THE ASSISTANT SHOULD NOT MAKE ALONE

- **Arming THE WEEK's cron** — it touches the Worker that handles publishing.
  Dry-run, confirm, then the captain arms it.
- **Any change to the `dailyplanet:` mechanism** — the name is legally and
  structurally load-bearing. Surface-only, always.
- **Which deck cards are wrong** — the captain walks the deck; the eye is the
  instrument here.
- **Where the card originals live / moving the source files** — irreplaceable
  art, real storage decision (repo vs R2 vs drive), possibly a new repo + the
  Ark's repo list. The captain decides the home; don't move files without it.
- **What replaces declare-everything in the hall (#13)** — it decides the shape
  of the surface the captain has twice called the important one, it touches the
  Worker's `SYSTEM_CHARS` policy, and it trades a principle (nothing can be
  missed silently) for a budget. The assistant measures, lays out the roads, and
  writes the choice down. **The captain picks the road.**
- **Adopting direct push / creating a write-token** — it changes how the whole
  ship is built and can reach the live flagship in one motion. The captain
  decides if and when, and it stages in (see the brief). Never push to `main` on
  `Page1.html` unattended.

---

*Updated 1 Sep 2026: #12, #14 and #15 CLOSED by their own tests, #13 BUILT and
rewritten to say what shipped, moves 23-33 added, the critical path reordered
around the two unfinished halves of #13. The hall went from silent on every
question to opening rooms and quoting Livy with its edition in one night; nine
of the eleven new moves were found by the captain asking a question the
assistant could not answer, or by attacking a probe until it admitted a fault.*

*Updated 31 Aug 2026: moves 12-22 added, #4 closed by supersession, #5 blocked,
the critical path reordered. Eight of those moves had been sitting in a log and a
handoff since 30 Aug without reaching this file, and one design decision existed
only in the captain's memory. If a session surfaces a move and it does not land
here, the session did not happen.*

*Opened 24 Aug 2026, seeded from the fleet-legible session and its briefs. Add
a move when a session surfaces one; close it when its test passes; graduate it
to its own slipway when it grows phases. Read this at the top of a session — it
is the yard's memory between the tides.*
