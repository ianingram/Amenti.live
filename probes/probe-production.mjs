#!/usr/bin/env node
/* ============================================================================
   probes/probe-production.mjs  ·  THE BOOK, MEASURED
   ----------------------------------------------------------------------------
   Walks BOOK.json against book/ and writes PRODUCTION.json: every chapter, its
   state, its size, the bands it carries, and the day it landed.

     node probes/probe-production.mjs > PRODUCTION.json

   ── WHY A PROBE AND NOT A DOCUMENT ────────────────────────────────────────
   A production tracker with the chapter list typed into it is a DOCUMENT
   PRETENDING TO BE AN INSTRUMENT. It is correct on the day it is written and
   drifts the moment a chapter lands, and the drift is invisible — which is the
   fault this whole fleet exists to catch, committed by the thing built to
   watch the work.

   So nothing here is stated. The register says which chapters exist; the disk
   says which are written; GIT SAYS WHEN. A timeline read from commit dates is
   a record of when chapters ACTUALLY SHIPPED, not when somebody meant them to.

   ── THE FOUR MOVEMENTS ────────────────────────────────────────────────────
   The work is one book in four movements, chronological:

       APRIL – MAY     the helix, Page 2          no contemporaneous record
       JUNE            ASCENSION                  cognition, then voice
       JULY            THE LONG CLIMB             written and typeset
       4 – 7 JULY      THE SIEGE                  written that week
       JULY – AUGUST   THE SHIP                   the apparatus begins

   The first three are PROSE — nothing was measurable yet, and a chapter about
   June cannot show a live number. The fourth carries the five bands, because
   by then the system could be read.

   THE TURN BETWEEN THE FORMS IS NOT A CHANGE OF STYLE.
   IT IS THE MOMENT THE THING BECAME MEASURABLE.

   ── WHAT IT REFUSES TO CLAIM ──────────────────────────────────────────────
   That a written chapter is a GOOD chapter. It counts words and finds band
   markers. It cannot read.

   And it will not call a chapter late. A schedule this book does not have
   cannot be missed — the store's own law is that no chapter publishes before
   the thing it describes, so a chapter waiting on the bell is CORRECTLY
   waiting, not overdue.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const CHECK = process.argv.includes('--check');

const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

/* ── THE REGISTER IS THE AUTHORITY ───────────────────────────────────────
   BOOK.json is what read.html walks. If this probe kept its own list there
   would be two copies of one truth, which is the fault that let the Harbor
   grid and the nav bar disagree about how many panes exist. */
const reg = (() => {
  const t = read('BOOK.json');
  if (!t) return null;
  try { return JSON.parse(t); } catch { return null; }
})();
if (!reg || !Array.isArray(reg.chapters)) {
  console.error('REFUSES: BOOK.json could not be read. There is no register to walk.');
  process.exit(2);
}

/* ── THE MOVEMENTS COME FROM THE REGISTER ────────────────────────────────
   The first cut of this probe CARRIED ITS OWN LIST of the four movements,
   and said so in a comment calling it "the one authored thing in this probe".

   That was the fault, stated in its own file and shipped anyway. A second copy
   of the chronology would drift from BOOK.json the first time a movement
   changed, and the drift would be invisible — which is exactly how the Harbor
   grid and the nav bar came to disagree about how many panes exist.

   BOOK.json is the register. This reads it. */
const MOVEMENTS = Array.isArray(reg.movements) ? reg.movements : [];
if (!MOVEMENTS.length) {
  console.error('::warning::BOOK.json declares no movements — the chronology will be absent from the reading');
}

/* ── WHEN DID IT LAND ────────────────────────────────────────────────────
   From git, not from the file. A chapter's mtime is when it was last touched;
   its first commit is when it SHIPPED, and those are different facts. */
function landed(rel) {
  try {
    return execSync('git log --diff-filter=A --follow --format=%ad --date=short -1 -- ' + JSON.stringify(rel),
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch { return null; }
}
function touched(rel) {
  try {
    return execSync('git log --format=%ad --date=short -1 -- ' + JSON.stringify(rel),
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch { return null; }
}

const BAND = /^##\s*⟦([A-Z]+)⟧\s*(.*)$/gm;
const FIVE = ['SPELL', 'MECHANISM', 'PRIMER', 'PLATE', 'ROADMAP'];

const rows = reg.chapters.map(c => {
  const r = {
    n: c.n, movement: c.movement || null,
    title: c.title, volume: c.volume || null, book: c.book || null,
    blurb: c.blurb || null, file: c.file || null,
    why: c.why || null,
  };

  if (!c.file) { r.state = 'PLANNED'; return r; }

  const text = read(c.file);
  if (!text) {
    /* IN THE REGISTER, NOT ON DISK. The reader will show THE UNWRITTEN PAGE,
       which is correct behaviour — but a chapter declaring a file it does not
       have is worth naming separately from one that never claimed one. */
    r.state = 'DECLARED, NOT WRITTEN';
    return r;
  }

  r.words   = text.split(/\s+/).filter(Boolean).length;
  r.kb      = Math.round(text.length / 102.4) / 10;
  r.landed  = landed(c.file);
  r.touched = touched(c.file);

  const found = [...text.matchAll(BAND)].map(m => m[1]);
  r.bands = found;
  r.missingBands = FIVE.filter(b => !found.includes(b));

  /* PROSE IS NOT AN INCOMPLETE CHAPTER. A chapter with no bands in a prose
     movement is FINISHED; the same chapter in the apparatus is not. The
     register declares which form a chapter is written in, so the probe can
     now tell the difference instead of guessing from the file. */
  r.declaredForm = c.form || null;
  r.foundForm    = found.length ? 'apparatus' : 'prose';
  r.form         = r.declaredForm || r.foundForm;

  if (r.form === 'apparatus' && r.missingBands.length) {
    r.state = 'WRITTEN · PARTIAL APPARATUS';
  } else if (r.declaredForm && r.declaredForm !== 'apparatus' && found.length) {
    /* BANDS WHERE NONE WERE DECLARED. Not a failure — worth naming, because
       a prose chapter that grew an apparatus has either changed form or
       strayed into one. */
    r.state = 'WRITTEN · UNDECLARED BANDS';
  } else {
    r.state = 'WRITTEN';
  }
  return r;
});

const by = s => rows.filter(r => r.state.startsWith(s)).length;
const written = rows.filter(r => r.words);
const totals = {
  chapters: rows.length,
  written: written.length,
  planned: by('PLANNED'),
  declaredNotWritten: by('DECLARED'),
  words: written.reduce((n, r) => n + r.words, 0),
  prose: written.filter(r => r.form === 'prose').length,
  apparatus: written.filter(r => r.form === 'apparatus').length,
};

/* PER MOVEMENT. The register says which movement a chapter belongs to, so the
   pane can show progress by movement rather than one flat count — and a
   movement that is finished elsewhere (The Long Climb is written and typeset)
   reads as 0 of 6 here, which is TRUE OF THIS REPOSITORY and not true of the
   work. The note on each movement says so. */
for (const m of MOVEMENTS) {
  const mine = rows.filter(r => r.movement === m.id);
  m.chapters = mine.length;
  m.writtenHere = mine.filter(r => r.words).length;
  m.words = mine.reduce((n, r) => n + (r.words || 0), 0);
}

/* ── THE TIMELINE ────────────────────────────────────────────────────────
   Only what actually shipped, in the order it shipped. A plan is not a
   timeline; a timeline is a record. */
const timeline = written
  .filter(r => r.landed)
  .sort((a, b) => a.landed.localeCompare(b.landed))
  .map(r => ({ on: r.landed, n: r.n, title: r.title, words: r.words }));

console.log(JSON.stringify({
  _: 'GENERATED by probes/probe-production.mjs — do not edit. The book, measured against BOOK.json.',
  _law: 'No chapter publishes before the thing it describes. A chapter waiting on the bell is CORRECTLY waiting, not overdue.',
  _refuses: 'It counts words and finds band markers. It cannot read, and it will not tell you whether a chapter is any good.',
  generated: new Date().toISOString(),
  title: reg.title || null,
  through: 'We built to spec in order to unlock the gates.',
  movements: MOVEMENTS,
  totals,
  timeline,
  chapters: rows,
}, null, 2));

/* NOTHING HERE FAILS A RUN. An unwritten chapter is not a fault — it is a
   chapter that has not been written, and a red light every day until it is
   would teach its reader to stop looking. */
if (CHECK) process.exit(0);
