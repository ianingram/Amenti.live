#!/usr/bin/env node
/* ============================================================================
   probes/probe-timeline.mjs  ·  CAN A READER BE PLACED IN TIME?

     node probes/probe-timeline.mjs            # from the repository root

   THIS WRITES NOTHING. It is a reading.

   ── WHAT IT WATCHES, AND WHY IT IS NOT A UNIT TEST ────────────────────────
   The timeline makes one claim: A READER FINISHING AN ANSWER CAN BE SHOWN
   WHERE THEY STAND IN TIME AND WHO STOOD BESIDE THEM. Everything else \u2014 the
   fixed 200-year window, the wireframe bars, both scrolls \u2014 is an
   implementation of that claim, and probe3 is the standing lesson about what
   happens to a test written against an implementation: the engine moved into
   the bundle and seven assertions broke that were never about the ship.

   So this asks the claim, in the four places it can quietly stop being true:

     \u2460 EVERY ROOM CAN BE PLACED. A room the timeline cannot date shows the
       reader nothing, and says nothing about why.
     \u2461 THE JOIN HOLDS. 12 of 52 room keys differ from their roster key \u2014
       `lincoln` against `abraham-lincoln`. KEYS.json carries the aliases and
       probe-roster writes them; if that stops, a quarter of the library
       silently loses its position.
     \u2462 THE REGISTERS ARE THE SHAPE THE SURFACE EXPECTS. Dates, categories,
       columns. A register can be perfectly valid and still not answer.
     \u2463 AND THE THINGS THAT MAKE IT DRAW NONSENSE ARE STILL COUNTED \u2014 the
       eternals, the living, the duplicates. Those are not faults to fix; they
       are properties of the roster the renderer must keep handling, and the
       day their counts move is the day a drawing quietly changes meaning.

   ── WHAT IT CANNOT SEE, STATED PLAINLY ────────────────────────────────────
   IT DOES NOT RENDER. There is no browser here. It cannot tell you whether
   the axis stays put while the rows scroll, whether a label is legible over
   the pyramid's lit face, or whether the two scrolls fight each other. Those
   need an eye, and the captain's own reading of the live page is the other
   half of this instrument. A green run here means THE DATA CAN SUPPORT THE
   DRAWING, not that the drawing is good.
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const ROOT = process.argv.slice(2).find(a => !a.startsWith('--')) || '.';
const WINDOW_YEARS = 200;      /* must match SPAN in amenti-timeline.js */
const ETERNAL      = 1000;     /* must match ETERNAL_YEARS there */

let pass = 0, fail = 0, unread = 0;
const say   = m => console.log(m);
const num   = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const ok    = m => { pass++;   say('  PASS    ' + m); };
const bad   = m => { fail++;   say('  FAIL    ' + m); };
const blind = m => { unread++; say('  UNREAD  ' + m); };
const note  = m => say('  ----    ' + m);

function read(rel, asJson) {
  try {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return asJson ? JSON.parse(t) : t;
  } catch (e) { blind('could not read ' + rel + ' \u2014 ' + (e.code || e.message)); return null; }
}

/* The same tolerant shape Page2's ingestCsvText and the timeline both use.
   Parsing these files a third way here would be a fixture testing a fixture. */
function csv(text) {
  const out = [];
  String(text).replace(/\r\n/g, '\n').split('\n').forEach(line => {
    if (!line.trim()) return;
    const cells = []; let cur = '', q = false;
    for (const c of line) {
      if (c === '"') { q = !q; continue; }
      if (c === ',' && !q) { cells.push(cur); cur = ''; continue; }
      cur += c;
    }
    cells.push(cur);
    out.push(cells.map(s => s.trim()));
  });
  return out;
}

say('');
say('\u2500\u2500 can a reader be placed in time? \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
say('');

const roster = read('ROSTER-INDEX.json', true);
const lib    = read('LIBRARY.json', true);
const tlSrc  = read('amenti-timeline.js', false);
const evText = read('EVENTS.csv', false);
const skText = read('SKY.csv', false);
if (unread) { say(''); note('nothing is claimed about the timeline.'); say(''); process.exit(1); }

const souls = (roster.souls || []);

/* ── ① every room can be placed ──────────────────────────────────────────── */

const byKey = {};
souls.forEach(s => {
  byKey[s.k] = s;
  (s.keys || []).forEach(k => { byKey[k] = s; });
});

const rooms = (lib.rooms || []);
const unplaceable = rooms.filter(r => {
  const s = byKey[r.key];
  return !s || typeof s.b !== 'number' || typeof s.d !== 'number';
});
if (unplaceable.length)
  bad(num(unplaceable.length) + ' of ' + num(rooms.length) +
      ' rooms cannot be placed in time \u2014 ' + unplaceable.slice(0, 6).map(r => r.key).join(', '));
else
  ok('all ' + num(rooms.length) + ' rooms resolve to a soul with both dates');

/* ── ② the join, and the aliases that carry it ───────────────────────────── */

const direct = rooms.filter(r => souls.some(s => s.k === r.key)).length;
const viaAlias = rooms.length - direct;
const withAlias = souls.filter(s => (s.keys || []).length).length;

if (viaAlias > 0 && withAlias === 0) {
  bad(num(viaAlias) + ' rooms depend on an alias and NO soul carries one \u2014 probe-roster has stopped writing `keys`');
} else if (viaAlias > 0) {
  ok(num(direct) + ' rooms join by their own key, ' + num(viaAlias) +
     ' by an alias from KEYS.json (' + num(withAlias) + ' souls carry one)');
} else {
  ok('every room joins by its own key; no alias needed');
}

/* ── ③ the registers are the shape the surface expects ───────────────────── */

const dated = souls.filter(s => typeof s.b === 'number' && typeof s.d === 'number').length;
if (dated === 0) bad('no soul carries both dates \u2014 nothing can be placed at all');
else if (dated < souls.length)
  ok(num(dated) + ' of ' + num(souls.length) + ' souls placeable (' +
     num(souls.length - dated) + ' cannot be drawn as a span)');
else ok('all ' + num(souls.length) + ' souls carry both a birth and a death');

const ev = csv(evText);
const evRows = ev.filter(r => !isNaN(parseFloat(r[0])));
if (evRows.length < 1) bad('EVENTS.csv yields no usable rows \u2014 the axis will carry no anchors');
else ok(num(evRows.length) + ' events parse, ' +
        evRows[0][0] + ' to ' + evRows[evRows.length - 1][0]);

const sk = csv(skText);
const skRows = sk.filter(r => !isNaN(parseFloat(r[0])));
if (skRows.length < 1) blind('SKY.csv yields no usable rows');
else {
  /* SKY.csv earns its place by matching orbital theory. A count that has
     drifted means the file was regenerated by a method that broke \u2014 which is
     exactly how the first run was caught, 16% to 161% high. */
  const per = { Jupiter: 11.862, Saturn: 29.457, Uranus: 84.02, Neptune: 164.79 };
  const yrs = skRows.map(r => parseFloat(r[0]));
  const span = Math.max(...yrs) - Math.min(...yrs);
  let drifted = [];
  Object.keys(per).forEach(b => {
    const got = skRows.filter(r => r[1] === b).length;
    const exp = span / per[b] * 2;
    if (got && Math.abs(got - exp) / exp > 0.05) drifted.push(b + ' ' + got + ' vs ' + Math.round(exp));
  });
  if (drifted.length)
    bad('SKY.csv no longer matches orbital theory \u2014 ' + drifted.join(', ') +
        '. It was regenerated by a method that broke.');
  else
    ok(num(skRows.length) + ' sky alignments, and every body still within 5% of its orbital period');
}

/* ── ④ the properties that make it draw nonsense ─────────────────────────── */

const eternals = souls.filter(s => typeof s.b === 'number' && (s.d - s.b) >= ETERNAL);
const thisYear = new Date().getUTCFullYear();
const living   = souls.filter(s => s.d >= thisYear);

const seen = {}, dupes = [];
souls.forEach(s => {
  const k = s.b + ':' + s.d + ':' + String(s.n).toLowerCase().replace(/^(saint|st\.?|gautama|simon)\s+/, '');
  if (seen[k]) dupes.push(s.n + ' / ' + seen[k]); else seen[k] = s.n;
});

note('');
note('the roster\u2019s three hazards, counted so a change is visible:');
note('  eternals (kept off the person axis)   ' + num(eternals.length));
note('  living (death year >= ' + thisYear + ')       ' + num(living.length));
note('  probable duplicate souls              ' + num(dupes.length));
if (dupes.length) note('    e.g. ' + dupes.slice(0, 3).join(' \u00b7 '));
note('');

/* The renderer must still be handling each of these. If the code stops
   mentioning them, the drawing has quietly changed meaning: a god on the
   person axis, a death mark on a living person, two bars at one point. */
[['ETERNAL_YEARS', eternals.length, 'a god would be drawn as a person with a very long life'],
 ['THIS_YEAR',     living.length,   'a living soul would be given a death mark'],
].forEach(([token, count, consequence]) => {
  if (!count) return;
  if (tlSrc.indexOf(token) === -1)
    bad('amenti-timeline.js no longer mentions ' + token + ' \u2014 ' + consequence +
        ' (' + num(count) + ' souls affected)');
  else ok('the renderer still handles ' + token + ' (' + num(count) + ' souls)');
});

/* ── the claim itself, on the rooms a reader will actually open ──────────── */

const sample = ['brutus', 'julius-caesar', 'lincoln', 'helen-keller', 'wd-gann'];
let placed = 0, empty = [];
sample.forEach(k => {
  const s = byKey[k];
  if (!s) return;
  if ((s.d - s.b) >= ETERNAL) return;
  const mid = s.b + (s.d - s.b) / 2;
  const from = mid - WINDOW_YEARS / 2, to = mid + WINDOW_YEARS / 2;
  const alive = souls.filter(x => typeof x.b === 'number' &&
                  (x.d - x.b) < ETERNAL && x.b <= to && x.d >= from).length;
  placed++;
  if (alive < 2) empty.push(k + ' (' + alive + ' alive)');
});
if (!placed) blind('none of the sample rooms could be placed');
else if (empty.length)
  bad(empty.length + ' sample room(s) open onto a near-empty window \u2014 ' + empty.join(', '));
else
  ok('all ' + placed + ' sample rooms open onto a window with company in it');

say('');
say('\u2500'.repeat(60));
if (unread)      say('\u2717 ' + unread + ' thing(s) the instrument could not see. No verdict.');
else if (fail)   say('\u2717 ' + fail + ' FAILURE(S). A reader cannot reliably be placed in time.');
else             say('\u2713 all clear (' + pass + ' checks). The data can support the drawing \u2014 whether the drawing is GOOD needs an eye.');
say('');
process.exit(unread || fail ? 1 : 0);
