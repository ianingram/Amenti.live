/* ============================================================================
   amenti-map.js  ·  THE MAP — the spatial twin of the timeline
   ----------------------------------------------------------------------------
   The hall knows WHEN (the timeline) and WHO-KNEW-WHOM (the connections). This
   is WHERE. It reads GEO.json and WORLD.json and draws nothing else.

   ── THE ONE LAW OF THIS FILE ──────────────────────────────────────────────
   A PIN AND A WASH MUST NEVER BE MISTAKEN FOR ONE ANOTHER.

   The most common Location in the roster is "Southern Europe" — 334 souls, a
   continent. Drawn as a dot in the Mediterranean it would be the single
   biggest lie on the page, and it would be the DEFAULT lie, told most often.
   So the two tiers do not share a shape, a hardness, or a colour:

       a pin   a small hard dot, full opacity, a crisp edge      "here"
       a wash  a large soft rectangle, no edge, low opacity      "somewhere
               with a floating label, never a point               in here"

   They cannot be confused at a glance, at any zoom, which is the test.

   ── GOLD IS RESERVED ──────────────────────────────────────────────────────
   Gold is the colour of a VERIFIED QUOTE and is not spent here. A place is
   never as certain as a quote and must not look it. Pins are cyan, washes a
   dim slate. Nothing on this surface is gold.

   ── WHAT IS NOT DRAWN ─────────────────────────────────────────────────────
   204 souls are myth or have no record; 191 carry a name nothing could
   resolve. They get NO MARK. The legend STATES their number, because a map
   that silently omits a fifth of the roster is claiming a completeness it
   does not have. The silence is honest only if it is declared.

   ── ADDITIVE AND SEPARATE ─────────────────────────────────────────────────
   This file touches no answer prose and no quote guard. It renders in its own
   surface, mounts once, and reads registers the ship already publishes.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';

  /* Equirectangular, matching WORLD.json's own box. The projection is stated
     rather than assumed: if the coastline is ever regenerated on another
     projection, these two numbers are the thing that must move with it. */
  var VB_W = 1000, VB_H = 500;
  var proj = function (lat, lon) {
    return [ (lon + 180) / 360 * VB_W, (90 - lat) / 180 * VB_H ];
  };

  /* The window opens on ALL of it. Unlike the timeline — where 200 years is a
     promise about comparability — a map has no natural span, and starting
     zoomed would hide the one thing this surface is for: the centre of
     gravity moving across the whole world. */
  var YEAR_MIN = -4000, YEAR_MAX = new Date().getUTCFullYear();

  /* ── THE APERTURE · 4 Sep ─────────────────────────────────────────────────
     SEEN LIVE: the map opened reading "4000 BC — AD 2026". lo was only ever
     set to hi-400 when the slider moved, so the FIRST thing a reader saw was
     every soul at once — 864 seats, 346 names with no room to print, and the
     sky reporting all 1,604 of its events in one breath. Every honest number
     under the map was correct and the view was useless.

     The apertures are the timeline's own SPANS, deliberately: a reader who
     learns what 200 years looks like on one instrument should not have to
     learn it again on the other. "A life, an age, an era, all of it."
     3000 is not a window so much as an admission that you are looking at
     everything, and it is a CHOICE now rather than the default. */
/* ── THE APERTURE IS PLANETARY · 4 Sep ────────────────────────────────────
     Not 10-50-200-800. Those are decimal habits, and nothing in this register
     runs on tens. The windows are the PERIODS THE SKY REGISTER ACTUALLY
     CONTAINS, measured from the file rather than looked up:

         Jupiter due-east        6 y    830 events, gaps 5-7
         Saturn due-east        15 y    335
         great conjunction      20 y    248, gaps 18-21
         Uranus                 42 y    117, gaps 41-43
         Halley                 76 y     48, gaps 62-79
         Neptune                82 y     60, gaps 82-83
         outer-planet gathering 179 y     14, BUT gaps 40-1367

     WHAT IS LEFT OUT, AND WHY. Neptune's 82 sits four years from Halley's 76
     — two buttons doing one job is a worse instrument, so Halley keeps the
     rung. The gathering's 179 is a MEDIAN, NOT A PERIOD: its gaps run from 40
     to 1367 years, and offering it as an aperture would dress noise as a
     cycle, which is the one thing this surface may not do. Saturn's 15 falls
     between Jupiter and the conjunction and earns no rung of its own.

     What this buys is not decoration. At the Jupiter window a reader sees one
     rising; at the conjunction window, one conjunction; at the Halley window,
     one comet. The aperture stops being a number and becomes a QUESTION —
     what does one turn of this body look like, and who was alive for it.

  ── AND THE APERTURE CHANGES WHAT IS SHOWN, NOT ONLY HOW MUCH ──────────────
     Narrowing is not a filter, it is a different reading. At "all of it" a
     seat can only be "Constantinople · 124", because 124 names on one dot is
     a smear and Jupiter rising seventy times is a metronome, not news. At the
     Jupiter window the same dot holds two people who can both be named, and a
     planet rising due east IS the event.

     The timeline reached this first and wrote it down: Jupiter is "kept for
     the close zooms only, which is the tiering its own gloss asks for." */
  var APERTURES = [6, 20, 42, 76, 3000];
  var AP_LABEL  = { 6: '\u2643', 20: '\u2643\u2644', 42: '\u2645',
                    76: '\u2604', 3000: 'all of it' };
  var AP_NAME   = { 6: 'one Jupiter rising \u00b7 6 years',
                    20: 'one great conjunction \u00b7 20 years',
                    42: 'one Uranus return \u00b7 42 years',
                    76: 'one Halley \u00b7 76 years',
                    3000: 'the whole register' };
  var APERTURE  = 76;   /* open on one Halley — a human span, and a real one */
  var APERTURE_START = YEAR_MAX;
  var hi = YEAR_MAX, lo = hi - APERTURE;

  var geo = null, world = null, sky = null, comets = null, mounted = null;

  /* ── GIZA · THE ONE HONEST COORDINATE FOR A SKY EVENT ─────────────────────
     SKY.csv is 1,342 due-east risings COMPUTED AT GIZA. A rising does not
     happen at a place — it is seen from one. So this coordinate is not the
     event's location, it is the OBSERVER'S, and that is the only reason a
     sky mark may sit on a map at all. Anywhere else would be an invention;
     here it is true by construction, and the label says "seen from" rather
     than "happened at" so a reader is never left to guess which. */
  var GIZA = [29.9792, 31.1342];

  /* ── WHY HALLEY IS NOT AT GIZA · 4 Sep ────────────────────────────────────
     The conjunctions and the due-east risings were COMPUTED at Giza, so the
     Giza mark is honest for them: it is the observer. Halley is not. It comes
     from EVENTS.csv, which carries no place at all, and a comet is seen from
     the whole earth — putting it on one coordinate would invent a specificity
     the record does not have, which is the same error as pinning a continent.

     So the sky gets a BAND above the map: a strip that is plainly not the
     earth, where an event with no place can sit without claiming one. A
     hairline drops from the band to Giza for the things actually computed
     there, so a reader can see which claims are tied to an observer and which
     belong to the sky at large. */
  function parseComets(text) {
    var out = [], lines = String(text).replace(/\r\n/g, '\n').split('\n');
    lines.forEach(function (line) {
      if (!line.trim()) return;
      var cells = [], cur = '', q = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { cells.push(cur); cur = ''; continue; }
        cur += c;
      }
      cells.push(cur);
      var y = parseFloat(cells[0]);
      if (isNaN(y)) return;
      if ((cells[2] || '').trim() !== 'comet') return;
      out.push({ y: y, name: (cells[1] || '').trim() });
    });
    return out;
  }

  /* Columns: year, body, kind, description — the same tolerant read the
     timeline uses, so one register is parsed one way by both surfaces. */
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
  var SVG = 'http://www.w3.org/2000/svg';
  var anchorKey = null;
  var lastShown = 0, lastHidden = 0, lastSeats = 0, lastSky = 0, lastConj = 0, lastGath = 0, lastHalley = 0;

  function get(url, asJson) {
    return fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(url.split('/').pop() + ' \u2014 ' + r.status);
        return asJson ? r.json() : r.text();
      });
  }

  function load() {
    if (geo && world) return Promise.resolve();
    return Promise.all([
      get(RAW + 'GEO.json', true).then(function (d) { geo = d; }),
      /* A map with no coastline is a scatter of dots in a void — it cannot be
         read, so unlike EVENTS.csv this one is NOT optional. If it fails the
         surface says so rather than drawing pins onto nothing. */
      get(RAW + 'WORLD.json', true).then(function (d) { world = d; }),
      /* THE SKY IS OPTIONAL, as it is for the timeline. A missing sky costs
         one mark on one coordinate; it must not cost the map. */
      get(RAW + 'SKY.csv', false).then(function (t) { sky = parseSky(t); },
                                       function ()  { sky = null; }),
      /* Halley lives in EVENTS.csv, not SKY.csv — 48 returns, -1404 to 2061,
         a median 76 years apart. Optional for the same reason. */
      get(RAW + 'EVENTS.csv', false).then(function (t) { comets = parseComets(t); },
                                          function ()  { comets = null; })
    ]);
  }

  /* ── the frame ──────────────────────────────────────────────────────────── */

  function mount() {
    if (mounted) return mounted;

    var css = document.createElement('style');
    css.textContent = [
      '#amenti-map{position:fixed;inset:0;z-index:3;opacity:0;visibility:hidden;',
      '  transition:opacity .45s ease .15s, visibility .45s;',
      '  font:400 13.5px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#b8c4d8}',
      'body.scene-map #amenti-map{opacity:1;visibility:visible}',
      /* ── THE HALL MUST GO, AND scene-bare CANNOT DO IT · SEEN LIVE 3 Sep ──
         takeScreen() clears scene-bare so the timeline is not left standing —
         but scene-bare is ALSO what hides #hall-main, so clearing it put the
         title, the QR, the footer links and the seed questions back on screen
         UNDERNEATH a 78%-opaque scrim. The map opened over a legible hall.

         Restoring scene-bare is not the fix: that is the timeline's reveal.
         The two jobs scene-bare was doing — "hide the reading" and "show the
         timeline" — are the same class only by accident, and this is where
         the accident surfaced. So scene-map hides the reading on its own
         terms, by the same rule and with the same transition. */
      'body.scene-map #hall-main,',
      'body.scene-map .hall-chrome,',
      'body.scene-map header,',
      'body.scene-map footer,',
      'body.scene-map #amenti-handover,',
      'body.scene-map #scene-hint{opacity:0;visibility:hidden;pointer-events:none;',
      '  transition:opacity .45s ease, visibility .45s}',
      '#amenti-map .mp-scrim{position:absolute;inset:0;background:rgba(6,7,14,.78);pointer-events:none}',
      '#amenti-map .mp-wrap{position:absolute;inset:0;display:flex;flex-direction:column;',
      /* right padding CLEARS THE FACULTY RAIL. Seen live: the legend ran under
         the globe and "no honest place — not drawn" was cut mid-word, which
         is the one line on this surface that declares what the map omits. */
      '  padding:26px 84px 18px 26px;gap:0}',
      /* min-height:0 or the SVG refuses to shrink and shoves the slider and the
         attribution off the bottom of the viewport — seen live, both gone. */
      '#amenti-map svg{flex:1 1 auto;min-height:0;width:100%;overflow:visible}',

      /* the land: an outline, not a fill — the map is a chart, not a picture */
      '#amenti-map .mp-land{fill:#0e1420;stroke:#243044;stroke-width:.6;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-grat{stroke:#1a2334;stroke-width:.4;fill:none;vector-effect:non-scaling-stroke}',

      /* A WASH. Soft, edgeless, large, low. Nothing about it reads as a point. */
      '#amenti-map .mp-wash{fill:#4a6c8f;fill-opacity:.16;stroke:none;pointer-events:all;cursor:default}',
      '#amenti-map .mp-wash:hover{fill-opacity:.30}',
      '#amenti-map .mp-washlabel{fill:#7d93ad;font-size:7.5px;letter-spacing:.06em;',
      '  text-anchor:middle;pointer-events:none;text-transform:lowercase}',

      /* A PIN. Small, hard, bright, crisp. Nothing about it reads as an area. */
      '#amenti-map .mp-pin{fill:#5fd0e8;fill-opacity:.85;stroke:#081018;stroke-width:.35;cursor:pointer}',
      '#amenti-map .mp-pin:hover{fill:#a9edff;fill-opacity:1}',
      /* THE NAMES. Hidden by default and revealed only when the cull says the
         label fits — so a name never lands on top of another name. */
      '#amenti-map .mp-name{fill:#c3d3e6;font-size:5.6px;letter-spacing:.02em;',
      '  text-anchor:middle;pointer-events:none;opacity:0;',
      '  paint-order:stroke;stroke:#070b12;stroke-width:1.6px;stroke-linejoin:round;',
      '  transition:opacity .35s ease}',
      '#amenti-map .mp-named .mp-name{opacity:.92}',
      /* AN OFFICE MARK: dim, plain, repeated. It says "one of many". */
      '#amenti-map .mp-glyph{fill:#93b9d4;font-size:6.4px;text-anchor:middle;',
      '  pointer-events:none;opacity:0;paint-order:stroke;stroke:#070b12;',
      '  stroke-width:1.8px;stroke-linejoin:round;transition:opacity .35s ease}',
      '#amenti-map .mp-marked .mp-glyph{opacity:.8}',
      /* A PERSONAL MARK: brighter, and RINGED so it cannot be mistaken for an
         office at a glance. Two tiers of a claim, two readings — the same rule
         that keeps a wash from looking like a pin. */
      '#amenti-map .mp-own .mp-glyph{fill:#a9edff;opacity:1;font-size:7px}',
      '#amenti-map .mp-ring{fill:none;stroke:#5fd0e8;stroke-width:.5;opacity:0;',
      '  transition:opacity .35s ease}',
      '#amenti-map .mp-own .mp-ring{opacity:.55}',
      /* THE ANCHOR — the soul the hall was asked about. Not gold: gold is a
         verified quote. A brighter cyan and a held ring, so the eye lands. */
      '#amenti-map .mp-anchor .mp-pin{fill:#a9edff;fill-opacity:1}',
      '#amenti-map .mp-anchor .mp-ring{opacity:.9;stroke:#a9edff;stroke-width:.8}',
      '#amenti-map .mp-anchor .mp-name{opacity:1;fill:#eaf6ff;font-size:6.4px}',
      /* where a seat wears a mark the dot recedes to an anchor: the mark IS
         the point, and two full-strength objects at one coordinate is clutter */
      '#amenti-map .mp-marked .mp-pin{fill-opacity:.3}',
      /* ── THE SKY · an instrument, not an inhabitant ───────────────────────
         Amber, deliberately: cyan is the souls and gold is a verified quote,
         and the sky is neither. An open diamond and hairline rings read as a
         reading taken, not as a thing that lived at a coordinate. */
      '#amenti-map .mp-obs{fill:none;stroke:#d8a24a;stroke-width:.7;opacity:.85}',
      /* THE SIGNS GLOW. A planet is a light; the blur says so without
         spending gold, which belongs to a verified quote and to nothing else. */
      '#amenti-map .mp-sign{fill:#e8c98a;font-size:9px;text-anchor:middle;',
      '  filter:url(#mp-glow);pointer-events:none}',
      '#amenti-map .mp-signn{fill:#a98c5f;font-size:5.4px;pointer-events:none}',
      /* over Giza the signs sit smaller than in the band — they are a reading
         at a place, not the register's own heading */
      '#amenti-map .mp-over{font-size:7px;fill:#f0d9a4}',
      '#amenti-map .mp-return{stroke:#d8a24a;stroke-width:.3;stroke-dasharray:1 4;',
      '  opacity:.28;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-jup{fill:#e8c98a;font-size:8px;text-anchor:middle;',
      '  filter:url(#mp-glow);pointer-events:none;transition:opacity .3s ease}',
      '#amenti-map .mp-tether{fill:none;stroke:#d8a24a;stroke-width:.3;',
      '  stroke-dasharray:2 3;opacity:.3}',
      /* HALLEY. The only animated thing on the surface, and only ever a few. */
      '#amenti-map .mp-halley path{fill:#fff3d4;filter:url(#mp-glow)}',
      '#amenti-map .mp-halley{animation:mp-spark 3.4s ease-in-out infinite;',
      '  transform-origin:center}',
      '@keyframes mp-spark{0%,100%{opacity:.25}45%{opacity:1}55%{opacity:.9}}',
      '@media (prefers-reduced-motion:reduce){',
      '  #amenti-map .mp-halley{animation:none;opacity:.85}}',
      '#amenti-map .mp-conj{fill:none;stroke:#d8a24a;stroke-width:.35;opacity:.45}',
      '#amenti-map .mp-gath{fill:#d8a24a;fill-opacity:.35;stroke:none}',
      '#amenti-map .mp-obslabel{fill:#c99a4e;font-size:5px;letter-spacing:.1em;',
      '  text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:#070b12;',
      '  stroke-width:1.6px;stroke-linejoin:round}',
      '#amenti-map .mp-sky{transition:opacity .4s ease}',
      /* arriving and leaving — the whole reason to scrub time */
      '#amenti-map .mp-seat{transition:opacity .4s ease}',
      '#amenti-map .mp-seat.mp-in{opacity:0}',
      '#amenti-map .mp-seat.mp-out{opacity:0}',
      '#amenti-map .mp-seat.mp-out .mp-name{opacity:0}',

      /* the readout */
      '#amenti-map .mp-head{display:flex;justify-content:space-between;align-items:baseline;',
      '  gap:10px 18px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto}',
      '#amenti-map .mp-title{color:#dbe4f0;letter-spacing:.14em;text-transform:uppercase;font-size:12px}',
      '#amenti-map .mp-key{display:flex;gap:16px;align-items:center;font-size:11.5px;color:#8fa2ba}',
      '#amenti-map .mp-key i{display:inline-block;vertical-align:middle;margin-right:6px}',
      '#amenti-map .mp-key .k-pin{width:7px;height:7px;border-radius:50%;background:#5fd0e8}',
      '#amenti-map .mp-key .k-wash{width:16px;height:9px;border-radius:2px;background:rgba(74,108,143,.42)}',
      '#amenti-map .mp-key .k-none{width:16px;height:9px;border:1px dashed #3c4a5e;border-radius:2px}',
      '#amenti-map .mp-key .k-sky{width:8px;height:8px;border:1px solid #d8a24a;',
      '  transform:rotate(45deg)}',

      '#amenti-map .mp-foot{display:flex;align-items:center;gap:14px;margin-top:10px;font-size:12px;flex:0 0 auto}',
      '#amenti-map .mp-foot input[type=range]{flex:1;accent-color:#5fd0e8}',
      /* THE READOUT IS THE INSTRUMENT'S FACE — it was 12px and unreadable
         across a room. The names on the map may stay small; the year may not. */
      '#amenti-map .mp-read{color:#f0f5fb;min-width:270px;font-size:21px;',
      '  letter-spacing:.06em;font-variant-numeric:tabular-nums}',
      '#amenti-map .mp-chrono{position:relative;flex:1;display:block;min-width:0}',
      '#amenti-map .mp-ruler{display:block;width:100%;height:34px;overflow:visible}',
      '#amenti-map .mp-tick{stroke:#2c3a4d;stroke-width:1;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-tickM{stroke:#43566e}',
      '#amenti-map .mp-rlab{fill:#7d8ea6;font-size:9px;text-anchor:middle;',
      '  font-family:ui-monospace,Menlo,monospace;letter-spacing:.08em}',
      '#amenti-map .mp-rhal{stroke:#e8c98a;stroke-width:1;opacity:.75;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-rgath{fill:#d8a24a;opacity:.8}',
      '#amenti-map .mp-rwin{fill:#5fd0e8;fill-opacity:.28;stroke:#5fd0e8;stroke-width:.8;',
      '  vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-slider{width:100%;margin:0;display:block}',
      '#amenti-map .mp-ap{display:flex;gap:4px}',
      '#amenti-map .mp-ap button{font:400 10.5px/1 ui-monospace,Menlo,monospace;',
      '  letter-spacing:.1em;color:#7d8ea6;background:transparent;cursor:pointer;',
      '  border:1px solid #23303f;border-radius:3px;padding:4px 7px}',
      '#amenti-map .mp-ap button.on{color:#e8c98a;border-color:#7a5f33}',
      '#amenti-map .mp-ap button{position:relative;font-size:14px;padding:5px 9px}',
      /* WHAT DOES THIS BUTTON DO. A title attribute waits a second and then
         renders in the OS font at the OS size, which on this surface reads as
         a bug. Same hover label the faculty rail uses, so one page has one
         way of explaining a control. */
      '#amenti-map .mp-ap button::after{content:attr(data-name);position:absolute;',
      '  bottom:34px;left:50%;transform:translateX(-50%);font:400 11px/1 ui-monospace,',
      '  Menlo,monospace;letter-spacing:.08em;color:#dbe4f0;background:rgba(8,12,20,.95);',
      '  border:1px solid #2b3a50;padding:6px 8px;border-radius:3px;white-space:nowrap;',
      '  opacity:0;pointer-events:none;transition:opacity .15s}',
      '#amenti-map .mp-ap button:hover::after{opacity:1}',
      '#amenti-map .mp-dial{position:relative}',
      '#amenti-map .mp-dial::after{content:\'turn \\2014 clockwise is forward\';position:absolute;',
      '  bottom:32px;right:0;font:400 11px/1 ui-monospace,Menlo,monospace;color:#dbe4f0;',
      '  background:rgba(8,12,20,.95);border:1px solid #2b3a50;padding:6px 8px;',
      '  border-radius:3px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s}',
      '#amenti-map .mp-dial:hover::after{opacity:1}',
      '#amenti-map .mp-ap button{min-width:30px}',
      '#amenti-map .mp-dial{cursor:grab;flex:0 0 auto}',
      '#amenti-map .mp-dial.turning{cursor:grabbing}',
      '#amenti-map .mp-dial circle{fill:none;stroke:#2b3a50;stroke-width:1.4}',
      '#amenti-map .mp-dial line{stroke:#5fd0e8;stroke-width:1.6;stroke-linecap:round}',
      '#amenti-map .mp-note{color:#8395ab;font-size:13px;margin-top:8px;line-height:1.55;flex:0 0 auto}',
      '#amenti-map .mp-zoom{color:#5c6b80;font-size:12px;margin-top:4px;flex:0 0 auto}',
      '#amenti-map .mp-hit{position:absolute;pointer-events:none;background:rgba(8,12,20,.94);',
      '  border:1px solid #2b3purple;padding:6px 9px;border-radius:3px;font-size:11.5px;',
      '  color:#dbe4f0;white-space:nowrap;opacity:0;transition:opacity .12s}'
    ].join('\n').replace('#2b3purple', '#2b3a50');
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.id = 'amenti-map';
    el.innerHTML =
      '<div class="mp-scrim"></div>' +
      '<div class="mp-wrap">' +
        '<div class="mp-head">' +
          '<div class="mp-title">where the souls stood</div>' +
          '<div class="mp-key">' +
            '<span><i class="k-pin"></i>a seat \u2014 here</span>' +
            '<span><i class="k-wash"></i>a territory \u2014 somewhere in here</span>' +
            '<span><i class="k-none"></i>no honest place \u2014 not drawn</span>' +
            '<span><i class="k-sky"></i>the sky \u2014 seen from giza</span>' +
          '</div>' +
        '</div>' +
        '<svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">' +
          '<defs><filter id="mp-glow" x="-120%" y="-120%" width="340%" height="340%">' +
            '<feGaussianBlur stdDeviation="1.5" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/>' +
            '<feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
          '<g class="mp-graticule"></g><path class="mp-land"></path>' +
          '<g class="mp-washes"></g><g class="mp-pins"></g><g class="mp-sky"></g>' +
        '</svg>' +
        '<div class="mp-foot">' +
          '<span class="mp-read"></span>' +
          '<span class="mp-ap">' +
            APERTURES.map(function (a) {
              return '<button type="button" data-ap="' + a + '"' +
                     (a === APERTURE ? ' class="on"' : '') +
                     ' data-name="' + AP_NAME[a] + '">' + AP_LABEL[a] + '</button>';
            }).join('') +
          '</span>' +
          '<span class="mp-chrono">' +
            '<svg class="mp-ruler" viewBox="0 0 1000 34" preserveAspectRatio="none"></svg>' +
            '<input type="range" class="mp-slider" min="-4000" max="' + YEAR_MAX + '" step="1" value="' + APERTURE_START + '">' +
          '</span>' +
          '<svg class="mp-dial" viewBox="0 0 26 26" width="26" height="26" aria-label="turn to move through time">' +
            '<circle cx="13" cy="13" r="11"/>' +
            '<g class="mp-dial-hand"><line x1="13" y1="13" x2="13" y2="4"/></g>' +
          '</svg>' +
        '</div>' +
        '<div class="mp-note"></div>' +
        '<div class="mp-zoom">scroll the map or turn the dial to move through time \u00b7 ' +
        'the seat names are small on purpose \u2014 press ' +
        (/Mac/.test(navigator.platform) ? '\u2318' : 'Ctrl') + ' and + to enlarge the page</div>' +
      '</div>' +
      '<div class="mp-hit"></div>';
    document.body.appendChild(el);
    mounted = el;
    return el;
  }

  /* ── the drawing ────────────────────────────────────────────────────────── */

  function alive(s) {
    /* A soul counts as present in the window if their span overlaps it. A soul
       with no dates is NOT claimed by any window — it is not placed in a
       century nobody recorded. */
    if (typeof s.b !== 'number' || typeof s.d !== 'number') return false;
    return s.d >= lo && s.b <= hi;
  }

  function draw() {
    var el = mounted, svg = el.querySelector('svg');
    el.querySelector('.mp-land').setAttribute('d', world.path);

    /* graticule: every 30°, so a reader can judge a wash's size against
       something. Drawn once. */
    var g = el.querySelector('.mp-graticule');
    if (!g.childNodes.length) {
      var d = '';
      for (var x = 0; x <= 360; x += 30) d += 'M' + (x / 360 * VB_W) + ' 0V' + VB_H;
      for (var y = 0; y <= 180; y += 30) d += 'M0 ' + (y / 180 * VB_H) + 'H' + VB_W;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('class', 'mp-grat'); p.setAttribute('d', d); g.appendChild(p);
    }

    var souls = geo.souls.filter(alive);
    var pins   = souls.filter(function (s) { return s.tier === 'city' && s.lat != null; });
    var washes = souls.filter(function (s) { return s.ext; });

    /* WASHES FIRST, and grouped. 334 souls share "Southern Europe": drawing
       334 stacked rectangles would compound opacity into something as hard as
       a pin, which is the one thing forbidden. One rectangle per territory,
       its weight carried by the LABEL's count, not by stacking. */
    var byExt = {};
    washes.forEach(function (s) {
      var k = s.ext.join(',');
      (byExt[k] || (byExt[k] = { ext: s.ext, place: s.place, n: 0 })).n++;
    });
    var wh = '';
    Object.keys(byExt).forEach(function (k) {
      var w = byExt[k], a = proj(w.ext[2], w.ext[1]), b = proj(w.ext[0], w.ext[3]);
      var x = a[0], y = a[1], ww = Math.max(2, b[0] - a[0]), hh = Math.max(2, b[1] - a[1]);
      wh += '<rect class="mp-wash" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
            '" width="' + ww.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="5">' +
            '<title>' + esc(w.place) + ' \u2014 ' + w.n + ' soul' + (w.n === 1 ? '' : 's') +
            ', somewhere in this area</title></rect>' +
            '<text class="mp-washlabel" x="' + (x + ww / 2).toFixed(1) + '" y="' + (y + hh / 2).toFixed(1) +
            '">' + esc(w.place) + ' \u00b7 ' + w.n + '</text>';
    });
    el.querySelector('.mp-washes').innerHTML = wh;

    /* ── PINS, AND THE NAMES COMING AND GOING · 4 Sep ────────────────────────
       innerHTML on every slider step destroyed and rebuilt every node, so a
       soul who stood in both windows FLICKERED rather than stayed, and one
       who left simply vanished mid-frame. The whole point of scrubbing time
       is watching a name arrive and a name go out, which a rebuild cannot
       show: it has no memory of what was there a moment ago.

       So the nodes PERSIST, keyed by seat. Entering fades up, leaving fades
       down and is then removed. What survives both windows does not move. */
    var bySeat = {};
    pins.forEach(function (s) {
      var k = s.lat + ',' + s.lon;
      var seat = bySeat[k] || (bySeat[k] = { lat: s.lat, lon: s.lon, place: s.place,
                                             who: [], off: {}, personal: null, pname: null });
      seat.who.push(s.n);
      if (s.o) seat.off[s.o] = (seat.off[s.o] || 0) + 1;
      /* THE RARER TIER WINS. If anyone standing at this seat in this window
         carries a mark of their own, that is what the seat shows — an office
         is shared by hundreds, a personal sign by one, and the scarcer claim
         is the more informative one. */
      if (s.pg && !seat.personal) { seat.personal = s.pg; seat.pname = s.n; }
      /* the soul the hall was asked about, so the reader can find them among
         four hundred dots without hunting */
      if (anchorKey && s.k === anchorKey) { seat.anchor = true; seat.aname = s.n; }
    });

    var gp = el.querySelector('.mp-pins');
    var live = {};
    lastSeats = Object.keys(bySeat).length;

    Object.keys(bySeat).forEach(function (k) {
      var p = bySeat[k], xy = proj(p.lat, p.lon);
      var r = Math.min(4.2, 1.15 + Math.log(p.who.length + 1) * 0.72);
      var g = gp.querySelector('[data-seat="' + CSS.escape(k) + '"]');
      if (!g) {
        g = document.createElementNS(SVG, 'g');
        g.setAttribute('data-seat', k);
        g.setAttribute('class', 'mp-seat mp-in');
        g.innerHTML = '<circle class="mp-pin"/><circle class="mp-ring"/>' +
                      '<text class="mp-glyph"/><text class="mp-name"/>';
        gp.appendChild(g);
        /* next frame, so the browser has a start state to transition FROM */
        requestAnimationFrame(function () { g.classList.remove('mp-in'); });
      }
      g.classList.remove('mp-out');
      var c = g.querySelector('circle');
      c.setAttribute('cx', xy[0].toFixed(1));
      c.setAttribute('cy', xy[1].toFixed(1));
      c.setAttribute('r', r.toFixed(2));

      /* THE NAME. One soul at a seat is named; several share the seat's own
         name and a count, because eleven names stacked on one dot is not
         eleven readable names, it is a smudge. */
      /* ── THE SEAT'S MARK · 4 Sep ─────────────────────────────────────────
         A seat wears ONE glyph, not one per soul: Constantinople holds 124 and
         124 sigils on one dot is a smear. Which one is the DOMINANT OFFICE
         among the souls standing here in this window — so the mark changes as
         time is scrubbed, and a reader watches the Mediterranean turn from
         crown to cross while Baghdad turns to crescent. That movement is the
         thing; a static mark would say nothing a label does not.

         A tie goes to the office with more souls, then to whichever sorts
         first — arbitrary, but STABLE, so a mark does not flicker between two
         equal claims on every step of the slider. */
      var dom = null, domN = 0;
      Object.keys(p.off).sort().forEach(function (o) {
        if (p.off[o] > domN) { domN = p.off[o]; dom = o; }
      });
      var mark = p.personal || dom;
      var gt = g.querySelector('.mp-glyph');
      gt.textContent = mark || '';
      gt.setAttribute('x', xy[0].toFixed(1));
      gt.setAttribute('y', (xy[1] + 2.4).toFixed(1));
      /* the two tiers must not read alike — see the probe's note */
      g.classList.toggle('mp-own', !!p.personal);
      g.classList.toggle('mp-marked', !!mark);
      g.classList.toggle('mp-anchor', !!p.anchor);
      if (p.anchor) label = p.aname;        /* the asked-about soul keeps their name */
      var ring = g.querySelector('.mp-ring');
      ring.setAttribute('cx', xy[0].toFixed(1));
      ring.setAttribute('cy', xy[1].toFixed(1));
      ring.setAttribute('r', '4.6');

      /* CLOSE IN, PEOPLE HAVE NAMES. At 10 or 50 years a shared seat holds a
         handful, not a hundred, so it can say who rather than how many. */
      var label;
      if (p.who.length === 1) label = p.who[0];
      else if (APERTURE <= 42 && p.who.length <= 4) label = p.who.join(', ');
      else label = p.place + ' \u00b7 ' + p.who.length;
      var t = g.querySelector('text');
      t.textContent = label;
      t.setAttribute('x', xy[0].toFixed(1));
      t.setAttribute('y', (xy[1] - (mark ? 5.4 : r + 2.2)).toFixed(1));
      /* HALF-WIDTH, MEASURED NOT GUESSED. At font-size 5.6px a character
         occupies roughly 2.8px, so half of a label is length * 1.4. The first
         value here was 2.5 — nearly double — and it culled 6 of 11 labels in
         a 500 BC window that had ample room. This is the trap the timeline's
         axis note names: the collision test and the placement share this one
         number, so they will agree with each other whether or not it is
         right. It is checked against the font, and the screen is the judge. */
      g._w = label.length * 1.45;
      g._x = xy[0]; g._y = xy[1] - (mark ? 5.4 : r + 2.2);
      g._rank = p.who.length;

      var title = g.querySelector('title') || g.appendChild(document.createElementNS(SVG, 'title'));
      title.textContent = p.place + ' \u2014 ' + p.who.slice(0, 8).join(', ') +
                          (p.who.length > 8 ? ' \u2026 (' + p.who.length + ')' : '') +
                          (p.personal ? '  \u00b7 ' + p.personal + ' the mark of ' + p.pname
                                      : dom ? '  \u00b7 ' + dom + ' ' + domN + ' of this office' : '');
      live[k] = 1;
    });

    /* GONE. Faded, not yanked — a name leaving the window is the thing being
       shown, and an instant disappearance shows nothing. */
    [].slice.call(gp.children).forEach(function (g) {
      if (live[g.getAttribute('data-seat')]) return;
      if (g.classList.contains('mp-out')) return;
      g.classList.add('mp-out');
      setTimeout(function () { if (g.classList.contains('mp-out')) g.remove(); }, 420);
    });

    /* ── WHICH NAMES FIT · the honest cull ───────────────────────────────────
       At AD 2000 there are 365 seats in view and every one wants a label. A
       map has no rows to stagger into, so unlike the timeline's axis the only
       instrument here is DROPPING — which the timeline's own note warns is
       not robust, because the test and the placement can share an estimate
       and agree with each other while the screen fills with porridge.

       So the drop is not silent. Seats are ranked by how many souls they
       hold, laid out greedily, and whatever did not fit IS COUNTED AND
       STATED under the map. A hidden name is a fact about the view, not an
       absence to be quiet about. Every dropped label is still on its pin's
       hover. */
    var placed = [], shown = 0, hidden = 0;
    [].slice.call(gp.children)
      .filter(function (g) { return !g.classList.contains('mp-out'); })
      .sort(function (x, y) { return y._rank - x._rank; })
      .forEach(function (g) {
        var x = g._x, y = g._y, w = g._w, fits = true;
        for (var i = 0; i < placed.length; i++) {
          var q = placed[i];
          if (Math.abs(x - q.x) < (w + q.w) && Math.abs(y - q.y) < 6.5) { fits = false; break; }
        }
        if (fits) { placed.push({ x: x, y: y, w: w }); shown++; }
        g.classList.toggle('mp-named', fits);
        if (!fits) hidden++;
      });
    lastShown = shown; lastHidden = hidden;

    /* ── THE SKY BAND · a THIRD kind of mark ─────────────────────────────────
       Not a soul and not a territory, so it may not look like either. It is
       also not ON the earth, which is why it sits in a strip above the
       coastline rather than at a coordinate.

       WHAT IS DRAWN AND WHAT IS ONLY COUNTED. Jupiter rises due east every
       six years: at a 400-year window that is seventy risings, which is a
       metronome rendered as news. The timeline already ruled on this and
       keeps Jupiter for close zooms only. Same rule, different shape — the
       BODY gets one sign whatever its count, the rare events get a mark, and
       the regular ones get a number beside the sign. */
    var gsky = el.querySelector('.mp-sky');
    var h = '', bandY = 22;
    lastSky = lastConj = lastGath = lastHalley = 0;

    if (sky && sky.length) {
      var inWin = sky.filter(function (e) { return e.y >= lo && e.y <= hi; });
      var conj  = inWin.filter(function (e) { return e.kind === 'conjunction'; });
      var gath  = inWin.filter(function (e) { return e.kind === 'gathering'; });
      var byBody = {};
      inWin.filter(function (e) { return e.kind === 'due-east'; })
           .forEach(function (e) { byBody[e.body] = (byBody[e.body] || 0) + 1; });

      /* THE SIGNS. One glyph a body, glowing, with its count — not one mark
         per rising. A sign is the body; the number is how often it rose. */
      var SIGN = { Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646' };
      var order = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], x = 120;
      var closeIn = APERTURE <= 42;
      if (closeIn) {
        /* A RISING IS NEWS AT THIS SCALE. Ten years holds one or two, so each
           gets its own sign AND ITS YEAR — the thing a count can never say. */
        inWin.filter(function (e) { return e.kind === 'due-east'; })
             .sort(function (a, b) { return a.y - b.y; })
             .slice(0, 10)
             .forEach(function (e) {
               h += '<text class="mp-sign" x="' + x + '" y="' + (bandY + 3) + '">' +
                    (SIGN[e.body] || '\u2726') + '</text>' +
                    '<text class="mp-signn" x="' + (x - 6) + '" y="' + (bandY + 11) + '">' +
                    yr(e.y).replace('AD ', '') + '</text>';
               x += 30;
             });
      } else {
        order.forEach(function (b) {
          if (!byBody[b]) return;
          h += '<text class="mp-sign" x="' + x + '" y="' + (bandY + 3) + '">' + SIGN[b] + '</text>' +
               '<text class="mp-signn" x="' + (x + 9) + '" y="' + (bandY + 3) + '">' + byBody[b] + '</text>';
          x += 34;
        });
      }

      /* a conjunction is a ring; a gathering is a filled orb — the same two
         shapes the timeline uses, so one event reads the same on both */
      if (conj.length) {
        h += '<circle class="mp-conj" cx="' + x + '" cy="' + bandY + '" r="4.4"/>' +
             '<circle class="mp-conj" cx="' + x + '" cy="' + bandY + '" r="6.8"/>' +
             '<text class="mp-signn" x="' + (x + 10) + '" y="' + (bandY + 3) + '">' + conj.length + '</text>';
        x += 40;
      }
      if (gath.length) {
        h += '<circle class="mp-gath" cx="' + x + '" cy="' + bandY + '" r="4"/>' +
             '<text class="mp-signn" x="' + (x + 8) + '" y="' + (bandY + 3) + '">' + gath.length + '</text>';
        x += 34;
      }

      /* THE TETHER. These were computed AT GIZA, so a hairline says from
         where. Halley gets no tether, because it is tied to no observer. */
      /* ── THE SIGNS OVER GIZA · 4 Sep ─────────────────────────────────────
         The bodies in conjunction, drawn above the observer, at the event the
         reader has most recently crossed. Scrubbing past a conjunction
         changes what stands over Giza, which is the point — twenty of them at
         once would be a pile that says nothing about when.

         TWO SIGNS, NOT THREE. Every one of the 248 conjunction rows is
         Jupiter-Saturn: two bodies, and the register calls it a great
         conjunction. The 14 gatherings are the four outer planets within
         10-36 degrees of sky, so those show four. A third sign on a
         two-planet conjunction would be a number nothing in the register
         supports, and it is exactly the kind of small invention this surface
         exists to refuse. */
      var recent = null;
      inWin.forEach(function (e) {
        if (e.kind === 'due-east') return;
        if (e.y <= hi && (!recent || e.y > recent.y)) recent = e;
      });
      if (recent) {
        var gzc = proj(GIZA[0], GIZA[1]);
        var bodies = recent.kind === 'gathering'
          ? ['\u2643', '\u2644', '\u2645', '\u2646']
          : ['\u2643', '\u2644'];
        var span = (bodies.length - 1) * 7;
        bodies.forEach(function (sg, i) {
          h += '<text class="mp-sign mp-over" x="' + (gzc[0] - span / 2 + i * 7).toFixed(1) +
               '" y="' + (gzc[1] - 8).toFixed(1) + '">' + sg + '</text>';
        });
        h += '<text class="mp-obslabel" x="' + gzc[0].toFixed(1) + '" y="' + (gzc[1] - 15).toFixed(1) +
             '">' + (recent.kind === 'gathering' ? 'gathering' : 'great conjunction') +
             ' \u00b7 ' + yr(recent.y) + '</text>';
      }

      if (inWin.length) {
        var gz = proj(GIZA[0], GIZA[1]);
        h += '<path class="mp-tether" d="M' + (x - 20) + ' ' + (bandY + 8) +
             'Q' + gz[0].toFixed(1) + ' ' + ((bandY + gz[1]) / 2).toFixed(1) +
             ' ' + gz[0].toFixed(1) + ' ' + (gz[1] - 4).toFixed(1) + '"/>' +
             '<path class="mp-obs" d="M' + gz[0].toFixed(1) + ' ' + (gz[1] - 3.2).toFixed(1) +
             'L' + (gz[0] + 3.2).toFixed(1) + ' ' + gz[1].toFixed(1) +
             'L' + gz[0].toFixed(1) + ' ' + (gz[1] + 3.2).toFixed(1) +
             'L' + (gz[0] - 3.2).toFixed(1) + ' ' + gz[1].toFixed(1) + 'Z"/>' +
             '<text class="mp-obslabel" x="' + gz[0].toFixed(1) + '" y="' + (gz[1] + 10).toFixed(1) +
             '">computed at giza</text>';
      }
      lastSky = inWin.length; lastConj = conj.length; lastGath = gath.length;
    }

    /* ── THE RETURN LINE · Jupiter, until it stands over Giza again ──────────
       A hairline along Giza's OWN LATITUDE, circling the map, with Jupiter's
       sign travelling it. One full lap between one due-east rising and the
       next, arriving over the pyramids exactly at the rising year.

       WHAT THIS CLAIMS, AND WHAT IT MUST NOT. The claim is the INTERVAL —
       830 risings in the register, 5 to 7 years apart, and each lap is timed
       to the true gap between ITS OWN two risings rather than to an average,
       so a 5-year return runs faster than a 7-year one and the difference is
       the record speaking.

       IT IS NOT JUPITER'S POSITION. The sub-planetary point sweeps the whole
       globe every day; at a register whose resolution is the YEAR there is no
       honest longitude to draw, and computing one from orbital elements would
       put a second, worse sky beside the DE422 one already here. So this is a
       CLOCK laid on the ground, the line is real geography, the arrivals are
       real years, and the label says count, not position. Where a reader
       could mistake it for an ephemeris, the mistake is the whole risk. */
    if (sky && sky.length) {
      var rises = sky.filter(function (e) {
        return e.body === 'Jupiter' && e.kind === 'due-east';
      }).sort(function (a, b) { return a.y - b.y; });

      var prev = null, next = null;
      for (var ri = 0; ri < rises.length; ri++) {
        if (rises[ri].y <= hi) prev = rises[ri];
        if (rises[ri].y > hi) { next = rises[ri]; break; }
      }
      if (prev && next) {
        var gzr = proj(GIZA[0], GIZA[1]);
        var frac = (hi - prev.y) / (next.y - prev.y);      /* 0 at a rising, 1 at the next */
        /* west to east, so it returns TO Giza rather than away from it */
        var lonNow = GIZA[1] + frac * 360;
        while (lonNow > 180) lonNow -= 360;
        var jp = proj(GIZA[0], lonNow);

        h += '<line class="mp-return" x1="0" y1="' + gzr[1].toFixed(1) +
             '" x2="1000" y2="' + gzr[1].toFixed(1) + '"/>';
        /* the mark thickens as it closes on Giza — the return is the event */
        var near = 1 - Math.min(1, Math.abs(0.5 - frac) * 2);
        h += '<text class="mp-jup" x="' + jp[0].toFixed(1) + '" y="' + (gzr[1] + 2.6).toFixed(1) +
             '" opacity="' + (0.45 + 0.55 * (1 - near)).toFixed(2) + '">\u2643</text>';
        h += '<title>Jupiter\u2019s return: rose due east over Giza in ' + yr(prev.y) +
             ', next in ' + yr(next.y) + ' \u2014 ' + (next.y - prev.y) + ' years. ' +
             'This line is a COUNT to that return along Giza\u2019s latitude, not Jupiter\u2019s position.</title>';
        h += '<text class="mp-obslabel" x="6" y="' + (gzr[1] - 4).toFixed(1) +
             '" text-anchor="start">\u2643 returns due east over giza in ' +
             Math.max(0, next.y - hi) + 'y \u00b7 a count, not a position</text>';
      }
    }

    /* ── HALLEY · the one thing on this map that sparkles ────────────────────
       It earns it by being rare and punctual: 48 returns in the register, a
       median 76 years apart, so at a 400-year window there are about five and
       never a crowd. The animation is CSS on a four-point star and stops
       being drawn the moment the window holds none — a sparkle with nothing
       behind it would be decoration, and this page does not decorate. */
    if (comets && comets.length) {
      var hal = comets.filter(function (e) { return e.y >= lo && e.y <= hi; });
      lastHalley = hal.length;
      hal.forEach(function (e, i) {
        var hx = 640 + (i % 8) * 34, hy = bandY + ((i % 2) ? -7 : 5);
        h += '<g class="mp-halley" style="animation-delay:' + (i * 0.42).toFixed(2) + 's">' +
             '<path d="M' + hx + ' ' + (hy - 5) + 'L' + (hx + 1.5) + ' ' + (hy - 1.5) +
             'L' + (hx + 5) + ' ' + hy + 'L' + (hx + 1.5) + ' ' + (hy + 1.5) +
             'L' + hx + ' ' + (hy + 5) + 'L' + (hx - 1.5) + ' ' + (hy + 1.5) +
             'L' + (hx - 5) + ' ' + hy + 'L' + (hx - 1.5) + ' ' + (hy - 1.5) + 'Z"/>' +
             '<title>' + esc(e.name) + ', ' + yr(e.y) + '</title></g>';
      });
      if (hal.length)
        h += '<text class="mp-obslabel" x="628" y="' + (bandY + 3) + '" text-anchor="end">halley</text>';
    }

    gsky.innerHTML = h;

    /* THE READOUT NAMES THE SILENCE. */
    var t = geo.totals;
    el.querySelector('.mp-read').textContent = yr(lo) + ' \u2014 ' + yr(hi);
    el.querySelector('.mp-note').textContent =
      (AP_NAME[APERTURE] ? AP_NAME[APERTURE] + ' \u00b7 ' : '') +
      /* SOULS AND SEATS ARE DIFFERENT NUMBERS and this line said "seats" while
         counting souls — 379 souls at 246 seats, because Constantinople alone
         holds 124. On a surface whose whole argument is that a dot may stand
         for many, conflating the two is not a wording slip. */
      pins.length + ' souls at ' + lastSeats + ' seats \u00b7 ' + lastShown + ' named' +
      (lastHidden ? ', ' + lastHidden + ' name(s) with no room \u2014 hover the pin' : '') +
      ' \u00b7 ' + washes.length + ' souls shown as territory' +
      (lastSky ? ' \u00b7 sky: ' + lastConj + ' conjunction(s), ' + lastGath +
                 ' gathering(s) of ' + lastSky + ' computed at giza' : '') +
      (lastHalley ? ' \u00b7 ' + lastHalley + ' halley return(s), seen from everywhere' : '') +
      ' \u00b7 ' +
      (t.silent + t.unplaced) + ' of ' + t.souls + ' carry no place this map can honestly draw ' +
      '(' + t.silent + ' myth or unrecorded, ' + t.unplaced + ' named but unresolved) \u2014 they are not on it. ' +
      'Seats from GeoNames (CC BY 4.0); coastline Natural Earth.';
  }

  /* One place sets the window, so the slider, the wheel and the dial cannot
     drift apart or clamp differently. */
  function setEdge(edge) {
    hi = Math.max(YEAR_MIN + 10, Math.min(YEAR_MAX, Math.round(edge)));
    lo = hi - APERTURE;
    var el = mounted;
    if (el) {
      var sl = el.querySelector('.mp-slider');
      if (sl && +sl.value !== hi) sl.value = hi;
      var d = el.querySelector('.mp-dial-hand');
      if (d) d.setAttribute('transform', 'rotate(' + ((hi % APERTURE) / APERTURE * 360).toFixed(1) + ' 13 13)');
      /* FOUND BY THE PROBE, 4 Sep: this call was missing and the chronometer
         track rendered nothing at all — no ticks, no window band, no Halley
         marks. The feature was dead and the surface looked fine, which is
         exactly the class of failure a probe exists to catch and an eye does
         not. Draw the track before the map so the two never disagree. */
      ruler();
    }
    draw();
  }

  /* ── THE CHRONOMETER · 4 Sep ──────────────────────────────────────────────
     A bare range input tells a reader nothing: the handle sits a third of the
     way along and that is all they know. A chronometer has to answer three
     questions at a glance — WHERE AM I in the whole span, HOW WIDE is the
     window I am holding, and WHAT IS NEAR that I might want to turn toward.

     So the track carries a millennium scale, a lit band showing the aperture
     at true width against all 6,026 years (at one Halley that band is barely
     a hair, which is honest and worth seeing), and the rare sky events as
     marks a reader can steer by. Halley and the gatherings only — the 248
     conjunctions would be a picket fence, and a scale you cannot read past is
     not a scale. */
  function ruler() {
    var el = mounted; if (!el) return;
    var sv = el.querySelector('.mp-ruler'), span = YEAR_MAX - YEAR_MIN;
    var X = function (y) { return (y - YEAR_MIN) / span * 1000; };
    var h = '', y;

    for (y = -4000; y <= YEAR_MAX; y += 250)
      h += '<line class="mp-tick" x1="' + X(y).toFixed(1) + '" y1="20" x2="' + X(y).toFixed(1) + '" y2="26"/>';
    for (y = -4000; y <= YEAR_MAX; y += 1000) {
      h += '<line class="mp-tick mp-tickM" x1="' + X(y).toFixed(1) + '" y1="16" x2="' + X(y).toFixed(1) + '" y2="26"/>';
      h += '<text class="mp-rlab" x="' + X(y).toFixed(1) + '" y="12">' +
           (y < 0 ? Math.abs(y) / 1000 + 'k bc' : (y === 0 ? '0' : 'ad ' + y)) + '</text>';
    }
    if (comets) comets.forEach(function (e) {
      h += '<line class="mp-rhal" x1="' + X(e.y).toFixed(1) + '" y1="27" x2="' + X(e.y).toFixed(1) + '" y2="33"/>';
    });
    if (sky) sky.filter(function (e) { return e.kind === 'gathering'; }).forEach(function (e) {
      h += '<circle class="mp-rgath" cx="' + X(e.y).toFixed(1) + '" cy="30" r="2"/>';
    });
    /* the aperture, at true width — a hair at 76 years, the world at 3000 */
    h += '<rect class="mp-rwin" x="' + X(lo).toFixed(1) + '" y="15" width="' +
         Math.max(0.8, X(hi) - X(lo)).toFixed(2) + '" height="12"/>';
    sv.innerHTML = h;
  }

  function yr(y) { return y < 0 ? Math.abs(y) + ' BC' : 'AD ' + y; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── LIVING WITH THE HALL'S CLICK ────────────────────────────────────────
     hall.html toggles `scene-bare` on ANY click that is not a control and did
     not drag. A map is nothing but clicking, so every pin press would also
     strip the hall behind it. The timeline met this at its own controls and
     answered with stopPropagation rather than by teaching hall.html about a
     new id — the surface owns its clicks. Same answer here, for the same
     reason: this file stays additive, and hall.html keeps one rule instead
     of a list of exceptions. */
  function containClicks(el) {
    ['click', 'pointerdown'].forEach(function (t) {
      el.addEventListener(t, function (e) { e.stopPropagation(); });
    });
  }

  /* ── THE TWO SURFACES ARE EXCLUSIVE ──────────────────────────────────────
     The timeline reveals on `scene-bare`, the map on `scene-map`, and nothing
     stops both classes standing at once — two full-bleed instruments over one
     another, each unreadable. WHEN and WHERE are separate faculties and must
     render in separate places (Front Desk Triage): the map takes the screen,
     or the timeline does. The timeline is the proven instrument, so the map
     is the one that yields — it clears scene-bare on the way in and restores
     nothing on the way out, leaving the hall as the reader left it. */
  function takeScreen() { document.body.classList.remove('scene-bare'); }

  /* ── THE FACULTY RAIL · top of the page ──────────────────────────────────
     A rail, not a button, because WHERE is the second of three faculties and
     the graph is coming. One icon now; the shape holds the next without a
     second bespoke trigger and without another pairwise exclusivity rule.

     WHY IT IS NOT IN <header>. `.hall-chrome` hides on scene-bare, and the
     map's own scrim sits at z-index 3 over the header's z-index 1 — an icon
     in the header would vanish behind the very surface it opened, leaving no
     way back out. A view with no way out of it is a trap, which is the rule
     #scene-hint already exists to keep. So: fixed, z-index 5, above every
     surface, present whether the reading is bared or not.

     It is a <button>, which hall.html's CONTROLS selector already matches, so
     isControl exempts it from the click-to-bare toggle with no new rule. */
  function rail() {
    var r = document.getElementById('amenti-faculties');
    if (r) return r;

    var css = document.createElement('style');
    css.textContent = [
      '#amenti-faculties{position:fixed;z-index:5;top:1.15rem;right:1.25rem;',
      '  display:flex;gap:6px;align-items:center}',
      '#amenti-faculties button{display:grid;place-items:center;width:34px;height:34px;',
      '  padding:0;border:1px solid rgba(120,150,185,.28);border-radius:4px;cursor:pointer;',
      '  background:rgba(10,14,22,.55);color:#8fa2ba;backdrop-filter:blur(3px);',
      '  transition:color .2s,border-color .2s,background .2s}',
      '#amenti-faculties button:hover{color:#a9edff;border-color:rgba(93,208,232,.55);',
      '  background:rgba(12,20,30,.8)}',
      '#amenti-faculties button.on{color:#5fd0e8;border-color:rgba(93,208,232,.75);',
      '  background:rgba(12,24,34,.9)}',
      '#amenti-faculties button svg{width:17px;height:17px;fill:none;stroke:currentColor;',
      '  stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}',
      /* the label names the faculty on hover — a reader must always know which
         faculty is speaking, and an unlabelled icon does not tell them */
      '#amenti-faculties button::after{content:attr(data-label);position:absolute;',
      '  top:38px;right:0;font:400 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;',
      '  text-transform:uppercase;color:#8fa2ba;background:rgba(8,12,20,.9);',
      '  padding:5px 7px;border-radius:3px;white-space:nowrap;opacity:0;',
      '  pointer-events:none;transition:opacity .15s}',
      '#amenti-faculties button:hover::after{opacity:1}',
      '#amenti-faculties button{position:relative}',
      '@media (max-width:560px){#amenti-faculties{top:.8rem;right:.9rem}',
      '  #amenti-faculties button{width:30px;height:30px}}'
    ].join('\n');
    document.head.appendChild(css);

    r = document.createElement('div');
    r.id = 'amenti-faculties';
    document.body.appendChild(r);
    return r;
  }

  /* A faculty registers itself; it does not learn about the others. */
  function addFaculty(id, label, svg, onToggle, isOpen) {
    var r = rail();
    if (document.getElementById(id)) return;
    var b = document.createElement('button');
    b.id = id; b.type = 'button';
    b.setAttribute('data-label', label);
    b.setAttribute('aria-label', label);
    b.innerHTML = svg;
    b.addEventListener('click', function () { onToggle(); syncRail(); });
    b._isOpen = isOpen;
    r.appendChild(b);
  }

  function syncRail() {
    var r = document.getElementById('amenti-faculties');
    if (!r) return;
    [].forEach.call(r.children, function (b) {
      if (b._isOpen) b.classList.toggle('on', !!b._isOpen());
    });
  }

  /* a globe with a meridian — WHERE, not a pin: a pin is what the map draws,
     and the icon for the faculty should not be the mark of one of its tiers */
  var ICON_MAP =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>' +
    '<path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/></svg>';

  function trigger() {
    addFaculty('fac-map', 'where', ICON_MAP, function () {
      document.body.classList.contains('scene-map') ? close() : open();
    }, function () {
      return document.body.classList.contains('scene-map');
    });
    return document.getElementById('fac-map');
  }

  /* ESCAPE CLOSES THE MAP FIRST. hall.html already binds Escape to restoring
     the hall from scene-bare; if the map is up, that is not what the reader
     means by escape. Bound in the CAPTURE phase so this runs before the
     hall's own listener, and stopped only when the map is actually open —
     otherwise the hall's rule stands untouched. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!document.body.classList.contains('scene-map')) return;
    e.stopPropagation();
    close();
  }, true);

  /* ── the public door ────────────────────────────────────────────────────── */

  function open(opts) {
    return load().then(function () {
      var el = mount();
      containClicks(el);
      takeScreen();
      var sl = el.querySelector('.mp-slider');
      if (!sl.dataset.wired) {
        sl.dataset.wired = '1';
        sl.addEventListener('input', function () { setEdge(+sl.value); });

        /* THE APERTURE BUTTONS. Changing the aperture holds the LEADING EDGE
           still and moves the trailing one, so narrowing does not carry the
           reader somewhere else — the year they were looking at stays put and
           the past closes in behind it. */
        el.querySelectorAll('.mp-ap button').forEach(function (b) {
          b.addEventListener('click', function () {
            APERTURE = +b.getAttribute('data-ap');
            el.querySelectorAll('.mp-ap button').forEach(function (x) {
              x.classList.toggle('on', +x.getAttribute('data-ap') === APERTURE);
            });
            setEdge(hi);
          });
        });

        /* ── THE WHEEL · time under the fingers ────────────────────────────
           Scrolling the map scrubs time: down is forward, up is back, at one
           twentieth of the aperture a notch — so a narrow window steps in
           years and a wide one steps in centuries, and the gesture feels the
           same at every scale. preventDefault, or the page scrolls under the
           surface while the reader thinks they are moving time. */
        el.addEventListener('wheel', function (e) {
          e.preventDefault();
          var step = Math.max(1, Math.round(APERTURE / 20));
          setEdge(hi + (e.deltaY > 0 ? step : -step));
        }, { passive: false });

        /* ── THE DIAL · clockwise is forward ───────────────────────────────
           A camera ring, as asked for. The angle travelled is what counts,
           not where the pointer is, so a reader can keep turning past the
           top of the circle without the year jumping. Clockwise advances,
           counter-clockwise reverses; a full turn moves one aperture. */
        var dial = el.querySelector('.mp-dial'), turning = false, lastAng = 0;
        function angleAt(ev) {
          var r = dial.getBoundingClientRect();
          return Math.atan2(ev.clientY - (r.top + r.height / 2),
                            ev.clientX - (r.left + r.width / 2));
        }
        dial.addEventListener('pointerdown', function (ev) {
          turning = true; lastAng = angleAt(ev); dial.setPointerCapture(ev.pointerId);
          dial.classList.add('turning');
        });
        dial.addEventListener('pointermove', function (ev) {
          if (!turning) return;
          var a = angleAt(ev), d = a - lastAng;
          /* cross the -pi/pi seam without a jump of a whole revolution */
          if (d >  Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          lastAng = a;
          setEdge(hi + d / (2 * Math.PI) * APERTURE);
        });
        ['pointerup', 'pointercancel'].forEach(function (t) {
          dial.addEventListener(t, function () { turning = false; dial.classList.remove('turning'); });
        });
      }
      if (opts && typeof opts.year === 'number') setEdge(opts.year);
      else setEdge(hi);
      draw();
      document.body.classList.add('scene-map');
      syncRail();
      return el;
    }, function (e) {
      /* A register that will not load is stated, never papered over. */
      var el = mount();
      el.querySelector('.mp-note').textContent = 'the map cannot draw \u2014 ' + e.message;
      document.body.classList.add('scene-map');
    });
  }

  function close() { document.body.classList.remove('scene-map'); syncRail(); }

  /* ── place(keys) · THE SAME DOOR THE TIMELINE HAS · 4 Sep ─────────────────
     SEEN LIVE: the hall answered about a figure and the map showed whatever
     window it had been left on. Three surfaces answering three different
     questions, and a reader clicking between them with no reason to think
     they were unrelated.

     The timeline solved this with place(keys) and the box calls it. The map
     had no such door, so it could not be told. It has one now, and it takes
     the same argument in the same shape — one key or several, the FIRST
     placeable wins — so the box drives both instruments identically and
     neither can drift from the other.

     THE APERTURE IS CHOSEN, NOT FIXED. The narrowest planetary window that
     still contains the whole life: a 63-year life gets one Halley, a
     seven-year reign gets one Jupiter. The edge lands on the death year so
     the soul is present at the leading edge rather than halfway out of view.

     Eternals are skipped for the timeline's own reason: Apollo runs 10000 BC
     to 3000 BC, and an aperture that holds a 7,000-year bar is the whole
     register, which places nobody. */
  function place(keys) {
    var list = [].concat(keys || []).filter(Boolean).map(function (k) {
      return String(k.k || k.n || k).toLowerCase();
    });
    if (!list.length) return Promise.resolve(false);
    return load().then(function () {
      var byKey = {};
      geo.souls.forEach(function (s) { byKey[s.k] = s; byKey[s.n.toLowerCase()] = s; });
      var soul = null;
      for (var i = 0; i < list.length && !soul; i++) {
        var c = byKey[list[i]];
        if (!c || typeof c.b !== 'number' || typeof c.d !== 'number') continue;
        if (c.d - c.b >= 1000) continue;          /* an eternal places nobody */
        soul = c;
      }
      if (!soul) return false;

      /* FOUND BY TEST, 4 Sep: "narrowest aperture that contains the life" sent
         an 80-YEAR LIFE TO "ALL OF IT" — Odysseus at 80 and Plato at 80 both
         overshoot Halley's 76 by four years, and the next rung is 3,000. A
         four-year overshoot cost three thousand years of view, and "all of it"
         places nobody, which is the very thing the eternals rule guards.

         The ladder is planetary and therefore has real gaps; the fix is to
         accept the widest true window rather than fall off the end of it. A
         life a little longer than the aperture is still READ at the leading
         edge — the death year is on screen and most of the life behind it.
         Only a span that is genuinely beyond the ladder gets the whole
         register, and then it is a statement rather than an accident. */
      var span = Math.max(1, soul.d - soul.b);
      var widest = APERTURES[APERTURES.length - 2];   /* one Halley, 76 */
      APERTURE = null;
      for (var a = 0; a < APERTURES.length; a++)
        if (APERTURES[a] >= span) { APERTURE = APERTURES[a]; break; }
      if (APERTURE === null || (APERTURE === APERTURES[APERTURES.length - 1] && span <= widest * 3))
        APERTURE = widest;
      var el = mount();
      el.querySelectorAll('.mp-ap button').forEach(function (x) {
        x.classList.toggle('on', +x.getAttribute('data-ap') === APERTURE);
      });
      containClicks(el);
      takeScreen();
      setEdge(soul.d);
      anchorKey = soul.k;
      draw();
      document.body.classList.add('scene-map');
      syncRail();
      return true;
    }, function () { return false; });
  }

  /* The trigger mounts itself the moment the file loads, so wiring the map
     into hall.html is ONE script tag and no edit to its logic. */
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', trigger);
  else trigger();

  /* addFaculty is exported so the GRAPH can join the rail when it is ready,
     without touching this file or hall.html:
         AmentiMap.addFaculty('fac-graph','who',svg,toggleFn,isOpenFn)  */
  window.AmentiMap = { open: open, close: close, place: place, trigger: trigger,
                       addFaculty: addFaculty, syncRail: syncRail };
})();
