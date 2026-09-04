#!/usr/bin/env node
/* ============================================================================
   probes/probe-map.mjs  ·  IS THE MAP STILL HONEST
   ----------------------------------------------------------------------------
     node probes/probe-map.mjs .            # report
     node probes/probe-map.mjs . --check    # exit 1 on a finding

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   The map makes four claims a reader cannot check for themselves:

     a pin means HERE            a real coordinate the record supports
     a wash means SOMEWHERE IN   an extent, and never a point
     nothing means NOTHING KNOWN and the count of it is stated
     the sky is AN OBSERVATION   at Giza, or placeless

   Every one of those can rot silently. A gazetteer swap moves a pin. A new
   Region value with no extent turns a wash into a fall-through. A tier typo
   renders an area as a dot. None of it throws; the map just quietly starts
   lying with a straight face. THAT is what this watches.

   ── THE FINDING THAT MADE IT ──────────────────────────────────────────────
   On 4 Sep the matcher kept the highest-population city of each name, and
   119 of 899 pins — 13% — sat outside the region the roster itself assigns.
   Averroes in Argentina, Al-Ghazali in Arizona, Cortes in Colombia. Every
   count under the map was correct while the map was wrong.

   The roster's Region column is INDEPENDENT of Location, so it can arbitrate.
   That is the test below, and it is the one that must never regress.

   THIS WRITES NOTHING. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const CHECK = process.argv.includes('--check');
const P = f => path.join(ROOT, f);
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

const findings = [];
const fail = m => { findings.push(m); console.log('  \u2717 ' + m); };
const ok   = m => console.log('  \u00b7 ' + m);

function read(f, json) {
  if (!fs.existsSync(P(f))) die('no ' + f + ' at ' + path.resolve(P(f)));
  const t = fs.readFileSync(P(f), 'utf8');
  return json ? JSON.parse(t) : t;
}
function cut(line) {
  const out = []; let f = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i+1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { out.push(f); f = ''; }
    else f += c;
  }
  out.push(f); return out;
}

const geo   = read('GEO.json', true);
const world = read('WORLD.json', true);
const mapjs = read('amenti-map.js');
const sky   = read('SKY.csv');
const roster= read('names.csv');

console.log('\u2500\u2500 is the map still honest \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

/* ── 1 · THE TIERS MEAN WHAT THEY SAY ──────────────────────────────────── */
const TIERS = ['city', 'country', 'region', 'mythic', 'none', 'unplaced'];
let badTier = 0, cityNoCoord = 0, washNoExt = 0, washHasCoord = 0, silentHasMark = 0;
geo.souls.forEach(s => {
  if (!TIERS.includes(s.tier)) badTier++;
  if (s.tier === 'city' && (s.lat == null || s.lon == null)) cityNoCoord++;
  if ((s.tier === 'country' || s.tier === 'region')) {
    if (!s.ext) washNoExt++;
    if (s.lat != null) washHasCoord++;          /* a wash with a point is the lie */
  }
  if ((s.tier === 'mythic' || s.tier === 'none') && (s.lat != null || s.ext)) silentHasMark++;
});
badTier      ? fail(badTier + ' soul(s) carry a tier the map cannot draw')            : ok('every tier is one the map knows');
cityNoCoord  ? fail(cityNoCoord + ' pin(s) have no coordinate \u2014 a dot with no place') : ok('every pin has a coordinate');
washNoExt    ? fail(washNoExt + ' territory soul(s) have no extent')                   : ok('every territory has an extent');
washHasCoord ? fail(washHasCoord + ' TERRITORY SOUL(S) CARRY A POINT \u2014 a region drawn as a pin is the one forbidden thing')
             : ok('no territory carries a point');
silentHasMark? fail(silentHasMark + ' silent soul(s) carry a mark')                    : ok('the silent are silent');

/* ── 2 · COORDINATES ARE ON EARTH ──────────────────────────────────────── */
const offEarth = geo.souls.filter(s => s.lat != null &&
  (Math.abs(s.lat) > 90 || Math.abs(s.lon) > 180 || !Number.isFinite(s.lat) || !Number.isFinite(s.lon)));
offEarth.length ? fail(offEarth.length + ' coordinate(s) are not on the globe') : ok('every coordinate is on the globe');

/* ── 3 · THE REGION TEST · the one that must never regress ─────────────── */
const lines = roster.split(/\r?\n/).filter(l => l.trim());
const head  = cut(lines[0]).map(x => x.trim().toLowerCase());
const N = head.indexOf('full name'), R = head.indexOf('region');
const regionOf = {};
lines.slice(1).map(cut).forEach(r => { const v = (r[R] || '').trim(); if (v) regionOf[(r[N] || '').trim()] = v; });

/* the extents the probe judges by are the map's own, lifted from the register
   so the two cannot disagree — a test with its own copy of the numbers is a
   fixture measuring itself, which the timeline's axis note warns about. */
const EXT = {};
geo.souls.filter(s => s.ext && s.place).forEach(s => { EXT[s.place.toLowerCase()] = s.ext; });

let checked = 0, outside = [];
geo.souls.filter(s => s.tier === 'city' && s.lat != null).forEach(s => {
  const e = EXT[(regionOf[s.n] || '').toLowerCase()];
  if (!e) return;
  checked++;
  if (s.lat < e[0] || s.lat > e[2] || s.lon < e[1] || s.lon > e[3])
    outside.push(s.n + ' \u2014 ' + s.place + ' at ' + s.lat + ',' + s.lon + ' but Region says ' + regionOf[s.n]);
});
const pct = checked ? Math.round(outside.length / checked * 100) : 0;
if (pct > 3) {
  fail(outside.length + ' of ' + checked + ' pins (' + pct + '%) sit OUTSIDE their own Region \u2014 the namesake bug is back');
  outside.slice(0, 10).forEach(x => console.log('        ' + x));
} else ok(outside.length + ' of ' + checked + ' pins outside their Region (' + pct + '% \u2014 was 13% before the fix)');

/* ── 4 · THE SILENCE IS STATED, NOT HIDDEN ─────────────────────────────── */
const t = geo.totals;
const sum = t.pins + t.washes + t.silent + t.unplaced;
sum !== t.souls ? fail('the totals do not add up: ' + sum + ' vs ' + t.souls + ' souls')
                : ok('every soul is accounted for: ' + t.pins + ' pins + ' + t.washes + ' washes + ' +
                     t.silent + ' silent + ' + t.unplaced + ' unplaced = ' + t.souls);
/mp-note/.test(mapjs) && /unplaced/.test(mapjs)
  ? ok('the surface states its own silence in the footer')
  : fail('the footer no longer states how many souls are not drawn');

/* ── 5 · GOLD IS RESERVED ──────────────────────────────────────────────── */
/* Gold is the colour of a VERIFIED QUOTE. The map may use amber for the sky
   and cyan for the souls, and must never reach for the quote's colour. */
const GOLD = /#(?:f{2}d[0-9a-f]{3}|ffc[0-9a-f]{3}|d4af37|ffd700|gold)/i;
GOLD.test(mapjs) ? fail('a reserved gold appears in amenti-map.js \u2014 gold belongs to a verified quote')
                 : ok('no reserved gold is spent on the map');

/* ── 6 · THE PROJECTION AGREES WITH THE COASTLINE ──────────────────────── */
const vb = (world.viewBox || '').trim().split(/\s+/).map(Number);
const wm = /VB_W\s*=\s*(\d+)\s*,\s*VB_H\s*=\s*(\d+)/.exec(mapjs);
if (!wm) fail('cannot find VB_W/VB_H in amenti-map.js');
else if (vb[2] !== +wm[1] || vb[3] !== +wm[2])
  fail('WORLD.json is ' + vb[2] + 'x' + vb[3] + ' but the map projects to ' + wm[1] + 'x' + wm[2] + ' \u2014 every pin is displaced');
else ok('projection matches the coastline (' + vb[2] + 'x' + vb[3] + ')');

/* ── 7 · THE APERTURES ARE REAL PERIODS ────────────────────────────────── */
/* They are advertised to the reader as one Jupiter, one great conjunction,
   one Uranus, one Halley. If the register's own gaps stop matching, the
   labels become decoration and the claim is false. */
const rows = sky.split(/\r?\n/).map(r => r.split(',')).filter(c => !isNaN(parseFloat(c[0])));
function medianGap(f) {
  const y = rows.filter(f).map(c => +c[0]).sort((a, b) => a - b), g = [];
  for (let i = 1; i < y.length; i++) g.push(y[i] - y[i-1]);
  g.sort((a, b) => a - b);
  return g.length ? g[Math.floor(g.length / 2)] : null;
}
const measured = {
  6:  medianGap(c => c[1].trim() === 'Jupiter' && c[2].trim() === 'due-east'),
  20: medianGap(c => c[2].trim() === 'conjunction'),
  42: medianGap(c => c[1].trim() === 'Uranus')
};
const am = /APERTURES\s*=\s*\[([^\]]+)\]/.exec(mapjs);
if (!am) fail('cannot find APERTURES in amenti-map.js');
else {
  const aps = am[1].split(',').map(x => +x.trim());
  ok('apertures: ' + aps.join(' \u00b7 '));
  Object.keys(measured).forEach(k => {
    if (!aps.includes(+k)) return;
    if (measured[k] === null) return;
    Math.abs(measured[k] - +k) > 1
      ? fail('aperture ' + k + 'y is advertised as a real period but the register measures ' + measured[k] + 'y')
      : ok('aperture ' + k + 'y matches the register (' + measured[k] + 'y)');
  });
}

/* ── 8 · NO BROWSER STORAGE, NO QUOTE GUARD TOUCHED ────────────────────── */
/localStorage|sessionStorage/.test(mapjs) ? fail('amenti-map.js reaches for browser storage') : ok('no browser storage');
/verifyQuotes/.test(mapjs) ? fail('amenti-map.js mentions verifyQuotes \u2014 the guard is not this surface\u2019s business')
                           : ok('the quote guard is untouched');

/* ── 9 · THE SKY IS AN OBSERVATION, AND SAYS SO ────────────────────────── */
/computed at giza/i.test(mapjs) ? ok('the sky mark names Giza as the OBSERVER')
                                : fail('the sky no longer says it is computed at Giza \u2014 a rising drawn at a place it did not happen');

console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(findings.length ? findings.length + ' FINDING(S)' : 'no findings \u2014 the map states only what it can support');
if (CHECK) process.exit(findings.length ? 1 : 0);
