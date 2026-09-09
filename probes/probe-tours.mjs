#!/usr/bin/env node
/* ============================================================================
   probe-tours.mjs  ->  Amenti.live/probes/probe-tours.mjs
   ----------------------------------------------------------------------------
   TOURS.csv, CHECKED AGAINST THE SURFACE IT DRIVES

       node probes/probe-tours.mjs .

   A TOUR IS A SEQUENCE OF REGISTER STATES, NOT A SCRIPT (#78). Every frame is
   four values a reader could set by hand — which switches, which period, which
   year, where the camera — and the story is in the ORDER. Nothing is added.

   That is the whole guarantee, and until now NOTHING CHECKED IT. A row could
   name a switch that does not exist, a period that is not one of the five, a
   year outside the scrub, or a camera pointing at ground the frame does not
   cover, and the reader would see a frame that quietly did less than it said.

   -- AND THE CAPTION IS THE ONLY PLACE THE FORMAT CAN LIE ------------------
   Switches cannot assert. Prose can. TOURS.csv states the rule in its own
   header — a caption NAMES WHAT IS ON SCREEN and stops — and a rule kept only
   by whoever writes the next row is not a rule. Section 6 reads every caption
   for the words an argument is made of.

   IT CANNOT KNOW WHETHER A CAPTION IS TRUE. It knows whether a caption has
   changed shape from naming into arguing. That is a narrower thing and it is
   the thing the format actually rests on.

   -- RULE 4 · RETURN TEN TIMES WHAT IT COST -------------------------------
   Findings, not confirmations. A check that passes says one line.

   -- AND IT ACCUSES ITSELF FIRST ------------------------------------------
   Section 0 is what this cannot see, before anything it can.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || '.';
const OUT = [];
const say = (s = '') => { OUT.push(s); console.log(s); };
let findings = 0;

/* the same split the surface uses — quotes protect commas, so a caption with a
   comma in it does not gain a column. SEATS.csv lost 25 rows to exactly that
   on 6 September, and probe-hall.mjs wrote the same bug again on 9 September
   and reported 47 unplaced places where there are 91. */
function cells(line) {
  const out = []; let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
  catch { return null; }
}
function rows(text) {
  if (!text) { return null; }
  const ls = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const head = cells(ls[0]).map(h => h.trim());
  return ls.slice(1)
    .filter(l => l.charAt(0) !== '#')
    .map((l, i) => {
      const c = cells(l), o = { _line: i + 2 };
      head.forEach((h, j) => { o[h] = (c[j] || '').trim(); });
      return o;
    })
    .filter(o => o.tour);
}

/* ── THE VOCABULARY IS READ, NOT RESTATED ─────────────────────────────────
   The twelve switch keys and the five periods live in amenti-attica.js. A
   validator that kept its own copy would pass a tour the surface rejects the
   day either list changes. They are lifted out of the module's source. */
function vocabulary() {
  const src = read('amenti-attica.js');
  if (!src) { return null; }
  const keys = [...src.matchAll(/\{\s*k:\s*'([a-z]+)',\s*label:/g)].map(m => m[1]);
  const periods = [...src.matchAll(/\{\s*k:\s*'([a-z]+)',\s*label:\s*'[^']*',\s*a:/g)]
    .map(m => m[1]);
  const marks = keys.filter(k => !periods.includes(k));
  const scrub = src.match(/class="at-scrub"[^>]*min="(-?\d+)"\s+max="(-?\d+)"/);
  return {
    marks,
    periods,
    yMin: scrub ? +scrub[1] : null,
    yMax: scrub ? +scrub[2] : null
  };
}

function frames() {
  const t = read('FRAMES.csv');
  if (!t) { return null; }
  const out = {};
  (rows(t.replace(/^key,/, 'tour,')) || []).forEach(r => {
    if (!r.radius_km) { return; }
    const la = +r.lat, lo = +r.lon, R = +r.radius_km;
    const dla = R / 111, dlo = R / (111 * Math.cos(la * Math.PI / 180));
    out[r.tour] = { la0: la - dla, la1: la + dla, lo0: lo - dlo, lo1: lo + dlo,
                    name: r.name };
  });
  return out;
}

say('='.repeat(74));
say('  PROBE · TOURS · the sequence checked against the surface it drives');
say('  ' + new Date().toISOString().replace('T', ' ').slice(0, 16));
say('='.repeat(74));

const text = read('TOURS.csv');
const V = vocabulary();
const F = frames();

/* ── 0 · WHAT THIS CANNOT SEE ─────────────────────────────────────────── */
say('');
say('0 · WHAT THIS CANNOT SEE — read before weighing anything below');
say('  · Whether a caption is TRUE. It reads for the SHAPE of an argument, not');
say('    for the truth of one. A false statement of fact will pass here.');
say('  · Whether a tour is worth taking. Order is the whole craft of the form');
say('    and no file probe has an opinion about it.');
say('  · Whether a frame actually draws. probes/attica-probe.js reads the DOM;');
say('    this reads the register. A row can be perfectly legal and show nothing.');
say('  · The camera. It checks the point is inside the frame, not that anything');
say('    is there to look at.');
if (!V) { say('  · THE VOCABULARY — amenti-attica.js was unreadable, so the switch and'); say('    period checks below did not run.'); }
if (!F) { say('  · THE FRAMES — FRAMES.csv was unreadable, so the camera check did not run.'); }

if (!text) {
  say('');
  say('TOURS.csv could not be read. That is the register missing, not the tours');
  say('being empty.');
  process.exit(0);
}

const R = rows(text) || [];
const byTour = {};
R.forEach(r => { (byTour[r.tour] = byTour[r.tour] || []).push(r); });

/* ── 1 · THE SHAPE OF THE FILE ────────────────────────────────────────── */
say('');
say('1 · ' + R.length + ' frames across ' + Object.keys(byTour).length + ' tours' +
    (V ? '  ·  vocabulary: ' + V.marks.length + ' switches, ' + V.periods.length +
         ' periods, scrub ' + V.yMin + '\u2026' + V.yMax : ''));
Object.entries(byTour).forEach(([k, v]) => {
  say('    ' + k.padEnd(16) + String(v.length).padStart(2) + ' frames');
});

/* ── 2 · STEPS THAT DO NOT RUN 1..n ───────────────────────────────────── */
say('');
say('2 · STEPS');
let bad2 = 0;
Object.entries(byTour).forEach(([k, v]) => {
  const n = v.map(r => +r.step).sort((a, b) => a - b);
  const want = n.map((_, i) => i + 1);
  if (n.join(',') !== want.join(',')) {
    bad2++; findings++;
    say('  \u2716 ' + k + ': steps are ' + n.join(',') + ' and should be ' + want.join(','));
  }
});
if (!bad2) { say('  every tour steps 1..n with no gap and no repeat.'); }

/* ── 3 · SWITCHES AND PERIODS THAT DO NOT EXIST ───────────────────────── */
say('');
say('3 · THE VOCABULARY');
let bad3 = 0;
if (V) {
  R.forEach(r => {
    if (r.marks && r.marks !== '-' && r.marks !== '*') {
      r.marks.split('|').map(s => s.trim()).filter(Boolean).forEach(m => {
        if (!V.marks.includes(m)) {
          bad3++; findings++;
          say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step +
              ': `' + m + '` is not a switch. The surface has: ' + V.marks.join(' '));
        }
      });
    }
    if (r.period && !V.periods.includes(r.period)) {
      bad3++; findings++;
      say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step +
          ': `' + r.period + '` is not a period. The surface has: ' + V.periods.join(' '));
    }
  });
  if (!bad3) { say('  every switch and period named is one the surface has.'); }
} else {
  say('  not run.');
}

/* ── 4 · YEARS OUTSIDE THE CLOCK ──────────────────────────────────────── */
say('');
say('4 · THE YEAR');
let bad4 = 0;
R.forEach(r => {
  if (r.year === '') { return; }
  const y = +r.year;
  if (!Number.isFinite(y)) {
    bad4++; findings++;
    say('  \u2716 line ' + r._line + ': year `' + r.year + '` is not a number');
  } else if (V && V.yMin !== null && (y < V.yMin || y > V.yMax)) {
    bad4++; findings++;
    say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step + ': year ' + y +
        ' is outside the scrub (' + V.yMin + ' to ' + V.yMax + '), so the frame ' +
        'cannot be reached by hand and the tour is doing something the reader ' +
        'cannot');
  }
});
if (!bad4) { say('  every year is inside the scrub a reader can move.'); }

/* ── 5 · A CAMERA POINTED OUT OF THE FRAME ────────────────────────────── */
say('');
say('5 · THE CAMERA');
let bad5 = 0;
if (F) {
  /* Every tour in the file today is an Attica tour. When TOURS.csv gains a
     `frame` column this reads it; until then it checks against attica and
     SAYS SO, rather than silently assuming. */
  const fk = 'attica';
  const f = F[fk];
  if (!f) {
    say('  not run — no `' + fk + '` row in FRAMES.csv.');
  } else {
    say('  checked against the ' + f.name + ' frame (TOURS.csv has no `frame`');
    say('  column yet; when it does, this reads it).');
    R.forEach(r => {
      /* ZOOM IS CHECKED BEFORE THE CAMERA, because a row may set one without
         the other and the early return below skipped it. A frame with zoom 44
         and no coordinate passed this probe on its first test run — THE SAME
         SHAPE AS THE fitNote FAULT TWO HOURS EARLIER: unconditional work
         sitting under a conditional exit. */
      const z = r.zoom === '' ? null : +r.zoom;
      if (z !== null && (!Number.isFinite(z) || z < 0.7 || z > 12)) {
        bad5++; findings++;
        say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step +
            ': zoom ' + r.zoom + ' is outside 0.7\u201312, which the surface clamps ' +
            'to \u2014 the frame will not show what the row says');
      }
      if (r.lat === '' && r.lon === '') { return; }
      const la = +r.lat, lo = +r.lon;
      if (!Number.isFinite(la) || !Number.isFinite(lo)) {
        bad5++; findings++;
        say('  \u2716 line ' + r._line + ': camera `' + r.lat + ',' + r.lon + '` is not a point');
        return;
      }
      if (la < f.la0 || la > f.la1 || lo < f.lo0 || lo > f.lo1) {
        bad5++; findings++;
        say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step + ': camera ' +
            la + ',' + lo + ' is outside the frame');
      }
    });
    if (!bad5) { say('  every camera is inside the frame and every zoom reachable.'); }
  }
} else {
  say('  not run.');
}

/* ── 6 · A CAPTION THAT HAS STARTED ARGUING ───────────────────────────── */
say('');
say('6 · THE CAPTIONS');
say('  A caption NAMES WHAT IS ON SCREEN. An argument is a claim no register');
say('  holds, and it belongs in ATTICA-WHY.csv where it is attached to a place');
say('  and checkable.');

/* Words that join two things and assert the joint. A caption needs none of
   them to name a layer, and cannot make an argument without one. */
const CAUSAL = [
  'because', 'so that', ' so ', 'therefore', 'which meant', 'which made',
  'and so', 'thus', 'hence', 'as a result', 'in order to', 'led to',
  'caused', 'meant that', 'proves', 'shows that', 'explains'
];
let bad6 = 0;
R.forEach(r => {
  const c = ' ' + (r.caption || '').toLowerCase() + ' ';
  const hit = CAUSAL.filter(w => c.includes(w));
  if (hit.length) {
    bad6++; findings++;
    say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step + ': `' +
        hit.join('`, `') + '`');
    say('      "' + (r.caption || '') + '"');
  }
  if ((r.caption || '').length > 90) {
    bad6++; findings++;
    say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step + ': ' +
        r.caption.length + ' characters. A caption that will not fit on one ' +
        'line has usually stopped naming and started explaining.');
  }
  if (!(r.caption || '').trim()) {
    bad6++; findings++;
    say('  \u2716 line ' + r._line + ' ' + r.tour + '/' + r.step +
        ': no caption. A frame that does not say what it is showing cannot be ' +
        'checked against what it shows.');
  }
});
if (!bad6) {
  say('  no caption carries a causal word, an over-long line, or a blank.');
  say('  THIS IS NOT PROOF THEY ARE HONEST. It is proof none has taken the');
  say('  shape of an argument, which is the part a machine can see.');
}

/* ── PRINT ────────────────────────────────────────────────────────────── */
say('');
say('-'.repeat(74));
say(findings
  ? '  ' + findings + ' finding' + (findings === 1 ? '' : 's') +
    ' \u2014 every one is a row that will play as something other than it reads.'
  : '  nothing found. Every frame names a switch the surface has, a period it ' +
    'knows,\n  a year a reader can reach, a camera inside the frame, and a ' +
    'caption that\n  has not started arguing.');
say('-'.repeat(74));

try {
  fs.writeFileSync(path.join(ROOT, 'probe-tours.txt'), OUT.join('\n') + '\n');
  say('  wrote probe-tours.txt');
} catch (e) {
  say('  UNREAD \u2014 could not write probe-tours.txt (' + e.message + ')');
}

process.exit(0);
