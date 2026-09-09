/* ============================================================================
   amenti-attica-hall.js  →  Amenti.live/amenti-attica-hall.js
   ----------------------------------------------------------------------------
   THE JOIN  ·  a place names a soul, and the reader may go and read them

       WHERE THE TWO SURFACES JOIN IS A NAME.

   The hall knows people. The map knows ground. They have stood beside each
   other for three days with one register already holding the join and nothing
   using it: ATTICA-MENTIONS.csv records, per place, WHICH READING ROOMS NAME
   IT — Athens in sixty-one, Corinth in twenty-seven, Laureion in the two
   passages of Thucydides that decided a war.

   This is that column made walkable, in one direction only.

   ── IT IS A HANDOVER, NOT A SPLIT SCREEN ──────────────────────────────────
   hall.html says in its own comment that the hall and the map NEVER SHARE THE
   SCREEN, and the map clears `scene-bare` on the way in. That rule is good and
   this keeps it: clicking a name CLOSES ATTICA, restores the hall, and asks
   the question. One surface at a time, sequenced, and the reader can always
   come back the way they came.

   A pane that opened a reading room beside the ground would be the easier
   thing to build and would cost the rule.

   ── AND IT CARRIES A COUNT, NOT A CLAIM ───────────────────────────────────
   `61 rooms` means sixty-one reading rooms contain a form of this name. It
   does not mean sixty-one souls wrote ABOUT this place, and the pane says
   `names it` rather than `writes about it` for exactly that reason. The
   distinction is the whole difference between a concordance and an argument.

   THE DERIVED FORMS ARE MARKED. A hit on an attested name says the corpus
   names this place. A hit on a Latinised form says the corpus names something
   that TRANSLITERATES to it — which caught four false positives on its first
   reading, `Marius` the Roman general among them.

   ── WHAT IT READS ─────────────────────────────────────────────────────────
       <FRAME>-MENTIONS.csv   the join · missing is stated, not fatal
       #ask-amenti input      the hall's one interaction point

   It reads the register itself rather than reaching into amenti-attica.js for
   the copy already parsed there. A module that reaches into another module's
   closure is a module that breaks when the other one is tidied.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  var pane = null, rows = null, loadErr = null, key = null;
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
      '#amenti-attica .ath{position:absolute;right:24px;bottom:16px;width:232px;',
      '  z-index:7;font:400 10.5px/1.5 ui-monospace,Menlo,monospace;',
      '  color:#7d8ea6;background:rgba(5,8,14,.82);padding:9px 11px;',
      '  border:1px solid rgba(43,58,80,.5);border-radius:4px;',
      '  text-align:right;max-height:34vh;overflow-y:auto;',
      '  scrollbar-width:thin;scrollbar-color:#2b3a50 transparent;',
      '  box-sizing:border-box}',
      '#amenti-attica .ath-head{color:#5d6e84;letter-spacing:.07em;',
      '  padding-bottom:5px;margin-bottom:5px;',
      '  border-bottom:1px solid rgba(43,58,80,.6)}',
      '#amenti-attica .ath-who{color:#e0913f}',
      '#amenti-attica .ath button{background:none;border:0;color:#7fd8f0;',
      '  font:inherit;padding:2px 0;cursor:pointer;display:block;width:100%;',
      '  text-align:right}',
      '#amenti-attica .ath button:hover{color:#dbe8f5}',
      '#amenti-attica .ath b{color:#6f8098;font-weight:400}',
      /* the sentence that keeps the rule visible: this LEAVES the map */
      '#amenti-attica .ath-leave{color:#5d6e84;margin-top:7px;padding-top:6px;',
      '  border-top:1px solid rgba(43,58,80,.4);text-align:right}',
      '#amenti-attica .ath-warn{color:#c99a4e}'
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
    pane.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest ? e.target.closest('[data-soul]') : null;
      if (b) { handover(b.getAttribute('data-soul'), b.getAttribute('data-place')); }
    });
    return pane;
  }

  function show(k) {
    if (!mount()) { return; }
    key = k;
    var r = rows && rows[k];
    if (!r) { pane.style.display = 'none'; return; }
    pane.style.display = '';
    var list = r.souls.slice(0, 8);
    pane.innerHTML =
      '<div class="ath-head">who names it</div>' +
      '<div class="ath-who">' + esc(r.name) + '</div>' +
      '<div><b>' + r.src + ' room' + (r.src === 1 ? '' : 's') + ' \u00b7 ' +
      r.n + ' mention' + (r.n === 1 ? '' : 's') + '</b></div>' +
      (r.origin === 'derived'
        ? '<div class="ath-warn">matched on <b>' + esc(r.form) + '</b>, a DERIVED ' +
          'form \u2014 the corpus names something that transliterates to this</div>'
        : '') +
      '<div style="margin-top:6px">' +
      list.map(function (s) {
        return '<button type="button" data-soul="' + esc(s.key) + '" ' +
               'data-place="' + esc(r.name) + '" ' +
               'title="leave the map and ask the hall about ' + esc(pretty(s.key)) + '">' +
               esc(pretty(s.key)) + ' <b>' + s.n + '</b></button>';
      }).join('') +
      '</div>' +
      (r.souls.length > list.length
        ? '<div><b>and ' + (r.souls.length - list.length) + ' more</b></div>' : '') +
      '<div class="ath-leave">a name here LEAVES the map. The hall and the ' +
      'ground never share the screen.</div>';
  }

  function hide() { if (pane) { pane.style.display = 'none'; } key = null; }

  /* ── THE HANDOVER ──────────────────────────────────────────────────────
     Close the ground, restore the hall, ask the question. In that order, and
     with a frame between each so the reader sees one surface give way to the
     other rather than both flickering at once.

     IT ASKS RATHER THAN OPENING. The hall's one interaction point is the Ask
     box (SURFACES.semantics.json: hall-ask), and a module that reached past it
     to open a reading room directly would be inventing a second door into a
     building that has deliberately got one. */
  function handover(soul, place) {
    var q = 'what does ' + pretty(soul) + ' say about ' + place + '?';

    if (window.AmentiAttica && window.AmentiAttica.hide) {
      try { window.AmentiAttica.hide(); } catch (e) {}
    }
    document.body.classList.remove('scene-attica', 'scene-map', 'scene-bare');
    if (window.AmentiMap && window.AmentiMap.syncRail) {
      try { window.AmentiMap.syncRail(); } catch (e) {}
    }

    setTimeout(function () {
      var box = document.querySelector('#ask-amenti input');
      if (!box) {
        /* RULE 3: A MISSING SIGNAL IS NOT A RED LIGHT. If the ask box is not on
           this page the handover cannot complete, and saying so is better than
           a click that does nothing. */
        console.log('THE JOIN: no #ask-amenti input on this page, so the ' +
                    'question was not asked. It was: ' + q);
        return;
      }
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.focus();
      box.value = q;
      box.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', bubbles: true
      }));
    }, 120);
  }

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
      load(function () {
        if (loadErr) {
          console.log('THE JOIN: ' + FKEY.toUpperCase() + '-MENTIONS.csv not read (' +
                      loadErr + '). Places will not offer their rooms.');
        }
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
    if (f !== FKEY) { FKEY = f; rows = null; loadErr = null; load(function () {}); }
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
    frame: function (k) { FKEY = k; rows = null; loadErr = null; load(function () {}); return FKEY; }
  };
})();
