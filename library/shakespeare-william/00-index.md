# Shakespeare — Reading Room Manifest

**Status:** GREEN on availability. The difficulty here is not scarcity but textual instability.

**Scouted and ingested:** 1 August 2026
**Repository:** Project Gutenberg (see their Shakespeare guide: https://www.gutenberg.org/help/shakespeare.html)

---

## Files

| # | Text | File | Source | Words |
|---|------|------|--------|-------|
| 1 | The Complete Works | `01-complete-works.md` | PG #100 | ~965,000 |
| 2 | The First Folio (1623) | `02-first-folio.md` | PG #2270 | ~816,000 |

Both are **primary tier**, and they are not alternatives. See "The two poles" below.

## Deliberately not taken

Gutenberg's 1100 and 2200 series are duplicates drawn from the Folio, and their own guide
advises against them as less well maintained. #2270 supersedes both.

The 9-volume Cambridge Edition (Clark & Glover, 1863) is available and not taken. It is a
scholarly variorum with collation footnotes — valuable if the room ever wants to show editorial
reasoning rather than editorial results.

Gutenberg noted that one series had previously been listed as copyrighted on "sweat of the
brow" transcription grounds. That claim does not hold in US law, and the files taken here are
not from that series — but it is recorded for provenance.

---

## The two poles

**There is no manuscript.** No authorial holograph of any Shakespeare play survives. Every text
descends from print.

For roughly twenty plays the 1623 Folio is the earliest witness of any kind. For the rest,
competing quartos exist and disagree — substantially in *Hamlet*, and in *King Lear* to the
point where the two witnesses arguably preserve different plays.

So `01` is a modern editor's construction and `02` is the evidence it was constructed from.
A room holding only `01` silently presents editorial judgement as Shakespeare.

**Rule for the room:** read from `01`, cite contested passages against `02`.

## Attribution flags — OPEN DECISION

Two items inside `01` are not solely Shakespeare's:

- **The Two Noble Kinsmen** — collaboration with John Fletcher
- **The Passionate Pilgrim** — 1599 miscellany published under Shakespeare's name, mostly by
  other hands

*Pericles* and the *Henry VI* plays involve probable collaborators but sit differently — they
are in the accepted canon.

**Not yet decided:** whether these move to a `disputed/` shelf. Same problem as Minkowski in
the Einstein room.

## The catalogue anomaly

The Folio's own contents list omits *Troilus and Cressida*, which is nonetheless printed in the
volume. Verified against both. Recorded in the header of `02-first-folio.md`.

---

## Known limitations

**1. Both files exceed GitHub's rendering limit** (~1 MB). They commit and download correctly
but will not display in the browser.

**2. The Folio has no internal markup.** Gutenberg's EPUB is a flat text conversion — plays run
continuously with no per-play structure, separated only by "FINIS" (34 occurrences). Splitting
requires boundary detection from the text itself.

**3. OPEN DECISION — splitting.** Per-play files (~40 for `01`, 36 for `02`) would make every
play browser-readable, individually linkable, and able to carry its own note on witness
disagreement. Recommended but not done. This manifest will need rewriting if it goes ahead.
