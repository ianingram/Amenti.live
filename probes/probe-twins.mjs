#!/usr/bin/env node
/* ============================================================================
   probe-twins.mjs  →  Amenti.live/probes/probe-twins.mjs
   ----------------------------------------------------------------------------
   THE SAME FILE IN TWO PLACES, AND WHICH ONE ANYTHING ACTUALLY READS.

       node probes/probe-twins.mjs .

   Files can exist in both the repository root and `probes/`. Today the pairs
   may match, because both were uploaded together. NOTHING KEEPS THEM MATCHING.
   A workflow pointing at root gets one copy and a workflow pointing at
   `probes/` gets the other, and the day someone fixes one of them the fleet
   quietly holds two different answers to the same question.

   First run, 8 Sep: 9 twins, 2 DRIFTED. `SEATS.csv` existed twice with
   different contents and was named without a folder by fifteen things —
   including `amenti-map.js` and four probes. The map read one copy and a probe
   may have been checking the other.

   ── WHY THIS IS A PROBE AND NOT A DELETION ────────────────────────────────
   > **A DELETION IS THE ONE ACTION A PROBE CANNOT UNDO. So this probe deletes
   > nothing. It reads every workflow, every script and every page, and reports
   > WHICH COPY EACH ONE NAMES.**

   ── AND IT ACCUSED ITSELF ON THE FIRST RUN · fixed 8 Sep ──────────────────
   It reported `posts-example.json`, `probe14.js` and `probe15.js` as "named
   without a folder by probes/probe-twins.mjs" — BY ITSELF, in the very comment
   block explaining that they were doubled. The workflow did the same.

   A PROBE THAT NAMES A FILE IN ORDER TO REPORT ON IT IS NOT A READER OF THAT
   FILE, and counting it as one turns every finding into evidence for itself.
   The probe and its own workflow are now excluded from the corpus, and the
   exclusion is stated in section 0 rather than hidden — a probe that quietly
   skips things is worse than one that names what it skipped.

   ── AND IT COULD NOT TELL A DEPENDENCY FROM A SENTENCE · fixed 8 Sep ──────
   The first run flagged `probe-geo.mjs` as "named without a folder by
   probes/extents.mjs and probes/geo-tier.mjs". Both were about to be edited to
   point at `probes/`. NEITHER USES probe-geo AT ALL — all four mentions are
   prose in comment blocks explaining where a rule came from:

       "It lived inside probe-geo.mjs, and probe-events then refused twenty
        events"

   A DOCUMENTATION REFERENCE IS NOT A DEPENDENCY, and reporting them alike
   nearly produced two edits to two files that depend on nothing.

   So a mention is now classified. A `node …`, an `import`, a `from`, a
   `require` or a `readFileSync` is a RUNNER. Anything else is a MENTION, and
   the two are reported separately, because only the first can break when a
   copy is deleted.

   RULE 4 · RETURN TEN TIMES WHAT IT COST. Findings, not confirmations.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.argv[2] || '.';
const OUT = [];
const say = (s = '') => { OUT.push(s); console.log(s); };

const hash = p => crypto.createHash('sha256')
  .update(fs.readFileSync(p)).digest('hex').slice(0, 12);

const SEARCH_DIRS = ['.', 'probes', 'tools', 'scripts', '.github/workflows'];
const SEARCH_EXT = new Set(['.yml', '.yaml', '.js', '.mjs', '.html', '.py', '.sh', '.md']);

/* ── THIS PROBE AND ITS WORKFLOW CANNOT BE WITNESSES ─────────────────────
   Both necessarily name the files they report on. Excluded by path, and the
   exclusion is printed. */
const SELF = new Set([
  'probes/probe-twins.mjs',
  'probe-twins.mjs',
  '.github/workflows/twins.yml',
  'probe-twins.txt',
  'twins.log'
]);

function listFiles(dir) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => (dir === '.' ? d.name : path.join(dir, d.name)));
}

say('='.repeat(74));
say('  PROBE · TWINS · the same file in two places');
say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
say('='.repeat(74));
say('');
say('0 · WHAT THIS CANNOT SEE, AND WHAT IT DELIBERATELY IGNORES');
say('  · Anything outside this repository. A workflow in Fleet-Documents that');
say('    reaches in here would not be found.');
say('  · A path built at run time — `probes/${name}.mjs` and the like. It reads');
say('    LITERAL text, so a constructed path is invisible to it.');
say('  · Which copy is CORRECT. It can say they differ. It cannot say which of');
say('    two versions of a probe is the one anybody wanted.');
say('  · ITSELF AND ITS OWN WORKFLOW. probe-twins.mjs and twins.yml name every');
say('    file they report on, and on the first run they were counted as readers');
say('    of it — a probe citing itself as evidence for its own finding.');

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

const corpus = [];
let skipped = 0;
for (const d of SEARCH_DIRS) {
  for (const f of listFiles(d)) {
    if (SELF.has(f)) { skipped++; continue; }
    if (!SEARCH_EXT.has(path.extname(f))) continue;
    try { corpus.push([f, fs.readFileSync(path.join(ROOT, f), 'utf8')]); }
    catch (e) { /* unreadable is not a finding */ }
  }
}

say('');
say(`1 · ${twins.length} FILE(S) EXIST IN BOTH ROOT AND probes/`);
say(`    (read ${corpus.length} files looking for references; skipped ${skipped} as self)`);
say('');

let drifted = 0, ambiguous = 0, orphan = 0;
for (const [name, rp, pp] of twins) {
  const hr = hash(path.join(ROOT, rp)), hp = hash(path.join(ROOT, pp));
  const same = hr === hp;
  if (!same) drifted++;

  const namesProbes = [], runsBare = [], mentionsBare = [];
  const esc = name.replace(/\./g, '\\.');
  /* A RUNNER EXECUTES OR READS THE FILE. Only these break on a deletion. */
  const RUNNER = new RegExp(
    '(?:node|python3?|bash|sh)\\s+[^\\n]*?' + esc +          /* node probes/x.mjs   */
    '|(?:import|from|require\\s*\\(|readFileSync\\s*\\()[^\\n]*?' + esc,
    'm');
  for (const [f, text] of corpus) {
    if (path.basename(f) === name) continue;
    if (text.includes('probes/' + name)) { namesProbes.push(f); continue; }
    if (!new RegExp('(^|[^/\\w])' + esc, 'm').test(text)) continue;
    if (RUNNER.test(text)) { runsBare.push(f); } else { mentionsBare.push(f); }
  }

  say(`  ${name}`);
  say(`     root    ${hr}`);
  say(`     probes/ ${hp}   ${same ? '\u2014 identical today' : '\u2190 THE TWO HAVE DRIFTED'}`);
  if (namesProbes.length) {
    say(`     named as probes/${name} by: ${namesProbes.join(', ')}`);
  }
  if (runsBare.length) {
    say(`     RUN or READ without a folder by: ${runsBare.join(', ')}`);
    say('        \u2014 resolves against the working directory. Every workflow on this');
    say('          ship runs `node probes/x.mjs .` FROM THE ROOT, so a bare name');
    say('          reaches the ROOT copy. THESE BREAK IF ROOT IS DELETED.');
    ambiguous++;
  }
  if (mentionsBare.length) {
    say(`     merely MENTIONED by: ${mentionsBare.join(', ')}`);
    say('        \u2014 prose, not a dependency. Deleting a copy cannot break a');
    say('          sentence about it.');
  }
  if (!namesProbes.length && !runsBare.length && !mentionsBare.length) {
    orphan++;
    say('     NAMED BY NOTHING IN THIS REPOSITORY.');
    say('        Either it is run by hand, or it is dead. Both are worth knowing');
    say('        and this probe cannot tell them apart.');
  }
  say('');
}

say('-'.repeat(74));
say(`  ${twins.length} twin(s) \u00b7 ${drifted} drifted \u00b7 ${ambiguous} RUN without a folder ` +
    `\u00b7 ${orphan} named by nothing`);
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
