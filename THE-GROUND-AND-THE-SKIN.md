# THE GROUND AND THE SKIN

Decided in conversation on 13 September 2026, at the end of the Attica
prologue, before stage 2 begins. Written down because these are the decisions
that make a second campaign cheap, and none of them is obvious from the code
as it stands.

---

## THE WAREHOUSE

A giant map on the floor. A camera at the ceiling, pointing down. The camera
moves and it zooms; the map does not.

That is what `frame` and `inset` are, and the analogy is worth keeping because
it predicts the real limit: **the floor map is printed at a resolution, and
past that the camera shows paper fibres rather than more coast.** REGION.jpg
is printed at 240 pixels per degree. No lens fixes that. Only a bigger floor
map does.

### Where the analogy breaks, and it matters

On a real floor, everything drawn on it shrinks as the camera pulls back. Here
the marks are not on the floor. They are a second pane between the camera and
the ground, and they hold their screen size.

> **GROUND SCALES. MARKS DO NOT.**
>
> A mark is a claim and keeps its size. Ground is a place and takes the
> camera's.

Getting this backwards is what made a host of 150 dots read as one red blot
over Adana: they were sized for a pane 160 km wide and drawn on a map 1,400 km
across. The campaign layer already has the rule written down — its fleet
spread is in ground units precisely so that seven kilometres of water stays
seven kilometres at any zoom.

Every new mark has to answer the question: is this a claim, or is this ground?

---

## THE PANES

Conceptually, from the bottom:

1. **The coordinate grid.** Bounds, projection, and nothing visible.
2. **The water mask.** Where sea is. See below — this is the one that has to
   move.
3. **The ground image.** The floor map. Swappable.
4. **The places and their names.** Register-driven, projected onto whatever
   ground is showing.
5. **The marks, routes and legends.** The claims.

Panes 1, 2 and 4 are TRUTH. Pane 3 is APPEARANCE. Pane 5 takes its ink from
the skin and its positions from the truth.

---

## SKINS

A skin is a ground image plus the ink that reads on it: nautical wireframe,
black on white, terminal green, glass and marker. The places, the routes and
the legends do not change — only how they are rendered.

**The difference from a game skin:** in a game a skin is cosmetic by
definition. Here the ground image is currently doing two jobs — it is what the
reader sees AND it is what `wet()` reads to decide where water is. Swap the
image and the rules change.

### So: bake the mask

`wet()` tests `(blue - red) > 22` on the ground image. On a wireframe or a
green terminal skin that arithmetic means nothing, and every sea route would
route through land — SILENTLY, which is the worst kind of wrong.

> **WATER IS NOT A PROPERTY OF A PICTURE.**
>
> Bake the mask once out of the NASA ground into its own file — a 1-bit image
> or a run-length register — and have every skin read that. Then a skin cannot
> change where the sea is.

It also makes the route table faster: it would not need a 1.3 MB JPEG to know
where water is.

### And the ink travels with the skin

Red routes and white labels are correct on dark bathymetry and illegible on
black-on-white. Each skin declares its own line, label, glyph and halo
colours. Otherwise every skin needs code, and a skin that needs code is not a
skin.

### And the bounds come from the register

`RLO0`, `RLO1`, `RLA0`, `RLA1` are hardcoded constants in the prologue today.
Swap the image without swapping them and every mark lands in the wrong
country, silently, again.

A ground's row is roughly: name, file, the four bounds, ink set, whether it
can serve as the mask, and its source. **Then a skin is a row, and stage 2 is
a row.**

---

## THE MASK AUTHORS; IT DOES NOT REPAIR

Two mechanisms, and they are not the same thing.

**At draw time** `wet()` pushes a line off land — samples the segment, finds a
dry point, bends perpendicular until it clears. That is a REPAIR. It is blind:
it does not know where the line was trying to go. A bend that begins at the
departure doubles back, which is exactly how the fleet left Athens westward
past Corinth.

**In the route table** A* walks the water and finds a genuine course, or
reports that none exists. That is ROUTING.

> **A REGISTER THAT NEEDS THE BEND ON EVERY LEG IS A REGISTER NOBODY HAS
> WALKED.**
>
> The bend stays for the case somebody missed. It should never be doing the
> work.

### Water is routed; roads are not

A ship physically cannot cross land, so a sea course is found. A road over a
mountain is a CHOICE, and choices belong to the register — Mardonios crosses
Anatolia in six straight waypoints because Herodotus gives no route, and a
road bending around terrain would be inventing one.

That is why the route table has separate sea and road modes rather than one
clever mode.

---

## THE TWO LAYERS ARE NOT THE SAME PROGRAM

It was proposed that the campaign might be a subset of the prologue. It is
not, and the campaign's own comments say why.

**The prologue draws claims.** A line is a leg. A dot is a place. One mark per
thing asserted.

**The campaign draws bodies.** Four hundred marks for a fleet, 120 for an
army, spread across 11 ground units, moored in rows of eight because 6.107
says *moored*. A battle, a pulse, an eight-furlong bar that measures rather
than joins.

You cannot get the second by adding a column to the first. The split between
told and shown is REAL and worth keeping.

**What is not real is the duplication.** Both files independently carry a
projection, a water test, `along()`, a caption panel, a legend, and a
`place()` that measures furniture. On 12 September the identical fault — a
panel drawn over the ground it describes — was fixed in both, separately, and
wrongly three times in one of them.

> Pull the shared vocabulary into one place both read. Do not merge the
> layers. **A fix should land once.**

And the campaign controller belongs to whatever owns that shared layer — not
to a third file that would carry a third copy of all of it.

---

## THE ORDER OF WORK

1. **Bake the water mask** out of the NASA ground, so water stops being a
   property of a picture.
2. **The grounds register** — bounds, ink, source, one row per ground, and the
   small buttons that switch between them.
3. **The shared vocabulary** — projection, mask, `along`, caption furniture,
   key — read by both layers.
4. **The campaign controller**, which can then live in one place honestly.

Stage 1 is Attica. Stage 2 is another site, and if 1 through 3 are done it is
a row in a file rather than a new program.
