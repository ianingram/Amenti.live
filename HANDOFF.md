# AMENTI — ART HANDOFF
**Session close, 29 July 2026.** Fourteen plates, three complete decks, two surfaces wired.

---

## HOW TO HAND WORK OVER — READ THIS FIRST

**NO FILE SOUP. ONE IDEMPOTENT SCRIPT.**

Three times in one session I handed over seventeen files across two directories
plus a list of `git mv` commands, and three times something landed in the wrong
place or an old copy overwrote a new one. That is not a discipline problem on
the receiving end. It is the wrong shape of handoff.

The correct shape, and the standard for every session from here:

    ONE SCRIPT. Run from the repo root. Does every file operation in one pass.

        python3 apply_<session>.py --dry-run     # show what would change
        python3 apply_<session>.py               # do it

    It must be:

      IDEMPOTENT      Safe to run twice. Every step checks its own state first
                      and reports "already done" rather than doing it again.
      SELF-BACKING    Timestamped backup of any large file before touching it.
      SELF-VERIFYING  Ends with a pass/fail report on every claim it makes.
      NON-COMMITTING  Never commits. The person reviews `git diff` and decides.
      HONEST          Names what it CANNOT do. Binary files cannot be embedded
                      in a text script; the script must say so plainly and
                      list them rather than failing a count.

    And it must be TESTED AGAINST A CLONE OF THE REAL REPO, not reasoned about.

**Why the clone test is the load-bearing part.** `apply_art_session.py` passed
every check on my own working copy and then failed twice against a fresh clone —
an orphaned CSS selector and an empty `@media` block left behind by an earlier
regex. My copy and the repo had quietly diverged over two sessions. Measurement
beat conviction, and it only worked because the test ran on the real starting
state.

**What the person should have to do:** run one command, read one report, review
one diff. Anything more than that is the assistant offloading its own work.

### AND ASK WHERE THEY WORK BEFORE DESIGNING THE HANDOFF

The proprietor works **in GitHub, in the browser. There is no local clone and no
terminal.** I built and tested a command-line script for two sessions without
asking, and it sat in the repo unrun — because uploading a script does not
execute it. Lincoln looked unchanged because he WAS unchanged.

So the delivery mechanism here is a **GitHub Action**:
`.github/workflows/apply-art-session.yml`, triggered from the Actions tab with a
`dry_run` toggle. The script still does the work; the Action is what makes it
run. Same discipline, correct venue.

A SCRIPT IN THE REPO IS NOT A SCRIPT THAT HAS RUN.

---

## THIS SESSION'S SCRIPT

`apply_art_session.py` — root of the repo. Tested against a clean clone; all
eleven checks pass; idempotent on a second run.

    python3 apply_art_session.py --dry-run
    python3 apply_art_session.py

It performs: seven `git mv` renames from `-reading.jpg` to `-terminal.jpg`; an
in-place patch of `Page1.html`; and writes nine files.

**The only manual step:** two JPEGs it cannot embed —
`img/marcus-aurelius-card.jpg` and `img/marcus-aurelius-terminal.jpg`. Copy
those into `img/` by hand. The script names them in its report.

Note the dry-run reports FAILs in its verify section. That is correct: nothing
is written, so verification reads the unmodified file.

Delete the `Page1.html.bak-*` files once you are satisfied.

---


Every figure needs **three** assets. All three exist for three figures.

| asset | what it is | where it renders |
|---|---|---|
| **mark** | cartoon SVG in `window.AMENTI_SVG` | roster card `.rc-img`, codex row 36×50, quiz 54×54, marketplace chip 42×42 |
| **card plate** | JPG, 640×1120, 0.571 | codex detail `.cdx-art` 340×560 |
| **terminal plate** | JPG, 640×1120 | behind the chat stream, `.term-main` |

**COMPLETE DECKS: 3** — `frederick-douglass`, `marcus-aurelius`, `sun-tzu`

**PLATES BUT NO REGISTERED MARK: 4** — `lincoln`, `caesar`, `tesla`, `miyamoto-musashi`

### The mark situation is a REGISTRY MISMATCH, not missing art

25 marks are registered into `window.AMENTI_SVG` — 12 from `amenti-art-2.js`,
13 inline in `Page1.html`. But the key sets do not line up with `library/`:

- **10 marks have no library entry:** ayn-rand, gilgamesh, helen-keller,
  king-arthur, leif-erikson, loki, lycurgus, manlius, odysseus, prometheus
- **6 library figures have no registered mark:** caesar, gandhi, hannibal,
  lincoln, moses, tesla

Those six DO have drawings — they are the inline `<svg class="char-art">` in the
hero carousel. But inline markup is not the registry, and the codex and roster
read from the registry, so they draw in the carousel and fall back to a glyph
everywhere else. A green ☯ for Sun Tzu is `c.accent` on `c.glyph` — the designed
placeholder, which is why it does not look broken.

**`miyamoto-musashi` has no library entry at all.** Art without a room.

**THE CHEAPEST WIN AVAILABLE:** lift the six carousel SVGs into
`window.AMENTI_SVG` under their library keys. That alone takes complete decks
from 3 to 6, with no new art. It is an extraction job, not a drawing job.

---

## STATE OF THE ART, MEASURED

Every figure needs **three** assets. All three exist for three figures.

| asset | what it is | where it renders |
|---|---|---|
| **mark** | cartoon SVG in `window.AMENTI_SVG` | roster card `.rc-img`, codex row 36×50, quiz 54×54, marketplace chip 42×42 |
| **card plate** | JPG, 640×1120, 0.571 | codex detail `.cdx-art` 340×560 |
| **terminal plate** | JPG, 640×1120 | behind the chat stream, `.term-main` |

**COMPLETE DECKS: 3** — `frederick-douglass`, `marcus-aurelius`, `sun-tzu`

**PLATES BUT NO REGISTERED MARK: 4** — `lincoln`, `caesar`, `tesla`, `miyamoto-musashi`

### The mark situation is a REGISTRY MISMATCH, not missing art

25 marks are registered into `window.AMENTI_SVG` — 12 from `amenti-art-2.js`,
13 inline in `Page1.html`. But the key sets do not line up with `library/`:

- **10 marks have no library entry:** ayn-rand, gilgamesh, helen-keller,
  king-arthur, leif-erikson, loki, lycurgus, manlius, odysseus, prometheus
- **6 library figures have no registered mark:** caesar, gandhi, hannibal,
  lincoln, moses, tesla

Those six DO have drawings — they are the inline `<svg class="char-art">` in the
hero carousel. But inline markup is not the registry, and the codex and roster
read from the registry, so they draw in the carousel and fall back to a glyph
everywhere else. A green ☯ for Sun Tzu is `c.accent` on `c.glyph` — the designed
placeholder, which is why it does not look broken.

**`miyamoto-musashi` has no library entry at all.** Art without a room.

**THE CHEAPEST WIN AVAILABLE:** lift the six carousel SVGs into
`window.AMENTI_SVG` under their library keys. That alone takes complete decks
from 3 to 6, with no new art. It is an extraction job, not a drawing job — and
it should ship as one idempotent script, per the rule at the top of this file.

---

## WHAT CHANGED THIS SESSION

**`-reading` renamed to `-terminal`** on all seven plates, in the manifest, the
EXIF, `ingest.py`, the JS and the CSS. Those plates go behind the chat stream.

**The reading room takes no image.** It is for primary sources; the text is the
artefact. The `.dp-reader-hero` container, its CSS and its injector are gone.

**The carousel is SVG puppets again.** Six `char-photo` tags removed, the
`display:none` lifted, and the arrival/sweep/breath/ember animations dropped
with them. A photograph is a rectangle carrying its own background — it sits ON
the arena page as a foreign object where a transparent SVG belongs to it.

**`amenti-art-photo.js`** — new, loads before `amenti-art-3.js`. Fills `.rc-img`
from `{key}-card.jpg`, `.cdx-art` from `{key}-terminal.jpg` (falling back to the
card), and `.term-main` from `{key}-terminal.jpg`. Marks decorated cards
`data-art3="done"` so the mint worker covers only figures without a photograph.

**`ingest.py`** — one command does everything mechanical.

---

## THE PIPELINE

    1. I write the prompt
    2. You generate (9:16, 2K, polish ON) and COPY THE SEED
    3. You send it to me, I audit
    4. python3 ingest.py <file> <library-key> <card|terminal>
    5. git add, commit, push

`Page1.html` is **never edited to add a figure.** Paths resolve by convention
from the library key; grades live in generated `img/grades.css`.

---

## FILES

**Root:** `Page1.html` · `amenti-art-photo.js` · `ingest.py` · `provenance.py`
· `audit2.py` · `goldleaf2.py`
**`img/`:** 14 plates · `MANIFEST.json` · `grades.css` · `README.md` · `prompts/`

---

## THE FOURTEEN, MEASURED

| figure | surface | sat | key | span | tile | grade |
|---|---|---|---|---|---|---|
| caesar | card | 0.320 | 0.212 | 219 | 67 | 0.341 |
| caesar | terminal | 0.320 | 0.092 | 204 | 80 | 0.329 |
| frederick-douglass | card | 0.219 | 0.038 | 226 | 49 | 0.480 |
| frederick-douglass | terminal | 0.003 | 0.117 | 231 | 68 | 1.000 |
| lincoln | card | 0.114 | 0.010 | 240 | 87 | 1.000 |
| lincoln | terminal | 0.192 | 0.287 | 239 | **150** | 1.000 |
| marcus-aurelius | card | 0.335 | 0.094 | 226 | 69 | 0.312 |
| marcus-aurelius | terminal | 0.281 | 0.113 | 211 | 116 | 0.373 |
| miyamoto-musashi | card | 0.081 | 0.312 | 225 | 86 | 1.000 |
| miyamoto-musashi | terminal | 0.002 | **0.428** | 220 | 97 | 1.000 |
| sun-tzu | card | 0.062 | 0.019 | 233 | 56 | 1.000 |
| sun-tzu | terminal | 0.013 | 0.022 | 228 | 83 | 1.000 |
| tesla | card | 0.156 | 0.105 | 220 | 49 | 0.691 |
| tesla | terminal | 0.163 | 0.071 | 240 | 74 | 0.642 |

**Value span holds 204–240** across seven figures and five eras — the deck
cohering from the invariant style block, not from correction.

**Terminal opacity, solved per plate** from its own bright patches against the
terminal's 15.4:1 text contrast: sun-tzu 0.40, douglass and tesla 0.36,
marcus 0.35, caesar 0.33, musashi 0.32, lincoln 0.31.

---

## NOTHING HAS BEEN SEEN IN A BROWSER

Everything above was built from measurements. The codex slot, the terminal
plate, the per-image grades, the reverted carousel — none of it has rendered on
a screen. **Push and look before generating anything else.** Six decks that
read wrong is a worse outcome than three that read right.

---

## THE MARK LINE

Style proven, proportion not. The generated Lincoln cartoon returned:

    height / width   2.48   should be 4.0-4.5
    body / head     ~6.0    should be 8.0
    palette           13    asked for 6

Two-tone-per-form landed — hard tone edge down the hat, every form split lit and
shadow, real alpha, still read at 42px. **The style works; it came back short
and stocky.** `PROMPT_cartoon_lincoln_v2.txt` states proportion as ratios rather
than head-counts, because a model cannot count heads under a hat.

**Unresolved: whether the platform outputs SVG.** The Lincoln arrived as PNG
with alpha. Raster at 42px throws away the medium's advantage, and `.rc-img`
clones SVG. Recraft V4 SVG is the only tool that generates true vector — check
"View All Models".

---

## OPEN

- **Seeds null on all fourteen.** Only you can fill them. Without a seed these
  are a history, not a recipe.
- `ingram` is a living person with six library chapters. P10 applies.
- Two anachronisms accepted knowingly: segmented plate on Caesar's terminal
  bench (Imperial, a century late), slate blackboards in Marcus's colonnade.
  Both unworn props in absorbed images; neither an identity claim.
- Next plates by weight of library text: **tacitus** (130 KB), **david-hume**,
  **bram-stoker**, **moses**, **oliver-cromwell**.
- **gandhi** has four rejected attempts and no accepted plate. The prior — bald,
  gaunt, seventy — is the strongest we have hit. `PROMPT_gandhi_card_v5.txt` is
  the current attempt: heroic low camera, toga drape, glasses stated as five
  refusals.

---

## RULES, AND THE FAILURE THAT PRODUCED EACH

Drop the reason and the rule gets dropped next.

**Lead with the colour clause.** Caesar returned 0.312 saturation with
"monochrome" buried at the end after two hundred words about polished bronze.

**But name the exception.** "No colour" then killed the accent entirely — Sun Tzu
came back at R−B −0.36, dead neutral, no gold to reveal. Lead with
*"…EXCEPT the gold, which keeps its full warm colour."*

**Never name the medium a likeness survives in.** Marcus v1 cited portrait busts
and the model rendered a marble head. Describe features, name no source, refuse
stone explicitly, and add living-flesh cues — pores, capillaries, dirt, breath.

**Separate the ageing cues.** "Younger" alone never works.

**Name the material for how it takes light.** Two Lincolns measured: oiled
leather 124.3 specular pop and 12.88 micro-contrast; "black wool frock coat"
60.8 and 6.21. Wool eats the key.

**Backlight needs a named fill.** A source behind the subject silhouettes them;
a face lit by nothing is a hole. Name the bounce and say what it grazes.

**State actions, not adjectives.** "Attentive children" returns two mannequins.

**The card can carry the name.** Gandhi turned away, face hidden, posted the
best tile legibility of any card at 106.

**Refusals move the needle where description does not.** Glasses, marble,
stockiness — all fixed by naming what the thing must NOT be.
