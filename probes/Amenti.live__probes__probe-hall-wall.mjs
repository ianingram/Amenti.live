#!/usr/bin/env node
/* ============================================================================
   probes/probe-hall-wall.mjs  ·  THE HALL'S WALL
   ----------------------------------------------------------------------------
   Does the hall's system prompt still FIT?

     node probes/probe-hall-wall.mjs            # the reading
     node probes/probe-hall-wall.mjs --wall=N   # measure against a different wall

   THIS WRITES NOTHING. It is a reading.

   ── WHY IT EXISTS ─────────────────────────────────────────────────────────
   The hall sends the whole catalogue by design — every document, one line
   each — because a retrieval pass can miss and never say it missed. That is
   right, and this probe does not argue with it. But it means EVERY DOCUMENT
   ADDED TO SOURCES.json SPENDS THE HALL'S PROMPT BUDGET, and nothing watched
   the meter. The catalogue was sized when the index held 106 documents.

   The wall refuses with `system_too_long` — a 413, named in the body. It does
   not truncate. So an overrun is not a degraded hall; it is a silent hall.

   ── HOW IT MEASURES, AND WHY NOT ANY OTHER WAY ────────────────────────────
   RULE 1 IS TEST WITH REAL DATA. The obvious build — reimplement catalogueText
   here and count — is a fixture testing a fixture. It was done once, by hand,
   on 30 Aug, and produced a number that looked authoritative and was never run
   against the real function. That number was an ACCUSATION, not a reading.

   So this probe lifts the REAL functions out of the SHIPPED amenti-hall.js
   and runs those. Same reason probe11 attacks the real Worker through its real
   router rather than the guard in isolation.

   catalogueText and buildSystem are private to the hall's IIFE — the export
   block publishes ask, find, isQuestion, _flatten and _pickBriefs, and no
   more. So they are extracted from the file's own bytes by name.

   AND THE EXTRACTOR IS NOT TRUSTED EITHER. The hall DOES export _flatten. So
   the probe extracts flatten as well, runs both copies on the real register,
   and refuses to report anything if they disagree. The instrument checks its
   own lift against the file's own hand before it says one word about the wall.

   ── THE THREE RULES, APPLIED ──────────────────────────────────────────────
   1 · REAL DATA      the live SOURCES.json, the live HALL.md. No fixtures.
   2 · ATTRIBUTE      an unreadable register, an unfindable function and an
                      overrun are three DIFFERENT verdicts and say so.
   3 · NOT FOUND IS NOT FAIL   if a function cannot be lifted, the instrument
                      could not SEE. That is UNREAD, and it exits 1 as loudly
                      as a breach — but it never reports a margin it did not
                      measure. Empty box, never a comforting lie.

   ── WHAT THIS PROBE CANNOT SEE, STATED PLAINLY ────────────────────────────
   SYSTEM_CHARS is enforced in the Worker (Amenti-Workers, private). It is not
   declared anywhere in amenti-hall.js — only described in its comments. So the
   wall below is DECLARED, not read. If the Worker's value ever moves, this
   probe will keep measuring against the old one and will not know. Override it
   with --wall=N. It is labelled DECLARED in every report so the number is
   never mistaken for an observation.
   ========================================================================== */

import fs from 'fs';
import path from 'path';
import vm from 'vm';

const ARGS  = process.argv.slice(2);
const ROOT  = ARGS.find(a => !a.startsWith('--')) || '.';
const WALL  = Number((ARGS.find(a => a.startsWith('--wall=')) || '').split('=')[1]) || 20000;

/* ── THERE IS NO --check HERE, AND THAT IS DELIBERATE ─────────────────────
   The first draft carried one, copied from probe-hall without earning it.
   Run both ways it produced byte-identical output and the same exit code: a
   flag that advertised a mode and did nothing. On probe-hall, --check means
   DO NOT WRITE HALL-STATE.json. This probe writes nothing, so it has no file
   to withhold and no second mode to offer.

   A dead flag is a small lie about the instrument, and this corps does not
   keep those. If one is passed anyway — by someone copying probe-hall's
   invocation — say so rather than accepting it silently. */
if (ARGS.includes('--check')) {
  console.log('  ----    --check does nothing here: this probe never writes. Reading anyway.');
}

/* Warn before the breach, not at it. A probe that only speaks when the hall is
   already silent has watched a wall get hit rather than kept it from being. */
const WARN_AT = 0.90;

const say = m => console.log(m);
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

let pass = 0, warn = 0, fail = 0, unread = 0;
const ok     = m => { pass++;   say('  PASS    ' + m); };
const hm     = m => { warn++;   say('  WARN    ' + m); };
const bad    = m => { fail++;   say('  FAIL    ' + m); };
const blind  = m => { unread++; say('  UNREAD  ' + m); };
const note   = m => say('  ----    ' + m);

/* ── reading the registers ───────────────────────────────────────────────── */

function read(rel, asJson) {
  const p = path.join(ROOT, rel);
  try {
    const t = fs.readFileSync(p, 'utf8');
    return { ok: true, value: asJson ? JSON.parse(t) : t };
  } catch (e) {
    return { ok: false, why: rel + ' — ' + (e.code || e.message) };
  }
}

/* ── lifting the real functions out of the shipped file ──────────────────── */

/* Balanced-brace scan that knows about strings and comments. It does NOT
   understand regex literals, so it is never trusted on its own — every lift is
   compiled, and then checked against the hall's own exported copy below. */
function lift(src, name) {
  const at = src.indexOf('function ' + name);
  if (at === -1) return null;
  const open = src.indexOf('{', at);
  if (open === -1) return null;

  let depth = 0, i = open, mode = null, quote = '';
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (mode === 'line')  { if (c === '\n') mode = null; continue; }
    if (mode === 'block') { if (c === '*' && n === '/') { mode = null; i++; } continue; }
    if (mode === 'str')   { if (c === '\\') { i++; continue; } if (c === quote) mode = null; continue; }
    if (c === '/' && n === '/') { mode = 'line';  i++; continue; }
    if (c === '/' && n === '*') { mode = 'block'; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { mode = 'str'; quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return null;
}

/* A `var NAME = <literal>;` inside the IIFE. Same reason as above: the values
   that decide the budget are private, and guessing them is how a probe lies. */
function constant(src, name) {
  const m = new RegExp('var\\s+' + name + '\\s*=\\s*([^;]+);').exec(src);
  return m ? m[1].trim() : null;
}

/* ── the reading ─────────────────────────────────────────────────────────── */

say('');
say('\u2500\u2500 the hall, against its wall \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
say('');

const hallJs = read('amenti-hall.js');
const srcs   = read('SOURCES.json', true);
const hallMd = read('HALL.md');
const state  = read('HALL-STATE.json', true);

for (const r of [hallJs, srcs, hallMd, state]) if (!r.ok) blind('could not read ' + r.why);

if (unread) {
  say('');
  note('a register that cannot be read is not a hall that fits, and not a hall');
  note('that does not. Nothing is claimed about the wall.');
  say('');
  process.exit(1);
}

/* --- lift, compile, and CHECK THE LIFT before believing any of it --- */

const sandbox = { window: {}, console: { log() {} } };
vm.createContext(sandbox);

let loaded = false;
try {
  vm.runInContext(hallJs.value, sandbox, { timeout: 5000 });
  loaded = !!(sandbox.window.AmentiHall && sandbox.window.AmentiHall._flatten);
} catch (e) {
  blind('amenti-hall.js did not load in isolation — ' + e.message);
}
if (!loaded) blind('window.AmentiHall._flatten is not published — the lift cannot be checked against the hall\u2019s own hand');

const WANT = ['flatten', 'catalogueText', 'buildSystem'];
const lifted = {};
for (const n of WANT) {
  const s = lift(hallJs.value, n);
  if (!s) { blind('could not find function ' + n + '() in amenti-hall.js — renamed, or the lift is blind'); continue; }
  try {
    vm.runInContext('var ' + n + ' = ' + s.replace(/^function\s+\w+/, 'function'), sandbox);
    lifted[n] = true;
  } catch (e) {
    blind('lifted ' + n + '() but it would not compile — ' + e.message);
  }
}

/* The two things that prove we lifted the RIGHT catalogueText and not some
   other function that happens to share the name. Both are load-bearing in the
   budget: the trim decides the width of every line, the marker decides what an
   undescribed entry costs. */
if (lifted.catalogueText) {
  const body = lift(hallJs.value, 'catalogueText');
  if (!/\[undescribed\]/.test(body)) blind('the lifted catalogueText() has no [undescribed] marker — this is not the function that builds the catalogue');
}

if (unread) {
  say('');
  note('NOT FINDING SOMETHING MEANS THE INSTRUMENT COULD NOT SEE.');
  note('No margin is reported, because none was measured.');
  say('');
  process.exit(1);
}

/* --- the accusation the probe makes against itself --- */

const items    = vm.runInContext('flatten', sandbox)(srcs.value.sources);
const theirs   = sandbox.window.AmentiHall._flatten(srcs.value.sources);
const agree    = items.length === theirs.length &&
                 items.every((it, i) => it.id === theirs[i].id && it.what === theirs[i].what);

if (!agree) {
  blind('the lifted flatten() and the hall\u2019s exported _flatten() DISAGREE on the real register');
  note('the extractor is wrong. Nothing below it can be trusted, so nothing below it is said.');
  say('');
  process.exit(1);
}
ok('the lift agrees with the hall\u2019s own _flatten() on ' + num(items.length) + ' real entries');

/* --- the measurement, with the hall's own functions, on the real register --- */

const catalogue = vm.runInContext('catalogueText', sandbox)(items);

/* ── THE HOLE THIS CLOSES, FOUND BY ATTACKING THE PROBE ───────────────────
   A decoy catalogueText() that COMPILED and carried the [undescribed] marker
   returned bare ids with no glosses. The probe measured the decoy's 11,060
   chars and reported PASS — THE HALL FITS. A green light on a false reading,
   which is the one failure this corps exists to refuse.

   So the catalogue is checked for the SHAPE the hall's own rules stand on:
   one line per reachable entry, each `\u00b7 id \u2014 gloss`. Rule 3 tells the model to
   cite from this list by name and rule 3a keys on its markers; a catalogue
   without that shape is a broken hall whatever it measures.

   THIS NARROWS THE HOLE. IT DOES NOT CLOSE IT. A decoy producing
   correctly-shaped lines of the wrong width would still be believed. The only
   real defence is that the bytes are the DEPLOYED bytes — which is why this
   probe lifts from the shipped file and never carries its own copy. */
const lines  = catalogue.split('\n').filter(Boolean);
const shaped = lines.filter(l => l.startsWith('\u00b7 ') && l.includes(' \u2014 ')).length;
const want   = items.filter(i => !i.unreachable).length;

if (lines.length !== want || shaped !== lines.length) {
  blind('the catalogue is the wrong shape \u2014 ' + num(lines.length) + ' lines for ' +
        num(want) + ' entries, ' + num(shaped) + ' of them in `\u00b7 id \u2014 gloss` form');
  note('this is not a measurement of the hall. Something other than the hall\u2019s');
  note('catalogue builder answered to that name. No margin is reported.');
  say('');
  process.exit(1);
}
ok('the catalogue is one well-formed line per reachable entry (' + num(want) + ')');

const system = vm.runInContext('buildSystem', sandbox)(
  hallMd.value, state.value, catalogue, [], []
);

const total  = system.length;
const margin = WALL - total;
const shown  = items.filter(i => !i.unreachable).length;

say('');
note('wall            ' + num(WALL) + '   DECLARED in the hall\u2019s comments, enforced in the Worker \u2014 not read');
note('HALL.md         ' + num(hallMd.value.length));
note('the counts      ' + num(JSON.stringify(state.value, null, 1).length));
note('the catalogue   ' + num(catalogue.length) + '   ' + num(shown) + ' entries, ' +
     (catalogue.length / shown).toFixed(1) + ' chars each');
note('the rest        ' + num(total - hallMd.value.length - catalogue.length -
     JSON.stringify(state.value, null, 1).length) + '   preamble and the nine rules');
note('SYSTEM PROMPT   ' + num(total));
say('');

if (total > WALL) {
  bad('THE HALL DOES NOT FIT. ' + num(total) + ' against a wall of ' + num(WALL) +
      ' \u2014 over by ' + num(total - WALL) + '.');
  note('the Worker refuses this with system_too_long. A 413, not a shorter answer.');
  note('every question asked of the hall fails until the prompt is smaller.');
} else if (total > WALL * WARN_AT) {
  hm('the hall fits, with ' + num(margin) + ' to spare \u2014 under ' +
     Math.round((1 - WARN_AT) * 100) + '% of the wall.');
} else {
  ok('the hall fits \u2014 ' + num(total) + ' of ' + num(WALL) + ', ' + num(margin) + ' to spare.');
}

/* --- what the margin is worth, in the unit that actually spends it --- */

const perDoc = catalogue.length / shown;
say('');
note('one more document costs about ' + Math.round(perDoc) + ' chars.');
note(margin > 0
  ? 'room for roughly ' + Math.floor(margin / perDoc) + ' more before the hall goes silent.'
  : 'the budget is already spent; ' + Math.ceil((total - WALL) / perDoc) +
    ' entries\u2019 worth must come off.');

/* --- the slices, which the slip proposes spending budget the hall may not have --- */

const maxBriefs  = constant(hallJs.value, 'MAX_BRIEFS');
const briefSlice = constant(hallJs.value, 'BRIEF_SLICE');
if (maxBriefs === null || briefSlice === null) {
  blind('could not read MAX_BRIEFS / BRIEF_SLICE from amenti-hall.js');
} else {
  const cost = Number(maxBriefs) * Number(briefSlice);
  note('MAX_BRIEFS ' + maxBriefs + ' \u00d7 BRIEF_SLICE ' + briefSlice + ' = up to ' + num(cost) + ' chars of passage.');
  if (cost > 0 && margin - cost < 0) {
    bad('QUOTING IS ARMED AND THERE IS NO ROOM FOR IT. A question that fetches a passage 413s.');
  } else if (cost === 0 && margin > 2000) {
    note('quoting is disarmed, and there is room to arm it (THE STANDING SLIP \u00a75).');
  } else if (cost === 0) {
    note('quoting is disarmed, and there is no room to arm it. THE STANDING SLIP \u00a75 is blocked, not scheduled.');
  }
}

/* --- the counts the hall is permitted to say, against the register itself --- */

say('');
const stated  = state.value.documents_indexed;
const actual  = srcs.value.counts && srcs.value.counts.reachable;
if (stated == null || actual == null) {
  blind('cannot compare the stated count to the register — one of them is absent');
} else if (stated === actual) {
  ok('the hall states ' + num(stated) + ' documents, and the register holds ' + num(actual) + '.');
} else {
  hm('the hall is permitted to state ' + num(stated) + ' documents; the register holds ' + num(actual) + '.');
  note('HALL-STATE.json read at ' + state.value.generated);
  note('SOURCES.json    walked at ' + srcs.value.generated);
  note('probe-hall ran before the walk. Its counts are readable and out of date, which is the');
  note('one staleness its own guard does not catch \u2014 that guard only nulls a register it cannot READ.');
}

/* --- verdict --- */

say('');
say('\u2500'.repeat(60));
if (unread)      say('\u2717 ' + unread + ' thing(s) the instrument could not see. No verdict on the wall.');
else if (fail)   say('\u2717 ' + fail + ' FAILURE(S). The hall does not answer.');
else if (warn)   say('\u2713 ' + pass + ' passed, ' + warn + ' warning(s). A WARN is something true you should know.');
else             say('\u2713 all clear (' + pass + ' checks).');
say('');

/* A FINDING EXITS NON-ZERO WHETHER OR NOT ANYONE ASKED FOR --check.

   The first draft gated the exit on CHECK, exactly like probe-hall — which is
   right for a probe whose DEFAULT job is to write a file and whose --check is
   the read-only mode. This probe writes nothing, so there is no such division:
   the default IS the reading. Gating on CHECK meant a workflow calling it
   plainly would see the FAIL printed in full and be handed exit 0.

   That is the patrol's own lesson in a new coat — a gate that reads a value the
   failing path never reaches is not a mechanism, it is a coincidence. Here it
   was worse: a gate that could not fire at all. Found by running it. */
process.exit(unread || fail ? 1 : 0);
