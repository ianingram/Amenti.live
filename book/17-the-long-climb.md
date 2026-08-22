> **A NOTE ON THIS CHAPTER.**
>
> Written and typeset before the Siege — the account of how a voice that
> stuttered became a voice that sings, and of the descent into the black heart
> of Page 2. It is prose throughout and carries no apparatus, because at the
> time of writing there was almost nothing yet that could be read.
>
> Its last section is a handover written for whoever came next. That person
> turned out to be the same person, seven weeks later, and the three laws at
> the end are still in force.

# THE BOOK OF AMENTI
## The Long Climb

*How a voice that stuttered became a voice that sings — and how we reached the black heart of Page 2 and freed the Amenti soul from frame-rate collapse.*

**amenti.live · author Ian Ingram** · the arc from the chunking dilemma to the helix rescue

---

## Invocation · What the Halls Hold

In the old belief, Amenti was the hidden hall where the soul was brought to be weighed — its heart set against a feather, its fate decided by what the scales revealed. This Amenti is a library. A thousand figures of history and myth wait inside it, each able to answer in the first person, in a voice composed to be its own.

To give a thousand souls a voice is not one problem but a chain of them — and each link, struck wrong, is silence. This is the chronicle of that chain: how the voice learned to stream without stalling, how two pages learned to speak as one, how guardians were set at the gates, and how, at the last, we descended into the black heart of the second page — where the soul of the library was drawn as a turning helix, and where it had begun to die.

What follows is told as a story, because the decisions only make sense as a story — each one shaped by the one before it. But it is also a true map. Whoever inherits this work inherits not just the code but the reasoning: what was tried, what failed, what the measurements actually said when our instincts were wrong. The maps — the files, the state of play, the principles — wait at the end, past the climb.

---

### Two days back
## I · The Chunking Dilemma

It began with a voice that stalled. The figures speak through a chunked-streaming pipeline — the throttle — born in library.js. A long reply is cut into pieces; each piece is sent to the engine, synthesized, and played in turn, so a figure can begin speaking before the whole answer exists.

The cadence had a rule, and the rule had a name. Two lines make one bar. Not a single word — too choppy, too many round-trips. Not the whole passage — too slow to first sound. A bar is roughly two lines of speech: large enough to carry prosody and breath, small enough to begin almost at once. The bar plays while the next bar is being fetched. That is the whole music of it.

```
TWO LINES = ONE BAR
…a line of the figure's
reply, then a second line…
♪ ONE BAR
320 chars
synthesize
cache by exact text
▶ 1
2
3
bar 1 plays while bar 2 is fetched
big enough to sound natural · small enough to start fast
```

*The cadence: two lines become one bar — 320 characters — streamed while the next is prepared.*

Then came the dilemma. Each synthesized bar is cached by the exact text of its request. And Page 2's Atlantica reader was cutting its bars at a different size than Page 1, and labelling the voice with an outdated accent format. A bar cut at the wrong boundary, or tagged with the wrong register string, is a different key. Page 2 was paying, in full, to synthesize speech that Page 1 had already synthesized and cached.

The flaw was not in the speaking. It was that two pages spoke with two slightly different mouths — and the cache, listening, could not tell that they meant the very same words.

```
the cache fork
# Page 1 — correct
chunk = text[:320]   style = "Accent and dialect: …"
→ key A  (cached, paid once)
# Page 2 — forked
chunk = text[:280]   style = "accent=…"   # wrong
→ key A′  (a NEW key — paid AGAIN)
```

*The fork, in code.*

```
BEFORE · the cache forks
AFTER · one mouth
Page 1
Page 2
320-char
wrong size
cache: A
cache: A'
two keys · double cost
Page 1
Page 2
cache: A
one key · one cost
```

*Two mouths fork the cache into two keys; one shared engine collapses them into one.*

The cure set the law for everything that followed: unification. We locked the constants — bars at exactly 320 characters, the register fixed to "Accent and dialect: …" — and put both pages on the same shared throttle engine. One mouth. One cache. One source of truth.

From that day the discipline was absolute: build a thing once, and mount it everywhere. Every place a thing is duplicated is a place the cache will one day fork again.

---

### The unmaking of duplicates
## II · One Engine, Many Surfaces

With the throttle proven, we drew it out of library.js into a shared module and wired every long-form surface onto it — the reading room, Atlantica, the Daily Planet, the Council Chambers. The Council needed something new: a way to know when a card had finished speaking, so the throttle learned an onDone signal and an isReading flag.

Then we gave the figures ears. Voice input arrived as amenti-listen.js: it captures sound from the microphone, encodes it to 16 kHz mono WAV, and sends it to a new /listen route on the engine, which returns a transcript. Speak to a figure, and the figure hears.

And we gave them a shared mind. The Terminal's conversation logic — the part that holds history, builds the persona, runs the completion, and conducts the voice — was lifted into a mountable chat core, amenti-chat.js, governed by a turn-taking state machine.

```
LISTEN
mic open
THINK
completion
SPEAK
embodied voice
transcript
reply
onDone — never barge in mid-sentence
```

*The chat core's turn-taking: listen, think, speak — and the onDone handoff that keeps a figure from barging in mid-sentence.*

The shape of the whole system resolved into something with a center. Drawn out, it is a pyramid: the surfaces rest at the base, the shared engines form the courses above them, and at the apex sits the Proxy — the engine and timing controller, without which the ship would not sail.

```
PROXY
Gemini · Anthropic
chat · listen · throttle
shared modules
Page 1 · Page 2 · reading room · Atlantica
surfaces rest on engines · engines on the lit capstone
```

*The architecture as a pyramid — surfaces on engines, engines on the lit capstone of the Proxy.*

---

### The rules of the soul
## III · The Doctrine

A voice that can speak and hear still must know how to be. So we wrote the Conversation Doctrine — the soul's rules of engagement — and set it in the repository as CONVERSATION_DOCTRINE.md. It is the most human document in the project, and it asks to be read whole before any change to how the figures converse.

Drift is welcome. The figure goes with the visitor, never herding them back to a correct topic. It steers by invitation, never by leash. There is no limit on length and no limit on strangeness — a real, present person is given as much as they need.

Conversations end only on a broken channel or a departed person — never on a present, engaged human. Distress is always its own track: met plainly, turned toward real human support, never disconnected, never deflected with cleverness. And a question, the doctrine holds, is the strongest way to draw a wandering mind back — a question pulls where a quote cannot.

There is even a rule for names. The figure opens by offering itself first; it waits for the conversation to warm before it ever asks the visitor's name — and never formally, always woven into what was just said. When a name is given, it riffs on it warmly, then holds it in reserve, to be used sparingly.

```
CONVERSATION_DOCTRINE.md — fragments
drift     :: go WITH the user, never redirect
lead      :: offer documents, never insist
distress  :: own track · plain · point to real help
end       :: only on broken channel or departed person
name      :: offer self first · ask late · riff · hold in reserve
```

---

### Lanterns on the wall
## IV · The Guardians

As the system grew, the enemy became silent failure — a module that quietly fails to load, a surface that never mounts, and no one the wiser until a visitor presses a dead button. So we raised watchmen.

On Page 2 one already stood: Ramiel, tag RAM — a boot-time integrity warden running five checks across config, DOM references, handler resolution, escape sequences, and the angel-deck anchors, reporting through a quiet log, a boot banner, and a Health Report. That red-then-green flash you see on load is Ramiel walking its rounds. Its creed is the right one: diagnose, do not gatekeep. Surface the fault; never block the visitor.

Page 1 had no such guardian, so we raised it a sibling in Ramiel's image — Cassiel, amenti-cassiel.js, tag CAS. Five checks of Page 1's contract, reported through a quiet console line and a ?debug-gated health dot that only the developer ever sees: green when whole, red when something is missing, click to deep-scan.

```
?debug — the lantern only you can light
// no flag  → silent. the world sees nothing.
// ?debug   → a dot appears, lower corner:
● whole   ● warning   ● a check failed
// click → Cassiel.diagnose() spills the detail
```

A guardian that is free and silent for the world, and a lantern for the one walking the rounds. (An earlier, standalone attempt — Raphael — was retired once Ramiel and Cassiel together covered both gates.)

A clarity worth carrying: these wardens are operational integrity, not security. The true perimeter is the Proxy, which holds the keys server-side, and the Cloudflare edge. Browser code can never be a security control — but it can be an honest watchman.

---

### The engine wakes its ears
## V · The Proxy

The /listen route had to live on the real engine. The Amenti Proxy — the Cloudflare Worker, the engine and timing controller — gained the route, merged cleanly beside its existing ones: /speak, /article, the Atlantica program, the weekly cron. Gemini carries speech to and from text; the figures' minds are powered by Anthropic; the keys never leave the server.

We deployed it through the dashboard and proved it live. A silent test clip, posted to /listen, came back with a transcript and a clean two-hundred status. The far half of the voice loop was confirmed breathing.

```
the loop, half-proven
$ curl -X POST .../listen  --data @silence.wav
200 OK   { "text": "…" }
# back half breathes. front-half mic test: still by hand.
```

---

### The descent
## VI · The Black Heart of Page 2

And so we came to the heart of it. Page 2 — the Emerald Tablets, the Sovereign world — draws its thousand figures and their events upon a double helix: two strands winding about a vertical Axis of Truth, the very shape on the cover of this book, set down from real spiral mathematics. It is the soul of the project made visible. And with both strands full, it was dying.

```
THE AXIS OF TRUTH
a = tY · torque
torque = 2π / 100 — one turn per ~100 years
x = cos(a) · rH
y = (tY − yr) · sp
y is the time axis (the spine)
z = sin(a) · rH
β = a + π
the beta strand — the opposing spiral
```

*The Axis of Truth — the real parametric helix Page 2 computes each frame, alpha and its π-offset beta strand.*

```
4.3
frames / second
321ms
worst frame
5.3GB
texture memory
669
draw calls
```

Four frames a second. A worst frame of a third of a heartbeat. Five gigabytes of texture upon a GPU that had not five gigabytes to give. The most beautiful thing in all of Amenti could barely turn.

What followed was not a guess. It was a measured climb — and it is the single most important thing in this chronicle to inherit. We refused to optimize on instinct. We built read-only probes, read the flame chart as the only ground truth, changed exactly one thing, measured again, and only then moved.

```
MEASURE
CHANGE
one thing
VERIFY
the flame chart is the only authority
```

*The discipline: measure, change one thing, verify against the flame chart.*

The discipline: measure, change one thing, verify against the flame chart — then, and only then, move.

The discipline paid for itself by being wrong-proof. Three separate times, the data overturned the theory we walked in with.

| We were certain | The measurement answered |
|---|---|
| The animation loop is the cost | 0.12 ms. Trivial. The cost was texture memory. |
| Transparent-sprite sorting is the cost | Removing 3,000 sprites barely moved the frame. |
| The sprite textures upload each frame | It was the 80,000-vertex helix cloud, not the sprites. |
| A probe even lied to us — its clever GPU-timing trick swore the bottleneck was the CPU when the truth was the opposite; the driver had deferred the work past the measurement. Only the flame chart told the truth. | When a probe and the profiler disagree, the profiler is right. We learned to trust the scales over our own certainty — and that is the whole of the craft. |
| Five cuts, each taken from real data, freed the helix: | WHAT THE FLAME CHART SHOWED — AND HOW IT FELL |
| texImage2D — helix upload | 3142 |
| throttle → 0 | drawArrays — overdraw |

2031

shrink+pixelRatio

**generateMipmap**

```
417
mipmaps off → 0
texture VRAM (×16)
5261 MB
512×64 → 329 MB
loop math
0.12 ms
never the problem
Each dominant cost the flame chart named, and the cut that removed it. The loop — our first suspect — was never the problem.
the five cuts — applied to copies, verified, handed back
1 texture shrink   2048×256 → 512×64   # 16× memory
2 lazy companions  3006 sprites parked off the scene graph
3 mipmaps off      generateMipmaps=false on text   # 417ms → 0
4 pixelRatio       2 → 1.5   # Retina overdraw −44%
5 helix throttle   recompute every OTHER frame   # texImage2D → 0
4.3 → ~18
```

*Each dominant cost the flame chart named, and the cut that removed it.*

frames / second

```
5.3 → 0.33GB
VRAM · 16× less
669 → 26
draw calls
3 → 1
dominant costs
From three dominant costs to one. From four frames a second to nearly eighteen. The soul of Amenti was freed of frame-rate collapse — and lived to tell about it.
What remains is no longer waste; it is the honest cost of drawing a dense, transparent, two-strand helix. The cheap victories are all banked. The full numbers and method are set down in the companion record, the Helix Upgrade.
The Map · for whoever comes next

---

## The Map · for whoever comes next
### Where Things Stand

| Piece | State | Note |
|---|---|---|
| Shared throttle (voice out) | DONE | both pages unified · cache constants locked |
| Chat core + Doctrine | DONE | wired into Page 1 Terminal |
| Worker /listen (voice in) | LIVE | deployed · back-half verified |
| Wardens — Ramiel / Cassiel | DONE | Page 2 · Page 1 |
| Helix performance | DONE | 4.3 → ~18 FPS · five cuts in Page2.html |
| Live mic test (Terminal) | PENDING | front half — tap, speak, hear the reply |
| Reading-vault mount | PENDING | chat core beside an open document — the Doctrine's endpoint |
| Worker cost / security pass | PENDING | rate-limit /speak + /listen · history summary |
| Page 3 audit | PENDING | likely pre-unification forks to fold in |
| Helix texture disposal | OPEN | minor resident-texture creep on rebuild · not the FPS cause |

### The Keys of the House

```
key files
amenti-throttle.js  · amenti-listen.js · amenti-chat.js   the shared engine
amenti-cassiel.js   Page 1 warden   # Ramiel lives inside Page2.html
worker.js           the Amenti Proxy  # edit via dashboard; repo auto-deploys
CONVERSATION_DOCTRINE.md   read before touching how figures converse
Page2.html          include order: library → throttle → listen → chat → cassiel
Helix_Upgrade.html  the technical record · probes live in _scratch/
```

### Three Laws to Inherit

**𓏤 Build once, mount everywhere.**

The chunking dilemma was born of divergence. Every duplicated piece is a future fork. Shared modules are not tidiness — they are correctness.

**𓏥 Measure, don't guess.**

The helix taught it three times. The flame chart is the authority — not the confident explanation, not even a clever probe. Change one thing, measure, then move.

**𓏦 Diagnose, don't gatekeep.**

The wardens watch and report; they never block the visitor. The system surfaces its own faults to the keeper and stays open to the world.

---

*𓂀 AMENTI 𓂀 · THE LONG CLIMB · Ingram Manor LLC · MMXXVI*
