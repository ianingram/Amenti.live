/* ============================================================================
   amenti-attica-hall.js  →  Amenti.live/amenti-attica-hall.js
   ----------------------------------------------------------------------------
   WHY THIS GROUND MATTERED  ·  and who wrote about it

   Hover a place and this says the one thing a gazetteer cannot hold:

       "The silver. The hills south of Athens held argentiferous lead, and the
        fleet that fought at Salamis was paid for out of a single rich strike
        in 483 BC."

   That sentence is in ATTICA-WHY.csv. It was written by hand, it is checkable,
   it is already loaded, and IT IS THE REASON THIS SURFACE EXISTS. Under it,
   the rooms that name the place, from ATTICA-MENTIONS.csv.

   ── THE FIRST VERSION OF THIS FILE ASKED A MODEL INSTEAD · 9 Sep ──────────
   It ignored the `why` column entirely and routed every click into the hall's
   Ask box, which calls a model, costs a question, and returns prose that can
   be wrong about a text sitting on disk. hall.html says in its own header
   that THE HALL IS NOT A GENERATOR AND CALLS NO MODEL — it shows the
   documents. The register already knew the exact document and the exact
   count; that precision was thrown away to ask a generator what it thought.

   > **THE ANSWER WAS ALREADY WRITTEN, AND IT WAS BETTER THAN THE ONE A
   > GENERATOR WOULD PRODUCE.**

   ── SO IT SHOWS AND DOES NOT ASK ──────────────────────────────────────────
   Nothing here calls a model, spends a question, or leaves the surface. It is
   a reading of two registers that were both already open. The rooms are named
   because a reader should know WHERE a claim would be checked — not clicked,
   because the hall and the ground never share the screen and a handover is a
   separate decision from a hover.

   ── AND IT CARRIES A COUNT, NOT A CLAIM ───────────────────────────────────
   `61 rooms` means sixty-one reading rooms contain a form of this name. It
   does not mean sixty-one souls wrote ABOUT this place, so the pane says
   `names it`. THE DERIVED FORMS ARE MARKED: a hit on a Latinised form says
   the corpus names something that TRANSLITERATES to it, which caught four
   false positives on its first reading, `Marius` the Roman general among them.

   ── WHAT IT READS ─────────────────────────────────────────────────────────
       <FRAME>-WHY.csv        the authored sentence · the point of the pane
       <FRAME>-MENTIONS.csv   where it would be checked

   Both read here rather than reached for inside amenti-attica.js. A module
   that reaches into another module's closure breaks when the other is tidied.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  var pane = null, rows = null, loadErr = null, key = null;
  var whys = null, whyErr = null;
  var FKEY = 'attica';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function split(line) {
    var c = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
      cur += ch;
    }
    c.push(cur);
    return c;
  }

  /* ── THE `in` COLUMN IS A LIST OF ROOMS, AND A ROOM IS A SOUL ───────────
     `thucydides/05-the-sicilian-expedition.md(32)` — the folder is the soul's
     key, the file is one of their works, the number is how many times the
     name occurs in it. Several documents may belong to one soul, so they are
     summed per soul rather than listed per file: A READER WANTS THE PERSON,
     not the filename. */
  function souls(where) {
    var by = {};
    String(where || '').split(';').forEach(function (part) {
      var m = part.trim().match(/^([^\/]+)\/[^(]+\((\d+)\)$/);
      if (!m) { return; }
      by[m[1]] = (by[m[1]] || 0) + (+m[2]);
    });
    return Object.keys(by).map(function (k) { return { key: k, n: by[k] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  /* the folder is a slug; the hall wants a name a person would type */
  function pretty(slug) {
    return String(slug).split('-').map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  /* ── THE `why` COLUMN, WHICH IS THE POINT ──────────────────────────────
     ATTICA-WHY.csv states in its own header that these are drafts, written and
     NOT CHECKED AGAINST A SOURCE, and that the column exists to be overwritten.
     The pane says so where a reader will see it. An authored sentence that
     does not admit it was authored is the one thing worse than no sentence. */
  function loadWhy(then) {
    if (whys !== null || whyErr !== null) { then(); return; }
    fetch(RAW + FKEY.toUpperCase() + '-WHY.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { whyErr = 'not in the repo yet'; return; }
        var lines = t.replace(/\r\n/g, '\n').split('\n');
        var cols = split(lines[0]).map(function (h) { return h.trim(); });
        var ik = cols.indexOf('key'), iw = cols.indexOf('why');
        whys = {};
        for (var i = 1; i < lines.length; i++) {
          if (!lines[i].trim() || lines[i].charAt(0) === '#') { continue; }
          var c = split(lines[i]);
          var k = (c[ik] || '').trim(), w = (c[iw] || '').trim();
          if (k && w) { whys[k] = w; }
        }
      })
      .catch(function (e) { whyErr = e.message; })
      .then(then);
  }

  function load(then) {
    if (rows !== null || loadErr !== null) { then(); return; }
    fetch(RAW + FKEY.toUpperCase() + '-MENTIONS.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { loadErr = 'not in the repo yet'; return; }
        var lines = t.replace(/\r\n/g, '\n').split('\n');
        var cols = split(lines[0]).map(function (h) { return h.trim(); });
        rows = {};
        for (var i = 1; i < lines.length; i++) {
          if (!lines[i].trim() || lines[i].charAt(0) === '#') { continue; }
          var c = split(lines[i]), o = {};
          for (var j = 0; j < cols.length; j++) { o[cols[j]] = c[j] == null ? '' : c[j]; }
          if (o.key && +o.sources > 0) {
            rows[o.key] = {
              name: o.name, src: +o.sources, n: +o.mentions,
              souls: souls(o['in']),
              form: o.matched_as || '', origin: o.matched_origin || ''
            };
          }
        }
      })
      .catch(function (e) { loadErr = e.message; })
      .then(then);
  }

  function style() {
    if (document.getElementById('ath-css')) { return; }
    var s = document.createElement('style');
    s.id = 'ath-css';
    s.textContent = [
      /* Under the reading list, on the right, because both answer WHO — the
         list says which places the corpus names most, this says who named
         this one. The bottom-left already carries four rows. */
      /* Wider than the reading list, because a SENTENCE lives here and a
         sentence broken over four words a line is not read. Left-aligned for
         the same reason: the list on the right is a ranking and reads well
         ragged-left; prose does not. */
      '#amenti-attica .ath{position:absolute;right:24px;bottom:16px;width:300px;',
      '  z-index:7;font:400 11px/1.55 ui-monospace,Menlo,monospace;',
      '  color:#7d8ea6;background:rgba(5,8,14,.88);padding:11px 13px;',
      '  border:1px solid rgba(43,58,80,.5);border-radius:4px;',
      '  text-align:left;max-height:42vh;overflow-y:auto;',
      '  scrollbar-width:thin;scrollbar-color:#2b3a50 transparent;',
      '  box-sizing:border-box;pointer-events:none}',
      '#amenti-attica .ath-who{color:#e0913f;font-size:12px;letter-spacing:.03em;',
      '  margin-bottom:6px}',
      /* THE SENTENCE IS THE PANE. Everything else is smaller than it. */
      '#amenti-attica .ath-why{color:#c3d3e6;line-height:1.6}',
      '#amenti-attica .ath-draft{color:#5d6e84;font-size:9.5px;margin-top:5px;',
      '  letter-spacing:.02em}',
      '#amenti-attica .ath-none{color:#5d6e84;font-style:italic}',
      '#amenti-attica .ath-head{color:#5d6e84;letter-spacing:.07em;',
      '  margin-top:9px;padding-top:7px;font-size:9.5px;',
      '  border-top:1px solid rgba(43,58,80,.6)}',
      '#amenti-attica .ath b{color:#6f8098;font-weight:400}',
      '#amenti-attica .ath-rooms{display:flex;flex-wrap:wrap;gap:2px 10px;',
      '  margin-top:3px;color:#7fd8f0;font-size:10px}',
      '#amenti-attica .ath-warn{color:#c99a4e;font-size:9.5px;margin-top:3px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function mount() {
    var host = document.querySelector('#amenti-attica');
    if (!host) { return null; }
    if (pane && pane.parentNode === host) { return pane; }
    style();
    pane = document.createElement('div');
    pane.className = 'ath';
    pane.style.display = 'none';
    host.appendChild(pane);
    /* it reads and does nothing. A click on it does not leave the surface,
       does not call a model, and does not cost a question. */
    pane.addEventListener('click', function (e) { e.stopPropagation(); });
    return pane;
  }

  function show(k) {
    if (!mount()) { return; }
    key = k;
    var r = rows && rows[k];
    var w = whys && whys[k];
    if (!r && !w) { pane.style.display = 'none'; return; }
    pane.style.display = '';

    var name = (r && r.name) || '';
    var list = r ? r.souls.slice(0, 6) : [];

    pane.innerHTML =
      (name ? '<div class="ath-who">' + esc(name) + '</div>' : '') +

      /* THE SENTENCE FIRST. It is the answer; everything under it is where
         the answer would be checked. */
      (w
        ? '<div class="ath-why">' + esc(w) + '</div>' +
          '<div class="ath-draft">authored and unverified \u2014 ' +
          FKEY.toUpperCase() + '-WHY.csv says so of every line in it</div>'
        : '<div class="ath-none">no sentence written for this ground yet. ' +
          'Pleiades records that a thing was here; it does not record why ' +
          'anyone should care.</div>') +

      (r
        ? '<div class="ath-head">named in</div>' +
          '<div><b>' + r.src + ' room' + (r.src === 1 ? '' : 's') + ' \u00b7 ' +
          r.n + ' mention' + (r.n === 1 ? '' : 's') + '</b></div>' +
          (r.origin === 'derived'
            ? '<div class="ath-warn">on <b>' + esc(r.form) + '</b>, a DERIVED ' +
              'form \u2014 the corpus names something that transliterates to this</div>'
            : '') +
          '<div class="ath-rooms">' +
          list.map(function (s2) {
            return '<span>' + esc(pretty(s2.key)) + ' <b>' + s2.n + '</b></span>';
          }).join('') +
          (r.souls.length > list.length
            ? '<span><b>and ' + (r.souls.length - list.length) + ' more</b></span>' : '') +
          '</div>'
        : (rows ? '<div class="ath-head">named by nothing in the library</div>' : ''));
  }

  function hide() { if (pane) { pane.style.display = 'none'; } key = null; }

  /* ── THERE IS NO HANDOVER, AND THAT IS THE CORRECTION ──────────────────
     The first version of this file ended here with a function that closed
     Attica, restored the hall, and posted a question into the Ask box. It is
     gone. Nothing in this module calls a model, spends a question, or moves
     the reader off the surface: it names the rooms so a reader knows where a
     claim WOULD be checked, and stops.

     If a handover is wanted later it is a separate decision with its own
     button, and it should open the DOCUMENT — the register holds the exact
     file and the exact count — rather than asking a generator what the
     document says. */

  /* ── WHAT LIGHTS IT ────────────────────────────────────────────────────
     The same hover the reading panel uses. It does not add a listener to every
     mark \u2014 marks are redrawn on every frame of a tour and every turn of the
     scrub, and a listener per mark would be thousands of them per minute. One
     delegated listener on the surface, which survives every redraw. */
  function wire() {
    var host = document.querySelector('#amenti-attica');
    if (!host || host.getAttribute('data-ath') === '1') { return !!host; }
    host.setAttribute('data-ath', '1');
    host.addEventListener('pointerover', function (e) {
      var n = e.target.closest ? e.target.closest('[data-k]') : null;
      if (!n) { return; }
      var k = n.getAttribute('data-k');
      if (k && k !== key) { show(k); }
    });
    /* leaving the surface clears it; leaving one mark for another does not,
       because a pane that blinks between neighbours cannot be read */
    host.addEventListener('pointerleave', hide);
    return true;
  }

  function arrive(n) {
    if (wire()) {
      loadWhy(function () {
        load(function () {
          if (whyErr) {
            console.log('WHY THE GROUND MATTERED: ' + FKEY.toUpperCase() +
                        '-WHY.csv not read (' + whyErr + ').');
          }
          if (loadErr) {
            console.log('WHY THE GROUND MATTERED: ' + FKEY.toUpperCase() +
                        '-MENTIONS.csv not read (' + loadErr + '), so no rooms ' +
                        'are named.');
          }
        });
      });
      return;
    }
    if ((n || 0) > 40) {
      console.log('THE JOIN did not find #amenti-attica.');
      return;
    }
    setTimeout(function () { arrive((n || 0) + 1); }, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  } else {
    arrive(0);
  }

  /* the frame changed, so the join did too */
  new MutationObserver(function () {
    if (!document.body.classList.contains('scene-attica')) { hide(); return; }
    var f = window.AmentiAttica && window.AmentiAttica.count ? FKEY : FKEY;
    if (f !== FKEY) { FKEY = f; rows = null; loadErr = null; whys = null; whyErr = null;
                      loadWhy(function () { load(function () {}); }); }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiAtticaHall = {
    show: show, hide: hide,
    /* drive it from the console: AmentiAtticaHall.who('pl-580010') */
    who: function (k) {
      return rows ? (rows[k] || null) : (loadErr ? { error: loadErr } : null);
    },
    /* what the join actually reaches, counted off the register */
    reach: function () {
      if (!rows) { return loadErr ? { error: loadErr } : null; }
      var ks = Object.keys(rows);
      var all = {};
      ks.forEach(function (k) {
        rows[k].souls.forEach(function (s) { all[s.key] = (all[s.key] || 0) + 1; });
      });
      return { places: ks.length, souls: Object.keys(all).length };
    },
    frame: function (k) {
      FKEY = k; rows = null; loadErr = null; whys = null; whyErr = null;
      loadWhy(function () { load(function () {}); });
      return FKEY;
    },
    /* the sentence for a place, without hovering it */
    why: function (k) { return whys ? (whys[k] || null) : (whyErr ? { error: whyErr } : null); },
    /* how much of this frame has a sentence at all */
    written: function () {
      if (!whys) { return whyErr ? { error: whyErr } : null; }
      var named = rows ? Object.keys(rows).length : null;
      var both = rows ? Object.keys(rows).filter(function (k) { return whys[k]; }).length : null;
      return { sentences: Object.keys(whys).length, named: named, named_with_sentence: both };
    }
  };
})();
