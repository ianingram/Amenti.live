#!/usr/bin/env node
/* ============================================================================
   probes/probe-geo.mjs  ·  THE PLACE REGISTER
   ----------------------------------------------------------------------------
   Walks names.csv and writes GEO.json: for every soul, a tier and — where the
   record honestly supports one — a coordinate.

     node probes/probe-geo.mjs            # write GEO.json
     node probes/probe-geo.mjs --check    # report only, exit 1 on trouble

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   The roster holds place NAMES. A map needs COORDINATES. Nothing may invent
   the difference. This resolves names against a real gazetteer and REPORTS
   every name it cannot resolve, rather than dropping them quietly — an
   unresolved place is a finding, not a rounding error.

   ── THE THREE TIERS ARE NOT COSMETIC ──────────────────────────────────────
   The most common single Location value is "Southern Europe" — 334 souls, a
   CONTINENT. A naive pin-map lies from its most common case. A city gets a
   dot; a country or region gets an extent and must never render as a dot;
   a myth and an absence get nothing at all.

   ── THE GAZETTEER ─────────────────────────────────────────────────────────
   cities15000.txt from GeoNames (CC BY 4.0), matched on name AND alternate
   names — which is how Constantinople resolves to Istanbul rather than
   standing as a 124-soul hole. Ancient seats with no modern population are
   not in it and are carried in HISTORICAL below, each one a real, checkable
   location, none of them guessed.

   THIS WRITES NOTHING BUT GEO.json. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';
import { geoTier, cut } from './geo-tier.mjs';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const ROSTER= path.join(ROOT, 'names.csv');
const GAZ   = path.join(ROOT, 'cities15000.txt');
const OUT   = path.join(ROOT, 'GEO.json');
const CHECK = process.argv.includes('--check');
/* The only way to write a register with no gazetteer. Named so it cannot be
   reached by accident, and it says what it costs on the way through. */
const ALLOW_THIN = process.argv.includes('--thin');
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

const norm = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

/* ── RETIER · names the classifier calls a city and no gazetteer can find ──
   Confirmed twice over: the classifier's vague bucket and the gazetteer's
   misses are the same rows. A desert is not a dot. */
const RETIER = {
  'the egyptian desert':'region', 'the egyptian necropolis':'region',
  'the wilds of sumer':'region',  'ancient canaan':'country',
  'shinar':'region',              'nile delta':'region',
  'yellow river':'region',        'great plains':'region',
  'antediluvian world':'mythic',  'the beyond':'mythic',
  'camelot':'mythic','takamagahara':'mythic','geatland':'mythic','kaleva':'mythic',
  'avalon':'mythic','asgard':'mythic','jotunheim':'mythic'
};

/* ── HISTORICAL · seats with no modern population, so absent from GeoNames.
   Each is a real site with a known location. A name that is not here and not
   in the gazetteer FALLS THROUGH and is reported. Nothing is guessed. */
const HISTORICAL = {
  'tenochtitlan':[19.435,-99.141],'uruk':[31.324,45.636],'babylon':[32.542,44.421],
  'eridu':[30.816,45.996],'nippur':[32.126,45.232],'shuruppak':[31.783,45.517],
  'akkad':[33.100,44.100],'knossos':[35.298,25.163],'sardis':[38.488,28.040],
  'hermopolis':[27.782,30.802],'bethsaida':[32.910,35.630],'lumbini':[27.469,83.276],
  'assisi':[43.071,12.617],'lanuvium':[41.674,12.698],'italica':[37.444,-6.046],
  'roccasecca':[41.556,13.669],'loyola':[43.155,-2.271],'phthia':[39.070,22.430],
  'troy':[39.957,26.239],'carthage':[36.853,10.323],'palenque':[17.484,-92.046],
  'cusco':[-13.532,-71.967],'memphis, egypt':[29.845,31.251],'thebes, egypt':[25.720,32.610],
  'mount olympus':[40.085,22.359],'mount etna':[37.751,14.993],
  'mount cyllene':[37.947,22.383],'mount caucasus':[42.436,44.450],
  'mount kailash':[31.067,81.312],'naissus':[43.321,21.896],
  'tauresium':[41.930,21.680],'demotika':[41.348,26.505],'herstal':[50.667,5.633],
  'saint domingue':[18.594,-72.307],'aachen':[50.776,6.084],'siegen':[50.875,8.024],
  'stettin':[53.428,14.553],'salonika':[40.640,22.944],'farab':[41.100,68.100],
  'amasya':[40.653,35.833],'manisa':[38.614,27.426],'edirne':[41.677,26.556]
};

/* ── TERRITORY EXTENTS · [south, west, north, east] ────────────────────────
   A wash, never a dot. Deliberately generous: the point of an extent is to
   say "somewhere in here", and a tight box would imply a precision the record
   does not carry. */
const EXTENT = {
  'southern europe':[36,-10,47,29],'western europe':[43,-5,54,8],
  'central europe':[45,8,55,24],'eastern europe':[44,22,60,50],
  'northern europe':[54,4,71,31],'southeastern europe':[38,13,48,30],
  'southeast europe':[38,13,48,30],'southwestern europe':[36,-10,44,4],
  'europe':[36,-10,66,40],'east asia':[20,100,50,146],'south asia':[6,66,35,92],
  'southeast asia':[-10,92,23,141],'central asia':[35,52,50,80],
  'western asia':[12,34,42,63],'asia':[0,30,60,146],'north africa':[20,-17,37,35],
  'east africa':[-12,29,18,52],'west africa':[4,-17,20,15],'africa':[-35,-17,37,51],
  'north america':[25,-125,60,-66],'central america':[7,-92,18,-77],
  'south america':[-55,-81,12,-35],'mesoamerica':[14,-105,22,-86],
  'middle east':[12,34,40,63],'eastern mediterranean':[30,25,42,42],
  'mediterranean':[30,-6,46,36],'anatolia':[36,26,42,45],'oceania':[-45,112,-10,180],
  'caribbean':[10,-85,25,-60],'andes':[-35,-79,10,-63],'pacific islands':[-20,140,20,-160],
  'mesopotamia':[30,40,37,48],'nile delta':[30.0,30.4,31.6,32.2],
  'yellow river':[34,100,41,119],'lake titicaca':[-16.6,-70.1,-15.2,-68.6],'great plains':[32,-104,49,-96],
  'the egyptian desert':[22,25,31,34],'the egyptian necropolis':[29.7,31.0,30.1,31.3],
  'the wilds of sumer':[30,44,33,47],'shinar':[30,42,34,47],
  'germany':[47,6,55,15],'china':[20,75,53,135],'ancient china':[25,100,41,122],
  'han china':[25,100,41,122],'tang china':[25,100,41,122],'sui china':[25,100,41,122],
  'egypt':[22,25,32,35],'japan':[31,129,46,146],'india':[8,68,35,97],
  'ancient india':[8,68,35,97],'ethiopia':[3,33,15,48],'arabia':[12,34,32,60],
  'persia':[25,44,40,63],'ancient persia':[25,44,40,63],'mali':[10,-12,25,4],
  'mali empire':[10,-12,25,4],'greece':[35,20,42,28],'cyprus':[34.5,32.2,35.7,34.6],
  'sicily':[36.6,12.4,38.3,15.7],'wales':[51.3,-5.3,53.5,-2.6],
  'ireland':[51.4,-10.5,55.4,-5.9],'britain':[50,-6,59,2],'roman britain':[50,-6,56,2],
  'england':[50,-6,55.8,1.8],'france':[42,-5,51,8],'normandy':[48.2,-1.9,50.1,1.8],
  'burgundy':[46.1,2.8,48.4,5.5],'swabia':[47.4,7.5,49.5,10.5],
  'frankish gaul':[43,-2,51,8],'albania':[39.6,19.2,42.7,21.1],
  'iceland':[63.2,-24.6,66.6,-13.5],'zanzibar':[-6.5,39.1,-4.8,39.9],
  'thrace':[40.3,24.5,42.5,29.0],'cappadocia':[37.7,33.5,39.4,36.5],
  'phrygia':[37.9,29.5,39.9,33.0],'judea':[31.0,34.7,32.0,35.6],
  'galilee':[32.6,35.0,33.3,35.7],'canaan':[30.5,34.2,34.5,36.5],
  'ancient canaan':[30.5,34.2,34.5,36.5],'ruthenia':[47.9,21.8,49.6,24.6],
  'carthage':[33,8,37,12],'akkad':[32,43,34.5,45.5],
  'mongol empire':[35,75,55,125],'ohio country':[38.4,-84.8,42.3,-80.5],
  'iroquois confederacy':[42.0,-79.8,44.5,-74.0]
};

/* ── read the roster ─────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER,'utf8').split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) die('names.csv holds no rows. An empty roster is not an empty library.');
const head  = cut(lines[0]).map(s => s.trim().toLowerCase());
const nameCol = ['full name','name'].map(w => head.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" column.');
const locCol = head.indexOf('location');
const bCol = head.indexOf('birth-date'), dCol = head.indexOf('death-date');
const yr = v => { const m = /^-?\d+/.exec(String(v==null?'':v).trim()); return m ? Number(m[0]) : null; };
if (locCol === -1) die('names.csv has no "Location" column — there is nothing to place.');

const slug = s => String(s).toLowerCase().replace(/[.'\u2019]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

/* ── the gazetteer ───────────────────────────────────────────────────────── */
const G = new Map();
if (fs.existsSync(GAZ)) {
  for (const line of fs.readFileSync(GAZ,'utf8').split('\n')) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const rec = { lat:+f[4], lon:+f[5], pop:+f[14], name:f[1] };
    if (!Number.isFinite(rec.lat) || !Number.isFinite(rec.lon)) continue;
    for (const k of [f[1], f[2], ...(f[3] ? f[3].split(',') : [])]) {
      const n = norm(k); if (!n) continue;
      const p = G.get(n); if (!p || rec.pop > p.pop) G.set(n, rec);
    }
  }
} else if (ALLOW_THIN) {
  console.error('  note: no cities15000.txt, and --thin was passed. 839 pins will be');
  console.error('        missing from the register this writes. Deliberate, or wrong?');
} else {
  /* ── A PROBE THAT DEGRADES SILENTLY IS THE BUG · 4 Sep ───────────────────
     RUN LIVE against the repo as committed, with no gazetteer present: this
     wrote GEO.json with 62 pins instead of 901, 1,030 unplaced instead of
     191, printed ONE note, and EXITED 0. A good register overwritten by a
     nearly empty one, and the build looked clean. The map would have gone
     from 444 seats to a scattering with nothing anywhere reporting a fault.

     That is the failure config.js describes in its own header — a correct
     edit appearing to have no effect because the thing underneath broke
     quietly. A note is not a guard. Anything that can quietly replace good
     data with thin data must REFUSE instead.

     A missing gazetteer is not a smaller reading. It is a failed one. */
  die('no cities15000.txt at ' + path.resolve(GAZ) + '\n' +
      '           Without it only 62 of 901 pins resolve, and this would\n' +
      '           overwrite GEO.json with a register that looks fine and is not.\n' +
      '           Get it:  curl -sL -o /tmp/c.zip https://download.geonames.org/export/dump/cities15000.zip\n' +
      '                    unzip -o /tmp/c.zip cities15000.txt -d ' + path.resolve(ROOT) + '\n' +
      '           GeoNames, CC BY 4.0. To write a thin register anyway: --thin');
}

/* ── place every soul ────────────────────────────────────────────────────── */
const souls = [], misses = new Map();
let pin = 0, wash = 0, silent = 0;

for (const line of lines.slice(1)) {
  const r = cut(line);
  const name = (r[nameCol] || '').trim();
  if (!name) continue;
  const g = geoTier(r[locCol]);
  let tier = g.tier, place = g.place;
  const rt = RETIER[norm(place)];
  if (rt) tier = rt;

  const o = { n: name, k: slug(name), tier: tier };
  /* dates ride along so the map can move through time as the timeline does.
     Absent is OMITTED, never zero — a soul at year 0 because nobody knew is
     worse than a soul the century filter simply does not claim. */
  const b = bCol > -1 ? yr(r[bCol]) : null, d = dCol > -1 ? yr(r[dCol]) : null;
  if (b !== null) o.b = b;
  if (d !== null) o.d = d;
  if (g.note) o.note = g.note;

  if (tier === 'city') {
    const hit = HISTORICAL[norm(place)] || HISTORICAL[norm(g.full || '')];
    const gz  = G.get(norm(place));
    if (hit)      { o.lat = hit[0]; o.lon = hit[1]; o.src = 'historical'; pin++; }
    else if (gz)  { o.lat = +gz.lat.toFixed(4); o.lon = +gz.lon.toFixed(4); o.src = 'geonames'; pin++; }
    else          { o.tier = 'unplaced'; misses.set(place, (misses.get(place)||0)+1); }
    o.place = place;
  } else if (tier === 'country' || tier === 'region') {
    const ext = EXTENT[norm(place)];
    if (ext) { o.ext = ext; wash++; }
    else     { o.tier = 'unplaced'; misses.set(place, (misses.get(place)||0)+1); }
    o.place = place;
  } else {
    silent++;
    if (place) o.place = place;
  }
  souls.push(o);
}

const unplaced = souls.filter(s => s.tier === 'unplaced').length;
console.log('── the place register ─────────────────────────────────────');
console.log('souls         ' + souls.length);
console.log('pins          ' + pin + '   (a dot — the record supports a point)');
console.log('washes        ' + wash + '   (an extent — "somewhere in here", never a dot)');
console.log('silent        ' + silent + '   (myth or no record — no mark, honestly)');
console.log('UNPLACED      ' + unplaced + '   (a name nothing could resolve — reported, never guessed)');
console.log('  by source:  geonames ' + souls.filter(s=>s.src==='geonames').length +
            ' · historical ' + souls.filter(s=>s.src==='historical').length);

if (misses.size) {
  console.log('\n  ✗ ' + misses.size + ' NAME(S) NOTHING COULD RESOLVE:');
  [...misses.entries()].sort((a,b)=>b[1]-a[1]).slice(0,25)
    .forEach(([k,v]) => console.log('      ' + String(v).padStart(3) + '  ' + k));
  if (misses.size > 25) console.log('      … and ' + (misses.size-25) + ' more');
  console.log('    Add to HISTORICAL (a city) or EXTENT (a territory). Do not guess.');
}

/* --check is what CI calls. It must fail on the SAME conditions that would
   make a write wrong, or CI passes a repo whose next regeneration is broken. */
if (CHECK) {
  var thin = unplaced > 300;
  console.log('\n--check: ' + unplaced + ' unplaced, nothing written' +
              (thin ? '  \u2014 TOO MANY. The gazetteer is missing or stale.' : ''));
  process.exit(thin ? 1 : 0);
}

const payload = {
  _:'GENERATED by probes/probe-geo.mjs — do not edit. City coordinates from GeoNames (CC BY 4.0); ancient seats from the HISTORICAL table in the probe.',
  _law:'A tier is not decoration. city=dot, country/region=extent, mythic/none/unplaced=NO MARK. Never render an extent as a dot.',
  generated:new Date().toISOString(), generator:'probes/probe-geo.mjs',
  attribution:'City coordinates © GeoNames, CC BY 4.0. Coastline: Natural Earth (public domain).',
  totals:{ souls:souls.length, pins:pin, washes:wash, silent:silent, unplaced:unplaced },
  souls
};
fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size/1024) + ' KB)');
console.log('───────────────────────────────────────────────────────────');
