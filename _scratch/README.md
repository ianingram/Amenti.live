# _scratch — debugging & test kit (not deployed)

These are diagnostics and harnesses kept for future voice debugging. **None of
these ship.** The live deploy set is the three files at the top level of
`outputs/`: `Page1.html`, `library.js`, `amenti-throttle.js`.

Most of the `.js` files here are meant to be **pasted into the browser console
on the amenti.live origin** (so CORS and any logged-in state apply). They read
and report; they don't modify the page.

| File | What it's for |
|---|---|
| `amenti-speak-diagnostic.js` | Stage-I diagnostic. Validates the chunked-streaming voice against the **live `/speak` Worker** — confirms measures synthesize, return audio, and play. Read-only. Reach for this first when audio fails or a measure times out. |
| `amenti-speak-diagnostic.min-safe.js` | Minifier-safe variant of the above (same diagnostic, written to survive aggressive minification). Use if the standard one breaks when pasted through a build/console that mangles it. |
| `amenti-readroom-test.js` | Light deploy check for the Reading Room. Drives the real Read-aloud button and watches its label; reaching **⏹ Stop** proves the new chunked `library.js` is live (only the new code shows that state). Use after deploying `library.js` to confirm it took. |
| `amenti-roster-lookup-test.js` | Proves the browser can fetch the published roster CSV and find a figure by **lower-cased full name** — the embodiment join (`catalog.name` → roster "Full Name"). Use when a figure resolves to the wrong voice (or the default) instead of their own. |
| `speak-stream.js` | The original standalone chunked-streaming pipeline (Stage-I "The Voice That Carries"), before it was lifted into `amenti-throttle.js`. Historical reference — the ancestor of the shipped throttle. Handy for diffing if throttle behavior ever drifts. |
| `THROTTLE_WIRING.md` | Older "how to wire a surface to the throttle" guide. Superseded by the **Terminal Velocity** appendix in the chronicle and by `HANDOFF.md`, but kept for the extra wiring detail. |

## Quick triage map
- **No audio / measure times out** → `amenti-speak-diagnostic.js`
- **Reading Room didn't update after deploy** → `amenti-readroom-test.js`
- **Figure speaks in the wrong / default voice** → `amenti-roster-lookup-test.js`
- **Need to compare current throttle vs. the original pipeline** → `speak-stream.js`

For the canonical engineering reference (API, locked constants, parity check,
deploy steps), see `../HANDOFF.md` or the *Terminal Velocity* appendix in
`../Amenti_The_Voice_That_Carries.html`.
