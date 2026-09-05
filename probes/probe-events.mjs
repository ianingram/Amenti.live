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
import { BATTLEFIELDS, EVENT_SEATS, EVENT_EXTENTS, COUNTRY_CODE } from './events-gaz.mjs';
import { geoTier, cut } from './geo-tier.mjs';
import { EXTENT } from './extents.mjs';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const SRC   = path.join(ROOT, 'EVENTS.csv');
const GAZ   = path.join(ROOT, 'cities15000.txt');
const OUT   = path.join(ROOT, 'EVENTS.json');
const CHECK = process.argv.includes('--check');
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

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

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/).filter(l => l.trim());
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

if (CHECK) { process.exit(findings.length || unplaced > 20 ? 1 : 0); }

fs.writeFileSync(OUT, JSON.stringify({
  _: 'GENERATED by probes/probe-events.mjs — do not edit. Place is AUTHORED in EVENTS.csv; this verifies and resolves it, and never invents one.',
  _law: 'An event is an INSTANT, not a lifespan. It must not persist across a window the way a soul does, and it must not be drawn like a seat. A pin on a trigger is not a pin on a war.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-events.mjs',
  attribution: 'Coordinates from GeoNames (CC BY 4.0) and the authored table in probes/events-gaz.mjs.',
  totals: { events: out.length, pins: pinB + pinS + pinG, territories: wash,
            noPlace: silent, unplaced: unplaced },
  events: out
}) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)');
