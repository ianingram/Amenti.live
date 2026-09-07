/* ============================================================================
   probe-narrows.mjs · THE GROUND THAT FORCES A CHOICE, CHECKED       SLIP #74

     node probes/probe-narrows.mjs .

   ── WHAT IT CAN CHECK, AND WHAT IT CANNOT ─────────────────────────────────
   NARROWS.csv is AUTHORED. Every coordinate in it was written from knowledge
   rather than read out of a gazetteer, because cities15000 holds cities and
   does not hold passes. This probe therefore checks SHAPE, not TRUTH: that a
   coordinate is in range, that a thing that forbids passage is drawn as an
   area rather than a dot, that a drained wetland says when.

   IT CANNOT TELL YOU WHETHER THERMOPYLAE IS WHERE THE FILE SAYS IT IS, and it
   says so rather than passing quietly. That is the whole of Rule 3: a check
   that cannot see must report blindness, never a clean bill.

   ── AND WHAT IT RETURNS BEYOND CHECKING ───────────────────────────────────
   Rule 4. A probe that only confirms the file parses has wasted the reading.
   So it also JOINS: which recorded events fall on ground that forces a choice,
   and which narrows nothing has ever happened at. That join is the reason the
   register exists, and it is the first thing anyone will want to know.

   Reports and never fails. Exit 2 only if it cannot read its own inputs.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || '.';
const P = f => path.join(ROOT, f);

const out = [];
const say  = m => out.push(m);
const head = m => { out.push(''); out.push('\u2500\u2500 ' + m + ' ' + '\u2500'.repeat(Math.max(0, 60 - m.length))); };
let findings = 0;
const hit   = m => { findings++; say('   \u00b7 ' + m); };
const blind = [];

function readCsv(file) {
  let t;
  try { t = fs.readFileSync(P(file), 'utf8'); }
  catch { return null; }
  const lines = t.replace(/\r\n/g, '\n').split('\n');
  const head = lines[0];
  const body = lines.slice(1).filter(l => l.trim() && !l.trimStart().startsWith('#'));
  const parse = line => {
    const c = []; let cur = '', q = false;
    for (const ch of line) {
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
      cur += ch;
    }
    c.push(cur); return c;
  };
  const cols = parse(head);
  return body.map(l => Object.fromEntries(parse(l).map((v, i) => [cols[i] || ('c' + i), v])));
}

const nar = readCsv('NARROWS.csv');
if (!nar) { console.log('\n  REFUSES \u2014 no NARROWS.csv at ' + ROOT + '\n'); process.exit(2); }

const num = v => (v === '' || v == null ? null : Number(v));
nar.forEach(r => {
  r._lat = num(r.lat); r._lon = num(r.lon);
  r._lat2 = num(r.lat2); r._lon2 = num(r.lon2);
  r._drained = num(r.drained);
});

console.log('\n' + '='.repeat(64));
console.log('  PROBE \u00b7 NARROWS   ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
console.log('='.repeat(64));
say('');
say(nar.length + ' entries \u00b7 ' +
    nar.filter(r => r.class === 'funnel').length + ' funnel \u00b7 ' +
    nar.filter(r => r.class === 'forbid').length + ' forbid');

/* ── 1 · SHAPE ─────────────────────────────────────────────────────────────
   A FORBIDDING PLACE DRAWN AS A DOT IS THE WASH-AS-PIN FAULT, POINTED THE
   OTHER WAY. The Pripet Marshes are not at a coordinate; they are an area the
   size of a country, and drawn as a point they would claim a precision that
   would make them look crossable. The map's one law reaches this register. */
head('SHAPE \u2014 is each thing drawn as the kind of thing it is');
const FUNNEL_KINDS = ['pass', 'strait', 'ford', 'isthmus', 'defile', 'gate'];
const FORBID_KINDS = ['bog', 'marsh', 'fen', 'forest', 'sand', 'ice'];
const seen = new Set();
nar.forEach(r => {
  if (!r.key) hit('a row with no key: ' + (r.name || '?'));
  else if (seen.has(r.key)) hit('duplicate key: ' + r.key);
  seen.add(r.key);
  if (!['funnel', 'forbid'].includes(r.class)) hit(r.key + ' \u2014 class is "' + r.class + '"');
  const kinds = r.class === 'forbid' ? FORBID_KINDS : FUNNEL_KINDS;
  if (!kinds.includes(r.kind))
    hit(r.key + ' \u2014 kind "' + r.kind + '" is not a ' + r.class + ' kind');
  if (r.class === 'forbid' && (r._lat2 == null || r._lon2 == null))
    hit(r.key + ' FORBIDS PASSAGE AND IS DRAWN AS A POINT \u2014 it needs an area, or it ' +
        'claims a precision that would make it look crossable');
  if (r.class === 'forbid' && r._lat2 != null && (r._lat2 <= r._lat || r._lon2 <= r._lon))
    hit(r.key + ' \u2014 the far corner is not past the near one; the box is inside out');
  if (!(r.why || '').trim())
    hit(r.key + ' HAS NO `why` \u2014 without it this row is a coordinate, not an explanation');
});
if (!findings) say('   nothing \u2014 every row is the shape its class requires');

/* ── 2 · IN RANGE, AND NOT ON TOP OF EACH OTHER ───────────────────────────── */
head('COORDINATES \u2014 plausible, not verified');
let coordHits = 0;
nar.forEach(r => {
  [[r._lat, 'lat', 90], [r._lat2, 'lat2', 90], [r._lon, 'lon', 180], [r._lon2, 'lon2', 180]]
    .forEach(([v, n, lim]) => {
      if (v != null && (Number.isNaN(v) || Math.abs(v) > lim)) {
        coordHits++; hit(r.key + ' \u2014 ' + n + ' = ' + r[n] + ' is out of range');
      }
    });
  if (r._lat == null || r._lon == null) { coordHits++; hit(r.key + ' \u2014 no coordinate at all'); }
});
for (let i = 0; i < nar.length; i++)
  for (let j = i + 1; j < nar.length; j++) {
    const a = nar[i], b = nar[j];
    if (a._lat == null || b._lat == null) continue;
    if (Math.hypot(a._lat - b._lat, a._lon - b._lon) < 0.2) {
      coordHits++; hit(a.key + ' and ' + b.key + ' sit on the same spot');
    }
  }
findings += 0;
if (!coordHits) say('   in range and distinct.');
say('   \u26a0 AND THAT IS ALL THIS CAN SAY. The coordinates are authored, not');
say('     gazetteered. This probe cannot tell you whether Thermopylae is where');
say('     the file puts it. Verify against a source before treating any of it as placed.');
blind.push('whether any coordinate is CORRECT \u2014 there is no gazetteer of passes to check against');

/* ── 3 · A WETLAND THAT IS NO LONGER ONE ──────────────────────────────────
   The Fens were drained in the 1600s and the Pontine Marshes in the 1930s.
   Drawn across a map that scrubs to 4000 BC they put modern farmland under a
   Norman battle. This is exactly the made-lakes rule turned round: a reservoir
   is not drawn BEFORE it was impounded, and a fen is not drawn AFTER it was
   drained. */
head('DRAINED \u2014 a fen must not be drawn under a Norman battle');
const wet = ['bog', 'marsh', 'fen'];
let drainHits = 0;
nar.forEach(r => {
  if (r._drained != null && !wet.includes(r.kind)) {
    drainHits++; hit(r.key + ' has a drained year and is a "' + r.kind + '" \u2014 only wetland drains');
  }
  if (r._drained != null && (r._drained < -4000 || r._drained > new Date().getUTCFullYear())) {
    drainHits++; hit(r.key + ' \u2014 drained ' + r.drained + ' is outside the register');
  }
});
const stillWet = nar.filter(r => wet.includes(r.kind) && r._drained == null);
say('   ' + nar.filter(r => r._drained != null).length + ' drained \u00b7 ' +
    stillWet.length + ' wetland still standing');
if (drainHits === 0) say('   no fault in the drained years.');
say('   \u2014 UNCHECKABLE HERE: whether a wetland listed as still standing has in fact');
say('     been drained since. An absent `drained` is a claim, and this cannot test it.');
blind.push('whether a wetland with no `drained` year is genuinely still wet');

/* ── 4 · THE JOIN · WHY THE REGISTER EXISTS ────────────────────────────────
   Rule 4. Checking that a file parses returns nothing. THIS is the return:
   which recorded events happened on ground that forced a choice, and which
   narrows nothing has ever happened at. Neither register holds this; it is
   edge data, and it is exactly as strong as its two parents. */
/* ── ACCUSED BEFORE DELIVERY ────────────────────────────────────────────
   THE FIRST RUN OF THIS SECTION PUT THE FOUNDING OF ROME IN THE PONTINE
   MARSHES and the Geneva Convention on the Great St Bernard Pass. Both are
   true statements about DISTANCE and false statements about place: Rome is
   near the marsh, Geneva is near the pass, and neither event happened at
   either. A 1.2-degree radius is 130 kilometres.

   That is the register's own recorded fault, committed by its probe. Deriving
   Place from proximity is what put Marathon in Provence and Waterloo in Texas;
   PLACE IS AUTHORED, A MACHINE MAY VERIFY IT AND MUST NEVER INVENT ONE.

   So the radius is tightened to 0.35 degrees, the forbidding boxes are read
   exactly rather than padded, and — the part that matters — THE SECTION IS
   RELABELLED. It reports CANDIDATES for a reader to confirm, never a claim
   that an event happened on this ground. A probe may hand over a shortlist.
   It may not hand over a conclusion dressed as one. */
head('CANDIDATES \u2014 events NEAR ground that forces a choice (not a claim)');
let ev = null;
try { ev = JSON.parse(fs.readFileSync(P('EVENTS.json'), 'utf8')).events || []; } catch { ev = null; }
if (!ev) {
  say('   UNREAD \u2014 no EVENTS.json. This is the reading the register was built for.');
  blind.push('the events join \u2014 EVENTS.json was not readable at ' + ROOT);
} else {
  const near = (e, r) => {
    if (e.lat == null) return false;
    if (r.class === 'forbid' && r._lat2 != null)
      return e.lat >= r._lat && e.lat <= r._lat2 &&
             e.lon >= r._lon && e.lon <= r._lon2;
    return Math.hypot(e.lat - r._lat, e.lon - r._lon) < 0.35;   /* ~38 km */
  };
  const pairs = [];
  nar.forEach(r => {
    const on = ev.filter(e => near(e, r));
    if (on.length) pairs.push([r, on]);
  });
  say('   Proximity only. An event within 38 km of a pass did not necessarily');
  say('   happen at it \u2014 read these as places to check, never as a join.');
  say('');
  if (!pairs.length) {
    say('   no recorded event falls on any of these ' + nar.length + ' places.');
    say('   \u2014 THAT IS ITSELF THE FINDING, and worth reading twice. Either the');
    say('     coordinates are off, or EVENTS.csv holds no battle at a pass \u2014 which');
    say('     would say more about the event register than about this one.');
  } else {
    pairs.sort((a, b) => b[1].length - a[1].length);
    pairs.forEach(([r, on]) => {
      say('   ' + r.name);
      on.slice(0, 4).forEach(e => say('       ' + (e.y < 0 ? Math.abs(e.y) + ' BC' : 'AD ' + e.y) +
                                      '  ' + e.n));
      if (on.length > 4) say('       \u2026 and ' + (on.length - 4) + ' more');
    });
  }
  const silent = nar.filter(r => !ev.some(e => near(e, r)));
  say('');
  say('   ' + silent.length + ' of ' + nar.length + ' hold no recorded event: ' +
      silent.map(r => r.key).join(' '));
  say('   \u2014 a narrow with nothing on it is not a fault. It is either a gap in');
  say('     EVENTS.csv or a place that genuinely mattered without a battle.');
}

/* ── report ──────────────────────────────────────────────────────────────── */
console.log(out.join('\n'));
console.log('');
console.log('\u2500\u2500 UNREAD ' + '\u2500'.repeat(53));
blind.forEach(b => console.log('   ' + b));
console.log('   \u2014 none of these is a fault. They are things this probe cannot see.');
console.log('');
console.log('='.repeat(64));
console.log('  ' + (findings ? findings + ' thing(s) worth a look' : 'no findings') +
            ' \u2014 none of them a failure');
console.log('='.repeat(64) + '\n');
