#!/usr/bin/env node
/* ============================================================================
   probes/probe-roster.mjs  ·  THE ROSTER INDEX
   ----------------------------------------------------------------------------
   Walks names.csv and img/KEYS.json and writes ROSTER-INDEX.json: every soul,
   its slug, its title, and whether the ship has art or a room for it.

     node probes/probe-roster.mjs            # write ROSTER-INDEX.json
     node probes/probe-roster.mjs --check    # report only, exit 1 on trouble

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   ASK AMENTI's fragment search was tested on 24 August against the live
   SOURCES.json. `find('caesar')` returned ZERO.

   SOURCES.json indexes DOCUMENTS. It has no entry for a soul. So the most
   obvious thing a visitor can type into a box on the arena — the name of a
   figure — matched nothing at all.

       A SEARCH OVER THE DOCUMENTS IS NOT A SEARCH OVER THE LIBRARY.

   names.csv is 548 KB. It cannot be loaded by a surface on every keystroke and
   it must NEVER be sent to the model. This writes the compact form: name, slug,
   title, DATES, and two flags. ~57 KB for 1,011 souls — fine for a browser to
   hold, still far too large for a prompt.

   THE DATES ARE HERE SO A SURFACE CAN PLACE A FIGURE IN TIME. Ask Amenti knows
   which rooms it opened; with a birth and a death it can also say WHEN, and
   what else was alive that year. Without them the only source is the 548 KB
   csv, and no surface may load that.

   ── THE COLUMN TRAP ───────────────────────────────────────────────────────
   names.csv column zero is `Rank`, a number. Find the name column BY HEADER.
   A probe that fell back to position searched integers for "cleopatra" and
   reported eight empty lists with complete confidence.

   ── THE ONE SLUG RULE ─────────────────────────────────────────────────────
   tools/keyring.js, tools/plates.js, ingest.py and probe-spells.mjs carry the
   same function. If one changes, all must.

   THIS WRITES NOTHING BUT ROSTER-INDEX.json. It is a reading.
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT   = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const ROSTER = path.join(ROOT, 'names.csv');
const KEYS   = path.join(ROOT, 'img', 'KEYS.json');
const OUT    = path.join(ROOT, 'ROSTER-INDEX.json');
const CHECK  = process.argv.includes('--check');

const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

/* quoted fields everywhere — every Biography carries a comma */
function cut(line) {
  const out = []; let f = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(f); f = ''; }
    else f += c;
  }
  out.push(f);
  return out;
}

const slug = s => String(s).toLowerCase()
  .replace(/[.'\u2019]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/* ── the roster ─────────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER, 'utf8').split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) die('names.csv holds no rows. An empty roster is not an empty library — treat it as a failed reading.');

const head  = cut(lines[0]);
const lower = head.map(s => s.trim().toLowerCase());
const nameCol = ['full name', 'name'].map(w => lower.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" or "Name" column. Header: ' + head.join(', '));
const titleCol = lower.indexOf('title');
/* ── THE DATES · added 1 Sep 2026 ──────────────────────────────────────────
   Every soul carries a Birth-Date and a Death-Date in names.csv and all 1,011
   are populated — spot-checked against ten known figures on 1 Sep, exact,
   including the BC ones. They were not in this index, so no surface could
   place a figure in time without loading the 548 KB csv, which is the one
   thing this file exists to prevent.

   Two integers a soul. BC is negative, which sorts correctly with no parsing
   and is how names.csv already writes it. Absent or unreadable is OMITTED
   rather than guessed: a missing date is a fact, and a soul placed at year
   zero because nobody knew is worse than a soul not placed at all. */
const birthCol = lower.indexOf('birth-date');
const deathCol = lower.indexOf('death-date');
/* REIGN-SPAN SCHEMA (#56): an optional 'Dating' column. Empty = a lifespan
   (birth..death, as always). 'reign' = the b/d years are a REIGN, not a life —
   for ancient Near Eastern and East Asian rulers who kept regnal chronology,
   not birthdays. The timeline still places by b/d; the guard knows not to read
   the span as a lifespan; a surface can draw it as a reign. */
const datingCol = lower.indexOf('dating');
if (birthCol === -1 || deathCol === -1)
  console.error('  note: names.csv has no Birth-Date/Death-Date column \u2014 no soul will carry a date');

const year = v => {
  const t = String(v == null ? '' : v).trim();
  if (!t) return null;
  const m = /^-?\d+/.exec(t);
  if (!m) return null;
  const y = Number(m[0]);
  return Number.isFinite(y) ? y : null;
};

const souls = lines.slice(1).map(cut).map(r => ({
  n: (r[nameCol] || '').trim(),
  t: titleCol > -1 ? (r[titleCol] || '').trim().slice(0, 60) : '',
  b: birthCol > -1 ? year(r[birthCol]) : null,
  d: deathCol > -1 ? year(r[deathCol]) : null,
  dt: datingCol > -1 ? ((r[datingCol]||'').trim().toLowerCase() || null) : null
})).filter(s => s.n);

souls.forEach(s => { s.k = slug(s.n); });

/* ── what the ship has for them ─────────────────────────────────────────── */
let keys = [];
try { keys = (JSON.parse(fs.readFileSync(KEYS, 'utf8')).keys) || []; }
catch (e) { console.error('  note: img/KEYS.json unread (' + e.message + ') — art flags will all be false'); }

const art = new Map();
keys.forEach(k => art.set(k.key, { p: !!k.hasPlates, r: !!k.hasRoom }));

/* A key may be a shortening — lincoln for abraham-lincoln. Match the soul the
   register says it resolves to, never by guessing the shape here. */
/* A SOUL MAY HAVE MORE THAN ONE KEY. Read 24 Aug: Albert Einstein answers to
   both `albert-einstein` (exact) and `einstein-albert` (reversed) — 53 keys
   reaching 52 souls. KEYS.json calls both RESOLVED and is right; there is no
   ambiguity, one soul answers. But an assignment that overwrites loses one,
   and any count assuming one key per soul is off by one. Collect them. */
const byName = new Map(souls.map(s => [s.n, s]));
keys.forEach(k => (k.resolvesTo || []).forEach(n => {
  const s = byName.get(n);
  if (!s) return;
  s.p = s.p || !!k.hasPlates;
  s.r = s.r || !!k.hasRoom;
  (s.keys ||= []).push(k.key);
}));
souls.forEach(s => { if (s.keys) s.keys.sort(); });

const withArt  = souls.filter(s => s.p).length;
const withRoom = souls.filter(s => s.r).length;
const dupes = (() => {
  const seen = new Map(); const out = [];
  souls.forEach(s => { if (seen.has(s.k)) out.push(s.k); else seen.set(s.k, 1); });
  return [...new Set(out)];
})();

console.log('── the roster index ───────────────────────────────────────');
console.log('souls         ' + souls.length);
console.log('with plates   ' + withArt);
console.log('with a room   ' + withRoom);
/* PLACEABLE MEANS BOTH. Found by attacking this on 1 Sep: the first version
   counted a soul as "dated" if it had EITHER date, so blanking 200 birth dates
   still reported 1,011 and the number looked fine. A soul with only a death
   date CANNOT BE PLACED IN A SPAN, which is the one thing these fields are
   for. Count what the surface needs, not what the column contains. */
const placeable = souls.filter(s => s.b !== null && s.d !== null).length;
const halfDated = souls.filter(s => (s.b === null) !== (s.d === null)).length;
console.log('placeable     ' + placeable + '  (both dates \u2014 a span a surface can draw)');
if (halfDated) console.log('  ONE DATE ONLY: ' + halfDated + ' soul(s) \u2014 they cannot be placed in a span');
if (souls.length - placeable - halfDated)
  console.log('  NO DATE:       ' + (souls.length - placeable - halfDated) + ' soul(s)');
/* ── A DATE THAT CANNOT BE TRUE · added 1 Sep 2026 ────────────────────────
   Flavius Josephus sat in this roster as −37 to 100 — a 137-YEAR LIFE. He was
   born in AD 37. One inverted sign, and it went unnoticed until a surface was
   built on it: on 31 Aug it produced a reading in which Josephus was alive at
   Actium beside Cleopatra, Augustus and Ovid. It was compelling and it never
   happened; she died 67 years before he was born. It then blocked the mention
   graph, whose whole filter is "you cannot name someone unborn".

   THE OBVIOUS TEST IS THE WRONG ONE. Eighteen souls live past 115 years and
   SEVENTEEN ARE DELIBERATE — Methuselah at 969, Adam at 930, Noah at 950,
   Moses at 120. Flagging a long life would cry wolf on the traditional
   chronology every single run, and a guard that fires on correct data teaches
   the reader to stop opening the report.

   SO TEST FOR THE FAULT, NOT THE SYMPTOM. A sign error has a signature: the
   span crosses year zero, AND flipping the birth sign yields a plausible life.
   Josephus −37/100 becomes 37/100, sixty-three years. Adam −4004/−3074 fails
   it — both dates are negative, so there is no sign to flip. That test caught
   exactly one soul of 1,011 and left the whole traditional chronology alone. */
const SIGN_ERRORS = souls.filter(s => {
  if (s.dt === 'reign') return false;   // a reign is not a lifespan — no sign test
  if (s.b === null || s.d === null) return false;
  if (!(s.b < 0 && s.d > 0)) return false;
  const span = s.d - s.b;
  if (span <= 115) return false;
  const flipped = s.d - Math.abs(s.b);
  return flipped > 0 && flipped <= 115;
});
if (SIGN_ERRORS.length) {
  console.error('');
  console.error('  ✗ A DATE THAT CANNOT BE TRUE — ' + SIGN_ERRORS.length + ' soul(s):');
  for (const s of SIGN_ERRORS) {
    console.error('      ' + s.n + '  ' + s.b + ' to ' + s.d + '  = ' + (s.d - s.b) +
                  ' years. Flip the birth sign and it is ' + (s.d - Math.abs(s.b)) + '.');
  }
  console.error('    Fix names.csv. Every surface that places a figure in time reads this.');
}

/* Stated whether or not anything fired, so a reader can tell the test ran.
   These are NOT faults — they are the traditional chronology and the mythic
   figures, and the day their count moves is worth noticing. */
const LONG = souls.filter(s => s.b !== null && s.d !== null &&
                               (s.d - s.b) > 115 && (s.d - s.b) < 1000);
const ETERNALS = souls.filter(s => s.b !== null && s.d !== null && (s.d - s.b) >= 1000);
console.log('long lives    ' + LONG.length + '  (over 115 years — traditional chronology, not faults)' +
            (SIGN_ERRORS.length ? ', of which ' + SIGN_ERRORS.length + ' IS A SIGN ERROR' : ''));
console.log('eternals      ' + ETERNALS.length + '  (1,000 years or more — gods, kept off any person axis)');
console.log('keyed         ' + souls.filter(s => s.keys).length + '  (of ' + keys.length + ' keys in the register)');
const multi = souls.filter(s => s.keys && s.keys.length > 1);
multi.forEach(s => console.log('  TWO KEYS:     ' + s.n + '  ' + s.keys.join(' ')));
if (dupes.length) {
  console.log('');
  console.log('  COLLIDING SLUGS: ' + dupes.join(' '));
  console.log('  Two souls reduce to one slug. A key is not wrong until a second');
  console.log('  soul answers to it — these already do.');
}

if (CHECK) {
  console.log('\n--check: ' + (dupes.length ? dupes.length + ' colliding slug(s)' : 'no collisions') + ', nothing written');
  process.exit(dupes.length ? 1 : 0);
}

const payload = {
  _: 'GENERATED by probes/probe-roster.mjs — do not edit. The compact roster, for search. names.csv is 548 KB and is never loaded by a surface; this is.',
  _law: 'NEVER send this to a model. It is 57 KB of names — the hall states counts from HALL-STATE.json and speaks of souls it was asked about, not of a list it was handed.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-roster.mjs',
  totals: { souls: souls.length, withPlates: withArt, withRoom: withRoom,
            collisions: dupes.length, soulsWithTwoKeys: multi.length,
            placeable: souls.filter(s => s.b !== null && s.d !== null).length,
            oneDateOnly: souls.filter(s => (s.b === null) !== (s.d === null)).length,
            earliest: souls.reduce((a, s) => (s.b !== null && (a === null || s.b < a)) ? s.b : a, null),
            latest:   souls.reduce((a, s) => (s.d !== null && (a === null || s.d > a)) ? s.d : a, null) },
  souls: souls.map(s => {
    const o = { n: s.n, k: s.k };
    if (s.t) o.t = s.t;
    const extra = (s.keys || []).filter(k => k !== s.k);
    if (extra.length) o.keys = extra;
    if (s.b !== null && s.b !== undefined) o.b = s.b;
    if (s.d !== null && s.d !== undefined) o.d = s.d;
    if (s.p) o.p = 1;
    if (s.r) o.r = 1;
    if (s.dt === 'reign') o.reign = 1;   // marks b/d as a reign, not a lifespan
    return o;
  })
};

fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)');
console.log('───────────────────────────────────────────────────────────');

/* A date that cannot be true is a FINDING, and hall.yml gates on the outcome. */
process.exit(SIGN_ERRORS.length ? 1 : 0);
