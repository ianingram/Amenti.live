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

**THE ADDENDA ARE FOLDED IN.** As of 1 Sep this file IS the whole of the yard's
open work. `slip/SLIP-ADDENDUM-THE-DAILY-ROTATION.md` and
`slip/SLIP-ADDENDUM-THE-SECOND-VOICE.md` became moves #36–#40;
`slip/SLIP-ADDENDUM-THE-EDITIONS.md` holds the method for #18 and stays where it
is. **Do not raise a new move in an addendum** — a move the slip does not know
about is the fault that took four days to notice. Raise it here.

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

### 16 · The roster is stale, and `probe3` CANNOT RUN AT ALL
`Amenti_Probe_Corps.html` is Rev B, 19 July, and roughly sixteen probes are
absent from it — `probe-hall`, `probe-citations`, `probe-engine`, `probe-gate`,
`probe-library`, `probe-serves`, `probe-surfaces`, `probe-voice`, `probe-post`,
`probe-production`, `probe-spells`, `probe21`, `probe-page1`, `probe-roster`,
`probe-panes`, and now `probe-hall-wall`.

**AND `probe3` IS WORSE THAN A FALSE GREEN — read 1 Sep.** Its section 3 reads
one file into two variables and asserts they are equal, which cannot fail. But
the path it reads is `/mnt/user-data/uploads/` — **an assistant session
sandbox** that exists on no machine and in no runner. A later section reads
`window.AMENTI_VOICE` inside a Node script. And what it guards is
`amenti-throttle.js`, the RETIRED TTS engine that probe17 exists to keep
surfaces away from.

Nothing invokes it. So it never fires, and if it did it would crash before
reaching the assertion that cannot fail. **It is a probe written inside a
session, against files that existed only in that session, and committed.**

- **Recommended: RETIRE IT.** There is no working probe inside to rescue —
  delete the file, remove its entry, and record why, as `probe-works` was on
  31 Aug.
- **Acceptance test:** the roster lists every probe in `SOURCES.json`; `probe3`
  is gone or genuinely runnable; and no probe in `probes/` references
  `/mnt/user-data/`.

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

### 26 · CORRECTED 1 Sep — the cache is GitHub's, not the query string
This entry said `?v=1` was the cause: a version string that never changes, so a
browser holds the old file forever. **That was wrong, and it was asserted
without reading the headers.** GitHub Pages sends:

```
cache-control: max-age=600
etag: "6a964d91-5ed5"
```

The browser will not re-ask for **ten minutes**, query string or none. Removing
`?v=1` changes nothing; the header is GitHub's and cannot be overridden on
Pages. What costs an hour is reloading inside that window and reading the result
as a code fault — which happened on 1 Sep with the box.

- **What actually works:** hard-reload forces revalidation. Or bump the number —
  `?v=1` to `?v=2` is a different URL with no cache entry, which does work and
  is useless left at 1 forever.
- **The move, if it is worth one:** a probe reading each
  `<script src="...?v=N">` against the file's git hash, failing when the bytes
  moved and the number did not. Nothing else ends it permanently.
- **Acceptance test:** change a script, leave its `?v=` alone, and the probe
  fails.

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

### 34 · CLOSED 1 Sep — move E, the quotation guard
The hall was told to quote only from the text it was handed and **nothing
checked that it did** — the largest gap in the citation policy, and the one
rule aboard with a sentence instead of an instrument. The box now matches every
quoted span, character for character, against the passage the engine actually
fetched. Three states: verified in the text, verbatim in a librarian's NOTE
instead (a real distinction — on 31 Aug the hall said "as the text puts it"
about a line that was in the note and not in the slice), or unmatched and
therefore uncoloured. **The colour is earned, never claimed**; a false
quotation painted as verified would be worse than no colour at all. Eleven
attacks: hard line-wraps collapse and still match, elision and a one-word
substitution both fail, HTML injection stays escaped, and a verified quotation
keeps a working link inside it.
- **Test passed:** all three states render, and the tally prints under every
  answer even when everything passed — a guard that speaks only on failure
  leaves a reader unable to tell it ran.
- **Costs no prompt budget.** `opened` is returned to the page and never sent
  to the model.

### 35 · The engine was invisible to its own register — CLOSED 1 Sep
`amenti-hall.js`, `amenti-hall-box.js` and `library.js` were in no index, so the
hall could not describe the thing answering the question. Described 1 Sep. Two
root `.js` files were indexed before this; the rest of SLIP #21's "the index
does not walk root .js" stands.

### 42 · Nothing can tell a stale gloss from a true one
`SOURCES.json` knows whether a file is REACHABLE and whether it is DESCRIBED. It
has no way to know whether the description is still TRUE, so `described: true`
is permanent. Nineteen entries carry no gloss and the drift report names every
one; **a gloss that is present and false is invisible, and it is the worse of
the two** — a missing description makes a reader look, a wrong one makes them
act.

Five instances in two sessions, none of them searched for:
Page2's gloss saying *microphone* while the file held a double helix; `probe3`
testing a voice engine extracted into the bundle; `data-page="timeline"` on a
roster browser; the flagship's nav readable nowhere but its own markup; and a
section NAMED *the briefs — 41 files* that holds 75.

- **The move:** a probe comparing a file's last commit to its gloss's last
  commit. Git knows both. It does not judge whether a gloss is TRUE — only that
  the file has moved a long way since anyone touched the sentence. **That alone
  catches four of the five.**
- **And derive what can be derived.** A section's count is `length`. The nav is
  Page1's `<a class="mn-*">` tags and `<section data-page>` targets. A derived
  description cannot rot; computing it removes the class of fault rather than
  watching for it.
- **Acceptance test:** deliberately age a file past its gloss and the probe
  names it. Written up in
  `BRIEF-THE-DESCRIPTION-STAYS-WHERE-THE-TRUTH-WAS.md`.

### 43 · A section is named `41 files` and holds 75
The register's own furniture, and the fault of #42 in the instrument built to
catch it. The name is printed into every door list the hall sends, so the hall
states a count that rotted, in a section heading, on every question that reaches
the architecture.
- **Not a one-liner.** The section name is the key every entry is filed under,
  so renaming it touches all 75 in `SOURCES.semantics.json` and any brief that
  quotes it.
- **Recommended:** drop the count from the name entirely — `the briefs` — and
  let the walk supply the number, which it already does. **A name should not
  carry a fact that can change.**
- **Acceptance test:** no section name in the register contains a digit, and the
  hall's door list still states each section's count from the walk.

### 44 · The events register is written, good, and trapped in one file
`Page2.html` hardcodes **488 historical events**, 9500 BC to 2024, across sixteen
categories — Göbekli Tepe, Çatalhöyük, the wheel, cuneiform, Hammurabi, the
Hijra, Hastings, Constantinople, the Principia. It is substantial and it is
good. **It is also readable by exactly one surface.**

Checked 1 Sep: all eighteen landmarks the roster cannot supply — the events with
no famous casualty, where nobody aboard died — are already in the seed, often
with a companion (*Fall of Constantinople* beside *End of Hundred Years' War*).
**Nothing needs authoring, sourcing or deciding.**

- **AND THE SOCKET IS ALREADY BUILT.** `AMENTI_CONFIG.EVENTS_CSV_URL` is an
  empty string; `reload()` fetches from it and replaces the seed, falling back
  silently when it is unset. Someone wired it and left it unplugged. *(An
  earlier reading of this called the BETA strand misconfigured — it is not.
  The one sheet URL in Page2 is `LEDGER_CSV_URL`, correctly pointed at the
  roster.)*
- **The move:** lift the 488 into a register — `EVENTS.json` or a published CSV
  in the column order `reload()` already expects: year, name, category,
  description. Point `EVENTS_CSV_URL` at it. Page2 behaves identically; the
  hall's timeline reads the same file; a probe can walk it and report a count
  the way probe-library does for works.
- **Why it matters beyond Page2:** this is what turns the timeline from a chart
  into a scene. At −480 a reader sees Leonidas die AND Thermopylae; at −44,
  Caesar and Cicero AND the Ides. Who was there, and what was happening.
- **And it is the fifth instance of #42** — a true, well-made thing living
  where nothing else can read it. The register is the answer, and the register
  only holds what someone thought to put there.
- **Acceptance test:** `SOURCES.json` names the events register; a probe reports
  488 events and a date range; Page2 renders identically with `EVENTS_CSV_URL`
  set; and Page2 no longer carries the list in its own body.

### 45 · Some landmarks are already on the roster, as deaths
Recorded so nobody authors them twice. **Seventeen of thirty-five test landmarks
need no event entry at all** — the person who died in them is already dated:
−44 gives Caesar and Cicero; −323 gives Alexander, Diogenes and Aristotle;
1914 gives Archduke Franz Ferdinand; 1969 gives Gagarin, King and Keller.
- **The design point:** a timeline drawing lifespans already carries a good
  share of its own anchors. The events register supplies what deaths cannot —
  a battle won, a book published, a city taken.
- **Acceptance test:** none. A reading, not a move — but read it before
  authoring any event that a soul already died in.

### 46 · Josephus is dated 37 BC and lived 137 years
`names.csv` gives Flavius Josephus a `Birth-Date` of −37. He was born in **AD
37** and died about AD 100 — a 63-year life. The sign is inverted.

**IT HAS BLOCKED TWO THINGS IN ONE SESSION.** On 31 Aug it produced a synchrony
that never happened: the assistant showed a reading in which Josephus was alive
at Actium, beside Cleopatra, Augustus and Ovid. It was compelling, it felt like
a discovery, and it was one wrong minus sign. Cleopatra died 67 years before he
was born. On 1 Sep it blocked the mention-graph's temporal filter (#47), which
works by ruling out anyone who was not yet born when the author wrote.

- **The fix:** one cell. `-37` → `37`. `probe-roster` regenerates
  `ROSTER-INDEX.json` on the next `hall.yml` run and both the timeline and
  Page2's helix correct themselves, since both read the same field.
- **AND THE GUARD IS WORTH MORE THAN THE FIX.** A 137-year lifespan is
  checkable. `probe-roster` already counts and reports; a soul living
  implausibly long should be a finding, not a number sitting quietly in a
  column. That would have caught this the day it was entered rather than when
  a false reading was built on it.
- **Acceptance test:** the roster reports Josephus 37–100, and the probe names
  any soul whose lifespan exceeds a stated bound (the 45 eternals excepted, and
  named as such).

### 47 · THE MENTION GRAPH — connections that can be CITED, not inferred
The roster's souls are connected — who knew whom, who opposed whom, who wrote
about whom. Two kinds of connection are computable today and a third is far
better than both.

**Overlap** says two people were alive together. **Region** says they were in
the same part of the world. Both are inference: they say a meeting was
*possible*.

**A MENTION IS NOT AN INFERENCE. IT IS A QUOTATION.** One figure's own text
naming another, in an edition you hold. *Josephus names Vespasian in Antiquities
Book 18* is a claim a reader can check by opening the book — which is the
citation policy applied to relationships rather than to passages.

**Proved on 1 Sep**, searching four books of the Antiquities (638 KB) for roster
names. Sixteen figures found. Genuine and citable: Vespasian, Cicero, Alexander
the Great. Also four kinds of false link, each instructive:
- `Joseph` 34× — the patriarch and half a dozen other Josephs.
- `Ptolemy` — matching the ASTRONOMER, who was born after Josephus died.
- `Brutus` — almost certainly Marcus, not the Lucius in the library.
- `Anubis`, `Jupiter`, `Venus`, `Hermes` — gods being named as gods.

**THE GRAPH SCALES WITH THE LIBRARY, NOT THE ROSTER**, and that shapes it:
a name can only be found in text the ship holds, so 1,011 souls can be NAMED
but only 52 can do the naming. Every edge runs out of one of those 52 rooms.
Fill Vespasian's room and the edge becomes two — and the pair can DISAGREE,
which is where it becomes a historical instrument rather than an index.

**THE DISCIPLINES MUST BE BUILT BEFORE THE ROSTER FILLS, NOT AFTER.** At 52
rooms four false links were caught by eye in a minute. At 500 nobody will be
looking. Retrofitting across five hundred rooms is a different and far worse
job than having the rules from the start:
- **A name match is a CANDIDATE, not a link**, until confirmed.
- **The temporal filter** — you cannot name someone unborn — kills most of the
  noise on its own. **It cannot run until #46 is fixed.**
- **The room notes do the disambiguation** and already exist: Brutus's opens
  *FIRST, WHICH BRUTUS* precisely because someone saw this coming.

- **Unblocks:** a connection layer for the timeline and the hall that states
  *where* a connection is written down rather than that it was likely.
- **Acceptance test:** none yet — this is a slipway of its own once it earns
  one. The move is: fix #46, then build the candidate finder with the temporal
  filter and the notes, on a handful of rooms, and see what survives review.

### 48 · The Marketplace never hides — it scrolls through every tab
Reported live 2 Sep: selecting Marketplace scrolls through the character cards
and the other tabs in one continuous page, instead of showing a marketplace and
hiding the rest.

**THE CAUSE IS ONE MISSING CLASS.** Page1's panes hide with
`.page-section{display:none}` and show with `.page-section.active{display:block}`,
toggled by `activate()`. The marketplace is `<section id="marketplace">` with
**no `page-section` class and no `data-page`** — so the hide rule never touches
it and `activate()` never toggles it. It is permanently visible, sitting in the
flow between panes, which is exactly the endless scroll. It is not even one of
the six data-page sections (arena, bookstore, codex, timeline, terminal,
counsel); it is a bare section wedged after bookstore.

- **The fix is small but the DESTINATION is a decision, not a default** — which
  is why this is a slip entry and not a commit:
  - **Its own tab:** add `class="page-section" data-page="marketplace"` and a nav
    button with `data-target="marketplace"`. It then hides and shows like every
    other pane.
  - **Inside the Book Store:** it sits next to `bookstore` in the markup and
    reads as store content (*Books · Tokens · Collectibles*). Move the element
    inside that section so it hides and shows with it.
  - **Not shown yet:** give it `class="page-section"` and no nav button — hidden
    until something activates it.
- **A related question the same bug raises:** whether the NFT and Emerald Token
  cards should show at all. That is commercial intent, not a rendering call, and
  belongs with whoever owns the storefront.
- **Acceptance test:** selecting any tab shows that pane ALONE; the marketplace
  appears only when it is meant to, and no tab scrolls into another's content.

### 49 · The library's science is four rooms deep, on a roster ready for thirty
Surfaced 2 Sep by the timeline's *alive beside them* panel: for Einstein it
surfaced Gann, Keller, Tesla, Gandhi — the room-holders — while Bohr, Fermi,
Planck, Curie sat unseen in *and 487 more*, despite 70-year overlaps. The sort
is correct (rooms first, then overlap); **the gap is the roster, not the
display.**

Checked against the roster — 23 of the first names in the history of science
are all aboard and DATED, and only four have shelves:

```
has a room :  Galileo · Newton · Tesla · Einstein
no room    :  Archimedes (−287) · Euclid · Aristotle · Ptolemy · Copernicus ·
              Kepler · Leonardo da Vinci · Faraday · Darwin · Maxwell · Curie ·
              Planck · Bohr · Schrodinger · Heisenberg · Fermi · Turing ·
              von Neumann · Oppenheimer
```

- **Why it matters beyond one panel:** the science figures cluster in the
  densest, most-overlapping stretch of the whole roster — the 17th century and
  the 1850–1960 window. Every one of them, given a room, rises to the top of a
  dozen other figures' scene panels automatically, because the sort already
  favours overlap and rooms. This is the highest-leverage roster work there is.
- **The build is the citation build (SLIP #44/#13), applied to a chosen
  cohort:** each needs works cited to a findable public-domain edition. Newton's
  Principia, Darwin's Origin, Faraday's Experimental Researches, Euclid's
  Elements, Archimedes in Heath's translation — all are Gutenberg or Archive
  public domain, so the citation policy can stamp them. The moderns (Bohr,
  Heisenberg, Oppenheimer) are IN COPYRIGHT and will sit at THIN or LINKED,
  same as any recent figure — discussable and citable-by-link, not shelvable.
- **And it feeds #47, the mention graph:** these figures name each other
  constantly — Newton on Kepler, Einstein on Newton — so a science cohort is
  where the citable-mention layer would first pay off.
- **Acceptance test:** the named pre-1900 figures have rooms with public-domain
  editions; opening any physicist's scene panel shows other physicists near the
  top; and `probe-library` counts the new rooms.

### 50 · WATCH — the citation guard proves the words, not the frame around them
The quote guard (#34) confirms every quotation against the fetched text. It does
NOT check the TITLE, BOOK, CHAPTER or VERSE the quote is framed by — those are
prose, and the substring guard only inspects what is inside quotation marks.

Raised 2 Sep: the hall named a work of Josephus — something like *The Life of
Wives Taken Away* — that does not exist among his four works (Life, Antiquities,
Wars, Against Apion). It did NOT reproduce on a second ask, and no screenshot
was kept, so the exact words are unverified — which is itself the point: the
words came from the captain's memory, the register this whole ship routes
around.

**THIS IS A WATCH ITEM, NOT A BUILD — AND DELIBERATELY SO.** Three things could
have happened and they cannot be told apart after the fact:
- a **fabrication** — a title with no work behind it;
- a **real chapter, loosely titled** — the Antiquities runs to 20 books of a
  dozen chapters each, and Josephus does recount forced dynastic marriages
  (Herod's wives, the Hasmoneans). The hall may have read a genuine passage and
  paraphrased it as a title;
- a **conflation** — reaching for Livy's Sabine women or Lucretia, which ARE in
  the library, and mis-attributing the theme to Josephus because both were open.

**Why not harden now:** a title guard that checks only the whole-work titles
would flag a REAL chapter reference as a fabrication — crying wolf on the hall
reading closely, which is the exact fault probe-citations was built to refuse
(*a rule that flags correct work teaches the reader to ignore the report*). One
unreproduced instance is not a pattern to build against.

- **The trigger to promote this to a build:** the same shape surfacing again
  WITH a screenshot, so there is a real, verifiable instance rather than a
  memory.
- **The honest scope when it is built:** whole-work titles can be checked
  exactly against the `opened` list the engine already returns. Chapter and
  verse CANNOT — they must verify against the fetched TEXT, with the quote
  guard's three states (*confirmed in the text · not found in what was fetched
  · unmatched*), never a flat "false", because a real verse outside the slice
  is not a fabrication.
- **And it connects to a design pressure that is emerging:** the works are
  LARGE — Antiquities is 20 books, the .md bodies run to 100–150 KB — and the
  hall fetches a fixed slice. Chapter-and-verse addressing (fetch Book 15 ch. 7
  rather than the head of the file) would make citations precise AND give the
  quote guard a real locator to check against. That is the build this watch
  item feeds into: not a title-police, but finer-grained retrieval.
- **Acceptance test:** none yet — a watch item. It becomes a move when a second
  framed-citation fault is caught on screen.

### 51 · Planet rooms — the ship already has the engine
The sky is a primary source in the fullest sense: the planets are the record,
the ephemeris only its edition. A planet deserves a shelf, and it is the purest
room in the library because there is no persona to fake.

**THE LAW IS THE FEATURE: A PLANET DOES NOT SPEAK IN PROSE.** The tempting build
is to let Jupiter talk — the one move that hollows the ship out, because prose
in a planet's mouth is the MODEL's prose dressed as the planet's. The room's
note carries the boundary: *ask me where I was and I will tell you exactly, from
my path; ask me what it meant and I have no opinion.* No terminal. No voice.

**AND THE ENGINE ALREADY EXISTS — corrected 2 Sep.** Page2 loads
`astronomy-engine` (jsdelivr, v2.1.19) and wraps it as `Sovereign.Ephemeris`,
which computes any planet's position for any year IN THE BROWSER, live, cached.
The helix already runs on it. So a planet's room is NOT a static record baked
from SKY.csv — it is the ephemeris queried LIVE. Ask where Jupiter was in 1226
and astronomy-engine computes it on the spot: the purest reading of the source,
because nothing is stored to drift; the calculation itself is the testimony.

- **TWO WRONG ARTEFACTS FROM THIS SESSION, to bin or ignore:** `planet-jupiter.json`
  (a static transcription — the wrong shape) and a half-built `computed` mode in
  probe-library (a hack to count file-less works). Both were me making a dead
  copy of something already alive. Neither shipped to `main` in a load-bearing
  way; `planet-jupiter.json` sits at root, read by nothing, harmless.
- **The right build:** a planet room whose "works" are QUERIES against
  `Sovereign.Ephemeris` — where was I, when did I rise due east over Giza, whom
  did I meet — answered live, no file, no baked data. It reuses the engine the
  helix already trusts. SKY.csv stays as the TIMELINE's precomputed marks (fast
  to draw 1,600 of); the ROOM is the live engine (precise for any one query).
- **Acceptance test:** opening a planet room computes and shows its positions
  from astronomy-engine with no stored record; no planet room has a terminal;
  and the four prose modes are untouched — no `computed` special-case bolted
  onto the reading room.

### 52 · The roster is the closed list — the answer to relevance is to EXPAND it
An unreconciled gap, named 2 Sep: the hall knows only the ~1,100 souls in
`names.csv`, and its wall is hard — *a figure not named here IS NOT ABOARD,
however famous.* Correct, and it stops the hall inventing a Machiavelli room.
But history is not closed, and people OFF the list have real relevance:
Machiavelli asked about in Caesar's room, Cromwell's astrologer, Kepler when the
conjunctions come up. The wall makes the hall say *not aboard* and stop —
truthful but unhelpful, and it is the exact moment the model is most tempted to
break the wall and fabricate.

**THE RESOLUTION IS NOT TO SOFTEN THE WALL. IT IS TO GROW THE LIST.** The gap
exists only because the roster is smaller than the relevance. Make the roster
match the relevance and there is nothing to reconcile: everyone who could come
up is aboard, dated, and the wall stays intact because it excludes no one who
matters. Softening the wall trades a real guarantee for a vague one; expanding
the list keeps the guarantee and closes the gap.

- **IT IS CHEAP, because a soul needs no room.** Tonight proved the roster and
  the library are separate: 1,100 dated souls, only 52 with shelves. Adding
  Machiavelli, Kepler, Lilly to `names.csv` gives each a PLACE IN TIME — a bar
  on the timeline, a name in *alive beside them*, a date the mention graph (#47)
  can anchor to — with no shelf required. Roster is cheap; library is dear.
- **Every addition needs a real birth AND death**, or it breaks the timeline's
  midpoint placement and trips the sign-error guard in probe-roster. No undated
  names. Anyone relevant enough to add is dated enough to place.
- **The mechanism already exists:** `names.csv` → probe-roster →
  ROSTER-INDEX.json. Expansion is adding rows and letting the probe regenerate;
  everything downstream (timeline, panel, guard, find()) picks them up.
- **BUT EXPANSION IS AUTHORSHIP, NOT AUTOMATION.** A yml cannot decide who
  belongs — only place who has been decided on. Each new soul is a judgement:
  relevant enough to add, correctly dated, room-worthy later or not. This is the
  same work as building the roster in the first place, continued.
- **The standing practice, then:** when a relevant figure surfaces and is not
  aboard, the answer is to ADD them to `names.csv`, dated — never to loosen the
  hall's rule. The wall stays hard; the list grows to meet the world. #49 (the
  science cohort) is the first batch of exactly this work.
- **Acceptance test:** none — this is a principle, not a move. It is settled
  when the practice is followed: a surfaced-and-relevant figure becomes a dated
  roster row, not a softened rule.

### 53 · The answer box colours who / when / where — typographic, never a claim
Built 2 Sep. The hall's prose is now coloured along the three axes a reader
scans a history text by: WHO (people, terminal blue, matching the timeline),
WHERE (enumerated places, sand), WHEN (years and eras, grey-green). Three is the
ceiling — who/when/where is a complete idea, not one-more-colour. Applied in the
BOX, after the quote guard, not asked of the model — a name is blue because the
box recognised it, the same discipline as verifyQuotes. GOLD IS RESERVED for
verified quotes and never used here; the pass refuses to enter a quote span or a
link, so nothing earned is recoloured (tested).

**THE COLOUR IS TYPOGRAPHIC, NOT EPISTEMIC — and this is the load-bearing rule.**
Colouring Jotapata blue does NOT claim the ship knows Jotapata; it claims only
*this word is name-shaped, scan for it*. The colour helps the eye; it makes no
promise. The moment a colour became a LINK — *pursue this figure* — it would be
asserting a room the ship may not hold, and that is the roster wall broken
through a hyperlink.

- **The line, clean:** COLOUR DESCRIBES; LINKS PROMISE. A word is coloured for
  its shape, free; a word becomes a DOOR only if it is actually on the roster,
  earned. Never let a colour make a promise the ship cannot keep.
- **Known honest limit:** a place not in the enumerated list defaults to blue
  (Jotapata reads as a name). Best-effort, never misleading — a proper noun
  getting the proper-noun colour is a miss, not a lie. Tune the place-list and
  the stop-list from live prose, not in advance.
- **Acceptance test:** verified quotes keep their gold and are never recoloured;
  no coloured word is clickable unless it is a roster key; sentence-openers and
  demonyms (He, The, Roman, Jewish) stay uncoloured.

### 54 · The authoring stage needs a sourced REFERENCE LAYER — the tool is not the source
The deepest thing raised across several sessions, stated plainly 2 Sep. To
EXPAND the roster (#52) at any scale, the authoring stage needs a body of
confirmed fact to draft against — and it cannot be the model's memory (unsafe,
the séance) nor the primary-source library (that is what the hall QUOTES, a
different job). It needs a third thing that does not yet exist.

**THREE LAYERS, KEPT SEPARATE:**
- **Primary sources** — the 550 works. What the hall quotes at RUNTIME. Sacred,
  never the model.
- **A reference layer** — structured, external, dated, SOURCED. What the
  AUTHORING draws on to decide who belongs and when they lived. Canonical
  tabular data (regnal lists, papal succession, consular fasti, presidential
  terms) — facts, not prose to be remembered. THIS IS THE MISSING PIECE.
- **The model's general knowledge** — the draftsman that NAVIGATES to the
  reference. Never canonical, always checked, quarantined to the workbench.

**THE SHIP DOES NOT BAN GENERAL KNOWLEDGE — IT QUARANTINES IT TO THE STAGE WHERE
VERIFICATION HAPPENS.** At the workbench (authoring) the model's knowledge is a
feature, because every draft is verified before it lands. At the front desk
(the hall answering a visitor) it is forbidden, because nothing checks it before
it reaches the reader. The wall between authoring and answering is what keeps
the two from contaminating each other.

- **The consequence for the roster:** every row should carry PROVENANCE — not
  just *Kepler, 1571–1630* but *per [source]*. The model points; the source
  confirms; the row records both. Then the interface is a tool drawing on a
  source, not a mouth speaking from memory.
- **The dependency order this fixes:** the 500-name expansion (#52) is not the
  next build — the reference layer is, because the expansion is only fast, cheap
  AND honest once every row traces to a source rather than to a recollection.
- **“Not yet, maybe not ever”:** the interface could one day BE trusted as a
  source, but only after the reference layer, the provenance, and a long record
  of verified authoring have earned it. Until then: the tool is not the source.
- **Acceptance test:** a reference table exists that the authoring cites; new
  roster rows carry a source for their dates; and no roster row's dates trace
  only to a model recollection.

### 55 · The two tiers are a RATCHET, not a rule — scaffolding becomes stone
The deepest reconciliation of the general-knowledge question, 2 Sep. The hall
holds two kinds of knowledge and they are NOT in opposition — they are on a
one-way wheel.

- **Scaffolding** — general knowledge. The connective tissue: dates, places,
  relationships, established background (*Constantinople fell in 1453*). It
  holds the frame WHERE SOURCES DO NOT YET REACH. It is context, not testimony;
  it never wears the citation colours and never claims a source it lacks.
- **Structure** — primary sources. What the hall QUOTES. Sacred, verbatim,
  cited. The permanent masonry.

**THE SCAFFOLDING IS TEMPORARY BY DESIGN.** General knowledge is not a
compromise the ship tolerates nor a thing it forbids — it is the temporary
structure you build against while the permanent thing rises, removed as the
masonry takes its place. Every primary source added, every roster row sourced,
every encyclopedia article cited converts a piece of scaffolding into structure.
The Fall of Constantinople is background TODAY; the day a primary account of
1453 enters the library, it becomes a sourced quote. The frame turns to stone
one stone at a time.

- **THE RATCHET ONLY TURNS ONE WAY.** A fact once sourced does not revert to
  general knowledge; the library only accumulates. Which means a LIE laid as
  stone is permanent too — fraud (the model's invention) or fiction (a source's,
  see #54, FRAUD-OR-FICTION) that survives the workbench does not add a wrong
  row, it converts a false belief into apparent ARCHITECTURE, which is worse
  because architecture is not doubted. The verification steps are not hygiene;
  they are what guarantees the wheel turns only TRUTH into permanence.
- **The wall stays exactly where it must:** around QUOTATION and ATTRIBUTION,
  absolute. It comes down where it was never needed: around established
  background fact. Demanding a fetched citation for “1453” is the guard crying
  wolf, the failure probe-citations warns of.
- **THE SHIP’S HEALTH IS THE RATIO MOVING TOWARD STONE.** A chatbot leans on
  general knowledge and stays there — that is its ceiling. Amenti leans on it
  PROVISIONALLY, and every addition reduces the lean. The measure is not
  “does it use general knowledge” but “is the scaffolding retreating.” Tonight
  it retreated: 38 presidents went from general-knowledge gaps to dated, sourced
  rows (#54). A stone laid.
- **This is the principle #54 and FRAUD-OR-FICTION serve under.** Sourcing a
  cohort is not just careful list-keeping — it is turning the wheel: scaffolding
  to structure, one clean turn, the fiction read for what it is and left off the
  wall.
- **Acceptance test:** none — a governing principle. It holds when general
  knowledge is visibly provisional (never in citation colours, never claiming a
  source), when the wall around quotation stays absolute, and when the corpus
  only accumulates — no sourced fact ever silently reverts to memory.

### 56 · The roster schema wants a LIFESPAN; the ancient world kept REIGNS
Hit three times in one sitting, 2 Sep — Israel, Babylon, Persia. The roster
stores a birth and a death, and the timeline places a soul by that span. But the
entire ancient Near East is dated by REGNAL YEARS, not lifespans: nobody
recorded when Cyrus, Nebuchadnezzar, Hammurabi or David was born. Wikidata
correctly returns NO birth/death for them — which is honest, and which our
schema cannot currently accept.

**THIS IS A SCHEMA DECISION, DEFERRED HERE ON PURPOSE.** Three ways, to weigh in
daylight:
- **A reign span, distinct from birth/death.** Add `reign-start` / `reign-end`;
  the timeline places a soul by lifespan WHERE KNOWN and by reign where it is
  not, drawing the reign differently (a bar with a crown, not a life). This is
  the real unlock — it lets whole king-lists (Babylonian, Assyrian, Achaemenid,
  the divided monarchy of Israel) enter HONESTLY, each as what the record
  actually holds, without a fabricated birthday.
- **Reign-as-span, flagged** — the interim we used tonight for the iconic few
  (Cyrus, Darius, Xerxes, Cambyses, Artaxerxes, Darius III; Saul/David/Solomon
  as traditional). The bio says REIGN-SPAN, not lifespan. Honest but lossy: the
  timeline still reads it as a life.
- **Defer the undated** — leave them off until dated, as with the outer planets.

**WHAT IS ALREADY IN, FLAGGED, AWAITING THE SCHEMA:**
- United monarchy of Israel: Saul, David, Solomon — traditional dates, flagged.
- Achaemenid Persia, iconic: Cyrus, Cambyses, Darius the Great, Xerxes I,
  Artaxerxes I, Darius III — reign-span, flagged `King of Persia (reign)`.

**WHAT IS DEFERRED, needs a source AND the schema:**
- The divided monarchy of Israel and Judah (~40 kings) — needs a Thiele
  chronology table; Wikidata’s dates for them are absent or wrong (it returned
  Solomon as AD 1053).
- Babylon and Assyria (Hammurabi, Nebuchadnezzar, Sargon, Ashurbanipal, the
  king-lists) — reign years only, from a specialist chronology.
- Egypt’s pharaonic dynasties — the same shape, at greater scale.

- **The signal:** hitting this wall three times in one sitting means it is not a
  per-dynasty patch but a structural gap. The reign-span schema is the thing
  that opens the whole ancient world cleanly, and it is worth doing before the
  next Near Eastern cohort rather than hand-flagging each.
- **Acceptance test:** the schema accepts a reign where a lifespan is unknown;
  the timeline draws it distinctly; and a king-list can be onboarded without a
  single fabricated birth or death.

### 33 · My prefixed filename is in `probes/` again### 33 · My prefixed filename is in `probes/` again
`probes/Amenti.live__probes__probe-hall-wall.mjs` — a delivery-naming scheme the
assistant invented, abandoned, and reintroduced. It is junk beside the real file
and it shows in the drift report. Delete it.
- **Acceptance test:** the walk reports it gone; `unindexed` drops by one.

---

## FOLDED IN 1 SEPTEMBER 2026 — the addenda, read at last

The preamble has said since 31 Aug that three addenda held work never folded in,
and that until they were **this file is not the whole of the yard's open work
and should not be trusted as if it were.** Read and folded now. `THE-EDITIONS`
carries no moves of its own — it is the method for #18 and stays where it is.

The two that did carry moves were both raised 28 August and both say *paste into
THE STANDING SLIP and number them there.* Numbered here.

### 36 · Quote of the Day — and it must NOT be generated
A short passage from a figure's own writing, shown daily, attributed and linked
back to the work it came from. **THE ONE THING IT MUST NOT DO IS GENERATE THE
QUOTE.** The prospectus sells exactly this difference — *ungrounded; invent
quotes* against *verified primary-source grounding* — and a fabricated
quotation attributed to Lincoln on the front page is the moat, breached, in the
most quotable place on the site.
- **It is now cheaper than when it was raised.** The library holds 550 works
  with 495 cited to a findable edition, and the box already checks a quoted span
  against the text it came from (#34). The selection and the guard both exist.
- **Acceptance test:** the day's quote is verbatim in a stored work, its edition
  prints beneath it, and nothing on the path can produce a line that is not.

### 37 · Note of the Day — and it must NOT look like a quote
A short line from the day's figure — a greeting, an observation. **Generated,
unlike #36, and therefore governed by the opposite rule.** A generated line and
a sourced passage sitting near each other in the same typography teaches a
reader that both are the figure's words. One is.
- **This is the seam the hall already polices**, and the same answer applies:
  the reader must always be able to tell which they are reading. The note needs
  its own frame — plainly composed *for today*, not lifted from a work.
- **Acceptance test:** shown beside a Quote of the Day, a reader can tell at a
  glance which is the figure's own writing without being told.

### 38 · Quiz of the Day — the machinery already exists
One question a day from the `topics` table, tied to the day's figure where the
library allows. `amenti-mint` reads `topics` with the service key, `topics` has
RLS with no policies so no reader can see an answer, and `publicTopic()` already
strips `correct` and `accepted`. **Adding a quiz is one row insert.**
- **Unblocks:** the daily rotation's third sibling, at almost no cost.
- **Acceptance test:** a row inserted today appears as today's question, and the
  answer cannot be read from the client.

### 39 · The second voice — two figures on one question
A SCENE, NOT A ROOM: it starts, it has a shape, and it ends, with the reader
free to join. **The counsel already does most of it** — it stages a figure into
a role, carries its own register, and the Turn is already the rolling summary.
A second voice is a change of STAGING, not a new system, which is the reframe
that makes it cheap enough to try.
- **Why it was raised**, in the captain's words: *one-on-one is intense, and
  intensity is a demand.* A stranger arrives, is immediately the sole
  participant, is expected to lead, and a dead man is waiting on them. Two
  figures talking is a room a reader can stand in before speaking.
- **Acceptance test:** two figures hold one exchange, it ends on its own, and a
  reader who says nothing has still been somewhere.

### 40 · The way in — a page that asks what a reader WANTS
Cards under categories rather than a roster of names. **The categories should be
tags on figures, not curated lists.** A hand-written "religion" list is
Augustine, Aquinas, Luther — the obvious ones — and **Caesar never makes it**,
because whoever writes the list files him as a general.
- **Related to #31.** Both are ways into 1,011 souls for a reader who does not
  know a name to type: this one by subject, that one by time.
- **Acceptance test:** a reader who knows no names arrives somewhere they wanted
  to be, and a figure appears under a category no curator would have filed them
  under.

### 41 · The addenda are folded — decide whether they stay as files
`slip/SLIP-ADDENDUM-THE-DAILY-ROTATION.md` and
`slip/SLIP-ADDENDUM-THE-SECOND-VOICE.md` have been read and their moves are #36
to #40 above. Both say *paste into THE STANDING SLIP and number there*, which is
now done, so as move-holders they are spent — but each carries reasoning longer
than a slip entry should be, and #36's argument about the moat is worth keeping
whole.
- **Recommended:** keep them as the briefs behind their moves, cited from here,
  and never add a move to them again. A move raised in an addendum is a move the
  slip does not know about, which is the fault this section closed.
- **`slip/SLIP-ADDENDUM-THE-EDITIONS.md` is different** and stays as it is: it
  holds the METHOD for #18, not moves, and #18 already says read it rather than
  planning from the slip.

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

Items 8, 9, 16–22, 24–33 and 36–56 are independent — do them when they surface,
not in sequence. **#36–#38 are one build with three faces**, and the rotation
addendum makes the argument: Person, Quote, Note and Quiz of the Day all answer
*what does this reader see today*, and four rotations that drift is four bugs.

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

*Updated 2 Sep 2026: #56 added — the roster schema stores a lifespan, but the ancient Near East (Israel, Babylon, Persia, Egypt) kept REIGNS, not birthdays. A reign-span field is the structural unlock; the iconic few are in, flagged, awaiting it. #55 added — the two tiers of knowledge are a RATCHET, not a rule: scaffolding (general knowledge) holds the frame provisionally and becomes stone (sources) one addition at a time; the wheel turns one way, so the verification that keeps fraud and fiction off it is what keeps lies out of permanent architecture. #53 and #54 added — the answer box colours who/when/where (typographic, never a knowledge claim; colour describes, links promise); and the authoring stage needs a SOURCED reference layer, because the interface is the tool, not the source — not yet, maybe not ever. #52 added — the roster is the closed list; the answer to a relevant figure who is off it is to EXPAND names.csv (dated), never to soften the hall’s wall. Cheap, because a soul needs no room. #51 added and CORRECTED — planet rooms. The ship already
has the engine: Page2's astronomy-engine / Sovereign.Ephemeris computes any
planet live. A planet room is that engine queried, not a baked SKY.csv record;
the earlier planet-jupiter.json and a computed-mode hack were both dead copies
of a live thing. #50 added — a WATCH item: the quote guard proves the words
but not the title/book/chapter/verse that frames them. One unreproduced instance
(a Josephus work that is not his); not built, because a naive title guard would
punish the hall for reading a real chapter closely. Promotes to a build on a
second instance caught on screen, and feeds toward chapter-and-verse retrieval.
#49 added — the library holds four science rooms against a
roster of ~30 named figures already dated and waiting; the timeline's own panel
surfaced the gap. Highest-leverage roster work, because science figures sit in
the densest overlap band. #48 added earlier — the Marketplace tab never hides, because its
section lacks the `page-section` class the tab machinery toggles. NOTE: this
pass is rebuilt on the 47-move copy; #46 and #47 (Josephus, the mention graph)
were added 1 Sep but had NOT reached main — main jumped 45 to 48. This file
restores all three.*

*Updated 1 Sep 2026 (fifth pass): #46 and #47 added — one inverted date that
has now blocked two builds, and the mention graph, which is the citation policy
applied to relationships. Its disciplines want building while the library is 52
rooms, not 500.*

*Updated 1 Sep 2026 (fourth pass): #44 and #45 added — the events register
exists, is good, and is hardcoded into Page2, with the socket to publish it
already built and empty. Groundwork for the timeline (#31).*

*Updated 1 Sep 2026 (third pass): #42 and #43 added — the register cannot tell a
stale gloss from a true one, and its own section name has rotted. Both from
BRIEF-THE-DESCRIPTION-STAYS-WHERE-THE-TRUTH-WAS.md.*

*Updated 1 Sep 2026 (second pass): the three addenda READ AND FOLDED IN as
moves #36–#41, so the file no longer admits to being partial. Raise the next
move here, not in an addendum.*

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
