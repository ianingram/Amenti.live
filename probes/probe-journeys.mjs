#!/usr/bin/env node
/* ============================================================================
   probes/probe-journeys.mjs  ·  DID THE CROSSING HAPPEN
   ----------------------------------------------------------------------------
     node probes/probe-journeys.mjs .            # report
     node probes/probe-journeys.mjs . --check    # exit 1 on a finding

   ── WHY A LINE NEEDS ITS OWN GUARD ────────────────────────────────────────
   A line is the most assertive mark this map can draw. A dot says "here"; a
   wash says "somewhere in here"; a LINE says a person went from one place to
   another, and a reader will believe it without checking. That is why #64d
   refuses to draw one from two seats, and why the ones that ARE drawn need
   watching more closely than the marks that are not.

   THE RULE THIS ENFORCES:

     A LINE MUST BE AUTHORED AS A JOURNEY, NEVER DERIVED FROM TWO SEATS.

   ── WHAT CAN GO WRONG WHILE EVERY REGISTER IS RIGHT ───────────────────────

   1 · A CROSSING OUTSIDE THE LIFE. Einstein fleeing in 1933 fits his dates.
       Nothing would notice if it said 1833. names.csv would be right about the
       dates, JOURNEYS.csv right about the cities, and the JOIN false — the
       same exposure probe-join guards for the events and probe-seats for the
       positions.

   2 · A CROSSING THAT CONTRADICTS THE POSITIONS. If SEATS.csv puts a soul in
       Vienna in 1938 and JOURNEYS.csv has them arriving in London that year,
       one of the two is wrong and the map draws both. This is the fault that
       could not exist before today, because until today there was only one
       register saying where anyone was.

   3 · AN ENDPOINT THAT DOES NOT RESOLVE. A line to nowhere is not drawn, and a
       silent non-drawing looks exactly like a journey nobody recorded.

   4 · A ROUTE PRETENDING TO BE A CROSSING. The surface draws a dashed ARC and
       says "from here to here — not the route taken". If a row's own note
       claims waypoints, those belong in SEATS.csv as dated positions, which is
       how the Beagle is held. Reported, not failed — it is a judgement.

   THIS WRITES NOTHING. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';
import { cut } from './geo-tier.mjs';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const CHECK = process.argv.includes('--check');
const P = f => path.join(ROOT, f);
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

if (!fs.existsSync(P('JOURNEYS.csv'))) {
  console.log('no JOURNEYS.csv \u2014 no crossings are claimed, and none are drawn');
  process.exit(0);
}
if (!fs.existsSync(P('GEO.json'))) die('no GEO.json \u2014 run probe-geo first; this reads what it resolved');

const geo = JSON.parse(fs.readFileSync(P('GEO.json'), 'utf8'));
const ri  = JSON.parse(fs.readFileSync(P('ROSTER-INDEX.json'), 'utf8'));
const byKey = {}; ri.souls.forEach(s => { byKey[s.k] = s; });
const inGeo = {}; geo.souls.forEach(s => { inGeo[s.k] = s; });

const lines = fs.readFileSync(P('JOURNEYS.csv'), 'utf8').split(/\r?\n/)
  .filter(l => l.trim() && !l.trim().startsWith('#'));
const head = cut(lines[0]).map(s => s.trim().toLowerCase());
const C = n => head.indexOf(n);

const findings = [];
const fail = m => { findings.push(m); console.log('  \u2717 ' + m); };
const note = m => console.log('  ! ' + m);
const ok   = m => console.log('  \u00b7 ' + m);

const rows = [];
for (const line of lines.slice(1)) {
  const r = cut(line);
  const key = (r[C('key')] || '').trim();
  if (!key) continue;
  rows.push({
    key, year: parseInt(r[C('year')], 10),
    from: (r[C('from')] || '').trim(), to: (r[C('to')] || '').trim(),
    what: (r[C('what')] || '').trim(), note: (r[C('note')] || '').trim()
  });
}

console.log('\u2500\u2500 did the crossing happen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log('crossings claimed  ' + rows.length);
const drawn = geo.souls.reduce((n, s) => n + (s.journeys ? s.journeys.length : 0), 0);
console.log('crossings drawn    ' + drawn);

/* 1 · every row names a real soul, with a year */
let noYear = 0, noSoul = 0;
rows.forEach(r => {
  if (!Number.isFinite(r.year)) { noYear++; fail(r.key + ' \u2014 a crossing with no year is not a crossing'); }
  if (!byKey[r.key]) { noSoul++; fail(r.key + ' \u2014 not a soul on the roster'); }
});
if (!noYear && !noSoul) ok('every crossing names a soul on the roster, and a year');

/* 2 · inside the life */
let outside = 0;
rows.forEach(r => {
  const s = byKey[r.key];
  if (!s || !Number.isFinite(r.year) || typeof s.b !== 'number') return;
  if (r.year < s.b || r.year > s.d) {
    outside++;
    fail(r.key + ' crosses in ' + r.year + ' but the roster says ' + s.b + '\u2013' + s.d);
  }
});
if (!outside) ok('every crossing falls inside the life that made it');

/* 3 · nothing silently undrawn */
let lost = 0;
rows.forEach(r => {
  const s = inGeo[r.key];
  const has = s && s.journeys && s.journeys.some(j => j.y === r.year);
  if (!has) {
    lost++;
    fail(r.key + ' ' + r.year + ' is claimed and NOT DRAWN \u2014 an endpoint did not resolve. ' +
         '"' + r.from + '" to "' + r.to + '". A line that quietly fails to appear looks ' +
         'exactly like a journey nobody recorded.');
  }
});
if (!lost) ok('every claimed crossing resolved and is drawn');

/* 4 · does the crossing agree with the positions? */
let clash = 0;
rows.forEach(r => {
  const s = inGeo[r.key];
  if (!s || !s.seats || !Number.isFinite(r.year)) return;
  const at = s.seats.filter(p => {
    const end = p.to == null ? s.d : p.to;
    return r.year >= p.from && r.year <= end && p.place;
  });
  if (!at.length) return;
  const names = at.map(p => String(p.place).toLowerCase());
  const a = r.from.split(',')[0].trim().toLowerCase();
  const b = r.to.split(',')[0].trim().toLowerCase();
  if (!names.some(n => n === a || n === b)) {
    clash++;
    fail(r.key + ' crosses ' + r.from + ' \u2192 ' + r.to + ' in ' + r.year +
         ', but SEATS.csv places them at ' + at.map(p => p.place).join(' / ') +
         ' that year. One of the two registers is wrong and the map draws both.');
  }
});
if (!clash) ok('every crossing agrees with the soul\u2019s own dated positions');

/* 5 · a route wearing a crossing's clothes — reported, never failed */
let routes = 0;
rows.forEach(r => {
  if (/by way of|via|through [A-Z]/.test(r.note)) {
    routes++;
    note(r.key + ' \u2014 the note names waypoints ("' + r.note.slice(0, 60) + '\u2026"). ' +
         'The arc says FROM HERE TO HERE and never traces them. If the waypoints ' +
         'matter, they belong in SEATS.csv as dated positions.');
  }
});
ok(routes + ' crossing(s) name waypoints in their note \u2014 correctly held OUTSIDE the line');

console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(findings.length ? findings.length + ' FINDING(S)'
  : 'no findings \u2014 every line traces to a row somebody wrote');
if (CHECK) process.exit(findings.length ? 1 : 0);
