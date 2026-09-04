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
  var rivers = null, peaks = null;

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
  /* ── ZOOM · 4 Sep ─────────────────────────────────────────────────────────
     K is the scale, TX/TY the pan, in viewBox units. Everything geographic
     lives inside a <g> that carries this transform; everything a reader READS
     is counter-scaled by 1/K so a pin stays a pin and a name stays legible at
     every zoom. That is the whole trick, and it is also the point: the labels
     do not grow, the WORLD grows between them, so at the Aegean there is room
     for names that could not fit at world scale. 294 dropped labels at AD 2000
     is not a culling problem, it is a scale problem. */
  var K = 1, TX = 0, TY = 0, K_MIN = 1, K_MAX = 14;
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
      /* ── RIVERS AND PEAKS · 4 Sep ─────────────────────────────────────────
         Natural Earth, public domain, the same provenance as the coastline.
         Both are OPTIONAL: a map without them is the map we had this morning,
         and neither is allowed to cost the surface if it fails to load.

         THEY HOLD LON/LAT, NOT SCREEN COORDINATES, unlike WORLD.json whose
         projection is baked in. That is the first step of the un-baking #65
         needs, taken here because a new register may as well be born right. */
      get(RAW + 'RIVERS.json', true).then(function (d) { rivers = d.rivers || []; },
                                          function ()  { rivers = null; }),
      get(RAW + 'PEAKS.json', true).then(function (d) { peaks = d.peaks || []; },
                                         function ()  { peaks = null; }),
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
      '  padding:26px 84px 22px 262px;gap:0}',
      /* min-height:0 or the SVG refuses to shrink and shoves the slider and the
         attribution off the bottom of the viewport — seen live, both gone. */
      '#amenti-map svg{flex:1 1 auto;min-height:0;width:100%;overflow:visible}',

      /* the land: an outline, not a fill — the map is a chart, not a picture */
      /* the land is now an OUTLINE over the relief, not a fill — a fill would
         bury the terrain it sits on */
      '#amenti-map .mp-land{fill:#0e1420;stroke:#243044;stroke-width:.6;',
      '  vector-effect:non-scaling-stroke}',
      /* the sea, behind everything, so the coast reads as an edge */
      '#amenti-map .mp-sea{fill:#080d16}',
      '#amenti-map .mp-grat{stroke:#1a2334;stroke-width:.4;fill:none;vector-effect:non-scaling-stroke}',

      /* A WASH. Soft, edgeless, large, low. Nothing about it reads as a point. */
      '#amenti-map .mp-wash{fill:#4a6c8f;fill-opacity:.16;stroke:none;pointer-events:all;cursor:default}',
      '#amenti-map .mp-wash:hover{fill-opacity:.30}',
      '#amenti-map .mp-washlabel{fill:#7d93ad;font-size:7.5px;letter-spacing:.06em;',
      '  text-anchor:middle;pointer-events:none;text-transform:lowercase}',

      /* A PIN. Small, hard, bright, crisp. Nothing about it reads as an area. */
      /* A MARK IS A MARK AT ANY ZOOM. Radii and type are divided by the scale
         so they hold their size on screen while the world opens up beneath. */
      '#amenti-map .mp-pin{fill:#5fd0e8;fill-opacity:.85;stroke:#081018;',
      '  stroke-width:.35;cursor:pointer;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-land{vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-grat{vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-zoomctl{position:absolute;right:26px;bottom:150px;z-index:6;',
      '  display:flex;flex-direction:column;gap:1px;background:#23303f;',
      '  border:1px solid #23303f;border-radius:4px;overflow:hidden}',
      '#amenti-map .mp-zoomctl button{width:34px;height:30px;padding:0;border:0;',
      '  background:rgba(10,14,22,.9);color:#8fa2ba;cursor:pointer;',
      '  font:400 15px/1 ui-monospace,Menlo,monospace}',
      '#amenti-map .mp-zoomctl button[data-z="fit"]{font-size:10.5px;letter-spacing:.08em}',
      '#amenti-map .mp-zoomctl button:hover{color:#a9edff;background:rgba(12,24,34,.95)}',
      '#amenti-map .mp-zoomctl button:focus-visible{outline:2px solid #5fd0e8;outline-offset:-2px}',
      /* the list */
      '#amenti-map .mp-list{position:absolute;left:26px;top:74px;bottom:150px;width:210px;',
      '  z-index:6;display:flex;flex-direction:column;pointer-events:auto}',
      '#amenti-map .mp-listhead{font:400 10.5px/1.4 ui-monospace,Menlo,monospace;',
      '  color:#6f8098;padding-bottom:7px;border-bottom:1px solid #1e2836;margin-bottom:5px}',
      '#amenti-map .mp-listbody{overflow-y:auto;overflow-x:hidden;flex:1;',
      '  scrollbar-width:thin;scrollbar-color:#2b3a50 transparent}',
      '#amenti-map .mp-listbody::-webkit-scrollbar{width:6px}',
      '#amenti-map .mp-listbody::-webkit-scrollbar-thumb{background:#2b3a50;border-radius:3px}',
      '#amenti-map .mp-li{font:400 12.5px/1.45 ui-monospace,Menlo,monospace;color:#9fb1c7;',
      '  padding:2px 6px 2px 0;cursor:default;white-space:nowrap;overflow:hidden;',
      '  text-overflow:ellipsis;border-left:2px solid transparent;padding-left:7px}',
      '#amenti-map .mp-li:hover,#amenti-map .mp-li.mp-lit{color:#eaf6ff;',
      '  border-left-color:#5fd0e8;background:rgba(95,208,232,.07)}',
      '#amenti-map .mp-li .mp-liwhere{color:#5d6e84;font-size:11px}',
      '#amenti-map .mp-seat.mp-lit .mp-pin{fill:#a9edff;fill-opacity:1}',
      '#amenti-map .mp-seat.mp-lit .mp-name{opacity:1;fill:#eaf6ff}',
      '#amenti-map .mp-zoomlab{position:absolute;right:70px;bottom:152px;',
      '  font:400 11px/1 ui-monospace,Menlo,monospace;color:#6f8098;pointer-events:none}',
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
      /* ── THE INSTRUMENT BAND · redesigned 4 Sep ──────────────────────────
         SEEN LIVE: two full-height neon rails stood at the left edge with
         their labels colliding, the readout sat in a selection highlight, the
         ruler was squeezed into the right half, and the hint named a dial that
         had been deleted. It was a set of features, not a surface.

         THE MISTAKE WAS A LITERAL PORT. Page2's rails work because Page2 is a
         helix on an empty black field — its margins are nothing. On a world
         map the left edge is THE PACIFIC. Two bars were laid over content, and
         the boldest thing on the page became a control rather than the map.

         So: one band along the bottom, nothing floating, and the boldness
         spent in a single place — the map itself. The YEAR is the only large
         element, because it is the one thing a reader needs from across a
         room. The ruler becomes the time control: it already draws all 6,026
         years with the window band and Halley's returns, so dragging it is the
         obvious gesture and it retires the rail entirely. A strip of time you
         scrub is a thing people know; a floating bar is not. */
      '#amenti-map .mp-head{display:flex;justify-content:space-between;',
      '  align-items:baseline;gap:10px 22px;margin-bottom:10px;flex-wrap:wrap;flex:0 0 auto}',
      '#amenti-map .mp-titlewrap{display:flex;align-items:center;gap:14px}',
      '#amenti-map .mp-title{color:#8fa2ba;font-size:13px;letter-spacing:.02em}',
      '#amenti-map .mp-atlas-btn{font:400 11.5px/1 ui-monospace,Menlo,monospace;',
      '  color:#7d8ea6;background:transparent;border:1px solid #23303f;border-radius:3px;',
      '  padding:5px 10px;cursor:pointer;letter-spacing:.06em}',
      '#amenti-map .mp-atlas-btn:hover{color:#c3d3e6;border-color:#33637a}',
      '#amenti-map .mp-atlas-btn[aria-pressed="true"]{color:#0a1018;background:#8fa8c4;',
      '  border-color:#8fa8c4}',
      '#amenti-map .mp-atlas-btn:focus-visible{outline:2px solid #5fd0e8;outline-offset:2px}',
      /* THE BLUEPRINT · the default. Flat land, a hard coast, no terrain. */
      /* ── THE GROUND DOES NOT CATCH THE POINTER · 4 Sep ────────────────────
         The relief covers the whole surface, and an SVG <image> takes pointer
         events by default. The wheel handler lives on the <svg> and relies on
         the event reaching it, so the moment terrain was drawn the zoom went
         dead under the cursor — the layer that is only there to be LOOKED at
         was intercepting the gesture. Same for the sea rect and the coastline
         outline: none of them is a target, so none of them may behave like
         one. Only pins and washes answer the pointer. */
      '#amenti-map .mp-relief,#amenti-map .mp-sea,#amenti-map .mp-land,',
      '#amenti-map .mp-skygeo,#amenti-map .mp-sky,',
      '#amenti-map .mp-graticule{pointer-events:none}',
      /* water reads as water: a cool line, thin, under everything a reader
         is meant to click */
      '#amenti-map .mp-river{fill:none;stroke:#3f6f8f;stroke-width:.5;opacity:.62;',
      '  vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}',
      '#amenti-map.mp-atlas .mp-river{stroke:#4d86ad;opacity:.75}',
      '#amenti-map .mp-peak{fill:none;stroke:#8a9bb0;stroke-width:.6;opacity:.75;',
      '  vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-peak.mp-dep{stroke:#6b7c91;opacity:.55}',
      '#amenti-map .mp-peaklab{fill:#8fa2ba;text-anchor:middle;opacity:.8;',
      '  paint-order:stroke;stroke:#070b12;stroke-width:1.4px;stroke-linejoin:round}',
      '#amenti-map .mp-rivers,#amenti-map .mp-peaks{pointer-events:none}',
      '#amenti-map .mp-relief{display:none;opacity:.95}',
      '#amenti-map.mp-atlas .mp-relief{display:block}',
      '#amenti-map.mp-atlas .mp-land{fill:none;stroke:#31435c}',
      '#amenti-map .mp-key{display:flex;gap:18px;align-items:center;font-size:12px;color:#8fa2ba}',
      '#amenti-map .mp-key i{display:inline-block;vertical-align:middle;margin-right:7px}',
      '#amenti-map .mp-key .k-pin{width:7px;height:7px;border-radius:50%;background:#5fd0e8}',
      '#amenti-map .mp-key .k-wash{width:16px;height:9px;border-radius:2px;background:rgba(74,108,143,.42)}',
      '#amenti-map .mp-key .k-none{width:16px;height:9px;border:1px dashed #3c4a5e;border-radius:2px}',
      '#amenti-map .mp-key .k-sky{width:8px;height:8px;border:1px solid #d8a24a;transform:rotate(45deg)}',

      /* the band: year · aperture · ruler, on one line, aligned to a baseline */
      '#amenti-map .mp-foot{display:flex;align-items:center;gap:22px;margin-top:14px;',
      '  flex:0 0 auto;user-select:none}',
      /* THE YEAR IS THE FACE OF THE INSTRUMENT. Everything else on this band
         is a means of changing it, so it is the only thing set large. */
      '#amenti-map .mp-read{color:#f0f5fb;font-size:27px;letter-spacing:.01em;',
      '  font-variant-numeric:tabular-nums;white-space:nowrap;flex:0 0 auto;',
      '  min-width:250px;line-height:1}',
      '#amenti-map .mp-ap{display:flex;gap:0;flex:0 0 auto;',
      '  border:1px solid #23303f;border-radius:4px;overflow:hidden}',
      '#amenti-map .mp-ap button{position:relative;font:400 13px/1 ui-monospace,Menlo,monospace;',
      '  color:#7d8ea6;background:transparent;cursor:pointer;border:0;',
      '  border-right:1px solid #23303f;padding:9px 12px;min-width:42px}',
      '#amenti-map .mp-ap button:last-child{border-right:0}',
      '#amenti-map .mp-ap button:hover{color:#c3d3e6;background:rgba(95,208,232,.06)}',
      '#amenti-map .mp-ap button.on{color:#0a1018;background:#e8c98a}',
      '#amenti-map .mp-ap button:focus-visible{outline:2px solid #5fd0e8;outline-offset:-2px}',
      '#amenti-map .mp-ap button::after{content:attr(data-name);position:absolute;',
      '  bottom:40px;left:50%;transform:translateX(-50%);font:400 12px/1 ui-monospace,',
      '  Menlo,monospace;color:#dbe4f0;background:rgba(8,12,20,.96);border:1px solid #2b3a50;',
      '  padding:7px 9px;border-radius:3px;white-space:nowrap;opacity:0;',
      '  pointer-events:none;transition:opacity .15s}',
      '#amenti-map .mp-ap button:hover::after,',
      '#amenti-map .mp-ap button:focus-visible::after{opacity:1}',

      /* THE RULER IS THE CONTROL, not a readout beside one */
      '#amenti-map .mp-chrono{position:relative;flex:1 1 auto;min-width:0;',
      '  cursor:ew-resize;padding:2px 0}',
      '#amenti-map .mp-ruler{display:block;width:100%;height:40px;overflow:visible}',
      '#amenti-map .mp-chrono:hover .mp-rwin{fill-opacity:.4}',
      '#amenti-map .mp-tick{stroke:#2c3a4d;stroke-width:1;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-tickM{stroke:#43566e}',
      '#amenti-map .mp-rlab{fill:#7d8ea6;font-size:10px;text-anchor:middle;',
      '  font-family:ui-monospace,Menlo,monospace}',
      '#amenti-map .mp-rhal{stroke:#e8c98a;stroke-width:1;opacity:.75;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-rgath{fill:#d8a24a;opacity:.8}',
      '#amenti-map .mp-rwin{fill:#5fd0e8;fill-opacity:.3;stroke:#5fd0e8;stroke-width:1;',
      '  vector-effect:non-scaling-stroke;transition:fill-opacity .15s}',
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
          '<div class="mp-titlewrap">' +
            '<div class="mp-title">where the souls stood, and what stood over Giza</div>' +
            /* ── TWO VIEWS · 4 Sep ────────────────────────────────────────────
               THE BLUEPRINT IS THE DEFAULT, and deliberately. It is the map as
               a chart: flat land, a hard coast, nothing on it that is not a
               claim. Every mark reads at once because nothing competes with
               it, and a reader looking for where a soul stood is not reading
               terrain.

               THE ATLAS is the same map with real ground under it — Natural
               Earth relief, the elevation that explains why Mesopotamia is
               where it is and why the passes matter. It is the better picture
               and the worse instrument, so it is a CHOICE rather than the
               state a reader is dropped into. */
            '<button type="button" class="mp-atlas-btn" aria-pressed="false">atlas</button>' +
          '</div>' +
          '<div class="mp-key">' +
            '<span><i class="k-pin"></i>a seat \u2014 here</span>' +
            '<span><i class="k-wash"></i>a territory \u2014 somewhere in here</span>' +
            '<span><i class="k-none"></i>no honest place \u2014 not drawn</span>' +
            '<span><i class="k-sky"></i>the sky \u2014 seen from giza</span>' +
            '<span><i class="k-river"></i>rivers and named summits</span>' +
          '</div>' +
        '</div>' +
        '<svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">' +
          '<defs><filter id="mp-glow" x="-120%" y="-120%" width="340%" height="340%">' +
            '<feGaussianBlur stdDeviation="1.5" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/>' +
            '<feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            /* ── THE RELIEF, CLIPPED TO THE COASTLINE · 4 Sep ─────────────────
               Natural Earth's 1:50m shaded relief, public domain, the same
               source as WORLD.json and on the same equirectangular grid — so
               it registers pixel for pixel with no reprojection and no
               guessing. Tinted into this map's palette rather than the atlas
               brown, and CLIPPED TO THE LAND PATH so the terrain stops at the
               coast and the sea stays flat. An unclipped relief would put
               modelling on the ocean floor, which is real but is not what this
               map is about, and would read as texture rather than as ground. */
            '<clipPath id="mp-landclip"><path class="mp-clip"/></clipPath>' +
            '</defs>' +
          '<g class="mp-view">' +
            '<rect class="mp-sea" x="0" y="0" width="1000" height="500"/>' +
            '<g class="mp-graticule"></g>' +
            '<image class="mp-relief" href="" x="0" y="0" width="1000" height="500" ' +
              'preserveAspectRatio="none" clip-path="url(#mp-landclip)"></image>' +
            '<path class="mp-land"></path>' +
            '<g class="mp-rivers"></g><g class="mp-peaks"></g>' +
            '<g class="mp-washes"></g><g class="mp-pins"></g>' +
            /* ── THE SKY HAS TWO HALVES · 4 Sep ────────────────────────────
               Found when zoom landed. The Giza diamond, its label, the signs
               standing over it and Jupiter's return line are ON THE EARTH —
               they must move with it. The band, the planet counts and Halley
               are NOT on the earth; that is the whole reason the band exists,
               and they must stay put.
               One group could not be both, so the observatory drifted off
               Giza the moment a reader zoomed. Two groups, on the right sides
               of the transform. */
            '<g class="mp-skygeo"></g>' +
          '</g><g class="mp-sky"></g>' +
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
            '<svg class="mp-ruler" viewBox="0 0 1000 42" preserveAspectRatio="none"></svg>' +
            '</span>' +
        '</div>' +
        '<div class="mp-note"></div>' +
                '<div class="mp-zoom">drag the years below to travel \u00b7 scroll or use \u2212 / + to zoom \u00b7 drag to move \u00b7 double-click to fit</div>' +
      '</div>' +
      '<div class="mp-hit"></div><div class="mp-zoomlab"></div>' +
      /* ── ZOOM THAT DOES NOT DEPEND ON A WHEEL · 4 Sep ──────────────────────
         The wheel was reported dead twice and fixed twice on theory. A gesture
         that cannot be seen cannot be checked by a reader, and a surface whose
         only way in is a gesture has no way in at all on a device without one.
         Buttons are the floor: they work, they are visible, and they say what
         the wheel is for. */
      '<div class="mp-zoomctl">' +
        '<button type="button" data-z="out" aria-label="zoom out">\u2212</button>' +
        '<button type="button" data-z="in" aria-label="zoom in">+</button>' +
        '<button type="button" data-z="fit" aria-label="fit the world">fit</button>' +
      '</div>' +
      /* ── THE LIST · 4 Sep ─────────────────────────────────────────────────
         Seat names on the map are 5.6px because four hundred of them must not
         collide. That is right for the map and wrong for READING, and the two
         needs were fighting. So the same souls are listed at a legible size
         down the left, where there is room, and the two halves point at each
         other: hover a name and its seat lights; hover a seat and its name
         lights. The map answers WHERE, the list answers WHO, and neither has
         to compromise for the other. */
      '<div class="mp-list"><div class="mp-listhead"></div><div class="mp-listbody"></div></div>';
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

  function applyView() {
    var el = mounted; if (!el) return;
    var g = el.querySelector('.mp-view');
    if (g) g.setAttribute('transform', 'translate(' + TX.toFixed(2) + ' ' + TY.toFixed(2) +
                                       ') scale(' + K.toFixed(4) + ')');
    /* ── COUNTER-SCALE IN JS, NOT CSS · 4 Sep ──────────────────────────────
       This was `font-size: calc(5.6px * var(--mp-inv))` — a custom property
       inside calc() on SVG text. Safari has long been unreliable with exactly
       that combination, and when it fails the size computes to nothing: every
       name, glyph and territory label disappears at once and the map reads as
       completely broken rather than as one CSS rule not applying.

       A presentation attribute set from JS has no such doubt. It is more
       lines and it works in every browser, which is the correct trade for the
       one property the whole zoom depends on. */
    var inv = 1 / K;
    var set = function (sel, base) {
      var n = el.querySelectorAll(sel);
      for (var i = 0; i < n.length; i++) n[i].setAttribute('font-size', (base * inv).toFixed(3));
    };
    set('.mp-name',      5.6);
    set('.mp-glyph',     6.4);
    set('.mp-over',      7.0);
    set('.mp-washlabel', 7.5);
    var z = el.querySelector('.mp-zoomlab');
    if (z) z.textContent = K > 1.02 ? '\u00d7' + K.toFixed(1) + ' \u00b7 double-click to fit' : '';
  }

  function draw() {
    var el = mounted, svg = el.querySelector('svg');
    el.querySelector('.mp-land').setAttribute('d', world.path);
    /* the clip carries the same path, so the two can never disagree */
    el.querySelector('.mp-clip').setAttribute('d', world.path);
    /* THE BLUEPRINT PAYS NOTHING FOR THE ATLAS. The relief is 240 KB and the
       default view does not draw it, so the fetch waits until a reader asks. */
    var relief = el.querySelector('.mp-relief');
    if (relief && el.classList.contains('mp-atlas') && !relief.getAttribute('href')) {
      relief.setAttribute('href', RAW + 'RELIEF.jpg');
      /* If it will not load, the map is a chart without terrain — which is
         exactly what it was yesterday, and still true. No fallback, no
         apology, and nothing drawn in its place. */
      relief.addEventListener('error', function () { relief.remove(); });
    }

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

    /* ── THE RIVERS · drawn by rank, revealed by zoom ────────────────────────
       Natural Earth ranks a river 1 (a great one) to 12 (a minor one). At
       world scale only the first ranks are drawn: 909 segments at once is a
       net over the continents, and a river nobody can trace is not
       information. Going in reveals the tributaries, which is the same rule
       the labels follow — the aperture decides what a reader can be shown.

       Rivers matter here beyond decoration. Every early seat on this map sits
       on one, and a trade route follows water long before it follows a road. */
    var gr = el.querySelector('.mp-rivers');
    if (rivers && gr) {
      var maxRank = K < 1.5 ? 3 : K < 3 ? 4 : K < 6 ? 5 : 6;
      var d = '';
      for (var ri = 0; ri < rivers.length; ri++) {
        var rv = rivers[ri];
        if (rv.r > maxRank) break;                 /* sorted by rank */
        var pp = rv.p, seg = '';
        for (var pi = 0; pi < pp.length; pi += 2) {
          var xy2 = proj(pp[pi + 1], pp[pi]);
          seg += (pi ? 'L' : 'M') + xy2[0].toFixed(1) + ' ' + xy2[1].toFixed(1);
        }
        d += seg;
      }
      gr.innerHTML = '<path class="mp-river" d="' + d + '"/>';
    }

    /* ── THE PEAKS · named summits, not ranges ───────────────────────────────
       76 mountains, 9 depressions and the Khyber Pass, each with an elevation
       the record gives in metres. THESE ARE POINTS. A mountain range has no
       agreed boundary and none is drawn: the relief shows the range, this
       names the summit, and the difference is the same one that keeps a
       territory from being a pin.

       Only the highest show at world scale; the rest arrive with the zoom. */
    var gp2 = el.querySelector('.mp-peaks');
    if (peaks && gp2) {
      var floor = K < 1.5 ? 6000 : K < 3 ? 4500 : K < 6 ? 2500 : -500;
      var ph = '', iv3 = 1 / K;
      peaks.forEach(function (pk) {
        if (pk.e < floor && pk.k === 'mountain') return;
        if (pk.k !== 'mountain' && K < 3) return;
        var xy3 = proj(pk.y, pk.x), up = pk.k !== 'depression';
        var a = 2.6 * iv3;
        ph += '<path class="mp-peak' + (up ? '' : ' mp-dep') + '" d="M' +
              (xy3[0] - a).toFixed(2) + ' ' + (xy3[1] + (up ? a : -a)).toFixed(2) +
              'L' + xy3[0].toFixed(2) + ' ' + (xy3[1] - (up ? a : -a)).toFixed(2) +
              'L' + (xy3[0] + a).toFixed(2) + ' ' + (xy3[1] + (up ? a : -a)).toFixed(2) + '"/>';
        if (K >= 2)
          ph += '<text class="mp-peaklab" x="' + xy3[0].toFixed(2) + '" y="' +
                (xy3[1] - 4 * iv3).toFixed(2) + '" font-size="' + (5 * iv3).toFixed(3) + '">' +
                esc(pk.n) + ' \u00b7 ' + pk.e + 'm</text>';
      });
      gp2.innerHTML = ph;
    }

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
      var r = Math.min(4.2, 1.15 + Math.log(p.who.length + 1) * 0.72) / K;
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
      gt.setAttribute('y', (xy[1] + 2.4 / K).toFixed(1));
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
      t.setAttribute('y', (xy[1] - (mark ? 5.4 / K : r + 2.2 / K)).toFixed(1));
      /* HALF-WIDTH, MEASURED NOT GUESSED. At font-size 5.6px a character
         occupies roughly 2.8px, so half of a label is length * 1.4. The first
         value here was 2.5 — nearly double — and it culled 6 of 11 labels in
         a 500 BC window that had ample room. This is the trap the timeline's
         axis note names: the collision test and the placement share this one
         number, so they will agree with each other whether or not it is
         right. It is checked against the font, and the screen is the judge. */
      g._w = label.length * 1.45 / K;
      g._x = xy[0]; g._y = xy[1] - (mark ? 5.4 / K : r + 2.2 / K);
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
          if (Math.abs(x - q.x) < (w + q.w) && Math.abs(y - q.y) < 6.5 / K) { fits = false; break; }
        }
        if (fits) { placed.push({ x: x, y: y, w: w }); shown++; }
        g.classList.toggle('mp-named', fits);
        if (!fits) hidden++;
      });
    lastShown = shown; lastHidden = hidden;

    /* THE LIST, from the same seats the map just drew — one source, so the
       two can never disagree about who is present. */
    var lb = el.querySelector('.mp-listbody'), lh = el.querySelector('.mp-listhead');
    if (lb) {
      var rows = Object.keys(bySeat).map(function (k) { return bySeat[k]; })
        .sort(function (a, b) { return b.who.length - a.who.length || a.place.localeCompare(b.place); });
      var lhtml = '';
      rows.forEach(function (p) {
        var key = p.lat + ',' + p.lon;
        p.who.slice(0, 40).forEach(function (n) {
          lhtml += '<div class="mp-li" data-seat="' + esc(key) + '">' + esc(n) +
                   ' <span class="mp-liwhere">' + esc(p.place) + '</span></div>';
        });
      });
      lb.innerHTML = lhtml || '<div class="mp-li" style="color:#5d6e84">no seat in this window</div>';
      lh.textContent = pins.length + ' here \u00b7 ' + washes.length + ' somewhere';
    }
    applyView();

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
    var h = '', hg = '', bandY = 22;
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
        var gzc = proj(GIZA[0], GIZA[1]), iv = 1 / K;
        var bodies = recent.kind === 'gathering'
          ? ['\u2643', '\u2644', '\u2645', '\u2646']
          : ['\u2643', '\u2644'];
        var span = (bodies.length - 1) * 7 * iv;
        bodies.forEach(function (sg, i) {
          hg += '<text class="mp-sign mp-over" x="' + (gzc[0] - span / 2 + i * 7 * iv).toFixed(2) +
                '" y="' + (gzc[1] - 8 * iv).toFixed(2) + '" font-size="' + (7 * iv).toFixed(3) +
                '">' + sg + '</text>';
        });
        hg += '<text class="mp-obslabel" x="' + gzc[0].toFixed(2) + '" y="' + (gzc[1] - 15 * iv).toFixed(2) +
              '" font-size="' + (5 * iv).toFixed(3) + '">' +
              (recent.kind === 'gathering' ? 'gathering' : 'great conjunction') +
              ' \u00b7 ' + yr(recent.y) + '</text>';
      }

      if (inWin.length) {
        var gz = proj(GIZA[0], GIZA[1]), iv2 = 1 / K, d = 3.2 * iv2;
        /* THE TETHER SPANS BOTH HALVES, so it can only be drawn when the two
           share a coordinate space — that is, unzoomed. Zoomed in, Giza is
           labelled in place and the band speaks for itself; a line drawn
           between two different transforms would land nowhere true. */
        if (K <= 1.01)
          h += '<path class="mp-tether" d="M' + (x - 20) + ' ' + (bandY + 8) +
               'Q' + gz[0].toFixed(1) + ' ' + ((bandY + gz[1]) / 2).toFixed(1) +
               ' ' + gz[0].toFixed(1) + ' ' + (gz[1] - 4).toFixed(1) + '"/>';
        hg += '<path class="mp-obs" d="M' + gz[0].toFixed(2) + ' ' + (gz[1] - d).toFixed(2) +
              'L' + (gz[0] + d).toFixed(2) + ' ' + gz[1].toFixed(2) +
              'L' + gz[0].toFixed(2) + ' ' + (gz[1] + d).toFixed(2) +
              'L' + (gz[0] - d).toFixed(2) + ' ' + gz[1].toFixed(2) + 'Z"/>' +
              '<text class="mp-obslabel" x="' + gz[0].toFixed(2) + '" y="' + (gz[1] + 10 * iv2).toFixed(2) +
              '" font-size="' + (5 * iv2).toFixed(3) + '">computed at giza</text>';
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

        hg += '<line class="mp-return" x1="0" y1="' + gzr[1].toFixed(2) +
              '" x2="1000" y2="' + gzr[1].toFixed(2) + '"/>';
        /* the mark thickens as it closes on Giza — the return is the event */
        var near = 1 - Math.min(1, Math.abs(0.5 - frac) * 2);
        hg += '<text class="mp-jup" x="' + jp[0].toFixed(2) + '" y="' + (gzr[1] + 2.6 / K).toFixed(2) +
              '" font-size="' + (8 / K).toFixed(3) + '" opacity="' +
              (0.45 + 0.55 * (1 - near)).toFixed(2) + '">\u2643</text>';
        hg += '<title>Jupiter\u2019s return: rose due east over Giza in ' + yr(prev.y) +
             ', next in ' + yr(next.y) + ' \u2014 ' + (next.y - prev.y) + ' years. ' +
             'This line is a COUNT to that return along Giza\u2019s latitude, not Jupiter\u2019s position.</title>';
        hg += '<text class="mp-obslabel" x="6" y="' + (gzr[1] - 4 / K).toFixed(2) +
              '" font-size="' + (5 / K).toFixed(3) + '" text-anchor="start">\u2643 returns due east over giza in ' +
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
    var gskygeo = el.querySelector('.mp-skygeo');
    if (gskygeo) gskygeo.innerHTML = hg;

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
      'Seats from GeoNames (CC BY 4.0); ' +
      (el.classList.contains('mp-atlas')
        ? 'coastline, relief, rivers and peaks from Natural Earth.'
        : 'coastline, rivers and peaks from Natural Earth.');
  }

  /* One place sets the window, so the slider, the wheel and the dial cannot
     drift apart or clamp differently. */
  function setEdge(edge) {
    hi = Math.max(YEAR_MIN + 10, Math.min(YEAR_MAX, Math.round(edge)));
    lo = hi - APERTURE;
    var el = mounted;
    if (el) {
      var ap = el.querySelectorAll('.mp-ap button');
      ap.forEach(function (x) { x.classList.toggle('on', +x.getAttribute('data-ap') === APERTURE); });
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
      h += '<line class="mp-tick" x1="' + X(y).toFixed(1) + '" y1="24" x2="' + X(y).toFixed(1) + '" y2="31"/>';
    for (y = -4000; y <= YEAR_MAX; y += 1000) {
      h += '<line class="mp-tick mp-tickM" x1="' + X(y).toFixed(1) + '" y1="19" x2="' + X(y).toFixed(1) + '" y2="31"/>';
      h += '<text class="mp-rlab" x="' + X(y).toFixed(1) + '" y="13">' +
           (y < 0 ? Math.abs(y) / 1000 + 'k bc' : (y === 0 ? '0' : 'ad ' + y)) + '</text>';
    }
    if (comets) comets.forEach(function (e) {
      h += '<line class="mp-rhal" x1="' + X(e.y).toFixed(1) + '" y1="32" x2="' + X(e.y).toFixed(1) + '" y2="39"/>';
    });
    if (sky) sky.filter(function (e) { return e.kind === 'gathering'; }).forEach(function (e) {
      h += '<circle class="mp-rgath" cx="' + X(e.y).toFixed(1) + '" cy="35.5" r="2"/>';
    });
    /* the aperture, at true width — a hair at 76 years, the world at 3000 */
    h += '<rect class="mp-rwin" x="' + X(lo).toFixed(1) + '" y="18" width="' +
         Math.max(0.8, X(hi) - X(lo)).toFixed(2) + '" height="14"/>';
    sv.innerHTML = h;
  }

  /* The world may not be dragged off its own frame. A map showing empty
     space where the earth should be is a reader lost with no way back. */
  function clampView() {
    var minX = VB_W - VB_W * K, minY = VB_H - VB_H * K;
    TX = Math.min(0, Math.max(minX, TX));
    TY = Math.min(0, Math.max(minY, TY));
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
    '<circle cx="12" cy="13" r="9"/><path d="M3 12h18"/>' +
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
      if (!el.dataset.wired) {
        el.dataset.wired = '1';

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
        /* ── HOLDING A RAIL ──────────────────────────────────────────────
           The value is read from where the pointer IS, not from how far it
           moved — a rail is an absolute scale, unlike the dial it replaces,
           so a reader can jump to a millennium instead of winding to it.
           Top is the deep past, bottom is now: the same sense as the ruler
           beneath, so the two never contradict each other. */
        /* ── DRAG THE CENTURIES · the ruler IS the control ─────────────────
           Click anywhere on the track to go to that year; drag to travel. An
           absolute scale, so a reader can reach 3000 BC in one gesture rather
           than winding for it — which is what the dial could not do and the
           rail did at the cost of covering the Pacific. */
        /* the buttons, and the wheel, share one function */
        function zoomBy(f, cx, cy) {
          var r = el.querySelector('svg').getBoundingClientRect();
          if (!r.width) return;
          var mx = cx == null ? VB_W / 2 : (cx - r.left) / r.width * VB_W;
          var my = cy == null ? VB_H / 2 : (cy - r.top) / r.height * VB_H;
          var wx = (mx - TX) / K, wy = (my - TY) / K;
          var k = Math.max(K_MIN, Math.min(K_MAX, K * f));
          if (k === K) return;
          K = k; TX = mx - wx * K; TY = my - wy * K;
          clampView(); draw();
        }
        el.querySelectorAll('.mp-zoomctl button').forEach(function (b) {
          b.addEventListener('click', function (ev) {
            ev.stopPropagation();
            var z = b.getAttribute('data-z');
            if (z === 'fit') { K = 1; TX = 0; TY = 0; draw(); }
            else zoomBy(z === 'in' ? 1.5 : 1 / 1.5);
          });
        });

        /* ── THE LIST AND THE MAP POINT AT EACH OTHER ──────────────────────
           Delegated, because both sides are rebuilt on every draw and a
           listener bound to a node would die with it. */
        function lightSeat(key, on) {
          var li = el.querySelectorAll('.mp-li[data-seat="' + (key || '').replace(/"/g, '') + '"]');
          for (var i = 0; i < li.length; i++) li[i].classList.toggle('mp-lit', on);
          var g = el.querySelector('.mp-pins [data-seat="' + CSS.escape(key || '') + '"]');
          if (g) g.classList.toggle('mp-lit', on);
        }
        var litKey = null;
        el.addEventListener('pointerover', function (ev) {
          var t = ev.target.closest ? ev.target.closest('.mp-li,.mp-seat') : null;
          var key = t ? (t.getAttribute('data-seat')) : null;
          if (key === litKey) return;
          if (litKey) lightSeat(litKey, false);
          litKey = key;
          if (litKey) lightSeat(litKey, true);
        });

        var atlasBtn = el.querySelector('.mp-atlas-btn');
        atlasBtn.addEventListener('click', function () {
          var on = !el.classList.contains('mp-atlas');
          el.classList.toggle('mp-atlas', on);
          atlasBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
          atlasBtn.textContent = on ? 'blueprint' : 'atlas';
          if (on) draw();          /* first press fetches the relief */
        });

        var chrono = el.querySelector('.mp-chrono'), scrubbing = false;
        function chronoYear(ev) {
          var r = chrono.getBoundingClientRect();
          var f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
          return YEAR_MIN + f * (YEAR_MAX - YEAR_MIN);
        }
        chrono.addEventListener('pointerdown', function (ev) {
          scrubbing = true; chrono.setPointerCapture(ev.pointerId); setEdge(chronoYear(ev));
        });
        chrono.addEventListener('pointermove', function (ev) {
          if (scrubbing) setEdge(chronoYear(ev));
        });
        ['pointerup', 'pointercancel'].forEach(function (t) {
          chrono.addEventListener(t, function () { scrubbing = false; });
        });

        /* ── THE WHEEL ZOOMS · not time ────────────────────────────────────
           The ruler owns time now, so the map's own gesture is free for the
           thing every reader already expects a map to do. Zoom is about the
           POINTER, not the centre: a reader points at the Aegean and it comes
           to them, which is the difference between a map and a diagram. */
        var svgEl = el.querySelector('svg');
        /* ── LISTEN ON THE MAP, NOT THE SVG · 4 Sep ────────────────────────
           This was bound to the <svg>, which meant the gesture only worked if
           the event travelled up from whatever happened to be under the
           cursor — the sea rect, a pin, a wash, the relief. One layer that
           swallows events and the zoom is dead, with nothing in the console
           to say why. Reported twice as "the zoom is gone".

           The container catches it whatever is on top; the SVG's rectangle is
           still what the maths uses, so the point under the cursor is
           unchanged. A gesture should not depend on the z-order of a
           decoration. */
        el.addEventListener('wheel', function (e) {
          if (!el.contains(e.target)) return;
          if (e.target.closest && e.target.closest('.mp-listbody')) return;   /* the list scrolls */
          e.preventDefault();
          var r = svgEl.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var mx = (e.clientX - r.left) / r.width * VB_W;
          var my = (e.clientY - r.top) / r.height * VB_H;
          var wx = (mx - TX) / K, wy = (my - TY) / K;      /* point under cursor */
          var k = Math.max(K_MIN, Math.min(K_MAX, K * (e.deltaY > 0 ? 0.88 : 1.14)));
          if (k === K) return;
          K = k; TX = mx - wx * K; TY = my - wy * K;
          clampView(); draw();
        }, { passive: false });

        /* drag to pan, but only when zoomed in — at world scale there is
           nowhere to go and a drag would only feel broken */
        var panning = false, px = 0, py = 0;
        el.addEventListener('pointerdown', function (e) {
          if (K <= 1.01) return;
          if (e.target.closest && e.target.closest('.mp-foot,.mp-head,.mp-ap,.mp-chrono')) return;
          panning = true; px = e.clientX; py = e.clientY;
          el.setPointerCapture(e.pointerId); svgEl.style.cursor = 'grabbing';
        });
        el.addEventListener('pointermove', function (e) {
          if (!panning) return;
          var r = svgEl.getBoundingClientRect();
          TX += (e.clientX - px) / r.width * VB_W;
          TY += (e.clientY - py) / r.height * VB_H;
          px = e.clientX; py = e.clientY;
          clampView(); applyView();
        });
        ['pointerup', 'pointercancel'].forEach(function (t) {
          el.addEventListener(t, function () { panning = false; svgEl.style.cursor = ''; });
        });
        el.addEventListener('dblclick', function () { K = 1; TX = 0; TY = 0; draw(); });

        /* The dial is gone — see THE RAILS above. It needed a precise grab
           on a 26px circle and gave no absolute position, so a reader could
           wind for a while without knowing where they were. */
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
