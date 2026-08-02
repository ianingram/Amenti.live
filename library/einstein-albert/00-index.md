# Einstein — Reading Room Manifest

**Status:** GREEN. Public-domain text exists for the scientific corpus. The political, personal, and epistolary Einstein is walled.

**Scouted:** 1 August 2026
**Primary repository:** Project Gutenberg, author ID 1630 (13 items listed)

---

## Tier 1 — Core primary texts (build from real text)

| # | Text | File | Source |
|---|------|------|--------|
| 1 | Relativity: The Special and General Theory (1920, Lawson trans.) | `01-relativity.md` | PG #5001 |
| 2 | Relativity — German original | `02-relativitaetstheorie-de.md` | PG #77850 |
| 3 | The Principle of Relativity (with Minkowski) | `03-principle-of-relativity.md` | PG #66944 |
| 4 | The Meaning of Relativity (Princeton lectures, 1921) | `04-meaning-of-relativity.md` | PG #36276 |
| 5 | Sidelights on Relativity (two addresses) | `05-sidelights.md` | PG #7333 |
| 6 | Fundamental Ideas and Problems (Nobel lecture) | `06-nobel-lecture.md` | PG #69572 |

Note: PG holds four separate editions of *Relativity* (#5001, #28801, #30155, #36114). These are
the same book. #5001 and #36114 are both Lawson's authorised 1920 translation. Take one. The
others are shelf noise.

## Tier 2 — The 1905 papers

See `07-1905-papers.md`. Not on Gutenberg as standalone items; public domain via the 1923
Methuen translations.

## Tier 3 and walled material

See `08-linkouts.md`.

---

## Ingestion status

**Ingested: 2 of 6.** - `05-sidelights.md` — both addresses complete, ~8,400 words. Pure prose.
- `01-relativity.md` — complete, ~33,500 words, Appendices I-IV. Appendix V confirmed absent
  (still in copyright). 233 equations preserved as `[EQ: ...]` spoken-form readings, not
  typeset; a PDF source will be needed if the room must display mathematics.

Both converted from user-supplied EPUBs entirely on disk.

**Working method:** direct fetch fails — text pulled into the model's context cannot be written
back out at scale. Upload-and-convert works. The user downloads the EPUB or plain text from
Gutenberg, uploads it, and conversion runs file-to-file without the text passing through
context. Repeatable for the remaining five.

Original note, retained: no full text had been pulled into these files — the container's network denies
`gutenberg.org`, `archive.org`, and `en.wikisource.org` at the proxy. Each file below carries
the exact retrieval URLs. To automate ingestion, add those three domains to network settings.
Otherwise the texts can be fetched one at a time through search/fetch and pasted in.
