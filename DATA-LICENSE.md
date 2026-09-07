# DATA LICENSE
## what may be done with the registers, and what this ship owes upstream

*This covers the DATA — the registers, the harvested files, the generated
imagery. The code has its own terms and is not covered here.*

---

## THE SHORT VERSION

**Amenti's own registers are CC BY 4.0.** Take them, use them, build on them,
sell what you build. Say where they came from.

**But most of them are DERIVED**, and a derived work carries its parents'
obligations forward. Those are set out below, per source, and they are not
optional. Where a register is derived, its own file header names its source and
that header travels with the file.

---

## WHAT IS AMENTI'S OWN

The authored content: the roster and its biographies, `SEATS.csv`,
`JOURNEYS.csv`, `SITES.csv`, `EVENTS.csv`, `SKY.csv`, the `why` sentences in
`NARROWS.csv`, the rooms, the notes, the slip and the briefs.

**CC BY 4.0** — https://creativecommons.org/licenses/by/4.0/

    Amenti.live · Ingram Manor LLC · CC BY 4.0

---

## WHAT IS DERIVED, AND WHAT EACH SOURCE REQUIRES

> **ATTRIBUTION IS NOT A COURTESY HERE. It is a term of the licence that let
> this ship read the data at all, and it flows through every file made from it.**

### Pleiades — `ATTICA.csv`, `ATTICA-NAMES.csv`, `ATTICA-MENTIONS.csv`
Ancient places, names and dates, derived from the Barrington Atlas.

    Pleiades · pleiades.stoa.org · CC BY 3.0
    https://creativecommons.org/licenses/by/3.0/

`ATTICA.csv` carries a Pleiades URI **per row**, so attribution survives even
when a single record is copied out of context. That is deliberate and should be
kept in any register derived from a gazetteer.

### GeoNames — the seat coordinates in `GEO.json`
`cities15000`, hash-pinned and audited.

    City coordinates © GeoNames · CC BY 4.0

### Natural Earth — `COAST.json`, `RIVERS.json`, `LAKES.json`, `REGIONS.json`, `PEAKS.json`, `WORLD.json`, `WORLD.lonlat.json`, `RELIEF.jpg`
Coastline, inland water, named regions, summits, the land outline and the
shaded relief.

    Natural Earth · naturalearthdata.com · PUBLIC DOMAIN — no attribution
    required, and credited anyway.

`WORLD.lonlat.json` comes by way of `world-atlas` (Mike Bostock), whose CODE is
ISC-licensed; the data inside it is Natural Earth and therefore public domain.

### ETOPO 2022 — `GROUND.jpg`, the sea half of `ATTICA.jpg`
Global relief, land and sea in one model.

    ETOPO 2022 · NOAA National Centers for Environmental Information
    doi:10.25921/fd45-gt74 · US Government work, PUBLIC DOMAIN

### Copernicus DEM GLO-30 — the land half of `ATTICA.jpg`, `NARROWS-terrain.csv`
30 m elevation. **THIS ONE IS NOT PUBLIC DOMAIN AND ITS NOTICE IS PRESCRIBED.**

    © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018
    provided under COPERNICUS by the European Union and ESA; all rights reserved.

> **⚠ VERIFY THIS WORDING BEFORE RELYING ON IT.** It is reproduced here from
> the terms as understood on 7 September 2026 and has not been checked against
> the current Copernicus DEM licence. Every other entry on this page is a
> licence this ship has read; this is the one to confirm. A wrong attribution
> is worse than a missing one, because it looks discharged.

### GEBCO — considered, not yet used
    GEBCO Compilation Group · PUBLIC DOMAIN, free of charge

---

## WHAT THIS SHIP ASKS OF A REUSER

Nothing beyond the licences above. But two things are worth knowing, because
they are why the registers are worth having:

**A CLAIM AND A GUESS ARE MARKED DIFFERENTLY, AND THE MARKING IS THE DATA.**
`tier` is `pin` or `wash` — a position, or the bounds within which a thing
should be sought. `NARROWS.csv` states that its coordinates are authored and
unverified. `NARROWS-terrain.csv` prints *WIDER THAN THE 12 km WINDOW* rather
than passing a box width off as a crossing. **Flattening those distinctions
produces a cleaner file and a false one.**

**AND SILENCE IS COUNTED, NOT OMITTED.** 204 souls have no place on earth and
the map states the number. 1,594 of 1,746 Attica places are named by nothing in
the corpus, and 203 of those could not be searched at all — which is a different
thing from having been searched and not found. Any derived work that drops the
zero rows is throwing away half the finding.

---

## WHAT IS NOT COVERED

Reader data of any kind. There is none here and none is published.

---

*Raised as slip #75. If a register is added and this page is not, the register
is unusable by anyone including a later version of this ship.*
