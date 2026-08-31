# SLIP ADDENDUM · THE EDITIONS STILL TO FIND
**Opened 30 August 2026 · Ingram Manor LLC**

The citation work is done. This holds what is left of it.

---

## WHERE IT STANDS

Read from `CITATIONS.json` at `2026-08-30T23:47:06Z`:

```
works    550
CITED    495    90.0%    an edition that can be found again
LINKED     9     1.6%    sent out to the text — a url IS a citation
DATED      7     1.3%    a year, no edition identifier
THIN      39     7.1%    a name with nothing to find it by
EMPTY      0     0.0%
```

**No work on this site quotes a figure without saying where it came from.** That
is the line everything else rests on — the doctrine forbids inventing a
quotation, the posting gate refuses anything unsourced, witness mode says where
the record is silent, and all of it assumes a record exists to point at.

This morning the reading was **482 cited and 77 empty**, every one of the
seventy-seven on Abraham Lincoln, the most-quoted figure on the site.

**42 of 52 rooms are clean.**

---

## WHAT IS LEFT, AND WHY IT IS NOT URGENT

Nine rooms. **Nothing here is lost or wrong** — each names a translator or a
work and stops short of the edition that would let a reader find it again.

| room | thin | names | missing |
|---|---|---|---|
| akhenaten | 6 | Weigall translation | the edition |
| confucius | 6 | Legge | the edition |
| plato | 6 | Jowett | the edition |
| seneca | 6 | Aubrey Stewart | the edition |
| john-milton | 6 | the work only | **everything else** |
| oliver-cromwell | 4 | Carlyle / Lomas | the edition |
| shaka | 3 | "transcribed from oral tradition" | the transcriber |
| frederick-douglass | 6 | a year | the edition *(DATED)* |
| einstein-albert | 1 | a year | the edition *(DATED)* |

**Lincoln's remaining 2 are arguably already right** — the Gettysburg *Bliss
copy* and the Second Inaugural's bare *"public domain"*. Both were curated by
hand. The grader is being strict rather than correct, and that is the direction
it should err in.

**Milton is the one that may not be recoverable by method.** The other eight
name a translator, which is a thread to pull. His six say *"Paradise Lost, Book
I"* and nothing else: no editor, no year, no press. That one may need somebody
to remember where the text was taken from.

---

## THE METHOD THAT WORKS

Used twice, successfully, on 30 August.

> **MATCH THE ROOM'S TITLES, IN THEIR ORDER, AGAINST A BOOK'S TABLE OF
> CONTENTS.**

Lincoln's 77 were not a mystery once anyone looked: the titles and their
sequence named *Speeches and Letters of Abraham Lincoln, 1832–1865*, ed. Merwin
Roe, Project Gutenberg #14721, exactly and in order. Hume's six volumes were
confirmed the same way, each by its own subtitle.

**AND READ THE MANIFEST BEFORE SEARCHING ANYWHERE ELSE.** Hume's six Gutenberg
numbers were written in his own manifest — in the link-out's note, `Parts A–F,
#19211–19216` — while the web was being searched for them.

---

## HOW TO APPLY ONE

**Actions → cite a room → Run workflow.** No terminal is needed and none is
used.

**A blank source** — the room has works with no source at all:
```
room     plato
source   <the citation, ON ONE LINE>
dry run  ✓ first, then untick
```

**A source that exists and cannot be found** — the Hume case:
```
room     david-hume
match    Part A · Project Gutenberg ·
replace  Part A · Project Gutenberg #19211 ·
```
Leave the citation blank when using match.

**Several at once** — the `map` field alone:
```
find => put | find => put | find => put
```
A pair that matches nothing **fails the run and names itself**. In a batch that
is the dangerous miss: four land, one does not, and it looks like success.

**THREE FIELD TRAPS, ALL MET LIVE:**
- **Clear the fields you are not using.** GitHub pre-fills from the last run,
  and a leftover value silently changes what happens.
- **Paste the citation on ONE LINE.** A newline arrives as collapsed spaces
  inside the citation.
- **The room key is only the key.** `room  david-hume` went into the box once,
  including the word "room".

---

## WHY THIS CAN WAIT

**The guard is already standing.** `citations.yml` fires on every change to
`library/`, and an EMPTY source fails the build the day it arrives. THIN and
DATED report and do not fail — deliberately, because a room whose translator is
named and whose edition is not yet found is mid-work, not broken.

So the failure that produced this work cannot recur silently. Lincoln's
seventy-seven sat blank for as long as they had been blank, because
`probe-library.mjs` recorded them faithfully and **nothing read what it
recorded.**

> **AN EMPTY SOURCE STRING READS AS A FIELD RATHER THAN A GAP.**

---

## THE ACCEPTANCE TEST

Nine runs of `cite a room`, and then:

```
CITATIONS.json → THIN 0 · DATED 0
```

Or a ruling that Lincoln's two, Shaka's oral tradition and Milton's unknown
edition are as good as they will get — **which is a legitimate answer and
should be written down rather than left to look like unfinished work.**

---

*An addendum to THE STANDING SLIP. Its numbers were read at the hour named. If
this and `CITATIONS.json` disagree, the register is right.*
