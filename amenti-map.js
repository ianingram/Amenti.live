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
  var rivers = null, peaks = null, events = null, lakes = null, regions = null, coast = null;

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
  var lastShown = 0, lastHidden = 0, lastSeats = 0, lastEvents = 0, lastSky = 0, lastConj = 0, lastGath = 0, lastHalley = 0;

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
      /* ── WHAT HAPPENED · 4 Sep ────────────────────────────────────────────
         536 events, 111 with a coordinate and 52 with an extent, every Place
         AUTHORED in EVENTS.csv and verified by probes/probe-events.mjs. The
         machine may check a place and may never invent one — an earlier
         attempt to derive them from prose put Marathon in Provence, Waterloo
         in Texas and Carthage in Ohio. */
      get(RAW + 'EVENTS.json', true).then(function (d) { events = d.events || []; },
                                          function ()  { events = null; }),
      /* ── THE GROUND · 4 Sep ───────────────────────────────────────────────
         Inland water, the geography that explains settlement, and a coastline
         four times finer than the one baked into WORLD.json. All Natural
         Earth, all public domain, all optional.

         AQUIFERS WERE CONSIDERED AND REFUSED. A groundwater map is a MODERN
         subsurface survey, and a water table moves in decades — the Nubian
         Sandstone has been drawn down enormously since 1960. Relief and
         coastlines drift slowly enough that showing today's is a mild
         anachronism; today's groundwater on a map running to 4000 BC would be
         a strong one, and invisible to a reader. A desert's extent is stable
         across this span. That is why deserts are here and aquifers are not. */
      get(RAW + 'LAKES.json',   true).then(function (d) { lakes   = d.lakes   || []; },
                                           function ()  { lakes   = null; }),
      get(RAW + 'REGIONS.json', true).then(function (d) { regions = d.regions || []; },
                                           function ()  { regions = null; }),
      get(RAW + 'COAST.json',   true).then(function (d) { coast   = d.coast   || []; },
                                           function ()  { coast   = null; }),
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
      /* ── A CLOSED SURFACE MUST NOT TOUCH THE PAGE · 5 Sep ──────────────────
         SEEN LIVE. Hovering a name in the hall's own search list produced an
         arrow cursor and the tooltip "North America — 25 souls, somewhere in
         this area" — text from THIS FILE, on a page the map was not even
         showing on. The territory washes carry pointer-events:all so a reader
         can hover them, and nothing turned that off when the surface closed:
         the map sat in the DOM underneath, invisible, still catching the
         pointer through another faculty's list.

         visibility:hidden is not enough on its own here, because the
         transition leaves a window in which the element is still hit-testable,
         and any later rule that restores visibility restores the hit-testing
         with it. So the whole surface is INERT unless it is the active scene.
         A closed instrument does not merely go quiet — it lets go. */
      '#amenti-map{position:fixed;inset:0;z-index:3;opacity:0;visibility:hidden;',
      '  pointer-events:none;',
      '  transition:opacity .45s ease .15s, visibility .45s;',
      '  font:400 13.5px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#b8c4d8}',
      'body.scene-map #amenti-map{opacity:1;visibility:visible;pointer-events:auto}',
      /* the trigger lives outside the surface and stays live, or there is no
         way back in */
      '#amenti-faculties{pointer-events:auto}',
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
      '  padding:26px 258px 22px 268px;gap:0}',
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
      '#amenti-map .mp-what-btn{font:400 11.5px/1 ui-monospace,Menlo,monospace;',
      '  color:#7d8ea6;background:transparent;border:1px solid #23303f;border-radius:3px;',
      '  padding:5px 10px;cursor:pointer;letter-spacing:.06em}',
      '#amenti-map .mp-what-btn:hover{color:#c3d3e6;border-color:#33637a}',
      '#amenti-map .mp-what-btn[aria-expanded="true"]{color:#0a1018;background:#8fa8c4;',
      '  border-color:#8fa8c4}',
      '#amenti-map .mp-what{position:absolute;inset:64px 26px 142px 26px;z-index:8;',
      '  background:rgba(6,8,14,.97);border:1px solid #23303f;border-radius:5px;',
      '  padding:26px 30px;display:grid;grid-template-columns:repeat(3,1fr);gap:0 34px;',
      '  overflow-y:auto}',
      '#amenti-map .mp-what[hidden]{display:none}',
      '#amenti-map .mp-what h3{margin:0 0 10px;font:400 11px/1 ui-monospace,Menlo,monospace;',
      '  letter-spacing:.16em;color:#5fd0e8;padding-bottom:8px;border-bottom:1px solid #1e2836}',
      '#amenti-map .mp-what p{margin:0 0 11px;font:400 13px/1.6 ui-monospace,Menlo,monospace;',
      '  color:#9fb1c7;max-width:46ch}',
      '#amenti-map .mp-what b{color:#dbe4f0;font-weight:400}',
      '#amenti-map .mp-what i{color:#9fb1c7}',
      '#amenti-map .mp-what ul{margin:0 0 11px;padding-left:16px}',
      '#amenti-map .mp-what li{font:400 13px/1.55 ui-monospace,Menlo,monospace;',
      '  color:#9fb1c7;margin-bottom:5px}',
      '#amenti-map .mp-whatfoot{color:#5d6e84 !important;font-size:11.5px !important;',
      '  border-top:1px solid #1e2836;padding-top:10px;margin-top:14px}',
      '@media (max-width:1100px){#amenti-map .mp-what{grid-template-columns:1fr}}',
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
      /* ── THE LIST NEEDS A GROUND · 4 Sep ──────────────────────────────────
         SEEN LIVE: the names were drawn straight onto the Pacific with nothing
         behind them, so "Arcadius Constantinople" floated in open water and
         read as a label ON the map rather than a list BESIDE it. A panel and
         a rule fix it: the column is now plainly a different surface, and the
         eye stops trying to place it geographically. */
      /* ── SOULS LEFT, BUILT THINGS RIGHT · 5 Sep ───────────────────────────
         Two columns, and they never compete for the same space. The left
         names who was alive in this window; the right names what was standing
         in it. That division is the whole distinction between the two
         registers, made visible without a word of explanation: one column
         churns as you scrub and the other accumulates. */
      '#amenti-map .mp-blist{position:absolute;right:0;top:64px;bottom:142px;width:236px;',
      '  z-index:6;display:flex;flex-direction:column;pointer-events:auto;',
      '  padding:14px 26px 14px 14px;background:linear-gradient(270deg,',
      '  rgba(6,8,14,.94) 0%,rgba(6,8,14,.92) 72%,rgba(6,8,14,0) 100%);',
      '  border-left:1px solid rgba(43,58,80,.5);text-align:right}',
      '#amenti-map .mp-bi{font:400 12.5px/1.5 ui-monospace,Menlo,monospace;color:#a9b8cc;',
      '  cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#amenti-map .mp-bi:hover,#amenti-map .mp-bi.mp-lit{color:#e8f2ff}',
      '#amenti-map .mp-bi .mp-bwhen{color:#5d6e84;font-size:11px}',
      /* the people who raised it and ended it; the dagger means not in this window */
      '#amenti-map .mp-bby{display:block;font-size:10.5px;line-height:1.35;color:#6f8098;',
      '  padding-bottom:3px}',
      '#amenti-map .mp-bi:hover .mp-bby{color:#9db0c8}',
      /* raised it: the site's own light. Ended it: RED, used nowhere else. */
      '#amenti-map .mp-li.mp-builder{color:#cfe0f2}',
      '#amenti-map .mp-li.mp-destroyer{color:#ff5a5a}',
      '#amenti-map .mp-seat.mp-builder .mp-pin{fill:#cfe0f2}',
      '#amenti-map .mp-seat.mp-builder .mp-name{opacity:1;fill:#cfe0f2}',
      '#amenti-map .mp-seat.mp-destroyer .mp-pin{fill:#ff5a5a}',
      '#amenti-map .mp-seat.mp-destroyer .mp-name{opacity:1;fill:#ff8a8a}',
      '#amenti-map .mp-bmade{color:#8fa2ba}',
      '#amenti-map .mp-bkill{color:#c05a5a}',
      '#amenti-map .mp-bi:hover .mp-bkill{color:#ff5a5a}',
      '#amenti-map .mp-bi.mp-bgone{color:#6f8098}',
      '#amenti-map .mp-bi.mp-bgone .mp-bwhen{color:#4d5c70}',
      '#amenti-map .mp-list{position:absolute;left:0;top:64px;bottom:142px;width:246px;',
      '  z-index:6;display:flex;flex-direction:column;pointer-events:auto;',
      '  padding:14px 14px 14px 26px;background:linear-gradient(90deg,',
      '  rgba(6,8,14,.94) 0%,rgba(6,8,14,.92) 72%,rgba(6,8,14,0) 100%);',
      '  border-right:1px solid rgba(43,58,80,.5)}',
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
      /* alive when the hovered event happened — the reach a ring cannot draw */
      '#amenti-map .mp-seat.mp-forit .mp-pin{fill:#ffb489;fill-opacity:1}',
      '#amenti-map .mp-seat.mp-forit .mp-name{opacity:1;fill:#fbb98f}',
      '#amenti-map .mp-seat.mp-dated .mp-pin{stroke:#a8e6f5;stroke-width:.8;',
      '  vector-effect:non-scaling-stroke}',
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
      /* ── DRAWN, BUT NOT VISIBLE · 5 Sep ────────────────────────────────────
         This was stroke-width .3 at opacity .28 with 1px dashes in 4px gaps —
         an amber hairline at a quarter opacity across a dark map. It rendered
         correctly and could not be seen, so it was reported as MISSING FROM
         THE APPLICATION. Its own label was legible above it, which made the
         absence read as a fault rather than a faintness.

         A line that carries a claim must be visible enough to be doubted.
         Raised until it is: still quiet, still clearly a count rather than a
         path, and now actually on the screen. */
      '#amenti-map .mp-return{stroke:#d8a24a;stroke-width:.55;stroke-dasharray:3 5;',
      '  opacity:.55;vector-effect:non-scaling-stroke}',
      /* the two ends of the count: where it began and where it closes */
      '#amenti-map .mp-retmark{fill:none;stroke:#e8c98a;stroke-width:.6;opacity:.7;',
      '  vector-effect:non-scaling-stroke}',
      /* travelling: amber. Home: white, and ringed. */
      '#amenti-map .mp-jup-home{fill:#fff6e2 !important}',
      '#amenti-map .mp-jup-ring{fill:none;stroke:#fff6e2;stroke-width:.6;opacity:.75;',
      '  vector-effect:non-scaling-stroke}',
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
      /* AN EMBER, OPEN AT THE CENTRE — never a disc, never cyan, never gold */
      /* the pulse: an age, not a radius. Thin, unfilled, and it never scales
         with the land — see the note where it is drawn. */
      '#amenti-map .mp-pulse{fill:none;stroke:#e0794a;stroke-width:.5;',
      '  vector-effect:non-scaling-stroke;pointer-events:none}',
      /* The first colour tried here was a pale warm cream, and the probe
         REFUSED IT: it fell inside the reserved gold range, and gold is a
         VERIFIED QUOTE and nothing else — never a date, a place or an event.
         An event is an ember, so the flash is the bright end of the ember
         rather than the warm end of gold. Caught before it shipped.

         (The rejected value is deliberately not written here. The guard reads
         this file as TEXT, so naming the colour in a comment about not using
         the colour trips the guard about not using it.) */
      /* the fill is set per-mark: it is a TEMPERATURE, not a colour */
      '#amenti-map .mp-flash{pointer-events:none;filter:url(#mp-glow)}',
      '#amenti-map .mp-halo{fill:none;stroke:#ffffff;stroke-width:.6;',
      '  vector-effect:non-scaling-stroke;pointer-events:none}',
      '#amenti-map .mp-evmark{fill:none;stroke:#e0794a;stroke-width:.75;',
      '  stroke-linecap:round;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-ev{cursor:default}',
      '#amenti-map .mp-ev:hover .mp-evmark{stroke:#ffb08a;stroke-width:1.1}',
      '#amenti-map .mp-evlab{fill:#e0925a;text-anchor:middle;pointer-events:none;',
      '  paint-order:stroke;stroke:#070b12;stroke-width:1.5px;stroke-linejoin:round}',
      /* a territory event is an OUTLINE — a war is not a wash */
      '#amenti-map .mp-evarea{fill:none;stroke:#e0794a;stroke-width:.6;',
      '  stroke-dasharray:3 3;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-lake{fill:#0d2c44;stroke:#3f6f8f;stroke-width:.4;',
      '  vector-effect:non-scaling-stroke;opacity:.9}',
      '#amenti-map.mp-atlas .mp-lake{fill:#0a2438}',
      /* made water reads as made: the same blue, but outlined rather than
         simply filled, so a reader can see it is not the same kind of thing */
      '#amenti-map .mp-made{fill:#123044;fill-opacity:.85;stroke:#5c7f99;',
      '  stroke-width:.45;stroke-dasharray:2.5 2;vector-effect:non-scaling-stroke}',
      /* named ground: an outline, dim, and never a fill */
      '#amenti-map .mp-reg{fill:none;stroke:#3a4a5e;stroke-width:.4;opacity:.5;',
      '  stroke-dasharray:5 4;vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-reg-Desert{stroke:#6b5a3e;opacity:.55}',
      '#amenti-map .mp-reg-Delta{stroke:#3f6f8f;opacity:.6;stroke-dasharray:none}',
      '#amenti-map .mp-reg-Rangemtn{stroke:#4a5468;opacity:.35}',
      /* the finer shore; the coarse fill keeps the land and the relief clip */
      '#amenti-map .mp-coast{fill:none;stroke:#31435c;stroke-width:.5;',
      '  vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-land.mp-hasfine{stroke:none}',
      '#amenti-map .mp-regions,#amenti-map .mp-lakes,#amenti-map .mp-coast,',
      /* built, and standing: a small open square, quiet, under everything */
      '#amenti-map .mp-site rect{fill:none;stroke:#7d8ea6;stroke-width:.55;opacity:.6;',
      '  vector-effect:non-scaling-stroke}',
      '#amenti-map .mp-site:hover rect,#amenti-map .mp-site.mp-lit rect{',
      '  stroke:#cfe0f2;opacity:1;stroke-width:1.1}',
      /* a ruin in this window: the same mark, broken open */
      '#amenti-map .mp-site.mp-ruined rect{stroke-dasharray:2 2;opacity:.32}',
      '#amenti-map .mp-sitelab{fill:#8fa2ba;text-anchor:middle;opacity:.65;',
      '  pointer-events:none;paint-order:stroke;stroke:#070b12;stroke-width:1.4px;',
      '  stroke-linejoin:round}',
      '#amenti-map .mp-sites{pointer-events:auto}',
      '#amenti-map .mp-jrn{fill:none;stroke:#d9a3e8;stroke-width:.7;',
      '  stroke-dasharray:4 4;vector-effect:non-scaling-stroke;stroke-linecap:round}',
      '#amenti-map .mp-jrn:hover{stroke:#f0c8ff;stroke-width:1.1}',
      '#amenti-map .mp-rivers,#amenti-map .mp-peaks{pointer-events:none}',
      '#amenti-map .mp-relief{display:none;opacity:.95}',
      '#amenti-map.mp-atlas .mp-relief{display:block}',
      '#amenti-map.mp-atlas .mp-land{fill:none;stroke:#31435c}',
      /* ── THE LEGEND MUST NOT RUN OFF THE PAGE · 4 Sep ─────────────────────
         SEEN LIVE: five entries on one line overflowed the right edge, and
         the last swatch — the amber diamond — was left stranded with its
         words cut off. A key without its text is worse than no key: a reader
         sees a mark they cannot look up and assumes it means something on the
         map. It wraps now, and the row can grow. */
      '#amenti-map .mp-key{display:flex;gap:6px 18px;align-items:center;font-size:12px;',
      '  color:#8fa2ba;flex-wrap:wrap;justify-content:flex-end;max-width:62vw}',
      '#amenti-map .mp-key>span{white-space:nowrap}',
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
      '#amenti-map .mp-readwrap{flex:0 0 auto;min-width:250px}',
      '#amenti-map .mp-mark{display:block;height:15px;font:400 12px/15px ui-monospace,',
      '  Menlo,monospace;color:#e8c98a;letter-spacing:.04em;white-space:nowrap;',
      '  opacity:0;transition:opacity .25s ease}',
      '#amenti-map .mp-mark.on{opacity:1}',
      /* precision mode must announce itself, or it is a secret */
      '#amenti-map .mp-fine{position:absolute;margin-left:8px;font:400 11px/1 ui-monospace,',
      '  Menlo,monospace;color:#5fd0e8;letter-spacing:.08em;opacity:0;transition:opacity .2s}',
      '#amenti-map .mp-fine.on{opacity:.85}',
      '#amenti-map .mp-chrono.mp-scrubbing{cursor:ew-resize}',
      '#amenti-map .mp-mark .mp-marksign{font-size:14px;filter:url(#mp-glow)}',
      '#amenti-map .mp-read{display:block;color:#f0f5fb;font-size:27px;letter-spacing:.01em;',
      '  font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1}',
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
            '<div class="mp-title">where the souls began, and what stood over Giza</div>' +
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
            /* ── THE SURFACE EXPLAINS ITSELF · 4 Sep ──────────────────────────
               Every mark here is deliberate and none of it was stated. A
               reader watching a seat stop saying "Constantinople · 124" and
               start naming people had no way to learn that narrowing is a
               DIFFERENT READING rather than a filter; the legend covers four
               marks and the doctrine behind them was invisible.

               One panel, not a tooltip per control. A tooltip can say "42
               years"; only a panel can say why the ladder is planetary at
               all. */
            '<button type="button" class="mp-what-btn" aria-expanded="false">' +
              'what you are looking at</button>' +
          '</div>' +
          '<div class="mp-key">' +
            '<span><i class="k-pin"></i>a seat \u2014 where the record places them</span>' +
            '<span><i class="k-dated"></i>ringed \u2014 a DATED position, not a birthplace</span>' +
            '<span><i class="k-jrn"></i>a crossing \u2014 from here to here, not the route</span>' +
            '<span><i class="k-site"></i>a built thing, while it stood</span>' +
            '<span><i class="k-wash"></i>a territory \u2014 somewhere in here</span>' +
            '<span><i class="k-none"></i>no honest place \u2014 not drawn</span>' +
            '<span><i class="k-sky"></i>the sky \u2014 seen from giza</span>' +
            '<span><i class="k-river"></i>rivers and named summits</span>' +
            '<span><i class="k-ev"></i>what happened \u2014 fading as it passes</span>' +
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
            /* NO href AT ALL until the atlas is pressed · 5 Sep. It was href=""
               so the element could exist before the relief was wanted, and an
               empty href makes a browser try to load THE PAGE ITSELF as an
               image. Harmless — the atlas still worked — but it threw on every
               single load, and a permanent harmless error is worse than none:
               it is the line a real failure hides behind. */
            '<image class="mp-relief" x="0" y="0" width="1000" height="500" ' +
              'preserveAspectRatio="none" clip-path="url(#mp-landclip)"></image>' +
            '<path class="mp-land"></path><path class="mp-coast"></path>' +
            '<g class="mp-regions"></g><g class="mp-lakes"></g><g class="mp-sites"></g><g class="mp-journeys"></g>' +
            '<g class="mp-rivers"></g><g class="mp-peaks"></g><g class="mp-events"></g>' +
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
          '<span class="mp-readwrap">' +
            /* ── WHAT HAPPENED IN THIS YEAR · 4 Sep ────────────────────────
               The band counts what is in the window; the Giza mark shows the
               last event crossed. Neither says THIS YEAR, and that is the
               claim the sky most naturally makes — a conjunction is a
               date-fact before it is a place-fact, and the year readout is
               where a reader is already looking.

               So it lights only when the leading edge is ON the event, and
               goes dark again the moment it is passed. A permanent badge
               would be a third copy of the same information; a flash as you
               cross 1486 is a reading. */
            '<span class="mp-mark"></span>' +
            '<span class="mp-fine"></span>' +
            '<span class="mp-read"></span>' +
          '</span>' +
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
      '<div class="mp-what" hidden>' +
        '<div class="mp-whatcol">' +
          '<h3>the marks</h3>' +
          /* ── WHAT THE SEAT ACTUALLY IS · 5 Sep ────────────────────────────
             MEASURED, and it is not what this surface claimed. The geography
             handoff settled the claim as "principal place of activity, NOT
             birthplace, because birthplace misleads for anyone who mattered
             elsewhere." The roster's Location column does not hold that.

             Tested against twenty unambiguous figures, NINETEEN are the
             birthplace — Newton in Lincolnshire, Einstein at Ulm, Marx at
             Trier, Curie in Warsaw, Mozart at Salzburg. Not one of them worked
             there. Tested again against rulers, the same: Constantine at
             Naissus, Justinian at Tauresium, Hadrian at Italica, Catherine at
             Stettin, Saladin at Tikrit.

             Every individual value is CORRECT — Newton was born in
             Lincolnshire — which is why no audit caught it. The register is
             truthful and the label on it was not. The water between, again.

             So the surface says what it draws until the roster carries a seat
             of its own. A map that overstates by one word is still a map that
             overstates. */
          '<p><b>a seat</b> — a dot, and <b>most often the place a soul was ' +
            'BORN</b>, not where they worked. Tested against twenty ' +
            'unmistakable figures, nineteen are the birthplace: Newton in ' +
            'Lincolnshire, Einstein at Ulm, Marx at Trier, Mozart at Salzburg. ' +
            'None of them worked there. This map therefore shows where notable ' +
            'people BEGAN — a real thing, and not the same thing as where they ' +
            'acted. Until the roster carries a seat of its own, read every dot ' +
            'that way.</p>' +
          '<p>One seat can hold many souls; Constantinople holds 124.</p>' +
          '<p><b>a territory</b> — a soft area, never a dot. The record says ' +
            'only <i>somewhere in here</i>. The commonest value in the roster is ' +
            '\u201cSouthern Europe\u201d, a continent, held by 334 souls \u2014 ' +
            'drawn as a pin it would be the biggest lie on the page, and the ' +
            'one told most often.</p>' +
          '<p><b>nothing</b> — some souls are not drawn, and the footer counts ' +
            'them. A place that cannot be found is reported, never guessed.</p>' +
        '</div>' +
        '<div class="mp-whatcol">' +
          '<h3>the aperture</h3>' +
          '<p>The window is how much time you are holding. The five settings are ' +
            'not round numbers \u2014 they are periods measured out of the sky ' +
            'register itself:</p>' +
          '<ul>' +
            '<li><b>\u2643 6 years</b> \u2014 Jupiter rises due east over Giza. ' +
              '830 of them, 5 to 7 years apart.</li>' +
            '<li><b>\u2643\u2644 20 years</b> \u2014 one great conjunction. 248, ' +
              '18 to 21 apart.</li>' +
            '<li><b>\u2645 42 years</b> \u2014 one turn of Uranus.</li>' +
            '<li><b>\u2604 76 years</b> \u2014 one Halley. A human span, and a real one.</li>' +
            '<li><b>all of it</b> \u2014 the whole register, 4000 BC to now.</li>' +
          '</ul>' +
          '<p><b>The track is coarse on purpose</b> \u2014 the whole span must be ' +
            'reachable in one gesture, which puts six years in every pixel. To ' +
            'land on a year: <b>drag below the rail</b> and the movement grows ' +
            'finer the further you go, or use the <b>arrow keys</b>, which step ' +
            'a single year (hold shift for a tenth of the window).</p>' +
          '<p><b>Narrowing is a different reading, not a filter.</b> Wide, a seat ' +
            'can only say <i>Constantinople \u00b7 124</i> and Jupiter is a count ' +
            '\u2014 124 names on one dot is a smear, and 70 risings is a ' +
            'metronome. Close in and the same seat names its souls, and every ' +
            'rising gets its own sign and year.</p>' +
        '</div>' +
        '<div class="mp-whatcol">' +
          '<h3>the sky</h3>' +
          '<p>The band along the top is <b>not the earth</b>. It is where a sky ' +
            'event with no place can sit without claiming one.</p>' +
          '<p>The amber diamond <b>is</b> on the earth, at Giza \u2014 but it ' +
            'marks the <b>observer, not the event</b>. The risings and ' +
            'conjunctions were computed there, so that is the one honest ' +
            'coordinate for them.</p>' +
          '<p>Halley sits in the band instead, because a comet is seen from the ' +
            'whole earth and pinning it anywhere would invent a precision ' +
            'nobody has.</p>' +
          '<p>Jupiter\u2019s dashed line runs along Giza\u2019s latitude and closes ' +
            'on the pyramids at each rising. It is <b>a count, not a ' +
            'position</b>: at a register measured in years there is no honest ' +
            'longitude to draw.</p>' +
          '<p><b>The event\u2019s own decade burns WHITE.</b> Ten real years \u2014 not ' +
            'a fraction of the window and not a fraction of the echo, because ' +
            'how hot a thing burned and how long it smouldered are different ' +
            'claims. After that it cools along a ramp, white to amber to ember, ' +
            'so the mark reads as a temperature falling rather than a dot ' +
            'fading out.</p>' +
          '<p><b>An event smoulders for a number of COMET PASSES.</b> Rome ' +
            'burns in AD 64 and Halley returns in 66 and 141, so two passes puts ' +
            'it out in 141 \u2014 a date the sky supplies, not a number anyone ' +
            'chose. How MANY passes is still a judgement, authored by hand and ' +
            'said here so a reader can disagree; but the length of one is not. ' +
            'And the span varies with where an event falls between returns: ' +
            'Vesuvius is fifteen years after the fire and gets 139 years for the ' +
            'same two passes, because the comet had just gone.</p>' +
          '<p><b>The rings are AGE, not reach.</b> An event flares as a bright ' +
            'point in its own year and opens into a fading ring as that year ' +
            'recedes. The radius says how long ago, never how far \u2014 and you ' +
            'can prove it by zooming: the ring does not grow with the land, ' +
            'because a distance would and a duration does not. Vesuvius killed ' +
            'Pompeii at eight kilometres and dusted Egypt with ash; no circle ' +
            'describes that, so none is drawn.</p>' +
          '<p class="mp-whatfoot">Seats from GeoNames, CC BY 4.0. Coastline, ' +
            'relief, rivers and named summits from Natural Earth.</p>' +
        '</div>' +
      '</div>' +
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
      '<div class="mp-list"><div class="mp-listhead"></div><div class="mp-listbody"></div></div>' +
      '<div class="mp-blist"><div class="mp-listhead"></div><div class="mp-listbody"></div></div>';
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
    /* ── A FINER SHORE · 4 Sep ───────────────────────────────────────────────
       WORLD.json is the 110m outline with its projection baked in: the Black
       Sea is a dozen vertices and Crimea is a triangle. Fine at world scale,
       crude at x8. COAST.json is the 50m line in LON/LAT, projected here, and
       it is drawn OVER the fill rather than replacing it — the fill still
       carries the land and the relief clip, and only the edge improves. */
    var gc = el.querySelector('.mp-coast');
    if (coast && gc && !gc._done) {
      var cd = '';
      coast.forEach(function (seg) {
        for (var i = 0; i < seg.length; i += 2) {
          var q = proj(seg[i + 1], seg[i]);
          cd += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        }
      });
      gc.setAttribute('d', cd); gc._done = true;
      el.querySelector('.mp-land').classList.add('mp-hasfine');
    }
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

    /* ── A LIFE IS NOT A POINT · 5 Sep ───────────────────────────────────────
       26 souls carry DATED POSITIONS from SEATS.csv — where they were, and
       when. For those, the map asks the year at the leading edge and places
       them where they actually stood: Einstein at Ulm in 1890, Bern in 1905,
       Berlin in 1920, Princeton in 1940. Scrub, and he moves.

       Everyone else falls back to Location, which is THE BIRTHPLACE, as this
       surface now says (SLIP #68). So there are two kinds of mark on one map —
       a dated position and a birthplace — and they are DIFFERENT CLAIMS. The
       dated one is ringed, so a reader can tell which is which without being
       told.

       NO LINE IS DRAWN BETWEEN POSITIONS. A line asserts a journey — a route,
       a direction, a date of travel — that the record does not hold. That is
       the refusal standing since #64d against troop movements and trade
       routes, and a person is no different from an army.

       AND A POSITION MAY HAVE NO PLACE. Darwin 1831-36 is five years at sea on
       the Beagle; a seat there would be an invention. Those years he is simply
       not on the map, which is the truth about where the record puts him. */
    function positionAt(s, year) {
      if (!s.seats) return null;
      for (var pi = s.seats.length - 1; pi >= 0; pi--) {
        var q = s.seats[pi];
        var end = q.to == null ? s.d : q.to;
        if (year >= q.from && year <= end) return q;
      }
      return null;
    }

    var pins = [];
    souls.forEach(function (s) {
      var q = positionAt(s, hi);
      if (q) {
        if (q.lat == null) return;              /* at sea, or unplaced that year */
        var m = Object.create(s);
        m.lat = q.lat; m.lon = q.lon; m.place = q.place;
        m.dated = true; m.what = q.what; m.pnote = q.note;
        pins.push(m);
        return;
      }
      if (s.tier === 'city' && s.lat != null) pins.push(s);
    });
    var washes = souls.filter(function (s) { return s.ext; });

    /* ── NAMED GROUND · outlines, never fills ────────────────────────────────
       39 deserts, 156 ranges, 29 deltas, the Rift Valley, the Tarim and
       Fergana basins. This is the geography that EXPLAINS the record: a
       desert says where people were not, a delta and a valley say where they
       were, and the Fergana is why the Silk Road bends.

       OUTLINES ONLY. A filled region would compete with a territory wash, and
       a reader would read "somewhere in the Sahara" as a claim about a soul.
       This is context behind the record and must never look like the record.
       Deserts and deltas first, because those are the two that explain most,
       and the rest arrive with the zoom. */
    var gg = el.querySelector('.mp-regions');
    if (regions && gg) {
      var wantK = K < 1.5 ? { 'Desert':1, 'Delta':1 }
                : K < 3   ? { 'Desert':1, 'Delta':1, 'Basin':1, 'Valley':1, 'Plain':1 }
                          : null;                       /* null = all of them */
      var rh = '';
      regions.forEach(function (rg) {
        if (wantK && !wantK[rg.k]) return;
        var d2 = '';
        for (var i = 0; i < rg.p.length; i += 2) {
          var q = proj(rg.p[i + 1], rg.p[i]);
          d2 += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        }
        rh += '<path class="mp-reg mp-reg-' + rg.k.replace(/[^a-z]/gi, '') + '" d="' + d2 + 'Z"/>';
      });
      gg.innerHTML = rh;
    }

    /* ── INLAND WATER ────────────────────────────────────────────────────────
       The Caspian and the Black Sea are already holes in WORLD.json's land, so
       this adds what is genuinely missing: Victoria, Superior, the Dead Sea,
       Balkhash, Van, Urmia, Sevan. Filled, unlike a region — water is a thing,
       not a name for an area. */
    var gl = el.querySelector('.mp-lakes');
    if (lakes && gl) {
      var maxL = K < 1.5 ? 2 : K < 3 ? 4 : 8;
      var ld = '', md = '';
      lakes.forEach(function (lk) {
        if (lk.r > maxL) return;
        /* ── A RESERVOIR IS NOT A LAKE · 4 Sep ──────────────────────────────
           56 of these rings were made by people. Lake Mead was impounded in
           1935, Rybinsk flooded in 1941, Bratsk in 1967. Drawn across a map
           that scrubs to 4000 BC they would put twentieth-century engineering
           under the Bronze Age — and their angular shapes are REAL, because a
           dam drowns a valley and takes its shape, which is exactly why they
           must not be mistaken for natural water.

           So a made lake appears only once the window has reached the year it
           was built. Before that it is not drawn, for the same reason a soul
           is never placed in a century nobody recorded. Where the year is
           unknown the register says 1900 — modern, and honest about being a
           guess at nothing finer than the century. */
        if (lk.k === 'made') {
          if (hi < (lk.built || 1900)) return;
          for (var mi = 0; mi < lk.p.length; mi += 2) {
            var mq = proj(lk.p[mi + 1], lk.p[mi]);
            md += (mi ? 'L' : 'M') + mq[0].toFixed(1) + ' ' + mq[1].toFixed(1);
          }
          md += 'Z';
          return;
        }
        for (var i = 0; i < lk.p.length; i += 2) {
          var q = proj(lk.p[i + 1], lk.p[i]);
          ld += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        }
        ld += 'Z';
      });
      gl.innerHTML = '<path class="mp-lake" d="' + ld + '"/>' +
                     (md ? '<path class="mp-made" d="' + md + '"/>' : '');
    }

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

    /* ── WHO WAS ALIVE FOR IT · 5 Sep ────────────────────────────────────────
       The argument for drawing rings around a battle is really an argument
       about REACH, and the objection to rings is that reach is the one thing a
       circle cannot hold. Actium's reach is not five hundred kilometres; it is
       two thousand years. The consequence of a battle travels forward through
       people and institutions, not outward through space, and a ring can only
       measure the dimension the event does not extend in.

       So reach is drawn the way the register actually holds it. Hover an event
       and every seat holding someone ALIVE IN THAT YEAR lights. The Temple
       burns and eleven people in the world light up with it.

       This is EDGE DATA (#66): neither register contains it. The events know
       dates and places; the roster knows lives. The overlap is the reading,
       and it is exactly as strong as its two parents and no stronger. */
    if (ge && !ge._wired) {
      ge._wired = true;
      ge.addEventListener('mouseover', function (e) {
        var g = e.target.closest && e.target.closest('.mp-ev');
        if (!g) return;
        var y = +g.getAttribute('data-y'), lit = 0;
        el.querySelectorAll('.mp-seat').forEach(function (sn) {
          var lives = (sn.getAttribute('data-lives') || '').split(',');
          var on = lives.some(function (L) {
            var ab = L.split(':');
            return +ab[0] <= y && +ab[1] >= y;
          });
          sn.classList.toggle('mp-forit', on);
          if (on) lit++;
        });
        var rd = el.querySelector('.mp-mark');
        if (rd) {
          rd.textContent = lit + ' soul' + (lit === 1 ? '' : 's') +
                           ' on this map were alive when ' + g.getAttribute('data-n') +
                           ' \u00b7 ' + yr(y);
          rd.classList.add('on', 'mp-forit-lab');
        }
      });
      ge.addEventListener('mouseout', function () {
        el.querySelectorAll('.mp-seat.mp-forit').forEach(function (sn) {
          sn.classList.remove('mp-forit');
        });
        var rd = el.querySelector('.mp-mark');
        if (rd && rd.classList.contains('mp-forit-lab')) {
          rd.classList.remove('on', 'mp-forit-lab'); rd.textContent = '';
        }
      });
    }

    /* ── WHAT WAS BUILT · the only layer that does not move · 5 Sep ──────────
       A site stands. It does not flare, recede or smoulder, because it is not
       an event — Karnak stood for two thousand years and the events machinery
       would have burned it out in a decade.

       It is drawn while the window covers its span, and a site with no end
       date is standing still. So Persepolis burns in 330 BC and leaves the
       map while Giza never does, and the built world ACCUMULATES: 4 marks at
       2500 BC, 12 at AD 1, a dip to 10 by AD 500 as Delphi and Olympia and
       Ephesus close, 22 today.

       QUIET, AND BENEATH EVERYTHING. Against souls and events that arrive and
       go on every step of the slider, this is the one layer that only ever
       adds — so at a close modern aperture Giza and Angkor and the Empire
       State are all on one screen. True, and busy. A small open square, dim,
       unlabelled until a reader goes in: this is the ground people stood on,
       not the record of them. */
    var geoName = {}; geo.souls.forEach(function (x) { geoName[x.k] = x.n; });
    var gs = el.querySelector('.mp-sites');
    if (bb && !bb._wired) {
      bb._wired = true;
      var lightSite = function (name, on) {
        el.querySelectorAll('.mp-site').forEach(function (n) {
          if (n.getAttribute('data-name') === name) n.classList.toggle('mp-lit', on);
        });
      };
      /* ── WHO RAISED IT AND WHO ENDED IT ARE NOT THE SAME CLAIM · 5 Sep ──
         Lit identically they read as one relation, and they are opposites.
         The builder lights in the site's own slate-white; the destroyer in
         RED, which is used nowhere else on this surface — not for a soul, not
         for an event, not for the sky. A colour that means one thing is worth
         more than a colour that means several. */
      var lightWho = function (key, on, role) {
        if (!key) return;
        var cls = role === 'ended' ? 'mp-destroyer' : 'mp-builder';
        el.querySelectorAll('.mp-li').forEach(function (n) {
          var nm = n.childNodes[0] && n.childNodes[0].nodeValue;
          if (nm && nm.trim() === (geoName[key] || '\u0000')) n.classList.toggle(cls, on);
        });
        el.querySelectorAll('.mp-seat').forEach(function (sn) {
          var who = (sn.getAttribute('data-who') || '').split(',');
          if (who.indexOf(key) > -1) sn.classList.toggle(cls, on);
        });
      };
      bb.addEventListener('mouseover', function (e) {
        var r = e.target.closest && e.target.closest('.mp-bi');
        if (r) { lightSite(r.getAttribute('data-site'), true);
                 lightWho(r.getAttribute('data-built'), true, 'built');
                 lightWho(r.getAttribute('data-ended'), true, 'ended'); }
      });
      bb.addEventListener('mouseout', function (e) {
        var r = e.target.closest && e.target.closest('.mp-bi');
        if (r) { lightSite(r.getAttribute('data-site'), false);
                 lightWho(r.getAttribute('data-built'), false, 'built');
                 lightWho(r.getAttribute('data-ended'), false, 'ended'); }
      });
    }
    if (gs && geo.sites) {
      var sh = '', ivS = 1 / K, nameThem = K >= 2.5;
      geo.sites.forEach(function (st) {
        if (st.lat == null) return;
        if (st.b > hi) return;                       /* not built yet */
        if (st.e != null && st.e < lo) return;       /* gone before this window */
        var standing = (st.e == null || st.e > hi);
        var xy = proj(st.lat, st.lon), a = 2.2 * ivS;
        sh += '<g class="mp-site' + (standing ? '' : ' mp-ruined') +
              '" data-name="' + esc(st.n) + '">' +
              '<rect x="' + (xy[0] - a).toFixed(2) + '" y="' + (xy[1] - a).toFixed(2) +
              '" width="' + (a * 2).toFixed(2) + '" height="' + (a * 2).toFixed(2) + '"/>' +
              '<title>' + esc(st.n) + ' \u00b7 ' + yr(st.b) +
              (st.e != null ? ' to ' + yr(st.e) : ' \u2014 still standing') +
              (st.site && st.site !== st.n ? '\non the ground called ' + esc(st.site) : '') +
              (st.by && geoName[st.by] ? '\nbuilt by ' + esc(geoName[st.by]) : '') +
              (st.endedBy && geoName[st.endedBy] ? '\nended by ' + esc(geoName[st.endedBy]) : '') +
              (st.note ? '\n' + esc(st.note) : '') + '</title></g>';
        if (nameThem)
          sh += '<text class="mp-sitelab" x="' + xy[0].toFixed(2) + '" y="' +
                (xy[1] - 4 * ivS).toFixed(2) + '" font-size="' + (5 * ivS).toFixed(3) +
                '">' + esc(st.n) + '</text>';
      });
      gs.innerHTML = sh;
    }

    /* ── THE CROSSINGS · a line only where the journey IS the fact ───────────
       An emigration, an exile, a flight. These are AUTHORED in JOURNEYS.csv
       and never derived from two seats, because two seats with a gap between
       them are not a journey — joining them would invent the passage, which is
       the refusal standing since #64d.

       DRAWN AS AN ARC, DASHED, AND IT MEANS "FROM HERE TO HERE" — NOT "THIS
       WAY". Rand sailed by Riga, Berlin, Paris and Le Havre; a straight line
       Petrograd to New York is right about the fact and wrong about the route.
       The curve and the dashes are there so no reader mistakes the one for the
       other. Where the waypoints are known and matter they belong in
       SEATS.csv, which is how the Beagle is held.

       It fades with the window like an event, because a crossing IS an event:
       bright at the year, gone once it has passed. */
    var gj = el.querySelector('.mp-journeys');
    if (gj) {
      var jh = '';
      geo.souls.forEach(function (s) {
        if (!s.journeys) return;
        s.journeys.forEach(function (j) {
          if (j.y < lo || j.y > hi) return;
          var age = APERTURE ? (hi - j.y) / APERTURE : 0;
          var op = Math.max(0.12, 1 - age * 0.88);
          var A = proj(j.a[0], j.a[1]), B = proj(j.b[0], j.b[1]);
          /* bow it away from the straight line, so it cannot be read as one */
          var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
          var dx = B[0] - A[0], dy = B[1] - A[1];
          var len = Math.hypot(dx, dy) || 1;
          var cx = mx - dy / len * len * 0.16, cy = my + dx / len * len * 0.16;
          jh += '<path class="mp-jrn" opacity="' + op.toFixed(2) + '" d="M' +
                A[0].toFixed(1) + ' ' + A[1].toFixed(1) + 'Q' + cx.toFixed(1) + ' ' +
                cy.toFixed(1) + ' ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1) + '">' +
                '<title>' + esc(s.n) + ' \u00b7 ' + yr(j.y) + ' \u00b7 ' + esc(j.what) +
                ' \u00b7 ' + esc(j.from) + ' to ' + esc(j.to) +
                (j.note ? '\n' + esc(j.note) : '') +
                '\nFROM HERE TO HERE \u2014 not the route taken</title></path>';
        });
      });
      gj.innerHTML = jh;
    }

    /* ── THE EVENTS · an instant, not a lifespan ─────────────────────────────
       A soul is drawn across the whole window because they LIVED through it.
       An event happened in one year, and drawing it the same way would make a
       battle behave like a tenure — Rome would burn for four centuries.

       So an event FADES WITH DISTANCE FROM THE LEADING EDGE. Bright at the
       year you are standing on, dim as it recedes into the window's past,
       gone when it leaves. Scrubbing forward, an event flares and passes.
       That is the difference between happening and enduring, drawn.

       AND IT MUST NOT LOOK LIKE A SEAT. A soul is a filled cyan disc; the sky
       is amber; an event is an EMBER BURST, open at the centre. Drawn alike, a
       map would assert that a philosopher and the sack of a city are the same
       kind of fact. A territory event is a DASHED OUTLINE, not the soft fill a
       soul's territory uses — "somewhere in here" about a war is not the same
       claim as "somewhere in here" about a life. */
    var ge = el.querySelector('.mp-events');
    if (events && ge) {
      var eh = '', ivE = 1 / K, near = APERTURE <= 42;
      events.forEach(function (ev) {
        if (ev.y < lo || ev.y > hi) return;
        /* age within the window: 0 at the leading edge, 1 at the trailing one */
        var age = APERTURE ? (hi - ev.y) / APERTURE : 0;
        var op = Math.max(0.14, 1 - age * 0.86);
        if (ev.lat != null) {
          var xy = proj(ev.lat, ev.lon), a = 3.4 * ivE;

          /* ── THE PULSE · a ring that means WHEN, not how far · 5 Sep ────────
             A concentric ring around an event is the most persuasive false
             mark a history map can draw. It asserts a DISTANCE and a UNIFORM
             FALLOFF, and nobody has either: Vesuvius killed Pompeii at 8 km
             and dusted Egypt with ash, and no circle describes that. The same
             refusal as trade routes and troop movements (#64d).

             THIS RING IS NOT THAT, AND ONE PROPERTY GUARANTEES IT: IT IS DRAWN
             IN SCREEN SPACE. Its radius is a fixed number of pixels and is
             counter-scaled, so zooming in grows the coastline and leaves the
             ring exactly where it was. A spatial claim scales with the map. A
             temporal one does not. Anything that refuses to scale cannot be
             read as kilometres, and that is the whole of the argument.

             What it encodes is AGE: at the event's own year the mark is a
             bright point; scrub forward and the ring opens and thins as the
             year recedes, until it is gone. It says "this happened, and it is
             receding", which is the one thing the register actually knows. */
          /* ── HOW LONG IT WENT ON MATTERING · 5 Sep ─────────────────────────
             The pulse used to fade over one APERTURE, which is a property of
             the reader's window and says nothing about the event. Now it fades
             over the event's own ECHO — 2000 years for the fall of
             Constantinople, 150 for Bosworth, and one generation for anything
             unlisted, which is the honest default.

             THIS IS A JUDGEMENT AND THE SURFACE SAYS SO. Nothing in the
             register knows how long an event mattered; it is authored in
             EVENTS.csv exactly as Place is, and it ranks events by importance
             in one person's voice. That is a real editorial claim, made
             deliberately rather than slipped in as an effect.

             The ring still refuses to be a distance: it is counter-scaled, so
             zooming grows the coastline and leaves the ring where it was. */
          var since = hi - ev.y;
          /* `until` is a REAL YEAR — the comet return that ends the smouldering
             — supplied by probe-events from the register's own 48 passes.
             Without one, an event burns out within a generation, which is the
             honest default for something nobody has judged. */
          /* `open` means it has not gone out: the smoulder runs to the edge of
             the register, so an event from 3100 BC is still alight today for
             the same reason one from 1991 is. A count could not do that — see
             probe-events, where a fixed 26 passes silently extinguished the
             oldest claims it was meant to keep burning. */
          var endY = ev.passes === 'open' ? YEAR_MAX
                   : (ev.until != null ? ev.until : ev.y + 40);
          var echo = Math.max(1, endY - ev.y);
          if (since >= 0 && since <= echo) {
            var t = since / echo;                         /* 0 at the year, 1 when spent */
            var rr = (2 + t * 26) * ivE;                  /* pixels, counter-scaled */
            var ro = (1 - t) * (1 - t) * 0.5;
            if (ro > 0.02)
              eh += '<circle class="mp-pulse" cx="' + xy[0].toFixed(2) + '" cy="' +
                    xy[1].toFixed(2) + '" r="' + rr.toFixed(2) + '" opacity="' +
                    ro.toFixed(3) + '"/>';
            /* ── WHITE HOT, THEN COOLING · 5 Sep ───────────────────────────
               The event's own decade burns WHITE. Not the ember orange the
               ring uses — white, because that is what the top of a fire looks
               like, and because a smoulder that never had a hot moment is not
               a smoulder, it is a stain.

               THE DECADE IS TEN REAL YEARS, not a fraction of anything. It
               does not scale with the aperture and it does not scale with the
               echo: an event is white hot for a decade whether it went on to
               matter for two comet passes or twenty-six. How LONG it burned
               and how HOT are different claims and must not be tied together.

               After the decade it cools along a ramp — white to amber to the
               ember the ring is drawn in — so the mark reads as a temperature
               falling rather than a dot fading. The sky's whites are warm
               creams and live in the band and over Giza; this one is cold
               white on the land, and the two do not meet. */
            var HOT = 10;
            if (since <= HOT) {
              var heat = 1 - since / HOT;             /* 1 at the year, 0 a decade on */
              var cr = 255,
                  cg = Math.round(255 - (1 - heat) * 80),
                  cb = Math.round(255 - (1 - heat) * 160);
              eh += '<circle class="mp-flash" cx="' + xy[0].toFixed(2) + '" cy="' +
                    xy[1].toFixed(2) + '" r="' + ((1.4 + heat * 1.8) * ivE).toFixed(2) +
                    '" fill="rgb(' + cr + ',' + cg + ',' + cb + ')" opacity="' +
                    (0.55 + heat * 0.45).toFixed(2) + '"/>';
              /* a halo only at the height of it, so the decade has a peak */
              if (heat > 0.5)
                eh += '<circle class="mp-halo" cx="' + xy[0].toFixed(2) + '" cy="' +
                      xy[1].toFixed(2) + '" r="' + ((3 + heat * 4) * ivE).toFixed(2) +
                      '" opacity="' + ((heat - 0.5) * 0.5).toFixed(3) + '"/>';
            }
          }
          eh += '<g class="mp-ev" data-y="' + ev.y + '" data-n="' + esc(ev.n) + '" opacity="' + op.toFixed(2) + '">' +
                '<path class="mp-evmark" d="M' + (xy[0] - a).toFixed(2) + ' ' + xy[1].toFixed(2) +
                'h' + (a * 0.8).toFixed(2) + 'M' + (xy[0] + a).toFixed(2) + ' ' + xy[1].toFixed(2) +
                'h' + (-a * 0.8).toFixed(2) + 'M' + xy[0].toFixed(2) + ' ' + (xy[1] - a).toFixed(2) +
                'v' + (a * 0.8).toFixed(2) + 'M' + xy[0].toFixed(2) + ' ' + (xy[1] + a).toFixed(2) +
                'v' + (-a * 0.8).toFixed(2) + '"/>' +
                '<title>' + esc(ev.n) + ' \u00b7 ' + yr(ev.y) +
                (ev.place ? ' \u00b7 ' + esc(ev.place) : '') +
                (ev.note ? '\n' + esc(ev.note) : '') +
                '\n\u2014 hover to light everyone who was alive for it</title></g>';
          if (near)
            eh += '<text class="mp-evlab" x="' + xy[0].toFixed(2) + '" y="' +
                  (xy[1] + 6 * ivE).toFixed(2) + '" font-size="' + (5.2 * ivE).toFixed(3) +
                  '" opacity="' + op.toFixed(2) + '">' + esc(ev.n) + '</text>';
        } else if (ev.ext) {
          var q = proj(ev.ext[2], ev.ext[1]), r2 = proj(ev.ext[0], ev.ext[3]);
          eh += '<rect class="mp-evarea" x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) +
                '" width="' + Math.max(2, r2[0] - q[0]).toFixed(1) + '" height="' +
                Math.max(2, r2[1] - q[1]).toFixed(1) + '" rx="4" opacity="' + (op * 0.8).toFixed(2) +
                '"><title>' + esc(ev.n) + ' \u00b7 ' + yr(ev.y) + ' \u00b7 somewhere in ' +
                esc(ev.place || '') + (ev.note ? '\n' + esc(ev.note) : '') + '</title></rect>';
        }
      });
      ge.innerHTML = eh;
      lastEvents = events.filter(function (e) {
        return e.y >= lo && e.y <= hi && (e.lat != null || e.ext);
      }).length;
    } else lastEvents = 0;

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
      /* ── DATED, OR MERELY BORN THERE · 5 Sep ─────────────────────────────
         A seat holding anyone whose position is DATED is ringed. Two claims
         sit on this map — "the record places them here in this year" and "this
         is where they were born" — and a reader has no way to tell them apart
         unless the mark says so. Twenty-six souls are the first kind and 838
         the second, and the difference is the whole of SLIP #68. */
      g.classList.toggle('mp-dated', p.who.some(function (w) { return w.dated; }));
      /* the lives at this seat, so an event can ask who was alive for it */
      g.setAttribute('data-lives', p.who.map(function (w) { return w.b + ':' + w.d; }).join(','));
      g.setAttribute('data-who', p.who.map(function (w) { return w.k; }).join(','));
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
    /* Seats behind the list panel keep their dot and lose their label: the
       name is already in the column, two feet to the left and four times the
       size. Printing it twice is how Constantinople ended up written over
       itself. */
    var GUTTER = 268 / (el.querySelector('svg') || { clientWidth: 1000 }).clientWidth * VB_W;
    var placed = [], shown = 0, hidden = 0;
    [].slice.call(gp.children)
      .filter(function (g) { return !g.classList.contains('mp-out'); })
      .sort(function (x, y) { return y._rank - x._rank; })
      .forEach(function (g) {
        var x = g._x, y = g._y, w = g._w, fits = true;
        if (x * K + TX < 0) fits = false;      /* off the left edge entirely */
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

    /* ── WHAT WAS STANDING · the right-hand column ────────────────────────────
       The built things get their own list, because they are not souls and the
       left column is a roll of the living. A site that fell inside this window
       is dimmed rather than dropped — it was standing for part of it, and the
       reader should see the loss happen rather than find a gap. */
    var bb = el.querySelector('.mp-blist .mp-listbody'),
        bh = el.querySelector('.mp-blist .mp-listhead');
    if (bb) {
      var std = [], fell = [];
      (geo.sites || []).forEach(function (st) {
        if (st.b > hi) return;
        if (st.e != null && st.e < lo) return;
        (st.e == null || st.e > hi ? std : fell).push(st);
      });
      /* ── A BUILDING KEEPS ITS PEOPLE · 5 Sep ────────────────────────────
         `by` and `ended_by` are ROSTER KEYS, so a building is joined to the
         souls who raised and ended it. The right column names them and the
         hover lights them in the left column and on the map.

         AND THE BUILDER IS USUALLY DEAD. Solomon's temple stood for 374 years
         after Solomon; hovering it in 700 BC lights nobody, because he is not
         in the window. That is not a gap to paper over — it IS the difference
         between a soul and a building, and the reason they needed separate
         registers. The row says so rather than failing quietly. */
      var soulName = {}, soulLives = {};
      geo.souls.forEach(function (x) { soulName[x.k] = x.n; soulLives[x.k] = [x.b, x.d]; });
      var bhtml = '';
      std.concat(fell).forEach(function (st) {
        var gone = !(st.e == null || st.e > hi);
        var who = [];
        if (st.by && soulName[st.by]) who.push({ k: st.by, verb: 'built by' });
        if (st.endedBy && soulName[st.endedBy]) who.push({ k: st.endedBy, verb: 'ended by' });
        bhtml += '<div class="mp-bi' + (gone ? ' mp-bgone' : '') + '" data-site="' +
                 esc(st.n) + '"' +
                 (st.by && soulName[st.by] ? ' data-built="' + esc(st.by) + '"' : '') +
                 (st.endedBy && soulName[st.endedBy] ? ' data-ended="' + esc(st.endedBy) + '"' : '') +
                 '>' + esc(st.n) +
                 ' <span class="mp-bwhen">' + (gone ? 'fell ' + yr(st.e) : yr(st.b)) + '</span>' +
                 (who.length ? '<span class="mp-bby">' + who.map(function (w) {
                   var L = soulLives[w.k], here = L && L[0] <= hi && L[1] >= lo;
                   var cls = w.verb === 'ended by' ? 'mp-bkill' : 'mp-bmade';
                   return '<span class="' + cls + '">' + w.verb + ' ' +
                          esc(soulName[w.k]) + (here ? '' : ' \u2020') + '</span>';
                 }).join('<br>') + '</span>' : '') +
                 '</div>';
      });
      bb.innerHTML = bhtml || '<div class="mp-bi" style="color:#5d6e84">nothing built yet</div>';
      bh.textContent = std.length + ' standing' + (fell.length ? ' \u00b7 ' + fell.length + ' fell' : '');
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
        /* ── WHEN GIZA LEAVES THE FRAME · 4 Sep ────────────────────────────
           The signs are anchored over Giza because that is where the register
           computed them, and at world scale that is the whole story. Zoomed
           in it is not: MEASURED, Giza is off screen at Chang'an by x4 and
           anywhere in the Americas from x2, so a reader exploring the Han
           court or Tenochtitlan silently loses the event entirely.

           Leaving it would be defensible and unhelpful. Drawing it where they
           are looking would be a lie — the conjunction was not observed over
           Chang'an. So it moves to THE BAND, which is already declared as not
           the earth and is exactly where a placeless sky claim belongs. Same
           reasoning that put Halley there rather than on a coordinate. The
           label keeps saying over Giza, so the observer is never lost. */
        var gizaOn = (gzc[0] * K + TX) >= 0 && (gzc[0] * K + TX) <= VB_W &&
                     (gzc[1] * K + TY) >= 0 && (gzc[1] * K + TY) <= VB_H;
        var kindWord = recent.kind === 'gathering' ? 'gathering' : 'great conjunction';

        if (gizaOn) {
          var span = (bodies.length - 1) * 7 * iv;
          bodies.forEach(function (sg, i) {
            hg += '<text class="mp-sign mp-over" x="' + (gzc[0] - span / 2 + i * 7 * iv).toFixed(2) +
                  '" y="' + (gzc[1] - 8 * iv).toFixed(2) + '" font-size="' + (7 * iv).toFixed(3) +
                  '">' + sg + '</text>';
          });
          hg += '<text class="mp-obslabel" x="' + gzc[0].toFixed(2) + '" y="' + (gzc[1] - 15 * iv).toFixed(2) +
                '" font-size="' + (5 * iv).toFixed(3) + '">' + kindWord +
                ' \u00b7 ' + yr(recent.y) + '</text>';
        } else {
          var bx = 560;
          bodies.forEach(function (sg, i) {
            h += '<text class="mp-sign" x="' + (bx + i * 9) + '" y="' + (bandY + 3) + '">' + sg + '</text>';
          });
          h += '<text class="mp-obslabel" x="' + (bx + bodies.length * 9 + 4) + '" y="' + (bandY + 3) +
               '" text-anchor="start">' + kindWord + ' \u00b7 ' + yr(recent.y) +
               ' \u00b7 over giza, off frame</text>';
        }
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
      /* ── PAST THE END OF THE SKY · 5 Sep ─────────────────────────────────
         The register's last Jupiter rising is AD 2022 and the map opens at
         2026, so there is no NEXT and the line was not drawn. The guard is
         right to refuse — extrapolating a rising the register does not hold
         would be inventing sky — but it refused INVISIBLY, and a reader at the
         default view saw nothing and concluded the feature was missing. That
         is the third time today a correct refusal has read as a broken
         feature.

         So it says so. The line still is not drawn, because there is nothing
         honest to draw; the surface states the reason where the count would
         have been. */
      /* ── THE LINE IS NOT THE COUNT · corrected 5 Sep ─────────────────────
         The whole thing was drawn only when a rising existed BEFORE and AFTER
         the current year, so at the default view — 2026, past the register's
         last rising in 2022 — nothing appeared. The first fix added a note
         explaining the absence, which was still wrong.

         THE LINE IS GIZA'S LATITUDE. That is geography and it is true in
         every year the map can show. Only the TRAVELLING SIGN is a count, and
         only the sign needs a next arrival to travel toward. Tying the two
         together made a permanent fact conditional on a passing one.

         So: the line and the mark at Giza always. The sign when there is
         something for it to count. */
      var gzr = proj(GIZA[0], GIZA[1]);
      hg += '<line class="mp-return" x1="0" y1="' + gzr[1].toFixed(2) +
            '" x2="1000" y2="' + gzr[1].toFixed(2) + '"/>' +
            '<path class="mp-retmark" d="M' + gzr[0].toFixed(2) + ' ' +
            (gzr[1] - 4 / K).toFixed(2) + 'v' + (8 / K).toFixed(2) + '"/>';

      if (prev && !next) {
        hg += '<text class="mp-obslabel" x="6" y="' + (gzr[1] - 4 / K).toFixed(2) +
              '" font-size="' + (5 / K).toFixed(3) + '" text-anchor="start">' +
              '\u2643 last rose due east over giza in ' + yr(prev.y) +
              ' \u00b7 the register ends there</text>';
      }
      if (prev && next) {
        var frac = (hi - prev.y) / (next.y - prev.y);      /* 0 at a rising, 1 at the next */
        /* west to east, so it returns TO Giza rather than away from it */
        var lonNow = GIZA[1] + frac * 360;
        while (lonNow > 180) lonNow -= 360;
        var jp = proj(GIZA[0], lonNow);

        /* the mark thickens as it closes on Giza — the return is the event */
        /* ── THE ARRIVAL IS THE EVENT · 5 Sep ────────────────────────────────
           The sign only brightened as it closed, and a brightening is easy to
           miss on a line that was itself invisible until today. The RETURN is
           the whole reason this line exists — the moment Jupiter stands due
           east over the pyramids again — so it changes STATE, not merely
           intensity: amber while it travels, and white at the arrival.

           The window is a tenth of the interval either side, so at a five-year
           return it lights for about six months of scrubbing and at a seven-
           year return for rather less. It marks the event, not its
           neighbourhood. */
        var atGiza = frac < 0.1 || frac > 0.9;
        hg += '<text class="mp-jup' + (atGiza ? ' mp-jup-home' : '') + '" x="' +
              jp[0].toFixed(2) + '" y="' + (gzr[1] + 2.6 / K).toFixed(2) +
              '" font-size="' + ((atGiza ? 10 : 8) / K).toFixed(3) + '" opacity="' +
              (atGiza ? 1 : 0.5 + 0.3 * (1 - Math.min(1, Math.abs(0.5 - frac) * 2))).toFixed(2) +
              '">\u2643</text>';
        if (atGiza)
          hg += '<circle class="mp-jup-ring" cx="' + gzr[0].toFixed(2) + '" cy="' +
                gzr[1].toFixed(2) + '" r="' + (7 / K).toFixed(2) + '"/>';
        hg += '<title>Jupiter\u2019s return: rose due east over Giza in ' + yr(prev.y) +
             ', next in ' + yr(next.y) + ' \u2014 ' + (next.y - prev.y) + ' years. ' +
             'This line is a COUNT to that return along Giza\u2019s latitude, not Jupiter\u2019s position.</title>';
        hg += '<text class="mp-obslabel" x="6" y="' + (gzr[1] - 4 / K).toFixed(2) +
              '" font-size="' + (5 / K).toFixed(3) + '" text-anchor="start">' + (atGiza ? '\u2643 due east over giza \u2014 the return, ' + yr(hi) + ' \u00b7 a count, not a position' : '\u2643 returns due east over giza in ' +
             Math.max(0, next.y - hi) + 'y \u00b7 a count, not a position') + '</text>';
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

    /* ── THE YEAR'S OWN EVENT ────────────────────────────────────────────────
       Tolerance scales with the aperture: at one Jupiter a reader steps in
       years and the edge lands squarely on a date; at "all of it" a step is
       decades and nothing would ever match exactly. A hundredth of the window
       either side, and at least one year — so the flash means "you are on it"
       at every scale rather than only at the close ones. */
    var mk = el.querySelector('.mp-mark');
    if (mk) {
      var tol = Math.max(1, Math.round(APERTURE / 100)), at = [];
      if (sky) sky.forEach(function (e) {
        if (e.kind === 'due-east') return;
        if (Math.abs(e.y - hi) <= tol)
          at.push({ sign: e.kind === 'gathering' ? '\u2643\u2644\u2645\u2646' : '\u2643\u2644',
                    what: e.kind === 'gathering' ? 'the outer planets gather' : 'a great conjunction',
                    y: e.y });
      });
      if (comets) comets.forEach(function (e) {
        if (Math.abs(e.y - hi) <= tol)
          at.push({ sign: '\u2604', what: 'Halley returns', y: e.y });
      });
      if (at.length) {
        mk.innerHTML = at.slice(0, 2).map(function (a) {
          return '<span class="mp-marksign">' + a.sign + '</span> ' + esc(a.what) +
                 ', ' + yr(a.y);
        }).join('   \u00b7   ');
        mk.classList.add('on');
      } else {
        mk.classList.remove('on');
      }
    }

    /* THE READOUT NAMES THE SILENCE. */
    var t = geo.totals;
    el.querySelector('.mp-read').textContent = yr(lo) + ' \u2014 ' + yr(hi);
    el.querySelector('.mp-note').textContent =
      (AP_NAME[APERTURE] ? AP_NAME[APERTURE] + ' \u00b7 ' : '') +
      'seats are mostly BIRTHPLACES, not where a soul worked \u00b7 ' +
      /* SOULS AND SEATS ARE DIFFERENT NUMBERS and this line said "seats" while
         counting souls — 379 souls at 246 seats, because Constantinople alone
         holds 124. On a surface whose whole argument is that a dot may stand
         for many, conflating the two is not a wording slip. */
      pins.length + ' souls at ' + lastSeats + ' seats \u00b7 ' + lastShown + ' named' +
      (lastEvents ? ' \u00b7 ' + lastEvents + ' event(s) in this window' : '') +
      (lastHidden ? ', ' + lastHidden + ' name(s) with no room \u2014 hover the pin' : '') +
      ' \u00b7 ' + washes.length + ' souls shown as territory' +
      (lastSky ? ' \u00b7 sky: ' + lastConj + ' conjunction(s), ' + lastGath +
                 ' gathering(s) of ' + lastSky + ' computed at giza' : '') +
      (lastHalley ? ' \u00b7 ' + lastHalley + ' halley return(s), seen from everywhere' : '') +
      ' \u00b7 ' +
      /* TWO FACTS, NOT ONE BLURRED NUMBER. 204 of these will never be drawn:
         188 were never recorded and 9 are not on this earth — Asgard, Eden,
         the primordial sea. The other 228 name a real place nothing could
         resolve, mostly ancient seats no modern gazetteer holds, and those
         are a BACKLOG rather than a silence. Reported as one figure of 432,
         the difference between "there is nothing to know" and "we have not
         looked it up yet" disappears. */
      t.silent + ' have no place on earth (' + (t.silent - 9) + ' unrecorded, 9 mythic) \u00b7 ' +
      t.unplaced + ' name a place nothing could resolve \u2014 those can be found. ' +
      'Neither is drawn. ' +
      'Seats from GeoNames (CC BY 4.0); ' +
      (el.classList.contains('mp-atlas')
        ? 'coastline, relief, rivers, lakes, named regions and peaks from Natural Earth.'
        : 'coastline, rivers, lakes, named regions and peaks from Natural Earth.');
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

        var whatBtn = el.querySelector('.mp-what-btn'), whatPanel = el.querySelector('.mp-what');
        function showWhat(on) {
          whatPanel.hidden = !on;
          whatBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        whatBtn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          showWhat(whatPanel.hidden);
        });
        /* Escape closes the panel before it closes the map — a reader pressing
           it means the thing most recently opened. */
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && !whatPanel.hidden) { e.stopPropagation(); showWhat(false); }
        }, true);

        /* ── A YEAR AT A TIME · 5 Sep ─────────────────────────────────────────
           The only way to land EXACTLY on a year, because no hand is involved.
           The register is dated to the year and a drag across 6,026 of them
           cannot be, however it is damped. Arrow steps one year; shift steps a
           tenth of the window, so the gesture scales with what is being read.
           Home and End go to the ends of the register. */
        document.addEventListener('keydown', function (e) {
          if (!document.body.classList.contains('scene-map')) return;
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          var t = e.target;
          if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
          var step = e.shiftKey ? Math.max(1, Math.round(APERTURE / 10)) : 1;
          if (e.key === 'ArrowRight')      { setEdge(hi + step); e.preventDefault(); }
          else if (e.key === 'ArrowLeft')  { setEdge(hi - step); e.preventDefault(); }
          else if (e.key === 'Home')       { setEdge(YEAR_MIN + APERTURE); e.preventDefault(); }
          else if (e.key === 'End')        { setEdge(YEAR_MAX); e.preventDefault(); }
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
        /* ── SIX THOUSAND YEARS ON A THOUSAND PIXELS · 5 Sep ──────────────────
           MEASURED: the track spans 6,026 years. On a 1000px window that is
           SIX YEARS PER PIXEL, so at the Jupiter aperture — six years — ONE
           PIXEL OF HAND JITTER MOVES THE WINDOW BY ITS ENTIRE WIDTH. A reader
           could not land on a year, only near one, and the register is dated
           to the year. The instrument was finer than its own control.

           Three answers, and none of them changes the mapping, because the
           mapping is honest: the whole span must be reachable in one gesture.

           1 · PRECISION DRAG. Pull away from the track and the sensitivity
               falls. At the track it is 6 years a pixel; 200px below it is a
               tenth of that. The idiom is borrowed from audio and video
               scrubbers, where the same problem is solved the same way, and it
               costs a reader nothing to not know about.

           2 · ONE DRAW PER FRAME. Every pointermove used to trigger a full
               rebuild — ruler, marks, labels, sky — and a trackpad fires 120 a
               second. Much of the jumpiness was the browser falling behind
               rather than the hand moving. Coalesced now.

           3 · ARROW KEYS. A year at a time with no hand in it at all, which is
               the only way to land exactly. Shift steps a tenth of the window. */
        var anchorYear = null, anchorX = 0;

        function chronoYear(ev) {
          var r = chrono.getBoundingClientRect();
          var yearsPerPx = (YEAR_MAX - YEAR_MIN) / r.width;

          /* how far the pointer has strayed from the track, in pixels */
          var dy = 0;
          if (ev.clientY > r.bottom) dy = ev.clientY - r.bottom;
          else if (ev.clientY < r.top) dy = r.top - ev.clientY;
          /* 1 at the track, falling to 0.1 by 200px away — never to zero, or
             the control would stop responding and read as broken */
          var fine = 1 / (1 + Math.min(dy, 220) / 24);

          if (anchorYear == null || fine >= 0.999) {
            var f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            var y = YEAR_MIN + f * (YEAR_MAX - YEAR_MIN);
            anchorYear = y; anchorX = ev.clientX;
            return y;
          }
          /* off the track: move RELATIVE to where precision began, so the year
             does not leap when the pointer drops below the rail */
          return anchorYear + (ev.clientX - anchorX) * yearsPerPx * fine;
        }

        /* coalesce to one redraw per frame */
        var pending = null, framed = false;
        function scrubTo(y) {
          pending = y;
          if (framed) return;
          framed = true;
          requestAnimationFrame(function () {
            framed = false;
            if (pending != null) { setEdge(pending); pending = null; }
          });
        }

        chrono.addEventListener('pointerdown', function (ev) {
          scrubbing = true; anchorYear = null;
          chrono.setPointerCapture(ev.pointerId);
          setEdge(chronoYear(ev));
          chrono.classList.add('mp-scrubbing');
        });
        chrono.addEventListener('pointermove', function (ev) {
          if (scrubbing) {
            scrubTo(chronoYear(ev));
            /* say what the drag is doing, or precision mode is a secret */
            var r = chrono.getBoundingClientRect();
            var dy = ev.clientY > r.bottom ? ev.clientY - r.bottom
                   : ev.clientY < r.top ? r.top - ev.clientY : 0;
            var lab = el.querySelector('.mp-fine');
            if (lab) {
              var f = 1 / (1 + Math.min(dy, 220) / 24);
              lab.textContent = f < 0.95 ? '\u00d7' + (1 / f).toFixed(1) + ' finer' : '';
              lab.classList.toggle('on', f < 0.95);
            }
          }
        });
        ['pointerup', 'pointercancel'].forEach(function (t) {
          chrono.addEventListener(t, function () {
            scrubbing = false; anchorYear = null;
            chrono.classList.remove('mp-scrubbing');
            var lab = el.querySelector('.mp-fine');
            if (lab) { lab.textContent = ''; lab.classList.remove('on'); }
          });
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
      /* ── PLACING IS NOT OPENING · 4 Sep ──────────────────────────────────
         This called takeScreen() and added scene-map, so answering a question
         about Josephus threw the map over the answer ABOUT A SECOND AFTER IT
         ARRIVED — the reader is mid-sentence and the page changes underneath
         them. Nothing asked for the map; the hall was asked for a name.

         Placing SETS WHERE THE MAP WILL OPEN. It does not take the screen.
         The faculty rail is how a reader opens a surface, and it stays the
         only way — a view a visitor did not ask for is an interruption, not a
         feature, however good the view is.

         If the map is ALREADY open the reader is looking at it, and moving it
         to the soul they just asked about is the answer rather than an
         interruption. So: redraw when open, stay quiet when closed. */
      containClicks(el);
      anchorKey = soul.k;
      setEdge(soul.d);
      if (document.body.classList.contains('scene-map')) draw();
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
