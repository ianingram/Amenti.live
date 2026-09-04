# INSTALL — THE MAP (geography for the Hall)

Built 3 Sep. Seven files go into the repo, three stay out. Placement matters:
`amenti-map.js` resolves its registers against `RAW`, which is the repo ROOT.
A register one directory deep is a 404 and a map that will not draw.

---

## WHERE EACH FILE GOES

### → repo ROOT (beside `hall.html` and the other `amenti-*.js`)

| file | what it is |
|---|---|
| `hall.html` | **replaces the existing one.** One line added (the script tag at ~305) and nothing else. |
| `amenti-map.js` | the map surface. Mounts its own trigger, owns its own clicks. |
| `GEO.json` | 2,043 souls tiered; 901 with coordinates; dates ride along. **Generated — do not hand-edit.** |
| `WORLD.json` | the coastline. Equirectangular, viewBox `0 0 1000 500`. |
| `names.csv` | **replaces the existing one.** Adds `Geo-Tier` as column 23. See the warning below. |

### → `probes/`

| file | what it is |
|---|---|
| `geo-tier.mjs` | the tier classifier, exported. |
| `probe-geo.mjs` | writes `GEO.json`. **Imports `./geo-tier.mjs` — the two must sit in the same directory.** |

### → DO NOT COMMIT (keep locally, or gitignore)

| file | why |
|---|---|
| `map-preview.html` | serve locally to see the map without pushing to main. |
| `amenti-map.preview.js` | a copy of `amenti-map.js` with one line changed. A second copy that must stay in sync is the trap `probe-roster.mjs` warns about with the slug function. |
| `map-check.png` | the static render that caught the label pile-up. A working artefact. |

---

## AFTER COPYING — THREE THINGS

**1. Stamp the script tag.** `hall.html` currently reads:

```html
<script src="amenti-map.js?v=REPLACE_WITH_STAMP" defer></script>
```

Let `stamp.yml` compute the hash. Do not hand-write one.

**2. Get `cities15000.txt` in place.** `probe-geo.mjs` needs it to resolve 839
of the 901 pins. **The probe now REFUSES to run without it** (exit 2, writes
nothing) rather than quietly producing a register with 62 pins — that silent
degradation was real, was measured against the repo as committed, and is fixed.
`--check` fails on the same condition, so CI cannot pass a repo whose next
regeneration would be broken.

```sh
curl -sL -o /tmp/c.zip https://download.geonames.org/export/dump/cities15000.zip
unzip -o /tmp/c.zip cities15000.txt -d .      # repo root, beside names.csv
```

GeoNames, CC BY 4.0. ~3 MB. Commit it, or fetch it in CI before the probe runs.
`--thin` writes a gazetteer-less register anyway, and says what it costs — it
exists so the refusal can be overridden deliberately, never by accident.

**3. Regenerate and check:**

```sh
node probes/probe-geo.mjs .          # expect: pins 901 · washes 747 · unplaced 191
node probes/probe-geo.mjs . --check  # exit 0 clean, exit 1 if the register thins,
                                     #          exit 2 if the gazetteer is gone
```

---

## THE `names.csv` WARNING

`config.js` says the ledger is a published Google Sheet. If `names.csv` is
regenerated from that Sheet, a hand-added `Geo-Tier` column **dies silently at
the next import.**

Nothing breaks when it does: `probe-geo.mjs` calls `geoTier()` on the `Location`
column directly and never reads the `Geo-Tier` column at all. The column is a
human-readable record, not a dependency. **If the Sheet is the source of truth,
the column belongs there, not here** — and this `names.csv` need not be
committed at all.

---

## WHAT TO CHECK IN A BROWSER FIRST

None of this could be verified from the build environment. In rough order of
what is most likely to be wrong:

- [ ] The **faculty rail** (globe icon, top right) sits sensibly against the
      title, and does not collide with anything in `<header>`. It is fixed at
      z-index 5 — above the map's own scrim — because an icon inside
      `.hall-chrome` would vanish behind the surface it opened, leaving no way
      back out.
- [ ] The icon **lights while the map is open** and unlights on close, and the
      hover label reads `WHERE`.
- [ ] **Clicking a pin does not strip the hall.** `hall.html` toggles
      `scene-bare` on any non-control click; the map answers with
      `stopPropagation`, the way the timeline does at its own controls.
- [ ] **Escape closes the map without also un-baring the scene.** The map's
      listener is capture-phase and stops propagation only while the map is open.
- [ ] **The timeline and the map never share the screen.** The map clears
      `scene-bare` on the way in; the timeline is the proven instrument, so the
      map is the one that yields.

---

## KNOWN, OPEN — the map is honest but not finished

1. **Wash labels pile into porridge** across Europe and the Mediterranean —
   ten territories overlap and each wants a label at its centre. This is the
   same failure `amenti-timeline.js` documents at its axis, and its note says
   staggering is robust where dropping is not. Copy the precedent.
2. **Overlapping washes compound.** Souls are grouped per territory so 334 do
   not stack into one hard rectangle — but Southern Europe, the Middle East,
   Egypt and Anatolia overlap *each other* and read harder than a single wash.
   It has not crossed into looking like a pin. The mechanism that would take
   it there is live.
3. **191 names nothing could resolve.** The probe ranks and prints them. Each
   goes to `HISTORICAL` (a real seat) or `EXTENT` (a territory). Mostly single
   souls — slow, not hard, and worth roughly 150 more pins.
4. **The territory extents are hand-drawn and are MY judgement, not the
   record's.** `frankish gaul`, `mongol empire`, `carthage`-as-territory.
   Someone who knows the material should read them before a visitor does.
5. **Attribution must become visible.** `GEO.json` carries it; the footer
   states it. Confirm a visitor can actually see: *City coordinates © GeoNames,
   CC BY 4.0. Coastline: Natural Earth.*

---

## THE NUMBERS THIS SHIPPED WITH

```
souls          2,043
pins             901   a dot — the record supports a point
                       (839 GeoNames · 62 historical)
washes           747   an extent — "somewhere in here", never a dot
silent           204   myth or no record — no mark, honestly
unplaced         191   a name nothing could resolve — reported, never guessed
seats            444   distinct points (Constantinople holds 124)
```

Constantinople resolves through GeoNames' alternate names to Istanbul, so the
seat that carries the most souls is one point, not two.
