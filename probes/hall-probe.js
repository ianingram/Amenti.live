/* ============================================================================
   HALL PROBE · paste this into the browser console on hall.html
   ----------------------------------------------------------------------------
   Every probe on this ship reads FILES. Not one of them opens the page, and
   twice today that gap cost real time: the Jupiter return line was drawn at a
   quarter opacity and reported as MISSING FROM THE APPLICATION, and the
   timeline's way back existed, was wired, and would not appear. Both passed
   every file check. Both were broken to a reader.

   This one asks the page.

   HOW TO RUN IT
     1. Open hall.html and let it settle.
     2. Press the globe in the faculty rail so the map is on screen. The probe
        will tell you if you forgot.
     3. Open the console and paste the whole of this file.

   It reads only. It clicks nothing and changes nothing.
   ========================================================================== */
(async function hallProbe() {
  const out = [];
  const ok   = (m) => out.push(['ok',   m]);
  const bad  = (m) => out.push(['bad',  m]);
  const note = (m) => out.push(['note', m]);

  const $  = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* ── 1 · is the map even here ─────────────────────────────────────────── */
  const el = $('#amenti-map');
  if (!el) { console.error('NO #amenti-map — the script did not mount at all.'); return; }
  ok('the map surface is mounted');

  const open = document.body.classList.contains('scene-map');
  if (!open) {
    note('THE MAP IS CLOSED. Press the globe in the faculty rail, then run this ' +
         'again — most of what follows only renders when the surface is open.');
  }

  /* ── 2 · is the browser running the file the hall asked for ───────────── */
  const tag = [...document.scripts].find(s => /amenti-map\.js/.test(s.src));
  if (tag) {
    const v = (tag.src.match(/[?&]v=([0-9a-f]+)/) || [])[1];
    ok('script tag: amenti-map.js' + (v ? ' ?v=' + v : ' — NO CACHE STAMP'));
    if (!v) bad('no ?v= stamp — a browser may serve you an old file forever');
  } else bad('no amenti-map.js script tag on the page');

  /* ── 3 · the registers, fetched fresh so a cached page cannot lie ─────── */
  const reg = async (name) => {
    try {
      const r = await fetch(name + '?probe=' + Date.now());
      if (!r.ok) { bad(name + ' — HTTP ' + r.status); return null; }
      const t = await r.text();
      if (/^\s*[\/<]/.test(t)) {
        bad(name + ' IS NOT JSON — it begins "' + t.slice(0, 24).replace(/\n/g, ' ') +
            '". A file was uploaded under the wrong name.');
        return null;
      }
      const j = JSON.parse(t);
      ok(name + ' — ' + (t.length / 1024).toFixed(0) + ' KB, valid');
      return j;
    } catch (e) { bad(name + ' — ' + e.message.slice(0, 60)); return null; }
  };

  const geo = await reg('GEO.json');
  const ev  = await reg('EVENTS.json');

  if (geo) {
    const t = geo.totals || {};
    ok('roster: ' + t.souls + ' souls · ' + t.pins + ' pinned · ' + t.washes +
       ' territory · ' + t.unplaced + ' unresolved');
    ok('positions: ' + (t.datedSeats || 0) + ' souls dated · ' + (t.crossings || 0) + ' crossings');
    const sites = geo.sites || [];
    sites.length ? ok('sites: ' + sites.length + ' · ' + sites.filter(s => s.e == null).length + ' standing')
                 : bad('GEO.json carries NO SITES — the right-hand column will be empty');
    if (geo.gazetteer)
      geo.gazetteer.matchesAudited
        ? ok('gazetteer matches the audited hash')
        : bad('gazetteer does NOT match the audited hash — pins may have moved');
    if (ev && geo.gazetteer && ev.gazetteer && geo.gazetteer.sha256 !== ev.gazetteer.sha256)
      bad('GEO and EVENTS were built from DIFFERENT gazetteers — the join is unsafe');
  }

  /* ── 4 · what actually rendered ───────────────────────────────────────── */
  const layers = {
    'coastline':      '.mp-land',
    'fine coast':     '.mp-coast',
    'rivers':         '.mp-river',
    'lakes':          '.mp-lake',
    'named regions':  '.mp-reg',
    'peaks':          '.mp-peak',
    'sites':          '.mp-site',
    'seats':          '.mp-seat',
    'territories':    '.mp-wash',
    'events':         '.mp-ev',
    'pulses':         '.mp-pulse',
    'crossings':      '.mp-jrn',
    'sky band':       '.mp-sign',
    'Jupiter line':   '.mp-return'
  };
  const drawn = [];
  Object.entries(layers).forEach(([name, sel]) => {
    const n = $$(sel).length;
    drawn.push(name.padEnd(15) + String(n).padStart(5));
    if (open && n === 0 && !['pulses', 'crossings', 'sites'].includes(name))
      bad('nothing drawn for: ' + name + '  (' + sel + ')');
  });
  note('LAYERS DRAWN RIGHT NOW\n      ' + drawn.join('\n      '));

  /* ── 5 · the chrome a reader actually touches ─────────────────────────── */
  const chrome = {
    'year readout':      '.mp-read',
    'aperture buttons':  '.mp-ap button',
    'chronometer':       '.mp-chrono',
    'zoom controls':     '.mp-zoomctl',
    'souls column':      '.mp-li',
    'built column':      '.mp-bi',
    'legend':            '.mp-key span',
    'what-panel button': '.mp-what-btn'
  };
  Object.entries(chrome).forEach(([name, sel]) => {
    const n = $$(sel).length;
    n ? ok(name + ': ' + n) : (open ? bad('MISSING from the page: ' + name) : note('not up: ' + name));
  });

  /* ── 6 · THE FAINTNESS CHECK · the thing that cost the most time today ── */
  /* A feature that exists, is wired, and cannot be SEEN reads to a visitor as
     absent — and that is worse than absent, because nobody looks for it twice.
     No file probe can catch it. This one measures. */
  const faint = [];
  $$('#amenti-map [class*="mp-"]').slice(0, 4000).forEach(n => {
    const cs = getComputedStyle(n);
    const o = parseFloat(cs.opacity);
    if (!(o >= 0) || o === 0) return;
    const sw = parseFloat(cs.strokeWidth) || 0;
    if (o < 0.2 && (sw > 0 || cs.fill !== 'none'))
      faint.push((n.getAttribute('class') || '?').split(' ')[0] + ' @ opacity ' + o.toFixed(2));
  });
  const uniqueFaint = [...new Set(faint)];
  uniqueFaint.length
    ? note('BELOW THE THRESHOLD OF VISIBLE — drawn, and arguably not there:\n      ' +
           uniqueFaint.slice(0, 12).join('\n      '))
    : ok('nothing is drawn so faintly that it may as well be absent');

  /* ── 7 · WHAT THREW AT LOAD ───────────────────────────────────────────── */
  /* A pasted probe cannot see an error from before it ran; the error is gone
     and all that remains is a red dot in a toolbar, which reports that
     something is wrong and makes a person go hunting. So hall.html records
     instead — a listener installed as the FIRST script on the page — and this
     reads the recording back. */
  const E = window.__amentiErrors;
  if (!Array.isArray(E)) {
    note('hall.html has no error recorder — load errors cannot be reported here. ' +
         'The listener belongs at the top of <head>.');
  } else if (!E.length) {
    ok('nothing threw at load, and nothing has thrown since');
  } else {
    E.forEach(function (x) {
      bad('THREW AT LOAD [' + x.kind + '] ' + x.msg + '  \u2014 ' + x.where);
    });
  }

  /* ── report ───────────────────────────────────────────────────────────── */
  const bads = out.filter(x => x[0] === 'bad');
  console.log('%c\n  HALL PROBE · ' + new Date().toISOString().slice(0, 16).replace('T', ' ') +
              '\n  ' + location.pathname + '\n',
              'font-weight:bold;font-size:13px');
  out.forEach(([k, m]) => {
    const c = k === 'bad' ? 'color:#e05555;font-weight:bold'
            : k === 'note' ? 'color:#8fa2ba' : 'color:#4caf7d';
    console.log('%c' + (k === 'bad' ? '  ✗ ' : k === 'note' ? '  · ' : '  ✓ ') + m, c);
  });
  console.log('%c\n  ' + (bads.length ? bads.length + ' FINDING(S)'
    : 'no findings — the page shows what the files say it should') + '\n',
    'font-weight:bold;font-size:13px;color:' + (bads.length ? '#e05555' : '#4caf7d'));
  return { findings: bads.length, detail: out };
})();
