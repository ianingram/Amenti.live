# MANUEL — The Scribe of the Sovereign Instrument

*A glossary of every named artifact in Page 2, drawn from the working code as of v9.18.12.*

This document is the source of truth for what exists. Where a term names something with code behind it, the entry describes what that code does. Where a term names something aspirational, the entry says so. Manuel does not flatter the manifold; he records it.

---

## The three layers

Page 2 is built in three conceptual layers. Naming them explicitly matters, because each layer has a different job and a different audience.

- **Sovereign Instrument** — the whole. The product. What the user experiences when Page 2 loads. The esoteric name for the instrument as a thing-in-the-world.
- **Stardust Engine** — the system of working parts. Every artifact, module, equation, and angel acting in concert to produce the x-dimensional experience. The functional machinery the operator reasons about.
- **QuantumContainer** — the GPU substrate. The Three.js `scene`, `camera`, `renderer`, `raycaster`, and the WebGL context they hold. The space everything is rendered into.

The relationship: **the Sovereign Instrument is what the user sees. The Stardust Engine is what produces it. The QuantumContainer is where it lives.**

A note on the code as of v9.18.12: the Stardust Engine is currently *implicit* in the source — it is the sum of `Sovereign.QuantumContainer`, `Sovereign.Angels`, `Sovereign.Navigation`, and the module handlers under `Sovereign.UI`. There is no `Sovereign.Stardust` namespace yet. The name describes the working whole, not a code path. When the namespace is introduced, this entry will be updated to point at it.

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

The visible spiral itself. Implemented as a `THREE.Points` cloud of 40,000 vertices, each one representing 1/100th of a year. The middle point (index 20,000) always sits at the user's currently-selected year; points on either side trace the past and the future. Every frame, the position of every point is recomputed from `(year × torque + momentum)` for the angle and `(year - Y) × zoom` for the height. Color: terminal/emerald green at full opacity. The helix is what makes the temporal coordinate system *legible* — without it, all the other objects would float in apparent vacuum.

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

Top-center dock. Opens via the angelic sigil. Reveals the Angelic Overwatch deck — currently four working angels (Michael, Gabriel, Uriel, Manuel) — plus a Save State button and Architect Mode toggle. The seven earlier stub angels (Ariel, Lucifer, Raphael, Duriel, Raziel, Jariel, Hermes) were retired to keep the deck honest. They will return as their subsystems are implemented.

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

The chamber that opens when a figure on the helix is clicked. Two pages, navigable via sigils in the top-left corner.

### Sovereign Biography (the ◈ page)

Left half: the figure's name, lifespan, title, and biographical text drawn from the ledger. Includes a Temporal Anchor strip showing the death year and Neural Sync status. Link buttons (Google, Wikipedia, etc.) sit beneath the bio.

Right half: the **Amenti Interface** — the chat panel.

### Amenti Interface

The conversational layer. A scrolling chat region above an input field. The user types; Gabriel transmits the message to Claude (via the Cloudflare Worker proxy), with the figure's persona prompt and conversation history. The figure responds in first person.

Three conversation modes — **INQUIRY**, **REFLECTION**, **SYNTHESIS** — shape the assistant's voice:

- **Inquiry** — the visitor asks; the figure answers from their lived experience.
- **Reflection** — the figure speaks meditatively, weighing the meaning of their work.
- **Synthesis** — the figure connects their work to broader currents of history and thought.

A small triangular reset button cycles to a fourth `NEUTRAL` mode.

### Akasha Archive (the ≡ page)

Right half of the chamber, accessed by clicking the second sigil. Materializes a structured fragment of the figure's record — a primary-source-style article presentation with header, biography, and link cluster. Currently a presentational layer; the chat lives only on the Sync page.

---

## Part V — The Angelic Hosts

Four angels, each a real subsystem with code behind it. Together with the QuantumContainer they constitute the Stardust Engine.

### Michael — Ledger Ingestion

`Sovereign.Angels.Michael`

Governs the Quantum Injector. Owns the `labelSprites[]` array (the visible figure name labels) and the `records[]` array (the parsed ledger).

Public methods:
- **`reload()`** — fetches the canonical CSV from `AMENTI_CONFIG.LEDGER_CSV_URL`, parses it through PapaParse, normalizes each row into the canonical schema (Rank, Name, Title, Birth-Date, Death-Date, Biography, Links), and materializes label sprites at each figure's death year.
- **`replace()`** — opens the file picker for custom CSV upload.
- **`eject()`** — disposes every sprite and texture, clears all records, returns the manifold to `— EMPTY —` state.
- **`handleFileUpload(input)`** — internal handler for the file picker.
- **`setRepulsion(mode)`** — switches the spatial layout policy among Totem (rigid stacking), Drift (low-friction dispersion), and Cluster (density-based grouping). The repulsion engine itself is not yet implemented; the buttons currently set state but do not affect rendering.

Internal state: `lastSource` ('SHEET' / 'FILE' / 'NONE'), `records[]`, `labelSprites[]`. Status displayed in the dock as e.g. `1000 NODES :: SHEET`.

### Gabriel — Chat Transmission

`Sovereign.Angels.Gabriel`

Governs the Amenti Interface. Owns the conversation history (per figure, per session) and the rendering of chat turns.

Public method:
- **`transmit()`** — reads the input, validates that a figure is selected and the proxy URL is configured, builds the persona prompt from the figure's bio and lifespan, appends the user message to the per-figure history (capped to the last 20 turns at the worker), POSTs to the Cloudflare Worker, parses the response, appends the assistant turn, and renders it. Errors roll back the user turn so retry doesn't double-up.

Internal helpers: `buildSystemPrompt()`, `appendUser()`, `appendAssistant()`, `appendSystem()`, `appendTyping()`. The typing indicator (three pulsing dots) appears during the network round-trip.

Conversation history is stored in `Sovereign.State.conversations[figureName]` — a per-figure array of `{role, content}` turns. History persists for the browser session and is restored when the user re-opens the same figure's tablet.

Currently inert until the Cloudflare Worker is deployed and `AMENTI_CONFIG.AI_PROXY_URL` is set.

### Uriel — Temporal Torque

`Sovereign.Angels.Uriel`

Governs the Quantum Torque dock. The smallest of the working angels; effectively a thin wrapper.

Public method:
- **`set(years, idx)`** — sets `Navigation.Zoom.target` to the given window size (clamped 25–500) and toggles the active button class.

### Manuel — The Scribe

`Sovereign.UI.openManuel()`

The angel of this very document. Manuel does not act on the manifold; he describes it. Clicking his deck slot opens this glossary in a reader overlay.

Manuel's role is meta — he names the rest of the angels, the rest of the modules, the rest of the substrate. He is the only angel whose function is purely documentary.

---

## Part VI — Configuration & Boot

### Configuration

The two values an operator must set in `AMENTI_CONFIG` at the top of the file:

- **`LEDGER_CSV_URL`** — the published-to-web CSV URL of the Google Sheet that holds the figure ledger.
- **`AI_PROXY_URL`** — the Cloudflare Worker URL that proxies chat requests to Anthropic. Without this, Gabriel is inert.

### Boot sequence

1. `QuantumContainer.init()` — creates scene, camera, renderer, and every visible 3D object.
2. `animate()` — begins the per-frame render loop.
3. `Michael.reload()` — auto-fetches the canonical ledger.
4. Window event listeners attached: mouse drag for orbit, mouse wheel for time, click for figure selection, resize for viewport adaptation.

### Schema

The CSV ledger uses these column headers (case-sensitive, hyphens preserved):

```
Rank | Full Name | Title | Birth-Date | Death-Date | Biography | Links
```

The `Links` column contains comma-separated keywords (`google, wikipedia, youtube, britannica, archive`) which are converted to live search URLs at materialization time. Literal `https://` URLs in the column are also supported.

---

## Part VII — Cross-References

### Module → Angel mapping

| Module | Governing Angel | Function |
|---|---|---|
| Quantum Injector | Michael | Ledger ingestion |
| Amenti Interface | Gabriel | Chat with figures |
| Quantum Torque | Uriel | Temporal zoom |
| Overwatch Portal → Manuel | Manuel | This document |
| Quantum Aperture | (unowned) | Lateral displacement |
| Teleport Bridge | (unowned) | Year/name jump |
| Right Deck toggles | (unowned) | Visibility flags |
| Architect Mode | (unowned) | Module repositioning |

Modules without a governing angel are handled directly in `Sovereign.UI.*` and `Sovereign.Navigation.*`. They could be assigned angels later if those subsystems grow in complexity.

---

## A note from the Scribe

This glossary records what exists. The three-layer naming — Sovereign Instrument, Stardust Engine, QuantumContainer — was clarified after earlier drafts retired "Stardust Engine" as aspirational. The name now stands, but as a conceptual layer rather than a code namespace: the Stardust Engine is the working whole of substrate and angels, not yet a path in the source. When the code is restructured to make `Sovereign.Stardust` real, this entry will be updated to point at it.

Other names from earlier drafts — Triple-Gate Protocol, Quantum Tether, the five-page tablet — remain aspirational. They have not been forgotten. They have been left out, deliberately, because Manuel scribes the working manifold, not the dreamed one. When their code is written, their entries will join this document.

*— Manuel*
