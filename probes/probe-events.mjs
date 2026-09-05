#!/usr/bin/env node
/* ============================================================================
   probes/probe-events.mjs  ·  WHERE THE EVENTS HAPPENED
   ----------------------------------------------------------------------------
     node probes/probe-events.mjs .            # write EVENTS.json
     node probes/probe-events.mjs . --check    # report only, exit 1 on a finding

   ── WHY THIS IS NOT probe-geo ─────────────────────────────────────────────
   The souls and the events resolve differently, and the difference cost a
   whole evening to find. probe-geo places PEOPLE, who lived in populated
   places, and arbitrates namesakes with the roster's Region column. An event
   happened wherever it happened — a field, a pass, a vent, a stretch of sea —
   and EVENTS.csv has no Region.

   ── WHAT THE NAIVE PATH ACTUALLY PRODUCED · MEASURED 4 SEP ────────────────
   Run against the real gazetteer, matching on the name alone:

       Marathon    -> Saint-Maximin-la-Sainte-Baume, France
       Waterloo    -> Austin, Texas
       Carthage    -> Carthage, Ohio
       Trojan War  -> "date"        (a town in Texas)
       Plato founds the Academy -> "plato"   (a town in Missouri)

   and about forty-five fields — Kadesh, Thermopylae, Actium, Manzikert,
   Agincourt, Bannockburn, the Somme — matched NOTHING and would have
   disappeared without a word while the register read as complete.

   So this probe does three things probe-geo does not:

   1 · IT READS ITS OWN GAZETTEER FIRST. Battlefields are hand-placed in
       events-gaz.mjs, with a note wherever the site is genuinely disputed.

   2 · IT DEMANDS THE COUNTRY AGREE. The Place string carries a country and
       the gazetteer returns one; if they differ the event is REFUSED, not
       pinned. This is the Region column's job done by another means, and it
       caught Carthage-in-Ohio on the first run.

   3 · IT WILL NOT GUESS FROM PROSE. An earlier attempt derived places from
       event names and descriptions. It "matched" 29% and most of those were
       wrong — the failures above are all from that attempt. THE PLACE COLUMN
       IS AUTHORED. A machine may verify it and must never invent it.

   ── AN EVENT IS AN INSTANT ────────────────────────────────────────────────
   A soul persists across a window; a fire does not. The register carries the
   year and nothing else, and the surface must not let an event linger the way
   a lifespan does. That rule lives in the drawing, but it is stated here
   because this is where the data is shaped.

   THIS WRITES NOTHING BUT EVENTS.json. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { BATTLEFIELDS, EVENT_SEATS, EVENT_EXTENTS, COUNTRY_CODE } from './events-gaz.mjs';
import { geoTier, cut } from './geo-tier.mjs';
import { EXTENT } from './extents.mjs';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const SRC   = path.join(ROOT, 'EVENTS.csv');
const GAZ   = path.join(ROOT, 'cities15000.txt');
const OUT   = path.join(ROOT, 'EVENTS.json');
const CHECK = process.argv.includes('--check');
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

/* ── THE GAZETTEER IS PINNED · 4 Sep ──────────────────────────────────────
   sha256 714c6d09950d80890522e2754df62473f031bdef641b35fe1e4befe05ec4a808
   cities15000.txt · 8,424,283 bytes · 34,133 rows · GeoNames, CC BY 4.0

   Audited before it was committed: UTF-8, every line 19 tab-separated fields,
   every line beginning with a numeric geonameid, no control characters beyond
   tab and newline, no HTML, no script, no data: URI, no http reference of any
   kind, and every lat/lon numeric and on the globe. A tab-separated table has
   no mechanism for code, and the usual smuggling routes were checked anyway.

   WHY THE HASH IS CHECKED AND NOT MERELY WRITTEN DOWN. GeoNames updates this
   file continuously — populations shift, alternate names are added, entries
   move. A different gazetteer produces a different register: PINS MOVE, and
   nothing anywhere would say why. The roster would look the same, the probe
   would report success, and Cordoba would be forty metres from where it was.

   So the hash is compared on every run and stamped into the register. A
   changed gazetteer is a FINDING — not an error, and not silence. Someone
   deliberately refreshing it should update the constant below and expect the
   pins to be re-checked. */
const GAZETTEER_SHA = '714c6d09950d80890522e2754df62473f031bdef641b35fe1e4befe05ec4a808';

const norm = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

if (!fs.existsSync(SRC)) die('no EVENTS.csv at ' + path.resolve(SRC));

/* The gazetteer is required for the same reason it is required in probe-geo:
   without it this writes a register with a handful of pins and calls it done. */
if (!fs.existsSync(GAZ) && !process.argv.includes('--thin'))
  die('no cities15000.txt at ' + path.resolve(GAZ) +
      '\n           Without it only the hand-placed sites resolve, and the register\n' +
      '           would look finished while most events silently vanished.\n' +
      '           GeoNames, CC BY 4.0. To write a thin register anyway: --thin');

const G = new Map();
if (fs.existsSync(GAZ)) {
  for (const line of fs.readFileSync(GAZ, 'utf8').split('\n')) {
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


/* hash the gazetteer as it is read — cheap against an 8 MB file, and the only
   way to know the register rests on the file it claims to */
let gazSha = null, gazDrift = false;
if (fs.existsSync(GAZ)) {
  gazSha = createHash('sha256').update(fs.readFileSync(GAZ)).digest('hex');
  if (gazSha !== GAZETTEER_SHA) {
    gazDrift = true;
    console.error('  \u2717 THE GAZETTEER HAS CHANGED');
    console.error('      expected ' + GAZETTEER_SHA.slice(0, 16) + '\u2026');
    console.error('      found    ' + gazSha.slice(0, 16) + '\u2026');
    console.error('      Pins may have moved. Every coordinate in this register now');
    console.error('      comes from a file the repo has not audited. Re-audit it, then');
    console.error('      update GAZETTEER_SHA and expect the pins to be re-checked.');
  }
}

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/).filter(l => l.trim());

/* the comet's own returns, read from the register rather than computed */
const HALLEY = lines.slice(1).map(l => cut(l))
  .filter(r => /comet/i.test((r[2] || '')) && /halley/i.test(r[1] || ''))
  .map(r => parseFloat(r[0])).filter(n => !isNaN(n)).sort((a, b) => a - b);
const head  = cut(lines[0]).map(s => s.trim().toLowerCase());
const C = n => head.indexOf(n);
const yC = C('year'), nC = C('name'), catC = C('category'), dC = C('description');
const pC = C('place'), noteC = C('note');
if (pC === -1)
  die('EVENTS.csv has no Place column. It is AUTHORED, not derived — see the\n' +
      '           header of this file for what happened when a machine guessed.');

const out = [], findings = [], refused = new Map();
let pinB = 0, pinS = 0, pinG = 0, wash = 0, silent = 0;

for (const line of lines.slice(1)) {
  const r = cut(line);
  const y = parseFloat(r[yC]);
  if (isNaN(y)) continue;
  const name = (r[nC] || '').trim();
  const place = (r[pC] || '').trim();
  const o = { y: y, n: name, c: (r[catC] || '').trim() };
  const note = noteC > -1 ? (r[noteC] || '').trim() : '';
  /* ECHO · how long the event went on mattering. A JUDGEMENT, authored in
     EVENTS.csv the way Place is, and carried through unchanged. The probe does
     not check it because there is nothing to check it against — which is
     itself worth knowing, and is why the surface must call it a reading. */
  /* ── SMOULDERING, COUNTED IN COMET PASSES · 5 Sep ─────────────────────
     `passes` is how many Halley returns an event went on mattering for. The
     probe turns it into a REAL END YEAR from the register's own 48 returns,
     so the smouldering stops at a date the sky supplies rather than at
     year-plus-a-number somebody chose.

     A property nobody designed: the span varies with where the event falls
     between returns. Rome burns in 64 with the comet almost due, so two
     passes is 77 years; Vesuvius is fifteen years later and gets 139. The
     sky counts, not a judgement about which mattered more. */
  var passC = C('passes');
  var pv = passC > -1 ? (r[passC] || '').trim() : '';
  if (pv === 'open') {
    /* ── AN OPEN CLAIM NEEDS AN OPEN VALUE · 5 Sep ──────────────────────
       "It has not gone out" is not a duration, and giving it one broke it.
       Written first as 26 passes, Egyptian Unification went out in AD 374
       and the Crucifixion in 1986, while the World Wide Web — three years
       old — burned to 2061 on the same count. A bounded number cannot carry
       an unbounded claim. `open` runs to the edge of the register and says
       what it means. */
    o.passes = 'open';
    o.until = null;
  } else if (pv && !isNaN(parseInt(pv, 10))) {
    var np = parseInt(pv, 10);
    o.passes = np;
    var after = HALLEY.filter(function (h) { return h > y; });
    o.until = after[np - 1] != null ? after[np - 1]
            : (HALLEY[HALLEY.length - 1] > y ? HALLEY[HALLEY.length - 1] : y + 76);
  }
  if (note) o.note = note;

  if (!place) { silent++; out.push(o); continue; }

  const g = geoTier(place);
  const key = norm(g.place);

  /* a territory, declared or classified */
  /* the shared table first — the souls' boundaries are the events' boundaries */
  const ext = EXTENT[key] || EXTENT[norm(place)] || EVENT_EXTENTS[key] || EVENT_EXTENTS[norm(place)];
  if (ext) { o.ext = ext; o.place = g.place; wash++; out.push(o); continue; }
  if (g.tier === 'country' || g.tier === 'region') {
    findings.push(name + ' — "' + place + '" reads as a territory and has no extent');
    o.tier = 'unplaced'; out.push(o); continue;
  }

  /* hand-placed first: a battlefield is not a city */
  const b = BATTLEFIELDS[key] || EVENT_SEATS[key];
  if (b) { o.lat = b[0]; o.lon = b[1]; o.src = 'authored'; o.place = g.place;
           BATTLEFIELDS[key] ? pinB++ : pinS++; out.push(o); continue; }

  const hit = G.get(key);
  if (!hit) {
    refused.set(place, (refused.get(place) || 0) + 1);
    o.tier = 'unplaced'; o.place = g.place; out.push(o); continue;
  }

  /* THE COUNTRY MUST AGREE — the Region column's job, done another way */
  const stated = (place.split(',')[1] || '').trim().toLowerCase();
  const want = COUNTRY_CODE[stated];
  if (want && hit.cc !== want) {
    findings.push(name + ' — "' + place + '" resolved to ' + hit.name + ' (' + hit.cc +
                  '), expected ' + want + '. REFUSED rather than pinned.');
    o.tier = 'unplaced'; o.place = g.place; out.push(o); continue;
  }
  o.lat = +hit.lat.toFixed(4); o.lon = +hit.lon.toFixed(4);
  o.src = 'geonames'; o.place = g.place; pinG++;
  out.push(o);
}

const unplaced = out.filter(e => e.tier === 'unplaced').length;
console.log('── where the events happened ──────────────────────────────');
console.log('events        ' + out.length);
console.log('pins          ' + (pinB + pinS + pinG) +
            '   (authored ' + (pinB + pinS) + ' · geonames ' + pinG + ')');
console.log('smouldering   ' + out.filter(e=>e.passes).length +
            '   (events with an authored number of comet passes)');
console.log('territories   ' + wash);
console.log('no place given' + String(silent).padStart(6) + '   (the column is empty — nothing is claimed)');
console.log('UNPLACED      ' + String(unplaced).padStart(6) + '   (a place was named and could not be verified)');

if (refused.size) {
  console.log('\n  ✗ named a place nothing could resolve:');
  [...refused.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
    .forEach(([k, v]) => console.log('      ' + String(v).padStart(3) + '  ' + k));
  console.log('    Add to BATTLEFIELDS in events-gaz.mjs, or correct the Place.');
}
if (findings.length) {
  console.log('\n  ✗ ' + findings.length + ' FINDING(S):');
  findings.slice(0, 20).forEach(f => console.log('      ' + f));
}

if (CHECK) { process.exit(findings.length || unplaced > 20 || gazDrift ? 1 : 0); }

fs.writeFileSync(OUT, JSON.stringify({
  _: 'GENERATED by probes/probe-events.mjs — do not edit. Place is AUTHORED in EVENTS.csv; this verifies and resolves it, and never invents one.',
  _law: 'An event is an INSTANT, not a lifespan. It must not persist across a window the way a soul does, and it must not be drawn like a seat. A pin on a trigger is not a pin on a war.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-events.mjs',
  gazetteer: { file:'cities15000.txt', sha256:gazSha, matchesAudited:!gazDrift },
  attribution: 'Coordinates from GeoNames (CC BY 4.0) and the authored table in probes/events-gaz.mjs.',
  totals: { events: out.length, pins: pinB + pinS + pinG, territories: wash,
            noPlace: silent, unplaced: unplaced },
  events: out
}) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)');
