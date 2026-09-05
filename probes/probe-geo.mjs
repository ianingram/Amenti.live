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
import { createHash } from 'crypto';
import { geoTier, cut } from './geo-tier.mjs';
import { EXTENT } from './extents.mjs';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const ROSTER= path.join(ROOT, 'names.csv');
const GAZ   = path.join(ROOT, 'cities15000.txt');
const OUT   = path.join(ROOT, 'GEO.json');
const CHECK = process.argv.includes('--check');
/* The only way to write a register with no gazetteer. Named so it cannot be
   reached by accident, and it says what it costs on the way through. */
const ALLOW_THIN = process.argv.includes('--thin');
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
  'amasya':[40.653,35.833],'manisa':[38.614,27.426],'edirne':[41.677,26.556],
  /* ── REGION-QUALIFIED · 'place|region' ────────────────────────────────────
     "Memphis" is a real city in North Africa and a real city in North America,
     and both are in this roster. An unqualified entry would send every Memphis
     to Egypt, which is the same namesake error in the other direction. These
     keys are tried FIRST and only match when the soul's own Region agrees. */
  'memphis|north africa':[29.845,31.251], 'thebes|north africa':[25.720,32.610],
  'goshen|middle east':[30.800,31.900],   'pella|southern europe':[40.762,22.524],
  'ithaca|southern europe':[38.400,20.717],'stagira|southern europe':[40.535,23.750],
  'medellin|southwestern europe':[38.966,-5.933],'tus|western asia':[36.535,59.520],
  'shadwell|north america':[38.010,-78.400],'nazareth|middle east':[32.702,35.298],
  'qin|east asia':[34.370,108.950],       'sparta|southern europe':[37.074,22.430],
  'uruk|western asia':[31.324,45.636],    'trier|central europe':[49.756,6.639]
};

/* ── THE OFFICE GLYPHS · what a soul WAS ──────────────────────────────────
   Title is 97% filled across 2,043 souls — 146 distinct values, the top 24
   covering 1,440 people. That density is the whole reason this layer exists:
   a mark authored one soul at a time reaches 2% and the map stays dark, while
   a mark for the OFFICE reaches nearly everyone and lets a reader watch kinds
   of authority rise and fall in place as they scrub.

   TWO TIERS, AND THEY MUST NOT LOOK ALIKE. An office mark says "one of 217
   popes"; a personal mark says "this sign is his". Rendered the same, the map
   would quietly claim those are the same kind of fact — the pin-and-wash
   error in another costume. The surface draws the office dim and repeated,
   the personal bright and ringed.

   MONOCHROME UNICODE, NOT EMOJI. The 34 marks already in the roster are
   emoji, including a top hat, which will not survive on a dark map beside a
   photograph. These are sigils.

   Matched longest-first on the title text, so "Emperor of China" is tested
   before "Emperor". Anything unmatched gets NO MARK rather than a fallback —
   a generic sigil on 60 unrecognised titles would be decoration. */
const OFFICE = [
  [/pope|bishop|cardinal|saint|abbot|friar|monk|priest|patriarch|martyr|theolog|reformer/i, '\u2629', 'the church'],
  [/caliph|sultan|emir|vizier|imam|shah|mughal/i,                      '\u263E', 'islamic rule'],
  [/pharaoh|vizier of egypt|egyptian/i,                                '\u2625', 'ancient egypt'],
  [/emperor of china|emperor of japan|shogun|chinese|japanese emperor/i,'\u262F', 'east asian rule'],
  [/emperor|empress|king|queen|monarch|tsar|prince|princess|sultana|valide|caesar|consul/i, '\u2654', 'crown'],
  [/general|conqueror|warlord|warrior|soldier|admiral|commander|knight/i,'\u2694', 'arms'],
  [/philosopher|logician|theorist|scholar|sage|mystic|seer|luminary|oracle/i, '\u2727', 'thought'],
  [/author|writer|poet|playwright|novelist|journalist|historian|storyteller|orator|dramatist/i, '\u2712', 'the pen'],
  [/scientist|physicist|chemist|biologist|astronom|mathematic|alchemist|naturalist|anatomist|geolog|neurolog/i, '\u2697', 'the retort'],
  [/physician|doctor|surgeon|nurse|healer|apothecar/i,                 '\u2695', 'medicine'],
  [/statesman|president|prime minister|senator|diplomat|politician|jurist|lawyer|judge|legislator|activist|whistleblower/i, '\u2696', 'the balance'],
  [/architect|engineer|inventor|builder|urbanist|developer|entrepreneur|financier|industrialist|merchant/i, '\u2692', 'the making'],
  [/explorer|navigator|voyager|pioneer|aviator|cartograph|geograph/i,  '\u2693', 'the voyage'],
  [/composer|musician|singer|conductor|violinist|pianist/i,            '\u266B', 'music'],
  [/artist|painter|sculptor|director|actor|photograph|designer|icon|dancer/i, '\u2726', 'the made image']
];
function office(title) {
  var t = String(title || '').trim();
  if (!t) return null;
  for (var i = 0; i < OFFICE.length; i++) if (OFFICE[i][0].test(t)) return OFFICE[i][1];
  return null;
}

/* ── TERRITORY EXTENTS ────────────────────────────────────────────────────
   Moved to probes/extents.mjs on 4 Sep so probe-events reads the SAME table.
   Copying it would have produced a second set of boundaries free to drift —
   the fault this repo already has two live examples of. */
// EXTENT is imported above.

/* ── PICKING THE RIGHT CITY OF THE NAME · 4 Sep ────────────────────────────
   FOUND BY ATTACK, and it was bad. The first matcher kept the HIGHEST
   POPULATION city for each name, which is the obvious rule and is wrong for a
   roster of the ancient and medieval world. It produced, with full confidence
   and real coordinates:

       Averroes    → Cordoba, ARGENTINA        (not Spain)
       Al-Ghazali  → "Tus" → TUCSON, ARIZONA
       John Cabot  → Venice, OHIO              (not Italy)
       Cortes      → Medellin, COLOMBIA        (not Spain)
       Moses       → Goshen, INDIANA
       Sparta      → Sparta, TURKEY
       Pella       → Pella, RUSSIA

   Checked against the roster's own Region column, 119 of 899 pins — 13% —
   stood outside the region the record assigns them. A WRONG PIN IS WORSE THAN
   NO PIN: an unplaced soul is a stated gap, while this is the map asserting
   something false and looking certain doing it.

   THE ROSTER ALREADY CARRIED THE ANSWER. Region is 72% filled and entirely
   independent of Location, so it can arbitrate between namesakes. A candidate
   inside the soul's own region wins; population only breaks ties WITHIN it.

   AND WHEN NOTHING FITS, NOTHING IS PINNED. If a region is known and no
   candidate of that name lies in it, the soul falls through to unplaced and
   is reported — rather than being dropped onto the biggest namesake on earth,
   which is exactly how Al-Ghazali ended up in Arizona. */
function pick(name, region) {
  const list = G.get(norm(name));
  if (!list || !list.length) return null;
  const box = region ? EXTENT[norm(region)] : null;
  if (box) {
    const inside = list.filter(c => c.lat >= box[0] && c.lat <= box[2] &&
                                    c.lon >= box[1] && c.lon <= box[3]);
    if (inside.length) return inside.reduce((a, c) => c.pop > a.pop ? c : a);
    return { _refused: true };     /* a region is known and this is not in it */
  }
  return list.reduce((a, c) => c.pop > a.pop ? c : a);
}

/* ── read the roster ─────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER,'utf8').split(/\r?\n/).filter(l => l.trim());
if (lines.length < 2) die('names.csv holds no rows. An empty roster is not an empty library.');
const head  = cut(lines[0]).map(s => s.trim().toLowerCase());
const nameCol = ['full name','name'].map(w => head.indexOf(w)).find(i => i > -1);
if (nameCol === undefined) die('names.csv has no "Full Name" column.');
const locCol = head.indexOf('location');
const regCol = head.indexOf('region');
const bCol = head.indexOf('birth-date'), dCol = head.indexOf('death-date');
const tCol = head.indexOf('title'), gCol = head.indexOf('glyph');
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
      /* EVERY CANDIDATE, not just the biggest — see the note at pick() */
      const list = G.get(n) || (G.set(n, []), G.get(n));
      list.push(rec);
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
  /* o = the OFFICE mark (what they were, shared with everyone of that office)
     pg = the PERSONAL mark, if the roster authored one for this soul alone */
  var og = tCol > -1 ? office(r[tCol]) : null;
  if (og) o.o = og;
  var pg = gCol > -1 ? (r[gCol] || '').trim() : '';
  if (pg) o.pg = pg;
  if (g.note) o.note = g.note;

  if (tier === 'city') {
    var rgn = regCol > -1 ? (r[regCol] || '').trim() : '';
    const hit = HISTORICAL[norm(place) + '|' + norm(rgn)] ||
                HISTORICAL[norm(place)] || HISTORICAL[norm(g.full || '')];
    const gz  = pick(place, rgn);
    if (hit)      { o.lat = hit[0]; o.lon = hit[1]; o.src = 'historical'; pin++; }
    else if (gz && gz._refused) { o.tier = 'unplaced'; o.why = 'no ' + place + ' in ' + (r[regCol]||'').trim(); misses.set(place + ' (in ' + (r[regCol]||'').trim() + ')', (misses.get(place + ' (in ' + (r[regCol]||'').trim() + ')')||0)+1); }
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
console.log('offices       ' + souls.filter(s=>s.o).length + '   (a mark for what they were)' +
            '  ·  personal ' + souls.filter(s=>s.pg).length);
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
  gazetteer:{ file:'cities15000.txt', sha256:gazSha, matchesAudited:!gazDrift },
  attribution:'City coordinates © GeoNames, CC BY 4.0. Coastline: Natural Earth (public domain).',
  totals:{ souls:souls.length, pins:pin, washes:wash, silent:silent, unplaced:unplaced },
  souls
};
fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size/1024) + ' KB)');
console.log('───────────────────────────────────────────────────────────');
