#!/usr/bin/env node
/* ============================================================================
   probe-citations.mjs  ·  THE CITATION AUDIT
   ----------------------------------------------------------------------------
       node probes/probe-citations.mjs            report
       node probes/probe-citations.mjs --write    also write CITATIONS.json
       node probes/probe-citations.mjs --room plato

   Reads LIBRARY.json and grades every work's `source` — because the library
   probe faithfully records what the manifests say and NOTHING READS WHAT IT
   RECORDS. On 29 Aug 2026 it had been reporting 77 blank sources in the Lincoln
   room, on the most-quoted figure on the site, for as long as they had been
   blank.

       AN EMPTY SOURCE STRING READS AS A FIELD RATHER THAN A GAP.

   That is the whole reason this exists. A missing citation does not look like
   an error in a JSON file; it looks like a key with a short value. Something
   has to go and count them.

   THE FOUR GRADES
     CITED    an edition that can be found again — a Gutenberg number, an
              Internet Archive item, a named scan. THE ONLY GRADE THAT IS DONE.
     DATED    a work and a year but no edition identifier. Findable by a
              person, not by a machine, and ambiguous where a translator
              revised.
     THIN     a translator or a title and nothing to locate it by. "Jowett
              translation" names WHO but not WHICH — and for a text in
              translation the edition is half the citation, because a famous
              line can exist in one English text and not another.
     EMPTY    no source at all.

   AND ONE THAT IS NOT A FAULT
     LINKED   the room sends the reader out to the text rather than storing it,
              or points at another shelf on this same site. A url IS a
              citation. Musashi is link-out; Nimrod's Josephus entry points at
              Josephus's own shelf here. Counting those as faults would teach
              the reader to ignore the report, which is how a guard dies.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIBRARY = process.env.LIBRARY_JSON || join(HERE, '..', 'LIBRARY.json');
const OUT     = process.env.CITATIONS_OUT || join(HERE, '..', 'CITATIONS.json');

const args  = process.argv.slice(2);
const write = args.includes('--write');
const only  = (() => { const i = args.indexOf('--room'); return i > -1 ? args[i + 1] : null; })();

if (!existsSync(LIBRARY)) {
  console.error('probe-citations: no LIBRARY.json at ' + LIBRARY +
                '\nRun probes/probe-library.mjs first — this reads its reading.');
  process.exit(2);
}
const lib = JSON.parse(readFileSync(LIBRARY, 'utf8'));
const rooms = lib.rooms || [];

/* ── the grader ────────────────────────────────────────────────────────── */
const EDITION = /(?:Project\s+)?Gutenberg\s*#\s*\d+|\bPG\s*#?\d+|gutenberg\.org\/(?:ebooks|files)\/\d+/i;
const ARCHIVE = /Internet\s+Archive|archive\.org|Loeb Classical Library|Hakluyt Society/i;
const YEAR    = /\b(1[5-9]\d\d|20[0-2]\d)\b/;
/* A pointer OUT is not a missing citation. Kept narrow on purpose — a loose
   pattern here would excuse the very gaps this probe exists to find. */
const OWN     = /Ingram Manor(?:\s+LLC)?/i;
const LINKED  = /\bsee note\b|stands on .*shelf on this site|Room manifest/i;

function grade(src) {
  const s = String(src || '').trim();
  if (!s)             return 'EMPTY';
  if (LINKED.test(s)) return 'LINKED';
  if (EDITION.test(s)) {
    /* "Project Gutenberg · public domain" has the words and no number — the
       Hume room's thirteen entries all read exactly that way, so the test
       must be for the IDENTIFIER, never for the publisher's name. */
    return 'CITED';
  }
  if (ARCHIVE.test(s)) return 'CITED';
  /* AN ORIGINAL WORK NEEDS NO GUTENBERG NUMBER. "Ian Ingram, The Siege of
     Amenti (2026) · Ingram Manor LLC" is a complete citation — author, title,
     year, publisher — and the first version of this probe graded all six of
     his as DATED for lacking an identifier that cannot exist for a work this
     project published itself. The same class of error as counting a link-out
     as a missing source: a rule that flags correct work teaches the reader to
     ignore the report. */
  if (OWN.test(s)) return 'CITED';
  if (YEAR.test(s))    return 'DATED';
  return 'THIN';
}

/* what a room needs, said as an instruction rather than a grade */
function need(counts, sample) {
  if (counts.EMPTY) return 'no source at all — find the edition, then tools/cite.js';
  if (counts.THIN) {
    if (/trans|tr\.|translation/i.test(sample)) return 'names a translator, not an edition';
    return 'names a work, nothing to find it by';
  }
  if (counts.DATED) return 'a year but no edition identifier';
  return '';
}

/* ── the run ───────────────────────────────────────────────────────────── */
const reading = { generated: new Date().toISOString(), source: 'LIBRARY.json',
                  libraryGenerated: lib.generatedAt || null,
                  totals: { works: 0, CITED: 0, DATED: 0, THIN: 0, EMPTY: 0, LINKED: 0 },
                  rooms: {} };

const flagged = [];
for (const r of rooms) {
  if (only && r.key !== only) continue;
  const counts = { CITED: 0, DATED: 0, THIN: 0, EMPTY: 0, LINKED: 0 };
  let firstBad = '';
  for (const w of (r.works || [])) {
    const g = grade(w.source);
    counts[g]++;
    reading.totals[g]++;
    reading.totals.works++;
    if (!firstBad && (g === 'THIN' || g === 'DATED')) firstBad = w.source || '';
  }
  reading.rooms[r.key] = { works: (r.works || []).length, ...counts,
                           needs: need(counts, firstBad) };
  if (counts.EMPTY || counts.THIN || counts.DATED) flagged.push({ key: r.key, counts, firstBad });
}

flagged.sort((a, b) =>
  (b.counts.EMPTY * 3 + b.counts.THIN * 2 + b.counts.DATED) -
  (a.counts.EMPTY * 3 + a.counts.THIN * 2 + a.counts.DATED));

const t = reading.totals;
const pc = (n) => t.works ? (n / t.works * 100).toFixed(1) + '%' : '—';

console.log('');
console.log('╔' + '═'.repeat(72) + '╗');
console.log('  THE CITATION AUDIT · ' + rooms.length + ' rooms · ' + t.works + ' works');
console.log('╚' + '═'.repeat(72) + '╝');
console.log('');
if (lib.generatedAt) console.log('  the reading it audits was taken ' + lib.generatedAt);
console.log('');
console.log('  CITED   ' + String(t.CITED).padStart(4) + '   ' + pc(t.CITED) +
            '   an edition that can be found again');
console.log('  LINKED  ' + String(t.LINKED).padStart(4) + '   ' + pc(t.LINKED) +
            '   sent out to the text — a url IS a citation');
console.log('  DATED   ' + String(t.DATED).padStart(4) + '   ' + pc(t.DATED) +
            '   a year, no edition identifier');
console.log('  THIN    ' + String(t.THIN).padStart(4) + '   ' + pc(t.THIN) +
            '   a name with nothing to find it by');
console.log('  EMPTY   ' + String(t.EMPTY).padStart(4) + '   ' + pc(t.EMPTY) +
            '   no source at all');
console.log('');

if (!flagged.length) {
  console.log('  Every work in every room carries a findable source.');
  console.log('');
  if (write) { writeFileSync(OUT, JSON.stringify(reading, null, 2)); console.log('  wrote ' + OUT); }
  process.exit(0);
}

console.log('  ' + '─'.repeat(72));
/* Node's console.log has no printf. The first version passed a format string
   AND six arguments and printed both — the literal %5s beside the values. */
console.log('  ' + 'ROOM'.padEnd(20) + 'WORKS'.padStart(5) + 'EMPTY'.padStart(7) +
            'THIN'.padStart(6) + 'DATED'.padStart(6) + '   WHAT IT NEEDS');
console.log('  ' + '─'.repeat(72));
for (const f of flagged) {
  const c = f.counts;
  console.log('  ' + f.key.padEnd(20) +
              String(reading.rooms[f.key].works).padStart(5) +
              String(c.EMPTY || '').padStart(7) +
              String(c.THIN || '').padStart(6) +
              String(c.DATED || '').padStart(6) +
              '   ' + reading.rooms[f.key].needs);
}
console.log('');
console.log('  ' + flagged.length + ' room' + (flagged.length === 1 ? '' : 's') +
            ' of ' + rooms.length + ' need a citation.');
console.log('');
console.log('  A THIN SOURCE IS NOT A SMALL FAULT WHERE THERE IS A TRANSLATOR.');
console.log('  "Jowett translation" names WHO but not WHICH, and for a text in');
console.log('  translation the edition is half the citation — a famous line can');
console.log('  exist in one English text and not in another.');
console.log('');

if (write) {
  writeFileSync(OUT, JSON.stringify(reading, null, 2));
  console.log('  wrote ' + OUT);
  console.log('');
}

/* EMPTY fails the run; THIN and DATED are reported and do not. A gap somebody
   is working through should not hold a workflow red for weeks — but a work
   with NO source at all is a quotation waiting to be unattributable. */
process.exit(t.EMPTY ? 1 : 0);
