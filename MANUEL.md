# MANUEL — The Scribe of the Sovereign Instrument

*A glossary of every named artifact in Page 2, drawn from the working code as of v9.18.140.*

This document is the source of truth for what exists. Where a term names something with code behind it, the entry describes what that code does. Where a term names something aspirational, the entry says so. Manuel does not flatter the manifold; he records it.

---

## The three layers

Page 2 is built in three conceptual layers. Naming them explicitly matters, because each layer has a different job and a different audience.

- **Sovereign Instrument** — the whole. The product. What the user experiences when Page 2 loads. The esoteric name for the instrument as a thing-in-the-world.
- **Stardust Engine** — the system of working parts. Every artifact, module, equation, and angel acting in concert to produce the x-dimensional experience. The functional machinery the operator reasons about.
- **QuantumContainer** — the GPU substrate. The Three.js `scene`, `camera`, `renderer`, `raycaster`, and the WebGL context they hold. The space everything is rendered into.

The relationship: **the Sovereign Instrument is what the user sees. The Stardust Engine is what produces it. The QuantumContainer is where it lives.**

A note on the code as of v9.18.140: the Stardust Engine is currently *implicit* in the source — it is the sum of `Sovereign.QuantumContainer`, `Sovereign.Angels`, `Sovereign.Navigation`, and the module handlers under `Sovereign.UI`. There is no `Sovereign.Stardust` namespace yet. The name describes the working whole, not a code path. When the namespace is introduced, this entry will be updated to point at it.

---

## Architecture at a glance

The Sovereign Instrument is built around **a single master clock** — the X-axis. It produces one number, the active year `Y`. Every visible object in the 3D scene is a pure function of `Y` plus three modulators (Quantum Aperture, Quantum Zoom, Quantum Torque). Change the clock, the universe redraws.

Two layers sit on top of that clock:

- **The QuantumContainer** — the GPU substrate. Holds the 3D scene, the camera, the renderer, and every visible object. It is the world.
- **The Angels** — services that act upon the QuantumContainer. They are agents, not scenery.

Code that touches the substrate without going through an angel is ordinary engine work. Code organized under an angel is a service with a name and a job. Together, substrate and agents constitute the Stardust Engine.

---

## Part I — The QuantumContainer

The GPU substrate of the Stardust Engine. Everything in this section lives at `Sovereign.QuantumContainer.*` in the code.

### Truth Axis

The strictly vertical spine of the manifold, drawn from `y = -20000` to `y = +20000`. Represents the radial origin (`r = 0`) of the helical coordinate system — the point at which time has no spatial extension. Visually a thin white line through the center of the scene.

### Alpha Helix

The visible primary spiral. Implemented as a `THREE.Points` cloud of 40,000 vertices, each one representing 1/100th of a year. The middle point (index 20,000) always sits at the user's currently-selected year; points on either side trace the past and the future. Every frame, the position of every point is recomputed from `(year × torque + momentum)` for the angle and `(year - Y) × zoom` for the height. Color: emerald-gold at full opacity. The helix is what makes the temporal coordinate system *legible* — without it, all the other objects would float in apparent vacuum.

Alpha is the **Sovereigns strand**. The figures of the ledger (people, anchored by death year) materialize as label sprites along this spiral. Governed by Michael, who fetches the figures CSV and materializes the sprites.

### Beta Helix

The DNA-style second strand. Identical geometry to Alpha but offset by π radians around the Truth Axis, so the two strands live on opposite sides of the vertical spine at every height. Implemented as a `THREE.Points` cloud of 40,000 vertices using the same `(year × torque + momentum)` math as Alpha. Color: warm gold at full opacity. Hidden by default; revealed when the user enters DOUBLE HELIX view.

Beta is the **Events strand**. Historical events (anchored by year) materialize as label sprites along this spiral. Where Alpha carries *people*, Beta carries *moments*.

Both strands are governed by Michael — the ledger-ingestion angel — who maintains the figures ledger and the events ledger as two members of the same family. Visibility of the Beta strand is controlled by `Sovereign.UI.Views._applyBetaVisible(show)`, which also toggles the inline ALPHA/BETA legend at the top of the screen so users know which strand is which.

### Earth Prism

A wireframe octahedron at the origin, rotating slowly around the Y-axis at the rate of `system_momentum + scrollMomentum`. Its rotation is the visible signature of the engine's overall temporal drift. White lines, 50% opacity.

### Earth Artifact

A small blue sphere at the origin, embedded inside the Earth Prism. Represents the planet itself in the manifold — the singular reference point against which all historical figures are arranged.

### Metatron Grid

A subtle blue icosahedral wireframe surrounding the central scene at radius 1200. Named for the geometric figure (Metatron's Cube), not the angel. Renders at 5% opacity — present but barely visible. Atmospheric reference structure.

---

## Part II — Modules

The interactive docks that let the operator modulate the engine. Each lives in the DOM as an `.s-module` element and translates user input into changes on the master clock or its modulators.

### Quantum Injector

Top-left dock. Three buttons — RELOAD, REPLACE, EJECT — drive the ledger lifecycle. Status line beneath shows current node count and source (`SHEET` / `FILE` / `NONE`). Governed by Michael.

### Quantum Torque

Right of the Injector. Buttons set the vertical zoom window in years (25, 50, 100, 250, 500). Governed by Uriel.

### Quantum Aperture

Bottom-left dock. Four vision-mode buttons (V1–V4) plus an Internal/External lens toggle. The vision modes set the camera's depth-of-field offset; the lens toggle switches between magnified internal observation (0.15) and panoramic external observation (1.0).

### Teleport Bridge

Bottom-right dock. A single text input. Accepts either a year (`1850`, `-3000`) or a name fragment (`oppenheimer`). Numeric input clamps to the temporal range and snaps the X-axis there. Text input searches the loaded ledger and jumps to the matching figure's anchor year. On match: status banner confirms `TELEPORT :: NAME (YEAR)`.

### Overwatch Portal

Top-center dock. Opens via the angelic sigil. Reveals the Angelic Overwatch deck — currently seven working angels (Michael, Gabriel, Uriel, Cassiel, Hermes, Ramiel, Manuel) plus the Origin settings panel. Earlier stub angels (Ariel, Lucifer, Raphael, Duriel, Raziel, Jariel) were retired to keep the deck honest. They will return as their subsystems are implemented.

The Live Activity terminal beneath the deck streams events from every angel in real time, color-coded by sigil tag (MIC, GAB, URI, CAS, HER, ORG, RAM, MAN, ATL, SYS).

### Right Deck

Vertical column of toggles on the right edge:
- **K** — Knowledge Scan (toggles whether figure name labels respond to hover)
- **ⓘ** — Technical Briefs (toggles whether modules show their hover briefs)
- **Saturn icon** — Planet Dock (toggles visibility of all six planetary bodies)
- **●** — Solar Markers (toggles equinox markers)

---

## Part III — Navigation Rails

Three vertical sliders that translate cursor position into temporal or spatial parameters.

### X-Axis Rail

Far left. The master clock. Drag the rail or scroll the wheel to advance through history. Range: −3000 BC to +3000 AD. The cursor box reads the active year as you move.

### Aperture Rail

Second from left. Magenta-themed. Controls the lateral displacement coefficient (`Δx`) of all radial projections. At Δx=1.0, the helix sits at its base radius; at Δx=4.9 it expands outward dramatically.

### Quantum Zoom Rail

Far right. Sets the vertical compression of the manifold. Range: 25Y to 500Y. At 25Y, a single century stretches across the full vertical extent of the screen; at 500Y, half a millennium does.

---

## Part IV — The Emerald Tablet

The chamber that opens when a figure on the helix is clicked. Four pages, navigable via sigils in the top-left corner: ◈ Sync, ≡ Skychart, ❖ The Legend, ≈ Atlantica.

### Sovereign Biography (the ◈ Sync page)

Left half: the figure's name, lifespan, title, and biographical text drawn from the ledger. Includes a Temporal Anchor strip showing the death year and Neural Sync status. Link buttons (Google, Wikipedia, etc.) sit beneath the bio.

Right half: the **Amenti Interface** — the chat panel.

### Amenti Interface

The conversational layer. A scrolling chat region above an input field. The user types; Gabriel transmits the message to Claude (via the Cloudflare Worker proxy), with the figure's persona prompt and conversation history. The figure responds in first person.

Three conversation modes — **INQUIRY**, **REFLECTION**, **SYNTHESIS** — shape the assistant's voice:

- **Inquiry** — the visitor asks; the figure answers from their lived experience.
- **Reflection** — the figure speaks meditatively, weighing the meaning of their work.
- **Synthesis** — the figure connects their work to broader currents of history and thought.

A small triangular reset button cycles to a fourth `NEUTRAL` mode.

### Skychart (the ≡ page)

The celestial chart for the selected figure's anchor year — natal-style positions of the classical seven bodies plus major Ptolemaic aspects. Powered by Cassiel. Pyramid backdrop in violet; the Gates of Amenti at the pyramid base are clickable and open the Halls of Amenti panel.

### The Legend (the ❖ page)

Previously named *The Dossier*. A structured fragment of the figure's record — a primary-source-style article presentation with header, biography, events, works, affiliations, and contemporaries. Powered by Hermes, who fetches the structured profile from Claude on demand and caches it for the browser session. Pyramid backdrop in hermetic blue; the Gates of Amenti at the pyramid base are clickable and open the Halls of Amenti panel.

### Atlantica (the ≈ page)

The communicative surface. A daily dispatch from one of five historical voices (Thoth, Hermes Trismegistus, Pythagoras, Hypatia, Plato), each reflecting on an event drawn from the events ledger. The dispatches rotate Monday through Friday; weekends rest. Each post links back to its source event in the Archive, making Atlantica a door from outside the instrument into the rest of it.

Phase 1 ships static seed dispatches. Phase 2 will add a discussion layer. Phase 3 will automate daily generation. As of v9.18.140, Phase 1 only.

---

## Part V — The Angelic Hosts

Seven angels, each a real subsystem with code behind it. Together with the QuantumContainer they constitute the Stardust Engine.

### Michael — Ledger Ingestion

`Sovereign.Angels.Michael`

Governs the Quantum Injector and both ledgers — the figures ledger (Sovereigns, anchored on the Alpha Helix) and the events ledger (Events, anchored on the Beta Helix). Owns the `labelSprites[]` array for figures and, via the same ingestion pipeline, the event sprite array for events. Owns the `records[]` array (the parsed figures ledger).

Public methods:
- **`reload()`** — fetches the canonical figures CSV from `AMENTI_CONFIG.LEDGER_CSV_URL`, parses it through PapaParse, normalizes each row into the canonical schema (Rank, Name, Title, Birth-Date, Death-Date, Biography, Links), and materializes label sprites at each figure's death year on the Alpha strand. When `AMENTI_CONFIG.EVENTS_CSV_URL` is configured, also fetches the events ledger and materializes event sprites on the Beta strand at each event's anchor year.
- **`replace()`** — opens the file picker for custom CSV upload.
- **`eject()`** — disposes every sprite and texture, clears all records, returns the manifold to `— EMPTY —` state.
- **`handleFileUpload(input)`** — internal handler for the file picker.

Internal state: `lastSource` ('SHEET' / 'FILE' / 'NONE'), `records[]`, `labelSprites[]`, and the events arrays. Status displayed in the dock as e.g. `1000 NODES :: SHEET`.

A note on current code organization: as of v9.18.140, the event-sprite materialization lives in `Sovereign.Angels.Hermes` for historical reasons (Hermes was originally given the beta-helix role before the architectural pattern was clarified). The intent, recorded here and to be made true in a forthcoming refactor, is for Michael to own both ledgers — the responsibility is the same shape in both cases, and the duplication is engineering debt, not a conceptual distinction. When that refactor lands, this entry will not need to change. Hermes' entry will.

### Gabriel — Chat Transmission

`Sovereign.Angels.Gabriel`

Governs the Amenti Interface. Owns the conversation history (per figure, per session) and the rendering of chat turns.

Public method:
- **`transmit()`** — reads the input, validates that a figure is selected and that Origin's proxy URL is configured, builds the persona prompt from the figure's bio and lifespan, appends the user message to the per-figure history (capped to Origin's `historyCap` at the worker), POSTs to the Cloudflare Worker, parses the response, appends the assistant turn, and renders it. Errors roll back the user turn so retry doesn't double-up.

Internal helpers: `buildSystemPrompt()`, `appendUser()`, `appendAssistant()`, `appendSystem()`, `appendTyping()`. The typing indicator (three pulsing dots) appears during the network round-trip.

Conversation history is stored in `Sovereign.State.conversations[figureName]` — a per-figure array of `{role, content}` turns. History persists for the browser session and is restored when the user re-opens the same figure's tablet.

Inert until Origin's proxy URL is set (see the ORG panel).

### Uriel — Temporal Torque

`Sovereign.Angels.Uriel`

Governs the Quantum Torque dock. The smallest of the working angels; effectively a thin wrapper.

Public method:
- **`set(years, idx)`** — sets `Navigation.Zoom.target` to the given window size (clamped 25–500) and toggles the active button class.

### Cassiel — Celestial Reckoning

`Sovereign.Angels.Cassiel`

Computes the natal-style astrological chart for any year in the manifold. Cassiel is the deterministic angel: given a year, he returns the same chart every time, because the underlying astronomy is deterministic. Powers the Skychart page of the Emerald Tablet.

Public methods:
- **`chartFor(year)`** — returns a chart object containing the longitude, glyph, sign, degree, element, and modality of each of the classical seven bodies (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) as positioned at the vernal equinox of that year. The vernal equinox is used as a principled, year-independent anchor.
- **`chartForRecord(record)`** — convenience wrapper that anchors on a figure's effective temporal anchor (death year for deceased figures, birth year for the living).
- **`aspectsFor(chart)`** — returns the major Ptolemaic aspects (conjunction, sextile, square, trine, opposition) present in a chart, with orb tolerances appropriate to each.
- **`signOf(longitudeDeg)`** — pure utility: maps an ecliptic longitude in degrees to its zodiac sign, degree-within-sign, element, and modality.
- **`glyphFor(body)`** — the Unicode glyph for a body name.

Internal state: a three-tier cache. Tier 1 is an in-memory session cache (`_cache`). Tier 2 is `localStorage` under the key `amenti.chart.<year>` — charts don't change, so cross-session caching has no staleness risk. Tier 3 is fresh computation via the astronomy-engine library. The fallback chain reads in order; failures silently descend to the next tier.

Dependencies: the `astronomy-engine` library must be loaded for fresh computation. If absent, Cassiel logs the condition and returns null; cached charts still serve normally.

### Hermes — Structured Profile Generation

`Sovereign.Angels.Hermes`

Powers The Legend page of the Emerald Tablet. Where Gabriel handles conversational chat in the figure's voice, Hermes asks Claude for a *structured* profile of the figure — events, works, affiliations, contemporaries — and returns it as a JSON object that the UI renders into the page.

Public methods:
- **`fetchProfile(record)`** — returns a Promise resolving to a profile object with four arrays (`events`, `works`, `affiliations`, `contemporaries`). Reuses Origin's configured proxy URL and model. Cached per figure for the browser session.
- **`cacheKey(record)`** — derives the cache key, using `name::deathYear` so namesakes from different eras cache separately.

Internal helpers: `_buildSystemPrompt(record)` produces a strict JSON-schema-enforcing prompt that instructs Claude to return raw JSON with no preamble or fences; `_parseStructured(text)` is the defensive parser that strips occasional markdown fences and extracts the outermost JSON object.

Hermes reuses Gabriel's transmit endpoint. The worker requires no special handling — the *prompt* is what shapes the response into structured JSON.

Inert until Origin's proxy URL is set. Reflection-from-beyond-time, an aspirational feature once associated with this angel, is deliberately not implemented in this version.

A note on current code organization: as of v9.18.140, Hermes also still holds the event-sprite materialization pipeline that ought to belong to Michael (see Michael's entry above). This is engineering debt, not a conceptual choice. When the refactor lands, this paragraph and the corresponding paragraph in Michael's entry will both be removed.

### Ramiel — Integrity Warden

`Sovereign.Angels.Ramiel`

Runs once at boot, after the QuantumContainer initializes and Michael's ledger fetch is kicked off. Walks the live DOM and the JavaScript namespace looking for the kinds of breakage that don't crash anything immediately but will cost something later. Read-only: Ramiel diagnoses, never repairs.

Public methods:
- **`run()`** — execute all enabled checks. Idempotent; can be called again after a DOM change to verify nothing slipped.
- **`lastReport`** — the most recent run's findings as `{ok, warn, fail}`.
- **`CHECKS`** — the toggle table. Each category is individually toggleable for debugging.

Five categories, each independently gated by `Sovereign.Angels.Ramiel.CHECKS`:

- **`config`** — verifies `AMENTI_CONFIG.LEDGER_CSV_URL` is set to a real URL (FAIL otherwise); that `MANUEL_URL` is populated (WARN); that `Origin.proxyUrl`, if set, is URL-shaped (WARN if malformed).
- **`dom`** — scans inline `<script>` source for every `getElementById('foo')` call, verifies each `foo` exists in the live DOM. FAILs missing IDs, capped at 5 reports.
- **`handlers`** — walks every inline event-handler attribute, extracts every `Sovereign.X.Y` reference, verifies the chain resolves to a real function. Catches the "renamed a method and forgot the markup" bug class.
- **`escapes`** — walks every text node and non-event attribute in the HUD, flags any `\uXXXX` pattern. Catches JavaScript escape literals that landed in HTML context where the browser doesn't interpret them. FAILs each leak, capped at 8.
- **`deck`** — deferred 800ms. Verifies every `openManuel('xxx')` argument in the deck has a matching heading slug in MANUEL.md. WARN missing anchors. Reads from the cached Manuel content if a previous visit populated it; skips gracefully on first-ever visit.

Findings stream to the Overwatch terminal under the `[RAM]` tag in silver-blue. Aggregate counts surface on the boot banner: red for FAIL findings (visible ~4.5s), amber for WARN findings (~3s), silent on clean pass.

Ramiel never blocks boot. Even on FAIL the page renders, the helix spins, the docks respond. He is a diagnostician, not a gatekeeper.

### Origin — System Settings

`Sovereign.Angels.Origin`

Owns operator-tunable configuration that should not live in source. Where `AMENTI_CONFIG` carries values an operator sets at install time (the canonical CSV URLs, the MANUEL.md path), Origin carries values an operator changes at runtime: the AI proxy URL, the chosen Claude model, the conversation history cap.

Settings persist to `localStorage` under the key `amenti.origin.v1`. On first boot, a legacy fallback pulls `AI_PROXY_URL` from `AMENTI_CONFIG` if it's set there from a pre-Origin config.js, migrates it into Origin, and logs the migration under `[ORG]`.

Public methods:
- **`load()`** — read from localStorage, merge with defaults, run the legacy migration if needed. Called once at boot.
- **`save()`** — write the current state back to localStorage.
- **`get(key)`** / **`set(key, value)`** — single-field accessors. Auto-loads if not yet initialized.
- **`isConfigured()`** — returns true iff `proxyUrl` is set to a real-looking URL (not empty, not a `PASTE_` placeholder).
- **`openPanel()`** / **`closePanel()`** — show/hide the settings modal.
- **`saveFromPanel()`** — validate and persist the form values.
- **`testConnection()`** — POST a minimal ping to the configured proxy and report the result inline. Uses a system prompt instructing the model to reply with only `PONG`; minimal API budget.

Three settings:
- **`proxyUrl`** — the Cloudflare Worker URL. Without this, Gabriel and Hermes are inert.
- **`model`** — the Claude model identifier (default: `claude-sonnet-4-6`).
- **`historyCap`** — maximum conversation turns retained by the worker (default: 20; range: 2–50).

Accessed via the ORG sigil in the Overwatch deck.

### Manuel — The Scribe

`Sovereign.UI.openManuel()`

The angel of this very document. Manuel does not act on the manifold; he describes it. Clicking his deck slot — or any angel's deck slot — opens this glossary in a reader overlay, optionally scrolled to a named section.

Manuel's role is meta — he names the rest of the angels, the rest of the modules, the rest of the substrate. He is the only angel whose function is purely documentary.

Fetches MANUEL.md from `AMENTI_CONFIG.MANUEL_URL` on first open. Parses with the `marked` library. Injects `id` attributes onto h2/h3 headings (slugified lowercase, alphanumeric only) so deck buttons can scroll directly to the angel they name. Caches the rendered HTML in memory for the rest of the session.

---

## Part VI — Configuration & Boot

### Configuration

`AMENTI_CONFIG` (declared at the top of the file via `config.js`) carries install-time values:

- **`LEDGER_CSV_URL`** — the published-to-web CSV URL of the Google Sheet that holds the figures ledger (Sovereigns).
- **`EVENTS_CSV_URL`** — the published-to-web CSV URL of the Google Sheet that holds the events ledger. Optional; when blank, an inline seed list of historical events is used.
- **`MANUEL_URL`** — the path or URL to this document. Defaults to `MANUEL.md` (sibling of `Page2.html`).

Runtime-tunable values — the AI proxy URL, the model, the history cap — live in Origin and persist to `localStorage`. The legacy `AI_PROXY_URL` field in `AMENTI_CONFIG` is still honored if present (Origin migrates it in on first boot) but should be considered deprecated; new configurations should set the proxy URL through the ORG panel.

### Boot sequence

1. `Sovereign.Bookmarks.load()` — restores any persisted figure bookmarks.
2. `Sovereign.Cosmetics.load()` — restores user-set visual preferences.
3. `Sovereign.Angels.Origin.load()` — restores AI proxy settings and runs the legacy `AI_PROXY_URL` migration if needed.
4. `Sovereign.QuantumContainer.init()` — creates scene, camera, renderer, and every visible 3D object (including both Alpha and Beta helices).
5. `animate()` — begins the per-frame render loop.
6. `Sovereign.Angels.Michael.reload()` — auto-fetches the canonical figures ledger (and, when configured, the events ledger).
7. `Sovereign.Angels.Ramiel.run()` — walks the manifold for integrity violations and reports any findings.
8. Window event listeners attached: mouse drag for orbit, mouse wheel for time, click for figure selection, resize for viewport adaptation.

### Schema

The CSV figures ledger uses these column headers (case-sensitive, hyphens preserved):

```
Rank | Full Name | Title | Birth-Date | Death-Date | Biography | Links
```

The `Links` column contains comma-separated keywords (`google, wikipedia, youtube, britannica, archive`) which are converted to live search URLs at materialization time. Literal `https://` URLs in the column are also supported.

The events ledger uses a simpler schema:

```
year | name | category | description
```

---

## Part VII — Cross-References

### Module → Angel mapping

| Module | Governing Angel | Function |
|---|---|---|
| Quantum Injector | Michael | Ledger ingestion (Sovereigns + Events) |
| Amenti Interface | Gabriel | Chat with figures |
| Quantum Torque | Uriel | Temporal zoom |
| Skychart page | Cassiel | Celestial reckoning |
| The Legend page | Hermes | Structured profile generation |
| Atlantica page | (unowned) | Daily dispatches |
| Origin settings panel | Origin | Runtime AI configuration |
| (no module — runs at boot) | Ramiel | Integrity checking |
| Overwatch Portal → Manuel | Manuel | This document |
| Quantum Aperture | (unowned) | Lateral displacement |
| Teleport Bridge | (unowned) | Year/name jump |
| Right Deck toggles | (unowned) | Visibility flags |

Modules without a governing angel are handled directly in `Sovereign.UI.*` and `Sovereign.Navigation.*`. They could be assigned angels later if those subsystems grow in complexity. Ramiel intentionally has no governing module; it runs at boot rather than being user-invoked.

---

## A note from the Scribe

This glossary records what exists. The three-layer naming — Sovereign Instrument, Stardust Engine, QuantumContainer — was clarified after earlier drafts retired "Stardust Engine" as aspirational. The name now stands, but as a conceptual layer rather than a code namespace: the Stardust Engine is the working whole of substrate and angels, not yet a path in the source. When the code is restructured to make `Sovereign.Stardust` real, this entry will be updated to point at it.

A second piece of engineering debt is recorded honestly above: as of v9.18.140 the event-sprite pipeline still lives in Hermes' code rather than Michael's, even though the conceptual home for both ledgers is Michael. Manuel scribes the working manifold, not the dreamed one — but where the dreamed manifold is close at hand and the path to it is short, Manuel does say so.

Other names from earlier drafts — Triple-Gate Protocol, Quantum Tether — remain aspirational. They have not been forgotten. They have been left out, deliberately, because Manuel scribes the working manifold, not the dreamed one. When their code is written, their entries will join this document.

*— Manuel*
