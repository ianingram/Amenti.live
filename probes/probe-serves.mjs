#!/usr/bin/env node
/* ============================================================================
   probe-serves.mjs  ·  DOES WHAT WE CLAIM SERVES A NEED ACTUALLY EXIST?
   ----------------------------------------------------------------------------
       node probes/probe-serves.mjs           report
       node probes/probe-serves.mjs --write   also write SERVES.json
       node probes/probe-serves.mjs --need "the corpus"

   Reads SERVES.semantics.json — the authored answer to WHAT ALREADY SERVES
   THIS — and checks every file it names against SOURCES.json, the index of
   what is actually in the repos.

   WHY. This register exists because things were built twice: a corpus was
   written while LIBRARY.json held 550 works, and a reader's manual while an
   operator's map was what had been asked for. The cure is a register keyed by
   NEED rather than by path — and a register keyed by need has a failure mode
   of its own.

       AN ENTRY POINTING AT A FILE THAT IS NOT THERE IS WORSE THAN NO ENTRY.

   A builder who looks up "the corpus", reads that LIBRARY.json serves it, and
   finds nothing at that path has been sent somewhere by a document that was
   confident. That is the Silent Signature with a helpful voice, and it is
   what this probe is for.

   WHAT IT CANNOT DO, AND SAYS SO. It cannot find a need nobody has written
   down. A walk verifies that a named file exists; it cannot invent the
   question that file answers. THE GAP THAT MATTERS IS ALWAYS THE ONE NOT IN
   THE FILE, and no instrument closes it — only the discipline of looking a
   need up before building it.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEM   = process.env.SERVES_SEM   || join(HERE, '..', 'SERVES.semantics.json');
const INDEX = process.env.SOURCES_JSON || join(HERE, '..', 'SOURCES.json');
const OUT   = process.env.SERVES_OUT   || join(HERE, '..', 'SERVES.json');

const args  = process.argv.slice(2);
const write = args.includes('--write');
const only  = (() => { const i = args.indexOf('--need'); return i > -1 ? args[i + 1] : null; })();

if (!existsSync(SEM)) {
  console.error('probe-serves: no ' + SEM);
  process.exit(2);
}
const sem = JSON.parse(readFileSync(SEM, 'utf8'));
const serves = sem.serves || {};

/* ── the index of what really exists ───────────────────────────────────── */
let known = null, indexVia = null;
if (existsSync(INDEX)) {
  const idx = JSON.parse(readFileSync(INDEX, 'utf8'));
  known = new Set();
  for (const group of Object.values(idx.sources || {}))
    for (const doc of group) if (doc.path) known.add(doc.path);
  for (const p of (idx.drift && idx.drift.unindexed) || []) known.add(p);
  indexVia = INDEX + '  (' + known.size + ' paths)';
}

/* A path ending in / is a folder, and one holding {key} is a pattern. Neither
   appears in the index as itself, and calling them missing would be a rule
   that flags correct work. */
const isPattern = (p) => p.endsWith('/') || p.includes('{');

/* ── NOT IN THE INDEX IS NOT THE SAME AS NOT THERE ────────────────────────
   The first run of this probe called amenti-doctrine.js and amenti-visits.js
   BROKEN. Both exist. They are absent from SOURCES.json because THE WALK DOES
   NOT COVER ROOT-LEVEL .js AT ALL — its root rule is ^[^/]+\.(md|json)$, so
   the whole engine is unindexed: amenti-voice.js, amenti-chat.js,
   amenti-dial.js, every one of them.

   So this probe cannot say a file is missing. It can only say the index does
   not know about it, which has two causes and they are not interchangeable —
   PROBE CORPS RULE 2. Reporting the wrong one would be a rule that flags
   correct work, and a rule that flags correct work teaches the reader to
   ignore the report. */
const INDEX_WALKS = /\.(md|json|mjs)$/;

function check(path) {
  if (isPattern(path)) return 'PATTERN';
  if (!known) return 'UNCHECKED';
  if (known.has(path)) return 'PRESENT';
  return INDEX_WALKS.test(path) ? 'MISSING' : 'UNWALKED';
}

/* ── the run ───────────────────────────────────────────────────────────── */
const reading = { generated: new Date().toISOString(),
                  counts: { needs: 0, served: 0, unserved: 0, partial: 0, missing: 0 },
                  needs: {}, missingFiles: [] };

console.log('');
console.log('╔' + '═'.repeat(72) + '╗');
console.log('  WHAT ALREADY SERVES THIS · ' + Object.keys(serves).length + ' needs named');
console.log('╚' + '═'.repeat(72) + '╝');
console.log('');
console.log('  checked against ' + (indexVia || 'NOTHING — SOURCES.json not found, so every ' +
                                    'path below is a claim nobody verified'));
console.log('');

const unserved = [], broken = [], partial = [], unwalkedFiles = [];

for (const [need, e] of Object.entries(serves)) {
  if (only && need !== only) continue;
  reading.counts.needs++;

  const files = e.servedBy || [];
  if (!files.length) {
    reading.counts.unserved++;
    unserved.push({ need, note: e.note || '' });
    reading.needs[need] = { servedBy: [], state: 'UNSERVED', note: e.note || null };
    continue;
  }

  const states = files.map(f => ({ path: f, state: check(f) }));
  const gone = states.filter(s => s.state === 'MISSING');
  const unwalked = states.filter(s => s.state === 'UNWALKED');
  if (unwalked.length) unwalkedFiles.push({ need, paths: unwalked.map(u => u.path) });
  if (gone.length) {
    reading.counts.missing += gone.length;
    gone.forEach(g => reading.missingFiles.push({ need, path: g.path }));
    broken.push({ need, gone: gone.map(g => g.path) });
  }
  /* PARTIALLY SERVED is its own state and must not read as served. The visit
     reading has a file and the file is not wired into the page. */
  const isPartial = /PARTIALLY SERVED|NOT WIRED|not wired/i.test(e.note || '');
  if (isPartial) { reading.counts.partial++; partial.push({ need, note: e.note }); }
  else if (!gone.length) reading.counts.served++;

  reading.needs[need] = {
    question: e.question || null,
    servedBy: states,
    state: gone.length ? 'BROKEN' : isPartial ? 'PARTIAL' : 'SERVED',
    answers: e.answers || null,
    doesNotAnswer: e.doesNotAnswer || null,
    note: e.note || null
  };
}

const c = reading.counts;
console.log('  SERVED     ' + String(c.served).padStart(3) + '   a file exists and answers it');
console.log('  PARTIAL    ' + String(c.partial).padStart(3) + '   built, and not fully wired');
console.log('  UNSERVED   ' + String(c.unserved).padStart(3) + '   nothing serves it, and it says so');
console.log('  BROKEN     ' + String(broken.length).padStart(3) + '   names a file the index should hold and does not');
console.log('  UNWALKED   ' + String(unwalkedFiles.length).padStart(3) + '   real, and outside what the index walks');
console.log('');

if (broken.length) {
  console.log('  ✕ BROKEN — an entry pointing somewhere nothing is.');
  console.log('    A builder who looks up a need and follows a dead path has been sent');
  console.log('    there by a document that was confident.');
  console.log('');
  broken.forEach(b => {
    console.log('    ' + b.need);
    b.gone.forEach(p => console.log('       → ' + p));
  });
  console.log('');
}

if (unwalkedFiles.length) {
  console.log('  ~ UNWALKED — named here, absent from the index, and NOT missing.');
  console.log('    SOURCES.json walks .md and .json at the root and nothing else, so the');
  console.log('    ENGINE IS INVISIBLE TO IT — amenti-voice.js, amenti-chat.js,');
  console.log('    amenti-dial.js and the rest. That is a gap in the index, not here.');
  console.log('');
  unwalkedFiles.forEach(u => {
    console.log('    ' + u.need);
    u.paths.forEach(p => console.log('       → ' + p));
  });
  console.log('');
}

if (partial.length) {
  console.log('  ~ PARTIAL — the file exists. That is not the same as it running.');
  partial.forEach(p => console.log('    ' + p.need));
  console.log('');
}

if (unserved.length) {
  console.log('  · UNSERVED — named, and nothing built. THIS IS THE HONEST STATE, not a');
  console.log('    fault: a need written down and unbuilt is a need that will not be');
  console.log('    built twice.');
  unserved.forEach(u => console.log('    ' + u.need));
  console.log('');
}

console.log('  ' + '─'.repeat(72));
console.log('  THE GAP THIS CANNOT SEE is a need nobody has written down. A walk can');
console.log('  verify a named file exists; it cannot invent the question it answers.');
console.log('  When a build begins, look the need up here FIRST — and when it is not');
console.log('  here, WRITE THE ENTRY BEFORE THE CODE.');
console.log('');

if (write) {
  writeFileSync(OUT, JSON.stringify(reading, null, 2));
  console.log('  wrote ' + OUT);
  console.log('');
}

/* A broken pointer fails the run. An unserved need does not — it is the file
   doing its job. */
process.exit(broken.length ? 1 : 0);
