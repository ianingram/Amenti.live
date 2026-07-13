/* ============================================================================
   probe18 — THE GLASS GATE

   The acceptance tests from THE-GLASS-GATE.md. Do not mark a step done without
   these.

   THE ONE THAT MATTERS MOST:
     Remove the reading -> EVERY PANE MUST SHOW THE EMPTY-GLASS BOX.
     Not a cached fleet. Not a blank page. THE BOX.

     Because the alternative is what ships-manifest.html has been doing all
     along: displaying a beautiful, confident, months-old fleet, IN GREEN, with
     no way to know it had gone blind.

     It was not lying. IT WAS STILL SHOWING THE LAST THING IT SAW, FOREVER.
   ============================================================================ */
const fs = require('fs');
const { execSync } = require('child_process');

let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);

const SEM  = fs.readFileSync('fleet-semantics.js', 'utf8');
const PANE = fs.readFileSync('engine-room.html', 'utf8');

/* ---------------------------------------------------------------------- */
console.log('\n1 \u00b7 THE CLAIMS FILE CONTAINS NO FACT THE SCANNER COULD CHECK');
{
  /* If a line could be falsified by a grep, it does not belong in the claims.
     It belongs in the reading, which nobody types. */
  const win = {};
  new Function('window', SEM)(win);
  const S = win.FLEET_SEMANTICS;
  is(!!S, 'fleet-semantics.js loads and sets FLEET_SEMANTICS');

  const FORBIDDEN = ['calls', 'loads', 'size', 'bytes', 'endpoints', 'tables', 'sha256', 'status'];
  const bad = [];
  const walk = (o, path) => {
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) {
      if (FORBIDDEN.includes(k)) bad.push(path + '.' + k);
      walk(o[k], path + '.' + k);
    }
  };
  [...S.ships, ...S.crew].forEach((x, i) => walk(x, x.file));
  S.watches.forEach(w => { if ('status' in w) bad.push(w.id + '.status'); });

  is(bad.length === 0,
     bad.length ? 'DERIVABLE FACTS FOUND IN THE CLAIMS: ' + bad.join(', ')
                : 'no derivable facts in the claims \u2014 no `calls`, no `loads`, no `size`, no `status`');

  is(S.watches.every(w => 'probe' in w),
     'every watch names its instrument \u2014 or names NULL, which renders RED');
  is(S.watches.filter(w => !w.probe).length >= 1,
     'and at least one watch admits it has NO PROBE. "DATA WATCH: verified \u2713" is dead.');

  const conv = S.engines.find(e => e.id === 'conversation');
  is(!!conv && conv.invariants.every(i => 'probe' in i),
     'every invariant of the Conversation Engine names the probe that holds it');
  is(!!conv.traps && conv.traps.length >= 5,
     'and the traps are written down \u2014 already paid for, never rediscovered');
}

/* ---------------------------------------------------------------------- */
console.log('\n2 \u00b7 THE MERGE FINDS THE DRIFT AND REFUSES THE COMMIT');
{
  const run = (structure) => {
    try {
      const out = execSync(`node tools/merge.js fleet-semantics.js ${structure} 2>&1`, { encoding: 'utf8' });
      return { code: 0, out };
    } catch (e) { return { code: e.status, out: e.stdout || '' }; }
  };

  const live = run('/tmp/live.json');
  const M = JSON.parse(fs.readFileSync('fleet-manifest.js', 'utf8')
    .replace(/^[\s\S]*?window\.FLEET_MANIFEST = /, '').replace(/;\s*$/, ''));

  is(M.health.contradicted > 0, `the live repo has ${M.health.contradicted} CONTRADICTED row(s)`);
  is(live.code === 1, 'and the merge EXITS 1 \u2014 a commit that makes the manifest lie does not merge');

  const throttle = M.drift.find(d => /throttle/.test(d.subject));
  is(!!throttle && /weighing/i.test(throttle.reading),
     'IT FOUND WHAT NOBODY WAS LOOKING FOR: amenti-throttle.js is retired \u2014 and weighing.html still loads it');

  const dw = M.watches.find(w => w.id === 'DATA WATCH');
  is(dw && dw.stamp === 'UNPROVEN',
     'DATA WATCH is UNPROVEN \u2014 it showed GREEN for months with nothing behind it');

  is(M.drift.some(d => d.stamp === 'UNDECLARED'),
     'and the reading found files that NOBODY CLAIMED');
}

/* ---------------------------------------------------------------------- */
console.log('\n3 \u00b7 THE MERGE REFUSES TO RUN WITHOUT A READING');
{
  let code = 0;
  try { execSync('node tools/merge.js fleet-semantics.js /tmp/nope.json 2>&1', { encoding: 'utf8' }); }
  catch (e) { code = e.status; }
  is(code === 2,
     'no reading \u2192 the merge REFUSES (exit 2). A merge with no reading is just the claims \u2014 ' +
     'and the claims are exactly what has lied to us every time.');
}

/* ---------------------------------------------------------------------- */
console.log('\n4 \u00b7 THE PANE KNOWS NOTHING \u2014 grep it for facts');
{
  const body = PANE.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const FACTS = [
    /amenti-chat\.js\s+(is|calls|loads)/i,
    /\bverified\s*\u2713/i,
    /\b(320|1100|6104|6865)\b/,          // any number from the reading, hard-coded
    /const\s+FALLBACK|var\s+FALLBACK|\|\|\s*\{[^}]*ships/i,
    /localStorage|sessionStorage/,        // a mirror with a memory is a portrait
  ];
  const found = FACTS.filter(re => re.test(body));
  is(found.length === 0,
     found.length ? 'THE PANE STATES A FACT OR CACHES A READING \u2014 ' + found.join(' ')
                  : 'no facts, no fallback data, no cached reading. The glass knows nothing.');

  /* STRIP THE COMMENTS FIRST. The pane's header comment MENTIONS
     fleet-semantics.js in prose, and the naive check read the prose as code.
     THE FIFTH TIME TODAY A COMMENT HAS EATEN A CHECK. Learning a lesson is not
     the same as installing it. */
  const code = PANE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  is(/<script src="fleet-manifest\.js"/.test(code), 'it loads fleet-manifest.js');
  is(!/(src|fetch|import)[^\n]*fleet-(semantics|structure)/.test(code),
     'and ONLY that \u2014 it never reads two sources. A pane must never choose.');
}

/* ---------------------------------------------------------------------- */
console.log('\n5 \u00b7 NO READING \u2192 THE EMPTY-GLASS BOX');
{
  /* THE MOST IMPORTANT TEST IN THIS FILE. */
  const win = { FLEET_MANIFEST: undefined };
  const shown = {};
  const el = (id) => (shown[id] = shown[id] || { style: {}, set innerHTML(v){}, set textContent(v){} });
  const doc = { getElementById: el };

  const script = PANE.slice(PANE.lastIndexOf('<script>') + 8, PANE.lastIndexOf('</script>'));
  new Function('window', 'document', 'Date', script)(win, doc, Date);

  is(shown['empty'] && shown['empty'].style.display === 'block',
     'NO READING \u2192 the EMPTY-GLASS BOX is shown');
  is(!shown['glass'] || shown['glass'].style.display !== 'block',
     '\u2026and the fleet is NOT rendered. Not a stale one. Not a cached one. NOTHING.');
  is(/I AM SHOWING YOU NOTHING/.test(PANE) && /not showing you the last thing I saw/.test(PANE),
     'and it says so, in words: "I AM SHOWING YOU NOTHING. I am not showing you the last thing I saw."');
}

/* ---------------------------------------------------------------------- */
console.log('\n6 \u00b7 A STALE READING SAYS SO');
{
  const win = { FLEET_MANIFEST: {
    meta: { reading: '2020-01-01T00:00:00Z', merged: '2020-01-01T00:00:00Z', repo: 'x', semantics: 'x' },
    health: {}, drift: [], engines: [], watches: [], crew: [], ships: [], doctrine: []
  }};
  const shown = {};
  const el = (id) => (shown[id] = shown[id] || { style: {}, _t: '', set innerHTML(v){}, set textContent(v){ this._t = v; }, get textContent(){ return this._t; } });
  const script = PANE.slice(PANE.lastIndexOf('<script>') + 8, PANE.lastIndexOf('</script>'));
  new Function('window', 'document', 'Date', script)(win, { getElementById: el }, Date);

  is(shown['stale'] && shown['stale'].style.display === 'block',
     'a reading from 2020 \u2192 the staleness warning fires');
  is(/HOURS OLD/.test(shown['stale'].textContent || ''),
     '\u2026and it says HOW old. "I have a reading" and "I have a CURRENT reading" are not the same claim.');
}

console.log('\n' + (F ? '\u2717 ' + F + ' FAILED' : '\u2713 all ' + P + ' passed \u2014 THE GLASS CAN SHOW A BROKEN SHIP'));
process.exit(F ? 1 : 0);
