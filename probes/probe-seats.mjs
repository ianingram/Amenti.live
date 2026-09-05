#!/usr/bin/env node
/* ============================================================================
   probes/probe-seats.mjs  ·  WAS THE SOUL WHERE AND WHEN IT SAYS
   ----------------------------------------------------------------------------
     node probes/probe-seats.mjs .            # report
     node probes/probe-seats.mjs . --check    # exit 1 on a finding

   ── WHY SEATS.csv EXISTS ──────────────────────────────────────────────────
   Measured 5 Sep: the roster's Location column is THE BIRTHPLACE — nineteen of
   twenty unambiguous figures. Newton in Lincolnshire, Einstein at Ulm, Marx at
   Trier, Curie in Warsaw. Not one of them worked there, and the map claimed to
   show "principal place of activity" (SLIP #68).

   A single corrected column would still be one point standing for a life.
   SEATS.csv holds DATED POSITIONS instead, so the map can say where a soul was
   in a given year rather than where they were once.

   ── WHAT THIS GUARDS ──────────────────────────────────────────────────────

   1 · A POSITION MUST SIT INSIDE A LIFE. A seat from 1902 for a soul who died
       in 1899 is a claim the roster itself contradicts, and neither register
       would notice: names.csv is right about the dates, SEATS.csv is right
       about the place, and the JOIN is false. That is the edge-data exposure
       (#66) arriving in a new register on its first day.

   2 · A PLACE MUST RESOLVE, AND TO THE RIGHT COUNTRY. The same check that
       caught Carthage-in-Ohio and Cordoba-in-Argentina three times in one
       session. Authored is not the same as correct.

   3 · POSITIONS MUST NOT OVERLAP. A soul in two cities in the same year is
       either two souls, a move the dates have flattened, or an error. All
       three want a human, so all three are reported.

   4 · A POSITION WITH NO DATE IS NOT A POSITION. Undated places already have
       a home — the Location column. A row here without a `from` is a place
       pretending to be a position.

   THIS WRITES NOTHING. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';
import { geoTier, cut } from './geo-tier.mjs';
import { EXTENT } from './extents.mjs';
import { BATTLEFIELDS, EVENT_SEATS, COUNTRY_CODE } from './events-gaz.mjs';

/* ── THE PROBE MUST ASK THE SAME QUESTION THE REGISTER ANSWERS · 5 Sep ─────
   probe-geo resolves a position by consulting its own HISTORICAL table FIRST,
   because that table settles namesakes a country cannot — two Princetons in
   one country, Falmouth in Cornwall against Falmouth as an alternate name for
   Portland, Maine. A probe that skips it reports faults the register does not
   have, which is worse than silence: it teaches a reader to ignore findings. */
const SOUL_SEATS = {};
try {
  const src = fs.readFileSync(new URL('./probe-geo.mjs', import.meta.url), 'utf8');
  const blk = /const HISTORICAL = \{([\s\S]*?)\n\};/.exec(src);
  if (blk) for (const m of blk[1].matchAll(/'([^']+)':\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+)/g))
    SOUL_SEATS[m[1]] = [ +m[2], +m[3] ];
} catch (e) { /* the probe still runs without it, and says so below */ }

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const CHECK = process.argv.includes('--check');
const P = f => path.join(ROOT, f);
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };
const norm = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

if (!fs.existsSync(P('SEATS.csv'))) die('no SEATS.csv at ' + path.resolve(P('SEATS.csv')));
const ri = JSON.parse(fs.readFileSync(P('ROSTER-INDEX.json'), 'utf8'));
const byKey = {}; ri.souls.forEach(s => { byKey[s.k] = s; });

/* the gazetteer, if it is here — a place that cannot be checked is reported,
   not assumed good */
const G = new Map();
if (fs.existsSync(P('cities15000.txt'))) {
  for (const line of fs.readFileSync(P('cities15000.txt'), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const rec = { lat: +f[4], lon: +f[5], pop: +f[14], cc: f[8], name: f[1] };
    if (!Number.isFinite(rec.lat)) continue;
    for (const k of [f[1], f[2], ...(f[3] ? f[3].split(',') : [])]) {
      const n = norm(k); if (!n) continue;
      const p = G.get(n); if (!p || rec.pop > p.pop) G.set(n, rec);
    }
  }
}

const lines = fs.readFileSync(P('SEATS.csv'), 'utf8').split(/\r?\n/)
  .filter(l => l.trim() && !l.trim().startsWith('#'));
const head = cut(lines[0]).map(s => s.trim().toLowerCase());
const C = n => head.indexOf(n);
const kC = C('key'), fC = C('from'), tC = C('to'), pC = C('place'), wC = C('what'), nC = C('note');

const findings = [];
const fail = m => { findings.push(m); console.log('  \u2717 ' + m); };
const ok   = m => console.log('  \u00b7 ' + m);

const rows = [], bySoul = {};
let noDate = 0, unknownSoul = 0, resolved = 0, unresolvable = [];

for (const line of lines.slice(1)) {
  const r = cut(line);
  const key = (r[kC] || '').trim();
  if (!key) continue;
  const from = parseInt(r[fC], 10);
  const to   = r[tC] && r[tC].trim() ? parseInt(r[tC], 10) : null;
  const place = (r[pC] || '').trim();
  const row = { key, from, to, place, what: (r[wC] || '').trim(), note: (r[nC] || '').trim() };
  rows.push(row);
  (bySoul[key] || (bySoul[key] = [])).push(row);

  if (isNaN(from)) { noDate++; continue; }
  if (!byKey[key]) { unknownSoul++; continue; }

  /* a place is optional — Darwin's Beagle years are deliberately placeless */
  if (!place) continue;
  const g = geoTier(place);
  const k = norm(g.place);
  if (EXTENT[k] || g.tier === 'country' || g.tier === 'region') { resolved++; continue; }
  if (SOUL_SEATS[k] || BATTLEFIELDS[k] || EVENT_SEATS[k]) { resolved++; continue; }
  const hit = G.get(k);
  if (!hit) { if (G.size) unresolvable.push(key + ' \u2192 ' + place); continue; }
  const stated = (place.split(',')[1] || '').trim().toLowerCase();
  const want = COUNTRY_CODE[stated];
  if (want && hit.cc !== want)
    fail(key + ' \u2014 "' + place + '" resolves to ' + hit.name + ' (' + hit.cc + '), expected ' + want);
  else resolved++;
}

console.log('\u2500\u2500 was the soul where and when it says \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log('positions     ' + rows.length + '   across ' + Object.keys(bySoul).length + ' souls');
console.log('places        ' + resolved + ' resolved, ' +
            rows.filter(r => !r.place).length + ' deliberately placeless');

noDate      ? fail(noDate + ' position(s) carry no year \u2014 an undated place belongs in Location, not here')
            : ok('every position carries a year');
unknownSoul ? fail(unknownSoul + ' position(s) name a key the roster does not hold')
            : ok('every key is a soul on the roster');
unresolvable.length
  ? fail(unresolvable.length + ' place(s) nothing could resolve: ' + unresolvable.slice(0, 6).join('; '))
  : ok('every named place resolves');
if (!G.size) console.log('  \u00b7 note: no cities15000.txt \u2014 places were not checked against the gazetteer');

/* ── inside a life ──────────────────────────────────────────────────────── */
let outside = [];
rows.forEach(r => {
  const s = byKey[r.key];
  if (!s || isNaN(r.from) || typeof s.b !== 'number') return;
  const end = r.to == null ? s.d : r.to;
  if (r.from < s.b - 1 || end > s.d + 1)
    outside.push(r.key + ' ' + r.from + '\u2013' + (r.to == null ? 'death' : r.to) +
                 ' but the roster says ' + s.b + '\u2013' + s.d);
});
outside.length
  ? outside.forEach(x => fail('a position outside the life: ' + x))
  : ok('every position sits inside the soul\u2019s own dates');

/* ── overlaps ───────────────────────────────────────────────────────────── */
let overlap = [];
Object.entries(bySoul).forEach(([k, list]) => {
  const s = byKey[k];
  const spans = list.filter(r => !isNaN(r.from) && r.place)
    .map(r => [r.from, r.to == null ? (s ? s.d : r.from) : r.to, r.place])
    .sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < spans.length; i++)
    if (spans[i][0] < spans[i - 1][1] - 1)
      overlap.push(k + ': ' + spans[i - 1][2] + ' to ' + spans[i - 1][1] +
                   ' overlaps ' + spans[i][2] + ' from ' + spans[i][0]);
});
overlap.length
  ? overlap.forEach(x => fail('two places at once \u2014 ' + x))
  : ok('no soul is in two places in the same year');

/* ── and what it is worth ───────────────────────────────────────────────── */
const multi = Object.values(bySoul).filter(l => l.length > 1).length;
ok(multi + ' soul(s) have more than one position \u2014 the ones a single column could not hold');
const covered = Object.keys(bySoul).length;
console.log('  \u00b7 coverage: ' + covered + ' of ' + ri.souls.length + ' souls (' +
            (covered / ri.souls.length * 100).toFixed(1) + '%). The rest fall back to Location, ' +
            'which is the birthplace and says so.');

console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(findings.length ? findings.length + ' FINDING(S)'
  : 'no findings \u2014 every position sits in a real life at a place that resolves');
if (CHECK) process.exit(findings.length ? 1 : 0);
