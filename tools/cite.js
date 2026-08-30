#!/usr/bin/env node
/* ============================================================================
   cite.js  ·  THE CITATION STAMP
   ----------------------------------------------------------------------------
       node tools/cite.js <key> --source "<citation>" [--section "<name>"] [--write]
       node tools/cite.js <key>                        (report only — what is missing)

   Stamps a source onto every STORED work in a room manifest that has none.
   Report-only unless --write, and IT NEVER OVERWRITES AN EXISTING SOURCE — a
   citation already recorded was recorded by somebody who knew something, and
   a bulk tool is not that somebody.

   WHY IT EXISTS. lincoln.json holds 82 works and 77 of them had no source at
   all. They were not a mystery: they are one book's table of contents, in that
   book's order, in that book's editorial voice — Speeches and Letters of
   Abraham Lincoln 1832-1865, ed. Merwin Roe, Project Gutenberg #14721. The
   citation was written once, on the one work that had been pulled into its own
   file, and never propagated to the bulk import beside it.

   THE MOST-QUOTED FIGURE ON THE SITE HAD THE LEAST-SOURCED SHELF, and nothing
   was watching, because an empty string reads as a field rather than a gap.

   WHAT IT REFUSES TO DO:
     · overwrite a source that is already there
     · touch a link-out — a work with `mode: "link"` carries a url instead, and
       a url IS its citation
     · guess. The source string is given on the command line by a person who
       has checked it. This tool moves a citation; it does not invent one.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIBRARY_DIR = process.env.LIBRARY_DIR || join(HERE, '..', 'library');

const args = process.argv.slice(2);
/* TRIM. A room key typed into a web form arrives with whatever whitespace came
   with it, and on 30 Aug 2026 a leading space sent this tool looking for
   `library/ lincoln.json` and exiting 2 as though the manifest were gone. The
   argument was fine; the tool was brittle. A room key is a filename component
   and never contains whitespace, so there is nothing to preserve. */
const key = (args[0] || '').trim();
const write = args.includes('--write');
const flag = (name) => {
  const i = args.indexOf('--' + name);
  return i > -1 && args[i + 1] ? args[i + 1] : null;
};
const source  = (flag('source')  || '').trim() || null;
const section = (flag('section') || '').trim() || null;   /* optional */

if (!key || key.startsWith('--')) {
  console.error('usage: node tools/cite.js <key> [--source "<citation>"] [--section "<name>"] [--write]');
  process.exit(2);
}

const path = join(LIBRARY_DIR, key + '.json');
if (!existsSync(path)) {
  /* NAME WHAT WAS LOOKED FOR AND WHAT IS THERE. "no manifest at <path>" sends
     the reader to check a path they cannot see the inside of; the rooms that
     DO exist are the fastest way to spot a typo or a wrong key. */
  console.error('cite: no manifest for room ' + JSON.stringify(key));
  console.error('      looked at ' + path);
  try {
    const rooms = readdirSync(LIBRARY_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
    const near = rooms.filter(r => r.includes(key) || key.includes(r));
    if (near.length) console.error('      did you mean: ' + near.join(', '));
    else console.error('      rooms here: ' + rooms.slice(0, 12).join(', ') +
                       (rooms.length > 12 ? ', … ' + (rooms.length - 12) + ' more' : ''));
  } catch (e) { console.error('      and library/ could not be listed: ' + e.message); }
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(path, 'utf8'));
const works = manifest.works || [];

const line = (n = 74) => '─'.repeat(n);
console.log('');
console.log('  ' + (manifest.name || key) + ' · ' + works.length + ' works');
console.log('  ' + line());

let cited = 0, missing = 0, links = 0, stamped = 0, skipped = 0;
const gaps = [];

for (const w of works) {
  if (w.mode === 'link') { links++; continue; }
  if (w.source && String(w.source).trim()) { cited++; continue; }

  missing++;
  if (section && w.section !== section) { skipped++; continue; }
  gaps.push(w);
  if (source) { w.source = source; stamped++; }
}

console.log('  already cited   ' + cited);
console.log('  link-outs       ' + links + '   (a url is its own citation)');
console.log('  NO SOURCE       ' + missing + (skipped ? '   (' + skipped + ' outside --section)' : ''));
console.log('');

if (!missing) {
  console.log('  Every stored work in this room carries a source.');
  console.log('');
  process.exit(0);
}

if (!source) {
  /* REPORT ONLY. Show what is missing and stop — the tool will not invent a
     citation, and a run with no --source is a question, not a change. */
  console.log('  These have no source. Pass --source "<citation>" to stamp them:');
  console.log('');
  gaps.slice(0, 8).forEach(w => console.log('     ' + (w.id || '?').padEnd(6) + w.title.slice(0, 62)));
  if (gaps.length > 8) console.log('     … and ' + (gaps.length - 8) + ' more');
  console.log('');
  console.log('  A SOURCE IS NOT GUESSED HERE. Confirm the edition first — the');
  console.log('  titles and their order usually identify it exactly.');
  console.log('');
  process.exit(1);
}

console.log('  stamping ' + stamped + ' work' + (stamped === 1 ? '' : 's') + ' with:');
console.log('     ' + source);
console.log('');
gaps.slice(0, 5).forEach(w => console.log('     ' + (w.id || '?').padEnd(6) + w.title.slice(0, 62)));
if (gaps.length > 5) console.log('     … and ' + (gaps.length - 5) + ' more');
console.log('');

if (write) {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
  console.log('  wrote ' + path);
  console.log('  Now run probe-library.mjs to regenerate LIBRARY.json.');
} else {
  console.log('  (report only — pass --write to save)');
}
console.log('');
