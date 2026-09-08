#!/usr/bin/env node
/* ============================================================================
   probe-twins.mjs  →  Amenti.live/probes/probe-twins.mjs
   ----------------------------------------------------------------------------
   THE SAME FILE IN TWO PLACES, AND WHICH ONE ANYTHING ACTUALLY READS.

       node probes/probe-twins.mjs .

   Five probes exist in both the repository root and `probes/`:

       probe-attica · probe-citations · probe-geo · probe-post · probe-surfaces

   plus probe14.js, probe15.js and posts-example.json. Today the pairs match,
   because both were uploaded together. NOTHING KEEPS THEM MATCHING. A workflow
   pointing at root gets one copy and a workflow pointing at `probes/` gets the
   other, and the day someone fixes one of them the fleet quietly holds two
   different answers to the same question.

   ── WHY THIS IS A PROBE AND NOT A DELETION ────────────────────────────────
   The obvious move is to delete the root copies. IT IS NOT SAFE UNTIL SOMEONE
   KNOWS WHAT READS THEM, and nobody does — the workflows were written across
   weeks by different sessions, and a path is easy to write and invisible to
   check.

   > **A DELETION IS THE ONE ACTION A PROBE CANNOT UNDO. So this probe deletes
   > nothing. It reads every workflow, every script and every page, and reports
   > WHICH COPY EACH ONE NAMES.**

   ── AND IT REPORTS THE DIFFERENCE, NOT JUST THE DUPLICATION ───────────────
   Two identical copies are untidy. Two copies that have DRIFTED are a fault
   already in the water, and the byte comparison is the only way to tell the
   difference — a listing shows both dated "17 hours ago" whether they agree
   or not.

   RULE 4 · RETURN TEN TIMES WHAT IT COST. Findings, not confirmations. A pair
   that matches and is referenced consistently gets one line at the end.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.argv[2] || '.';
const OUT = [];
const say = (s = '') => { OUT.push(s); console.log(s); };

const hash = p => crypto.createHash('sha256')
  .update(fs.readFileSync(p)).digest('hex').slice(0, 12);

/* every place a path could be written down */
const SEARCH_DIRS = ['.', 'probes', 'tools', 'scripts', '.github/workflows'];
const SEARCH_EXT = new Set(['.yml', '.yaml', '.js', '.mjs', '.html', '.py', '.sh', '.md']);

function listFiles(dir) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => path.join(dir, d.name));
}

say('='.repeat(74));
say('  PROBE · TWINS · the same file in two places');
say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
say('='.repeat(74));
say('');
say('0 · WHAT THIS CANNOT SEE');
say('  · Anything outside this repository. A workflow in Fleet-Documents that');
say('    reaches in here would not be found.');
say('  · A path built at run time — `probes/${name}.mjs` and the like. It reads');
say('    LITERAL text, so a constructed path is invisible to it.');
say('  · Which copy is CORRECT. It can say they differ. It cannot say which of');
say('    two versions of a probe is the one anybody wanted.');

const rootFiles = listFiles('.');
const probeFiles = listFiles('probes');
const rootNames = new Map(rootFiles.map(f => [path.basename(f), f]));
const twins = [];
for (const f of probeFiles) {
  const b = path.basename(f);
  if (rootNames.has(b)) twins.push([b, rootNames.get(b), f]);
}

if (!twins.length) {
  say('');
  say('  NO TWINS. Nothing in probes/ shares a name with anything at root.');
  process.exit(0);
}

/* read every candidate file once and look for each twin's name */
const corpus = [];
for (const d of SEARCH_DIRS) {
  for (const f of listFiles(d)) {
    if (!SEARCH_EXT.has(path.extname(f))) continue;
    try { corpus.push([f, fs.readFileSync(path.join(ROOT, f), 'utf8')]); }
    catch (e) { /* unreadable is not a finding */ }
  }
}

say('');
say(`1 · ${twins.length} FILE(S) EXIST IN BOTH ROOT AND probes/`);
say('');

let drifted = 0, ambiguous = 0;
for (const [name, rp, pp] of twins) {
  const hr = hash(path.join(ROOT, rp)), hp = hash(path.join(ROOT, pp));
  const same = hr === hp;
  if (!same) drifted++;

  /* who names which */
  const namesRoot = [], namesProbes = [], namesBare = [];
  for (const [f, text] of corpus) {
    if (path.basename(f) === name) continue;          /* not itself */
    const hasProbes = text.includes('probes/' + name);
    const bare = new RegExp('(^|[^/\\w])' + name.replace('.', '\\.'), 'm').test(text);
    if (hasProbes) namesProbes.push(f);
    else if (bare) namesBare.push(f);
  }

  say(`  ${name}`);
  say(`     root    ${hr}`);
  say(`     probes/ ${hp}   ${same ? '\u2014 identical today' : '\u2190 THE TWO HAVE DRIFTED'}`);
  if (namesProbes.length) {
    say(`     named as probes/${name} by: ${namesProbes.join(', ')}`);
  }
  if (namesBare.length) {
    say(`     named WITHOUT a folder by:  ${namesBare.join(', ')}`);
    say(`        \u2014 which copy that resolves to depends on the working directory`);
    ambiguous++;
  }
  if (!namesProbes.length && !namesBare.length) {
    say('     NAMED BY NOTHING IN THIS REPOSITORY.');
    say('        Either it is run by hand, or it is dead. Both are worth knowing');
    say('        and this probe cannot tell them apart.');
  }
  say('');
}

say('-'.repeat(74));
say(`  ${twins.length} twin(s) \u00b7 ${drifted} drifted \u00b7 ${ambiguous} named without a folder`);
if (drifted) {
  say('');
  say('  A DRIFTED PAIR IS A FAULT ALREADY IN THE WATER. Two answers to one');
  say('  question, and whichever a workflow happens to reach is the one the');
  say('  fleet believes.');
}
say('');
say('  DELETE NOTHING ON THIS READING ALONE. A file named by nothing here may');
say('  still be run by hand, or reached from another repository. The next move');
say('  is to point every reference at one copy, RUN THE WORKFLOWS, and only');
say('  then remove the other.');
say('-'.repeat(74));

try {
  fs.writeFileSync(path.join(ROOT, 'probe-twins.txt'), OUT.join('\n') + '\n');
  console.log('\n  written to probe-twins.txt — the body always arrives');
} catch (e) { /* the console reading stands on its own */ }
