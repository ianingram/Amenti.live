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
/* Added 31 Aug with the doors: the room list is half the prompt now, so a
   measurement without it is not a measurement of the hall. */
const lib    = read('LIBRARY.json', true);

for (const r of [hallJs, srcs, hallMd, state, lib]) if (!r.ok) blind('could not read ' + r.why);

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

/* TWO CALLS, TWO PROMPTS, TWO CHANCES TO OVERRUN — 31 Aug.
   The hall stopped sending one prompt and started sending two: pickRooms()
   routes against the doors, buildAnswer() answers from what was opened. The
   wall applies to BOTH, and measuring only one would leave half the surface
   unwatched while showing a green lamp. */
const WANT = ['flatten', 'doorsText', 'pickRooms', 'buildAnswer', 'sectionText'];
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
/* pickRooms() and buildAnswer() build a prompt and then CALL THE MODEL. The
   probe must never spend, so only their prompt-building halves are exercised:
   pickRooms is measured from its own pushed lines, buildAnswer is called
   directly because it returns a string and calls nothing. */
if (lifted.doorsText) {
  const body = lift(hallJs.value, 'doorsText');
  if (!/THE ARCHITECTURE/.test(body) || !/THE LIBRARY/.test(body))
    blind('the lifted doorsText() names neither THE ARCHITECTURE nor THE LIBRARY — this is not the function that builds the doors');
}

if (unread) {
  say('');
  note('NOT FINDING SOMETHING MEANS THE INSTRUMENT COULD NOT SEE.');
  note('No margin is reported, because none was measured.');
  say('');
  process.exit(1);
}

/* --- the accusation the probe makes against itself --- */

/* ── A LIFTED FUNCTION MAY CLOSE OVER THINGS THE LIFT DID NOT TAKE ────────
   Found 31 Aug, the first time this probe was pointed at a changed hall:
   doorsText() reads ROOM_SECTIONS, a var in the IIFE that no function-shaped
   lift will ever catch, and the probe died with a ReferenceError and a stack
   trace. A CRASH IS NOT A REPORT. Whatever else it did, it said nothing about
   the wall while appearing to have run.

   So: seed the private constants the doors depend on, and — the part that
   matters more — never let an evaluation failure escape as a stack trace
   again. Anything thrown from the hall's own code is the instrument failing
   to see, which is UNREAD, and UNREAD says so and measures nothing. */
/* Every private constant the lifted functions close over. The list grows with
   the hall: NOTE_BUDGET, ROOM_NOTE and WORK_NOTE were added 31 Aug and
   buildAnswer() threw the moment they were, which is the tryRun() guard below
   doing its job — UNREAD, not a stack trace, and not a green lamp. */
/* NAV is an array joined at definition, not a scalar, so constant() cannot
   read it — the fifth private thing a lifted function has closed over tonight.
   Evaluate its declaration in the sandbox instead, and if that fails, say so:
   an unmeasured NAV is ~600 chars of prompt the wall check would miss. */
const navDecl = /var NAV = \[[\s\S]*?\]\.join\('[^']*'\);/.exec(hallJs.value);
if (navDecl) {
  try { vm.runInContext(navDecl[0], sandbox); }
  catch (e) { blind('NAV is declared but would not evaluate: ' + e.message); }
} else {
  blind('could not find the NAV declaration in amenti-hall.js');
}

for (const name of ['ROOM_SECTIONS', 'NOTE_BUDGET', 'ROOM_NOTE', 'WORK_NOTE', 'MAX_WORKS', 'WORK_SLICE', 'MAX_ROOMS', 'SECTION_BUDGET', 'SECTION_GLOSS', 'SECTION_IDS']) {
  const v = constant(hallJs.value, name);
  if (v !== null) vm.runInContext('var ' + name + ' = ' + v + ';', sandbox);
}

function tryRun(what, fn) {
  try { return { ok: true, value: fn() }; }
  catch (e) { blind('the hall\u2019s own ' + what + ' threw when run: ' + e.message); return { ok: false }; }
}

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

const _doors = tryRun('doorsText()', () => vm.runInContext('doorsText', sandbox)(items, lib.value));
if (!_doors.ok) {
  note('a lifted function that will not run is a lift that missed something it');
  note('closes over. No margin is reported, because none was measured.');
  say('');
  process.exit(1);
}
const catalogue = _doors.value;

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
const lines   = catalogue.split('\n').filter(l => l.startsWith('\u00b7 '));
const shaped  = lines.filter(l => l.includes(' \u2014 ')).length;
const nSecs   = new Set(items.filter(i => !i.unreachable).map(i => i.section)).size;
const nRooms  = (lib.value.rooms || []).length;

/* ── FOUND BY ATTACKING THIS PROBE, 31 AUG ───────────────────────────────
   Truncating LIBRARY.json to ten rooms PASSED. The probe took its expected
   room count from the same file it was measuring, so the expectation shrank
   with the evidence: a library that had silently lost 42 rooms produced a
   smaller prompt, more headroom, and a green lamp.
   The register carries its own tally in totals.manifests, written by
   probe-library from the manifests it actually walked. Cross-check them. A
   file that disagrees with itself is not something to measure the wall with. */
const claimed = lib.value.totals && lib.value.totals.manifests;
if (claimed != null && claimed !== nRooms) {
  blind('LIBRARY.json disagrees with itself \u2014 totals.manifests says ' + num(claimed) +
        ', the rooms array holds ' + num(nRooms));
  note('the hall would declare ' + num(nRooms) + ' rooms and be wrong. No margin is reported.');
  say('');
  process.exit(1);
}
const want    = nSecs + nRooms;

if (lines.length !== want || shaped !== lines.length) {
  blind('the doors are the wrong shape \u2014 ' + num(lines.length) + ' door lines for ' +
        num(nSecs) + ' sections + ' + num(nRooms) + ' rooms, ' + num(shaped) + ' well-formed');
  note('this is not a measurement of the hall. Something other than the hall\u2019s');
  note('door builder answered to that name. No margin is reported.');
  say('');
  process.exit(1);
}
ok('the doors are one well-formed line per section and room (' + num(nSecs) + ' + ' + num(nRooms) + ')');

/* ── CALL ONE: the router. Doors + framing, no HALL.md, no counts. ────────
   Measured from the function's own source rather than by running it, because
   running it would reach window.claude.complete. The pushed literals ARE the
   prompt; the doors are added at their known size. */
const routerSrc  = lift(hallJs.value, 'pickRooms');
const routerLits = [...routerSrc.matchAll(/p\.push\('((?:[^'\\]|\\.)*)'\)/g)]
  .map(m => m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n')).join('\n');
const call1 = routerLits.length + catalogue.length;

/* ── CALL TWO: the answer. NO DOOR LIST — that is the saving. ─────────────
   Measured at its worst: MAX_WORKS passages each of WORK_SLICE chars, which
   is the largest prompt this call can ever build. */
const maxWorks  = Number(constant(hallJs.value, 'MAX_WORKS'))  || 4;
const workSlice = Number(constant(hallJs.value, 'WORK_SLICE')) || 2000;
/* THE FILLER MUST BE THE WORST REAL CASE, NOT A PLAUSIBLE ONE.
   The first version invented a title and a source line and under-reported the
   worst case by ~160 chars against a live run. A probe that under-estimates a
   wall is pointed the wrong way. LIBRARY.json carries a title and a source for
   all 550 works, so take the longest that actually exist. */
let worstTitle = '', worstSource = '';
for (const rm of (lib.value.rooms || [])) for (const w of (rm.works || [])) {
  if ((w.title  || '').length > worstTitle.length)  worstTitle  = w.title;
  if ((w.source || '').length > worstSource.length) worstSource = w.source;
}
const worstRoom = (lib.value.rooms || []).reduce((a, r) => (r.name || '').length > a.length ? r.name : a, '');
/* The authored notes are part of the prompt now and bounded by NOTE_BUDGET,
   so the worst case must spend all of it. Each filler work sits in its own
   room, which is the shape that spends the most: a room header and a room
   note apiece. */
const noteBudget = Number(constant(hallJs.value, 'NOTE_BUDGET')) || 0;
const filler = Array.from({ length: maxWorks }, (_, n) => ({
  room: worstRoom + n, roomName: worstRoom + n,
  roomNote: 'n'.repeat(noteBudget),
  work: { title: worstTitle, source: worstSource, note: 'n'.repeat(noteBudget), file: 'x.md' },
  text: 'x'.repeat(workSlice), why: null
}));
/* ── CALL TWO HAS THREE SHAPES, AND THE WALL APPLIES TO ALL OF THEM ───────
   A question can open library works, or the ship's own register, or nothing.
   Added 31 Aug with the section path — which was invisible to this probe on
   the day it shipped, so the biggest of the three shapes was unmeasured while
   the lamp stayed green. Measure each; report the worst. */
/* RUN THE REAL sectionText ON REAL DATA BEFORE TRUSTING THE FILLER.
   Renaming it used to PASS: the filler measured the budget without the
   function ever being called, so a broken section path sat under a green lamp.
   Same blindness as the decoy catalogue, in a new place. Shape-check the real
   one; size-check with the filler. */
const biggest = [...new Set(items.filter(i => !i.unreachable).map(i => i.section))]
  .map(sec => ({ key: sec, n: items.filter(i => !i.unreachable && i.section === sec).length }))
  .sort((a, b) => b.n - a.n)[0];
const _sec = tryRun('sectionText()', () => vm.runInContext('sectionText', sandbox)(items, [{ key: biggest.key }]));
if (!_sec.ok) { say(''); process.exit(1); }
if (!_sec.value || !/^=== SECTION: /.test(_sec.value.text) || _sec.value.shown < 1) {
  blind('sectionText() ran but produced no section block for "' + biggest.key + '" (' + biggest.n + ' documents)');
  note('the ship\u2019s own register is the primary source for questions about the ship.');
  note('If that path is broken the hall answers architecture questions from nothing.');
  say(''); process.exit(1);
}
ok('sectionText() returns ' + num(_sec.value.shown) + ' of ' + num(biggest.n) + ' entries for the largest section' +
   (_sec.value.held ? ', withholding ' + num(_sec.value.held) + ' and saying so' : ''));

/* BUILT BY THE REAL FUNCTION ON THE REAL REGISTER, not a string of the right
   length. A synthetic filler of exactly SECTION_BUDGET chars under-reported the
   live worst case by 477 — the budget bounds the entries, and the coverage line
   and the section headers ride on top. Ask sectionText for the three biggest
   sections, which is the most a router may pick, and measure what it returns. */
const bigThree = [...new Set(items.filter(i => !i.unreachable).map(i => i.section))]
  .map(sec => ({ key: sec, n: items.filter(i => !i.unreachable && i.section === sec).length }))
  .sort((a, b) => b.n - a.n).slice(0, Number(constant(hallJs.value, 'MAX_ROOMS')) || 3);
const _big = tryRun('sectionText() on the three largest', () => vm.runInContext('sectionText', sandbox)(items, bigThree));
if (!_big.ok) { say(''); process.exit(1); }
const shipFiller = _big.value;
const _ship = tryRun('buildAnswer() with the register', () => vm.runInContext('buildAnswer', sandbox)(
  hallMd.value, state.value, [],
  /* the real shape of the coverage block, including the register line */
  'searched: 52 rooms holding 550 works, and 191 documents of the architecture\n' +
  'opened: no rooms\nworks read in full or in part: 0\n' +
  'the ship\u2019s register: ' + shipFiller.shown + ' document descriptions shown from ' +
  shipFiller.sections.join(', ') + ', and ' + shipFiller.held + ' NOT shown\n' +
  'NOT opened: every other room and every other work. You did not see them and must not describe them.',
  [], null, shipFiller
));

const _sys = tryRun('buildAnswer()', () => vm.runInContext('buildAnswer', sandbox)(
  hallMd.value, state.value, filler,
  'searched: 52 rooms holding 550 works, and 191 documents of the architecture\nopened: a room, another room\nworks read in full or in part: ' + maxWorks + '\nNOT opened: every other room and every other work. You did not see them and must not describe them.',
  []
));
if (!_sys.ok || !_ship.ok) { say(''); process.exit(1); }
const system = _sys.value.length >= _ship.value.length ? _sys.value : _ship.value;
const worstShape = _sys.value.length >= _ship.value.length ? 'library passages' : 'the ship register';

const total  = system.length;
const margin = WALL - total;
const shown  = items.filter(i => !i.unreachable).length;

say('');
note('wall            ' + num(WALL) + '   DECLARED in the hall\u2019s comments, enforced in the Worker \u2014 not read');
note('HALL.md         ' + num(hallMd.value.length));
note('the counts      ' + num(JSON.stringify(state.value, null, 1).length));
note('the doors       ' + num(catalogue.length) + '   ' + num(nSecs) + ' sections + ' + num(nRooms) + ' rooms');
note('');
note('CALL ONE  routing   ' + num(call1) + '   the doors plus ' + num(routerLits.length) + ' of framing');
note('CALL TWO  answering ' + num(total) + '   worst of three shapes: ' + worstShape);
note('   passages   ' + num(_sys.value.length) + '   ' + maxWorks + ' works of ' + num(workSlice));
note('   register   ' + num(_ship.value.length) + '   ' + num(Number(constant(hallJs.value, 'SECTION_BUDGET')) || 0) + ' of section glosses');
note('the rest        ' + num(total - hallMd.value.length - catalogue.length -
     JSON.stringify(state.value, null, 1).length) + '   preamble and the nine rules');
note('SYSTEM PROMPT   ' + num(total));
say('');

/* CALL ONE IS ALSO A PROMPT AND THE WALL ALSO APPLIES TO IT. It was reported
   and not gated until 31 Aug: raising SECTION_IDS to 40 ballooned the doors and
   this probe passed, because only call two was ever compared to the wall. A
   number printed but never tested is decoration. */
if (call1 > WALL) {
  bad('THE ROUTING CALL DOES NOT FIT. ' + num(call1) + ' against a wall of ' + num(WALL) +
      ' \u2014 over by ' + num(call1 - WALL) + '. No question reaches the library at all.');
} else if (call1 > WALL * WARN_AT) {
  hm('the routing call fits, with only ' + num(WALL - call1) + ' to spare.');
}

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

const perDoc = catalogue.length / want;
say('');
note('one more DOOR costs about ' + Math.round(perDoc) + ' chars. A new document inside an\n          existing section costs nothing — which is the point of the change.');
note(margin > 0
  ? 'room for roughly ' + Math.floor(margin / perDoc) + ' more before the hall goes silent.'
  : 'the budget is already spent; ' + Math.ceil((total - WALL) / perDoc) +
    ' entries\u2019 worth must come off.');

/* --- what the second call spends on passages, in the unit that spends it ---
   Replaced the old MAX_BRIEFS / BRIEF_SLICE check on 31 Aug. Those constants
   are gone: the hall no longer slices briefs into one prompt, it opens rooms
   into a second one. THE STANDING SLIP §5 asked for quoting and is answered
   not by arming a slice but by the whole two-call shape. */
note('');
note('passages    ' + maxWorks + ' works x ' + num(workSlice) + ' = up to ' + num(maxWorks * workSlice) +
     ' chars of primary source per answer.');
const roomFor = Math.floor((WALL - (total - maxWorks * workSlice)) / workSlice);
if (roomFor > maxWorks) {
  note('the wall would carry ' + roomFor + ' at that slice \u2014 MAX_WORKS is set below what fits.');
} else if (roomFor < maxWorks) {
  bad('MAX_WORKS is ' + maxWorks + ' but only ' + roomFor + ' passages fit under the wall.');
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
