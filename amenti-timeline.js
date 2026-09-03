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
      out.push({ y: y, name: cells[1] || '', cat: (cells[2] || 'event'), desc: (cells[3] || '') });
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
      out.push({ y: y, body: (c[1] || '').trim(), kind: (c[2] || '').trim(), desc: (c[3] || '').trim(), description: (c[3]||'').trim() });
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
      /* SEEN LIVE, 2 Sep: 12px ui-monospace at #93a1b8 read thin and dim on
         black. Not the typeface — the size and the contrast. Up to 13.5px and
         a brighter body colour. */
      '  font:400 13.5px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#b8c4d8}',
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
      '#amenti-timeline .tl-axis-svg text{font-size:15px}',
      '#amenti-timeline .tl-axis{position:absolute;left:0;right:0;top:26px;height:' + AXIS_H + 'px;',
      '  overflow:hidden;z-index:2;pointer-events:none}',
      /* the event hit-targets need clicks even though the axis is otherwise
         click-through, so they re-enable pointer events on themselves. */
      '#amenti-timeline .evhit{pointer-events:auto}',
      /* The sky row is the only part of the axis that takes a pointer: drag it
         and time moves. The rest stays transparent to clicks so a click on the
         scene still brings the hall back. */
      '#amenti-timeline .tl-sky{position:absolute;left:0;right:0;top:26px;height:58px;',
      '  z-index:3;cursor:ew-resize;pointer-events:auto}',
      /* SEEN LIVE 2 Sep: the legend sat top-right on top of the zoom buttons. It belongs in the sky row at the LEFT, clear of the controls. */
      '#amenti-timeline .tl-legend{position:absolute;left:' + PAD + 'px;top:6px;z-index:5;',
      '  font-size:10.5px;letter-spacing:.06em;pointer-events:none;display:flex;gap:13px;background:rgba(9,11,18,.7);padding:2px 8px;border-radius:4px}',
      '#amenti-timeline .tl-rail{position:absolute;left:0;right:0;top:' + (AXIS_H + 34) + 'px;bottom:78px;',
      '  overflow:auto;cursor:grab;overscroll-behavior:contain;',
      '  scrollbar-width:thin;scrollbar-color:#2a3346 transparent}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar{width:7px;height:7px}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar-thumb{background:#2a3346;border-radius:4px}',
      /* SEEN LIVE: "back to the figure" printed on top of the hall's own
         "click anywhere to bring the hall back", which sits at bottom:26px and
         belongs to hall.html. Two owners, one line. This one moves up. */
      /* ── THE SCENE · 2 Sep ────────────────────────────────────────────
         Hover a bar and the empty space beneath the rows fills with that
         figure's world: every event during their life, the sky over Giza in
         their years, and who was alive beside them. The captain's version of
         an idea I had smaller — I proposed highlighting the axis, which only
         reaches the THINNED events. This reaches all of them, laid out with
         room to read, and makes the empty space honest: it is empty because
         the era is sparse, and it fills only when you ask about someone.
         The anchor figure's scene shows without hovering; leave a hover and it
         returns. Click pins. */
      /* ── THE SCENE IS A PANEL, NOT A LAYER · 2 Sep ────────────────────
         First version filled "the empty space beneath the rows" — but empty
         was only true for a sparse era. Hover a crowded century and the bars
         fill the screen, so the scene painted straight over Hadrian, Ptolemy,
         Antoninus: two layers, one canvas, unreadable.

         So it docks to the right as an OPAQUE panel above everything, and the
         timeline dims behind it. The scene never shares space with a bar
         again. Its own three sections stack and scroll inside it rather than
         spreading across the width. */
      /* Docked hard to the right edge and collapsible. Wider room for the
         names, and a tab to fold it away when the reader wants the bars clear.
         Slides out rather than vanishing, so the tab stays reachable. */
      '#amenti-timeline .tl-scene{position:absolute;top:' + (AXIS_H + 40) + 'px;right:0;',
      '  width:min(380px,42vw);max-height:calc(100% - ' + (AXIS_H + 120) + 'px);overflow-y:auto;',
      '  z-index:6;pointer-events:auto;background:rgba(9,11,18,.96);',
      '  border:1px solid #232b3a;border-right:none;border-radius:10px 0 0 10px;',
      '  padding:16px 20px 16px 18px;font-size:13px;line-height:1.5;color:#9fb0c8;',
      '  transition:transform .28s cubic-bezier(.3,.7,.3,1),opacity .2s;',
      '  font-size:13.5px;color:#b8c4d8;box-shadow:0 8px 40px rgba(0,0,0,.5)}',
      '#amenti-timeline .tl-scene:empty{opacity:0;pointer-events:none}',
      /* SEEN LIVE, 2 Sep: the fold tab lived INSIDE the scrolling panel, so it
         drifted with the content and could not be found. It is now a sibling of
         the frame, fixed to the right edge, always in the same place. When
         folded, the panel slides fully off the right; the tab stays put. */
      '#amenti-timeline.scene-folded .tl-scene{transform:translateX(105%)}',
      '#amenti-timeline .tl-fold{position:absolute;top:' + (AXIS_H + 60) + 'px;right:0;',
      '  width:24px;height:70px;z-index:7;background:rgba(9,11,18,.96);',
      '  border:1px solid #232b3a;border-right:none;border-radius:8px 0 0 8px;',
      '  cursor:pointer;color:#8f9db4;display:none;align-items:center;justify-content:center;',
      '  font-size:15px;pointer-events:auto}',
      '#amenti-timeline .tl-fold.show{display:flex}',
      /* SEEN LIVE, 2 Sep: the event ticks relied on a hover <title> that never
         appeared on a click and barely on a hover. A click now names the event
         in a readout pinned just under the axis \u2014 reliable, and it does not
         depend on a browser tooltip firing. */
      '#amenti-timeline .tl-evread{position:absolute;top:' + (AXIS_H + 8) + 'px;left:' + PAD + 'px;',
      '  right:' + PAD + 'px;z-index:5;font-size:13px;color:#c9a227;opacity:0;',
      '  transition:opacity .2s;pointer-events:none;text-align:center}',
      '#amenti-timeline .tl-evread.show{opacity:1}',
      '#amenti-timeline .tl-fold:hover{color:#c9a227}',
      '#amenti-timeline .tl-scene h4{margin:14px 0 6px;font:inherit;font-size:10.5px;letter-spacing:.14em;',
      '  text-transform:uppercase;color:#5f6b80}',
      '#amenti-timeline .tl-scene h4:first-of-type{margin-top:2px}',
      '#amenti-timeline .tl-scene .who{margin:0 0 4px;font-size:15px;color:#e9e5da;line-height:1.35}',
      '#amenti-timeline .tl-scene .who b{color:#c9a227;font-weight:500}',
      '#amenti-timeline .tl-scene .sub{margin:0;font-size:11.5px;color:#5f6b80}',
      '#amenti-timeline .tl-scene ol{list-style:none;margin:0;padding:0}',
      '#amenti-timeline .tl-scene li{display:flex;gap:10px;padding:1px 0}',
      '#amenti-timeline .tl-scene li i{font-style:normal;color:#8f9db4;min-width:52px;text-align:right;flex:none}',
      '#amenti-timeline .tl-scene li.ev i{color:#c9a227}',
      '#amenti-timeline .tl-scene li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#amenti-timeline .tl-scene li.ev span{white-space:normal;line-height:1.4}',
      '#amenti-timeline .tl-scene li.ev{align-items:baseline;margin-bottom:3px}',
      '#amenti-timeline .tl-scene .more{color:#5f6b80;font-size:11px;margin-top:3px}',
      '#amenti-timeline .tl-scene .pin{float:right;font-size:10px;letter-spacing:.1em;color:#5f6b80}',
      '#amenti-timeline .tl-rows g.dim{opacity:.32}',
      '#amenti-timeline .tl-rows g.lit rect{stroke-width:1.8}',
      /* ── THE CONNECTION STATE · 2 Sep ─────────────────────────────────────
         A SEPARATE, STRONGER state than hover-dim. Click anything and it
         broadcasts a SPAN; everything overlapping the span is CONNECTED (kept
         bright, gold-edged), everything else is MUTED harder than a hover. The
         focused element itself gets a solid gold ring. Distinct from hover so
         the two never muddy. */
      '#amenti-timeline.sel .tl-rows g:not(.conn){opacity:.14}',
      '#amenti-timeline.sel .tl-rows g.conn{opacity:1}',
      '#amenti-timeline.sel .tl-rows g.conn rect{stroke:#c9a227}',
      '#amenti-timeline.sel .tl-rows g.focus rect{stroke:#f0d060;stroke-width:2.2}',
      '#amenti-timeline .tl-axis-svg .evdim{opacity:.18}',
      '#amenti-timeline .tl-axis-svg .evlit{opacity:1}',
      '#amenti-timeline .tl-scene li.pick{background:rgba(201,162,39,.14);border-radius:4px}',
      '#amenti-timeline .tl-scene li.clk{cursor:pointer;border-radius:4px}',
      '#amenti-timeline .tl-scene li.clk:hover{background:rgba(127,180,240,.10)}',
      '#amenti-timeline .tl-foot{position:absolute;left:0;right:0;bottom:52px;',
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
      /* Four characters and their names, once, at the edge. The row is
         readable without it; this only removes the moment of asking. */
      '<div class="tl-legend">' +
        '<span style="color:#8b9bff">\u2646 neptune</span>' +
        '<span style="color:#7fdce8">\u2645 uranus</span>' +
        '<span style="color:#ecd493">\u2644 saturn</span>' +
        '<span style="color:#cf9b63">\u2643 jupiter</span>' +
      '</div>' +
      '<div class="tl-rail"><svg class="tl-rows"></svg></div>' +
      '<div class="tl-scene"></div>' +
      '<div class="tl-fold" title="fold the scene">\u203a</div>' +
      '<div class="tl-evread"></div>' +
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

    /* ── THE WHEEL IS A LENS · 2 Sep ──────────────────────────────────────
       The zoom buttons were discrete stops; Page1's quantum zoom feels
       continuous \u2014 you push into a point and pull back out. So a plain wheel
       now ZOOMS, smoothly, around the YEAR UNDER THE CURSOR, and the four
       buttons remain as presets. Shift-wheel still moves people vertically.
       SPAN is clamped to the button range so a reader cannot zoom into a
       single year or out past the roster. */
    rail.addEventListener('wheel', function (e) {
      if (e.shiftKey) { e.preventDefault(); rail.scrollTop += e.deltaY; return; }
      e.preventDefault();
      var rect = rail.getBoundingClientRect();
      var atX = (e.clientX - rect.left);
      var yearAt = state.min + (rail.scrollLeft + atX) / PX_PER_YR;   /* hold this year fixed */
      var factor = Math.exp((e.deltaY || 0) * 0.0012);               /* smooth, multiplicative */
      var next = Math.max(SPANS[0], Math.min(SPANS[SPANS.length - 1], SPAN * factor));
      if (next === SPAN) return;
      SPAN = next;
      /* light up whichever preset the free zoom is nearest, if any */
      root.querySelectorAll('.tl-zoom button').forEach(function (bt) {
        bt.classList.toggle('on', Number(bt.getAttribute('data-span')) === Math.round(SPAN));
      });
      redraw();
      rail.scrollLeft = (yearAt - state.min) * PX_PER_YR - atX;      /* keep it under the cursor */
      onScroll();
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

    /* Click a tick (or its wide hit-target) to name the event in the readout.
       Delegated on the axis so it survives every redraw. */
    var axisEl = root.querySelector('.tl-axis');
    var evread = root.querySelector('.tl-evread');
    if (axisEl && evread) axisEl.addEventListener('click', function (e) {
      var hit = e.target.closest && e.target.closest('.evhit');
      if (!hit) return;
      e.stopPropagation();
      evread.textContent = hit.getAttribute('data-label');
      evread.classList.add('show');
      clearTimeout(evread._t);
      evread._t = setTimeout(function () { evread.classList.remove('show'); }, 4000);
    });

    /* ── THE CONNECTION GESTURE · 2 Sep ───────────────────────────────────
       Click anything in the panel and it broadcasts its span to the whole
       timeline. A person lights everyone whose life overlapped theirs; an event
       lights who was alive when it happened; a sky rising lights the generation
       that saw it. The clicked row is marked, and clicking it again clears. */
    var sceneBox = root.querySelector('.tl-scene');
    if (sceneBox) sceneBox.addEventListener('click', function (e) {
      var liEl = e.target.closest && e.target.closest('li.clk');
      if (!liEl) return;
      e.stopPropagation();
      if (liEl.classList.contains('pick')) {           /* second click clears */
        liEl.classList.remove('pick'); clearSelection(); return;
      }
      sceneBox.querySelectorAll('li.pick').forEach(function (x){ x.classList.remove('pick'); });
      liEl.classList.add('pick');
      var from = +liEl.getAttribute('data-from'), to = +liEl.getAttribute('data-to');
      var key = liEl.getAttribute('data-k') || null;
      highlight(from, to, key);
    });

    /* Click a great-conjunction ring on the axis and light the generation that
       lived under it \u2014 the ring is an instant, so it broadcasts a WINDOW, not
       a year, or it would light nothing. */
    var axisEl2 = root.querySelector('.tl-axis');
    if (axisEl2) axisEl2.addEventListener('click', function (e) {
      var ring = e.target.closest && e.target.closest('circle');
      if (!ring) return;
      var t = ring.querySelector('title'); if (!t) return;
      var mt = t.textContent.match(/,\s*([\d]+)\s*(bc|ad)?\s*$/i);
      if (!mt) return;
      var yr = parseInt(mt[1],10) * (/bc/i.test(mt[2]||'')?-1:1);
      e.stopPropagation();
      highlight(yr-15, yr+15, null);   /* the generation on either side */
    });

    /* A click on the bare scene (image) clears any selection along with
       bringing the hall back \u2014 handled by hall.html; we just drop ours. */
    root.addEventListener('click', function (e) {
      if (e.target.closest && (e.target.closest('.tl-scene') || e.target.closest('.tl-axis') ||
          e.target.closest('.tl-rows') || e.target.closest('.tl-slider') || e.target.closest('.tl-fold'))) return;
      clearSelection();
    });

    var foldTab = root.querySelector('.tl-fold');
    if (foldTab) foldTab.addEventListener('click', function (e) {
      e.stopPropagation();
      var f = root.classList.toggle('scene-folded');
      foldTab.textContent = f ? '\u2039' : '\u203a';
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

    /* ── CENTURY BANDS · 2 Sep ────────────────────────────────────────────
       A fretboard for time: a faint darker wash on every other 100-year span,
       so the eye reads distance without measuring the year labels. Bands, not
       bars \u2014 a full-height line every century would fight the lifespan bars
       for the same visual channel; a shade sits behind them and only whispers.
       The unit scales with the window so it never becomes a grid: a century at
       close zoom, half a millennium at the widest. Drawn first, so everything
       else lands on top. */
    var unit = SPAN <= 300 ? 100 : SPAN <= 1200 ? 500 : 1000;
    var b0 = Math.floor(state.min / unit) * unit;
    for (var by = b0; by < state.max; by += unit) {
      if (Math.round(by / unit) % 2 !== 0) continue;
      p.push('<rect x="' + X(by) + '" y="0" width="' + (unit * PX_PER_YR) +
             '" height="' + H + '" fill="#ffffff" opacity="0.022"/>');
    }
    rows.forEach(function (s, i) {
      var y = 12 + i * ROW_H;
      var x = X(s.b), w = Math.max(4, (s.d - s.b) * PX_PER_YR);
      var living = s.d >= THIS_YEAR;
      var isAnchor = anchor && (s.k === anchor.k);
      var stroke = isAnchor ? '#c9a227' : (s.r ? '#4a8f9e' : '#5a6a82');
      var sw     = isAnchor ? 1.5 : (s.r ? 1.25 : 0.75);
      var fill   = isAnchor ? '#c9a227' : (s.r ? '#5fb3c4' : '#93a1b8');

      p.push('<g class="' + (s.r ? 'room' : '') + '" data-k="' + esc(s.k) + '"' +
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
        /* SEEN LIVE, 2 Sep: Polybius showed a name and no dates, because his
           bar runs off the RIGHT edge and the dates are anchored there. The
           mirror of the name problem, fixed the same way — given a class and
           nudged into view on scroll, never left of the name. */
        if (w >= nameW + 78)
          p.push('<text class="dt" data-x0="' + x + '" data-x1="' + (x + w) + '" x="' +
                 (x + w - 12) + '" y="' + (y + 17) + '" text-anchor="end" fill="' +
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

    svg.addEventListener('pointerover', function (e) {
      var g = e.target.closest && e.target.closest('g[data-k]');
      if (!g || pinned) return;
      var r = byKey[g.getAttribute('data-k')];
      if (r) scene(r);
    });
    svg.addEventListener('pointerleave', function () {
      if (!pinned) scene(anchorKey ? byKey[anchorKey] : null);
    });

    svg.addEventListener('click', function (e) {
      /* Click on a roster-only bar PINS its scene; click again unpins and the
         anchor's scene returns. A room still opens its reading room. */
      var any = e.target.closest && e.target.closest('g[data-k]');
      var g = e.target.closest && e.target.closest('.room');
      if (any && !g) {
        e.stopPropagation();
        var r = byKey[any.getAttribute('data-k')];
        if (pinned === r) { pinned = null; scene(anchorKey ? byKey[anchorKey] : null); clearSelection(); }
        else { pinned = r; scene(r); if (r) highlight(r.b, r.d, r.k); }
        return;
      }
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
    /* ── THE CENTURY IS THE DOWNBEAT · 2 Sep ──────────────────────────────
       The rings are the ~20-year tick; the century is where the count lands \u2014
       2,4,6,8,10 and you have walked 200 years. So the 100-year line is the
       ACCENT: a brighter, full-height rule the eye rests on, distinct from the
       ordinary 50-year ticks. The reader rides the rings and lands on the
       centuries. The accent unit widens with zoom so it never becomes a fence. */
    var a = [];
    var beat = SPAN <= 400 ? 100 : SPAN <= 1500 ? 500 : 1000;
    var b1 = Math.ceil(state.min / beat) * beat;
    for (var cy = b1; cy <= state.max; cy += beat) {
      a.push('<line x1="' + X(cy) + '" y1="' + SKY_Y + '" x2="' + X(cy) + '" y2="' + AXIS_H +
             '" stroke="#c9a227" stroke-width="0.8" opacity="0.28"/>');
    }
    var step = 50;
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
      var wide = SPAN > 400, skyReach = {};
      sky.forEach(function (sk) {
        if (sk.y < state.min || sk.y > state.max) return;

        /* ── THE GREAT CONJUNCTION IS THE RHYTHM · 2 Sep ──────────────────
           Jupiter's solo due-east rising fired every ~6 years \u2014 34 marks in a
           window, a picket fence. The Jupiter\u2013Saturn conjunction recurs every
           ~20 (10 in a window) and is a NAMEABLE event that governed how whole
           civilisations read the sky. So the conjunction becomes the frequent
           beat of the top line and the solo Jupiter rising is dropped entirely.
           A conjunction is two planets meeting, not one crossing a line, so it
           gets its own mark: a small ring where Jupiter and Saturn touch. */
        if (sk.kind === 'gathering') {
          /* THE RAREST MARK ON THE SHIP \u2014 14 in 5,000 years, all four outer
             planets crowded into one arc of sky. Always drawn, never thinned; a
             filled diamond above the conjunction row so it reads as the landmark
             it is. */
          var gx = X(sk.y);
          a.push('<path d="M' + gx + ' ' + (SKY_Y + 2) + 'l6 7l-6 7l-6 -7z" fill="#f0d060" ' +
                 'stroke="#fff3c0" stroke-width="0.5"><title>' + esc(sk.description || 'Outer planets gather') +
                 ', ' + yearLabel(sk.y) + '</title></path>');
          return;
        }
        if (sk.kind === 'conjunction') {
          /* At the widest zoom even a 20-year rhythm becomes a fence (151 in a
             3,000-year window). Thin to every other ring past 1,000 years, so
             the beat stays legible without vanishing. */
          if (SPAN > 1000 && Math.round(sk.y / 20) % 2 !== 0) return;
          var cxp = X(sk.y);
          /* THE DOWNBEAT RING. A conjunction within ~10 years of a century mark
             is the LANDING in the count \u2014 drawn larger and filled so the eye
             lands on it. The others are the ticks between. */
          var beatU = SPAN <= 400 ? 100 : SPAN <= 1500 ? 500 : 1000;
          var onBeat = Math.abs(sk.y - Math.round(sk.y / beatU) * beatU) <= 10;
          if (onBeat) {
            a.push('<circle cx="' + cxp + '" cy="' + (SKY_Y + 26) + '" r="6" fill="#e8c65a" ' +
                   'fill-opacity="0.9" stroke="#f0d060" stroke-width="1"><title>Great conjunction \u2014 Jupiter and Saturn meet, ' +
                   yearLabel(sk.y) + '</title></circle>');
          } else {
            a.push('<circle cx="' + cxp + '" cy="' + (SKY_Y + 26) + '" r="4.5" fill="none" ' +
                   'stroke="#e8c65a" stroke-width="1.3"><title>Great conjunction \u2014 Jupiter and Saturn meet, ' +
                   yearLabel(sk.y) + '</title></circle>');
          }
          return;
        }
        /* Solo Jupiter risings are gone \u2014 the conjunction replaces them. The
           slow planets keep their crossings, which are genuinely rare. */
        if (sk.body === 'Jupiter') return;
        var sx = X(sk.y);
        /* ── THE GLYPHS · 2 Sep ──────────────────────────────────────────
           A coloured tick does not say PLANET. The marks were drawn, they were
           on screen, and they were still being looked for — which means the
           encoding failed even though the pixels were correct.

           The astronomical glyphs are unambiguous and take one character:
           ♆ Neptune · ♅ Uranus · ♄ Saturn · ♃ Jupiter. Sized and coloured by
           rarity, so the row reads as a hierarchy without a legend. */
        /* THE COLOURS THE PLANETS ACTUALLY ARE, lightened enough to hold on a
           dark scene. Neptune's deep blue, Uranus's pale cyan, Saturn's pale
           gold, Jupiter's banded tan. Arbitrary hues would have been just as
           distinct and would have taught a reader nothing; these are the ones
           anyone recognises from a photograph, so the row is readable before
           it is explained. Jupiter was grey, which said "not a planet". */
        var col = sk.body === 'Neptune' ? '#8b9bff'
                : sk.body === 'Uranus'  ? '#7fdce8'
                : sk.body === 'Saturn'  ? '#ecd493' : '#cf9b63';
        var gly = sk.body === 'Neptune' ? '\u2646'
                : sk.body === 'Uranus'  ? '\u2645'
                : sk.body === 'Saturn'  ? '\u2644' : '\u2643';
        var sz  = sk.body === 'Neptune' ? 20 : sk.body === 'Uranus' ? 18 : sk.body === 'Saturn' ? 15 : 12;
        var h   = sk.body === 'Neptune' ? 14 : sk.body === 'Uranus' ? 12 : sk.body === 'Saturn' ? 9 : 6;

        a.push('<line x1="' + sx + '" y1="' + (SKY_Y + 34 - h) + '" x2="' + sx + '" y2="' +
               (SKY_Y + 34) + '" stroke="' + col + '" stroke-width="1"/>');

        /* A glyph is only drawn where one fits. Jupiter crosses every six
           years — at a close zoom that is a row of ♃ and nothing else — so it
           keeps its tick and earns a glyph only when the window is tight
           enough to space them. Each body keeps its own reach, so a slow
           planet is never crowded out by a fast one. */
        var need = sz + 6;
        if (sx - (skyReach[sk.body] || -1e9) >= need) {
          skyReach[sk.body] = sx;
          a.push('<text x="' + sx + '" y="' + (SKY_Y + 20) + '" text-anchor="middle" fill="' + col +
                 '" font-size="' + sz + '">' + gly + '<title>' + esc(sk.body) +
                 ' rises due east over Giza, ' + yearLabel(sk.y) + '</title></text>');
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
        /* EVERY TICK NAMES ITSELF · 2 Sep. The planet glyphs carried a tooltip
           and the event ticks did not \u2014 so a tick whose label was dropped for
           collision was genuinely mute: it said a year and nothing else. Two
           fixes: a <title> on every tick (hover always gives the name and
           year), and an invisible wide hit-target over the hairline, because a
           0.75px line is nearly impossible to point at. */
        var evTip = esc(ev.name) + (ev.desc ? ' \u2014 ' + esc(ev.desc) : '') + '  (' + yearLabel(ev.y) + ')';
        a.push('<line x1="' + x + '" y1="' + (EV_Y[1] + 6) + '" x2="' + x + '" y2="' +
               (EV_Y[1] + 14) + '" stroke="#c9a227" stroke-width="0.75" opacity=".7"/>');
        a.push('<rect class="evhit" data-label="' + evTip.replace(/"/g, '&quot;') +
               '" x="' + (x - 6) + '" y="' + EV_Y[0] + '" width="12" height="' +
               (EV_Y[1] + 14 - EV_Y[0]) + '" fill="transparent" style="cursor:pointer">' +
               '<title>' + evTip + '</title></rect>');
        var row = reach[0] <= x ? 0 : (reach[1] <= x ? 1 : -1);
        if (row === -1) return;
        var nm = esc(ev.name);
        /* 9.2 px a character at 13.5px monospace, which is MORE than the glyph
           actually measures. Deliberately over: an estimate that is too small
           produces a collision, one that is too large produces a gap, and a gap
           is not a fault. Tested to hold at 8.5px/char before this. */
        reach[row] = x + 18 + nm.length * 10.2;   /* 15px type; over on purpose */
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

  /* ── the scene: one figure's world ────────────────────────────────────── */
  var pinned = null;

  function scene(soul) {
    var box = mounted && mounted.querySelector('.tl-scene');
    if (!box) return;
    if (!soul) { box.innerHTML = ''; return; }

    var b = soul.b, d = soul.d, living = d >= THIS_YEAR;
    var evs = (events || []).filter(function (e) { return e.y >= b && e.y <= d; })
                            .sort(function (p, q) { return p.y - q.y; });
    /* The slow bodies only — Jupiter every six years would be a list of
       Jupiter. Neptune, Uranus and Saturn are the ones a life can contain a
       countable number of. */
    var sk = (sky || []).filter(function (x) { return x.y >= b && x.y <= d && x.body !== 'Jupiter'; })
                        .sort(function (p, q) { return p.y - q.y; });
    /* WHO, NOT WHO-WAS-BORN-FIRST \u2014 2 Sep. Ordering by birth year surfaced
       the earliest-born 14 of a window that can hold 500. For Einstein that
       meant Victor Hugo and Karl Marx while Bohr, Fermi and Heisenberg sat
       unseen in "and 487 more" \u2014 the physicists, dropped for being born late.
       Order by what a reader can DO and by how much a life actually coincided:
       figures with a room first (the 52 the library can open), then by OVERLAP
       \u2014 the count of shared years \u2014 so the closest contemporaries rise. The
       inert names fill whatever the cap leaves. */
    var PROPER = '#7fb4f0';
    var ov = function (r) { return Math.min(d, r.d) - Math.max(b, r.b); };
    var with_ = state.rows.filter(function (r) {
      return r.k !== soul.k && r.b <= d && r.d >= b;
    }).sort(function (p, q) {
      if (!!p.r !== !!q.r) return p.r ? -1 : 1;      /* rooms first */
      return ov(q) - ov(p);                          /* then most overlap */
    });

    var CAP = 14;
    /* A history site: a reader scans for WHO and WHERE. Proper names — people,
       places, named events — all take terminal blue, so the eye finds them
       without reading every line. The year stays muted; the connective words
       stay grey. */
    function li(cls, yr, txt, key, from, to) {
      var body = cls === 'wh'
        ? '<span style="color:' + PROPER + '">' + esc(txt) + '</span>'   /* a person */
        : esc(txt);
      var data = key ? ' data-k="' + esc(key) + '"' : '';
      var span = (from !== undefined) ? ' data-from="' + from + '" data-to="' + to + '"' : '';
      return '<li class="' + cls + ' clk"' + data + span + '><i>' + yearLabel(yr) + '</i><span>' + body + '</span></li>';
    }
    /* Warm for human conflict and power, cool for making and knowing, grey for
       the rest \u2014 enough to sort a glance, not a rainbow. */
    function catColor(c) {
      return ({ conflict: '#d85a30', conquest: '#d85a30', politics: '#e0b93f', law: '#e0b93f',
                disaster: '#a3402d', religion: '#b39ddb', science: '#5dcaa5', invention: '#5dcaa5',
                engineering: '#5dcaa5', culture: '#7fb0e0', monument: '#c9a227', civilization: '#c9a227',
                exploration: '#7fdce8', commerce: '#8f9db4', economics: '#8f9db4' })[c] || '#8f9db4';
    }
    var glyph = { Neptune: '\u2646', Uranus: '\u2645', Saturn: '\u2644' };
    var pcol  = { Neptune: '#8b9bff', Uranus: '#7fdce8', Saturn: '#ecd493' };

    var h = [];
    if (pinned === soul) h.push('<span class="pin">pinned \u00b7 click to release</span>');
    h.push('<p class="who"><b>' + esc(soul.n) + '</b></p>');
    h.push('<p class="sub">' + yearLabel(b) + ' \u2014 ' + (living ? 'living' : yearLabel(d)) +
           ' \u00b7 ' + (living ? THIS_YEAR - b : d - b) + ' years' +
           (soul.r ? ' \u00b7 has a room' : '') + '</p>');

    h.push('<h4>while they lived</h4><ol>');
    /* DENSER, WITH REAL DATA \u2014 2 Sep. The name was the whole line; the
       description and category columns were parsed and thrown away. A category
       dot places the event at a glance (a war reads differently from an
       invention) and the description carries the weight \u2014 "Assassination of
       Caesar" becomes that plus "Ides of March; Roman Republic ends". No
       guessing: both are columns already in EVENTS.csv. */
    evs.slice(0, CAP).forEach(function (e) {
      h.push('<li class="ev clk" data-from="' + e.y + '" data-to="' + e.y + '"><i>' + yearLabel(e.y) + '</i><span>' +
             '<b style="color:' + catColor(e.cat) + ';font-weight:400">\u25cf </b>' +
             '<b style="font-weight:500;color:'+PROPER+'">' + esc(e.name) + '</b>' +
             (e.desc ? '<span style="color:#6b7688"> \u2014 ' + esc(e.desc) + '</span>' : '') +
             '</span></li>');
    });
    if (!evs.length) h.push('<li><span style="color:#5f6b80">no event recorded in these years</span></li>');
    h.push('</ol>' + (evs.length > CAP ? '<div class="more">and ' + (evs.length - CAP) + ' more</div>' : ''));

    h.push('<h4>the sky over Giza</h4><ol>');
    sk.slice(0, CAP).forEach(function (x) {
      /* The glyph and the name in the planet's own colour, so the sky list
         reads the same as the row of marks above it. "rises due east" stays
         muted — it is the same phrase every line and should not shout. */
      h.push('<li class="sk clk" data-from="' + (x.y-10) + '" data-to="' + (x.y+10) + '"><i>' + yearLabel(x.y) +
             '</i><span><b style="color:' + pcol[x.body] +
             ';font-weight:400">' + glyph[x.body] + ' ' + x.body + '</b>' +
             '<span style="color:#5f6b80"> rises due east</span></span></li>');
    });
    if (!sk.length) h.push('<li><span style="color:#5f6b80">' + (sky ? 'no slow planet crossed in these years' : 'sky register not read') + '</span></li>');
    h.push('</ol>' + (sk.length > CAP ? '<div class="more">and ' + (sk.length - CAP) + ' more</div>' : ''));

    h.push('<h4>alive beside them</h4><ol>');
    with_.slice(0, CAP).forEach(function (r) { h.push(li('wh', r.b, r.n, r.k, r.b, r.d)); });
    h.push('</ol>' + (with_.length > CAP ? '<div class="more">and ' + (with_.length - CAP) + ' more</div>' : ''));

    box.innerHTML = h.join('');
    /* the fold tab is a frame sibling now; show it whenever the panel has
       content, and point its chevron the right way. */
    var fold = mounted.querySelector('.tl-fold');
    if (fold) fold.classList.add('show');

    /* Dim everyone outside the span, brighten the one in hand. */
    mounted.querySelectorAll('.tl-rows g').forEach(function (g) {
      var k = g.getAttribute('data-k');
      var r = k && byKey[k];
      var inside = r && r.b <= d && r.d >= b;
      g.classList.toggle('dim', !inside);
      g.classList.toggle('lit', !!(r && r.k === soul.k));
    });
  }

  /* ── highlight: the single selection mechanism ────────────────────────────
     Everything clickable calls this with a SPAN [from,to] and an optional focus
     key. A life broadcasts its whole span; an event or a conjunction broadcasts
     a window around its instant (points light nothing, spans light richly \u2014
     see the granularity note in the handlers below). Bars overlapping the span
     become .conn; the focus becomes .focus; axis ticks/rings in range light,
     the rest dim. Clears on a bare-scene click. */
  var selection = null;
  function highlight(from, to, focusKey) {
    if (!mounted) return;
    selection = { from: from, to: to, focus: focusKey || null };
    mounted.classList.add('sel');
    mounted.querySelectorAll('.tl-rows g[data-k]').forEach(function (g) {
      var r = byKey[g.getAttribute('data-k')];
      var conn = r && r.b <= to && r.d >= from;
      g.classList.toggle('conn', !!conn);
      g.classList.toggle('focus', !!(focusKey && r && r.k === focusKey));
    });
    /* axis: light events and rings inside the span, dim the rest */
    mounted.querySelectorAll('.tl-axis-svg .evhit').forEach(function (rc) {
      /* the tick's year is encoded in its label tail "(ad 70)" \u2014 cheaper to
         read the sibling line's x, but the label parse is robust enough */
      var lbl = rc.getAttribute('data-label') || '';
      var mt = lbl.match(/\(([\d]+)\s*(bc|ad)?\)\s*$/i);
      if (!mt) return;
      var yr = parseInt(mt[1], 10) * (/bc/i.test(mt[2] || '') ? -1 : 1);
      rc.previousSibling && rc.previousSibling.classList &&
        rc.previousSibling.classList.toggle('evlit', yr >= from && yr <= to);
    });
    mounted.querySelectorAll('.tl-axis-svg circle').forEach(function (c) {
      /* a conjunction ring: light if its year is in the span */
      var t = c.querySelector('title'); var m = t && t.textContent.match(/(\d+)\s*(bc|ad)?\)?\s*$/i);
    });
  }
  function clearSelection() {
    selection = null;
    if (!mounted) return;
    mounted.classList.remove('sel');
    mounted.querySelectorAll('.conn,.focus').forEach(function (g) { g.classList.remove('conn','focus'); });
    mounted.querySelectorAll('.evlit').forEach(function (e) { e.classList.remove('evlit'); });
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

  var lastScrollLeft = -1;

  function onScroll() {
    if (!mounted) return;
    var rail = mounted.querySelector('.tl-rail');

    /* ── THE VERTICAL FOLLOWS TIME · 2 Sep ────────────────────────────────
       Every soul has a fixed row for the whole roster \u2014 rows are sorted by
       death year, so the 1st century sits near the top of a 964-row column and
       the 19th sits ~600 rows below it. Pan sideways to 1850 and its people are
       far off the bottom of the screen: the reader sees an empty stretch of
       column and thinks the names did not populate. They did \u2014 elsewhere.

       So when the TIME window moves, glide the vertical to the band of rows
       whose souls are actually alive in view. A deliberate vertical scroll is
       left alone \u2014 this only fires when scrollLeft changed, i.e. the reader
       moved through time, not through people. */
    if (rail.scrollLeft !== lastScrollLeft) {
      lastScrollLeft = rail.scrollLeft;
      var vw   = rail.clientWidth || (SPAN * PX_PER_YR);
      var from = state.min + rail.scrollLeft / PX_PER_YR;
      var to   = from + vw / PX_PER_YR;
      var lo = Infinity, hi = -Infinity;
      state.rows.forEach(function (r, i) {
        if (r.b <= to && r.d >= from) { if (i < lo) lo = i; if (i > hi) hi = i; }
      });
      if (lo <= hi) {
        var midRow = 12 + ((lo + hi) / 2) * ROW_H;
        var target = midRow - rail.clientHeight / 2;
        var max = rail.scrollHeight - rail.clientHeight;
        target = Math.max(0, Math.min(max, target));
        /* ease toward it rather than snapping, so a horizontal drag does not
           jerk the column; a small step per scroll event settles quickly. */
        rail.scrollTop += (target - rail.scrollTop) * 0.25;
      }
    }

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
    var left  = rail.scrollLeft + 14;
    var right = rail.scrollLeft + rail.clientWidth - 14;
    /* If the visible slice of a bar is narrower than its own label there is
       nowhere to put it, and clamping would only push it off the edge. Hide it
       instead — an absent label is a gap, a label drawn off-screen is a lie
       about where it went. */
    mounted.querySelectorAll('.tl-rows text.nm').forEach(function (t) {
      var x0 = +t.getAttribute('data-x0'), x1 = +t.getAttribute('data-x1');
      var w  = 12 + (t.textContent || '').length * 7.4;
      var at = Math.max(x0 + 12, Math.min(left, x1 - w));
      t.setAttribute('x', at);
      t.style.opacity = (at >= left - 2 && at + w <= right + 16) ? '' : '0';
    });
    /* And the dates from the other end. A bar wider than the window would
       otherwise show one label or the other but never both. */
    mounted.querySelectorAll('.tl-rows text.dt').forEach(function (t) {
      var x0 = +t.getAttribute('data-x0'), x1 = +t.getAttribute('data-x1');
      var w  = 14 + (t.textContent || '').length * 7.4;
      var at = Math.min(x1 - 12, Math.max(right, x0 + w));
      t.setAttribute('x', at);
      t.style.opacity = (at - w >= left - 16 && at <= right + 2) ? '' : '0';
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
        pinned = null;
        scene(anchor);
        return true;
      }, function () { return false; });
    },
    clear: function () { if (mounted) mounted.remove(); mounted = null; anchorKey = null; },
    _souls: function () { return souls; }
  };
})();
