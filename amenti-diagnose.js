/* ===========================================================================
   amenti-diagnose.js — ONE DIAGNOSTIC
   ---------------------------------------------------------------------------
   Replaces probe 1-7 and the console one-liners. Commit it once, add the one
   <script> line to Page1.html, and from then on it is a URL:

       https://ianingram.github.io/Amenti.live/Page1.html?diagnose=1

   It waits for the CSV ledger, runs every check, and downloads
   amenti-diagnose.txt. No pasting.

   IT WAITS ON PURPOSE
     amenti-resolve.js's own header records the trap: "a run whose index
     depends on whether the CSV ledger had landed yet - the 38-record report
     against the 1,006-record report was the same probe sampling two moments
     of the same race." Probe 7 hit exactly that (39 records one run, 1007 the
     next). This holds until AMENTI_CHARS stops growing, then samples twice
     more to catch late painters.

   BASE PATH
     Every URL is built from location.pathname, never location.origin. The
     site is served from the /Amenti.live/ project subpath; probe 1 §3 and
     probe 2 §4 produced false 404s by getting that wrong.

   TO RUN IT WITHOUT THE FLAG
     window.AmentiDiagnose.run();
   =========================================================================== */
(function () {
  'use strict';

  var VERSION  = '2.0';
  var BASE     = location.origin + location.pathname.replace(/[^/]*$/, '');
  var MAXCARDS = 200;
  var SETTLE   = 700;    /* ms of no AMENTI_CHARS growth = ledger has landed */
  var CEILING  = 25000;  /* ms hard cap on waiting */
  var LATE     = 2500;   /* ms between the settle sample and the late sample */

  var L = [], t0 = Date.now();
  /* Hooks installed as early as this file runs. It is deferred, so parse-time
     throws are already gone — 8e says so rather than implying coverage. */
  var ERRS = [], WINERR = [], REJ = [];
  (function () {
    try {
      var ce = console.error;
      console.error = function () { try { ERRS.push([].join.call(arguments, ' ')); } catch (e) {} return ce.apply(console, arguments); };
      window.addEventListener('error', function (e) { WINERR.push((e.message || '') + ' @ ' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
      window.addEventListener('unhandledrejection', function (e) { REJ.push(String(e.reason).slice(0, 200)); });
    } catch (e) {}
  })();
  function w(s) { L.push(s == null ? '' : String(s)); }

  /* EVERY fetch here is to something that may not answer — a worker, a CDN,
     a file that no longer exists. v1.7 had no timeouts, so one request that
     never settled meant the report was never written and nothing downloaded
     at all. A diagnostic that can hang is worse than none: it reports
     nothing and looks like the page is broken. */
  function fetchT(url, opts, ms) {
    ms = ms || 6000;
    return new Promise(function (resolve, reject) {
      var done = false, ctl = null;
      try { ctl = new AbortController(); if (opts) opts.signal = ctl.signal; else opts = { signal: ctl.signal }; } catch (e) {}
      var t = setTimeout(function () {
        if (done) return; done = true;
        try { if (ctl) ctl.abort(); } catch (e) {}
        reject('timeout after ' + ms + 'ms');
      }, ms);
      fetch(url, opts).then(function (r) {
        if (done) return; done = true; clearTimeout(t); resolve(r);
      }, function (e) {
        if (done) return; done = true; clearTimeout(t); reject(e);
      });
    });
  }
  function hr(s) { w(''); w(Array(75).join('=')); w(s); w(Array(75).join('=')); }
  function sub(s) { w(''); w('-- ' + s + ' ' + Array(Math.max(2, 70 - s.length)).join('-')); }
  function pad(s, n) { s = String(s == null ? '' : s); return s.length >= n ? s.slice(0, n) : s + Array(n - s.length + 1).join(' '); }
  function rpad(s, n) { s = String(s == null ? '' : s); return s.length >= n ? s.slice(0, n) : Array(n - s.length + 1).join(' ') + s; }

  /* ---- plate detection ---------------------------------------------------
     Probe 7 got this wrong: it fell through to getComputedStyle, which picks
     up .rc-img's own linear-gradient, so all 53 cards reported "plate: yes".
     A photograph is an inline background-image containing url(). Nothing
     else counts. data-fig is the corroborating signal. */
  function plateOf(el) {
    if (!el) return '';
    var bg = el.style && el.style.backgroundImage || '';
    if (bg.indexOf('url(') === -1) return '';
    var m = bg.match(/url\(["']?([^"')]+)/);
    return m ? m[1].replace(BASE, '') : '';
  }

  function ownerOf(svg) {
    if (svg.getAttribute('data-source') === 'renderings') return 'art-3';
    var c = svg.getAttribute('class') || '';
    if (c.indexOf('rc-portrait') > -1) return 'miniPortraits';
    return c ? 'unknown' : 'roster.js';
  }

  /* ======================================================================= */
  /* 1. ENVIRONMENT                                                          */
  /* ======================================================================= */
  function envSection(waited, settledAt) {
    hr('1. ENVIRONMENT & DEPLOY STATE');
    w('amenti-diagnose : v' + VERSION);
    w('run at          : ' + new Date().toISOString());
    w('href            : ' + location.href);
    w('base path       : ' + BASE);
    w('viewport        : ' + innerWidth + 'x' + innerHeight + ' dpr=' + (devicePixelRatio || 1));
    w('body data-page  : ' + (document.body.getAttribute('data-page') || '(none)'));
    w('');
    w('LEDGER WAIT');
    w('  AMENTI_CHARS  : ' + ((window.AMENTI_CHARS || []).length) + ' records');
    w('  settled after : ' + waited + ' ms' + (settledAt ? '' : '  (HIT CEILING — may still be mid-merge)'));
    w('');
    w('SCRIPTS');
    ['config.js', 'amenti-resolve.js', 'amenti-roster.js', 'amenti-roster-view.js',
     'amenti-art-photo.js', 'amenti-art-3.js', 'amenti-quiz.js', 'amenti-diagnose.js']
      .forEach(function (f) {
        var tag = document.querySelector('script[src*="' + f + '"]');
        w('  ' + pad(f, 24) + (tag ? 'loaded' : 'ABSENT'));
      });
    w('');
    w('GLOBALS');
    ['AmentiResolve', 'AmentiArtPhoto', 'AmentiArt3', 'amentiQuiz',
     'amentiRosterView', 'AMENTI_SVG', 'AmentiTerminal']
      .forEach(function (g) { w('  ' + pad(g, 24) + (window[g] ? 'present' : 'absent')); });
    if (window.AmentiResolve && window.AmentiResolve.version)
      w('  resolver version        ' + window.AmentiResolve.version);
  }

  /* ======================================================================= */
  /* 1b. FRESHNESS — is the browser running the code that is in the repo?    */
  /* -----------------------------------------------------------------------
     The recurring failure in this project has been diagnosing a page that
     was running cached JavaScript. Resource Timing settles it: a response
     served from cache reports transferSize 0 with a non-zero decodedBodySize.
     Then we fetch the repo copy with cache:'no-store' and look for feature
     tokens, so "the repo has the fix" and "the browser is running it" become
     two separate, answerable questions.                                      */
  var FEATURES = {
    'amenti-roster.js'   : ['function rekey(', 'AmentiArtPhoto.pass()', 'REKEY_LOG'],
    'amenti-art-photo.js': ['function sweep(', 'function strip('],
    'amenti-diagnose.js' : ['FRESHNESS'],
    'Page1.html'         : ['rc-img[data-fig]', 'FEED_LIMIT=7', 'bandWrap']
  };

  function freshSection(cb) {
    hr('1b. FRESHNESS — cached code vs repo code');
    var res = {};
    try {
      (performance.getEntriesByType('resource') || []).forEach(function (e) {
        var n = e.name.split('/').pop().split('?')[0];
        res[n] = e;
      });
    } catch (e) {}

    sub('what the BROWSER loaded');
    w('  ' + pad('file', 26) + pad('transfer', 11) + pad('decoded', 11) + 'verdict');
    var names = Object.keys(FEATURES);
    names.forEach(function (f) {
      var e = res[f];
      if (!e) { w('  ' + pad(f, 26) + pad('-', 11) + pad('-', 11) + 'not in Resource Timing'); return; }
      var t = e.transferSize, dz = e.decodedBodySize;
      var v = (t === 0 && dz > 0) ? 'FROM CACHE  <-- may be stale'
            : (t > 0 ? 'fetched from network' : 'unknown');
      w('  ' + pad(f, 26) + pad(t == null ? '?' : t, 11) + pad(dz == null ? '?' : dz, 11) + v);
    });

    sub('what the REPO holds (fetched cache:no-store)');
    var pending = names.length, lines = [];
    names.forEach(function (f) {
      fetchT(BASE + f, { cache: 'no-store' }, 5000)
        .then(function (r) { return r.ok ? r.text() : Promise.reject('http ' + r.status); })
        .then(function (txt) {
          var miss = FEATURES[f].filter(function (tok) { return txt.indexOf(tok) === -1; });
          lines.push('  ' + pad(f, 26) + pad(txt.length + ' b', 12) +
            (miss.length ? 'MISSING: ' + miss.join(', ') : 'all expected markers present'));
        })
        .catch(function (e) { lines.push('  ' + pad(f, 26) + 'FETCH FAILED: ' + e); })
        .then(function () { if (!--pending) { lines.sort().forEach(w); after(); } });
    });

    function after() {
      sub('verdict');
      var cached = names.filter(function (f) {
        var e = res[f]; return e && e.transferSize === 0 && e.decodedBodySize > 0; });
      if (cached.length) {
        w('  ' + cached.length + ' file(s) came FROM CACHE: ' + cached.join(', '));
        w('  If the repo shows markers present but behaviour has not changed,');
        w('  the browser is running old code. Hard-reload (Cmd/Ctrl+Shift+R)');
        w('  or use a private window, then re-run this diagnostic.');
      } else {
        w('  Nothing served from cache — the browser is running repo code.');
        w('  A behaviour that still does not change is a real bug, not staleness.');
      }
      /* live proof: does the running roster expose the fix? */
      sub('running-code probe');
      w('  window.AmentiArtPhoto.sweep : ' +
        (window.AmentiArtPhoto && typeof window.AmentiArtPhoto.sweep === 'function'
          ? 'present (art-photo sweep IS running)' : 'ABSENT (art-photo is stale or unpatched)'));
      cb();
    }
  }

  /* ======================================================================= */
  /* 2. STYLESHEETS                                                          */
  /* ======================================================================= */
  function cssSection() {
    hr('2. STYLESHEET STATE (is the deployed CSS actually loaded?)');
    var hits = [], blocked = 0, scanned = 0;
    Array.prototype.forEach.call(document.styleSheets, function (sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (e) { blocked++; return; }
      if (!rules) return;
      Array.prototype.forEach.call(rules, function (r) {
        scanned++;
        var sel = r.selectorText || '';
        if (/rc-img|rc-portrait|plate-stack|term-main > \*/.test(sel)) {
          hits.push({ where: sheet.href ? sheet.href.replace(BASE, '') : '(inline <style>)',
                      sel: sel, css: (r.style && r.style.cssText || '').slice(0, 120) });
        }
      });
    });
    w('stylesheets     : ' + document.styleSheets.length +
      '   rules scanned ' + scanned + '   CORS-blocked ' + blocked);
    sub('rules touching the contested surfaces');
    if (!hits.length) w('  NONE — the stylesheet carrying them did not load (stale cache or bad deploy).');
    hits.forEach(function (h) {
      w('  [' + h.where + ']  ' + h.sel);
      w('        { ' + h.css + ' }');
    });
    sub('verdicts');
    var prec = hits.filter(function (h) { return /\[data-fig\][^,]*svg/.test(h.sel); });
    w('  plate/drawing precedence rule : ' + (prec.length ? 'loaded' : 'NOT LOADED'));
    w('    NOTE: this rule cannot win on its own. amenti-art-3.js sets');
    w('    style.display="block" INLINE, and inline beats every selector.');
    w('    Suppression is enforced by the sweep() in amenti-art-photo.js.');
    var ps = hits.filter(function (h) { return h.sel.indexOf('plate-stack') > -1; });
    ps.forEach(function (h) { w('  plate-stack: ' + h.sel + ' -> ' + h.css); });
  }

  /* ======================================================================= */
  /* 3. CARDS                                                                */
  /* ======================================================================= */
  function snapshot() {
    var out = [], cards = document.querySelectorAll('.roster-card');
    for (var i = 0; i < cards.length && i < MAXCARDS; i++) {
      var c = cards[i], img = c.querySelector('.rc-img');
      var rec = {
        i: i,
        figure : c.getAttribute('data-figure') || '',
        charKey: c.getAttribute('data-char-key') || '',
        art    : c.getAttribute('data-art') || '',
        art3   : c.getAttribute('data-art3') || '',
        photo  : c.getAttribute('data-art-photo') || '',
        fig    : img ? (img.getAttribute('data-fig') || '') : '',
        plate  : plateOf(img),
        svgs   : []
      };
      if (img) {
        var s = img.querySelectorAll('svg');
        for (var j = 0; j < s.length; j++) {
          rec.svgs.push({ owner: ownerOf(s[j]),
                          inline: s[j].style.display || '',
                          computed: getComputedStyle(s[j]).display });
        }
      }
      out.push(rec);
    }
    return out;
  }

  function cardsSection(a, b) {
    hr('3. CARD SURFACE');
    w('PLATE = an inline background-image url() — a real photograph.');
    w('        (NOT computed background, which picks up .rc-img\'s gradient.)');
    w('VIS   = an svg is on top of it, i.e. the overlap bug.');
    w('');
    w(pad('#', 4) + pad('FIGURE', 24) + pad('data-char-key', 20) + pad('data-fig', 18) +
      pad('PLATE', 7) + pad('SVG', 5) + pad('VIS', 5) + 'OWNER / inline-display');
    w(Array(120).join('-'));
    b.forEach(function (r) {
      var vis = r.svgs.filter(function (s) { return s.computed !== 'none'; });
      w(pad(r.i, 4) + pad(r.figure, 24) + pad(r.charKey || '-', 20) + pad(r.fig || '-', 18) +
        pad(r.plate ? 'yes' : '-', 7) + pad(r.svgs.length || '-', 5) +
        pad(vis.length ? 'YES' : '-', 5) +
        (r.svgs.length ? r.svgs.map(function (s) {
          return s.owner + '/' + (s.inline || 'none') + '/' + s.computed; }).join('  ') : '-'));
    });

    sub('counts');
    var overl = b.filter(function (r) { return r.plate && r.svgs.some(function (s) { return s.computed !== 'none'; }); });
    var clean = b.filter(function (r) { return r.plate && !r.svgs.length; });
    var draw  = b.filter(function (r) { return !r.plate && r.svgs.length; });
    var empty = b.filter(function (r) { return !r.plate && !r.svgs.length; });
    var nokey = b.filter(function (r) { return !r.charKey; });
    w('  cards                          ' + rpad(b.length, 5));
    w('  with a photographic plate      ' + rpad(b.filter(function (r) { return r.plate; }).length, 5));
    w('  OVERLAPPING (plate + svg)      ' + rpad(overl.length, 5) + '   <-- must be 0');
    w('  clean (plate, no svg)          ' + rpad(clean.length, 5));
    w('  drawing only (no plate)        ' + rpad(draw.length, 5) + '   correct fallback tier');
    w('  EMPTY (no plate, no drawing)   ' + rpad(empty.length, 5) + '   <-- the art gap');
    w('  NO data-char-key               ' + rpad(nokey.length, 5) + '   <-- resolver returned null');
    if (overl.length) {
      sub('overlapping');
      overl.forEach(function (r) { w('  ' + pad(r.figure, 26) + r.svgs.map(function (s) { return s.owner + ' inline=' + (s.inline || 'none'); }).join(', ')); });
    }
    if (empty.length) {
      sub('empty cards (no art of any kind)');
      empty.forEach(function (r) { w('  ' + pad(r.figure, 26) + 'char-key=' + (r.charKey || '(none)')); });
    }
    if (nokey.length) {
      sub('cards the resolver could not key');
      nokey.forEach(function (r) { w('  ' + r.figure); });
    }
    sub('late painters');
    w('  settle sample : cards=' + a.length + ' svgs=' + a.reduce(function (n, r) { return n + r.svgs.length; }, 0) +
      ' plates=' + a.filter(function (r) { return r.plate; }).length);
    w('  +' + (LATE / 1000) + 's sample  : cards=' + b.length + ' svgs=' + b.reduce(function (n, r) { return n + r.svgs.length; }, 0) +
      ' plates=' + b.filter(function (r) { return r.plate; }).length);
    w('  If svgs rose, a painter lands after the plate and any fix must');
    w('  re-apply on mutation rather than run once.');
  }

  /* ======================================================================= */
  /* 4. RESOLVER                                                             */
  /* ======================================================================= */
  function resolverSection(cards) {
    hr('4. KEY RESOLUTION  (why a card has no key, and no art)');
    var R = window.AmentiResolve;
    if (!R) { w('amenti-resolve.js NOT LOADED — every card renders badge-only.'); return; }

    var idx = R.index ? R.index() : {}, recs = R.records ? R.records() : {};
    var col = R.collisions ? R.collisions() : [];
    w('indexed forms   : ' + Object.keys(idx).length);
    w('canonical recs  : ' + Object.keys(recs).length);
    w('collisions      : ' + col.length);

    sub('rekey trace — did the re-key pass run, and what did it see?');
    var RL = (window.AmentiRoster && window.AmentiRoster.rekeyLog)
             ? window.AmentiRoster.rekeyLog() : null;
    if (!RL) {
      w('  window.AmentiRoster.rekeyLog absent — amenti-roster.js has no trace,');
      w('  i.e. it is an older build than the one that carries rekey().');
    } else if (!RL.length) {
      w('  TRACE EMPTY — rekey() was never called. render() may not have been');
      w('  reached, or boot() rejected before it.');
    } else {
      w('  ' + pad('t(ms)', 8) + pad('try', 5) + pad('cards', 7) + pad('pending', 9) +
        pad('fixed', 7) + pad('chars', 7) + 'codexFor sample / note');
      RL.forEach(function (r) {
        w('  ' + pad(r.t, 8) + pad(r['try'], 5) + pad(r.cards, 7) + pad(r.pending, 9) +
          pad(r.fixed, 7) + pad(r.chars, 7) + (r.sample || r.note || ''));
      });
      var stopped = RL.filter(function (r) { return r.note; });
      var everFixed = RL.reduce(function (n, r) { return n + (r.fixed || 0); }, 0);
      var calls0 = RL.filter(function (r) { return r['try'] === 0; }).length;
      w('');
      w('  total cards keyed by rekey : ' + everFixed);
      w('  rekey(0) entry points      : ' + calls0 + '   (refresh() also enters at 0 — not a boot count)');
      var BT = (window.amentiRoster && window.amentiRoster.boots) ? window.amentiRoster.boots() : null;
      if (BT) {
        var ran = BT.filter(function (b) { return !b.blocked; });
        var stopped = BT.filter(function (b) { return b.blocked; });
        w('  boot() calls               : ' + BT.length +
          '  (ran ' + ran.length + ', blocked ' + stopped.length + ')' +
          (ran.length > 1 ? '   <-- STILL DOUBLE BOOTING' : ''));
        BT.forEach(function (b) {
          w('     t=' + pad(b.t, 8) + (b.blocked ? 'blocked by guard' : 'RAN')); });
        if (ran.length === 1) w('  time to first render      : ~' + ran[0].t + ' ms (boot start)');
      } else {
        w('  boot() calls               : amentiRoster.boots absent (older build)');
      }
      w('');
      w('  NOTE ON TIMINGS: browsers throttle timers in background tabs. If a');
      w('  1200 ms retry shows a multi-second gap above, the tab lost focus and');
      w('  every t(ms) here is inflated. Keep the tab focused for a true reading.');
      if (stopped.length && !everFixed) {
        w('  STOPPED with 0 pending while cards are unkeyed —');
        w('  the :not([data-char-key]) selector is not matching them.');
      }
    }

    sub('per-card resolution (only cards that FAILED or disagree)');
    w(pad('FIGURE', 26) + pad('resolve(name)', 22) + pad('record.key', 20) + 'data-char-key');
    w(Array(95).join('-'));
    var bad = 0;
    cards.forEach(function (c) {
      var k = null, rk = null;
      try { k = R.resolve(c.figure); } catch (e) {}
      try { var rr = R.record(c.figure); rk = rr && rr.key; } catch (e) {}
      if (k && rk && rk === c.charKey) return;   /* healthy, skip */
      bad++;
      w(pad(c.figure, 26) + pad(k || 'NULL', 22) + pad(rk || 'NULL', 20) + (c.charKey || '(none)'));
    });
    if (!bad) w('  (none — every card resolved and agrees with its data-char-key)');

    if (col.length) {
      sub('collisions — a refused claim is why a form resolves to NULL');
      col.slice(0, 120).forEach(function (x) {
        w('  form=' + pad(x.form, 30) + 'was=' + pad(x.was, 18) +
          'now=' + pad(x.now === null ? 'REFUSED' : x.now, 18) + x.why);
      });
      if (col.length > 120) w('  ... ' + (col.length - 120) + ' more');
    }
    w('');
    w('SAME_PERSON : ' + JSON.stringify(R.samePerson || {}));
  }

  /* ======================================================================= */
  /* 5. ART INVENTORY vs MANIFEST                                            */
  /* ======================================================================= */
  function artSection(cards, cb) {
    hr('5. ART INVENTORY  (what the repo holds vs what the cards ask for)');
    var AP = window.AmentiArtPhoto;
    if (AP && AP.known) {
      sub('amenti-art-photo probe cache  (false = probed and 404d, never retried)');
      var kk = Object.keys(AP.known).sort();
      if (!kk.length) w('  (empty — decorate() has not probed anything)');
      kk.forEach(function (k) { w('  ' + pad(k, 30) + (AP.known[k] ? 'FOUND' : 'missing')); });
    }
    if (AP && AP.plate) {
      sub('codex/terminal plate cache');
      Object.keys(AP.plate).sort().forEach(function (k) {
        w('  ' + pad(k, 34) + (AP.plate[k] ? 'FOUND' : 'missing')); });
    }

    fetchT(BASE + 'img/MANIFEST.json', { cache: 'no-store' }, 6000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.images) { w(''); w('MANIFEST.json unreadable — skipping inventory comparison.'); return cb(); }
        var files = Object.keys(m.images), bases = {};
        files.forEach(function (f) {
          var p = f.replace(/\.jpg$/, '').split('-');
          var surf = p.pop(); if (/^\d+$/.test(surf)) surf = p.pop() + '-' + surf;
          var b = p.join('-');
          (bases[b] = bases[b] || []).push(surf);
        });
        sub('MANIFEST: ' + files.length + ' files across ' + Object.keys(bases).length + ' figures');
        var want = {};
        cards.forEach(function (c) { if (c.charKey) want[c.charKey] = c.figure; });
        var onCardWithArt = [], onCardNoArt = [], artNotOnCard = [];
        Object.keys(want).forEach(function (k) {
          (bases[k] ? onCardWithArt : onCardNoArt).push(k); });
        Object.keys(bases).forEach(function (k) { if (!want[k]) artNotOnCard.push(k); });

        w('  cards whose key HAS art        ' + rpad(onCardWithArt.length, 5));
        w('  cards whose key has NO art     ' + rpad(onCardNoArt.length, 5));
        w('  art in repo NOT on any card    ' + rpad(artNotOnCard.length, 5) + '   <-- paid-for art going unused');
        if (artNotOnCard.length) {
          sub('art present but unreachable (key mismatch or figure not on roster)');
          artNotOnCard.sort().forEach(function (k) {
            w('  ' + pad(k, 26) + '[' + bases[k].sort().join(', ') + ']'); });
        }
        if (onCardNoArt.length) {
          sub('cards with a key but no art (generation backlog)');
          onCardNoArt.sort().forEach(function (k) { w('  ' + pad(k, 26) + want[k]); });
        }
        sub('surface coverage per figure');
        var both = 0, cardOnly = [], termOnly = [], alt = [];
        Object.keys(bases).forEach(function (k) {
          var s = bases[k];
          var hc = s.indexOf('card') > -1, ht = s.indexOf('terminal') > -1;
          if (s.some(function (x) { return x.indexOf('chat') === 0; })) alt.push(k);
          if (hc && ht) both++; else if (hc) cardOnly.push(k); else if (ht) termOnly.push(k);
        });
        w('  card + terminal               ' + rpad(both, 5));
        w('  card only                     ' + rpad(cardOnly.length, 5) + '   ' + cardOnly.join(', '));
        w('  terminal only                 ' + rpad(termOnly.length, 5) + '   ' + termOnly.join(', '));
        w('  has a -chat alternate         ' + rpad(alt.length, 5) + '   ' + (alt.join(', ') || '(none)'));
        w('');
        w('  Three surfaces (card / codex / terminal) draw on these files.');
        w('  A figure with only card+terminal cannot give all three a distinct');
        w('  plate — one surface must share until -codex art exists.');
        cb();
      })
      .catch(function (e) { w(''); w('MANIFEST fetch failed: ' + e); cb(); });
  }

  /* ======================================================================= */
  /* 6. TERMINAL / CODEX                                                     */
  /* ======================================================================= */
  function surfaceSection() {
    hr('6. TERMINAL & CODEX SURFACES');
    var main = document.querySelector('.term-main');
    var stack = document.querySelector('.plate-stack');

    /* MEASURE IT VISIBLE, OR DO NOT MEASURE IT.
       .term-main lives inside .page-section[data-page="terminal"], which is
       display:none while the arena is active. An element in a hidden subtree
       has NO BOXES, so getBoundingClientRect returns 0x0 — always, whether or
       not anything is wrong. An earlier version of this section reported that
       0x0 as a defect and sent us hunting a bug that did not exist.
       So: only report geometry when the terminal is actually on screen. */
    var termSection = document.querySelector('.page-section[data-page="terminal"]');
    var visible = !!(termSection && termSection.classList.contains('active'));
    w('terminal tab      : ' + (visible ? 'ACTIVE — geometry below is real'
        : 'hidden (display:none) — geometry NOT measured, it would read 0x0 regardless'));
    w('.term-main        : ' + (main ? 'present  data-fig=' + (main.getAttribute('data-fig') || '(unset)') : 'absent'));
    if (stack) {
      var cs = getComputedStyle(stack), r = stack.getBoundingClientRect();
      w('.plate-stack      : position=' + cs.position +
        (cs.position !== 'absolute' ? '   <-- MUST be absolute; relative collapses it to 0px' : '  (correct)'));
      if (visible) {
        w('                    size=' + Math.round(r.width) + 'x' + Math.round(r.height) +
          (r.height === 0 ? '   <-- ZERO HEIGHT, nothing can render' : '  (has a box)'));
      } else {
        w('                    size not measured — see note above');
      }
      var layers = stack.querySelectorAll('.plate-layer');
      w('  layers          : ' + layers.length);
      Array.prototype.forEach.call(layers, function (l, i) {
        var bg = (l.style.backgroundImage || '').replace(BASE, '');
        w('   [' + i + '] ' + (l.classList.contains('on') ? 'ON ' : 'off') +
          ' opacity=' + getComputedStyle(l).opacity + '  ' + bg.slice(0, 70));
      });
    } else { w('.plate-stack      : absent (terminal not built on this tab)'); }
    var art = document.querySelector('.cdx-art');
    w('.cdx-art          : ' + (art ? 'present  data-fig=' + (art.getAttribute('data-fig') || '(unset)') +
      '  surface=' + (art.getAttribute('data-art-photo') || '(none)') : 'absent'));
    w('');
    w('KNOWN ROUTING ISSUES (for reference, not measured here):');
    w('  · candidates() in Page1.html ends with {key}-card.jpg, so the terminal');
    w('    cycles in the CARD face image. Remove it to stop the duplication.');
    w('  · paintCodex asks for -terminal first, duplicating the terminal main.');
  }

  /* ======================================================================= */
  /* 7. TAB SWITCH COST                                                      */
  /* -----------------------------------------------------------------------
     "Clicking a tab takes several seconds." activate() itself only toggles
     classes, so the cost is whatever the browser and the page do BECAUSE a
     large hidden subtree became visible. This measures it instead of
     guessing: click each tab, time the synchronous handler, then time how
     long until the next frame actually paints.                              */
  function tabSection(cb) {
    hr('7. TAB SWITCH COST');
    var btns = [].slice.call(document.querySelectorAll('#mnLinks button[data-target]'));
    if (!btns.length) { w('  no tab buttons found'); return cb(); }

    var longTasks = [], obs = null;
    try {
      obs = new PerformanceObserver(function (l) {
        l.getEntries().forEach(function (e) { longTasks.push(Math.round(e.duration)); });
      });
      obs.observe({ entryTypes: ['longtask'] });
    } catch (e) {}

    var startPage = document.body.getAttribute('data-page');
    var rows = [], i = 0;

    w('  handler = synchronous time inside the click handler');
    w('  paint   = click until the next frame is actually painted');
    w('  nodes   = elements inside that section once it is visible');
    w('');
    w('  ' + pad('tab', 14) + pad('handler', 10) + pad('paint', 10) + pad('nodes', 9) + 'animations running');
    w('  ' + Array(62).join('-'));

    (function step() {
      if (i >= btns.length) { finish(); return; }
      var b = btns[i++], name = b.getAttribute('data-target');
      var t0 = performance.now();
      try { b.click(); } catch (e) {}
      var tHandler = performance.now() - t0;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var tPaint = performance.now() - t0;
          var sec = document.querySelector('.page-section[data-page="' + name + '"]');
          var nodes = sec ? sec.getElementsByTagName('*').length : 0;
          var anims = 0;
          try { anims = (document.getAnimations ? document.getAnimations() : []).length; } catch (e) {}
          rows.push({ name: name, h: tHandler, p: tPaint, n: nodes, a: anims });
          w('  ' + pad(name, 14) + pad(Math.round(tHandler) + ' ms', 10) +
            pad(Math.round(tPaint) + ' ms', 10) + pad(nodes, 9) + anims);
          setTimeout(step, 450);
        });
      });
    })();

    function finish() {
      try { if (obs) obs.disconnect(); } catch (e) {}
      var worst = rows.slice().sort(function (a, b) { return b.p - a.p; })[0];
      w('');
      if (worst) {
        w('  slowest tab : ' + worst.name + '  ' + Math.round(worst.p) + ' ms to paint, ' +
          worst.n + ' elements');
      }
      if (longTasks.length) {
        longTasks.sort(function (a, b) { return b - a; });
        w('  long tasks during the sweep (>50ms): ' + longTasks.slice(0, 8).join(', ') + ' ms');
        w('    A long task blocks the main thread, so a click during one cannot');
        w('    be handled until it ends. If the page is still booting when a tab');
        w('    is clicked, THAT is the delay — not the router.');
      } else {
        w('  no long tasks recorded during the sweep.');
      }
      w('');
      w('  Handler times near 0 with large paint times = rendering cost.');
      w('  Both small here, but slow in real use = main-thread contention');
      w('  during boot; the fix is the script chain, not the router.');
      /* restore */
      /* Now that we can drive the tabs, measure the terminal WHILE IT IS ON
         SCREEN — the only reading of .plate-stack that means anything. */
      var termBtn = btns.filter(function (b) { return b.getAttribute('data-target') === 'terminal'; })[0];
      if (termBtn) {
        try { termBtn.click(); } catch (e) {}
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          var st = document.querySelector('.plate-stack');
          sub('.plate-stack measured with the terminal VISIBLE');
          if (!st) { w('  .plate-stack absent — the terminal has not built it'); }
          else {
            var c2 = getComputedStyle(st), b2 = st.getBoundingClientRect();
            w('  position : ' + c2.position);
            w('  size     : ' + Math.round(b2.width) + 'x' + Math.round(b2.height) +
              (b2.height === 0 ? '   <-- genuinely zero, nothing can render'
                               : '   <-- has a box, the plate can render'));
            var ls = st.querySelectorAll('.plate-layer');
            w('  layers   : ' + ls.length);
            Array.prototype.forEach.call(ls, function (l, i) {
              w('   [' + i + '] ' + (l.classList.contains('on') ? 'ON ' : 'off') +
                ' opacity=' + getComputedStyle(l).opacity + '  ' +
                (l.style.backgroundImage || '').replace(BASE, '').slice(0, 70));
            });
          }
          finishUp();
        }); });
        return;
      }
      finishUp();

      function finishUp() {
        var back = btns.filter(function (b) { return b.getAttribute('data-target') === startPage; })[0];
        if (back) try { back.click(); } catch (e) {}
        cb();
      }
    }
  }


  /* ======================================================================= */
  /* 8. DEPLOYMENT RISK                                                      */
  /* -----------------------------------------------------------------------
     Everything above measures what IS. This section hunts for what would go
     wrong, and for damage already done that nothing reports. The failure mode
     that matters here is SILENT: a script that loads but is never used, a
     guard that evaluates false, an asset that 404s into a fallback. None of
     those throw.                                                            */
  function riskSection(cb) {
    hr('8. DEPLOYMENT RISK — silent failures and what a change would break');

    /* ---- 8a. parse-time dependency canaries ---------------------------- */
    sub('8a. parse-time dependencies (would DEFER break this?)');
    var A = window.Amenti || {};
    var path = A.terminalPath;
    w('  Amenti.terminalPath        : ' + (path || '(absent)'));
    if (path === 'core') {
      w('    The Terminal IS running amenti-chat.js. That is only true because');
      w('    the module tag sits ABOVE the Terminal IIFE. Deferring the script,');
      w('    or moving it below, sets termChat = null and drops the Terminal to');
      w('    its inline fallback — no move tags, no registers, no Turn, no');
      w('    doctrine — WITHOUT THROWING. This is the single highest-risk edit');
      w('    on the page and it fails silently.');
    } else if (path === 'inline-fallback') {
      w('    *** THE TERMINAL IS ON THE INLINE FALLBACK RIGHT NOW ***');
      w('    amenti-chat.js is loaded but unused. termChat evaluated null,');
      w('    which means the module tag is not above the Terminal IIFE, or the');
      w('    script failed. 106 KB is being downloaded and executed for nothing.');
    } else {
      w('    Terminal has not been built on this page load (its tab never opened),');
      w('    so this cannot be judged. Open the terminal tab and re-run.');
    }
    var pairs = [
      ['Amenti.chat',        A.chat,        'terminal conversation core (parse-time consumer)'],
      ['Amenti.conversation',A.conversation,'voice conversation (guarded, defer-safe)'],
      ['Amenti.listen',      A.listen,      'microphone (guarded, defer-safe)'],
      ['Amenti.voice',       A.voice,       'speech (guarded, defer-safe)'],
      ['Amenti.throttle',    A.throttle,    'cost governor'],
      ['Amenti.terminal',    A.terminal,    'null here == fallback is live']
    ];
    w('');
    w('  ' + pad('global', 24) + pad('present', 9) + 'note');
    pairs.forEach(function (p2) {
      w('  ' + pad(p2[0], 24) + pad(p2[1] ? 'yes' : 'NO', 9) + p2[2]);
    });

    /* ---- 8b. what each script actually cost ---------------------------- */
    sub('8b. script cost, in load order (what preload/defer would move)');
    var res = [];
    try {
      (performance.getEntriesByType('resource') || []).forEach(function (e) {
        if (e.initiatorType === 'script' || /\.js(\?|$)/.test(e.name)) res.push(e);
      });
    } catch (e) {}
    res.sort(function (a, b) { return a.startTime - b.startTime; });
    if (!res.length) w('  Resource Timing gave nothing (GitHub Pages sends no Timing-Allow-Origin).');
    else {
      w('  ' + pad('script', 30) + pad('start', 9) + pad('dur', 8) + pad('bytes', 9) + 'source');
      var slowest = null, durs = {};
      res.forEach(function (e) {
        var nm = e.name.split('/').pop().split('?')[0].slice(0, 28);
        var cached = e.transferSize === 0 && e.decodedBodySize > 0;
        var opaque = e.transferSize === 0 && !e.decodedBodySize;
        if (!slowest || e.duration > slowest.duration) slowest = e;
        var d = Math.round(e.duration);
        durs[d] = (durs[d] || 0) + 1;
        w('  ' + pad(nm, 30) + pad(Math.round(e.startTime) + 'ms', 9) + pad(d + 'ms', 8) +
          pad(e.decodedBodySize ? (Math.round(e.decodedBodySize / 1024) + 'KB') : '?', 9) +
          (cached ? 'cache' : opaque ? 'no timing headers' : 'network'));
      });
      /* A dozen scripts reporting the SAME duration to the millisecond did not
         each take that long — they were all waiting on one thing, or the tab
         was throttled. Saying "SLOW" against each of them is a lie the probe
         used to tell. Detect the clustering and say so instead. */
      var worstCount = 0, worstDur = 0;
      Object.keys(durs).forEach(function (k) {
        if (durs[k] > worstCount) { worstCount = durs[k]; worstDur = +k; } });
      w('');
      if (worstCount >= 4 && worstDur > 500) {
        w('  *** ' + worstCount + ' scripts report an identical duration of ' + worstDur + 'ms.');
        w('  They did not each take that long. An identical duration across many');
        w('  resources means they were queued behind one blocker, or the tab lost');
        w('  focus. Treat every number in this table as unusable and re-run with');
        w('  the tab kept in the foreground.');
      } else if (slowest) {
        w('  slowest: ' + slowest.name.split('/').pop() + '  ' + Math.round(slowest.duration) + 'ms');
      }
      var net = res.filter(function (e) { return e.transferSize > 0; });
      w('  fetched from network this load: ' + net.length + ' of ' + res.length +
        '  (the rest were cached, so their timings say nothing about a cold load)');
    }

    /* ---- 8c. assets referenced but missing ----------------------------- */
    sub('8c. referenced assets that 404 (silent fallbacks)');
    var want = [];
    [].forEach.call(document.querySelectorAll('script[src]'), function (t) { want.push(t.getAttribute('src')); });
    [].forEach.call(document.querySelectorAll('link[rel="stylesheet"],link[rel="preload"]'), function (t) { want.push(t.getAttribute('href')); });
    want = want.filter(function (u) { return u && u.indexOf('//') === -1; });
    var left = want.length, dead = [];
    if (!left) { w('  no local script or stylesheet references found to check'); part8d(); }
    want.forEach(function (u) {
      fetchT(BASE + u.split('?')[0], { method: 'GET', cache: 'no-store' }, 5000)
        .then(function (r) { if (!r.ok) dead.push(u + '  (' + r.status + ')'); })
        .catch(function () { dead.push(u + '  (network)'); })
        .then(function () {
          if (--left) return;
          w('  checked ' + want.length + ' local script/stylesheet references');
          if (dead.length) { dead.forEach(function (d) { w('    MISSING  ' + d); });
            w('    A missing script does not throw — the feature it powers just never appears.'); }
          else w('    all resolve');
          part8d();
        });
    });

    /* ---- 8d. does the dispatch body actually contain markdown? --------- */
    function part8d() {
      sub('8d. dispatch markdown — is mdToHtml being given structure to render?');
      /* v1.6 guessed these endpoints and got a 405. They are read from the
         page's own dispatch script now: /feed?prefix=atlantica:&details=1
         and /article?key=... — a probe that invents an API tests nothing. */
      var WORKER = 'https://amenti-proxy.ingram-ian.workers.dev';
      fetchT(WORKER + '/feed?prefix=atlantica:&details=1', { cache: 'no-store' }, 8000)
        .then(function (r) { return r.ok ? r.json() : Promise.reject('feed ' + r.status); })
        .then(function (d) {
          var items = (d && (d.items || d.keys || d.entries)) || (Array.isArray(d) ? d : []);
          if (!items.length) { w('  feed returned no items'); return part8e(); }
          var k = items[0].key || items[0].name || items[0];
          return fetchT(WORKER + '/article?key=' + encodeURIComponent(k), { cache: 'no-store' }, 8000)
            .then(function (r) { return r.json(); })
            .then(function (rec) {
              var b = (rec && rec.body) || '';
              w('  sampled: ' + (rec.headline || k));
              w('  body length: ' + b.length + ' chars');
              var tests = [
                ['headings  (## )',   /(^|\n)#{1,4}\s+\S/],
                ['blockquote (> )',   /(^|\n)>\s?\S/],
                ['bullets   (- )',    /(^|\n)\s*[-*+]\s+\S/],
                ['numbered  (1. )',   /(^|\n)\s*\d+[.)]\s+\S/],
                ['rule      (---)',   /(^|\n)(-{3,}|\*{3,})\s*(\n|$)/],
                ['bold      (**)',    /\*\*[^*]+\*\*/],
                ['italic    (*)',     /(^|\s)\*[^*\n]+\*/],
                ['links     ([](  ))',/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/],
                ['inline code (`)',   /`[^`\n]+`/]
              ];
              var found = 0;
              tests.forEach(function (t) {
                var hit = t[1].test(b); if (hit) found++;
                w('    ' + pad(t[0], 22) + (hit ? 'PRESENT' : '-'));
              });
              w('');
              if (found > 1) {
                w('  The generator IS emitting structure. Before the mdToHtml rewrite');
                w('  every one of these rendered as literal punctuation in the reader.');
              } else {
                w('  Little or no structure in this sample. The richer rendering is');
                w('  harmless, but the magazine treatment will not show until the');
                w('  generator writes headings and quotes. That is a prompt change,');
                w('  not a code one.');
              }
              part8e();
            });
        })
        .catch(function (e) { w('  could not sample the feed (' + e + ')'); part8e(); });
    }

    /* ---- 8e. errors nothing else reports -------------------------------- */
    function part8e() {
      sub('8e. errors captured since this probe installed');
      w('  NOTE: this script is deferred, so anything that threw during parse');
      w('  happened BEFORE these hooks existed and cannot be seen here.');
      w('');
      w('  console.error   : ' + ERRS.length);
      ERRS.slice(0, 12).forEach(function (e) { w('    ' + e.slice(0, 150)); });
      w('  window.onerror  : ' + WINERR.length);
      WINERR.slice(0, 12).forEach(function (e) { w('    ' + e.slice(0, 150)); });
      w('  unhandled reject: ' + REJ.length);
      REJ.slice(0, 12).forEach(function (e) { w('    ' + e.slice(0, 150)); });
      if (!ERRS.length && !WINERR.length && !REJ.length) w('    none since install');

      sub('8f. verdict on the proposed change');
      w('  DEFER amenti-chat.js       : DO NOT. termChat is built at parse time');
      w('                               (Amenti.chat.create at the Terminal IIFE).');
      w('                               Deferring sets it null silently — see 8a.');
      w('  PRELOAD amenti-chat.js     : safe. <link rel="preload" as="script"> starts');
      w('                               the fetch early WITHOUT changing execution');
      w('                               order, so the parse-time guard still passes.');
      w('  Confirm after adding it    : Amenti.terminalPath must still read "core".');
      w('                               If it reads "inline-fallback", revert at once.');
      cb();
    }
  }


  /* ======================================================================= */
  /* 9. THE FLIGHT RECORDER — what actually held the thread                  */
  /* -----------------------------------------------------------------------
     Read from window.__AT, filled by an inline snippet at the very top of
     <head> that started before any other script ran. A deferred diagnostic
     cannot see the work that happened before it loaded, which is exactly the
     work in question. This section replaces driving DevTools by hand.        */
  function recorderSection() {
    hr('9. WHAT HELD THE MAIN THREAD');
    var T = window.__AT;
    if (!T) {
      w('  window.__AT absent — this Page1.html does not carry the recorder.');
      w('  Deploy the version with the inline snippet at the top of <head>.');
      return;
    }
    sub('9a. milestones');
    (T.marks || []).forEach(function (m) {
      w('  ' + pad(m.at + ' ms', 12) + m.w +
        (m.took != null ? '   (' + m.took + ' ms from click to paint)' : ''));
    });

    sub('9b. blocking, measured by heartbeat');
    w('  A tick is scheduled every 50 ms. A longer gap means the thread was busy');
    w('  for the difference. Works in every browser, needs no API.');
    w('');
    var gaps = (T.gaps || []).slice().sort(function (a, b) { return b.d - a.d; });
    if (!gaps.length) w('  no gap over 220 ms — the thread was never blocked for long');
    else {
      w('  ' + pad('started', 12) + pad('blocked for', 14) + 'bar (1 # = 100ms)');
      gaps.slice(0, 18).forEach(function (g) {
        w('  ' + pad(g.s + ' ms', 12) + pad(g.d + ' ms', 14) +
          Array(Math.min(40, Math.round(g.d / 100)) + 1).join('#'));
      });
      var total = gaps.reduce(function (n, g) { return n + g.d; }, 0);
      w('');
      w('  worst single block : ' + gaps[0].d + ' ms, starting at ' + gaps[0].s + ' ms');
      w('  total blocked      : ' + total + ' ms across ' + gaps.length + ' stalls');
    }

    sub('9c. long tasks, with attribution');
    if (!T.longtaskSupported) {
      w('  This browser has no PerformanceObserver longtask, so there is no');
      w('  attribution. The heartbeat above still measured the blocking — it');
      w('  simply cannot name the file. Cross-reference 9b against 9a.');
    } else if (!(T.long || []).length) {
      w('  no long tasks recorded');
    } else {
      w('  ' + pad('started', 12) + pad('duration', 12) + 'attributed to');
      T.long.slice().sort(function (a, b) { return b.d - a.d; }).slice(0, 18)
        .forEach(function (e) {
          w('  ' + pad(e.s + ' ms', 12) + pad(e.d + ' ms', 12) +
            (e.c || e.n || '(unattributed)'));
        });
    }

    sub('9d. how to read it');
    w('  Compare the worst stall in 9b against the milestones in 9a:');
    w('    before DOMContentLoaded      parsing and executing the blocking');
    w('                                 scripts, or one of the inline blocks');
    w('    after load, before a click   the ledger — fetch, parse, merge of');
    w('                                 1,007 records, resolver indexing');
    w('    after "click <tab>"          that section building itself. The');
    w('                                 paint figure on the same line in 9a is');
    w('                                 the true cost of the tab switch.');
  }

  /* ======================================================================= */
  /* download                                                                */
  /* ======================================================================= */
  var SAVED = false;
  function save() {
    if (SAVED) return; SAVED = true;
    hr('END — amenti-diagnose v' + VERSION + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
    var txt = L.join('\n');
    try {
      var blob = new Blob([txt], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'amenti-diagnose.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
      try {
        console.log('%camenti-diagnose complete — amenti-diagnose.txt downloaded (' +
          txt.length + ' bytes)', 'color:#57c98a;font-weight:bold');
      } catch (e) {}
    } catch (e) {
      try { console.log(txt); } catch (e2) {}
    }
  }

  /* ---- wait for the ledger, then run ------------------------------------ */
  function run() {
    L = []; t0 = Date.now(); SAVED = false;
    /* WATCHDOG. Whatever stalls, the report is written and downloaded. It may
       be incomplete, and it says so — but it exists. */
    setTimeout(function () {
      if (SAVED) return;
      w('');
      w('*** WATCHDOG FIRED — a section did not finish within 60s and the');
      w('*** report was written anyway. Anything below the last completed');
      w('*** section is missing. The usual cause is a fetch to a worker or');
      w('*** CDN that never answered.');
      save();
    }, 60000);
    var last = -1, stable = 0, settled = false;
    (function poll() {
      var n = (window.AMENTI_CHARS || []).length;
      var elapsed = Date.now() - t0;
      if (n === last && n > 0) stable += 120; else { stable = 0; last = n; }
      if (stable >= SETTLE || elapsed > CEILING) {
        settled = stable >= SETTLE;
        var first = snapshot();
        setTimeout(function () {
          var second = snapshot();
          envSection(elapsed, settled);
          freshSection(function () {
            cssSection();
            cardsSection(first, second);
            resolverSection(second);
            /* ORDER: the recorder answers the question this run is for, so it goes
             first. The tab sweep is optional and has stalled before. */
          artSection(second, function () {
            surfaceSection();
            recorderSection();
            riskSection(function () { tabSection(save); });
          });
          });
        }, LATE);
        return;
      }
      setTimeout(poll, 120);
    })();
  }

  window.AmentiDiagnose = { run: run, version: VERSION };

  if (/[?&]diagnose=1/.test(location.search)) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 400); });
    else setTimeout(run, 400);
  }
})();
