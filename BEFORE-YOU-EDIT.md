# BEFORE YOU EDIT

Read this at the start of every session, before the first file is touched.

It was written at three in the morning on 13 September 2026, after a night in
which four faults were introduced, shipped, and found by the Captain rather
than by me. Every one was avoidable. Every one had the same shape.

---

## THE FOUR THAT HAPPENED

**A revert removed five declarations and the file still parsed.**
`SEA`, `wet`, `POS`, `RAF`, `shown` were sliced out by a comment-to-function
cut. `node --check` passed. Sixteen assertions passed. Slide 1's routes were
dead for a day and the error was a `ReferenceError` nobody saw because it
threw inside a promise.

**Two elements were given the same class.**
The aside's prose got `ap-pr`, which the text pane already used.
`querySelector` returns the first match in the DOM. Every slide's prose went
into the aside; the pane kept slide 1's for ever. The title changed, the map
changed, the words did not.

**A function was named `at` and so was a variable.**
Same scope. The `var` won. The function was never callable and nothing said so.

**A panel was moved to a margin that was not empty.**
Twice. The right margin was too narrow; the left holds the key and the frames
list, so the panel drew behind them and vanished. The handoff says *every edge
of that surface is spoken for*. It had been read that same session.

---

## WHY

**I worked from screenshots instead of files.** A screenshot shows dark pixels
and I read that as free space. The DOM would have said the key was sitting
there. `place()` in that same file was already measuring the bottom edge
correctly — I would have seen it if I had read the function I was about to
edit rather than a picture of its output.

**I verified the file and not the diff.** I checked that my new lines were
present and that the file parsed. I never checked what my edit removed.

**I added names without asking who else had them.**

---

## THE RULES

### 1. Read the function before editing it

Not the screenshot. Not the description. The function. If it is long, read the
twenty lines above and below the edit. The thing that will break is usually
already in view.

### 2. Grep the name before you use it

Every new class, variable, function or id: search the file first. Two things
answering to one name is not a style problem, it is a silent bug that reads
as working code.

    grep -n "ap-pr\|function at\|var at" file.js

Three of tonight's four faults do not survive this search.

### 3. Diff what you removed, not what you added

`node --check` proves a file parses. It does not prove anything still works.
Before handing a file back, compare it with the version on main and read the
DELETED lines. That is where the fault lives.

    grep -c "function wet\|var SEA\|var POS" file.js

A count of zero on something the file calls is the whole answer.

### 4. Ask what else reads this

Before changing a shared thing — a class, a projection variable, a load order,
a register column — find every caller. `F` was assigned two hundred lines below
the loops that project through it, so every mark drew in the previous slide's
frame while the image drew in the current one.

### 5. Measure the surface, do not guess at it

`place()` measures `.at-note`, `.at-clock`, `.at-ctl` and floats above whatever
is actually there. That is the standard. A hardcoded `right:14px` is a guess,
and a guess about a crowded surface is wrong twice out of two.

### 6. A comment that describes old behaviour is a fault

The key's swatch comment said the line was still dashed for a day after the
line became a wave. It reads as current and is not. When behaviour changes,
the paragraph explaining it changes in the same edit.

### 7. A layer that fails silently will be listed as working

`REGION-PLACES.csv` 404'd on every load for days while the handoff called it
aboard and working, because the loader caught the failure and drew nothing.
Anything that cannot be read must SAY it could not be read.

---

## THE HOUR

The error rate climbed sharply after 1 a.m. Several faults were introduced and
caught within twenty minutes — by the Captain, not by me.

That is not a process problem and no rule above fixes it. When the same class
of mistake happens twice in an hour, the answer is to stop, not to try harder.

---

## WHAT GOOD LOOKS LIKE

Every fault above was found because the Captain looked at the screen and said
*that is wrong*. That is the last line of defence and it should not be the
first. The rules exist so that the thing reaching the screen has already been
checked by the person who wrote it.

Read the file. Grep the name. Diff the deletion. Measure the surface.
