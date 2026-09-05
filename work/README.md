# work/

Working documents. Inputs and drafts on their way to becoming something else.

Everything else on this ship is either a **register** (generated, read by a
surface) or a **surface** (a page a person opens). A worksheet is neither. It is
authored by hand, merged into a register, and then done — and there was nowhere
for that to live, so the first two were nearly kept off the ship entirely.

They belong here instead. **All data is worth keeping**; what it needed was a
place that says what it is.

---

## THE ONE RULE

**A worksheet is never the source of truth.** The register it feeds is.

`EVENTS-PLACES-worksheet.csv` carries a `Place` column and so does `EVENTS.csv`.
Once merged, **only `EVENTS.csv` is authoritative.** Edit the worksheet after
that and you have created a second answer with nothing to say which is right —
the fault this repo already carries two live examples of: two `geo-tier.mjs`
that diverged within nineteen hours, and two `merge.js` of different sizes.

To change a place after merging, change `EVENTS.csv` and re-run the probe.

---

## WHAT IS HERE

| file | what it feeds | state |
|---|---|---|
| `EVENTS-PLACES-worksheet.csv` | `EVENTS.csv` · Place, note | **merged 4 Sep** — 163 placed, 12 refused with reasons |
| `EVENTS-PLACES-2-worksheet.csv` | `EVENTS.csv` · Place, note | **open** — 325 rows, the finer grain: politics, religion, law, science, invention |

---

## HOW A WORKSHEET WORKS

**Place is AUTHORED. A machine may verify it and may never invent it.**

That is not a preference. On 4 Sep a derivation from event names and
descriptions was tried and measured: it "matched" 29% of rows, and the matches
included

```
Marathon                 -> Saint-Maximin-la-Sainte-Baume, France
Waterloo                 -> Austin, Texas
Carthage                 -> Carthage, Ohio
Trojan War               -> "date", a town in Texas
Plato founds the Academy -> "plato", a town in Missouri
```

while roughly forty-five battlefields — Kadesh, Thermopylae, Actium, Manzikert,
Agincourt, Bannockburn, the Somme — matched nothing at all and would have
vanished in silence while the register read as complete.

So: write the place, or leave it blank and write why.

- **`City, Country`** — a pin. The country is checked against the gazetteer and
  the row is REFUSED if they disagree. That check caught Carthage-in-Ohio.
- **a bare region or country** — a wash. `Southern Europe`, `Mesopotamia`.
- **blank, with a note** — the honest answer when there isn't one. A note is not
  a failure; it is the part of the record the map cannot draw.

### the conventions settled so far

**The row's own verb decides a war.** *"World War I begins"* names a MOMENT —
pin the trigger, Sarajevo. *"Seven Years' War"* names a SPAN — wash the theatre.
The row is not the war; it is the day the war started. Every such pin carries a
note saying what it is not.

**Still open, and worth settling before the second sheet is filled:** whether a
birth is an event on the map or a fact about a soul already in the roster, and
whether a century-long invention with a traditional attribution can honestly be
placed at all.

---

## THEN

Merge into the register, run the probe, and leave the worksheet here as it was
when it was merged. **A worksheet is superseded, not maintained.** Its value
afterwards is the record of what was decided and what was refused.
