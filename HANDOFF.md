# AMENTI — ART HANDOFF
**Session close, 30 July 2026.** Seven figures, fourteen plates, three surfaces.

---

## HOW TO HAND WORK OVER — READ THIS FIRST

**NO FILE SOUP. ONE IDEMPOTENT SCRIPT. RUN IT WHERE THEY WORK.**

Three times in one session I handed over seventeen files across two directories
plus a list of `git mv` commands, and three times something landed wrong. That
is not a discipline problem on the receiving end. It is the wrong shape of
handoff.

The standard, every session:

    ONE SCRIPT, run from the repo root, doing every file operation in one pass.

      IDEMPOTENT      Safe to run twice. Each step checks its own state.
      SELF-BACKING    Timestamped backup before touching a large file.
      SELF-VERIFYING  Ends with pass/fail on every claim it makes.
      GUARDED         Asserts invariants and ABORTS rather than write damage.
      NON-COMMITTING  The person reviews the diff and decides.
      HONEST          Names what it cannot do — binaries can't be embedded.

    TESTED AGAINST A CLONE OF THE REAL REPO, not reasoned about.

### THREE FAILURES THAT PRODUCED THOSE RULES

**ASK WHERE THEY WORK.** The proprietor works in GitHub, in a browser. No local
clone, no terminal. I built a command-line script for two sessions without
asking and it sat in the repo unrun. Lincoln looked unchanged because he WAS
unchanged. *A script in the repo is not a script that has run.* The delivery
mechanism is a GitHub Action — `.github/workflows/apply-art-session.yml`, with a
`script` input so a fix needs no new workflow, and a `dry_run` toggle.

**VERIFY WHAT YOU DID NOT BREAK.** The first real run destroyed the page. One
line: `re.sub(r'\n?\{display:none;\}', '', s)` — no anchor. It removed
`{display:none;}` from every rule in the file, including
`.page-section{display:none;}`, which is what hides each section until it is
active. The page showed two JPEGs and a row of tabs. **All eleven checks passed**,
because every check tested whether the script had done what it INTENDED.
*A self-verifying script that only verifies its intentions is not self-verifying.*
Never strip a declaration block without anchoring it to its own selector; assert
invariants; bound the blast radius.

**READ THE KEY, DO NOT INFER IT.** Musashi's plates were named
`miyamoto-musashi-*` because I inferred the key from the `frederick-douglass`
pattern. His record says `key:'musashi'`. He is the one figure with no
`library/` file, so there was nothing to read and I guessed. He alone showed a
puppet in the codex while everyone else showed a plate.

---

## THIS SESSION'S SCRIPTS

Run via Actions → **Apply art session** → set `script`, `dry_run` false.

| script | what it did |
|---|---|
| `apply_art_session.py` | renames, Page1 patch, nine files. **Contains the destructive bug — do not re-run the old copy.** The version in the repo is fixed and guarded. |
| `apply_fix_01.py` | musashi key; terminal resolves by `data-id` not by slugging the display name |
| `apply_fix_02.py` | **THE MOON KEY** — the terminal plate is lit, not dimmed |

---

## THE MOON KEY — WHY THE TERMINAL WAS BLACK

The plate was rendering the whole time. It was capped at **31% opacity** so body
text would clear WCAG 4.5:1, and then a **28% scrim** was laid over the middle of
the panel — exactly where a reader looks. Lincoln's plate has a mean of 126 and
arrived on screen at about **30 out of 255**.

Drawn, but not lit. **Optimising for legibility alone made the picture invisible**,
which is a different failure from a broken one, and the audit could not see it
because it was measuring the wrong thing.

Raising the opacity globally does not fix it: every pixel brightens, including
under text, so the worst case still governs and it falls back to 31%. The pool
fixes it **geometrically** — light falls where text is thin, and inside that pool
the plate runs at a mean of ~90 because nothing there has to be read.

    APERTURE WIDER THAN THE PANEL   150% x 130%. If the pool is bigger than its
      container you cannot find its edge, only the falloff. A circle you can
      find the edge of is an effect; a gradient you cannot is a room.
    A LONG FALLOFF                  Five stops. A torch is bright to a hard
      shoulder then dark; a window fades over a long run.
    NO FLOOR AT ZERO                Mask bottoms out at 0.14. The image
      continues into shadow rather than ending. An edge that stops is a shape;
      an edge that fades is a form — the same finding as the card plates,
      reached from the other direction.
    --pool-x IS THE MOON            Taken from each plate's OWN measured
      key_side, so the CSS light agrees with the light already in the
      photograph. Lincoln's column is keyed left, pool at 26%. Tesla's bench is
      keyed right, pool at 74%. Two light sources arguing reads as a mistake
      even to someone who could not name why.

| plate | key side | pool x | peak opacity | resulting mean |
|---|---|---|---|---|
| lincoln | LEFT | 26% | 0.72 | 92 |
| caesar | LEFT | 26% | 0.92 | 90 |
| musashi | LEFT | 26% | 0.92 | 87 |
| marcus-aurelius | RIGHT | 74% | 0.73 | 92 |
| sun-tzu | RIGHT | 74% | 0.92 | 66 |
| frederick-douglass | RIGHT | 74% | 0.92 | 42 |
| tesla | RIGHT | 74% | 0.92 | 53 |

**UNVERIFIED.** This has not been seen on a screen. Douglass at 42 and Tesla at
53 may still read too dark — their plates are simply darker files. If so, lift
`TARGET_MEAN` in `ingest.py` above 92 and regenerate.

**OPEN QUESTIONS, deliberately unanswered:** does the pool drift slowly or hold
still? Is the moon literal in the frame or implied off it? The moon began as a
*marker* in the pencil work — a notation for us, not part of the picture.

---

## SURFACES

| surface | container | size | gets |
|---|---|---|---|
| **codex** | `.cdx-art` | 340×560 → 0.607 | the plate. The only container in the product that fits 0.571. **Working — this is the one that got a "wow".** |
| **terminal** | `.term-main` | ~660 wide, content height | the plate behind the stream, moon-lit |
| **card / quiz** | `.rc-img` | 160 tall, ~91px of plate | SVG marks. Landscape at 1.24; a photo crops to a strip and turns to mush |
| **carousel** | `.char-art` | up to 560 | SVG marks. A photo is a rectangle carrying its own background and sits ON the arena page as a foreign object |
| **reading room** | — | — | **nothing.** It is for primary sources. The text is the artefact. |

**A NAMING PROBLEM TO SETTLE.** `passCodex` paints the `-terminal` plate into the
codex, falling back to the card. That was my choice — 560px wants an absorbed
figure with air, not a card face cropped to a portrait window. The proprietor
expected the card there and then preferred what he saw. **Which means the plates
are named for the wrong surfaces.** The "terminal" plate is really the codex
plate. Rename before there are forty.

---

## STATE

**Seven figures with both plates:** lincoln · musashi · caesar ·
frederick-douglass · sun-tzu · tesla · marcus-aurelius

**Gandhi has no accepted plate.** Five attempts. The prior — bald, gaunt, seventy
— is the strongest we have hit. `PROMPT_gandhi_card_v5.txt` is current: heroic
low camera, toga drape, small round wire glasses stated as five refusals,
because v4 returned gold aviators.

**25 marks are registered**, 12 from `amenti-art-2.js` and 13 inline in
`Page1.html`. But the key sets do not line up with `library/`: ten marks have no
library entry, and six library figures (caesar, gandhi, hannibal, lincoln,
moses, tesla) have drawings only as inline carousel SVG, not in the registry —
so they draw in the carousel and fall back to a glyph everywhere else.
**Cheapest win available:** lift those six into `window.AMENTI_SVG` under their
library keys. Extraction, not drawing.

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
| musashi | card | 0.081 | 0.312 | 225 | 86 | 1.000 |
| musashi | terminal | 0.002 | **0.428** | 220 | 97 | 1.000 |
| sun-tzu | card | 0.062 | 0.019 | 233 | 56 | 1.000 |
| sun-tzu | terminal | 0.013 | 0.022 | 228 | 83 | 1.000 |
| tesla | card | 0.156 | 0.105 | 220 | 49 | 0.691 |
| tesla | terminal | 0.163 | 0.071 | 240 | 74 | 0.642 |

**Value span holds 204–240** across seven figures and five eras — the deck
cohering from the invariant style block, not from correction.

---

## PIPELINE

    1. I write the prompt
    2. You generate (9:16, 2K, polish ON) and COPY THE SEED
    3. You send it to me, I audit
    4. python3 ingest.py <file> <library-key> <card|terminal>
    5. commit

`Page1.html` is **never edited to add a figure.** Paths resolve by convention
from the library key; grades live in generated `img/grades.css`.

---

## OPEN

- **Seeds null on all fourteen.** Only you can fill them. Without a seed an
  image is a history, not a recipe.
- The moon key is **unverified on screen**.
- Codex/terminal plate naming, above.
- `ingram` is a living person with six library chapters. P10 applies.
- Two anachronisms accepted knowingly: segmented plate on Caesar's bench
  (Imperial, a century late); slate blackboards in Marcus's colonnade. Both
  unworn props in absorbed images; neither an identity claim.
- Next plates by weight of library text: **tacitus** (130 KB), **david-hume**,
  **bram-stoker**, **moses**, **oliver-cromwell**.
- **The mark line.** Style proven, proportion not. The generated Lincoln cartoon
  came back at height/width 2.48 (wants 4.0–4.5), ~6 heads (wants 8), 13 tones
  (asked 6). Two-tone-per-form landed and it read at 42px.
  `PROMPT_cartoon_lincoln_v2.txt` states proportion as ratios, because a model
  cannot count heads under a hat. **Unresolved: whether the platform outputs
  SVG.** The Lincoln arrived as PNG with alpha. `.rc-img` clones SVG.

---

## RULES, AND THE FAILURE BEHIND EACH

Drop the reason and the rule gets dropped next.

**Lead with the colour clause.** Caesar returned 0.312 saturation with
"monochrome" buried after two hundred words about polished bronze.

**But name the exception.** "No colour" then killed the accent — Sun Tzu came
back at R−B −0.36, dead neutral, no gold to reveal. Lead with *"…EXCEPT the
gold, which keeps its full warm colour."*

**Never name the medium a likeness survives in.** Marcus v1 cited portrait busts
and the model rendered marble. Describe features, name no source, refuse stone
explicitly, add living-flesh cues — pores, capillaries, dirt, visible breath.

**Separate the ageing cues.** "Younger" alone never works.

**Name materials for how they take light.** Two Lincolns: oiled leather 124.3
specular pop and 12.88 micro-contrast; "black wool frock coat" 60.8 and 6.21.
Wool eats the key.

**Backlight needs a named fill.** A source behind the subject silhouettes them;
a face lit by nothing is a hole. Name the bounce and say what it grazes.

**State actions, not adjectives.** "Attentive children" returns two mannequins.

**The card can carry the name.** Gandhi turned away, face hidden, posted the
best tile legibility of any card at 106.

**Refusals move the needle where description does not.** Glasses, marble,
stockiness — all fixed by naming what the thing must NOT be.

**And measure the right thing.** The terminal audit passed every check while the
plate was invisible, because nothing measured whether it could be seen.
