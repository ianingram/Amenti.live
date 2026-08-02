# Einstein — Reading Room Manifest

**Status:** GREEN. Public-domain text exists for the scientific corpus. The political, personal, and epistolary Einstein is walled.

**Scouted:** 1 August 2026
**Primary repository:** Project Gutenberg, author ID 1630 (13 items listed)

---

## Tier 1 — Core primary texts (build from real text)

| # | Text | File | Source |
|---|------|------|--------|
| 1 | Relativity: The Special and General Theory (Lawson) | `01-relativity.md` | PG #5001 |
| 1a | Relativity, 3rd ed. (Lawson) — **preferred reading text** | `01a-relativity-3rd-ed.md` | PG #36114 |
| 2 | Relativity — German original | `02-relativitaetstheorie-de-1917.md` | PG #77850 |
| 3 | The Principle of Relativity (with Minkowski) | `03-principle-of-relativity.md` | PG #66944 |
| 4 | The Meaning of Relativity (Princeton lectures, 1921) | `04-meaning-of-relativity.md` | PG #36276 |
| 5 | Sidelights on Relativity (two addresses) | `05-sidelights.md` | PG #7333 |
| 6 | Fundamental Ideas and Problems (Nobel lecture) | `06-nobel-lecture.md` | PG #69572 |

Note: PG holds four separate editions of *Relativity* (#5001, #28801, #30155, #36114). These are
the same book. #5001 and #36114 are both Lawson's authorised 1920 translation. Take one. The
others are shelf noise.

## Tier 2 — The 1905 papers

`07-1905-papers.md` — **ingested.** "On the Electrodynamics of Moving Bodies", ~8,600 words,
1923 Methuen line via the Walker edition. Correct translation, superseding the Saha rendering.

**One damaged page (p. 22).** The conversion dropped it, and with it Einstein's closing
acknowledgement to Michele Besso — the very passage that made this translation line preferable
to Saha's. Recover from the fourmilab PDF.

## Tier 3 and walled material

See `08-linkouts.md`.

---

## Ingestion status

**Ingested: 6 of 6.** (one with an unresolved completeness question, one wrong edition) - `05-sidelights.md` — both addresses complete, ~8,400 words. Pure prose.
- `01-relativity.md` — complete, ~33,500 words, Appendices I-IV. Appendix V confirmed absent
  (still in copyright). 233 equations preserved as `[EQ: ...]` spoken-form readings, not
  typeset; a PDF source will be needed if the room must display mathematics.

- `02-relativitaetstheorie-de-1917.md` — German original, ~19,300 words. **Incomplete or an early
  printing — unresolved.** Breaks off around the English Ch. XXV; Part III and appendices
  absent. See the warning block in that file before using it. Formulae are text, not images,
  so notation survives better here than in the English.

- `06-nobel-lecture.md` — complete, ~3,800 words. **Best formula fidelity in the set**: all 38
  equations preserved as real LaTeX, because this Gutenberg build carries `data-tex`
  attributes. Worth checking whether a `data-tex` edition of #5001 exists — if so, re-pull
  `01-relativity.md`, whose 233 equations are currently spoken-form only.

- `04-meaning-of-relativity.md` — complete, ~28,800 words. Carve-out **resolved**: Lectures
  I-IV only, no later appendices, cleanly public domain. 1,165 equations as renderable LaTeX.
- `03-principle-of-relativity.md` — complete, ~60,500 words, but **the wrong edition**. This is
  the Saha/Bose Calcutta 1920 translation, not the 1923 Methuen line. Contains the abridged
  1905 paper; "Besso" confirmed absent. Keep as a variant and as reception history; a Methuen
  edition is still needed for the primary text.

All converted from user-supplied EPUBs entirely on disk.

## Formula fidelity — which builds carry LaTeX

Newer Gutenberg productions embed `data-tex`; older ones do not. Confirmed:

| File | Equations | Form |
|---|---|---|
| `04-meaning-of-relativity.md` | 1,165 | LaTeX — renderable |
| `06-nobel-lecture.md` | 38 | LaTeX — renderable |
| `03-principle-of-relativity.md` | 125 | spoken-form only |
| `01-relativity.md` | 233 | spoken-form only |

**Resolved.** #36114 is a `data-tex` build — ingested as `01a-relativity-3rd-ed.md`, with 738
renderable equations. But it is not a straight replacement for #5001:

- **Mathematics:** #36114 wins (738 LaTeX vs 233 unrenderable).
- **Ch. II place-name:** #36114 wins — retains Potsdamer Platz and Trafalgar Square, with none
  of the "Times Square" substitution #5001's transcribers introduced.
- **Appendices:** #5001 wins — carries I-IV; #36114 carries I-III only.

**Standing decision:** `01a` is the primary reading text; `01` is retained for Appendix IV and
as the record of the place-name substitution. Both stay. Appendix V absent from both, as
expected.

The general lesson for other figures: two Gutenberg productions of the same book can differ in
translation fidelity, apparatus, and markup quality all at once. Check more than one before
settling.

**Working method:** direct fetch fails — text pulled into the model's context cannot be written
back out at scale. Upload-and-convert works. The user downloads the EPUB or plain text from
Gutenberg, uploads it, and conversion runs file-to-file without the text passing through
context. Repeatable for the remaining five.

Original note, retained: no full text had been pulled into these files — the container's network denies
`gutenberg.org`, `archive.org`, and `en.wikisource.org` at the proxy. Each file below carries
the exact retrieval URLs. To automate ingestion, add those three domains to network settings.
Otherwise the texts can be fetched one at a time through search/fetch and pasted in.
