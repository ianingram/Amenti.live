<!-- HANDOFF-INSTRUMENTS.md
     →  Amenti.live/HANDOFF-INSTRUMENTS.md
     Paste this block at the TOP of every handoff, above WHAT WAS BUILT. -->

# THE INSTRUMENTS · read this before the narrative

**A handoff that reports findings teaches the next session what was found. A
handoff that reports INSTRUMENTS teaches it how to look.** On 9 September a
session read "three coordinates are wrong and `probe-attica` names them",
absorbed the finding, never ran the probe, and re-derived the same three by
hand against a bathymetry API over twenty minutes. The information travelled
and the reflex did not.

**AND ONE OF THE THREE WAS NOT WRONG.** The Bosphorus endpoints measured −44 m
and −25 m — both in the channel. A finding written as a fact propagates its
errors forever. A finding written as an instrument call corrects itself on the
next run.

> **CITE THE INSTRUMENT, NOT THE FINDING.** Not "three coordinates are wrong".
> Write "run `probe-attica`, section 3." The second cannot be absorbed without
> running it.

---

## THE PANES ARE THE FIRST INSTRUMENT

They are on screen, in the register's voice, readable by a person and by
whatever parses them next. They are not decoration and they are not prose.

```
.at-note      counts · what is named and what collided · what has no ancient
              date · what is unplaced · WHETHER THE SWITCHES ARE OFF
.at-clock     why the cues are silent — "cues need a year, press the scrub"
.at-key       a live census of what the period holds, per mark
.at-listhead  what the list is sorted by, and the pin/area split
the glass     "the image is spent at x8 — bigger pixels, not more ground"
the tour band the frame's own claim about what it is showing
```

> **WHEN SOMETHING IS WRONG, ASK WHAT THE SURFACE SHOULD HAVE SAID BEFORE
> ASKING WHAT A PROBE COULD FIND OUT.** A probe answers once, for one session.
> A pane answers every time, for the captain and for the next instrument.

**AND THE MECHANICAL TEST: ANY FAULT THAT TOOK MORE THAN ONE EXCHANGE TO FIND
IS A MISSING PANE SENTENCE.** The blank surface on 9 September cost twenty
minutes; the fix was one line in `.at-note`. Add the sentence, then fix the
bug.

---

## THE FILE PROBES · what they read and what they cannot see

Run with `node probes/<name> .` or from the matching workflow.

```
probe-attica.mjs     the five ATTICA registers cross-examined · workflow: attica
probe-narrows.mjs    NARROWS.csv
probe-geo.mjs        GEO.json — it GENERATES it; do not hand-edit that file
probe-map.mjs        the world map's registers
probe-surfaces.mjs   SURFACES.json
probe-events.mjs     EVENTS.csv
probe-roster.mjs     the roster
probe-workflows.mjs  the workflows themselves
```

**EVERY ONE OF THEM IS BLIND TO THE DRAWING, AND `probe-attica` SAYS SO IN ITS
OWN SECTION 0:** *a register can be perfect and the surface still show nothing.*
Both faults found on 9 September were drawing faults — washes ignoring their
switch, and a tour leaving the switches off — and no file probe could have
caught either. The registers were correct throughout.

---

## THE CONSOLE PROBES · what reads the live DOM

Paste into the browser console on the page, with the surface OPEN. They read
only, and they **write a .txt and download it** — one paste, no copying out of
a console, because an hour of the captain's attention cannot be re-run.

```
probes/map-probe.js    the world map · architecture, not the drawing
probes/hall-probe.js   the hall · did the page draw what the files say
                       ATTICA HAS NONE. That is the gap.
```

**THE DOCTRINE THEY ARE WRITTEN TO** — it is in `map-probe.js`'s header and any
new probe follows it:

1. **REAL DATA.** Every number read off the live DOM at the zoom and year you
   are standing in. Nothing simulated, nothing assumed from the source.
2. **ATTRIBUTE, NEVER INFER.** Where a measurement disagrees with an intention,
   name WHICH MECHANISM WON — not merely that something is wrong.
3. **A MISSING SIGNAL IS NOT A RED LIGHT.** Anything unmeasurable is reported
   UNREAD, with the reason. Never convert blindness into a fault.
4. **RETURN TEN TIMES WHAT IT COST.** Report nothing that was asked for. No
   "the coastline drew". Only the unasked column.

---

## THE ORDER TO WORK IN

1. **Read the panes.** They are already reporting. Most questions are answered
   on screen.
2. **Run the file probe** for the registers in question, and read its Section 0
   first — the blind spots decide how much the findings are worth.
3. **Run the console probe** if the question is about the drawing. If there
   isn't one for that surface, that absence is the finding.
4. **Only then measure by hand** — and when you do, the result belongs in a
   pane or a probe, not in a chat message that the next session will absorb
   and not re-run.

---

## AND THE RULE FOR MODULES

**ANYTHING THAT BORROWS SHARED STATE GIVES IT BACK.** The tour reader takes the
reader's switches, period and year on open and restores them on close. The
reader's state is not an instrument's to spend. This is a rule for every module
that touches the surface, not a fix for the one that broke it.
