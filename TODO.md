# AMENTI — TODO
**Close of session, 1 August 2026.** The deck went from 8 figures to 21. This is
everything still open, in the order it will hurt.

---

## BROKEN NOW — silent failures already live in the repo

### 1. Hume's three philosophy texts 404
`library/david-hume.json` lists twenty works. Thirteen *History of England*
chapters resolve. Three do not:

    404  david-hume/01-of-cause-and-effect.md
    404  david-hume/02-of-miracles.md
    404  david-hume/03-dialogues-natural-religion.md

Not a case problem — the variants were tried. The files were never uploaded.
Found by `amenti.py check`, and dead for however long that room has existed.

**These can be real text, not renderings.** The *Enquiry Concerning Human
Understanding* and the *Dialogues Concerning Natural Religion* are solidly
public domain. Unlike Musashi, nothing has to be composed.

There is an irony worth noting: Hume's room is thirteen parts historian to five
parts philosopher, which is what dated his prior to the Advocates Library rather
than a study. The three that are missing are exactly the philosophy.

### 2. Shaka is not in the roster
`library/shaka.json` and three izibongo are live, but there is no record in
`window.AMENTI_CHARS`. Without it he has no card, no codex row, no terminal
entry, and the library file points at nothing that can reach it.

The record is written and waiting in `shaka-roster-record.js`. **The display
name must be `SHAKA ZULU`** — the loader dedupes curated records against the
ledger on `norm(name)`, the sheet says `Shaka Zulu`, and a curated record named
anything else means BOTH ROWS SURVIVE and he stands in the codex twice. That is
the documented Caesar / Gandhi / Moses failure.

### 3. Every prompt file is 404
Six of them, all in `img/prompts/`, and fifteen manifest records point at one:

    PROMPT_milton.txt  ·  PROMPT_seneca.txt  ·  PROMPT_akhenaten.txt
    PROMPT_confucius.txt  ·  PROMPT_shaka.txt  ·  PROMPTS_SESSION_31JUL.txt

The images and every audit number are safely recorded. What is missing is the
recipe half of the provenance.

### 4. `amenti.py` with the check is not committed
The version in the repo root predates `check`. The current one catches dead work
files and case mismatches and has already found two real faults.

---

## ARCHITECTURE — the thing that keeps recurring

### 5. Add a `key` column to the ledger
The sheet has no `key` column, so `slug(Full Name)` manufactures the key on all
~1000 rows, and four places each recompute it independently: the ledger, the
curated roster, `library/<key>.json`, and `img/<key>-*.jpg`.

**Every key incident here was that one bug.** Musashi's plates built as
`miyamoto-musashi-*` when the roster said `musashi`. Caesar, Gandhi and Moses
each standing in the codex twice. The codex resolving by array index after the
CSV merge made the index meaningless. Musashi having plates and no room for
weeks. `library/Musashi/` serving nothing to a JSON pointing at
`library/musashi/`.

One typed value per curated figure ends the class. `headerIndex()` already maps
columns fuzzily, so it needs one line there and one where the record is built;
blank cells keep slugging exactly as now.

### 6. Two ledger URLs — are they the same document?
`config.js` loads `2PACX-1vSN9sBzUL…` (published-to-web). The sheet being edited
is `11oMLeY…`, tab `amenti-ledger-deduped`. If those are not the same document
published two ways, **the site is reading a ledger nobody is editing.**
Unresolved, and the highest-value question on this page.

### 7. The sheet already holds the guards — use them
Columns M–S are `Appearance`, `AppearanceBasis`, `Dress`, `Signature`, `Set`,
`Epithet`, `Cliche`, filled in for the figures with registered marks:

> Loki — *"Not the horned-helmet villain of comics — Norse sources give him no horns."*
> Lycurgus — *"He may never have existed — draw the law, not the warrior."*
> Gilgamesh — *"Not a Greek hero — the proportions and beard are Sumerian."*

Those are guards, in the same form as *"he is fat,"* *"no horns,"* *"do not
normalise him."* Nine figures' worth of guards were written into standalone
prompt files this session while this structure sat unused. `AppearanceBasis`
even records `tradition` vs `unknown`, which is the exact distinction that made
Akhenaten's guard invert from *render a characteristic face* to *do not
normalise him*.

**Future prompts should be assembled from these columns, not written beside them.**

### 8. `audit2.py` still measures key strength on one axis
`key_strength` is lateral only, so it reads near zero for an overhead key, a
backlight or a frontal one. It failed six correctly-lit plates this session.
`amenti.py` reports `key_radial` alongside and says which to trust; `audit2.py`
was never updated.

### 9. The ledger third of the check cannot run from the container
`docs.google.com` is blocked at the egress proxy, so duplicate-name and
slugged-key faults cannot be detected by `amenti.py check`. It reports SKIPPED
rather than passing, which is correct, but it means the class of bug in item 5
is the one class the check cannot see. Adding the domain to the network
allowlist would close it.

---

## WRITTEN AND UNSHOT — prompts exist, no generation yet

| plate | file | note |
|---|---|---|
| Shaka — card | `PROMPT_shaka.txt` | blocked on item 2 |
| Shaka — terminal | `PROMPT_shaka.txt` | blocked on item 2 |
| Akhenaten — terminal | `PROMPT_akhenaten.txt` | card ships alone by choice; this would also repair his numbers, which are the worst in the deck |
| Gibbon — terminal | `PROMPTS_SESSION_31JUL.txt` | the only figure with card + chat and no absorbed plate |
| Milton — engraved | `PROMPT_milton.txt` | would land as `john-milton-chat.jpg`; the deck's one non-photographic plate, deliberately |
| Cromwell — Parliament doors | `PROMPTS_SESSION_31JUL.txt` | snow, chained doors, true black and white |
| Plato — table scene | `PROMPTS_SESSION_31JUL.txt` | **16:9 landscape**, not 9:16 |

---

## ROOMS WITH NO PLATES

- **charles-martel** — five works, four of them Gibbon writing *about* him. The
  thinnest room in the library, and Gibbon is already in the deck, so Martel
  arrives as another man's subject.
- **ingram** — six works.

---

## CLOSED BY DECISION — do not reopen

- **Seeds.** 1 of 39 recorded. The proprietor's position: a seed only buys a
  re-roll of an accepted plate, and those plates are chosen. `ingest.py` still
  prints `SEED IS NULL`, which now reads as an unfinished task and should be
  removed. One narrow exception stands: regeneration above 2K is impossible
  without one.
- **Akhenaten ships with a card only.** `passCodex` falls back to the card and
  the chat probe walks `-chat → -terminal → -card`, so every surface resolves.

---

## KNOWN DEFECTS, RECORDED NOT FIXED

Logged in `img/MANIFEST.json` notes, in the deck's own convention — the
segmented plate on Caesar's bench, the slate boards in Marcus's colonnade:

gold aviators on Gandhi's card · gear-driven roller instead of a charkha on his
terminal · invented gilt lettering on Gibbon's book spine · Gibbon's chat plate
generated 9:16 instead of 16:9 · nineteenth-century tailoring on Milton's card ·
four painted plates where the invariant asks for photographs (Hume, Hannibal,
Milton, Plato's cave) · the Stoker office having no key at all, radial 0.051 ·
Akhenaten normalised into a conventional pharaoh with plain rays instead of
ray-hands, the first plate ever to fail `value_span` · two sub-2K plates
upsampled rather than downsampled (both Plato).
