# SLIP ADDENDUM — THE DAILY ROTATION
**Three moves for THE STANDING SLIP · raised 28 August 2026**

Paste into THE STANDING SLIP and number them there. This copy of the slip shows
eleven items; the live one carries at least nineteen, so the numbering is the
captain's to set.

---

## FIRST, A DESIGN POINT THAT CHANGES THE SHAPE

**Person of the Day is already on the slip.** Note, Quote and Quiz of the Day are
its siblings, not three unrelated features — all four answer the same question:
*what does this reader see today that they did not see yesterday?*

Built separately they become **four rotations that drift.** Four registers, four
date calculations, four things to regenerate, and four chances for today's note
to belong to a different soul than today's person.

Built together they are **one register with four columns**, and the day is a row:

```json
{ "2026-08-28": { "person": "lincoln", "quote": "lincoln:second-inaugural:14",
                  "note": "…", "quiz": "topics:rubicon" } }
```

**And the register is WRITTEN, never computed.** This is already the ruling on
Person of the Day and it applies to all four: a rotation derived from date
arithmetic over 52 souls rewrites every past day the moment soul 53 arrives. A
written register cannot. Yesterday stays yesterday.

**Recommendation:** one move — `DAY.json` and its writer — before any of the
three below. They are then three renderings of a register that already exists,
not three builds.

---

## MOVE · Quote of the Day

A short passage from a figure's own writing, shown daily, attributed and linked
back to the work it came from.

**THE ONE THING THIS MUST NOT DO IS GENERATE THE QUOTE.** The prospectus sells
exactly this difference — *"ungrounded; invent quotes"* against *"verified
primary-source grounding"* — and a fabricated quotation attributed to Lincoln on
the front page is the moat, breached, in the most quotable place on the site.

So the quote is a **citation into the corpus**, not a string: work id plus
offset, resolved at render. If it cannot be resolved it does not appear.
`SOURCES.json` and the room JSONs already hold everything needed; the 91 tagged
works across three rooms are the starting pool.

- **Unblocks:** a daily reason to return that costs no model call at all, and
  puts primary source on the front page where the claim is made.
- **Acceptance test:** open the site on two consecutive days; the quote changes,
  and clicking it opens the work it came from at the passage it quotes.

---

## MOVE · Note of the Day

A short line from the day's figure — a greeting, an observation, a remark.
Generated, unlike the quote, and therefore governed by different rules.

**IT MUST NOT LOOK LIKE A QUOTE.** A generated line and a sourced passage sitting
near each other, in the same typography, teaches a reader that both are the
figure's words. One is. The note needs its own voice and its own frame — plainly
composed *for today*, not lifted from a work.

**One model call a day, committed.** Same cadence as the weekly cron: generated
once, written to the register, served free to everybody. At roughly **$0.01 a
day** this is the cheapest recurring content the ship has.

- **Unblocks:** the day feels attended rather than static; the register gains its
  one generated column.
- **Acceptance test:** the note is in `DAY.json` before it is on the page — no
  reader ever triggers its generation, and the first visitor of the day waits for
  nothing. That is the fault `/atlantica/daily` still has and this must not repeat.

---

## MOVE · Quiz of the Day

One question a day from the `topics` table, tied to the day's figure where the
library allows it.

**The machinery already exists and none of it needs rebuilding.** `amenti-mint`
reads `topics` with the service key, `topics` has RLS with no policies so no
reader can see an answer, and `publicTopic()` already strips `correct` and
`accepted`. **Adding a quiz is one row insert.** The daily version is a selection
from what is there, not a new subsystem.

**The open question is what it pays.** The quiz surface feeds Star Tokens and the
emerald ledger, so a daily quiz is an economy change as much as a content one —
whether it pays the same as any other quiz, more for being the day's, or nothing
at all. **That is the captain's, and it should be decided before it ships rather
than adjusted after.**

- **Unblocks:** the retention loop the prospectus describes gets its daily beat;
  the quiz library gets a reason to grow.
- **Acceptance test:** the day's quiz appears, is answered, scores server-side,
  and the ledger shows exactly the payout that was decided — no more, no less.

---

## WHAT IS NOT KNOWN AND SHOULD NOT BE GUESSED

- **Which surface these appear on.** The arena? The hall? A new pane? Each is a
  surface and each needs an entry in `SURFACES.semantics.json`, so the answer
  decides more than layout.
- **Whether the day's four are one figure or four.** A single soul carrying the
  day is stronger, and it constrains the quote pool to one figure's works — which
  may be too thin on a day whose person has no room.
- **What happens on a day whose figure has no room.** 52 souls have rooms against
  1,011 in the roster. Person of the Day is already scoped to the 52; the quote
  cannot be scoped more narrowly than that without going silent.

---

*Raised 28 Aug 2026. Nothing built. The recommendation in the first section — one
register before three renderings — is the only part with a real order dependency.*
