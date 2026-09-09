/* ============================================================================
   amenti-attica-tours.js  →  Amenti.live/amenti-attica-tours.js
   ----------------------------------------------------------------------------
   THE TOUR READER  ·  SLIP #78
   ----------------------------------------------------------------------------
   A TOUR IS A SEQUENCE OF REGISTER STATES, NOT A SCRIPT.

   This file plays TOURS.csv. It has no data of its own, draws no mark, and
   computes nothing about the ancient world. Every frame is four values handed
   to AmentiAttica — which switches are on, which period, which year, where the
   camera is — and each of those four is something a reader could set by hand
   from the legend, the period buttons and the scrub. THE READER COULD BUILD
   EVERY FRAME OF EVERY TOUR WITHOUT THIS FILE. What it adds is the ORDER.

   ── WHY THAT MATTERS AND IS NOT PEDANTRY ──────────────────────────────────
   A narrator that says THE WHEAT CAME FROM EGYPT SO ATHENS COULD NOT AFFORD TO
   LOSE THE SEA is making an argument, and an argument is a claim that no
   register holds and no reader can check. A sequence of states makes none:
   every frame is pausable, every mark in it is hoverable, and every hover
   reaches a source, BECAUSE EVERY FRAME IS THE REGISTER. The reader supplies
   the join between two frames and is free to refuse it.

   THE SAME DISTINCTION AS THE ZIGZAG on a move: a script asserts the path
   between two points; a state shows one layer of what is already filed.

   ── THE CAPTION IS THE ONLY PLACE THIS CAN LIE ────────────────────────────
   Switches cannot assert. Prose can. So the caption is displayed in its own
   band, in the register's own voice rather than a narrator's, and TOURS.csv
   states the rule in its header: a caption names what is on screen and stops.
   probes/probe-tours.mjs is meant to enforce it, because a rule kept only by
   whoever writes the next row is not kept.

   ── AND IT NEVER TOUCHES THE HALL ─────────────────────────────────────────
   hall.html says in its own comment that the hall and the map NEVER SHARE THE
   SCREEN. A tour that wanted to move between prose and ground would have to
   SEQUENCE between them. This one does not try: it stays inside Attica, and
   the day a tour needs the hall is the day that rule gets discussed on
   purpose rather than broken by a file that needed one more frame.

   ── WHAT IT NEEDS ─────────────────────────────────────────────────────────
       TOURS.csv                 the register · missing is stated, not fatal
       AmentiAttica.marks()      · the switches
       AmentiAttica.period()     · the five periods
       AmentiAttica.year()       · the scrub, or null for the clock off
       AmentiAttica.camera()     · attention, which asserts nothing
       AmentiAttica.switches()   · what a row may legally name

   All five arrived on 8 September. If any is absent this file says so on the
   surface and refuses to play, rather than half-driving a tour and leaving the
   reader to guess which frames were real.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  var open = false;
  var tours = null, loadErr = null;
  var order = [];              /* tour slugs in file order */
  var cur = null, at = 0;      /* the tour being played, and the step index */
  var timer = null, playing = false;
  var band = null;

  /* ── THE REGISTER ─────────────────────────────────────────────────────────
     Same CSV rules as every other register on this surface: # lines are
     comment, quotes protect commas, a blank cell is a blank cell. Written out
     again rather than shared because amenti-attica.js keeps its parser private
     and a module that reaches into another module's closure is a module that
     breaks when the other one is tidied. */
  function split(line) {
    var c = [], cur2 = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { c.push(cur2); cur2 = ''; continue; }
      cur2 += ch;
    }
    c.push(cur2);
    return c;
  }
  function parse(text) {
    var lines = String(text).replace(/\r\n/g, '\n').split('\n');
    var cols = split(lines[0]), out = [];
    for (var i = 1; i < lines.length; i++) {
      var ln = lines[i];
      if (!ln.trim() || ln.charAt(0) === '#') { continue; }
      var c = split(ln), o = {};
      for (var j = 0; j < cols.length; j++) {
        o[cols[j].trim()] = c[j] == null ? '' : c[j].trim();
      }
      if (!o.tour) { continue; }
      o.step = +o.step;
      o.hold = o.hold === '' ? 5 : +o.hold;
      out.push(o);
    }
    return out;
  }

  /* ── A FRAME IS FOUR CALLS ────────────────────────────────────────────────
     AND A BLANK CELL MEANS HOLD, NOT RESET. A row that names no camera leaves
     the camera where the previous frame put it; a row that names no year
     leaves the clock where it was. This is deliberate: a tour is written as a
     sequence of CHANGES, and forcing every row to restate the whole state
     would make the diff between two frames invisible to whoever writes them.

     The one exception is `marks`, which is always absolute. A tour that added
     switches without ever being able to state the full set would drift, and a
     frame whose contents depend on which frame you entered from is not a
     register state. */
  function frame(r) {
    var A = window.AmentiAttica;
    if (r.marks !== '') { A.marks(r.marks); }
    if (r.period) { A.period(r.period); }
    A.year(r.year === '' ? null : +r.year);
    if (r.lat !== '' || r.lon !== '' || r.zoom !== '') {
      A.camera(r.lat === '' ? null : +r.lat,
               r.lon === '' ? null : +r.lon,
               r.zoom === '' ? null : +r.zoom);
    }
    paint(r);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function paint(r) {
    if (!band) { return; }
    var steps = tours[cur] || [];
    band.querySelector('.att-cap').innerHTML =
      '<b>' + esc(cur) + '</b> \u00b7 ' + (at + 1) + ' of ' + steps.length +
      '<br>' + esc(r.caption);
    band.querySelector('.att-dots').innerHTML = steps.map(function (s, i) {
      return '<i' + (i === at ? ' class="att-on"' : '') + ' data-i="' + i + '"></i>';
    }).join('');
    var pb = band.querySelector('.att-play');
    if (pb) { pb.textContent = playing ? 'pause' : 'play'; }
    lift();
  }

  function go(i) {
    var steps = tours && tours[cur];
    if (!steps || !steps.length) { return; }
    at = Math.max(0, Math.min(steps.length - 1, i));
    frame(steps[at]);
  }

  function stop() {
    playing = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (band) { paint((tours[cur] || [])[at] || { caption: '' }); }
  }

  /* THE LAST FRAME STAYS UP. It does not loop and it does not clear: a reader
     who wants to sit on the final state and hover it is doing exactly what the
     acceptance test in #78 asks for. */
  function play() {
    var steps = tours && tours[cur];
    if (!steps || !steps.length) { return; }
    playing = true;
    var tick = function () {
      paint(steps[at]);
      if (at >= steps.length - 1) { stop(); return; }
      timer = setTimeout(function () { go(at + 1); tick(); },
                         Math.max(1, steps[at].hold) * 1000);
    };
    go(at);
    tick();
  }

  function style() {
    if (document.getElementById('att-css')) { return; }
    var s = document.createElement('style');
    s.id = 'att-css';
    s.textContent = [
      /* the band sits under the surface rather than over it: a caption laid
         across the ground would cover the thing it is naming */
      /* bottom is SET AT RUNTIME by lift(), not here. The surface's own
         control row is at bottom:16px and wraps, so its height depends on how
         wide the window is \u2014 a fixed offset picked once put this band across
         the period buttons on an iMac and would have been wrong again on the
         next screen. MEASURE, DO NOT GUESS. */
      '#amenti-attica .att-band{position:absolute;left:26px;right:26px;',
      '  z-index:9;display:flex;align-items:flex-end;gap:14px;',
      '  font:400 12px/1.5 ui-monospace,Menlo,monospace;color:#9fb4c8}',
      '#amenti-attica .att-cap{flex:1 1 auto;max-width:620px;',
      '  background:rgba(5,8,14,.72);border-left:2px solid #e0913f;',
      '  padding:7px 11px;border-radius:2px}',
      '#amenti-attica .att-cap b{color:#e0913f;font-weight:400;letter-spacing:.06em}',
      '#amenti-attica .att-ctl{display:flex;gap:6px;align-items:center;',
      '  background:rgba(5,8,14,.72);padding:6px 8px;border-radius:2px}',
      '#amenti-attica .att-ctl button{background:none;border:1px solid #2b3b4d;',
      '  color:#9fb4c8;font:inherit;padding:2px 9px;border-radius:2px;cursor:pointer}',
      '#amenti-attica .att-ctl button:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-attica .att-ctl select{background:#0a1017;border:1px solid #2b3b4d;',
      '  color:#9fb4c8;font:inherit;padding:2px 4px;border-radius:2px}',
      '#amenti-attica .att-dots{display:flex;gap:5px;margin-left:2px}',
      '#amenti-attica .att-dots i{width:7px;height:7px;border-radius:50%;',
      '  background:#2b3b4d;cursor:pointer;display:block}',
      '#amenti-attica .att-dots i.att-on{background:#e0913f}',
      '#amenti-attica .att-warn{color:#c99a4e}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── MEASURE THE WHOLE STACK, NOT ONE ROW OF IT ────────────────────
     THE FIRST VERSION OF THIS MEASURED .at-ctl AND STEPPED OVER .at-clock,
     which it had not looked for. The arithmetic was right and the survey was
     short, so the band landed correctly and the NOTE was pushed down onto the
     year scrub — a fix that moved the fault rather than removing it.

     Bottom-anchored on this surface, from the floor up:
         .at-ctl     bottom:16px    the period buttons, and it WRAPS
         .at-clock   bottom:118px   the year scrub, the clock, play
         .at-note    bottom:148px   the register's own admissions
     The band goes in the gap above .at-ctl. AT THIS SIZE IT FITS AND NOTHING
     NEEDS TO MOVE. If the window narrows, .at-ctl wraps taller and the gap
     closes, and only then are the clock and the note lifted — by the exact
     overflow and no more.

     NOTHING IS MOVED THAT DOES NOT HAVE TO BE. A module that rearranges
     another module's furniture on principle is a module that has edited
     amenti-attica.js by other means. */
  var was = null;                       /* the natural bottoms, read once */

  function natural(host) {
    if (was) { return was; }
    var c = host.querySelector('.at-clock'), n = host.querySelector('.at-note');
    was = {
      clock: c ? parseFloat(getComputedStyle(c).bottom) || 118 : 118,
      note:  n ? parseFloat(getComputedStyle(n).bottom) || 148 : 148
    };
    return was;
  }

  function lift() {
    var host = document.querySelector('#amenti-attica');
    if (!host || !band) { return; }
    var nat = natural(host);
    var ctl = host.querySelector('.at-ctl');
    var base = 16 + (ctl ? ctl.offsetHeight : 0) + 10;
    band.style.bottom = base + 'px';

    var top = base + band.offsetHeight + 10;      /* what the band reaches */
    var over = top - nat.clock;                   /* into the clock, or not */
    var clock = host.querySelector('.at-clock');
    var note = host.querySelector('.at-note');
    if (over > 0) {
      if (clock) { clock.style.bottom = (nat.clock + over) + 'px'; }
      if (note) { note.style.bottom = (nat.note + over) + 'px'; }
    } else {
      if (clock) { clock.style.bottom = ''; }
      if (note) { note.style.bottom = ''; }
    }
  }

  function drop() {
    var host = document.querySelector('#amenti-attica');
    if (!host) { return; }
    var clock = host.querySelector('.at-clock'), note = host.querySelector('.at-note');
    if (clock) { clock.style.bottom = ''; }
    if (note) { note.style.bottom = ''; }
  }

  function mount() {
    var host = document.querySelector('#amenti-attica');
    if (!host || band) { return band; }
    style();
    band = document.createElement('div');
    band.className = 'att-band';
    band.innerHTML =
      '<div class="att-cap"></div>' +
      '<div class="att-ctl">' +
      '<select class="att-pick"></select>' +
      '<button type="button" class="att-prev">\u2039</button>' +
      '<button type="button" class="att-play">play</button>' +
      '<button type="button" class="att-next">\u203a</button>' +
      '<span class="att-dots"></span>' +
      '</div>';
    host.appendChild(band);

    band.addEventListener('click', function (e) {
      var t = e.target;
      e.stopPropagation();
      if (t.closest('.att-prev')) { stop(); go(at - 1); return; }
      if (t.closest('.att-next')) { stop(); go(at + 1); return; }
      if (t.closest('.att-play')) { playing ? stop() : play(); return; }
      var d = t.closest ? t.closest('[data-i]') : null;
      if (d) { stop(); go(+d.getAttribute('data-i')); }
    });
    band.querySelector('.att-pick').addEventListener('change', function (e) {
      stop();
      cur = e.target.value;
      go(0);
    });
    return band;
  }

  /* ── WHAT IT REFUSES TO DO ────────────────────────────────────────────────
     If the four setters are not on AmentiAttica, this does not fall back to
     driving what it can. A tour half-played is worse than no tour: the reader
     cannot tell which frames were the register and which were whatever this
     file managed. AN INSTRUMENT THAT DEGRADES QUIETLY IS THE FAULT THE ATTICA
     LOAD PATH WAS ALREADY REWRITTEN ONCE TO AVOID. */
  function ready() {
    var A = window.AmentiAttica;
    if (!A) { return 'AmentiAttica is not loaded'; }
    var need = ['marks', 'period', 'year', 'camera', 'switches'], miss = [];
    need.forEach(function (k) { if (typeof A[k] !== 'function') { miss.push(k); } });
    return miss.length ? 'AmentiAttica is missing ' + miss.join(', ') +
                         ' \u2014 this needs the 8 September build' : null;
  }

  function say(html) {
    if (!band) { mount(); }
    if (band) { band.querySelector('.att-cap').innerHTML = html; }
  }

  function show() {
    if (!document.body.classList.contains('scene-attica')) { return false; }
    if (!mount()) { return false; }
    open = true;
    band.style.display = '';
    lift();

    var why = ready();
    if (why) {
      say('<span class="att-warn">' + esc(why) + '. No tour is played rather ' +
          'than some frames being real and others not.</span>');
      return true;
    }

    if (tours === null && loadErr === null) {
      say('reading TOURS.csv\u2026');
      fetch(RAW + 'TOURS.csv?_=' + Date.now())
        .then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.text(); })
        .then(function (t) {
          var rowsIn = parse(t), by = {};
          rowsIn.forEach(function (r) {
            if (!by[r.tour]) { by[r.tour] = []; order.push(r.tour); }
            by[r.tour].push(r);
          });
          Object.keys(by).forEach(function (k) {
            by[k].sort(function (a, b) { return a.step - b.step; });
          });
          tours = by;
          cur = order[0] || null;
        })
        .catch(function (e) { loadErr = e.message; })
        .then(function () {
          if (loadErr) {
            say('<span class="att-warn">TOURS.csv did not load (' + esc(loadErr) +
                '). That is the register missing, not the tours being empty.</span>');
            return;
          }
          if (!cur) {
            say('<span class="att-warn">TOURS.csv holds no rows.</span>');
            return;
          }
          var sel = band.querySelector('.att-pick');
          sel.innerHTML = order.map(function (k) {
            return '<option value="' + esc(k) + '">' + esc(k) + '</option>';
          }).join('');
          go(0);
        });
      return true;
    }

    if (cur) { go(at); }
    return true;
  }

  function hide() {
    stop();
    open = false;
    if (band) { band.style.display = 'none'; }
    drop();
    return false;
  }
  function toggle() { return open ? hide() : show(); }

  /* a row of frames with one lit — the shape of the thing, not a play arrow,
     because playing is one of several ways to move through it */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="2.5" y="7.5" width="6" height="9" rx="1"/>' +
    '<rect x="9.5" y="7.5" width="6" height="9" rx="1" fill="currentColor"/>' +
    '<rect x="16.5" y="7.5" width="5" height="9" rx="1"/></svg>';

  function join() {
    if (!window.AmentiMap || !window.AmentiMap.addFaculty) { return false; }
    window.AmentiMap.addFaculty('fac-attica-tours', 'attica tours', ICON, toggle,
                                function () { return open; });
    return true;
  }
  function arrive(n) {
    if (join()) { return; }
    if ((n || 0) > 40) {
      console.log('THE TOUR READER did not join the rail \u2014 AmentiMap.addFaculty ' +
                  'was never exported.');
      return;
    }
    setTimeout(function () { arrive((n || 0) + 1); }, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  } else {
    arrive(0);
  }

  /* leaving Attica stops the clock. A tour ticking on a surface nobody is
     looking at would move the camera under a reader who has gone elsewhere. */
  /* the control row wraps differently at a different width, so the offset it
     was measured against stops being true the moment the window changes */
  window.addEventListener('resize', function () { if (open) { lift(); } });

  new MutationObserver(function () {
    if (open && !document.body.classList.contains('scene-attica')) {
      hide();
      if (window.AmentiMap && window.AmentiMap.syncRail) { window.AmentiMap.syncRail(); }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiAtticaTours = {
    show: show, hide: hide, toggle: toggle,
    isOpen: function () { return open; },
    list: function () { return order.slice(); },
    /* drive it from the console: AmentiAtticaTours.play('laureion') */
    play: function (k) {
      if (!tours) { return null; }
      if (k && tours[k]) { cur = k; at = 0; }
      var sel = band && band.querySelector('.att-pick');
      if (sel && cur) { sel.value = cur; }
      play();
      return cur;
    },
    stop: stop,
    step: function (i) { stop(); go(i); return at; },
    /* what a validator should check rows against, read off the surface itself
       rather than restated here — two lists would drift */
    vocabulary: function () {
      var A = window.AmentiAttica;
      return A && A.switches ? { marks: A.switches(), periods: A.periods() } : null;
    }
  };
})();
