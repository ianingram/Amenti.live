/* ============================================================================
   amenti-timeline.js  ·  WHERE YOU ARE IN TIME
   ----------------------------------------------------------------------------
   A SHARED SCRIPT, NOT A PAGE. Like library.js, it is never visited directly.
   Any surface includes it and calls:

       window.AmentiTimeline.place('brutus')          // one room key
       window.AmentiTimeline.place(['brutus','livy']) // several; the FIRST wins
       window.AmentiTimeline.clear()

   It mounts itself once, on first use, and thereafter redraws in place.

   ── WHY IT EXISTS ────────────────────────────────────────────────────────
   Narrative history hides simultaneity. It is organised by subject, and a
   time-slice cuts across every subject at once, so reading about Cleopatra
   never gives you who else was breathing. The roster already contains those
   relationships \u2014 1,011 souls with a birth and a death \u2014 and until now
   nothing displayed them.

   The reading that made the case: at 509 BC, while Brutus expels the Tarquins,
   the Buddha, Confucius and Sun Tzu are all alive. That reorganises a period
   in one glance and it needs no citation, because it is a fact about the
   ship's own register.

   ── WHERE IT LIVES, AND WHY THAT IS THE DESIGN ───────────────────────────
   The hall has a second state: a click anywhere that is not a control toggles
   `body.scene-bare`, which hides #hall-main and leaves the image.

   THIS BUILDS BEHIND THE READING, WHILE YOU READ. It is not summoned and it
   does not load on click. When the reading goes, the timeline is REVEALED \u2014
   which says something a summoned panel cannot: the position was always true.
   You were reading Josephus at AD 37\u2013100 the whole time.

   Because scene-bare hides #hall-main entirely, this cannot live inside it.
   It mounts as a sibling of the page body and shows the way #scene-hint does.

   ── THE FIXED WINDOW ─────────────────────────────────────────────────────
   200 years, always, centred on the MIDPOINT of the anchor figure.

   FIXED so the scale never changes. A reader learns what a century looks like
   once, and every answer afterwards reads against the same ruler \u2014 Brutus at
   509 BC becomes directly comparable to Josephus at AD 37. A window sized to
   each figure would quietly destroy that.

   MIDPOINT, not birth. Josephus centred on his midpoint runs about \u221232 to
   168: Actium and Cleopatra at the left edge, Tacitus and Plutarch at the
   right. Centred on birth it would run 37\u2013237 \u2014 everything after him and
   nothing before, losing the world he was born into, which is half of what
   makes the reading work.

   ── ORDERED BY DEATH YEAR, BECAUSE THE HELIX IS ──────────────────────────
   Page2 computes: anchorYear = !isNaN(effectiveDeath) ? effectiveDeath
                                                      : birthYear
   This matches it EXACTLY, fallback included. Not because ordering by death
   reads better, but because THE TWO VIEWS MUST AGREE: scroll to a year here
   and the same figures must sit where the helix puts them. Order by birth and
   they diverge subtly, which is the drift this yard spends its time removing.
   The roster has no soul without a death year today; the fallback is here so
   that the day one appears, the two views still agree.
   ========================================================================== */

(function () {
  'use strict';

  var RAW        = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  /* ── THE WINDOW, AND THE ZOOM THAT DOES NOT BREAK IT · 2 Sep ─────────────
     200 years is the DEFAULT and every answer opens there. That is what keeps
     the promise in the header: a reader learns what a century looks like once,
     and Brutus at 509 BC stays comparable to Josephus at AD 37 from one answer
     to the next.

     The zoom does not undo that, because it is never where a reader ARRIVES.
     They arrive at 200 and change it deliberately, which is a different act
     from being handed a scale that varies without their knowing. Opening a
     room resets to 200.

     SPAN is the only number anything derives from — PX_PER_YR, the bars, the
     axis, the slider, the readout — so a zoom is one variable and a redraw. */
  var SPAN_DEFAULT = 200;
  var SPANS      = [50, 200, 800, 3000];   /* a life · an age · a era · all of it */
  var SPAN       = SPAN_DEFAULT;
  /* SEEN LIVE, 2 Sep: the footer read "151 bc — ad 90 · 241 YEARS". The span
     was supposed to be fixed at 200 and it was not — fixing PIXELS PER YEAR
     instead fixes the wrong thing, and the window becomes whatever the viewport
     happens to be. On a wide screen the reader gets 241 years, on a narrow one
     rather less, and Brutus stops being comparable to Josephus, which is the
     entire reason the span is fixed. Derived from the viewport at draw time
     instead, so SPAN is the thing that holds. */
  var PX_PER_YR  = 6;       /* a fallback only; recomputed in scale() */

  function scale(rail) {
    var w = (rail && rail.clientWidth) || 1200;
    PX_PER_YR = w / SPAN;
    return PX_PER_YR;
  }
  var ROW_H      = 34;
  var BAR_H      = 26;
  /* ── THE AXIS IS FOUR LINES · 2 Sep ──────────────────────────────────────
     It was one line and the labels piled into porridge. Dropping the ones that
     collided was the first answer and it was not enough, because the collision
     test and the code that placed them SHARED A CHARACTER-WIDTH ESTIMATE — a
     fixture measuring itself, which reported zero overlaps while the screen
     showed a wall of gold.

     STAGGERING IS ROBUST WHERE DROPPING IS NOT. Three rows triple the room for
     the same estimate, so being wrong about glyph width costs a near-miss
     rather than a pile-up. And the rows carry meaning:

       row 0   THE SKY   — computed, and the handle for dragging time
       row 1   events, staggered
       row 2   events, staggered
       row 3   the years */
  var AXIS_H     = 158;
  var SKY_Y      = 26;
  var EV_Y       = [78, 104];
  var LABEL_MIN  = 130;     /* below this a bar cannot hold its own name */
  var PAD        = 20;

  /* An "eternal" is a god, not a person with a very long life. Apollo runs
     \u221210000 to \u22123000 \u2014 a 7,000-year bar that would cross any window with no
     ends and dominate it. The roster is not wrong; they are a different KIND
     of entry, and a timeline that treats one as a person is making a category
     error the register did not make. Kept off the person axis entirely. */
  var ETERNAL_YEARS = 1000;

  /* A death year at or beyond the current year means LIVING, not dead \u2014 200
     souls of 1,011 carry it. Drawing an end mark there would state something
     false about a fifth of the roster. Their bars run open. */
  var THIS_YEAR = new Date().getUTCFullYear();

  var souls = null, byKey = null, events = null, sky = null, mounted = null, anchorKey = null;

  /* ── the registers ────────────────────────────────────────────────────── */

  function get(url, asJson) {
    return fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(url.split('/').pop() + ' \u2014 ' + r.status);
        return asJson ? r.json() : r.text();
      });
  }

  function load() {
    if (souls && events) return Promise.resolve();
    return Promise.all([
      get(RAW + 'ROSTER-INDEX.json', true).then(function (d) {
        souls = (d.souls || []).filter(function (s) {
          return typeof s.b === 'number' && typeof s.d === 'number';
        });
        byKey = {};
        souls.forEach(function (s) {
          byKey[s.k] = s;
          (s.keys || []).forEach(function (k) { byKey[k] = s; });
        });
      }),
      /* EVENTS.csv is the anchors. If it cannot be read the timeline still
         draws people and says so \u2014 an axis with no ticks is a smaller loss
         than no timeline, and a silent one would be a lie. */
      get(RAW + 'EVENTS.csv', false).then(function (t) { events = parseEvents(t); },
                                          function ()  { events = null; }),
      /* SKY.csv: 1,342 due-east risings computed from DE422 at Giza. Its own
         register calls it primary and recomputable. Optional here for the same
         reason EVENTS.csv is — a missing sky row costs a line, not the view. */
      get(RAW + 'SKY.csv', false).then(function (t) { sky = parseSky(t); },
                                       function ()  { sky = null; })
    ]);
  }

  /* The same tolerant shape Page2's ingestCsvText uses: quotes stripped,
     commas honoured inside them, header skipped when cell one is not a number. */
  function parseEvents(text) {
    var out = [], lines = String(text).replace(/\r\n/g, '\n').split('\n');
    lines.forEach(function (line, n) {
      if (!line.trim()) return;
      var cells = [], cur = '', q = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { cells.push(cur); cur = ''; continue; }
        cur += c;
      }
      cells.push(cur);
      cells = cells.map(function (x) { return x.trim(); });
      var y = parseFloat(cells[0]);
      if (isNaN(y)) return;                       /* header, or a bad row */
      out.push({ y: y, name: cells[1] || '', cat: cells[2] || 'event' });
    });
    return out;
  }

  /* Columns: year, body, kind, description. Jupiter crosses every six years —
     a metronome, not a marker — so it is kept for the close zooms only, which
     is the tiering its own gloss asks for. */
  function parseSky(text) {
    var out = [];
    String(text).replace(/\r\n/g, '\n').split('\n').forEach(function (line) {
      if (!line.trim()) return;
      var c = line.split(',');
      var y = parseFloat(c[0]);
      if (isNaN(y)) return;
      out.push({ y: y, body: (c[1] || '').trim(), kind: (c[2] || '').trim() });
    });
    return out;
  }

  /* ── the frame ────────────────────────────────────────────────────────── */

  function mount() {
    if (mounted) return mounted;

    var css = document.createElement('style');
    css.textContent = [
      /* Hidden with the same shape #scene-hint uses, so it appears exactly
         when the reading leaves and by the same rule. */
      '#amenti-timeline{position:fixed;inset:0;z-index:3;opacity:0;visibility:hidden;',
      '  transition:opacity .45s ease .15s, visibility .45s;',
      '  font:400 12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#93a1b8}',
      'body.scene-bare #amenti-timeline{opacity:1;visibility:visible}',
      /* A scrim, not a plate behind every row. Outlined bars put their labels
         straight onto the photograph; over a dark sky that is fine, over a lit
         pyramid it is not. */
      '#amenti-timeline .tl-scrim{position:absolute;inset:0;background:rgba(6,7,14,.72);pointer-events:none}',
      /* ── THE SLIDER · added 2 Sep ──────────────────────────────────────
         The drag reads a century; nothing crossed a millennium. The roster
         runs from about 8000 BC to now, which at reading scale is tens of
         thousands of pixels of rail — a great deal of dragging to cross an
         empty age. The slider is for DISTANCE, the drag is for READING.
         LINEAR ON PURPOSE, THOUGH IT CROWDS THE MODERN ERA. Two thirds of the
         souls sit in the last five per cent of the track. That is not a flaw
         in the control, it is the shape of the roster, and the density marks
         under the track show it rather than hiding it behind a curve nobody
         could reason about. */
      '#amenti-timeline .tl-slider{position:absolute;left:0;right:0;top:0;height:26px;z-index:4;',
      '  display:flex;align-items:center;gap:14px;padding:0 ' + PAD + 'px;pointer-events:auto}',
      '#amenti-timeline .tl-slider input{flex:1;-webkit-appearance:none;appearance:none;',
      '  height:3px;background:transparent;cursor:pointer;margin:0}',
      '#amenti-timeline .tl-track{position:absolute;left:' + PAD + 'px;right:' + PAD + 'px;top:12px;',
      '  height:3px;pointer-events:none}',
      '#amenti-timeline .tl-slider input::-webkit-slider-runnable-track{height:3px;background:#232b3a;border-radius:2px}',
      '#amenti-timeline .tl-slider input::-moz-range-track{height:3px;background:#232b3a;border-radius:2px}',
      '#amenti-timeline .tl-slider input::-webkit-slider-thumb{-webkit-appearance:none;width:3px;height:15px;',
      '  background:#c9a227;border:0;border-radius:1px;margin-top:-6px}',
      '#amenti-timeline .tl-slider input::-moz-range-thumb{width:3px;height:15px;background:#c9a227;border:0;border-radius:1px}',
      '#amenti-timeline .tl-year{min-width:82px;text-align:right;color:#c9a227;letter-spacing:.06em}',
      '#amenti-timeline .tl-zoom{display:flex;gap:2px}',
      '#amenti-timeline .tl-zoom button{background:none;border:1px solid #232b3a;color:#5f6b80;',
      '  font:inherit;font-size:11px;letter-spacing:.06em;padding:2px 7px;cursor:pointer;border-radius:3px}',
      '#amenti-timeline .tl-zoom button:hover{color:#93a1b8;border-color:#3a4a63}',
      '#amenti-timeline .tl-zoom button.on{color:#c9a227;border-color:#7d6618}',
      /* SEEN LIVE, 2 Sep: the axis was cramped against the top and its type was
         too small to read at a glance. The rows carry the most information per
         pixel on the whole surface — they are worth the height. */
      '#amenti-timeline .tl-axis-svg text{font-size:13.5px}',
      '#amenti-timeline .tl-axis{position:absolute;left:0;right:0;top:26px;height:' + AXIS_H + 'px;',
      '  overflow:hidden;z-index:2;pointer-events:none}',
      /* The sky row is the only part of the axis that takes a pointer: drag it
         and time moves. The rest stays transparent to clicks so a click on the
         scene still brings the hall back. */
      '#amenti-timeline .tl-sky{position:absolute;left:0;right:0;top:26px;height:58px;',
      '  z-index:3;cursor:ew-resize;pointer-events:auto}',
      '#amenti-timeline .tl-rail{position:absolute;left:0;right:0;top:' + (AXIS_H + 34) + 'px;bottom:52px;',
      '  overflow:auto;cursor:grab;overscroll-behavior:contain;',
      '  scrollbar-width:thin;scrollbar-color:#2a3346 transparent}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar{width:7px;height:7px}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar-thumb{background:#2a3346;border-radius:4px}',
      '#amenti-timeline .tl-foot{position:absolute;left:0;right:0;bottom:26px;',
      '  display:flex;justify-content:space-between;padding:0 ' + PAD + 'px;',
      '  letter-spacing:.06em;color:#4f5a6d;pointer-events:none}',
      '#amenti-timeline .tl-back{pointer-events:auto;cursor:pointer;color:#c9a227;',
      '  background:none;border:0;font:inherit;letter-spacing:.06em;opacity:0;transition:opacity .3s}',
      '#amenti-timeline .tl-back.on{opacity:1}',
      '#amenti-timeline text{cursor:default}',
      '#amenti-timeline .room{cursor:pointer}'
    ].join('');
    document.head.appendChild(css);

    var root = document.createElement('div');
    root.id = 'amenti-timeline';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="tl-scrim"></div>' +
      '<div class="tl-slider"><svg class="tl-track"></svg>' +
      '<input type="range" min="0" max="1000" value="500" aria-label="move through time">' +
      '<span class="tl-year"></span>' +
      '<span class="tl-zoom">' + SPANS.map(function (n) {
        return '<button type="button" data-span="' + n + '"' +
               (n === SPAN_DEFAULT ? ' class="on"' : '') + '>' +
               (n >= 1000 ? (n / 1000) + 'k' : n) + 'y</button>';
      }).join('') + '</span></div>' +
      '<div class="tl-axis"><svg class="tl-axis-svg"></svg></div>' +
      '<div class="tl-sky" title="drag to move through time"></div>' +
      '<div class="tl-rail"><svg class="tl-rows"></svg></div>' +
      '<div class="tl-foot"><span class="tl-win"></span>' +
      '<button class="tl-back" type="button">\u2039 back to the figure</button>' +
      '<span class="tl-count"></span></div>';
    document.body.appendChild(root);

    var rail = root.querySelector('.tl-rail');
    var axis = root.querySelector('.tl-axis');

    /* The axis must not scroll away vertically \u2014 a reader three hundred rows
       down is looking at bars with no idea when. It is a separate layer and
       follows the rail HORIZONTALLY only. */
    /* SEEN LIVE, 2 Sep: the footer read 4026 bc while the axis above it still
       read ad 50 / ad 100 / ad 150. The axis is a separate layer and it was
       being moved TWO ways at once — scrollLeft on a div with overflow:hidden,
       which does nothing, and a transform on `firstChild`, which is fragile.
       One mechanism, on the element by name, and read back so a silent failure
       cannot happen twice. */
    rail.addEventListener('scroll', onScroll, { passive: true });

    var down = false, x0 = 0, y0 = 0, sx = 0, sy = 0;
    rail.addEventListener('pointerdown', function (e) {
      down = true; x0 = e.clientX; y0 = e.clientY; sx = rail.scrollLeft; sy = rail.scrollTop;
      rail.style.cursor = 'grabbing';
    });
    window.addEventListener('pointerup', function () { down = false; rail.style.cursor = 'grab'; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      rail.scrollLeft = sx - (e.clientX - x0);
      rail.scrollTop  = sy - (e.clientY - y0);
    });

    /* Two controls on one value, so each must not fight the other: the slider
       moves the rail, the rail moves the slider, and a flag stops the echo. */
    var slider = root.querySelector('input[type=range]');
    slider.addEventListener('input', function () {
      if (!state.rows.length) return;
      fromSlider = true;
      var span = state.max - state.min;
      var mid = state.min + (slider.value / 1000) * span;
      rail.scrollLeft = (mid - state.min) * PX_PER_YR - rail.clientWidth / 2;
      fromSlider = false;
      onScroll();
    });
    slider.addEventListener('click', function (e) { e.stopPropagation(); });

    /* Arrow keys move a century, which is half a window — enough to feel like
       a step and not so much that a reader loses their place. */
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      rail.scrollLeft += (e.key === 'ArrowRight' ? 1 : -1) * (SPAN / 2) * PX_PER_YR;
    });

    /* A mouse wheel can only move PEOPLE. Shift is the long-standing
       convention for the other axis, and without it a reader on a mouse has
       no way through time but to drag. */
    rail.addEventListener('wheel', function (e) {
      if (!e.shiftKey) return;
      e.preventDefault();
      rail.scrollLeft += e.deltaY || e.deltaX;
    }, { passive: false });

    /* A zoom must not lose the reader's place. Hold the CENTRE YEAR across the
       change and re-centre on it afterwards, so the years under the eye stay
       under the eye and only the reach changes. */
    /* DRAG THE SKY TO MOVE TIME. The planets are the handle — a reader pulls
       the sky across and the centuries follow, which is a truer gesture than a
       scrollbar and puts the computed register to work rather than leaving it
       as decoration. */
    var skyEl = root.querySelector('.tl-sky');
    var sdown = false, sx0 = 0, ss0 = 0;
    skyEl.addEventListener('pointerdown', function (e) {
      sdown = true; sx0 = e.clientX; ss0 = rail.scrollLeft;
      e.stopPropagation(); e.preventDefault();
      skyEl.setPointerCapture && skyEl.setPointerCapture(e.pointerId);
    });
    skyEl.addEventListener('pointermove', function (e) {
      if (!sdown) return;
      rail.scrollLeft = ss0 - (e.clientX - sx0);
      /* Called, not relied upon. Setting scrollLeft fires a scroll event in a
         browser and the readout would follow — but that assumption is exactly
         what left the axis stranded at ad 50 while the footer read 4026 bc.
         Anything that moves the rail says so. */
      onScroll();
    });
    skyEl.addEventListener('pointerup', function (e) { sdown = false; e.stopPropagation(); });
    skyEl.addEventListener('click', function (e) { e.stopPropagation(); });

    root.querySelector('.tl-zoom').addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest && e.target.closest('button[data-span]');
      if (!b || !state.rows.length) return;
      var mid = state.min + (rail.scrollLeft + rail.clientWidth / 2) / PX_PER_YR;
      SPAN = Number(b.getAttribute('data-span'));
      root.querySelectorAll('.tl-zoom button').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      redraw();
      rail.scrollLeft = (mid - state.min) * PX_PER_YR - rail.clientWidth / 2;
      onScroll();
    });

    root.querySelector('.tl-back').addEventListener('click', function (e) {
      e.stopPropagation();               /* do not toggle scene-bare */
      if (anchorKey) centreOn(anchorKey);
    });

    mounted = root;
    return root;
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */

  var state = { rows: [], min: 0, max: 0, centre: 0 };
  var fromSlider = false;

  function yearLabel(y) {
    y = Math.round(y);
    return y < 0 ? Math.abs(y) + ' bc' : (y === 0 ? '1 bc' : 'ad ' + y);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function draw(anchor) {
    var root = mount();
    scale(root.querySelector('.tl-rail'));
    var eternal = function (s) { return (s.d - s.b) >= ETERNAL_YEARS; };

    /* Everyone but the gods, ordered by DEATH \u2014 the ship's convention, with
       Page2's own fallback to birth for a soul that somehow has no death. */
    var rows = souls.filter(function (s) { return !eternal(s); })
                    .sort(function (a, b) {
                      var A = typeof a.d === 'number' ? a.d : a.b;
                      var B = typeof b.d === 'number' ? b.d : b.b;
                      return A - B || a.b - b.b;
                    });

    state.rows = rows;
    state.min = rows.length ? Math.min.apply(null, rows.map(function (s) { return s.b; })) : -1000;
    state.max = rows.length ? Math.max.apply(null, rows.map(function (s) { return s.d; })) : THIS_YEAR;

    var W = (state.max - state.min) * PX_PER_YR;
    var H = rows.length * ROW_H + 40;
    var X = function (y) { return (y - state.min) * PX_PER_YR; };

    /* rows */
    var svg = root.querySelector('.tl-rows');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    var p = [];
    rows.forEach(function (s, i) {
      var y = 12 + i * ROW_H;
      var x = X(s.b), w = Math.max(4, (s.d - s.b) * PX_PER_YR);
      var living = s.d >= THIS_YEAR;
      var isAnchor = anchor && (s.k === anchor.k);
      var stroke = isAnchor ? '#c9a227' : (s.r ? '#4a8f9e' : '#5a6a82');
      var sw     = isAnchor ? 1.5 : (s.r ? 1.25 : 0.75);
      var fill   = isAnchor ? '#c9a227' : (s.r ? '#5fb3c4' : '#93a1b8');

      p.push('<g class="' + (s.r ? 'room' : '') + '"' +
             (s.r ? ' data-key="' + esc(s.k) + '"' : '') + '>');
      p.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + BAR_H +
             '" rx="4" fill="none" stroke="' + stroke + '" stroke-width="' + sw +
             (living ? '" stroke-dasharray="1 0 1 0' : '') + '"/>');
      /* A living soul's bar has no closing edge \u2014 it has not ended. */
      if (living) p.push('<rect x="' + (x + w - 2) + '" y="' + (y - 1) + '" width="4" height="' +
                         (BAR_H + 2) + '" fill="rgba(6,7,14,.85)"/>');

      /* SEEN LIVE, 2 Sep: "Marcus Tullius Cicer106--43". The name and the dates
         were both drawn whenever the bar cleared LABEL_MIN + 90, without asking
         whether THIS name fits. Measure the name. */
      var name = esc(s.n);
      /* MEASURE THE NAME, DO NOT GUESS A CONSTANT. LABEL_MIN was a flat 130px
         and names are not flat: "James son of Zebedee" needs about 160, so it
         went inside a 135px bar and hung out of the end. Four labels escaped
         their own bar across four scroll positions before this. */
      var nameW = 24 + name.length * 7.4;
      if (w >= nameW) {
        /* ── THE NAME STICKS TO THE VISIBLE EDGE · 2 Sep ────────────────────
           Seen live: two bars showed their dates and NO NAME — "−90—20" and
           "−100—50", which are Saint Joseph and Cuchulainn. The name was drawn
           at the bar's left edge, so a bar that begins off-screen took its own
           label away with it, while the right-anchored dates survived. A long
           life is exactly the case most likely to start off-screen, so the
           figures who span the most window were the ones losing their names.

           The label is now given a class and its x is nudged on scroll to stay
           inside the viewport, never past the bar's own right edge. */
        p.push('<text class="nm" data-x0="' + x + '" data-x1="' + (x + w) + '" x="' +
               (x + 12) + '" y="' + (y + 17) + '" fill="' + fill + '">' + name + '</text>');
        if (w >= nameW + 78)
          p.push('<text x="' + (x + w - 12) + '" y="' + (y + 17) + '" text-anchor="end" fill="' +
                 (isAnchor ? '#e0b93f' : '#9fb0c8') + '">' +
                 s.b + '\u2014' + (living ? '' : s.d) + '</text>');
      } else {
        /* Below LABEL_MIN the bar cannot hold its own name. Outside, at a
           consistent distance, so the mixed treatment still reads as one rule. */
        p.push('<text x="' + (x + w + 10) + '" y="' + (y + 17) + '" fill="' + fill + '">' + name + '</text>');
      }
      p.push('</g>');
    });
    svg.innerHTML = p.join('');

    svg.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('.room');
      if (!g) return;
      e.stopPropagation();
      var k = g.getAttribute('data-key');
      if (window.Amenti && typeof window.Amenti.openReadingRoom === 'function') {
        try { window.Amenti.openReadingRoom(k); return; } catch (err) {}
      }
      window.location.href = 'Page1.html#terminal/' + k;
    });

    /* axis: the years, and the events as ticks. Events are a MOMENT, not a
       span, so they live on the axis and never among the rows \u2014 in a row they
       would read as very short lives. */
    var a = [], step = 50;
    for (var yr = Math.ceil(state.min / step) * step; yr <= state.max; yr += step) {
      a.push('<line x1="' + X(yr) + '" y1="' + (AXIS_H - 12) + '" x2="' + X(yr) + '" y2="' + AXIS_H + '" stroke="#2a3346" stroke-width="0.5"/>');
      a.push('<text x="' + X(yr) + '" y="' + (AXIS_H - 16) + '" text-anchor="middle" fill="#8f9db4">' + yearLabel(yr) + '</text>');
    }
    /* SEEN LIVE, 2 Sep: fourteen events in one window, every label centred on
       its own tick, all piled into an unreadable band of gold. THE TICK IS
       CHEAP AND THE LABEL IS NOT — draw every tick, because the mark is the
       fact, and drop a label that would collide with the last one placed.
       A reader who wants the name of a crowded tick can zoom; a reader looking
       at porridge learns nothing. */
    /* ── ROW 0 · THE SKY, AND THE HANDLE FOR TIME ───────────────────────
       Jupiter is dropped above 400 years of window: at one crossing every six
       it becomes a picket fence and tells a reader nothing. The slow bodies
       are the markers — Neptune twice a century, Uranus four times. */
    if (sky) {
      var wide = SPAN > 400, skyReach = -1e9;
      sky.forEach(function (sk) {
        if (sk.y < state.min || sk.y > state.max) return;
        if (wide && sk.body === 'Jupiter') return;
        var sx = X(sk.y);
        /* SEEN LIVE: the marks were there and invisible — 5 to 11px of hairline
           at the very top of the frame. They are the only computed register on
           this surface and they were reading as dust. Taller, brighter, thicker
           by rarity, and the two rare ones carry their name. */
        var col = sk.body === 'Neptune' ? '#a79fff'
                : sk.body === 'Uranus'  ? '#7fe3c0'
                : sk.body === 'Saturn'  ? '#f5b445' : '#7d8798';
        var h  = sk.body === 'Neptune' ? 26 : sk.body === 'Uranus' ? 20 : sk.body === 'Saturn' ? 13 : 8;
        var sw = sk.body === 'Neptune' ? 2 : sk.body === 'Uranus' ? 1.75 : sk.body === 'Saturn' ? 1.4 : 1;
        a.push('<line x1="' + sx + '" y1="' + (SKY_Y + 30 - h) + '" x2="' + sx + '" y2="' +
               (SKY_Y + 30) + '" stroke="' + col + '" stroke-width="' + sw + '"><title>' +
               esc(sk.body) + ' rises due east over Giza, ' + yearLabel(sk.y) + '</title></line>');
        /* Neptune twice a century and Uranus four times — rare enough to name
           without the row becoming a wall. Saturn and Jupiter stay as marks. */
        if ((sk.body === 'Neptune' || sk.body === 'Uranus') && SPAN <= 800 && sx > skyReach) {
          skyReach = sx + 10 + sk.body.length * 8;
          a.push('<text x="' + (sx + 4) + '" y="' + (SKY_Y + 8) + '" fill="' + col +
                 '" font-size="11">' + sk.body + '</text>');
        }
      });
    }

    /* ── ROWS 1–2 · THE EVENTS, STAGGERED ──────────────────────────────
       Alternate rows and keep a reach per row, so a label only has to clear
       the last one ON ITS OWN LINE. Twice the room, and a wrong glyph estimate
       costs a near-miss instead of a collision. */
    if (events) {
      var reach = [-1e9, -1e9], turn = 0;
      events.slice().sort(function (p, q) { return p.y - q.y; }).forEach(function (ev) {
        if (ev.y < state.min || ev.y > state.max) return;
        var x = X(ev.y);
        a.push('<line x1="' + x + '" y1="' + (EV_Y[1] + 6) + '" x2="' + x + '" y2="' +
               (EV_Y[1] + 14) + '" stroke="#c9a227" stroke-width="0.75" opacity=".7"/>');
        var row = reach[0] <= x ? 0 : (reach[1] <= x ? 1 : -1);
        if (row === -1) return;
        var nm = esc(ev.name);
        /* 9.2 px a character at 13.5px monospace, which is MORE than the glyph
           actually measures. Deliberately over: an estimate that is too small
           produces a collision, one that is too large produces a gap, and a gap
           is not a fault. Tested to hold at 8.5px/char before this. */
        reach[row] = x + 16 + nm.length * 9.2;
        a.push('<text x="' + x + '" y="' + EV_Y[row] + '" text-anchor="start" fill="#c9a227">' + nm + '</text>');
      });
    }

    var asvg = root.querySelector('.tl-axis-svg');
    asvg.setAttribute('width', W); asvg.setAttribute('height', AXIS_H);
    asvg.innerHTML = a.join('');

    /* Density under the slider: how many souls are alive across each
       thousandth of the track. It shows a reader where the roster actually is
       before they drag into four empty millennia. */
    var buckets = new Array(120).fill(0), spanY = state.max - state.min;
    rows.forEach(function (r) {
      var i0 = Math.floor((r.b - state.min) / spanY * 120);
      var i1 = Math.floor((r.d - state.min) / spanY * 120);
      for (var i = Math.max(0, i0); i <= Math.min(119, i1); i++) buckets[i]++;
    });
    var peak = Math.max.apply(null, buckets) || 1, d = [];
    buckets.forEach(function (n, i) {
      if (!n) return;
      var h = Math.max(1, Math.round(n / peak * 9));
      d.push('<rect x="' + (i / 120 * 100) + '%" y="' + (11 - h) + '" width="0.7%" height="' +
             h + '" fill="#3a4a63"/>');
    });
    var trk = root.querySelector('.tl-track');
    trk.setAttribute('height', 14); trk.setAttribute('preserveAspectRatio', 'none');
    trk.innerHTML = d.join('');
  }

  /* Redraw at the current SPAN. Everything is derived, so this is scale() and
     draw() again — there is no second code path for a zoomed view, which is
     the reason a zoom was cheap to add and is cheap to trust. */
  var lastAnchor = null;
  function redraw() {
    if (!mounted) return;
    scale(mounted.querySelector('.tl-rail'));
    draw(lastAnchor);
  }

  function centreOn(key) {
    var s = byKey[key];
    if (!s || !mounted) return;
    var mid  = s.b + (s.d - s.b) / 2;
    var rail = mounted.querySelector('.tl-rail');
    var vw   = rail.clientWidth || (SPAN * PX_PER_YR);
    rail.scrollLeft = (mid - state.min) * PX_PER_YR - vw / 2;
    var i = state.rows.indexOf(s);
    if (i > -1) rail.scrollTop = Math.max(0, 12 + i * ROW_H - rail.clientHeight / 2);
    state.centre = mid;
    onScroll();
  }

  function onScroll() {
    if (!mounted) return;
    var rail = mounted.querySelector('.tl-rail');

    /* THE AXIS MOVES HERE, NOT IN THE LISTENER. It used to be set inside the
       scroll handler alone, so centreOn() — which sets scrollLeft directly and
       then calls this — left the axis wherever it had been. Live on 2 Sep the
       footer read 4026 bc while the years above it still read ad 50. One place
       that moves it, called from everywhere that moves the rail. */
    var asvg = mounted.querySelector('.tl-axis-svg');
    if (asvg) asvg.style.transform = 'translateX(' + (-rail.scrollLeft) + 'px)';

    /* Hold every name inside the viewport. A bar wider than the window would
       otherwise be a nameless rectangle for as long as the reader looks at it.
       Clamped to the bar's own right edge less the label's width, so a name
       never floats past the life it belongs to. */
    var left = rail.scrollLeft + 14;
    mounted.querySelectorAll('.tl-rows text.nm').forEach(function (t) {
      var x0 = +t.getAttribute('data-x0'), x1 = +t.getAttribute('data-x1');
      var w  = 12 + (t.textContent || '').length * 7.4;
      var at = Math.max(x0 + 12, Math.min(left, x1 - w));
      t.setAttribute('x', at);
    });

    var vw   = rail.clientWidth || (SPAN * PX_PER_YR);
    var from = state.min + rail.scrollLeft / PX_PER_YR;
    var to   = from + vw / PX_PER_YR;

    var alive = state.rows.filter(function (s) { return s.b <= to && s.d >= from; }).length;
    var evs   = events ? events.filter(function (e) { return e.y >= from && e.y <= to; }).length : 0;

    mounted.querySelector('.tl-win').textContent =
      yearLabel(from) + ' \u2014 ' + yearLabel(to) + ' \u00b7 ' + Math.round(to - from) + ' years';
    /* The slider follows the rail unless the rail is following the slider. */
    if (!fromSlider) {
      var sl = mounted.querySelector('input[type=range]');
      var span = state.max - state.min;
      if (sl && span > 0) sl.value = Math.round(((from + to) / 2 - state.min) / span * 1000);
    }
    mounted.querySelector('.tl-year').textContent = yearLabel((from + to) / 2);

    mounted.querySelector('.tl-count').textContent =
      alive + ' alive here \u00b7 ' + (events ? evs + ' events' : 'events could not be read');

    /* The anchor can be scrolled away from. Say so, and offer the way back \u2014
       a view you can get lost in with no return is a trap, which is the same
       reason #scene-hint exists. */
    var back = mounted.querySelector('.tl-back');
    var a = anchorKey && byKey[anchorKey];
    var away = a && (a.d < from || a.b > to);
    back.classList.toggle('on', !!away);
  }

  /* ── the public surface ───────────────────────────────────────────────── */

  window.AmentiTimeline = {
    /* Called with whatever the answer opened. The FIRST key wins: the router
       ranks by relevance, so room one is the question's subject and the rest
       are supporting. Rooms in other centuries fall off-screen, which is
       honest \u2014 the answer's own coverage line states which were opened. */
    place: function (keys) {
      var list = [].concat(keys || []).filter(Boolean);
      return load().then(function () {
        var anchor = null;
        for (var i = 0; i < list.length && !anchor; i++) {
          var cand = byKey[list[i]];
          /* FOUND BY ATTACK. place('apollo') used to return TRUE and centre on
             −6500, where nothing lives — an empty screen the caller believed
             had worked. The gods are deliberately off the person axis, so there
             is no position to show. Skip them and try the next key; if none of
             the keys is placeable, say so rather than drawing emptiness. */
          if (cand && (cand.d - cand.b) < ETERNAL_YEARS) anchor = cand;
        }
        if (!anchor) return false;      /* nothing placeable: draw nothing */
        anchorKey = anchor.k;
        lastAnchor = anchor;
        /* Every answer arrives at the default. A reader who zoomed on the last
           question does not inherit that scale on the next one. */
        SPAN = SPAN_DEFAULT;
        if (mounted) mounted.querySelectorAll('.tl-zoom button').forEach(function (x) {
          x.classList.toggle('on', Number(x.getAttribute('data-span')) === SPAN_DEFAULT);
        });
        draw(anchor);
        centreOn(anchor.k);
        return true;
      }, function () { return false; });
    },
    clear: function () { if (mounted) mounted.remove(); mounted = null; anchorKey = null; },
    _souls: function () { return souls; }
  };
})();
