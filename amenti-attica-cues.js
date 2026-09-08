/* ============================================================================
   amenti-attica-cues.js  ·  FIRE, AND WHAT THE WIND DID WITH IT
   ----------------------------------------------------------------------------
   A sheet over the Attica surface that animates a handful of recorded events.
   Nothing here is decoration and nothing here is new: every cue points at a
   row in ATTICA-EVENTS.csv and at a passage that row already cites.

   ── THE ONE RULE THIS LAYER RUNS ON ───────────────────────────────────────

       IT MAY ANIMATE INTENSITY AND TIME. IT MAY NEVER ANIMATE EXTENT.

   A plume that GROWS draws a boundary at every frame, and a boundary is a
   claim about how far — which is exactly what the Vesuvius ring was refused
   for on this ship. A plume that DRIFTS AND FADES says fire here, wind that
   way, and both halves of that are recorded.

   So: points brighten and dim, particles drift and thin, and no mark ever
   reaches further this second than it did last second.

   ── WHY FIRE AND NOT BIRDS ────────────────────────────────────────────────
   THE TEST IS WHETHER THE CUE CAN NAME A PASSAGE.

   Thucydides describes the burials failing during the plague — bodies thrown
   on other men's pyres, the customs breaking down entirely. Scattered fire
   across the city IS that record, and it is scattered rather than single
   because the failure was general and one mark would say it happened HERE.

   Ravens along the shore is inference from the scene. Nobody wrote it, it
   would be the most convincing thing on the surface, and it would rest on
   nothing. ATMOSPHERE PERSUADES PEOPLE OF THINGS NOBODY RECORDED, which is
   the whole reason this layer is narrow.

   (And at 39 metres a pixel a raven is a ten-thousandth of a pixel. The
   medium and the evidence agree about how much can be shown, which has
   happened often enough on this surface to be worth noticing.)

   ── THE ONE DIRECTIONAL FACT THAT IS NOT A GUESS ──────────────────────────
   The Etesians blow from the north through the Attic summer. That is a
   seasonal fact about the whole season, not a claim about a particular day,
   so smoke drifts SOUTH and the file says why. It is the only direction in
   this layer, and it is the only one there is evidence for.

   ── A MODULE ──────────────────────────────────────────────────────────────
   One script tag, no edit to amenti-attica.js. It reads that surface's camera
   and its year, draws into its own group, and refuses — naming what is
   missing — rather than animating an empty screen.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var LA0 = 36.542, LA1 = 39.425, LO0 = 21.899, LO1 = 25.556, VB = 1000;

  /* ── THE CUES, EACH POINTING AT A ROW AND A PASSAGE ──────────────────────
     `spread` is how far the scattered points are strewn, in kilometres, and it
     is FIXED — it does not grow with time, with intensity or with anything
     else. It says "across the city" or "at this place", which is the
     granularity the sources have. */
  var CUES = [
    { year: -480, name: 'Athens burned by the Persians',
      lat: 37.9755, lon: 23.72265, kind: 'fire', points: 9, spread: 1.6,
      why: 'The city and the Acropolis were burned. The Older Parthenon came ' +
           'down and its scorched drums were built into the north wall and ' +
           'left showing.' },
    { year: -430, name: 'The plague at Athens',
      lat: 37.9700, lon: 23.7200, kind: 'pyres', points: 22, spread: 2.4,
      why: 'Thucydides 2.52: the burials failed. Bodies were thrown on other ' +
           'men\u2019s pyres and the customs broke down. SCATTERED, because the ' +
           'failure was general — one mark would say it happened here.' },
    { year: -430, name: 'The plague came ashore',
      lat: 37.93722, lon: 23.64461, kind: 'fire', points: 4, spread: 0.9,
      why: 'It came in through Piraeus, into a population packed inside the ' +
           'Long Walls by the war.' },
    { year: 1687, name: 'The Parthenon explodes',
      lat: 37.97156, lon: 23.72658, kind: 'blast', points: 1, spread: 0.15,
      why: 'A Venetian shell reached the Ottoman powder store inside the ' +
           'temple. ONE MOMENT, one place, and the mark does not scatter.' }
  ];

  var FADE = 6;        /* years either side that a cue burns at all */
  var WIND = 168;      /* degrees: the Etesians blow from the north, so south */

  var layer = null, svg = null, host = null, open = false, raf = 0, t0 = 0;

  function proj(lat, lon) {
    return [(lon - LO0) / (LO1 - LO0) * VB, (LA1 - lat) / (LA1 - LA0) * VB];
  }
  var NEEDS = [
    ['#amenti-attica', 'the Attica surface'],
    ['#amenti-attica .at-view', 'its camera group']
  ];
  function missing() {
    for (var i = 0; i < NEEDS.length; i++) {
      if (!document.querySelector(NEEDS[i][0])) { return NEEDS[i]; }
    }
    return null;
  }
  function camera() {
    var v = document.querySelector('#amenti-attica .at-view');
    var t = (v && v.getAttribute('transform')) || '';
    return {
      K: parseFloat((t.match(/scale\(([-\d.]+)\)/) || [])[1] || '1'),
      t: t
    };
  }
  /* ── THE YEAR IS READ, NOT KEPT ──────────────────────────────────────────
     amenti-attica.js owns the scrub and does not know this file exists, so the
     year is taken off the readout it prints. If that readout changes shape
     this returns null and the layer says it cannot see the clock rather than
     burning at every year. */
  function year() {
    var n = document.querySelector('#amenti-attica .at-clockread');
    var t = n ? n.textContent.trim() : '';
    var m = t.match(/^(\d+)\s*BC$/i);
    if (m) { return -(+m[1]); }
    m = t.match(/^AD\s*(\d+)$/i);
    if (m) { return +m[1]; }
    return null;
  }

  function style() {
    if (document.getElementById('atc-css')) { return; }
    var s = document.createElement('style');
    s.id = 'atc-css';
    s.textContent = [
      '#amenti-attica .atc-layer{pointer-events:none}',
      /* fire is the map's own event colour, hotter at the core */
      '#amenti-attica .atc-fire{fill:#ffb257}',
      '#amenti-attica .atc-core{fill:#fff0d0}',
      /* SMOKE HAS NO EDGE. No stroke, no defined boundary, and it thins with
         distance rather than stopping — because where it stopped is the one
         thing nobody recorded. */
      '#amenti-attica .atc-smoke{fill:#8e8478}',
      '#amenti-attica .atc-lab{fill:#ffc379;text-anchor:middle;',
      '  paint-order:stroke;stroke:#05080e;stroke-opacity:.85;',
      '  stroke-linejoin:round;letter-spacing:.03em}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* a stable pseudo-random so the same cue scatters the same way every frame —
     points that jump about each redraw would read as motion nobody claimed */
  function rnd(i, salt) {
    var x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function draw(now) {
    if (!open || !layer) { return; }
    var cam = camera();
    layer.setAttribute('transform', cam.t);
    var iv = 1 / cam.K;
    var y = year();
    var ms = (now - t0) / 1000;
    var h = '', lit = 0;

    if (y !== null) {
      CUES.forEach(function (c, ci) {
        var d = Math.abs(c.year - y);
        if (d > FADE) { return; }
        /* INTENSITY IS THE ONLY THING THE YEAR MOVES. Full on the year, gone
           six years out, and the SPREAD never changes with it. */
        var burn = 1 - d / FADE;
        lit++;
        var base = proj(c.lat, c.lon);
        var km = function (k) { return k / 111 / (LA1 - LA0) * VB; };

        for (var i = 0; i < c.points; i++) {
          var a = rnd(i, ci) * Math.PI * 2;
          var r = Math.sqrt(rnd(i, ci + 7)) * km(c.spread);
          var px = base[0] + Math.cos(a) * r * 1.3;   /* the box is wider in lon */
          var py = base[1] + Math.sin(a) * r;

          /* the flicker: intensity only, and out of phase per point so the
             scatter breathes rather than pulsing as one object */
          var f = 0.6 + 0.4 * Math.sin(ms * 2.2 + i * 1.7 + ci);
          var s = (0.9 + 0.5 * f) * burn * iv;

          /* ── SMOKE DRIFTS AND THINS. IT DOES NOT EXPAND. ──────────────
             Each puff is placed along a fixed bearing at a fixed set of
             distances and simply fades with distance. Nothing here reaches
             further at second ten than at second one, because how far the
             smoke went is not in any source. */
          var wr = WIND * Math.PI / 180;
          for (var k = 1; k <= 5; k++) {
            var sd = km(c.spread * 0.55) * k;
            var sx = px + Math.sin(wr) * sd * 1.3;
            var sy = py - Math.cos(wr) * sd;
            var so = (0.16 * burn * (1 - k / 6)) * (0.7 + 0.3 * f);
            h += '<circle class="atc-smoke" cx="' + sx.toFixed(2) + '" cy="' +
                 sy.toFixed(2) + '" r="' + (s * (1.4 + k * 0.5)).toFixed(2) +
                 '" opacity="' + so.toFixed(3) + '"/>';
          }
          h += '<circle class="atc-fire" cx="' + px.toFixed(2) + '" cy="' +
               py.toFixed(2) + '" r="' + (s * 1.15).toFixed(2) +
               '" opacity="' + (0.75 * burn).toFixed(3) + '"/>' +
               '<circle class="atc-core" cx="' + px.toFixed(2) + '" cy="' +
               py.toFixed(2) + '" r="' + (s * 0.42).toFixed(2) +
               '" opacity="' + (0.9 * burn).toFixed(3) + '"/>';
        }

        if (cam.K >= 2) {
          h += '<text class="atc-lab" x="' + base[0].toFixed(2) + '" y="' +
               (base[1] - km(c.spread) - 4 * iv).toFixed(2) +
               '" style="font-size:' + (6 * iv).toFixed(3) + 'px;stroke-width:' +
               (1 * iv).toFixed(3) + 'px" opacity="' + burn.toFixed(2) + '">' +
               c.name + '</text>';
        }
      });
    }
    layer.innerHTML = h;

    var n = document.querySelector('#amenti-attica .at-clockread');
    if (n && n.parentNode) {
      var tag = n.parentNode.querySelector('.atc-said');
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'atc-said';
        tag.style.cssText = 'color:#c99a4e;font-size:10.5px;padding-left:10px';
        n.parentNode.appendChild(tag);
      }
      tag.textContent = y === null
        ? 'cues need a year — press the scrub'
        : (lit ? lit + ' cue' + (lit === 1 ? '' : 's') + ' burning · intensity ' +
                 'and drift only, never extent'
               : '');
    }
    raf = requestAnimationFrame(draw);
  }

  function show() {
    var gap = missing();
    if (gap) {
      console.log('THE CUES CANNOT OPEN \u2014 ' + gap[1] + ' (' + gap[0] + ') is not on ' +
                  'the page. Open Attica first.');
      return false;
    }
    style();
    host = document.querySelector('#amenti-attica');
    svg = host.querySelector('svg');
    if (!layer || !svg.contains(layer)) {
      layer = document.createElementNS(SVGNS, 'g');
      layer.setAttribute('class', 'atc-layer');
      svg.appendChild(layer);
    }
    open = true;
    t0 = performance.now();
    raf = requestAnimationFrame(draw);
    console.log('THE CUES: four recorded events \u2014 480 BC, 430 BC (twice), AD 1687. ' +
                'Scrub the year to them. Nothing burns at a year no source names.');
    return true;
  }
  function hide() {
    open = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (layer) { layer.remove(); layer = null; }
    var tag = document.querySelector('#amenti-attica .atc-said');
    if (tag) { tag.remove(); }
  }
  function toggle() { return open ? (hide(), false) : show(); }

  /* a flame, which is nothing else on this surface */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 21c3.5 0 6-2.4 6-5.6 0-3.6-3-5-4.2-8.4-.6 1.8-1.6 2.6-2.6 3.4' +
    'C9.4 11.6 8 13 8 15.4 8 18.6 8.5 21 12 21Z"/></svg>';

  function join() {
    if (!window.AmentiMap || !window.AmentiMap.addFaculty) { return false; }
    window.AmentiMap.addFaculty('fac-attica-cues', 'cues', ICON, toggle,
                                function () { return open; });
    return true;
  }
  function arrive(n) {
    if (join()) { return; }
    if ((n || 0) > 40) {
      console.log('THE CUES did not join the rail \u2014 AmentiMap.addFaculty was never ' +
                  'exported.');
      return;
    }
    setTimeout(function () { arrive((n || 0) + 1); }, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  } else {
    arrive(0);
  }

  new MutationObserver(function () {
    if (open && !document.body.classList.contains('scene-attica')) {
      hide();
      if (window.AmentiMap && window.AmentiMap.syncRail) { window.AmentiMap.syncRail(); }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiAtticaCues = {
    show: show, hide: hide, toggle: toggle,
    isOpen: function () { return open; },
    cues: function () {
      return CUES.map(function (c) {
        return { year: c.year, name: c.name, kind: c.kind, why: c.why };
      });
    }
  };
})();
