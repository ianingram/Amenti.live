<!-- BRIEF-THE-BOX-BECOMES-A-ROW.md
     →  Amenti.live/BRIEF-THE-BOX-BECOMES-A-ROW.md -->

# THE BOX BECOMES A ROW
## fifteen frames, fourteen registers, and the decision not to go further
### 9 September 2026

---

## WHAT WAS BUILT, IN ONE PARAGRAPH

`amenti-attica.js` held its box as four numbers written into the file. It now
reads a row out of `FRAMES.csv`, which holds fifteen regions from Britannia to
the Black Sea. `tools/harvest-frame.py` cuts any of them out of the Pleiades
dump the same way, and on 9 September it cut fourteen — 21,470 places with
their fallbacks marked. A picker on the left edge stands the reader anywhere.
**Nothing has been authored on any of the fourteen, and that is the point of
the entry.**

---

## WHY THE BOX COULD NOT STAY A CONSTANT

It was written as a constant because when it was written there was one surface
and it was Attica. Two things said otherwise, from opposite directions.

**MARATHON OUTGREW IT ON ITS FIRST REAL USE.** The campaign enters from Cilicia
and the frame is a hundred miles. That was #4, raised on 8 September.

**AND THEN THE REGISTER SAID THE SAME THING.** `ATTICA-EXTENTS.csv`, harvested
the next day, reports the Aegean's own bounding box as **768 x 817 km inside a
320 km frame**. The Sporades 383 x 474. The Peloponnese 256 x 230. Every one of
them is in `ATTICA.csv` because its representative POINT falls in the box and
its extent does not.

> **THE FRAME IS A GOOD INSTRUMENT FOR A HUNDRED MILES AND THE REGISTER HOLDS
> THINGS IT CANNOT DRAW.**

---

## THE PLACEHOLDER WAS THE CENTROID OF A PLACEHOLDER

Six late provinces — Creta, Krete, Hellas, Achaia, Thessalia, Palaia Epeiros —
came through as washes stacked on `37.5, 22.5`, a point in the middle of
Arcadia and three hundred kilometres from any of them.

They share a bounding box: `20, 35, 25, 40`. A five-degree cell, 455 x 556 km,
holding Athens and Sparta and Delphi and Crete together. **Its centre is
exactly 37.5, 22.5.**

The coordinate was never a location. It was the middle of a box that means
SOMEWHERE IN GREECE.

**AND TWO INDEPENDENT SIGNALS AGREE ON WHICH ROWS THESE ARE.** A representative
point on a 1/8-degree intersection, and a bounding box on a 0.25-degree cell:
91 of 92 in Attica, 277 of 278 in Gaul, 482 of 483 on the Black Sea. The odd
one out each time is a place with a fallback coordinate and no box at all. The
`unplaced` column now carries the answer so no surface re-derives it from
decimal places, and no two surfaces derive it differently.

---

## WHAT THE FOURTEEN ARE, AND WHAT THEY ARE NOT

```
              places   pin  unplaced  extents  gridbox
attica          1751  1571        92      726       91   HELD · detail: full
latium          2939  2568        80     1602       80
sicilia          746   668        52      269       51
aegean-east     1584  1325       198      598      198
propontis       1294  1044       213      373      212
macedonia       2278  2068       146      727      146
creta            826   737        64      300       63
levant          1259  1048       190      363      189
aegyptus         451   390        49      170       49
africa          2051  1940        86      245       86
hispania        1533  1384       116      439      114
gallia          2583  2249       278      741      277
rhenus          1671  1443       195      602      195
britannia       1624  1563        37      640       37
pontus          1828  1313       483      457      482
```

**LATIUM IS THE DENSEST GROUND IN THE GAZETTEER** — 2,939 places and 1,602 real
extents, more than double Attica. Rome is very well surveyed.

**AFRICA IS THE FLATTEST.** 2,051 places and 245 extents. The interior was
recorded as sites, not regions.

**BRITANNIA IS THE BEST LOCATED.** 37 unplaced of 1,624 — two per cent. Roman
Britain was surveyed by people who wrote down where they were.

**AND THE BLACK SEA IS A QUARTER UNPLACED.** 483 of 1,828. A frame where one
place in four cannot be drawn, and it should say so before anyone authors on it.

---

## COVERAGE, MEASURED RATHER THAN CLAIMED

Pleiades holds 34,820 located places. These fifteen frames contain **21,470 of
them, 62%**. Thirteen thousand three hundred and fifty are in no frame —
Mesopotamia, Arabia, the Sahara, India, the far Atlantic.

That is not a gap to be embarrassed about. It is the shape of what this ship
has chosen to stand on, and it is written into `FRAMES.csv` so the sixteenth
frame gets added on purpose.

**2,848 places fall in more than one frame, and that is correct.** Byzantium
belongs to the Propontis and to the Black Sea both. A PLACE IS NOT OWNED BY A
SURFACE.

---

## THE WORLD MAP CANNOT LEND ITS GROUND

It holds COAST, RIVERS, LAKES, REGIONS and PEAKS for the whole earth, and every
one is Natural Earth 1:50m. Measured inside these frames:

```
attica     84 coast vertices across 320 km    one every 4 km
sicilia    25 across 440 km                   one every 18 km
rhenus     21 across 800 km · levant 15 across 520 km
rivers     ZERO inside attica, latium, sicilia, creta and africa
```

At 40 km a pixel that is the right instrument and the world map is right to use
it. **AT 39 METRES A PIXEL IT IS A POLYGON, NOT A COAST.** That is why
`ATTICA.jpg` exists, and why the Attica glass can magnify while the world map's
cannot — there is nothing under the world map to magnify.

So `FRAMES.csv` carries `ground_px` and `m_per_px`. A glass that magnifies past
its source is lying quietly, and it can only know where to stop if the frame
says what the image holds.

---

## AND HERE IT STOPS, ON PURPOSE

The next step in this direction is ground per frame. `tools/render-attica.py`
generalised is a tool run, and the effort is not the reason to hold.

> **FOURTEEN SURFACES THAT LOOK FINISHED, WITH NO `why`, NO EVENTS, NO MOVES
> AND NO CUES, ARE FOURTEEN INVITATIONS TO AUTHOR — ON A METHOD ATTICA HAS NOT
> FINISHED PROVING.**

The arithmetic is against it. Attica's 26 events, 10 moves, 106 `why` sentences
and 3 tours took days. Fourteen of that is not a bigger version of the same
job; it is a different job.

**THE REGISTER SCALES BY TOOL. THE READING DOES NOT SCALE AT ALL.**

What has been built is cheap and reversible: a box that became a row, fourteen
harvested registers, a picker. If the storytelling method changes, none of it
has to be unbuilt. `detail: reference` is the register saying out loud that
nothing has been read here, and the note pane repeats it on the surface, because
silence would let a reader take an unauthored frame for a finished one — the
same fault as a wash standing in for an extent.

**WHAT COMES BEFORE THE FIFTEENTH GROUND IMAGE:**

1. `probes/probe-tours.mjs`. Nothing checks that a tour row names a real switch,
   a real period, a year inside the scrub range, or a camera inside the frame.
   And nothing enforces the rule the whole format rests on — that a caption has
   not started arguing. That rule currently lives in a comment and in whoever
   writes the next row, which is not a rule.
2. **The join to the hall.** A place mentions a soul; the reader clicks; the
   hall opens. One direction, sequenced, never both on screen.
   `ATTICA-MENTIONS.csv` already holds it — 235 places, 133 corroborated, the
   reading rooms named per row. The data is there and nothing uses it as a link.
3. More tours, which is authoring rather than engineering.

---

*Registers: `FRAMES.csv`, `<KEY>.csv`, `<KEY>-EXTENTS.csv`.
Tools: `tools/harvest-frame.py`, `tools/harvest-extents.py`.
Workflow: `.github/workflows/frames.yml`.
Slip #4, #85–86.*
