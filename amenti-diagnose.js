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

  var VERSION  = '1.1';
  var BASE     = location.origin + location.pathname.replace(/[^/]*$/, '');
  var MAXCARDS = 200;
  var SETTLE   = 700;    /* ms of no AMENTI_CHARS growth = ledger has landed */
  var CEILING  = 25000;  /* ms hard cap on waiting */
  var LATE     = 2500;   /* ms between the settle sample and the late sample */

  var L = [], t0 = Date.now();
  function w(s) { L.push(s == null ? '' : String(s)); }
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
    'amenti-roster.js'   : ['function rekey(', 'AmentiArtPhoto.pass()'],
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
      fetch(BASE + f, { cache: 'no-store' })
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

    fetch(BASE + 'img/MANIFEST.json', { cache: 'no-store' })
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
    w('.term-main        : ' + (main ? 'present  data-fig=' + (main.getAttribute('data-fig') || '(unset)') : 'absent'));
    if (stack) {
      var cs = getComputedStyle(stack), r = stack.getBoundingClientRect();
      w('.plate-stack      : position=' + cs.position + '  size=' +
        Math.round(r.width) + 'x' + Math.round(r.height) +
        (cs.position !== 'absolute' ? '   <-- MUST be absolute; relative collapses it to 0px' : '') +
        (r.height === 0 ? '   <-- ZERO HEIGHT, nothing can render' : ''));
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
  /* download                                                                */
  /* ======================================================================= */
  function save() {
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
    L = []; t0 = Date.now();
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
            artSection(second, function () { surfaceSection(); save(); });
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
