# HANDOFF → NEXT SESSION
## from the 4–6 September map sessions

**Read `THE-STANDING-SLIP.md` first (it now runs to #71), then this.**

---

## WHERE THINGS STAND

The map is a working instrument. Two days took it from a handoff asking for
geography to a surface holding four registers the ship did not have.

```
souls        2,043 · 871 pinned · 747 territory · 204 silent · 221 unresolved
positions      259 souls dated (12.7%) · 205 with more than one · 630 in all
crossings        8 authored journeys
events         536 · 386 pinned · 82 territory · 67 smouldering · 0 unresolved
sites           41 buildings on 36 grounds · 23 still standing
gazetteer   34,133 rows · audited · hash-pinned · verified every run
probes           8 reading files · 1 reading the page
```

`hall-probe.js`, run from the live page on 6 Sep: **no findings.**

---

## THE FILES THAT ARE NEW, AND WHAT THEY HOLD

```
SEATS.csv        where a soul was AND WHEN. Several rows per soul.
JOURNEYS.csv     a crossing that was itself an event. Authored, never derived.
SITES.csv        the ground, and what has stood on it. Builders and destroyers
                 are ROSTER KEYS.
EVENTS.csv       gained Place, note and `passes`.
COAST/RIVERS/LAKES/REGIONS/PEAKS.json   the ground under everything.

probes/probe-events · probe-seats · probe-journeys · probe-join
probes/probe-anomalies   the hunt, not a check — see below
probes/hall-probe.js     paste into the browser console on hall.html
work/                    worksheets: inputs, not registers
```

---

## THE RULES THIS WORK RUNS ON

Break any of these and the surface starts lying quietly.

> **A pin is *here*. A wash is *somewhere in here*. Nothing is *nothing known,
> and the count is stated*.** The commonest Location in the roster is "Southern
> Europe" — a continent, 334 souls. Drawn as a dot it is the biggest lie on the
> page and the one told most often.

> **A SPATIAL CLAIM SCALES WITH THE MAP. A TEMPORAL ONE DOES NOT.** This single
> property is what lets an event draw a ring honestly: it is counter-scaled, so
> zooming grows the coastline and leaves the ring alone. Anything that refuses
> to scale cannot be read as kilometres.

> **A LINE MUST BE AUTHORED AS A JOURNEY, NEVER DERIVED FROM TWO SEATS.** Two
> positions with a gap between them are not a journey; joining them invents the
> passage. An emigration IS the recorded fact and may be drawn — as a dashed
> arc that says *from here to here, not the route taken*.

> **PLACE IS AUTHORED. A machine may verify it and must never invent one.**
> Measured: derivation matched 29% and most matches were wrong — Marathon in
> Provence, Waterloo in Texas, Carthage in Ohio — while forty-five battlefields
> matched nothing and would have vanished in silence.

> **A DERIVED CLAIM THAT SHOWS ITS ARITHMETIC CAN BE CHECKED; ONE THAT OFFERS
> ONLY A DISCLAIMER CAN ONLY BE BELIEVED.**

> **DO NOT MAKE A PERMANENT FACT CONDITIONAL ON A PASSING ONE.** Jupiter's line
> is Giza's latitude and is true in every year; only the travelling sign is a
> count.

> **GOLD IS RESERVED.** It is a verified quote and nothing else. The probe
> refused two colours this session — including one named inside a comment
> explaining the refusal.

---

## WHAT TO DO NEXT, IN THIS ORDER

### 1 · THE REIGNS ENTERED AS LIFESPANS — first, and the order matters

~60 souls carry a REIGN where a life belongs. Most of the Han and Jin
successions and the Japanese emperors — *Emperor Chong of Han, AD 144–145*.
Mehmed II reads 1444–1446, his first reign, though he lived 1432–1481.

Each one **refuses a correct dated position**, because `probe-seats` checks that
a position sits inside the life and the life is two years long.

**AND IT MUST BE DONE BEFORE THE DUPLICATES.** Attempted in the other order on
6 Sep and the reason surfaced immediately: a duplicate-detector keys on dates,
and two people who share a REIGN window look like one person.

```
Crateuas of Macedon  /  Argaeus II of Macedon    both -501 to -401
Azam Shah            /  Bahadur Shah I           both 1707 to 1712
Isaac II Angelos     /  Alexios IV Angelos       both 1203 to 1204
```

**None of those is a duplicate.** Isaac II and Alexios IV are father and son,
co-emperors. A bulk merge would have destroyed six souls to fix a problem that
did not exist. **The two faults compound, and fixing the dates dissolves three
of the thirty-three.**

### 2 · THE DUPLICATE SOULS — in three groups, and only one is mechanical

`probe-anomalies.mjs` finds 33 pairs sharing exact dates and a name word. After
the reigns are fixed, expect ~30. They are not one problem.

**FIRST, A CORRECTION TO WHAT WAS BELIEVED ON 6 SEP.** It was reported in this
project that "the alias mechanism exists and was never turned on." **That is
wrong.** `img/KEYS.json` is GENERATED, and it is the ART register — which image
key has plates, has a room, which soul it belongs to. Its `resolvesTo` field
looks like an alias list and is a side effect. There is **no alias mechanism**,
and its three multi-name entries prove the gap rather than fill it:

```
brutus     → Lucius Junius Brutus | Marcus Junius Brutus     TWO PEOPLE
cleopatra  → Cleopatra VII | Cleopatra                       ONE PERSON, TWICE
seneca     → Seneca the Younger | Seneca                     ONE PERSON, TWICE
```

**The roster cannot say *these two rows are one soul*, and cannot say *these two
rows are different people who share a name*.** Both are needed and they are
opposite claims. That is a schema decision and it belongs to the captain.

The cheapest honest shape: a `Same-As` column in `names.csv` holding the
canonical Full Name. A duplicate row then stays VISIBLE in the source, resolves
to one soul in the index, keeps its spelling searchable, and Brutus stays two.
**Nothing is deleted.**

**THE THREE GROUPS:**

**Mechanical (5).** Accent variants — Schrödinger/Schrodinger, Khayyám/Khayyam,
Piaf/Piaf, Ávila/Avila, Umar. Resolvable by rule. **Canonical is the ASCII
spelling** until the slugger transliterates rather than strips: an accented name
produces an unguessable key, `André Citroën` → `andr-citro-n`, which no one
authoring against the roster will find.

**Editorial (~22).** *Saint Joan of Arc* vs *Joan of Arc*. *Buddha* vs *Gautama
Buddha*. *Simon Peter* vs *Saint Peter*. **No rule should make these choices.**
An automatic scorer tried and picked by which entry carried more assets, which
is not a naming principle.

**Not duplicates at all (3).** See item 1.

**WHY IT MATTERS BEYOND TIDINESS — the two halves carry different things:**

```
Gautama Buddha    room plate   Lumbini
Buddha                         Lumbini            the room is on ONE side only
Augustus Caesar   room plate   Rome
Augustus                       Southern Europe    one a pin, one a wash
Flavius Josephus  room plate   Jerusalem
Josephus                       Jerusalem
Erwin Schrodinger              Vienna   4 pos
Erwin Schrödinger              nothing            the seat work went to one side
```

A duplicated soul splits its room, its plate, its place, its mentions and its
positions, so **every count above it is wrong** — and the seat work done on
5–6 Sep was authored against whichever spelling came to hand.

### 3 · MORE SEATS — but only after 1 and 2

1,784 placed souls still show their birthplace. The surface says so, so it is
honest, but it is not what the handoff specified. **259 done, and the method
works**: draft by name, map to keys programmatically, let the probe catch the
namesakes. It caught nine this session — Nola→New Orleans, Bergen→Norway,
Adams→Pulandian, China.

The **221 unresolved seats** are blocked behind this: resolving them now would
pin them precisely at their birthplaces, and a soul precisely pinned at the
wrong claim looks finished.

### 4 · THE TERRITORY EXTENTS — the captain's call, not the assistant's

Hand-drawn, and they now **arbitrate**: `probe-geo` uses them to settle
namesakes, so a wrong box does not merely draw wrong, it REFUSES A CORRECT PIN.
`frankish gaul`, `mongol empire`, `carthage`-as-a-territory.

### 5 · `WORLD.json` UN-BAKED

It stores screen coordinates. Nothing in #65's globe starts until it holds
lon/lat.

---

## SMALLER, AND STILL OPEN

- **Three impossible builders** in `SITES.csv` — the Colosseum built AD 80 by
  Vespasian, who died in 79. True to history, false as written.
- **Six cities with two names on one coordinate** — Constantinople/Istanbul,
  Leningrad/St Petersburg, Bombay/Mumbai, Hanseong/Seoul. Two labels, one dot.
- **`passes` is authored, not measured.** The honest end state is a count from
  the corpus — how long the sources kept writing about a thing. Seven authors is
  far too thin to carry it (#71).
- **The faintness check** in `hall-probe.js` always flags the smoulder pulses,
  which fade by design. Teach it to expect them or a real fault will hide there.
- **`GRAPH.json`'s leverage list** is fresh as of 5 Sep: 25 corroborated souls
  with no room, all classical by construction (#67).

---

## HOW TO WORK WITH THIS CAPTAIN

- **Files are uploaded, not pasted into.** Produce complete, ready-to-place
  output. Copy-paste of file CONTENTS proved the most reliable route when
  downloads collided.
- **When a batch spans more than one destination, SHOW THE TREE FIRST**, then
  the cards, then one placement line per card. This was agreed and then broken
  repeatedly; do not break it.
- **A single stale read is not a finding.** `raw.githubusercontent.com` lagged
  for minutes at a time all session. Check twice, and use GitHub Pages as the
  tiebreaker — it rebuilds from the committed tree and settled two disputes.
- **The captain will push back, and is usually right.** Three of the best
  things built this session came from a correction: the comet-pass echo, the
  ground-versus-building split, and drawing the Jupiter line at the default
  view. Do not defend a position past the point where the objection lands.

---

## AND THE ONE FINDING THAT FRAMES THE REST

**Not one fault found in two days was wrong data inside a register.**

Every one lived in a join, a label, a reader's reach, or a format — the four
shores of *the water between*, now recorded in GLOSSARY. Averroes in Argentina
was the roster meeting a gazetteer. The birthplace fault was a correct column
under a wrong name. A probe reported a fault the register did not have because
it read the tables in a different order. And `SEATS.csv` was invalid CSV to
GitHub while valid to every tool we wrote.

> **COUNT FIRST. THE APPEARANCE IS NOT THE EVIDENCE.**

*Full account: `logs/2026-09-06.md`. Doctrine: slip #66–71,
`BRIEF-CÓRDOBA`, `BRIEF-JUPITERS-LINE`,
`FINDING-THE-SQUARING-OF-THE-LAKES`.*
