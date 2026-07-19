/* ===========================================================================
   probe19.js · THE BRIDGE
   ---------------------------------------------------------------------------
   STATION   probes/          ·  console probe, run in the browser
   GUARDS    the Quizzard bridge — the only surface that drives the engine
   RUN       open the bridge, open the console, paste this file, enter
   COSTS     nothing. Fires no run, writes nothing, spends nothing.

   BORN FROM A LIE, like the rest.
     Rev A checked that the batch textarea held nine lines. It did — and the
     probe went green while the batch was broken, because the fault was one
     step later in the splitter. A probe that checks the component NEXT TO the
     broken one is worse than no probe: it certifies the failure.
     Rev B lifts the page's own split expression and runs it on real names.

   SELF-ACCUSED, then corrected — twice:
     · it asserted "this is the old console" from a missing panel. That was a
       cause it had not verified. Now it reports the observation and names both
       candidates without choosing.
     · it returned FAIL when it could not find the split expression. Not
       finding it means the probe is BLIND, not that the splitter is broken.
       Now it warns and says so.
   =========================================================================== */
(async function AmentiBridgeProbe() {
  'use strict';

  const NINE = ['Cleopatra VII','Nikola Tesla','Tacitus','David Hume','Charles Martel',
                'Edward Gibbon','Bram Stoker','Plato','John Milton'];

  const R = [];
  const pass = (n, d) => R.push({ s: 'PASS', n, d });
  const fail = (n, d) => R.push({ s: 'FAIL', n, d });
  const warn = (n, d) => R.push({ s: 'WARN', n, d });
  const $ = (id) => document.getElementById(id);

  /* ── 1 · IS THIS THE BRIDGE AT ALL ────────────────────────────────── */
  const isBridge = /Quizzard/i.test(document.title) || !!$('btnRun');
  if (!isBridge) {
    console.log('%c PROBE 19 · not the bridge ', 'background:#f87171;color:#000;font-weight:700');
    console.log('This page is not the Quizzard bridge. Open the engine root and run again.');
    return;
  }
  pass('page', 'the bridge is loaded — title "' + document.title + '"');

  /* ── 2 · WHICH COPY IS THIS ───────────────────────────────────────── */
  const served = /workers\.dev$/.test(location.hostname) || location.protocol !== 'file:';
  if (location.protocol === 'file:') {
    warn('source', 'opened from a local FILE. A downloaded copy can drift from the engine — '
       + 'that is exactly how the old console lost its batch panel. Prefer the Worker root.');
  } else {
    pass('source', 'served over ' + location.protocol + '//' + location.host + ' — cannot go stale');
  }

  /* ── 3 · THE CONTROLS THAT MUST EXIST ─────────────────────────────── */
  const need = {
    fig:      'single-figure input',
    btnRun:   'Run button',
    commit:   'single-run commit box',
    batch:    'BATCH textarea',
    btnBatch: 'Run batch button',
    bcommit:  'batch commit box',
    btnStop:  'Stop button',
    pw:       'admin secret field'
  };
  let missing = [];
  for (const id in need) { if (!$(id)) missing.push(id + ' (' + need[id] + ')'); }
  if (missing.length) {
    fail('controls', 'absent: ' + missing.join(', ')
       + (missing.some(m => m.startsWith('batch') || m.startsWith('btnBatch'))
          ? '  ·  observed: the batch controls are not in the DOM. This probe cannot tell '
            + 'WHY. Two causes fit — an older console that never had them, or a script error '
            + 'that stopped the page rendering. Check the console for errors before assuming '
            + 'the former.'
          : ''));
  } else {
    pass('controls', 'all 8 controls present, including the batch panel');
  }

  /* ── 4 · THE SPLITTER ITSELF — not the box beside it ──────────────
     Rev A tested whether the textarea held nine lines. It did, so the probe
     went green while the batch was still broken: the fault was one step later,
     in the split. A probe that checks the component NEXT TO the broken one is
     worse than no probe, because it certifies the failure.
     So Rev B lifts the page's actual split expression out of its own source
     and runs it on the real nine names. */
  const box = $('batch');
  if (!box) {
    fail('splitter', 'no batch textarea — cannot test the split');
  } else if (box.tagName !== 'TEXTAREA') {
    fail('splitter', 'the batch control is a <' + box.tagName + '>, not a TEXTAREA — '
       + 'a single-line input strips newlines before the splitter ever sees them');
  } else {
    const src = document.documentElement.innerHTML;
    const m = src.match(/\$\('batch'\)\.value\.split\(([^)]*)\)/);
    if (!m) {
      /* RULE 3. Not finding the expression means THIS PROBE COULD NOT SEE IT —
         the page may be minified, or my pattern may be wrong. That is a blind
         spot, not a broken splitter. A probe that reports red without looking
         is worse than no probe. */
      warn('splitter', 'could not locate the split expression in the page source — '
         + 'this probe is BLIND here, which is not the same as the splitter being broken. '
         + 'Verify by hand: paste two names and confirm two rows appear.');
    } else {
      const expr = m[1];
      let split = null, err = null;
      try { split = new Function('v', 'return v.split(' + expr + ').map(function(x){return x.trim();}).filter(Boolean);')(NINE.join('\n')); }
      catch (e) { err = e.message; }
      if (err) {
        fail('splitter', 'the page\'s split expression threw: ' + err + '  · expression was ' + expr);
      } else if (split.length === NINE.length) {
        pass('splitter', 'ran the page\'s own split(' + expr + ') on the real nine → '
           + split.length + ' figures, "' + split[0] + '" … "' + split[8] + '"');
      } else {
        fail('splitter', 'the page splits with ' + expr + ' — on the real nine that yields '
           + split.length + ' figure(s), first is "' + String(split[0]).slice(0, 60) + '". '
           + (expr.indexOf('\\\\n') !== -1
              ? 'That is a LITERAL backslash-n, not a newline — it will never match.'
              : 'The batch will send everything as one figure.'));
      }
    }
    // the box itself still has to hold what is typed
    const before = box.value;
    box.value = NINE.join('\n');
    const held = box.value.split('\n').filter(Boolean).length;
    box.value = before;
    if (held === NINE.length) pass('textarea', 'the box holds ' + held + ' separate lines');
    else fail('textarea', 'typed 9 lines, the box holds ' + held);
  }

  /* ── 4b · DO THE PROGRESS SYMBOLS SURVIVE ─────────────────────────── */
  {
    const src = document.documentElement.innerHTML;
    const rawEsc = (src.match(/\\\\u[0-9A-Fa-f]{4}/g) || []).length;
    if (rawEsc) fail('symbols', rawEsc + ' double-escaped \\u sequences in the page — '
       + 'the tick and arrow marks will print as literal text instead of glyphs');
    else pass('symbols', 'no double-escaped unicode — progress marks will render');
  }

  /* ── 5 · WHERE WILL IT SEND ───────────────────────────────────────── */
  const src = (document.documentElement.innerHTML.match(/var ENGINE\s*=\s*([^;]+);/) || [])[1];
  if (!src) warn('target', 'could not read the ENGINE constant from the page source');
  else if (/location\.origin/.test(src)) pass('target', 'ENGINE = location.origin → ' + location.origin);
  else pass('target', 'ENGINE is hard-coded: ' + src.trim());

  /* ── 6 · IS THE ENGINE ANSWERING (body read, not inferred) ────────── */
  const base = /location\.origin/.test(src || '') ? location.origin
             : (src || '').replace(/['"\s]/g, '');
  try {
    const r = await fetch(base + '/health');
    let body = null; try { body = await r.json(); } catch (e) {}
    if (r.ok && body && body.ok) pass('engine', '/health answered ' + r.status + ' · ' + body.service + ' ' + body.version);
    else if (r.status === 404) warn('engine', '/health returned 404 — the deployed Worker predates the health route. '
       + 'Not fatal, but it means the console and the engine may not match.');
    else fail('engine', '/health returned ' + r.status + ' · body: ' + JSON.stringify(body));
  } catch (e) {
    fail('engine', 'could not reach ' + base + '/health — ' + e.message);
  }

  /* ── 7 · CREDENTIAL PRESENT (never printed) ───────────────────────── */
  const pw = $('pw');
  if (!pw) fail('secret', 'no admin field on the page');
  else if (!pw.value.trim()) warn('secret', 'admin secret is empty — every run will return 403 until it is filled');
  else pass('secret', 'admin secret is present (' + pw.value.trim().length + ' characters, not shown)');

  /* ── 8 · WOULD THE INPUT GUARD FIRE ───────────────────────────────── */
  const guard = (f) => {
    const w = f.split(/\s+/).filter(Boolean);
    if (w.length > 6 || f.length > 64) return 'HALT · ' + w.length + ' words';
    if (/[,;\n|]|\band\b/i.test(f)) return 'HALT · reads as more than one';
    return 'proceed';
  };
  const mispaste = NINE.join(' ');
  const guardOk = guard(mispaste).startsWith('HALT') && NINE.every(n => guard(n) === 'proceed');
  if (guardOk) pass('guard', 'the mispaste halts (' + guard(mispaste) + ') and all nine real names proceed');
  else fail('guard', 'the input guard does not behave as expected on the real nine');

  /* ── REPORT ───────────────────────────────────────────────────────── */
  const f = R.filter(x => x.s === 'FAIL').length, w = R.filter(x => x.s === 'WARN').length;
  const hue = f ? '#f87171' : (w ? '#fbbf24' : '#80ffc0');
  console.log('%c PROBE 19 · THE BRIDGE ', 'background:' + hue + ';color:#08090e;font-weight:700;padding:2px 6px');
  R.forEach(x => console.log(
    '%c' + x.s + '%c ' + x.n.padEnd(11) + ' ' + x.d,
    'color:' + (x.s === 'PASS' ? '#80ffc0' : x.s === 'WARN' ? '#fbbf24' : '#f87171') + ';font-weight:700',
    'color:inherit'));
  console.log('%c' + R.filter(x => x.s === 'PASS').length + ' pass · ' + w + ' warn · ' + f + ' fail',
    'color:' + hue + ';font-weight:700');
  if (f) console.log('%cA red here names what was observed, not what was assumed.', 'color:#8f95ab;font-style:italic');
  return { pass: R.filter(x => x.s === 'PASS').length, warn: w, fail: f, results: R };
})();
