# SPEECH.md — THE SPEECH AND AUDIO MANUAL
**Ingram Manor LLC · Amenti.live · 28 August 2026**

Everything about voice out, voice in, the dial, the cost and the cache, in one
place — because seven briefs describe this system and **every one of them is
correct only about the day it was written.**

> **EVERY CONSTANT IN THIS DOCUMENT WAS READ FROM
> `amenti-core.bundle.js` AND `amenti-dial.js` AS DEPLOYED ON 28 AUG 2026.**
> None of them is remembered. Where a number here disagrees with the code, the
> code is right and this file has rotted — regenerate it by reading, the way it
> was written.

---

## 0 · THE ONE-PAGE ANSWER

| you want to know | it is in |
|---|---|
| how a figure's voice is chosen | §2 · the roster |
| why a figure sounded wrong | §2.4 · the failure modes |
| what a spoken turn costs | §7 |
| why the archive must not be touched | §4 · the cache key |
| what the dial does and when | §5 |
| how the microphone decides you have finished | §6 |
| why the counsel is never cached | §3 · two registers |
| what to do before changing any of it | §9 · the standing orders |

**And the one thing to carry above all others:**

> **THE CACHE KEY IS `sha256(TTS_MODEL + voice + STYLE + TEXT)`.**
> The style string and the chunk boundaries ARE the cache key. Move a byte of
> either and **every clip already rendered becomes an orphan and is re-billed.**

---

## 1 · THE SHAPE OF IT

Two directions, one engine each, and a third thing that covers the gap between
them.

```
   VOICE OUT ─── amenti-voice.js ──► POST /speak ──► Gemini TTS ──► R2 archive
                 chunk · style · cache

   VOICE IN  ─── amenti-listen.js ─► POST /listen ─► transcript
                 VAD · WAV 16k · the channel

   THE GAP   ─── amenti-dial.js ───► announcement · tone · ring
                 covers the render wait, ends on the first word
```

All of it is inside **`amenti-core.bundle.js`**, which the page loads. The loose
files are the sources.

> **REBUILD THE BUNDLE IF YOU EDIT ANY SOURCE.** The page does not load
> `amenti-voice.js`. On 28 Aug three registers and a voice fix were written,
> tested and pushed as loose files and **none of them ran**, because the bundle
> was not rebuilt. *Being loaded is not being used.*

---

## 2 · WHERE A VOICE COMES FROM

### 2.1 · The roster is the source

Every figure's voice is assembled from **three columns of `names.csv`**, which
is also published as a Google Sheet:

| column | does |
|---|---|
| **Gender** | picks the ENGINE VOICE — `Charon` (male) or `Kore` (female) |
| **Dialect** | becomes *"Accent and dialect: …"* |
| **Voice** | becomes *"Voice character: …"* |

Nothing else in the sheet reaches the voice. `Title`, `Biography`, `Region` and
the rest are read by `Page1.html` for the roster and the dossier; the voice
module never sees them.

> **⚠ `Accent` IS NOT A SPEECH ACCENT.** It is a hex colour — `#f0c030` for
> Caesar. The speech accent is `Dialect`. Anyone "fixing" the voice code to read
> `Accent` will send a colour code to the TTS engine.

### 2.2 · What gets sent

Two registers compose differently. Both start from the figure's row.

**RECITAL** — the archive. `composeStyle()`. **LOCKED.**

```
Read clearly, in a measured, dignified tone.
  Accent and dialect: <Dialect>.
  Voice character: <Voice>.
  Speak at a brisk, lively, natural pace, as a person speaking
  energetically — not slow or ponderous
```

**CONVERSATIONAL** — the counsel. `composeConversational()`. Free to vary.

```
Say the following in a clear, natural, conversational voice.
  Accent and dialect: <Dialect>.
  Voice character: <Voice>.
  <pace direction>
  <the move's register, if declared>
```

So Abraham Lincoln, fully resolved:

> voice `Charon` · *"…Accent and dialect: American Midwestern frontier. Voice
> character: plain and grave…"*

Lincoln and Caesar are the **same engine voice**, made distinct by dialect and
character. That is the design, not a limitation.

### 2.3 · How the roster is loaded

**LOCAL FIRST, THE SHEET SECOND.**

```
  fetchCsv('./names.csv')          committed beside the code — cannot fail
                                   for a network reason
        ↓ then, in the background
  fetchCsv(LEDGER_CSV_URL)         the Google Sheet — the ledger the captain
                                   edits. Wins when it answers.
                                   ITS FAILURE NEVER TAKES THE LOCAL DOWN.
```

The roster is fetched **once per page load** and memoised in `rosterPromise`.

### 2.4 · THE FAILURE MODES, AND WHAT EACH SOUNDS LIKE

This is the section to read when a figure sounds wrong.

| the console says | the cause | what a listener hears |
|---|---|---|
| *(nothing)* | resolved | the figure, as written |
| `NO GENDER RESOLVED for "X"` | that row has a blank `Gender` | X in the default voice |
| `the sheet did not answer` | ledger unreachable, local stands | correct — this is a warning, not a fault |
| `THE ROSTER DID NOT LOAD` | **both** sources failed | **every figure in the default voice** |

**AND THE DEFAULT IS `Kore` — A FEMALE VOICE.**

That is the trap this whole section exists for. On 28 Aug the ledger fetch threw
`Load failed` and the module had no local fallback, so **Abraham Lincoln spoke in
a woman's voice** — and it looked exactly like a deliberate casting choice.
There was one `console.warn` and nobody was watching it.

> **A FALLBACK THAT LOOKS LIKE A CHOICE IS THE SILENT SIGNATURE.**
> The warnings above exist so that can never happen quietly again. An empty
> roster is not a degraded reading — it is **every figure losing their voice at
> once**, and it now reads that way.

**Do not "fix" a wrong voice by changing the lookup.** A surname fallback was
written on 28 Aug and removed before it shipped: the voice is in the cache key,
so changing which voice a name resolves to orphans every clip already rendered
for it. The lookup is `map[name.toLowerCase().trim()]` and stays that way until
a real mismatch is found and priced.

---

## 3 · THE TWO REGISTERS, AND WHY THEY MUST NOT MIX

|  | RECITAL | CONVERSATIONAL |
|---|---|---|
| where | reading rooms, dispatches, the podcast | the terminal, the counsel |
| text | fixed | **unique every turn** |
| cache | **hits, potentially forever** | **NEVER hits** |
| boundaries | ARE the cache key — locked | free to move |
| per-move tone | **forbidden** | free |

**THIS IS THE MOST-MISSED FACT IN THE SYSTEM.** `amenti-voice.js` states it
outright: the counsel's text is unique every turn and never hits the archive;
the recital's boundaries are the cache key.

Two consequences, both load-bearing:

**A spoken conversation pays full price on every turn.** There is no hit rate to
hope for. Any cost model that assumes the archive covers conversation is wrong —
one did, and reached the investment memorandum before it was caught.

**The instrument panel is free here and forbidden there.** The six registers —
warm, cool, sharp, grave, danger, humour — vary the conversational style at no
cost because nothing is cached. Applied to the recital they would fork the
archive.

The registers live in **`amenti-doctrine.js`. ONE COPY.** `amenti-voice.js`
carries a fallback for a surface that has not loaded the doctrine; that fallback
is not a second source.

---

## 4 · THE CACHE KEY — THE ONE THING THAT COSTS MONEY TO GET WRONG

```
    audioKey = sha256( TTS_MODEL + voice + STYLE + TEXT )
```

`TEXT` is in the key, so **the chunk boundaries are the key.** A 320-char chunk
and a 700-char chunk of the same passage hash differently and share nothing.

### The locked values

| constant | value | what it governs |
|---|---|---|
| `CHUNK_MAX` | **320** | the recital chunker. **LOCKED.** |
| `PROFILES.recital` | 320 | reading rooms, Page1, the existing archive |
| `PROFILES.gabriel` | 700 | Page2's deployed boundary |
| `PROFILES.counsel` | 320 | the conversational base |
| `CONV_FIRST_MAX` | **110** | the fast opening measure — conversational ONLY |
| `VOICE_REGISTER` | *"Read clearly, in a measured, dignified tone"* | in the style string, in the key |
| `PACE_DIRECTION` | *"Speak at a brisk, lively…"* | in the style string, in the key |

### `gabriel: 700` IS A DELIBERATE FORK. DO NOT UNIFY IT.

It reads, to a fresh session, like an inconsistency somebody forgot to clean up.
It is not. It is Page2's deployed boundary, and unifying it **re-renders Page2's
entire archive and re-bills it.** The captain ruled: keep the fork.

> **A DELIBERATE FORK THAT IS NOT DECLARED LOOKS EXACTLY LIKE A BUG.**
> The throttle, the stowaway `AMENTI_VOICE`, and `gabriel:700` are three
> instances of one error: a machine read the code, could not see the intent, and
> concluded the intent was absent. **The code cannot tell you the intent.**

### The guards

`probe7` and `probe17` prove `composeStyle`, `chunkText` and `plainText` are
byte-identical across engines. **ARCHIVE WATCH** (`probes/probe-watches.mjs`)
fires a frozen 933-char passage — sha `27e9c5af`, LOCKED — through six wires
every six hours. Six hits means the model string, the voice, the style and both
chunkers are unchanged.

**The miss pattern is the diagnosis:** all six → the model or the register; the
four 320s → the recital chunker; the two 700s → Page2; one measure →
`splitSentences` or `plainText`.

**Do not edit `amenti-canonical.js`. Not one byte. The hash is the lock.**

---

## 5 · THE DIAL — COVERING THE GAP

### Why it exists

Measured on the live Worker, 16 July 2026:

```
   MISS   median 6,103 ms   (min 4,348 / max 12,733)   a fresh utterance
   HIT    median 1,936 ms   (min   865 / max  3,705)   served from R2
   3.2×   the measured cache speedup
```

And from `probe20`, on live hardware:

```
   render_ms = 7510 + 18.25 × chars        (R2 miss, one measure)
```

**The floor is 7.5 seconds** — the irreducible cost of any render, at any
length. A 110-char opener is ~9.5s; a 320-char one is ~13.0s. That is why
`CONV_FIRST_MAX` exists.

Six seconds of silence after somebody presses a button is the longest wait in
the product. **The dial is what fills it.**

### The sequence

```
   ANNOUNCEMENT   "Amenti Interface"      spoken through the hall's own voice
        ↓
   TONE           950 Hz, 0.18s, then a 0.35s gap
        ↓
   RING           440 + 480 Hz together, 2.0s on, 4.0s off, repeating
        ↓
   ANSWERED       on `amenti:voice-started` — the figure's FIRST SOUND
```

Backstop: `MAX_RING` **30,000 ms**. A ring with nothing to answer it is worse
than no ring, so it says when it gives up.

### THE GREETING IS THE ANSWER. THE DIAL PLACES IT.

Pass `onRinging` to `place()` and the dial fires the greeting at the moment the
line starts ringing:

```js
AmentiDial.place({ onRinging: greet });    // not place(); greet();
```

Page1 used to call them on two consecutive lines with nothing between, and
**both played at once** — the hall announcing itself over the figure already
answering. The engine's own `stopReading()` does not arbitrate it either,
because each call waits on `resolveVoice()` before it schedules: both resolve,
both schedule onto the AudioContext, both sound.

The hook is optional. Without it the dial simply rings unanswered and times
out, which is the correct behaviour for a page that has no greeting to give.

### Two things that are easy to get wrong

**It ends on `amenti:voice-started`, not on `isSpeaking()`.** The player object
is created *before* the fetch, so `isSpeaking()` is already true throughout the
entire wait the dial exists to cover. The event fires at the instant the first
audio buffer is scheduled.

**THE AUDIO CONTEXT MUST BE RESUMED.** Browsers create an `AudioContext`
**suspended** and keep it that way until a user gesture resumes it. Notes
scheduled into a suspended context **do not play, do not queue, and do not
throw** — `osc.start()` succeeds and no sound is made.

That was live on 28 Aug: the announcement was audible because the TTS engine has
its own resumed context; the dial's was brand new and asleep. `ac.currentTime`
does not advance while suspended, so the schedule must be built **after** the
resume settles, never before.

> **A NOTE THAT IS SCHEDULED AND SILENT IS THE HARDEST KIND OF FAULT: IT LOOKS
> EXACTLY LIKE SUCCESS FROM THE INSIDE.**

---

## 6 · VOICE IN — THE EAR

`amenti-listen.js`. Captures PCM, encodes WAV **16 kHz mono**, POSTs to
`/listen`. One microphone at a time, so it is a singleton.

### The dials

| constant | value | means |
|---|---|---|
| `VAD_RMS` | 0.020 | energy floor that counts as speech |
| `VAD_RMS_ECHO` | 0.045 | higher bar while the figure is audible |
| `VAD_ONSET` | 3 frames (~250 ms) | they ARE speaking |
| `VAD_SILENCE` | 1,200 ms | they have finished |
| `PREROLL` | 5 frames (~450 ms) | kept before onset, so the first syllable survives |
| `IDLE_MS` | 45,000 | nothing said → nobody is there → close |
| `SESSION_MS` | 300,000 | **hard ceiling. One turn is not five minutes.** |
| `TARGET_RATE` | 16,000 Hz | mono, speech-grade |
| `MIN_SECONDS` | 0.25 | ignore sub-quarter-second blips |

> **A MICROPHONE THAT NEVER CLOSES ITSELF IS A BUG WEARING A FEATURE'S COAT.**
> Both ceilings are non-negotiable. The idle check applies to **both doors** —
> push-to-talk opens the mic in recording mode, and before that was fixed, a
> tap-and-walk-away left the microphone open for five minutes.

### The channel — hearing the room before paying for it

```
  SNR_CLEAN   3.0     speech peak : noise floor
  NOISE_LOUD  0.018   a room that is simply loud
```

The RMS is computed every frame anyway, so the noise floor is free. Which means
the system can know a transcript will be mush **before it pays for it** —
otherwise one bad room costs a `/listen`, a completion, and a confused reply,
and then blames the seeker for it.

**A low SNR alone does not condemn the channel.** A shout in a silent room has
floor == peak and an SNR of 1, and there is nothing wrong with it. The room must
*actually be loud* before it is blamed.

### The room

Loud frames plus an empty transcript is **not a failure. It is a dog.** Or a
door, or a child.

> **ACKNOWLEDGE WHAT ANNOUNCES ITSELF. NEVER INVESTIGATE WHAT DOES NOT.**

A bark announces itself: *"Something is with you there. A dog, I would guess — am
I wrong?"* A faint voice in another room did not: *"who else is there?"* is the
exact moment hospitality becomes surveillance.

**NOTICE, DO NOT RECORD.** Overheard words are never written to the transcript.
Using it to be better counsel this hour is care; storing it is a dossier.

### Partials

`SpeechRecognition` streams interim results live, free, on Chrome and Edge. It
runs **alongside** the WAV capture — Gemini still produces the real transcript.
The partials exist so the Arrest can land *while somebody is still speaking*.
Absent that API the Arrest does not exist and nothing breaks.

---

## 7 · WHAT IT COSTS

Google bills Gemini 2.5 Flash TTS at **25 audio tokens per second of audio**, so
the driver is **duration, not characters**. The conversion is measured, not
assumed — `probe20` on live hardware: **C characters play for roughly C/15
seconds.**

```
   $10.00 per million audio tokens  +  $0.50 per million input
   ────────────────────────────────────────────────────────────
   ≈ $16.79 per million characters rendered

   a 400-char reply    26.7s of audio     $0.0067
   per spoken turn     text $0.0138 + voice $0.0067 = $0.0205
   an hour typing      $1.85       an hour talking   $3.69
```

**Voice is about a third of a spoken hour, not a multiple.**

And the breaker: `DAILY_SPEAK_CHARS` 3,000,000 ≈ **$50 a day, about 56 hours of
audio.** It is separate from the text breaker.

Fuller working: `Amenti_What_An_Hour_Costs.html`.

---

## 8 · WHERE THE VOICE PATHS ARE, AND WHICH IS WHICH

The engines were four; they are now one on Page1 and two on Page2.

**PAGE 1 — unified.** Recitation, chat, Atlantica and the daily reader all route
through `Amenti.throttle.speak` → chunk 320 → streams. One chunker, one strip,
one style composition, one shared cache. **There is no pipeline to switch
between.**

**PAGE 2 — two pipelines, bridged.** `AmentiAudio` (700, streams) for long-form;
`Sovereign.Voice` for chat, which now **auto-switches by reply length** —
over `STREAM_THRESHOLD: 700` it routes to the streaming pipeline, under it takes
the single-shot path. It keys off the text rather than a mode label, because the
reading room devolves from recitation into chat and a mode label drifts.

Page2 still has two chunk sizes and two cache namespaces. Unifying it onto the
throttle is the thorough fix and **has a bill attached** — see §4.

### Streaming, and the one thing that does not

**Voice playback already streams.** `CHUNK_LOOKAHEAD = 2` fetches up to three
measures at once and schedules them gaplessly; the listener hears measure one
while later measures are still rendering.

**The text-to-voice handoff does not.** Chat waits for the *entire* LLM reply
before handing it to the voice engine, so the two halves run back to back rather
than overlapping. That is the largest remaining latency win — and it is
entangled with the turn state machine, the `_expecting` flag and the mic gate, so
it is a refactor of the conversation turn, not a change to a speak call.

### Timeouts

| constant | value |
|---|---|
| `CHUNK_TIMEOUT` | 60,000 ms per measure |
| `START_TIMEOUT` | 40,000 ms to first sound, then offer Retry |

### The cadence

The text's own punctuation is its score:

```
  REST_SOFT      0.16s   after , ; : — -
  REST_SENTENCE  0.38s   after . ! ?
  REST_PARA      0.85s   end of paragraph
```

---

## 9 · THE STANDING ORDERS

**THE MECHANISM SHOULD BE HARD TO CHANGE. THE JUDGMENT SHOULD BE TRIVIAL TO
CHANGE.** Chunking, cache keys, streaming and state machines are engineering, and
getting them wrong costs money. Registers, moves and dials are the product, and
they will be wrong until real people have taught us.

**MECHANISM AND JUDGMENT ARE DIFFERENT SUBSTANCES.** Consolidate one and you
will scatter the other — unless you name the boundary first. The register table
was filed as machinery once, and went into two files when the machinery
consolidated.

**REBUILD THE BUNDLE.** The page loads `amenti-core.bundle.js`. Editing a source
and pushing it changes nothing.

**BEING LOADED IS NOT BEING USED.** A module can be present, correct, versioned
and tested by three hundred assertions — and connected to nothing.

**A TEST THAT CREATES ITS OWN OBJECT TESTS THE OBJECT.** It does not test the
system. Fourteen harnesses reported green while the Terminal ran an inline
fallback.

**PROVE IT ON GLASS.** The last step is never a passing test. It is a live probe
against the deployed path, confirming the number moved and the sound was heard.

**THE FIGURE WILL NOT REPLY TO ITS OWN VOICE.** The loop-breaker is not
optional: the figure hears itself through the speakers, the transcription is
paid for, the completion is paid for, and it answers itself. All night. It is
precisely the curl attack, except the attacker is the product.

**THE MICROPHONE IS NOT A KEYBOARD.** A keyboard is deliberate. A microphone is
ambient, and the seeker does not choose what is in the room. It is the only
untrusted input path in the fleet.

**THE FIRST SENTENCE SURVIVES.** Nothing sharp until they have crossed. Barge-in
must never cut the figure off mid-word on the first line anyone ever hears.

---

## 10 · WHAT IS STILL OPEN

- **The text handoff does not stream.** §8. The biggest remaining latency win,
  gated on whether the completion API offers a streaming variant.
- **Page2 is not unified onto the throttle.** §8. Two caches where there could
  be one.
- **Pre-warming common opening measures** would make the first measure of a
  reply almost always a cache hit. Lowest effort of the three known fixes; not
  built.
- **`/listen` is metered in bytes and not yet priced.** A voice conversation is
  billed on both legs and only one is costed.
- **The real archive hit rate.** Metered from 28 Aug on both sides. Needs
  traffic behind it before it means anything.

---

## 11 · THE FILES

| file | is |
|---|---|
| `amenti-core.bundle.js` | **what the page loads.** Five files, one round trip. |
| `amenti-voice.js` | voice OUT — chunker, style, cache, the roster |
| `amenti-listen.js` | voice IN — VAD, WAV, the channel, the room |
| `amenti-dial.js` | the call sequence. Depends on nothing in the bundle. |
| `amenti-doctrine.js` | the REGISTERS. One copy. Both speakers read it. |
| `amenti-canonical.js` | the frozen passage. **Do not edit. The hash is the lock.** |
| `names.csv` | the roster, local copy — Gender, Dialect, Voice |
| `probes/probe-watches.mjs` | ARCHIVE WATCH — fires the canonical passage |
| `VOICE.json` | the reading, written by `probes/probe-voice.mjs` |

**And the briefs, in the order worth reading them:**

`AMENTI-SPEECH-DOCTRINE.html` — the judgment, and the boundary it turns on.
`Amenti_Latency_Rundown.html` — measured, and where the time goes.
`Amenti_The_Voice_That_Carries.html` — metering, chunking, the archive.
`Amenti_ReadingRoom_Chat_VoicePath.html` — the three paths and the auto-switch.
`Amenti_What_An_Hour_Costs.html` — both halves of the bill, charted.

---

*Written 28 Aug 2026 by reading the deployed bundle, not by remembering it.
It exists because seven briefs describe this system and each is correct only
about its own day. When this one goes stale, regenerate it the same way.*
