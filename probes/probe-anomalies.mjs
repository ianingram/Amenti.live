#!/usr/bin/env node
/* ============================================================================
   probes/probe-anomalies.mjs  ·  WHAT NOBODY THOUGHT TO LOOK FOR
   ----------------------------------------------------------------------------
     node probes/probe-anomalies.mjs .

   ── WHY THIS ONE IS DIFFERENT ─────────────────────────────────────────────
   Every other probe on this ship VERIFIES. Someone was bitten, wrote a rule,
   and the probe now enforces it: the country must agree, the position must sit
   inside the life, the gazetteer must match its hash. Each one guards a fault
   already paid for.

   None of them can find a fault nobody has met yet. A probe that only tests
   what it was told to test returns exactly what it was given.

   So this one goes HUNTING. It knows no rules. It looks for the shapes that
   are usually wrong — the same name twice, a life that outlasts a species, a
   builder who died before the building began, a coordinate that is exactly
   nothing — and it REPORTS RATHER THAN FAILS, because a hunt turns up
   coincidences as well as faults and the difference is a person's judgement.

   IT NEVER EXITS NON-ZERO. Nothing here should block a build. Everything here
   should be read.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const ROOT = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const P = f => path.join(ROOT, f);
const J = f => { try { return JSON.parse(fs.readFileSync(P(f), 'utf8')); } catch (e) { return null; } };

const geo = J('GEO.json'), ev = J('EVENTS.json'), ri = J('ROSTER-INDEX.json');
if (!geo || !ri) { console.error('REFUSES: need GEO.json and ROSTER-INDEX.json'); process.exit(2); }

let n = 0;
const head = t => console.log('\n\u2500\u2500 ' + t + ' ' + '\u2500'.repeat(Math.max(0, 62 - t.length)));
const hit  = m => { n++; console.log('   ' + m); };
const none = () => console.log('   (nothing)');

const yr = y => y < 0 ? Math.abs(y) + ' BC' : 'AD ' + y;
const norm = s => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

console.log('\u2550'.repeat(66));
console.log('  ANOMALIES \u00b7 a hunt, not a check \u00b7 ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
console.log('\u2550'.repeat(66));

/* ── 1 · THE SAME PERSON TWICE ─────────────────────────────────────────────
   A roster grows by addition and nobody notices a name arriving in its second
   spelling. Two entries for one soul split their mentions, their rooms and
   their connections, and every count above them is quietly wrong. */
head('THE SAME PERSON, ENTERED TWICE?');
{
  const seen = {};
  ri.souls.forEach(s => {
    if (typeof s.b !== 'number') return;
    const k = s.b + ':' + s.d;
    (seen[k] = seen[k] || []).push(s);
  });
  let found = 0;
  Object.values(seen).filter(g => g.length > 1).forEach(g => {
    /* same dates AND a shared word in the name is the strong signal */
    const words = g.map(s => new Set(norm(s.n).split(' ').filter(w => w.length > 3)));
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++)
        if ([...words[i]].some(w => words[j].has(w))) {
          found++;
          hit(g[i].n + '  /  ' + g[j].n + '   both ' + yr(g[i].b) + '\u2013' + yr(g[i].d));
        }
  });
  if (!found) none();
}

/* ── 2 · A LIFE THAT IS NOT A LIFE ─────────────────────────────────────── */
head('LIFESPANS THAT DO NOT LOOK LIKE LIVES');
{
  let f = 0;
  ri.souls.forEach(s => {
    if (typeof s.b !== 'number' || typeof s.d !== 'number') return;
    const span = s.d - s.b;
    if (span < 0) { f++; hit(s.n + ' dies before birth: ' + yr(s.b) + '\u2013' + yr(s.d)); }
    else if (span === 0) { f++; hit(s.n + ' lived zero years: ' + yr(s.b)); }
    else if (span > 0 && span < 5) { f++; hit(s.n + ' lived ' + span + ' years \u2014 ' + yr(s.b) + '\u2013' + yr(s.d) + '  (a REIGN entered as a life?)'); }
    else if (span > 120 && span < 400) { f++; hit(s.n + ' lived ' + span + ' years'); }
  });
  if (!f) none();
}

/* ── 3 · THE SLUGGER AND THE ACCENT ────────────────────────────────────── */
head('KEYS NOBODY COULD GUESS');
{
  let f = 0;
  ri.souls.forEach(s => {
    if (/--|^-|-$/.test(s.k)) { f++; hit(s.n + '  \u2192  ' + s.k + '   (accents stripped, not transliterated)'); }
  });
  if (!f) none(); else console.log('   \u2014 anyone authoring against the roster by name will miss these.');
}

/* ── 4 · A BUILDER WHO WAS NOT THERE ───────────────────────────────────── */
head('BUILDINGS AND THEIR PEOPLE \u2014 DO THE DATES AGREE?');
{
  const by = {}; geo.souls.forEach(s => by[s.k] = s);
  let f = 0;
  (geo.sites || []).forEach(st => {
    const b = st.by && by[st.by], e = st.endedBy && by[st.endedBy];
    if (b && typeof b.b === 'number' && (st.b < b.b || st.b > b.d)) {
      f++; hit(st.n + ' built ' + yr(st.b) + ' but ' + b.n + ' lived ' + yr(b.b) + '\u2013' + yr(b.d));
    }
    if (e && typeof e.b === 'number' && st.e != null && (st.e < e.b || st.e > e.d)) {
      f++; hit(st.n + ' ended ' + yr(st.e) + ' but ' + e.n + ' lived ' + yr(e.b) + '\u2013' + yr(e.d));
    }
  });
  if (!f) none();
}

/* ── 5 · COORDINATES THAT ARE SUSPICIOUS RATHER THAN WRONG ─────────────── */
head('COORDINATES WORTH A SECOND LOOK');
{
  let f = 0;
  const at = {};
  geo.souls.filter(s => s.lat != null).forEach(s => {
    if (Math.abs(s.lat) < 0.01 && Math.abs(s.lon) < 0.01) { f++; hit(s.n + ' sits at 0,0 \u2014 the null island'); }
    const k = s.lat.toFixed(4) + ',' + s.lon.toFixed(4);
    (at[k] = at[k] || []).push(s.place);
  });
  Object.entries(at).forEach(([k, places]) => {
    const u = [...new Set(places)];
    if (u.length > 1) { f++; hit('one coordinate, ' + u.length + ' place names: ' + u.join(' / ') + '  @ ' + k); }
  });
  if (!f) none();
}

/* ── 6 · A SOUL SEATED WHERE THE PLACE DID NOT EXIST ───────────────────── */
head('ANACHRONISMS \u2014 A SOUL AT A PLACE YOUNGER THAN THEY ARE');
{
  const founded = {};
  (ev && ev.events || []).filter(e => /founded|founding|built|completed/i.test(e.n) && e.place)
    .forEach(e => { const k = norm(e.place); if (founded[k] == null || e.y < founded[k]) founded[k] = e.y; });
  (geo.sites || []).forEach(s => { const k = norm(s.place); if (founded[k] == null || s.b < founded[k]) founded[k] = s.b; });
  let f = 0;
  geo.souls.filter(s => s.place && typeof s.d === 'number').forEach(s => {
    const y = founded[norm(s.place)];
    if (y != null && s.d < y) { f++; hit(s.n + ' died ' + yr(s.d) + ' at ' + s.place + ', which the register dates from ' + yr(y)); }
  });
  if (!f) none();
}

/* ── 7 · WHAT THE MAP CANNOT SHOW BECAUSE NOBODY IS THERE ──────────────── */
head('CENTURIES WITH ALMOST NOBODY IN THEM');
{
  let f = 0;
  for (let c = -3000; c < 2000; c += 100) {
    const alive = geo.souls.filter(s => typeof s.b === 'number' && s.d >= c && s.b <= c + 100);
    const placed = alive.filter(s => s.lat != null);
    if (alive.length && placed.length < 4)
      { f++; hit(yr(c) + '\u2013' + yr(c + 100) + ': ' + alive.length + ' alive, only ' + placed.length + ' on the map'); }
  }
  if (!f) none();
  console.log('   \u2014 a window like this cannot carry an edge-data reading (#66).');
}

/* ── 8 · THE ROSTER'S OWN SHAPE ────────────────────────────────────────── */
head('WHERE THE ROSTER IS THIN');
{
  const era = [[-4000,-500,'before 500 BC'],[-500,500,'500 BC \u2013 AD 500'],[500,1400,'AD 500\u20131400'],
               [1400,1800,'1400\u20131800'],[1800,2026,'since 1800']];
  era.forEach(([a, b, l]) => {
    const s = ri.souls.filter(x => typeof x.b === 'number' && x.b >= a && x.b < b);
    const rooms = s.filter(x => x.r).length;
    console.log('   ' + l.padEnd(20) + String(s.length).padStart(5) + ' souls · ' +
                String(rooms).padStart(3) + ' rooms · ' +
                (s.length ? (rooms / s.length * 100).toFixed(1) : '0') + '%');
  });
  const t = {};
  ri.souls.forEach(s => { const k = (s.t || '(none)').trim(); t[k] = (t[k] || 0) + 1; });
  const once = Object.entries(t).filter(([k, v]) => v === 1).map(([k]) => k);
  console.log('   titles used exactly once: ' + once.length +
              (once.length ? ' \u2014 ' + once.slice(0, 8).join(', ') + (once.length > 8 ? ' \u2026' : '') : ''));
  console.log('   \u2014 a title used once is usually a variant of one used often.');
}

console.log('\n' + '\u2550'.repeat(66));
console.log('  ' + n + ' THING(S) WORTH A LOOK \u2014 none of them a failure, all of them unasked for');
console.log('\u2550'.repeat(66) + '\n');
