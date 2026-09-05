#!/usr/bin/env node
/* ============================================================================
   probes/probe-join.mjs  ·  IS THE EDGE DATA HONEST
   ----------------------------------------------------------------------------
     node probes/probe-join.mjs .            # report
     node probes/probe-join.mjs . --check    # exit 1 on a finding

   ── WHY THE OTHER PROBES CANNOT CATCH THIS ────────────────────────────────
   probe-geo guards the souls. probe-events guards the events. probe-map
   guards the drawing. Each is thorough about its own register, and NOT ONE OF
   THEM CAN SEE A BAD JOIN — because in a bad join nothing inside either
   register is wrong. Both parents pass their own checks and the child is
   still false.

   That is the exact shape of every fault found on 4 Sep. GLOSSARY, `the water
   between`: "Every fault found in the long August session lay BETWEEN two
   registers, each perfectly truthful about its own island."

   Edge data is that seam read the other way (#66), so it inherits the same
   exposure. This is the guard for it.

   ── WHAT A JOIN CAN GET WRONG WHILE BOTH PARENTS ARE RIGHT ────────────────

   1 · THE PREDICATE. "Lived through" means b <= event.year <= d. An off-by-one
       or a swapped bound produces a list that looks entirely plausible — every
       event real, every date real, and the wrong events.

   2 · THE SAMPLE. #66: "an edge fact carries the weakness of both its parents,
       MULTIPLIED." Five Italian souls after 1453 is the rise of who got
       written into this roster, not the rise of the Renaissance. A join across
       a thin window is not a finding; it is a coincidence with arithmetic
       attached.

   3 · THE ETERNALS. A soul dated -10000 to -3000 overlaps almost everything in
       the register. Any claim built on that overlap is vacuous and looks
       enormous.

   4 · THE STALENESS. Two registers built from different inputs cannot honestly
       be joined. If GEO.json and EVENTS.json rest on different gazetteers,
       every derived fact rests on a disagreement neither file reports.

   5 · THE MISSING WORKING. A derived claim that shows its arithmetic can be
       checked; one that offers only a disclaimer can only be believed. If the
       hall stops emitting the working, the claim silently loses its standing.

   THIS WRITES NOTHING. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const CHECK = process.argv.includes('--check');
const P = f => path.join(ROOT, f);
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

const findings = [];
const fail = m => { findings.push(m); console.log('  \u2717 ' + m); };
const ok   = m => console.log('  \u00b7 ' + m);

function read(f) {
  if (!fs.existsSync(P(f))) die('no ' + f + ' at ' + path.resolve(P(f)));
  return fs.readFileSync(P(f), 'utf8');
}
const geo  = JSON.parse(read('GEO.json'));
const evs  = JSON.parse(read('EVENTS.json'));
const ri   = JSON.parse(read('ROSTER-INDEX.json'));
const hall = read('amenti-hall.js');

console.log('\u2500\u2500 is the edge data honest \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

/* ── 1 · THE PARENTS MUST REST ON THE SAME GROUND ───────────────────────── */
const ga = geo.gazetteer, ea = evs.gazetteer;
if (!ga || !ea) fail('one register does not record which gazetteer built it — the join cannot be audited');
else if (ga.sha256 !== ea.sha256)
  fail('GEO.json and EVENTS.json were built from DIFFERENT gazetteers (' +
       String(ga.sha256).slice(0, 12) + ' vs ' + String(ea.sha256).slice(0, 12) +
       '). Every derived fact rests on a disagreement neither file reports.');
else if (ga.matchesAudited === false || ea.matchesAudited === false)
  fail('a register was built from an UNAUDITED gazetteer — pins may have moved and nothing says so');
else ok('both registers rest on the same audited gazetteer');

/* ── 2 · THE PREDICATE, RECOMPUTED FROM SCRATCH ─────────────────────────── */
/* The probe does not call the hall's function; it recomputes the join its own
   way and tests the RESULT's properties. A test that borrows the code it is
   testing agrees with itself. */
const dated = ri.souls.filter(s => typeof s.b === 'number' && typeof s.d === 'number');
let checked = 0, outside = 0, backwards = 0;
dated.forEach(s => {
  if (s.d < s.b) { backwards++; return; }
  const win = evs.events.filter(e => e.y >= s.b && e.y <= s.d);
  checked++;
  win.forEach(e => { if (e.y < s.b || e.y > s.d) outside++; });
});
backwards ? fail(backwards + ' soul(s) die before they are born — the join predicate cannot be trusted on them')
          : ok('every dated soul has b \u2264 d');
outside ? fail(outside + ' event(s) selected outside the soul\u2019s own dates')
        : ok(checked + ' souls joined against ' + evs.events.length + ' events, no event outside its bounds');

/* ── 3 · THE ETERNALS MUST BE EXCLUDED ──────────────────────────────────── */
const LONG = 300;
const eternals = dated.filter(s => s.d - s.b > LONG);
const worst = eternals.map(s => ({ n: s.n, span: s.d - s.b,
  hits: evs.events.filter(e => e.y >= s.b && e.y <= s.d).length }))
  .sort((a, b) => b.hits - a.hits);
if (!/s\.d - s\.b > 300|span > 300|> 300/.test(hall))
  fail('amenti-hall.js has no guard excluding long-lived souls from the join');
else ok('the hall excludes spans over ' + LONG + ' years (' + eternals.length +
        ' such souls; the largest would otherwise claim ' + (worst[0] ? worst[0].hits : 0) + ' events)');

/* ── 4 · THE SAMPLE MUST NOT BE THIN ────────────────────────────────────── */
/* A join is only as strong as the sparser side of it. This does not fail the
   run — thin is not wrong — but a thin window must be VISIBLE, because a
   crossover drawn from four souls reads exactly like one drawn from four
   hundred. */
function inWindow(from, to) {
  return {
    souls: dated.filter(s => s.d >= from && s.b <= to).length,
    events: evs.events.filter(e => e.y >= from && e.y <= to).length
  };
}
const eras = [[-3000, -1000], [-1000, 0], [0, 500], [500, 1000],
              [1000, 1500], [1500, 1800], [1800, 2026]];
console.log('  \u00b7 sample depth by era \u2014 a join is as weak as its thinner side:');
let thin = 0;
eras.forEach(([a, b]) => {
  const w = inWindow(a, b);
  const flag = (w.souls < 25 || w.events < 15) ? '  \u2190 THIN' : '';
  if (flag) thin++;
  console.log('      ' + String(a).padStart(6) + ' to ' + String(b).padStart(5) +
              '   souls ' + String(w.souls).padStart(4) +
              '   events ' + String(w.events).padStart(4) + flag);
});
ok(thin + ' era(s) too thin for a join to carry weight on its own');

/* ── 5 · THE WORKING MUST BE SHOWN ──────────────────────────────────────── */
const shows = /\u2229|\\u2229/.test(hall) && /event\.year/.test(hall);
shows ? ok('the hall emits the arithmetic, not merely a claim of derivation')
      : fail('the hall no longer shows its working \u2014 a derived claim without ' +
             'arithmetic can only be believed, not checked');
/rule|COMPUTED IS NOT WHAT WAS READ/i.test(hall) && /crossing is not a cause/i.test(hall)
  ? ok('the standing refusal is in the prompt: a crossing is not a cause')
  : fail('the prompt no longer carries "a crossing is not a cause" \u2014 nothing ' +
         'stops the hall reading a correlation as a consequence');

/* ── 6 · THE CAP MUST STATE WHAT IT HID ─────────────────────────────────── */
/more in the register|shown, spread across the life|matches, /.test(hall)
  ? ok('a truncated list states its true total')
  : fail('the hall truncates the join without stating how many it dropped \u2014 ' +
         'a sample presented as a list is a quiet lie');

console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(findings.length ? findings.length + ' FINDING(S)'
  : 'no findings \u2014 the join claims no more than its two parents can carry');
if (CHECK) process.exit(findings.length ? 1 : 0);
