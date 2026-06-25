# THE MIND THAT SPEAKS
### Amenti.live — A Technical Field Journal of the Voice & Publishing Build
*Ingram Manor LLC ·

---

> *The brain receives content, then loads speech.*
> First the thought is formed. Then it is given a voice.
> We did not invent this sequence. We built a system in its image.

---

## 0 · Preface — the shape of the work, and why the constraints mattered

Amenti.live is a "Library of Legends powered by AI" — a place where historical
figures answer in the first person. Apollo, Lincoln, Hypatia, Genghis Khan, Mansa
Musa, Tupac: summon any of eleven hundred, ask a question, and they answer *as
themselves* , **in their own voice.**

Three constraints shaped every decision in this build, and it is worth naming them
up front, because good architecture is usually the child of honest constraints:

1. **The builder is not a developer.** All code is edited through the GitHub web
   editor — no local environment, no build tools, no terminal. This is not a
   limitation to apologize for; it forced a discipline that made the system more
   robust: **whole-file replacements over fragment surgery.** (We re-learned why,
   painfully, late in this build. More on that in §11.)
2. **The hardware is a Late-2014 iMac.** Old enough that heavy local tooling is a
   non-starter. The work had to live in the cloud and in the browser.
3. **The output had to be characterful, not merely correct.** A guiding maxim
   emerged early and never left: ***variety is the magic, not accuracy.*** A
   thousand figures who all sound the same is a dead archive. A thousand who each
   sound like *someone* is a living library.

What follows is the technical story of how a website learned to think and speak —
the dead ends, the paradigm shift that unlocked everything, and the architecture
that now stands. It is written in two layers: the **narrative** of what happened
and why, and the **technical detail** of how, set off in fenced blocks and tables.
A glossary closes the document.

---

## 1 · The voice problem, and the sawmill dead end

The first instinct was the obvious one: if each figure needs a distinct voice, find
a text-to-speech engine that can *produce* distinct voices, and drive it directly.

The early exploration ranged across the whole TTS landscape — ElevenLabs (voice
design from prompts), Azure and Polly (SSML control), and the open-source frontier:
Parler-TTS, XTTS, StyleTTS2, Coqui, Fish Speech. Twenty per-figure **voice
profiles** were hand-authored — pitch, pace, cadence, accent, distinctive verbal
habits — grounded where possible in historical record. (A detail that stuck:
contemporaries described Lincoln's voice as high and reedy, not the deep boom of
legend — exactly the kind of sourced specificity the profiles aimed for.) A hybrid
**Logic Pro** audio workflow was sketched, imagining a future where generated
speech could be mastered and shaped.

Then came the attempt to *self-host* the synthesis — Parler-TTS running in a Colab
notebook — and it collapsed into what the logs forever after called **"sawmill
noise."** The model produced not speech but a grinding, mechanical roar. Days went
into debugging it. It never resolved.

> **The lesson of the sawmill was not "Parler is bad."** It was deeper: *trying to
> own the entire synthesis stack — generate, host, render, master — was the wrong
> shape for a non-developer building in the browser.* The failure was
> architectural, not technical. It cleared the ground for the idea that actually
> worked.

```
THE DEAD-END PATH (abandoned):
  text  ──►  self-hosted Parler-TTS (Colab)  ──►  "sawmill noise"
            │
            └─ owns: model weights, hosting, GPU, rendering, mastering
               result: brittle, opaque, unshippable from a web editor
```

---

## 2 · The paradigm shift — *Anthropic for thought, Gemini for voice*

Here is the hinge the entire project turns on. It is simple to state and was hard to
arrive at:

> **The brain composes the thought first, then speaks it.**
> Cognition and articulation are *different faculties*. Do not braid them into one
> tangled pipeline. Sequence them, each served by the model best suited to it.

So the architecture split cleanly in two:

- **Anthropic (Claude) is the mind.** It forms the thought — the figure's answer,
  the article, the dispatch. It reasons in the figure's persona. This is cognition.
- **Gemini is the voice.** It takes the formed thought and *renders it as speech*,
  with a chosen base voice and a directed delivery. This is articulation.
- **A single Cloudflare Worker is the nervous system** — one endpoint the whole site
  speaks to, routing each signal to the right faculty: cognition requests to
  Anthropic, voice requests to Gemini, with the two API keys held as Worker secrets.

This is the "dual paradigm." Not two Workers — **two faculties, one nervous
system.** The Worker is the spinal cord through which thought travels to become
speech. The moment the build stopped asking one system to both *think* and *speak*,
and instead let each faculty be itself, everything downstream became possible.

```
THE BREAKTHROUGH ARCHITECTURE:

   ┌─────────────────────────────────────────────────────────┐
   │                    THE SITE (browser)                    │
   │   Page1 terminal · Page2 tablet · Atlantica · Planet     │
   └───────────────────────────┬─────────────────────────────┘
                               │  every request goes to ONE place
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │          CLOUDFLARE WORKER  (the nervous system)         │
   │     amenti-proxy.ingram-ian.workers.dev                  │
   │     secrets: ANTHROPIC_API_KEY · GEMINI_KEY              │
   └──────────┬───────────────────────────────┬──────────────┘
              │ THOUGHT                        │ VOICE
              ▼                                ▼
     ┌──────────────────┐            ┌────────────────────┐
     │  ANTHROPIC/CLAUDE│            │   GEMINI TTS       │
     │  the mind        │            │   the voice        │
     │  forms meaning   │            │   renders speech   │
     └──────────────────┘            └────────────────────┘

   The brain receives content (Claude), then loads speech (Gemini).
```

Why this matters beyond elegance: it makes each half **independently improvable.**
The voice can get better without touching cognition. The publishing engine can grow
without touching the voice. They meet only at the Worker — a clean seam.

---

## 3 · Voice rendering — direction, not cloning

With Gemini as the voice faculty, a critical discovery followed — one that saved an
entire provider integration.

The fear had been that distinct per-figure voices would require **cloning**: a
separate trained or sampled voice per figure (the original reason Fish Speech was on
the table). But a live experiment proved otherwise. Gemini renders **convincing
accents and delivery from a natural-language STYLE direction alone**, layered over
one of its prebuilt base voices.

The proofs were unmistakable:
- **Caesar** — base voice `Charon` + *"commanding, clipped Roman general"* → a
  Roman general's cadence.
- **Highland Scottish** — base voice `Algenib` (gravelly) + *"strong, measured
  Highland Scottish accent, rolling the R's, grave and proud"* → a recognizably
  Scottish voice, rolled R's and all.

The verdict, in the builder's own word: *"great."*

> **The finding:** you do not need to *clone* a voice to give a figure a voice. You
> need to *direct* one. Gemini is an actor that takes stage direction. This collapses
> the hard problem (per-figure voice models) into an easy one (per-figure prose
> direction) — and prose is exactly what this project is made of.

```
VOICE COMPOSITION (the shape that works):

   base voice   =  map(gender)         → Charon (m) / Kore (f) / …
   style string =  register            → "Read slowly…" (recitation)
                 +  dialect (accent)    → "Highland Scottish, rolling R's"
                 +  voice  (manner)     → "grave, deliberate, thinks aloud"

   POST /speak  { text, style, voice }  →  Gemini  →  audio
```

Fish Speech was demoted from *required* to *optional later polish* — relevant only
if true per-figure **timbre** (not just accent) is ever wanted. The accent problem,
the one that seemed to need a whole provider, was solved with sentences.

---

## 4 · Amenti as Publisher — the generative content backbone

A library of legends needs *things for the legends to say* beyond live chat — daily
writings, a newspaper, a periodical. Rather than author this content by hand, Amenti
became a **publisher**: a generative engine that writes, caches, and serves.

The principle: **~99% AI-generated, no authored-content branch.** One unified engine.
Author + topic + register → Claude generates → cache in Cloudflare **KV** → serve
forever. Two publications ride the same engine, differing only by *register*:

- **The Daily Planet** — a clickable newsroom. Register: *journalistic.*
- **Atlantica** — a date-keyed daily periodical where a figure reflects in the first
  person. Register: *recitation.*

The addressing scheme was **locked** early and never broke:

```
KV ADDRESSING (locked):
   <publication>:<figure>:<slug>           e.g.  planet:lincoln:emancipation-memo
   atlantica:<figure>:<YYYY-MM-DD>          (daily essays, date-keyed)

WORKER ENDPOINTS (the publishing API):
   POST /v1/messages-style chat proxy    → Claude, in-figure
   POST /speak                           → Gemini TTS  { text, style, voice }
   GET  /article?key=…                   → read one cached article from KV
   POST /article/put                     → write an article to KV
   GET  /feed?details=1                  → newest-first records (date/name/headline/teaser)
   POST /article/generate               → Daily Planet: generate-once-cache-forever
   POST /atlantica/next                 → AI picks a fresh, unwritten topic
   POST /atlantica/daily                → date-keyed generate-on-read
```

A subtle but important property fell out of this design: **content lives separately
from display.** Articles sit in KV (and a backup `atlantica.json`); the pages only
*render* them. This became a genuine safety net — during the build, a page's
display code broke entirely while every article sat untouched and safe in the cloud
store. **You cannot lose the content by breaking the page.**

```
GENERATE-ONCE-CACHE-FOREVER:

   click a story ──► /article/generate ──► in KV already? ──► serve cached
                                              │ no
                                              ▼
                                     Claude writes it ──► store in KV ──► serve
                                     (every future reader gets the cache)
```

---

## 5 · The five-column identity schema

To give *every* figure a voice — not just the 22 hand-built marquee figures — the
roster itself had to carry voice data. The design decision was to add **five new
columns** to the roster, and to make them **granular now**, because *finer data can
always be coarsened later, but coarse data can never be re-refined.*

| column      | kind       | drives                          | example                       |
|-------------|------------|---------------------------------|-------------------------------|
| `Gender`    | structured | base TTS voice                  | `male` / `female` / `neutral` |
| `Dialect`   | direction  | accent in the STYLE string      | `Highland Scottish, rolling R's` |
| `Voice`     | direction  | manner/character in STYLE       | `grave, slow, thinks aloud`   |
| `Region`    | structured | coarse map zone / clustering    | `Central Asia`                |
| `Location`  | structured | fine place + accent nuance      | `Khentii Mountains, Mongolia` |

Plus the existing temporal axis (`Birth-Date`/`Death-Date` → era/year). Together
these give each figure a full identity record:

> **gender · dialect · voice · region · location · era**
> *(identity · accent · manner · place×2 · time)*

Two design choices deserve emphasis:

- **Dialect and Voice are kept separate on purpose.** Dialect is the *accent*
  ("Scottish"); Voice is the *manner* ("fiery" vs "melancholic"). Two figures can
  share a dialect and differ entirely in voice. Splitting them captures that nuance —
  which *is* the variety that is the magic.
- **Region and Location are the seed of a future map.** Voice is only the first
  consumer of this geographic data. Region (coarse) + Location (fine) + Era (time)
  lay the groundwork for a **place × time matrix** — maps, regional clustering,
  possibly rendered environments. The data was captured now, cleanly, even though
  only the voice uses it today. *Build the schema for where you're going, not just
  where you are.*

---

## 6 · Casting 1,102 figures

Five columns across eleven hundred figures is not hand-fillable. It had to be
generated. The first attempt was a **deterministic hash engine** — assign attributes
pseudo-randomly per name for maximum variety. It was rejected on sight: it produced
**Shakespeare as female, Dante with an Arabic dialect, Musk in Norman French.**
Random variety is not the same as *characterful* variety.

The correction was decisive: ***accuracy is not the goal, variety is — but the
caster must still know who these people are.*** Variety means a male English
playwright sounds like a male English playwright with a *distinctive* voice, not
like a randomly-shuffled stranger. So the casting was redone as **knowledge-based**:
each figure assigned their actual gender and cultural origin, with dialect and voice
chosen for character on that true foundation.

```
THE CASTING PASS:
   roster (1,102 names, rank-ordered) ──► 8 knowledge-based batches
   batch N  =  { rank: (gender, dialect, voice, region, location) }
   merge: original 7 cols + 5 new cols, by rank position
   output: names_with_voice.csv  (1,102 rows × 12 cols, zero blanks)

   DISTRIBUTIONS (variety, verified):
     gender:   929 male · 168 female · 5 neutral
     regions:  21 represented — North America (296) … The Beyond (3)
     neutral reserved deliberately for the cosmic/collective:
       Pangu, Tiamat, Loki, Satoshi Nakamoto, the Snyder couple
```

The roster is roughly rank-ordered by prominence, so the early batches — the gods,
then the giants (Newton, Einstein, Shakespeare, Genghis) — are the figures most
likely to be summoned. The deep tail (rank 900+) got the same care, but its
occasional looseness matters less; and every value lives in an editable sheet, to be
*refined at leisure.* Variety first; perfection optional and incremental.

---

## 7 · The migration — one file, two sources, no unification trap

The roster has two homes, and a hard-won decision was made **not** to merge them:

- **The Google Sheet** (published as CSV at `LEDGER_CSV_URL`) — the *live* source.
  **Both** Page1 and Page2 fetch from it. *Updating the Sheet updates both pages.*
- **`names.csv` in the repo** — a *fallback* only (Page1 uses it if the Sheet fails).

An earlier attempt to unify all pages onto a single CSV source had failed; rather
than reopen that wound, the build deliberately worked *with* the two-source reality.
The insight that made this safe: **the voice feature never required unification.** It
only required the new columns to exist *in the source the pages already read* — the
Sheet. So:

```
THE MIGRATION (one operation, no surgery):
   names_with_voice.csv
     ──► Google Sheet: File ▸ Import ▸ Replace current sheet
         (keeps the same gid, so the published-CSV URL stays valid;
          both pages pick up all 12 columns at once)
     ──► repo names.csv: replace file (keep filename) to sync the fallback

   VERIFIED LIVE: fetch(LEDGER_CSV_URL) header now returns
     Rank … Links, Gender, Dialect, Voice, Region, Location
```

This honored the builder's stated preference exactly: **one file, one paste, no
auditing.** Replace, import, done. Refine in the sheet later, cell by cell.

---

## 8 · Wiring voices across four surfaces — two loaders, one composition

Here the architecture's hidden complexity surfaced. Amenti speaks in **four places**,
and they are not built the same way:

| surface              | page  | loader / parser                                   |
|----------------------|-------|---------------------------------------------------|
| Terminal chat        | Page1 | custom `parseCSV` + `buildRoster` (`data-csv-loader`) |
| Tablet chat          | Page2 | **PapaParse** + a `SCHEMA` object + `normalizeRecord` |
| Atlantica reader     | both  | reads the KV feed; figure looked up by name       |
| Daily Planet         | Page1 | journalistic register reader *(composition pending)* |

Two *different* roster loaders had to learn to read the five new columns:

```
PAGE1 LOADER (custom parser):
   headerIndex():  add find('gender'|'sex'), find('dialect'|'accent'),
                   find('voice'|'manner'|'character'), find('region'|…),
                   find('location'|'place'|'birthplace'|'origin')
   buildRoster():  read each into the figure object
                   (region & voice were hardcoded '' before — now read live)

PAGE2 LOADER (PapaParse + SCHEMA):
   SCHEMA:           add gender/dialect/voice/region/location candidate arrays
   normalizeRecord:  pickField(rec, SCHEMA.x) into each record
   NOTE: records live at  Sovereign.Angels.Michael.records  (a deep namespace,
         not Sovereign.Michael — a real gotcha when debugging)
```

Both verified live: **Genghis Khan → male · "Mongolian, steppe-hardened" · Central
Asia · Khentii Mountains** — on both pages.

Then the **composition** itself — the function that turns a figure's data into a
Gemini request — was wired into each speaking surface:

```
amentiVoiceForGender(gender):  male→'Charon'  female→'Kore'  else→'Kore'
composed style = register + ". Accent: " + dialect + ". Voice character: " + voice

  Page1 terminal      ✓ composeStyle(figureKey) reads the figure's voice field
  Page2 tablet chat   ✓ composeFor(record) + passes Sovereign.State.activeRecord
  Page2 Atlantica     ✓ finds figure by name in the roster, composes recitation
  Page1 Atlantica band✓ speakDispatch(text, btn, figureName) + _amentiBaseVoice
  Daily Planet        ◻ pending (same pattern, awaiting the next build)
```

**One discovery worth recording:** a handful of figures are *hand-curated inline*
(the 22, plus a few more like **Charles Martel**, who carries a hand-written voice
and `region: "Francia"`). These **win on merge** over the CSV — so the CSV cannot set
their gender; they need it added inline, or a fallback. The CSV figures, by contrast,
are fully correct (proven). This is the kind of thing you only learn by wiring the
real system: *the merge order is itself part of the data model.*

---

## 9 · Economics — free tier to paid, and what it costs to speak

A wall appeared mid-build: Gemini TTS started returning **HTTP 429 — quota
exceeded.** The diagnosis was specific and instructive:

```
  "Quota exceeded for metric:
   generativelanguage.googleapis.com/generate_content_free_tier_requests,
   limit: 10, model: gemini-2.5-flash-tts
   Please retry in 57.8s."
```

The **free tier caps TTS at ~10 requests per minute.** Fine for a solo test, fatal
for a live site where every spoken reply is a request. Worse, *testing itself*
consumed the quota — each attempt reset the window, so heavy testing stayed
perpetually throttled.

The fix is **billing → Tier 1**, and the economics are worth stating plainly:

| | Free tier | Paid Tier 1 |
|---|---|---|
| TTS rate | ~10 req/min | ~300–1,000 req/min |
| Free→Tier 1 | — | **instant** on enabling billing |
| The catch | — | **the free allowance disappears entirely** — all usage metered from the first token |

Two honest cautions, recorded for launch:
- **Once billing is on, the free tier is gone** — every request is billed (for TTS,
  tiny per clip, but no longer free). Set a **Google Cloud budget cap** so a runaway
  loop cannot surprise the account.
- Gemini powers **voice only** (Claude/articles are Anthropic, billed separately), so
  the metered exposure here is small — but real.

> **The broader lesson:** voice on a free tier *cannot survive launch.* A site that
> speaks needs paid throughput by design. This is not a bug to fix later; it is a
> line item in the architecture.

---

## 10 · The timeout, and the chunked-streaming pipeline

The final hurdle of these 48 hours, and the one that proves the organizing
principle. With composition working, a **long-form** read-aloud — a full Atlantica
dispatch — failed with **HTTP 524 (Cloudflare Worker timeout).** Short text returned
200 and read in the correct composed voice; the *essay* timed out.

The cause: a single `/speak` call generating audio for an entire essay exceeds
Cloudflare's ~100-second Worker limit. **The composition was fine. The length was
the problem.** And it affects *every* long-form surface (Atlantica, Daily Planet) —
while short chat replies already work, because they're short.

The instinct to reach for "streaming" was correct, and the builder named the truth
of it precisely:

> **Streaming and chunking are not competing options.** The data comes in streams
> *and* chunks — a stream **is** delivered as chunks. The application must handle
> both, and it can.

This is the *same principle as the whole project, one layer down.* The brain does not
wait to finish forming an entire thought before it begins to speak; it voices the
first clause while still composing the next. **Speech is streamed because thought is
chunked.** So the next build is one pipeline, not a choice:

```
THE CHUNKED-STREAMING PLAYBACK PIPELINE (next build):

   1. split text  ──►  [chunk] [chunk] [chunk] …   (sentences / paragraphs)
   2. each chunk  ──►  fast /speak call  (small → under the timeout, by design)
   3. audio buffers return ──► QUEUE ──► play in order, gap-free, as they arrive

   first chunk plays almost immediately   → the "streaming" feel
   later chunks generate in the background → no timeout, ever

   Scope: mostly FRONT-END (a playback helper; the Worker /speak stays as-is).
   Web Audio API for gap-free buffer sequencing. Handle: user clicks away
   mid-playback (cancel the queue), button state, pausing prior audio.
   One build unblocks ALL long-form read-aloud at once.
```

This is where the build paused — at a clean, well-understood boundary. Not a mystery;
a known pipeline, scoped and waiting.

---

## 11 · Lessons, and a few honest reflections on 48 hours

Some of these are technical; some are about how the work *felt*, because the builder
asked for candor and earned it.

**On workflow — the cost of fragment surgery.** For a long stretch, edits were made
by having the builder hunt for lines, paste snippets, and splice changes by hand
under direction. It caused break after break — dropped `}catch{}` blocks, doubled
`<script>` tags, an apostrophe escaped one time too many. It was exhausting, and it
was the wrong method. The right method — which we finally switched to — is
**whole-file handback**: pull the live file, apply edits by exact-match in a script,
syntax-check the whole thing, hand back the complete file to paste once. *For a
non-developer in a web editor, the unit of safe change is the file, not the line.*
This should have been the rule from the first hour. It is the rule now.

**On content/display separation as a safety net.** Because articles live in KV and
backups, a fully broken page never once destroyed content. This is worth designing
for deliberately: **keep the valuable, hard-to-regenerate data in a store the
display code cannot corrupt.** A broken page is an afternoon; lost content is a
catastrophe. The architecture made the catastrophe impossible.

**On the silently-reverting model name.** A recurring gremlin: the Gemini TTS model
string must be exactly `gemini-2.5-flash-preview-tts` — the word "preview" matters,
and the plain name 404s. Regenerating the Worker from a stale base silently reverted
it more than once, each time breaking voice. *Some configuration values are
load-bearing and invisible; pin them, and re-verify after every deploy.*

**On the maxim that held.** *"Variety is the magic, not accuracy"* turned out to be
not a shortcut but a genuine design philosophy. It freed the casting (generate
boldly, refine later), it justified the granular schema (capture nuance), and it
matched the product (a vivid library, not a reference database). When a maxim keeps
*resolving* decisions cleanly across very different problems, it is load-bearing.
This one was.

**A reflection on the arc itself.** Across these 48 hours the project crossed from
*can it even speak?* (the sawmill) to *it speaks in eleven hundred distinct voices,
on four surfaces, drawn from a live roster, brokered by a single nervous system.*
The turning point was not a clever trick. It was a *correct model* — let the mind be
the mind and the voice be the voice, and sequence them the way a brain does. Almost
every good decision afterward was that same principle applied again: separate the
faculties (Anthropic/Gemini), separate content from display (KV/pages), separate
data from refinement (generate now/edit later), separate accent from manner
(dialect/voice), and finally separate the thought from its delivery in *time*
(chunked-streaming). The whole system is one idea, repeated at every scale:
**form the meaning, then give it voice.**

**A closing, honest note.** This was a marathon, and the builder felt it — and was
right to flag where the process wore them down. The work is genuinely substantial:
a complete generative publisher, a proven voice-direction method, an eleven-hundred-
figure identity matrix, voice composition live on the core surfaces, paid throughput
secured, and the last hurdle reduced to a scoped, well-understood build. That is a
great deal of real ground. It is also a good place to rest — the library thinks, and
it has very nearly found its full voice.

---

## 12 · Open threads & roadmap

1. **Chunked-streaming playback pipeline** *(next, highest value)* — split → generate
   per chunk → queue → play gap-free. Unblocks all long-form read-aloud at once.
   Mostly front-end; Worker `/speak` stays as-is.
2. **Daily Planet composition** — wire per-figure voice into the Page1 newsroom
   reader (same pattern as the others); plays correctly once the pipeline lands.
3. **Curated-figure gender** — add `gender` to the few hand-curated inline figures
   that override the CSV (e.g. Charles Martel); CSV figures are already correct.
4. **Refine the matrix at leisure** — the roster is a live editable sheet; tune any
   figure's voice cell by cell over time.
5. **The place × time map** — the Region/Location/Era data was captured for this:
   maps, regional clustering, possibly rendered environments.
6. **Fish Speech (optional)** — only if true per-figure *timbre* (beyond accent) is
   ever wanted, layered atop the Gemini direction.
7. **Budget cap** — set a Google Cloud spend cap now that Gemini billing is live.

---

## Technical Glossary

**Amenti.live** — the project: an AI "Library of Legends" where historical figures
answer in the first person, increasingly in their own voice.

**Anthropic / Claude** — the *cognition* faculty. Forms the thought: in-figure chat
replies, articles, dispatches. "The mind."

**Gemini TTS** — the *voice* faculty. Renders formed text as speech with a base voice
and directed delivery. Model string (load-bearing): `gemini-2.5-flash-preview-tts`.
"The voice."

**Cloudflare Worker** — the single proxy endpoint the whole site calls
(`amenti-proxy.ingram-ian.workers.dev`); routes thought→Anthropic and voice→Gemini.
Holds `ANTHROPIC_API_KEY` and `GEMINI_KEY` as secrets. "The nervous system."

**KV (Cloudflare KV)** — the key-value store for generated content (`env.ARTICLES`,
namespace `amenti-articles`). Keys: `<publication>:<figure>:<slug>` and
`atlantica:<figure>:<YYYY-MM-DD>`.

**The Publisher** — Amenti's generative content engine: ~99% AI-generated,
generate-once-cache-forever. Two publications, one engine, differing by register.

**Daily Planet** — the clickable newsroom publication. Register: *journalistic.*

**Atlantica** — the date-keyed daily periodical; a figure reflects in first person.
Register: *recitation.*

**Register** — the surface-level delivery mode of generated text (journalistic vs
recitation vs dialogue). The base layer of a composed voice style.

**STYLE / style string** — the natural-language delivery direction sent to Gemini:
`register + accent (dialect) + manner (voice)`. The mechanism by which accents are
*directed* rather than *cloned*.

**Base voice** — one of ~30 Gemini prebuilt voices selected by gender
(`amentiVoiceForGender`: male→Charon, female→Kore, neutral→Kore). The timbre the
STYLE is applied over.

**The five-column schema** — `Gender`, `Dialect`, `Voice`, `Region`, `Location`,
added to the roster to give every figure a voice + identity record. With era, the
full axis is *gender · dialect · voice · region · location · time.*

**Dialect vs Voice (the distinction)** — Dialect = accent ("Highland Scottish");
Voice = manner ("grave, thinks aloud"). Kept separate deliberately, for variety.

**Casting** — the knowledge-based assignment of the five attributes to all 1,102
figures (8 batches → `names_with_voice.csv`). Replaced a rejected hash engine that
produced wrong genders/origins.

**LEDGER_CSV_URL** — the published Google-Sheet CSV that is the *live* roster source
for both pages (in `config.js`). `names.csv` in the repo is a fallback only.

**The two loaders** — Page1: custom `parseCSV`/`buildRoster` (the `data-csv-loader`
block). Page2: PapaParse + `SCHEMA` + `normalizeRecord` (records at
`Sovereign.Angels.Michael.records`).

**Composition** — turning a figure's row into a Gemini request: base voice from
gender + style from register/dialect/voice. Wired on Page1 terminal, Page2 chat, both
Atlantica readers (Daily Planet pending).

**Curated-override** — the ~22+ hand-built inline figures (incl. Charles Martel) that
win over the CSV on merge; they need gender set inline.

**Variety is the magic, not accuracy** — the guiding maxim. A vivid, varied library
beats a precise-but-flat database; precision can be refined later, variety is the
point.

**Free tier / Tier 1** — Gemini billing tiers. Free ≈10 TTS req/min (unusable at
launch); Tier 1 ≈300–1,000 req/min (instant on enabling billing; the free allowance
then disappears — all usage metered). Set a budget cap.

**HTTP 429** — rate-limit error (free-tier quota exceeded). The wall that forced the
move to paid.

**HTTP 524** — Cloudflare Worker timeout. Long-form `/speak` exceeds ~100s in a
single call. The hurdle the chunked-streaming pipeline solves.

**Chunked-streaming pipeline** — the unified next build: split text → generate audio
per chunk (each under the timeout) → queue and play gap-free as they arrive.
Streaming *is* chunked delivery. Mostly front-end.

**The sawmill** — the abandoned self-hosted Parler-TTS/Colab attempt that produced
mechanical noise instead of speech. The dead end that justified the
Anthropic-for-thought/Gemini-for-voice pivot.

**Fish Speech** — an optional future TTS for per-figure *timbre*; demoted to "later
polish" once Gemini direction proved sufficient for accents.

**The organizing principle** — *the brain receives content, then loads speech.*
Cognition and articulation are distinct faculties, sequenced. The whole architecture
is this one idea repeated at every scale.

---

*End of field journal. Written at the close of a 48-hour build —
the library thinks, and has very nearly found its voice.*
