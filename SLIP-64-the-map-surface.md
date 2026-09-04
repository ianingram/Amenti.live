### 64 · THE MAP SURFACE — zoom, battlefields, migrations, and the line that holds
Raised 4 Sep, the night the map was built. Recorded as a set of moves in
priority order, with one refusal stated up front so it is not relitigated by a
session that has forgotten why.

**THE DOCTRINE ALREADY GENERALISES.** The map's two tiers were settled for
place: a pin is *here*, a wash is *somewhere in here*, and they must never be
mistaken for one another. **A MOVEMENT HAS THE SAME TWO TIERS.** A documented
route with dated waypoints is a LINE. Everything else is a CORRIDOR — the wash
of a migration. That single idea decides most of what follows, and nothing
below needs a new principle.

---

**64a · ZOOM — do this one first.**
Nothing is in the way. The projection is one function and the SVG carries a
viewBox; region zoom is a transform plus a re-cull of labels. No data pass, no
honesty question, pure craft.

It matters more than it sounds: **at world scale a battlefield and a corridor
are both invisible**, so every other move here is unreadable without it. It
also retires the wash-label pile-up in the Mediterranean by letting a reader go
IN, rather than by inventing a cleverer cull — 294 labels are dropped at the
modern end today, and no culling rule fixes that at world scale.

- **Acceptance test:** a reader can reach the Aegean and read every seat in it
  without a label collision, and the drop count under the map falls to zero at
  that scale.

---

**64b · BATTLEFIELDS — one data pass away.**
`EVENTS.csv` already holds 536 events including **103 `conflict`, 13
`conquest`, 30 `disaster`** — the "something happened here" rows. What it has
no column for is WHERE. Same blocker the roster had before `Geo-Tier`.

The machinery is already built. Add a `Place` column, run it through
`probes/geo-tier.mjs` — the same classifier the souls use — and Actium is a pin
while "the Rhine frontier" is a wash, by the rule that already exists.

**AN EVENT IS A THIRD FACULTY AND MUST RENDER AS ONE.** A soul pin and a battle
mark on one surface, drawn alike, would assert that a philosopher and a sack of
a city are the same kind of fact. And an event is an INSTANT, not a lifespan —
it must not persist across the window the way a soul does. A fire is not a
tenure.

- **Acceptance test:** `Place` is filled for the conflict and disaster rows and
  audited the way `Location` was; no event renders as a soul; and an event with
  no honest place falls through and is counted, not guessed.

---

**64c · MIGRATIONS — buildable, and the most interesting of the four.**
A migration is genuinely a corridor with soft ends and contested dates, so the
honest drawing IS the honest thing: a broad wash that thickens as the window
crosses it, and **never an arrow with a head.** The Sea Peoples, the Bantu
expansion, the Norse — every one is argued over, and **a map that shows the
argument as WIDTH is better history than one that shows a confident line.**

This is the clearest case in the whole project where the honest rendering is
also the more beautiful one. Take it as the argument for the doctrine, not a
concession to it.

- **Acceptance test:** no migration renders with a point, an endpoint or an
  arrowhead; each carries its source; and the width of the corridor is stated
  as uncertainty in the legend rather than left to be read as extent.

---

**64d · TROOP MOVEMENTS — THE REFUSAL, and it stands.**
A campaign path is a claim about POSITION ON DATES. We have that for nobody.
An arrow sweeping from Macedon to the Indus is motion interpolated between two
endpoints and rendered as though it were known — and unlike the others **there
is no honest tier available**: a corridor for an army is not a softer claim, it
is a wrong one drawn gently.

It would also be the most PERSUASIVE thing on the page, which is exactly why it
is the most dangerous. Same reason the sub-planetary point is not drawn and
Jupiter's return line is labelled *a count, not a position*.

**THE ONLY EXCEPTION:** the handful of campaigns documented waypoint by
waypoint in a primary source. Those are a HAND-AUTHORED REGISTER with citations
per waypoint — never a generated effect, and never a general capability the
surface offers for any figure with two known places.

- **Acceptance test:** none. This is a standing refusal. If a future session
  wants it, it must first produce the dated waypoints and their sources.

---

**64e · GAMES — downstream, but the board already exists.**
Worth noting rather than planning: the map is already a game board. A scrubbing
clock, 864 placed figures, a sky that moves on real periods, and a constellation
of who named whom. What it lacks is a QUESTION to play against. Nothing here
should be built for a game before it is honest for a reader.

---

**WHY THE ORDER IS THE ORDER.** Zoom is free and unblocks everything.
Battlefields need one authored column and reuse machinery that exists.
Migrations need sources and a new rendering. Troop movements need a claim we
cannot make. Do not take them in the order of how exciting they sound — that
order is exactly reversed.

- **Acceptance test for the entry as a whole:** 64a lands, and 64d is still
  refused.
