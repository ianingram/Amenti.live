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
import { BATTLEFIELDS, EVENT_SEATS, COUNTRY_CODE } from './events-gaz.mjs';

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
  /* added 5 Sep for SEATS.csv — namesakes INSIDE one country, which the
     country check is structurally unable to settle */
  'princeton':   [ 40.3573, -74.6672],   /* New Jersey — the gazetteer prefers Princeton, FLORIDA */
  'cambridge':   [ 52.2000,   0.1167],   /* England — the events table means Massachusetts */
  'shrewsbury':  [ 52.7101,  -2.7521],
  'falmouth':    [ 50.1544,  -5.0711],
  /* villages a life passed through, added 5 Sep with the first seat tranche */
  'ferney voltaire': [ 46.2560,   6.1080],
  'ferney-voltaire': [ 46.2560,   6.1080],
  'baddeck':         [ 46.0990, -60.7530],
  'san casciano in val di pesa': [ 43.6570, 11.1860],
  'giverny':         [ 49.0760,   1.5330],
  'stagira':         [ 40.5470,  23.7500],
  'rohrau':          [ 48.0500,  16.8830],
  'biran':           [ 20.7700, -75.9500],
  'linlithgow':      [ 55.9770,  -3.6000],
  /* third seat tranche, 5 Sep */
  'tus':             [ 36.4870,  59.5230],   /* Iran — the gazetteer offers Tucson */
  'medellin':        [ 38.9720,  -5.9560],   /* Extremadura — Cortes; NOT Colombia */
  'kartarpur':       [ 32.0330,  74.9330],   /* Pakistan, the shrine; NOT the Indian town */
  'wallingford':     [ 51.5990,  -1.1250],   /* Oxfordshire */
  'oxford':          [ 42.1170, -71.8650],   /* Massachusetts — Clara Barton; England is below */
  'oxford england':  [ 51.7520,  -1.2577],
  'adams':           [ 42.6230, -73.1180],   /* Massachusetts — not Pulandian, China */
  'cuacos de yuste': [ 39.9200,  -5.7300],
  'azpeitia':        [ 43.1810,  -2.2670],
  'montagnola':      [ 45.9770,   8.9250],
  'le cateau cambresis':[50.1000, 3.5460],
  'le cateau-cambresis':[50.1000, 3.5460],
  'kaliste':         [ 49.4600,  15.2400],
  'raiding':         [ 47.4400,  16.6300],
  'saint paul de vence':[43.6970, 7.1220],
  'saint-paul-de-vence':[43.6970, 7.1220],
  'cagnes sur mer':  [ 43.6640,   7.1490],
  'cagnes-sur-mer':  [ 43.6640,   7.1490],
  'aix en provence': [ 43.5297,   5.4474],
  'aix-en-provence': [ 43.5297,   5.4474],
  'sanremo':         [ 43.8160,   7.7760],
  'glen echo':       [ 38.9680, -77.1420],
  'feeding hills':   [ 42.0700, -72.6800],
  'saint anns bay':  [ 18.4340, -77.2010],
  'nkroful':         [  4.9830,  -2.3170],
  'la higuera':      [-18.9000, -64.3000],
  'santiniketan':    [ 23.6800,  87.6830],
  'fatehpur sikri':  [ 27.0940,  77.6610],
  'nankana sahib':   [ 31.4520,  73.7060],
  'sultanpur lodhi': [ 31.2170,  75.2000],
  'bejaia':          [ 36.7500,   5.0670],
  'farab':           [ 42.5000,  70.0000],
  'tiaret':          [ 35.3710,   1.3170],
  'maaseik':         [ 51.0970,   5.7900],
  'okazaki':         [ 34.9550, 137.1740],
  'andijan':         [ 40.7830,  72.3500],
  'dohad':           [ 22.8350,  74.2540],
  'umerkot':         [ 25.3610,  69.7360],
  'horsens':         [ 55.8610,   9.8500],
  'petropavlovsk kamchatsky':[53.0450,158.6500],
  'petropavlovsk-kamchatsky':[53.0450,158.6500],
  'einsiedeln':      [ 47.1270,   8.7500],
  'manresa':         [ 41.7280,   1.8230],
  'saint malo':      [ 48.6490,  -2.0260],
  'saint-malo':      [ 48.6490,  -2.0260],
  'chislehurst':     [ 51.4160,   0.0700],
  'saumur':          [ 47.2600,  -0.0770],
  'torquay':         [ 50.4620,  -3.5250],
  'mthatha':         [-31.5890,  28.7840],
  'king williams town':[-32.8830, 27.3960],
  'zhongshan':       [ 22.5170, 113.3930],
  'aracataca':       [ 10.5920, -74.1890],
  'klosterneuburg':  [ 48.3050,  16.3250],
  'kusnacht':        [ 47.3180,   8.5850],
  'kilchberg':       [ 47.3230,   8.5430],
  'calw':            [ 48.7140,   8.7400],
  'vitebsk':         [ 55.1900,  30.2050],
  'amersfoort':      [ 52.1560,   5.3880],
  'valldemossa':     [ 39.7090,   2.6220],
  'eisenstadt':      [ 47.8460,  16.5230],
  'cremona':         [ 45.1330,  10.0250],
  'great barrington':[ 42.1960, -73.3620],
  'battle creek':    [ 42.3210, -85.1800],
  'northampton':     [ 42.3250, -72.6410],
  'new bedford':     [ 41.6360, -70.9340],
  'easton':          [ 38.7740, -76.0760],
  'auburn':          [ 42.9320, -76.5660],
  'prayagraj':       [ 25.4358,  81.8463],
  'vinh':            [ 18.6700, 105.6900],
  /* second seat tranche, 5 Sep — namesakes and villages */
  'nola':            [ 40.9260,  14.5280],   /* Campania — the gazetteer offers New Orleans */
  'lincoln':         [ 53.2307,  -0.5406],   /* England — not Nebraska */
  'milan':           [ 45.4642,   9.1900],   /* Italy; Edison's Milan, Ohio is below */
  'milan ohio':      [ 41.2967, -82.6013],
  'tampico':         [ 41.6300, -89.7870],   /* Illinois — not Tamaulipas */
  'bergen':          [ 52.7580,   9.9500],   /* Bergen-Belsen, Lower Saxony — not Norway */
  'la haye descartes':[47.0080,  0.7020],
  'la haye-descartes':[47.0080,  0.7020],
  'motiers':         [ 46.9210,   6.6110],
  'hyncice':         [ 49.7690,  17.6520],
  'helgoland':       [ 54.1820,   7.8850],
  'ketchum':         [ 43.6810,-114.3630],
  'jinggangshan':    [ 26.7480, 114.2890],
  'yanan':           [ 36.5960, 109.4900],
  'shaoshan':        [ 27.9150, 112.5270],
  'caprera':         [ 41.2000,   9.4670],
  'mougins':         [ 43.6000,   7.0000],
  'villeblevin':     [ 48.2500,   3.0830],
  'cape juby':       [ 27.9500, -12.9200],
  'warm springs':    [ 32.8890, -84.6810],
  'hyde park':       [ 41.7840, -73.9330],
  'oak park':        [ 41.8850, -87.7845],
  'west orange':     [ 40.7987, -74.2390],
  'sighetu marmatiei':[47.9280, 23.8890],
  'tres coracoes':   [-21.6970, -45.2530],
  'saint peter port':[ 49.4550,  -2.5360],
  'civitavecchia':   [ 42.0930,  11.7960],
  'zamosc':          [ 50.7180,  23.2520],
  'weil der stadt':  [ 48.7500,   8.8730],
  'schorndorf':      [ 48.8050,   9.5270],
  'chisinau':        [ 47.0105,  28.8638],
  'petropolis':      [-22.5050, -43.1790],   /* Brazil — the gazetteer prefers Saint Petersburg */
  'pont aven':       [ 47.8560,  -3.7460],
  'pont-aven':       [ 47.8560,  -3.7460],
  'bletchley':       [ 51.9950,  -0.7400],
  'la fleche':       [ 47.6980,  -0.0740],
  'los alamos':      [ 35.8880,-106.3060],
  'ithaca':          [ 42.4440, -76.5010],
  'santa ana':       [ 33.7455,-117.8677],
  'palos de la frontera': [ 37.2280, -6.8930],   /* whence Columbus sailed, 1492 */   /* Cornwall — an alternate-name collision sends this to Portland, Maine */
  'puerto baquerizo moreno': [ -0.9017, -89.6100],   /* San Cristobal, Galapagos */
  'praia':       [ 14.9315, -23.5125],   /* Cape Verde — St Jago */
  'ushuaia':     [-54.8019, -68.3030],
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

/* ── THE DATED POSITIONS · 5 Sep ───────────────────────────────────────────
   SEATS.csv holds where a soul was AND WHEN. It exists because the roster's
   Location column is the BIRTHPLACE — measured, nineteen of twenty
   unambiguous figures (SLIP #68) — and because one corrected place would
   still be a single point standing for a whole life.

   THE RESOLVING HAPPENS HERE, NOT IN THE BROWSER. Every guard that makes a
   coordinate trustworthy lives in this file and its tables: the country
   arbitration that caught Cordoba-in-Argentina three times, the historical
   seats a population gazetteer does not hold, the refusal to guess. A surface
   that geocoded for itself would have none of them, and would look the same.

   So GEO.json carries positions ALREADY PLACED, and the map only chooses
   which one a year falls in. */
function resolveSeats(seatRows, key, region) {
  const rows = seatRows[key];
  if (!rows) return null;
  const out = [];
  for (const r of rows) {
    if (!Number.isFinite(r.from)) continue;
    const o = { from: r.from };
    if (r.to != null) o.to = r.to;
    if (r.what) o.what = r.what;
    if (r.note) o.note = r.note;
    /* a position may honestly have NO place — Darwin's Beagle years are five
       years at sea, and a seat there would be an invention */
    if (r.place) {
      const g = geoTier(r.place);
      const k = norm(g.place);
      const ext = EXTENT[k];
      if (ext) { o.ext = ext; o.place = g.place; }
      else {
        /* ── AN AUTHORED TABLE MUST NOT OUTRANK A NAMED CITY · 5 Sep ─────
           EVENT_SEATS holds 'cambridge' -> Cambridge, MASSACHUSETTS, added
           for the founding of Facebook. Consulted first, it put Newton at
           Harvard. The events table answers "where did this event happen",
           and a soul's position is a different question with the same key.

           So the authored tables are used only when the place names no
           country, or when the gazetteer cannot answer. A stated country is
           the strongest claim in the row and it wins. */
        /* ── WHOSE TABLE ANSWERS · 5 Sep ─────────────────────────────────
           HISTORICAL is this file's own — ancient seats for souls. It is
           consulted FIRST because it is hand-written for exactly this
           question and settles namesakes a country cannot: there are two
           Princetons in the United States and the gazetteer prefers the one
           in Florida.

           EVENT_SEATS belongs to the EVENTS register and answers a different
           question with the same keys. Consulted first, it holds
           'cambridge' -> Cambridge, MASSACHUSETTS (added for the founding of
           Facebook) and it put Newton at Harvard. So it is the LAST resort,
           after the gazetteer has failed with a stated country. */
        const hit = HISTORICAL[k];
        if (hit) { o.lat = hit[0]; o.lon = hit[1]; o.src = 'authored'; o.place = g.place; }
        else {
          /* ── THE REGION MUST NOT ARBITRATE A POSITION · 5 Sep ────────────
             A soul's Region says where they CAME FROM. Using it to judge a
             later position refuses the very thing this register exists for:
             Einstein's region is Central Europe, so the Cordoba guard — the
             one that saved him three times — threw out Princeton at -74
             degrees, correctly by its own logic and wrongly for this purpose.

             A dated position arbitrates the way an event does: on the COUNTRY
             WRITTEN IN THE PLACE ITSELF. "Princeton, United States" must
             resolve inside US or it is refused. The claim carries its own
             check, which is what lets a life leave the region it began in. */
          /* G holds a LIST of candidates per name — that is the whole point of
             it, and reading it as a single record silently unplaced London,
             Paris and New York. Choose within the list by the stated country. */
          const list = G.get(k) || [];
          const stated = (r.place.split(',')[1] || '').trim().toLowerCase();
          const want = COUNTRY_CODE[stated];
          const cands = want ? list.filter(c => c.cc === want) : list;
          const hit2 = cands.sort((a, b) => b.pop - a.pop)[0];
          if (hit2) {
            o.lat = +hit2.lat.toFixed(4); o.lon = +hit2.lon.toFixed(4);
            o.src = 'geonames'; o.place = g.place;
          } else {
            /* last resort: a village too small for a population gazetteer.
               These live in the events table because that is where the first
               of them were needed; a place is a place. */
            const alt = BATTLEFIELDS[k] || EVENT_SEATS[k];
            if (alt) { o.lat = alt[0]; o.lon = alt[1]; o.src = 'authored'; o.place = g.place; }
            else { o.place = g.place; o.unplaced = true; }
          }
        }
      }
    }
    out.push(o);
  }
  return out.length ? out.sort((a, b) => a.from - b.from) : null;
}

/* ── THE CROSSINGS · 5 Sep ─────────────────────────────────────────────────
   JOURNEYS.csv holds a move that was ITSELF AN EVENT — an emigration, an
   exile, a flight. Resolved here for the same reason the seats are: every
   guard that makes a coordinate trustworthy lives in this file.

   It is deliberately NOT derived from SEATS.csv. Two seats with a gap between
   them are not a journey; joining them would invent the passage. A crossing is
   authored, or it is not drawn. */
function resolveJourneys(jrows, key, region) {
  const rows = jrows[key];
  if (!rows) return null;
  const out = [];
  for (const r of rows) {
    if (!Number.isFinite(r.year)) continue;
    const a = placeOnce(r.from, region), b = placeOnce(r.to, region);
    if (!a || !b) continue;                 /* an endpoint that will not resolve is not a line */
    out.push({ y: r.year, a: [a.lat, a.lon], b: [b.lat, b.lon],
               from: a.place, to: b.place, what: r.what || '', note: r.note || '' });
  }
  return out.length ? out.sort((x, y) => x.y - y.y) : null;
}

/* one place string to one coordinate, by the same ladder a position uses */
function placeOnce(place, region) {
  if (!place) return null;
  const g = geoTier(place);
  const k = norm(g.place);
  const hit = HISTORICAL[k];
  if (hit) return { lat: hit[0], lon: hit[1], place: g.place };
  const ext = EXTENT[k];
  if (ext) return { lat: (ext[0] + ext[2]) / 2, lon: (ext[1] + ext[3]) / 2, place: g.place };
  const list = G.get(k) || [];
  const stated = (place.split(',')[1] || '').trim().toLowerCase();
  const want = COUNTRY_CODE[stated];
  const c = (want ? list.filter(x => x.cc === want) : list).sort((x, y) => y.pop - x.pop)[0];
  if (c) return { lat: +c.lat.toFixed(4), lon: +c.lon.toFixed(4), place: g.place };
  const alt = BATTLEFIELDS[k] || EVENT_SEATS[k];
  return alt ? { lat: alt[0], lon: alt[1], place: g.place } : null;
}

/* ── read the roster ─────────────────────────────────────────────────────── */
if (!fs.existsSync(ROSTER)) die('no names.csv at ' + path.resolve(ROSTER));
const lines = fs.readFileSync(ROSTER,'utf8').split(/\r?\n/).filter(l => l.trim());

/* SEATS.csv is OPTIONAL: without it every soul falls back to Location, which
   is the map we had this morning and which the surface now labels honestly. */
const seatRows = {}, jrnRows = {};
const JRN = path.join(ROOT, 'JOURNEYS.csv');
if (fs.existsSync(JRN)) {
  const jl = fs.readFileSync(JRN, 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'));
  const jh = cut(jl[0]).map(x => x.trim().toLowerCase());
  const c = n => jh.indexOf(n);
  for (const line of jl.slice(1)) {
    const r = cut(line);
    const k = (r[c('key')] || '').trim();
    if (!k) continue;
    (jrnRows[k] || (jrnRows[k] = [])).push({
      year: parseInt(r[c('year')], 10),
      from: (r[c('from')] || '').trim(), to: (r[c('to')] || '').trim(),
      what: (r[c('what')] || '').trim(), note: (r[c('note')] || '').trim()
    });
  }
}
const SEATS = path.join(ROOT, 'SEATS.csv');
if (fs.existsSync(SEATS)) {
  const sl = fs.readFileSync(SEATS, 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'));
  const sh = cut(sl[0]).map(x => x.trim().toLowerCase());
  const c = n => sh.indexOf(n);
  for (const line of sl.slice(1)) {
    const r = cut(line);
    const k = (r[c('key')] || '').trim();
    if (!k) continue;
    (seatRows[k] || (seatRows[k] = [])).push({
      from: parseInt(r[c('from')], 10),
      to:   r[c('to')] && r[c('to')].trim() ? parseInt(r[c('to')], 10) : null,
      place: (r[c('place')] || '').trim(),
      what:  (r[c('what')]  || '').trim(),
      note:  (r[c('note')]  || '').trim()
    });
  }
}
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
    /* cc added 5 Sep: the souls' path arbitrates by REGION BOX and never
       needed a country. A dated position cannot use the region — a life
       leaves the region it began in, which is the whole point of SEATS.csv —
       so it arbitrates on the country written in the place instead, and that
       needs this field. Costs one property and changes nothing above. */
    const rec = { lat:+f[4], lon:+f[5], pop:+f[14], name:f[1], cc:f[8] };
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
  var seats = resolveSeats(seatRows, o.k, rgn);
  if (seats) o.seats = seats;
  var jrn = resolveJourneys(jrnRows, o.k, rgn);
  if (jrn) o.journeys = jrn;
  souls.push(o);
}

const unplaced = souls.filter(s => s.tier === 'unplaced').length;
console.log('── the place register ─────────────────────────────────────');
console.log('souls         ' + souls.length);
console.log('pins          ' + pin + '   (a dot — the record supports a point)');
console.log('washes        ' + wash + '   (an extent — "somewhere in here", never a dot)');
console.log('silent        ' + silent + '   (myth or no record — no mark, honestly)');
console.log('UNPLACED      ' + unplaced + '   (a name nothing could resolve — reported, never guessed)');
console.log('dated seats   ' + souls.filter(s => s.seats).length +
            '   (souls with a position AND a year \u2014 the rest fall back to Location, which is the birthplace)');
console.log('crossings     ' + souls.reduce((n,s)=>n+(s.journeys?s.journeys.length:0),0) +
            '   (a journey that was itself an event \u2014 authored, never derived from two seats)');
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
  totals:{ souls:souls.length, pins:pin, washes:wash, silent:silent, unplaced:unplaced,
           datedSeats:souls.filter(s=>s.seats).length,
           crossings:souls.reduce((n,s)=>n+(s.journeys?s.journeys.length:0),0) },
  souls
};
fs.writeFileSync(OUT, JSON.stringify(payload) + '\n');
console.log('\nwrote         ' + OUT + '  (' + Math.round(fs.statSync(OUT).size/1024) + ' KB)');
console.log('───────────────────────────────────────────────────────────');
