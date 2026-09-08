#!/usr/bin/env node
/* ============================================================================
   probe-attica.mjs  ·  THE ATTICA REGISTERS, CROSS-EXAMINED
   ----------------------------------------------------------------------------
       node probes/probe-attica.mjs .

   Five files were written in one evening — ATTICA.csv harvested, then WHY,
   EVENTS, MOVES and MENTIONS authored or joined on top of it. NOTHING HAS
   CHECKED THEM AGAINST EACH OTHER. Every one of them keys into the first, and
   a key that does not resolve is a row that will never draw and will never
   say why.

   ── RULE 4 · RETURN TEN TIMES WHAT IT COST ────────────────────────────────
   probe-anomalies reported 102 short lives on 6 September and 101 of them were
   reigns the roster had already declared. Every hit true, and an hour of a
   captain's attention spent on a column the probe had not been told about.

   SO THIS PRINTS FINDINGS AND NOT CONFIRMATIONS. A check that passes says one
   line at the end. A check that fails names the rows.

   ── AND IT ACCUSES ITSELF FIRST ───────────────────────────────────────────
   Section 0 is what this probe CANNOT see, printed before anything it can.
   A reader who does not know the blind spots cannot weigh the findings.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || '.';
const OUT = [];
const say = (s = '') => { OUT.push(s); console.log(s); };

const BOX = { la0: 36.542, la1: 39.425, lo0: 21.899, lo1: 25.556 };
const ACROPOLIS = [37.9838, 23.7275];

/* the same split the surface uses — quotes respected, so a note with a comma
   does not gain a column. SEATS.csv lost 25 rows to exactly that on 6 Sep. */
function split(line) {
  const c = []; let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
    cur += ch;
  }
  c.push(cur); return c;
}
function read(name) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) return null;
  const lines = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const cols = split(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim() || l.trimStart().startsWith('#')) continue;
    const c = split(l), o = {};
    cols.forEach((k, j) => { o[k] = c[j] == null ? '' : c[j]; });
    o._line = i + 1;
    rows.push(o);
  }
  return rows;
}
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const km = (la, lo) => {
  const [a1, o1] = ACROPOLIS.map(x => x * Math.PI / 180);
  const a2 = la * Math.PI / 180, o2 = lo * Math.PI / 180;
  return 6371 * 2 * Math.asin(Math.sqrt(
    Math.sin((a2 - a1) / 2) ** 2 + Math.cos(a1) * Math.cos(a2) * Math.sin((o2 - o1) / 2) ** 2));
};

const places   = read('ATTICA.csv');
const why      = read('ATTICA-WHY.csv');
const events   = read('ATTICA-EVENTS.csv');
const moves    = read('ATTICA-MOVES.csv');
const mentions = read('ATTICA-MENTIONS.csv');

say('='.repeat(74));
say('  PROBE · ATTICA · the registers cross-examined');
say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
say('='.repeat(74));

if (!places) {
  say('\n  REFUSES — ATTICA.csv is not at ' + ROOT + '. Nothing here can be checked');
  say('  without it, and guessing at the others would be worse than stopping.');
  process.exit(2);
}

/* ── 0 · WHAT THIS PROBE CANNOT SEE ───────────────────────────────────── */
say('');
say('0 · WHAT THIS CANNOT SEE — read before weighing anything below');
say('  · Whether a coordinate is RIGHT. It checks that keys resolve and that');
say('    points sit in the box. Pleiades could place Marathon in Boeotia and');
say('    this would pass it.');
say('  · Whether a `why` sentence or an event note is TRUE. Both files say in');
say('    their own headers that they are unverified drafts.');
say('  · Whether the mentions join matched the right place. 219 name forms in');
say('    ATTICA-NAMES.csv name more than one place inside this box alone.');
say('  · Anything about the drawing. A register can be perfect and the surface');
say('    still show nothing — which it did for two hours tonight on a shadowed');
say('    variable, and no file probe would have caught it.');

const F = [];                       /* findings, not confirmations */
const note = (sec, s) => F.push([sec, s]);

/* ── 1 · KEYS THAT DO NOT RESOLVE ─────────────────────────────────────── */
const keys = new Set(places.map(r => r.key));
const orphan = (rows, field, label) => {
  if (!rows) return null;
  const bad = rows.filter(r => r[field] && !keys.has(r[field]));
  if (bad.length) {
    note(1, `${label}: ${bad.length} key(s) do not resolve into ATTICA.csv`);
    bad.slice(0, 6).forEach(r => note(1, `    line ${r._line}  ${r[field]}  ${r.name || ''}`));
  }
  return bad.length;
};
orphan(why, 'key', 'ATTICA-WHY.csv');
orphan(events, 'at', 'ATTICA-EVENTS.csv');
orphan(mentions, 'key', 'ATTICA-MENTIONS.csv');

/* ── 2 · AN EVENT THAT HAS DRIFTED FROM ITS PLACE ─────────────────────── */
if (events) {
  const byKey = new Map(places.map(r => [r.key, r]));
  for (const e of events) {
    if (!e.at || !byKey.has(e.at)) continue;
    const p = byKey.get(e.at);
    const d = km(num(e.lat), num(e.lon)) - km(num(p.lat), num(p.lon));
    const gap = Math.hypot(
      (num(e.lat) - num(p.lat)) * 111,
      (num(e.lon) - num(p.lon)) * 111 * Math.cos(num(p.lat) * Math.PI / 180));
    if (gap > 0.3) {
      note(2, `"${e.name}" carries a coordinate ${gap.toFixed(2)} km from ${p.name},`);
      note(2, `    the place its \`at\` key points to. ONE OF THE TWO IS WRONG and the`);
      note(2, `    surface will draw the coordinate, silently preferring it.`);
    }
  }
}

/* ── 3 · POINTS OUTSIDE THE BOX ───────────────────────────────────────── */
const outside = (rows, pairs, label) => {
  if (!rows) return;
  for (const r of rows) {
    for (const [la, lo, what] of pairs) {
      const a = num(r[la]), o = num(r[lo]);
      if (a === null || o === null) continue;
      if (a < BOX.la0 || a > BOX.la1 || o < BOX.lo0 || o > BOX.lo1) {
        note(3, `${label} line ${r._line} "${r.name}" ${what} is outside the box`);
      }
    }
  }
};
outside(events, [['lat', 'lon', 'coordinate']], 'ATTICA-EVENTS.csv');
outside(moves, [['from_lat', 'from_lon', 'origin'], ['to_lat', 'to_lon', 'destination']],
        'ATTICA-MOVES.csv');

/* ── 4 · THE MODERN DATE STANDING FOR AN ANCIENT ONE ──────────────────── */
const modern = places.filter(r => num(r.from) !== null && num(r.from) >= 1500);
if (modern.length) {
  note(4, `${modern.length} place(s) are dated AD 1500 or later — Pleiades recording`);
  note(4, `    WHERE A MODERN SURVEY IDENTIFIED THEM, not when they stood. The`);
  note(4, `    Acharnian Gate reads AD 2000-2099. Correct at the source and false`);
  note(4, `    the moment a period filter reads it as the date of a gate.`);
  modern.slice(0, 5).forEach(r =>
    note(4, `    ${r.from}-${r.until}  ${r.name}`));
  note(4, `    THIS IS NOT A FAULT IN THE DATA. It is a fault waiting in any`);
  note(4, `    surface that filters by year without asking what the year means.`);
}

/* ── 5 · WHAT THE PERIODS ACTUALLY HOLD ───────────────────────────────── */
const PERIODS = [['archaic', -750, -550], ['classical', -550, -330],
                 ['hellenistic', -330, -30], ['roman', -30, 300],
                 ['late antique', 300, 640]];
if (events) {
  const empty = PERIODS.filter(([, a, b]) =>
    !events.some(e => num(e.year) >= a && num(e.year) <= b));
  if (empty.length) {
    note(5, `${empty.length} period(s) contain NO EVENT AT ALL: ` +
            empty.map(p => p[0]).join(', '));
    note(5, `    A reader pressing those buttons gets bare ground and no reason.`);
  }
  const cls = events.filter(e => num(e.year) >= -550 && num(e.year) <= -330).length;
  if (cls / events.length > 0.6) {
    note(5, `${cls} of ${events.length} events are Classical — ${Math.round(100 * cls / events.length)}%.`);
    note(5, `    The register is not a history of Attica, it is a history of one`);
    note(5, `    century of it, and the surface does not say so.`);
  }
}

/* ── 6 · THE MARK VOCABULARY, RUN OVER THE REAL KINDS ─────────────────── */
const MARKS = [
  ['harbour', /\bport\b|harbor|harbour|limen|mole|quay/],
  ['games',   /stadi|gymnas|palaestra|palaistra|hippodrom|theatre|theater|odeon|odeum/],
  ['sacred',  /sanctuar|shrine|acropolis|temple|altar|oracle|temenos/],
  ['defence', /\bfort|tower|wall|gate|castle|citadel|rampart/],
  ['worked',  /\bmine\b|quarry|kiln|workshop|factory/],
  ['buried',  /tomb|necropolis|cemeter|tumulus|catacomb|grave|mausoleum/],
  ['built',   /stoa|basilica|church|building|architectural|monument|bath|villa|house|library|bridge|aqueduct|fountain/],
  ['ground',  /mountain|hill|peak|cape|promontor|island|river|spring|lake|plain|valley|pass|cave|water/],
  ['settled', /settlement|deme|village|town|city|station|people/]
];
const markOf = k => (MARKS.find(([, rx]) => rx.test(String(k).toLowerCase())) || ['other'])[0];
const other = places.filter(r => markOf(r.kind) === 'other');
const otherKinds = {};
other.forEach(r => String(r.kind).split('|').forEach(k => {
  k = k.trim(); if (k) otherKinds[k] = (otherKinds[k] || 0) + 1;
}));
const bigOther = Object.entries(otherKinds).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 3);
if (bigOther.length) {
  note(6, `${other.length} place(s) fall to the "other" mark. The kinds worth a mark:`);
  bigOther.slice(0, 8).forEach(([k, v]) => note(6, `    ${String(v).padStart(4)}  ${k}`));
}

/* ── 7 · SEVERAL EVENTS ON ONE COORDINATE ─────────────────────────────── */
if (events) {
  const at = {};
  events.forEach(e => {
    const k = num(e.lat).toFixed(3) + ',' + num(e.lon).toFixed(3);
    (at[k] = at[k] || []).push(e.name);
  });
  const piles = Object.entries(at).filter(([, v]) => v.length > 2);
  piles.forEach(([k, v]) =>
    note(7, `${v.length} events share ${k}: ${v.join('; ')}`));
  if (piles.length) {
    note(7, `    Correct — they happened on the same ground. The surface stacks`);
    note(7, `    them upward with a stem, so this is a note and not a fault.`);
  }
}

/* ── 8 · THE WHY COLUMN AGAINST THE CORPUS ────────────────────────────── */
if (why && mentions) {
  const cited = new Map(mentions.filter(m => +m.sources > 1).map(m => [m.key, +m.sources]));
  const written = new Set(why.map(r => r.key));
  const missing = [...cited.entries()]
    .filter(([k]) => !written.has(k))
    .sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (missing.length) {
    const byKey = new Map(places.map(r => [r.key, r]));
    note(8, `Places the corpus corroborates that have NO \`why\` sentence yet,`);
    note(8, `    most-named first — this is the queue, chosen by the sources:`);
    missing.forEach(([k, n]) =>
      note(8, `    ${String(n).padStart(3)} rooms  ${(byKey.get(k) || {}).name || k}`));
  }
}

/* ── PRINT ────────────────────────────────────────────────────────────── */
say('');
if (!F.length) {
  say('  NO FINDINGS. Every key resolves, every point is in the box, and no');
  say('  register contradicts another. That is worth one line and no more.');
} else {
  let last = null;
  const TITLES = {
    1: 'KEYS THAT DO NOT RESOLVE',
    2: 'AN EVENT THAT HAS DRIFTED FROM ITS PLACE',
    3: 'POINTS OUTSIDE THE BOX',
    4: 'A MODERN DATE STANDING FOR AN ANCIENT ONE',
    5: 'WHAT THE PERIODS ACTUALLY HOLD',
    6: 'KINDS WITH NO MARK OF THEIR OWN',
    7: 'SEVERAL EVENTS ON ONE COORDINATE',
    8: 'THE QUEUE THE CORPUS CHOSE'
  };
  for (const [sec, line] of F) {
    if (sec !== last) { say(''); say(`${sec} · ${TITLES[sec]}`); last = sec; }
    say('  ' + line);
  }
}

say('');
say('-'.repeat(74));
const counts = [
  ['ATTICA.csv', places], ['ATTICA-WHY.csv', why], ['ATTICA-EVENTS.csv', events],
  ['ATTICA-MOVES.csv', moves], ['ATTICA-MENTIONS.csv', mentions]
];
counts.forEach(([n, r]) =>
  say('  ' + n.padEnd(22) + (r ? String(r.length).padStart(5) + ' rows' : '    not present')));
say('-'.repeat(74));

try {
  fs.writeFileSync(path.join(ROOT, 'probe-attica.txt'), OUT.join('\n') + '\n');
  console.log('\n  written to probe-attica.txt — the body always arrives');
} catch (e) { /* the console reading stands on its own */ }
