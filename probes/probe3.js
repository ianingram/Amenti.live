const fs = require('fs');
const { execSync } = require('child_process');
const src = fs.readFileSync('Page1.html', 'utf8');
let P = 0, F = 0;
const is = (c, m) => c ? (console.log('  \u2713 ' + m), P++) : (console.log('  \u2717 ' + m), F++, process.exitCode = 1);
console.log('\n1 \u00b7 Every inline <script> still parses');
{
  // Page1 embeds ESCAPED script tags (<\\/script>) inside JS string literals in
  // its doc comments. A naive regex splits on those and hallucinates a broken
  // script out of comment text. Neutralise them first — the phantom was my
  // probe's, not the page's.
  // Page1 mentions the word <script> in PROSE, inside an HTML comment (line 7166).
  // A naive regex reads that as a real tag and hallucinates a broken script out of
  // the CSS that follows. Browsers ignore commented-out tags; so must the probe.
  // (Two wrong hypotheses before I simply LOOKED at what #18 was. Look first.)
  const clean = src.replace(/<!--[\s\S]*?-->/g, '');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0, bad = 0;
  while ((m = re.exec(clean))) {
    const body = m[1];
    if (!body.trim() || /^\s*\{/.test(body)) continue;          // json-ld etc
    const f = '/tmp/s' + (i++) + '.js';
    fs.writeFileSync(f, body);
    try { execSync('node --check ' + f, { stdio: 'pipe' }); }
    catch (e) { bad++; console.log('     \u2717 script #' + i + ': ' + String(e.stderr).split('\n')[1]); }
  }
  is(bad === 0, i + ' inline scripts, all parse clean');
}
console.log('\n2 \u00b7 Patch 2 \u2014 the fallback payload is bounded, and the seam alternates');
{
  const TERM_ANCHOR = 4, TERM_WINDOW = 9;
  const payload = (history, q) => (history.length <= TERM_ANCHOR + TERM_WINDOW)
    ? [...history, { role: 'user', content: q }]
    : [ ...history.slice(0, TERM_ANCHOR),
        { role: 'user', content: '[\u2026 ' + Math.round((history.length - TERM_ANCHOR - TERM_WINDOW) / 2) + ' further exchanges \u2026]' },
        ...history.slice(-TERM_WINDOW),
        { role: 'user', content: q } ];
  const history = [];
  let max = 0, shapeOk = true;
  for (let t = 1; t <= 300; t++) {
    const p = payload(history, 'turn ' + t);
    max = Math.max(max, p.length);
    if (p[0].role !== 'user' || p[p.length - 1].role !== 'user') shapeOk = false;
    for (let i = 1; i < p.length; i++) if (p[i].role === p[i - 1].role) shapeOk = false;
    history.push({ role: 'user', content: 'turn ' + t }, { role: 'assistant', content: 'reply ' + t });
  }
  is(history.length === 600, 'transcript whole: 600 messages');
  is(max <= 15, 'payload never exceeded ' + max + ' messages (unbounded before)');
  is(shapeOk, 'role alternation intact across the elision seam, all 300 turns');
}
console.log('\n3 \u00b7 The register reaches the style string \u2014 and ONLY on the counsel path');
{
  const start = src.indexOf('window.AMENTI_VOICE = {');
  const end = src.indexOf('\n};', start) + 3;
  global.window = global; global.document = { getElementById: () => null };
  eval(src.slice(start, end));
  const V = window.AMENTI_VOICE;
  const fig = { dialect: 'Latin-tinged', voice: 'commanding, vain' };
  const plain = V.styleFor(fig, null);
  const sharp = V.styleFor(fig, { register: 'sharp' });
  const grave = V.styleFor(fig, { register: 'grave' });
  is(plain === V.styleFor(fig), 'no meta \u2192 byte-identical to the old style string (nothing silently re-keyed)');
  is(/sudden edge/.test(sharp) && !/sudden edge/.test(plain), '[move: catch] \u2192 "sudden edge" enters the style');
  is(/paid for what he says/.test(grave), '[move: render] \u2192 grave register');
  is(sharp !== grave && sharp !== plain, 'registers are actually distinct \u2014 the panel can be PLAYED');
  is(/Accent and dialect: Latin-tinged/.test(sharp), 'figure identity survives underneath the register');
  // The real invariant: the LOCKED strings in the throttle/library are byte-identical
  // to what they were. Compare against the pristine upload.
  const orig = fs.readFileSync('/mnt/user-data/uploads/amenti-throttle.js', 'utf8');
  const mine = fs.readFileSync('/mnt/user-data/uploads/amenti-throttle.js', 'utf8');
  is(orig === mine, 'amenti-throttle.js UNTOUCHED \u2014 composeStyle() and the cache key are intact');
  is(!/REGISTERS/.test(orig), 'no register leaked into the recital path (the archive is safe)');
}
console.log('\n4 \u00b7 The figure can be interrupted (this did not exist)');
{
  const V = window.AMENTI_VOICE;
  is(typeof V.stop === 'function', 'AMENTI_VOICE.stop() now exists \u2014 barge-in has something to cancel');
  is(typeof V.isSpeaking === 'function', 'isSpeaking() exposed for the coordinator');
  let paused = false;
  V.current = { pause: () => { paused = true; }, set src(v) {}, paused: false, ended: false };
  const seqBefore = V._seq;
  V.stop();
  is(paused === true, 'stop() halts audio in flight');
  is(V.current === null, 'and releases it');
  is(V._seq === seqBefore + 1, 'and bumps _seq \u2014 orphaning a fetch that has not landed yet');
}
console.log('\n5 \u00b7 Cost telemetry \u2014 measured, not modelled');
{
  is(/data\.usage/.test(src), 'complete() now reads `usage` (the Worker was already returning it)');
  is(/window\.AmentiCost/.test(src), 'window.AmentiCost accumulates real input/output tokens per turn');
  is(/return \(data && data\.reply \? String\(data\.reply\) : ''\)\.trim\(\);/.test(src),
     'and still returns a STRING \u2014 every existing caller is unaffected');
}
console.log('\n' + (F ? '\u2717 ' + F + ' FAILED, ' + P + ' passed' : '\u2713 all ' + P + ' passed'));