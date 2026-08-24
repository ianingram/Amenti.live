# AMENTI — GLOSSARY
**Ingram Manor LLC · 2026-08-24 · the vocabulary of the ship**

## WHAT THIS IS

Forty-odd briefs use these words and not one of them defines them. A new
session, and a visitor at the door, need the same answer.

**Every count below was read from a register on 24 August 2026, and every count
is of its own day.** They are here to make a definition concrete, not to be
quoted later. The register is the source; this is the sentence.

Entries marked **⚑** are inferred from usage across the briefs rather than from
a document that defines them. They want the proprietor's eye.

---

## I · THE WORLD

**Amenti** — the hidden land of the Egyptian dead, and the name of this system.
A library of souls who can be spoken to. Its first law is that it **refuses
loss**: plain text, one place, under version control, no fallback, because this
*is* the fallback.

**The three refusals** — the shape the three halls take. *Amenti refuses loss.
Hades refuses memory. Valhalla refuses return.* Each is a different answer to
what happens to what is kept.

**A soul** — one of the dead in the library. **1,011** on the roster today.
Also called a *figure*. A soul has a name, a biography, a voice identity, and
sometimes a plate and a room.

**The roster** — `names.csv`. The register of souls. Column zero is `Rank`, a
number, **not** the name — find the name column by header. A probe that assumed
position searched integers for "cleopatra" and reported eight empty lists with
complete confidence.

**A room** — a reading room in the library, one per soul who has one. **52**
today, under `library/`.

**The arena** — `Page1.html`. The flagship surface, where the sovereigns are
mustered, the terminal speaks and the reading rooms open. Called *The Stardust
Engine* in the manifest.

---

## II · THE THINGS A SOUL HAS

**A key** — the short name every surface uses to point at a soul.
`abraham-lincoln → lincoln`. **53** keys today, all resolving to exactly one
soul. There is no single convention — there are four, discovered by probe:

| shape | example |
|---|---|
| **exact** | the key is the slugged name |
| **suffix** | the forename dropped — `lincoln` in `abraham-lincoln` |
| **prefix** | the epithet dropped — `cleopatra` in `cleopatra-vii` |
| **reversed** | word order — `einstein-albert` |

**Key states** — `RESOLVED` one soul answers · `LOADED` one today, but another
roster name would also answer · `AMBIGUOUS` more than one answers now ·
`ORPHAN` none does.

> **A KEY IS NOT WRONG UNTIL A SECOND SOUL ANSWERS TO IT.
> BY THEN IT IS EXPENSIVE.**

**A plate** — an image of a soul. **51** today. Named `{key}-{variant}`, which
is why a scene dropped into `img/` once parsed as a figure whose name was a
place: `gw-winter` was George Washington at Valley Forge, counted as a man.

**A somatotype / a pose** — the figure-drawing tier. A pose is a named set of
joint rotations. **The method is retired** — figures are now generated from an
outside source via prompts — but `rig_views` is still in Supabase and the worker
still queries it.

---

## III · THE SPELLS, AND A WORD THAT MEANS TWO THINGS

**A spell (the Book of the Dead)** — one of the ~190 utterances of the Egyptian
funerary text. The source material. This is the sense the book uses when it says
*a hundred and ninety spells, each named and numbered and invoked to pass a
gate. That is a function signature.*

**A spell (this system)** — a rule the ship must obey, drafted in
`spec/spells.json`. **21** today, at version `2026.08-draft-3`. Each has an id,
a title, a source, and what it *states*. Examples: *There is no prosecutor.*
*Ammit has appetite, not malice.* *A figure has one key, derived one way.*

> **A SPECIFICATION FORBIDS THINGS.
> A METAPHOR CHOSEN AFTERWARDS NEVER DOES.**

**Conformance** — `spell-conformance.json`, written by `probe-spells.mjs`: the
ship measured against the spec. An **UNPROVEN** spell is the honest reading, not
a gap. A probe that guessed would be inventing.

---

## IV · THE ECONOMY AND THE COURT

**The emerald / ET** — the unit of account. Minted by a Worker, never by a
browser.

**The ledger** — the record of every emerald movement. Its law: **a balance is
never a stored number. It is the sum of every row, and the ledger only grows.**

**The three laws of the economy** —

1. The browser never mints, never scores, never spends, never settles. The
   browser is only ever allowed to **read**.
2. Every payout is **idempotent**. Nothing is ever paid twice.
3. The ledger is the **single source of truth**.

**The court / the cosmic court** — where arguments are judged. A weekly
settlement, `settle_argument_pool`, pays a fixed 500 ET split by share of
endorsements, idempotent per period, cron `0 0 * * 1` — **Monday**. It was found
set to Sunday on 17 August and corrected; the design always said Monday. The
bell had drifted, it did not have a design error.

**The weighing** — the court convening, deciding, recording, and being gone.

**The docket** — the register of arguments before the court.

---

## V · THE THREE TIERS

> **Cloudflare runs it. GitHub defines it. Supabase remembers it.**
> Remove any one and there is no application.

**A Worker** — a Cloudflare edge program. Six of them. The mint and the proxy
live there.

**The proxy** — `amenti-proxy.ingram-ian.workers.dev`. The single door to the
model. Every caller goes through `window.claude.complete`.

**The store** — Supabase. **25** tables, **16** functions, RLS on all 25. Held
the economy's laws behind one login until 23 August, when `db/schema.sql` came
under version control.

---

## VI · THE INSTRUMENTS

**A register** — a file that records a reading. `PLATES.json`, `KEYS.json`,
`PANES.json`, `SOURCES.json`, `SCHEMA.json`.

> **A REGISTER IS A READING, NOT A MEMORY.
> Regenerate it; never edit it by hand.**

**An instrument** — the thing that writes a register. `plates.js` writes
`PLATES.json`. `keyring.js` writes `KEYS.json`. Until 23 August, `SOURCES.json`
had none, and went stale exactly as hand-made things do.

**A probe** — a test. It runs, checks a list of claims, prints ✓ or ✗, and
changes nothing.

**A watch** — a probe that runs unattended on a schedule.

**A rung** — a scheduled slot. The strands run ten minutes apart. **Two must
never occupy one rung.**

**The chart** — `tools/chart.js`. Walks every repo and reports which island each
file is on and whether any register claims it.

**The mirror** — `Amenti-Workers`. A repo holding Workers whose only other copy
is with Cloudflare.

**The ark** — six repositories with full history bundled off-provider to R2,
weekly, verified. **A zip is not a backup**: it keeps the working tree and
discards the history that is the whole safety net.

**A pane** — one surface in the fleet watch.

---

## VII · THE FAULTS, NAMED

These are the words the briefs reach for most, and none of them was written
down anywhere.

**The Silent Signature** — an instrument that reports green while watching
nothing. A `✓` that is the memory of a manual check, not a probe.

> **AN INSTRUMENT THAT REPORTS GREEN WHEN IT IS NOT WATCHING
> IS WORSE THAN NO INSTRUMENT AT ALL.**

**Empty glass** — the correct behaviour when a reading cannot be taken: the
surface shows an explicit empty box saying so. Not a cached value. Not a blank
page. **The box.** A register whose run failed says `state: FAILED` and
`counts: null`.

**The water between** — where the faults live. Every fault found in the long
August session lay *between* two registers, each perfectly truthful about its
own island. Not one was an error inside a register.

**A false negative from an error object ⚑** — the unauthenticated GitHub API
returns `{"message": "API rate limit exceeded"}`, not data. Read as a listing,
it reports everything missing, with confidence. Has produced false negatives
twice.

**A positional assumption** — code that holds until the data arrives in a
different order. `AMENTI_CHARS[+dataId]` after a CSV merge; `names.csv` column
zero being `Rank`.

**Drift** — the claim and the reading disagreeing. Stamped `CONFIRMED`,
`UNPROVEN`, `UNDECLARED` (aboard and loaded, but nothing claims it — **27**
today), or `ADRIFT` (claimed, but the reading contradicts it).

**Stranded ⚑** — a script that cannot run because what it points at moved.
Twenty-one probes sit in `probes/` requiring `./amenti-chat.js`, which is at the
repo root.

**Unindexed** — a file in a repo that no register describes. *Not an error. A
document waiting for a sentence.*

---

## VIII · THE DOCUMENTS

**A brief** — a technical document in `Amenti-Technical-Briefs`. **42** today.

> **A BRIEF IS EVIDENCE, NOT A DRAFT.**
> The book cites and quotes. It does not absorb.
> The repository stores. It does not tidy.

**A shop-floor account** — a brief written the week it happened. Correct about
the days it describes and making **no claim about today**. Its counts are of its
own day and must not be corrected.

**A head note** — the comment added at the top of a recovered document
recording when it was written, what became of it, and that its counts are of its
own day.

**The source index** — `SOURCES.json`. **106** documents, every one with a
description and a verified path. Generated from a repo walk merged with authored
semantics in `SOURCES.semantics.json`.

> **A SOURCE THAT CANNOT BE REACHED IS NOT A SOURCE.
> It is a thing somebody remembers.**

**The manifest** — `fleet-manifest.js`. Every runtime file with a name and a
role: `config.js` is *The Harbormaster*, `library.js` is *The Librarian*.
Generated by `tools/merge.js` from the claims in `fleet-semantics.js` against
what the scanner observed.

**The Glass Gate** — the three-source architecture. Structure **generated**,
semantics **authored**, live state **probed**, merged with a drift report.

---

## IX · THE FACULTIES

The finding that arrives in every room: **separate the faculties, and make the
join explicit.**

| where | the separation |
|---|---|
| the voice | **cognition and articulation** — a mind, a voice, one nervous system; do not braid them |
| the image | **the Quizzard establishes what is true; the Art Director draws what has been described** |
| the manifest | **structure, semantics, live state** |
| the economy | **the browser reads; the server writes** |

**The Quizzard** — the faculty that establishes what is true.

**The Art Director** — the faculty that draws what has been described. The
handoff between them is a description.

**The armature** — the skeleton 20 of 33 drawings converged on to the decimal.
Head at `cy=116`, legs `y=396–512`. Nobody specified it; it was measured, and
handing it back as a constraint is what stops the model inventing coordinates.

---

## X · THE PEOPLE

**The captain / the proprietor** — Ian Ingram. The one who rules.

**Behind the captain** — the private repositories, `Amenti-Workers` and `Admin`.
Their existence is public; their contents are not.

---

> **CLAIM AS LITTLE AS POSSIBLE.
> Every fact you type is a fact that can rot.**
