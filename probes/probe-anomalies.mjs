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

/* ── WHAT THE REGISTER ALREADY SAYS, AND THIS PROBE DID NOT ASK ────────────
   names.csv carries a `Dating` column. 384 souls hold the value `reign`, and
   for those the b/d cells are a REGNAL SPAN, not a life — flagged on purpose
   (SLIP #56, the interim while the schema is decided). ROSTER-INDEX.json
   carries it through as a boolean `reign` on the soul record.

   Sections 1 and 2 below were written without knowing that. Section 2 reported
   102 short lives as "a REIGN entered as a life?" and 101 of them were reigns
   the roster had already declared. Section 1 read two co-emperors sharing a
   reign window as one duplicated soul. Neither was a fault in the register.
   Both were this probe reaching past a field it was never told about.

   If the field ever stops reaching the index, THIS PROBE SAYS SO rather than
   quietly passing — an unread check that looks clean is worse than a red one. */
const isReign = s => s.reign === 1 || s.reign === true ||
                     String(s.dating || '').toLowerCase() === 'reign';
const DATING_READ = ri.souls.some(isReign);
const UNREAD = '   \u26a0 NO SOUL IN ROSTER-INDEX.json CARRIES `reign` \u2014 this test did ' +
               'not run.\n     names.csv holds Dating=reign for 384 souls; probe-roster.mjs ' +
               'should carry it\n     through. Until it does, the hits below include reigns ' +
               'the roster already declares.';

/* A YEAR THAT IS A CENTURY WEARING A DATE.  `-501` is not a birth, it is
   "5th century BC" typed into a cell that only accepts a year, and subtracting
   one such cell from another manufactures a lifespan nobody wrote.
   Deliberately narrow: BC round hundreds are left alone because the mythic
   block legitimately uses them (-10000 to -3000). */
const isCenturyStamp = y => typeof y === 'number' && (y > 0 ? y % 100 === 0 : Math.abs(y) % 100 === 1);

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
  let found = 0, mutedReign = 0, mutedStamp = 0;
  Object.values(seen).filter(g => g.length > 1).forEach(g => {
    /* same dates AND a shared word in the name is the strong signal */
    const words = g.map(s => new Set(norm(s.n).split(' ').filter(w => w.length > 3)));
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) {
        if (![...words[i]].some(w => words[j].has(w))) continue;

        /* TWO KINGS ARE NOT ONE KING. If both rows are declared reigns, the
           shared window is a shared THRONE, not a shared person — Isaac II and
           Alexios IV were co-emperors, father and son. A merge here destroys a
           soul to fix a fault that does not exist. */
        if (DATING_READ && isReign(g[i]) && isReign(g[j])) { mutedReign++; continue; }

        /* Both ends a century stamp: the two rows agree on nothing but the
           century somebody typed when the year was unknown. */
        if (isCenturyStamp(g[i].b) && isCenturyStamp(g[i].d)) { mutedStamp++; continue; }

        found++;
        hit(g[i].n + '  /  ' + g[j].n + '   both ' + yr(g[i].b) + '\u2013' + yr(g[i].d));
      }
  });
  if (!found) none();
  if (!DATING_READ) console.log(UNREAD);
  else if (mutedReign) console.log('   \u2014 ' + mutedReign + ' pair(s) suppressed: both sides declared reigns, sharing a throne not a life.');
  if (mutedStamp) console.log('   \u2014 ' + mutedStamp + ' pair(s) suppressed: both dates are century stamps. See the next section.');
}

/* ── 2 · A LIFE THAT IS NOT A LIFE ─────────────────────────────────────── */
head('LIFESPANS THAT DO NOT LOOK LIKE LIVES');
{
  let f = 0, declared = 0;
  ri.souls.forEach(s => {
    if (typeof s.b !== 'number' || typeof s.d !== 'number') return;
    const span = s.d - s.b;
    if (span < 0) { f++; hit(s.n + ' dies before birth: ' + yr(s.b) + '\u2013' + yr(s.d)); }
    else if (span === 0) { f++; hit(s.n + ' lived zero years: ' + yr(s.b)); }
    else if (span > 0 && span < 5) {
      /* Only worth reporting where the roster has NOT already said `reign`. */
      if (DATING_READ && isReign(s)) { declared++; return; }
      f++; hit(s.n + ' lived ' + span + ' years \u2014 ' + yr(s.b) + '\u2013' + yr(s.d) + '  (a REIGN entered as a life?)');
    }
    else if (span > 120 && span < 400) { f++; hit(s.n + ' lived ' + span + ' years'); }
  });
  if (!f) none();
  if (!DATING_READ) console.log(UNREAD);
  else if (declared) console.log('   \u2014 ' + declared + ' short span(s) not reported: the roster declares them reigns.');
}

/* ── 2b · A CENTURY TYPED INTO A YEAR ──────────────────────────────────────
   Nobody was born in exactly AD 400. The cell means "5th century" and the
   register cannot say so, so it says a year and every span measured from it is
   an artifact. Argaeus II and Crateuas of Macedon read -501 to -401 apiece,
   which is not a reign and not a life; it is the same century written twice.

   REPORTED, NEVER FAILED. Some of these will be real. */
head('YEARS THAT LOOK LIKE CENTURIES');
{
  let f = 0, both = 0;
  ri.souls.forEach(s => {
    const b = isCenturyStamp(s.b), d = isCenturyStamp(s.d);
    if (!b && !d) return;
    f++;
    if (b && d) { both++; hit(s.n + '  BOTH ends stamped: ' + yr(s.b) + '\u2013' + yr(s.d)); }
    else hit(s.n + '  ' + (b ? 'birth' : 'death') + ' stamped: ' + yr(s.b) + '\u2013' + yr(s.d));
  });
  if (!f) none();
  else console.log('   \u2014 ' + f + ' soul(s), ' + both + ' with both ends. A stamped end cannot ' +
                   'carry a lifespan,\n     and a dated position cannot be checked against one.');
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

/* ── 6 · A SOUL SEATED WHERE THE PLACE DID NOT EXIST ─────────────────────
   THE TRAP THIS CHECK FELL INTO, 6 Sep. It read every `founded|built|completed`
   event and took its PLACE as the thing founded. The League of Nations was
   founded AT Geneva; Geneva was not founded in 1920. So Rousseau, dead in 1778,
   was reported as standing in a city that did not yet exist — and Peter the
   Great in Moscow, Dante in Florence, Louis XVI at Versailles, on the founding
   dates of the Soviet Union, the Medici Bank and the German Empire.

   Nothing was wrong in EVENTS.csv. The subject and the place are different
   columns and this reader collapsed them. GLOSSARY, the water between.

   AN EVENT NOW DATES A PLACE ONLY WHEN THE EVENT IS ABOUT THAT PLACE — its
   name must contain the place name. `Constantinople founded @ Constantinople`
   qualifies; `NATO founded @ Washington` does not. Sites still date their own
   ground, which is what they are. */
head('ANACHRONISMS \u2014 A SOUL AT A PLACE YOUNGER THAN THEY ARE');
{
  const founded = {};
  let refused = 0;
  (ev && ev.events || []).filter(e => /founded|founding|built|completed/i.test(e.n) && e.place)
    .forEach(e => {
      const k = norm(e.place);
      if (!k || !norm(e.n).includes(k)) { refused++; return; }   /* the place is the venue, not the subject */
      if (founded[k] == null || e.y < founded[k]) founded[k] = e.y;
    });
  (geo.sites || []).forEach(s => { const k = norm(s.place); if (founded[k] == null || s.b < founded[k]) founded[k] = s.b; });
  let f = 0;
  geo.souls.filter(s => s.place && typeof s.d === 'number').forEach(s => {
    const y = founded[norm(s.place)];
    if (y != null && s.d < y) { f++; hit(s.n + ' died ' + yr(s.d) + ' at ' + s.place + ', which the register dates from ' + yr(y)); }
  });
  if (!f) none();
  if (refused) console.log('   \u2014 ' + refused + ' founding event(s) ignored: the place was the venue, not the subject.');
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
