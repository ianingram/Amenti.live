/* ============================================================================
   amenti-glass.js  ·  THE CHART GLASS
   ----------------------------------------------------------------------------
   A magnifier that slides over the map. It reads the seats the map has already
   drawn and draws its own layer above them, spreading a crowded neighbourhood
   apart so the names the cull had to drop can be read — WITHOUT LEAVING THE
   WORLD VIEW TO DO IT.

   ── IT IS A MODULE, AND IT STAYS ONE ──────────────────────────────────────
   One script tag in hall.html and no edit to amenti-map.js, ever. It joins the
   faculty rail through the map's own exported door, AmentiMap.addFaculty —
   which exists precisely so a third instrument could arrive without either
   file learning about the other. The map does not know this file exists.

   That separation is not tidiness. amenti-map.js is 2,786 lines and every
   fault of 6 September lived in it; a surface that can only ever ADD a layer
   cannot take the map down with it. Worst case here is a glass that refuses to
   open and a map that never noticed.

   ── WHY IT IS NOT ZOOM ────────────────────────────────────────────────────
   Zoom moves the whole world and you lose the rest of it. A chart glass moves
   over a STILL world: the map stays where it is, every seat stays drawn, and a
   circle passes over one patch spreading it out. It is the gesture from a
   chart table — you do not pick the map up, you slide the glass.

   ── AND IT MAGNIFIES THE SPACE, NOT THE MARKS ─────────────────────────────
   Glass over paper magnifies the ink; it has no choice about it. This does,
   because A MARK STANDS FOR A CLAIM AND A CLAIM DOES NOT GET BIGGER. Inside
   the circle a pin is the size it is outside; only the distance between pins
   grows. That is the map's one law carried into a new instrument: a pin that
   looks bigger under the glass would be asserting something no register holds.

   ── WHAT IT IS FOR, MEASURED BEFORE IT WAS BUILT ──────────────────────────
   map-probe, 7 Sep, over the whole register: 416 seats drawn and 340 names
   dropped by the cull for want of room. 305 of those 340 sit under FIVE
   disjoint glass positions; 147 under one, over the Rhone. The instrument was
   justified by that number before a line of it was written.

   ── WHAT IT READS, AND WHAT IT DOES WHEN IT CANNOT ────────────────────────
   It reads .mp-seat, the circle inside it, .mp-name, .mp-glyph, and the
   transform on .mp-view. NONE OF THAT IS A PUBLISHED INTERFACE — it is the
   map's internals, and on 4 September .mp-name held no text at all for three
   days. A glass reading it then would have drawn nothing and looked broken.

   So it CHECKS, and says so. If the shapes it depends on are not there it
   refuses to open and states which one is missing, rather than opening onto
   an empty circle. A missing signal is not a red light; it is an instrument
   that cannot see, and it must say which.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ── THE TWO NUMBERS, AND WHY THEY ARE NOT SETTLED ────────────────────────
     R is the circle drawn. R/M is the patch of world it gathers. So it
     collects everything within R/M and spreads it across R — an area gain of M
     squared, which at 3.2 is ten times the room.

     MEASURED AGAINST THE REAL DENSITY: 157 seats inside 40 viewBox units over
     the Rhone at K=1. Scaled to this gather radius that is ~58 seats spread
     into a 156-unit circle. Ten times the room is AMPLE over Attica and NOT
     ENOUGH over the Rhone — which is exactly where the instrument was
     justified. So the pair is tunable at runtime and stated here as unsettled
     rather than presented as chosen. */
  var R = 78, M = 3.2;

  var el = null, svg = null, layer = null, body = null, count = null;
  var cx = -9999, cy = -9999, open = false, frozen = false, uid = 'mp-glass';

  /* ── WHAT THIS FILE DEPENDS ON, NAMED IN ONE PLACE ───────────────────────
     Every coupling to amenti-map.js lives here, so the day the map changes
     shape there is one list to read rather than a hunt through the file. */
  var NEEDS = [
    ['#amenti-map',        'the map surface'],
    ['#amenti-map svg',    'the map canvas'],
    ['#amenti-map .mp-view',  'the camera group the whole world hangs from'],
    ['#amenti-map .mp-pins',  'the seat layer']
    /* .nr-layer is NOT listed: the narrows are optional and the glass works
       without them. A missing layer is a layer that is switched off, which is
       a reader's choice and not a fault. */
  ];

  function missing() {
    for (var i = 0; i < NEEDS.length; i++)
      if (!document.querySelector(NEEDS[i][0])) return NEEDS[i];
    return null;
  }

  function style() {
    if (document.getElementById(uid + '-css')) return;
    var s = document.createElement('style');
    s.id = uid + '-css';
    s.textContent = [
      /* ── A GLASS SHOWS THE CHART BETTER, IT DOES NOT HIDE IT ─────────────
         This was fill-opacity .93 — near-opaque — to make the circle read as a
         thing laid ON the chart. It did, and it blacked out everything under
         it: the coastline, the rivers, the gates, the ground that tells a
         reader WHERE they are. Names floated in a dark disc.

         The rim marks the boundary. The fill does not have to, and at .93 it
         was doing a job the rim already did while destroying the one thing a
         magnifier exists to serve. Enough tint to separate the circle from the
         map, and no more. */
      '#amenti-map .gl-ground{fill:#0a1018;fill-opacity:.16;pointer-events:none}',
      '#amenti-map .gl-rim{fill:none;stroke:#5fd0e8;stroke-width:1.1;opacity:.5;',
      '  vector-effect:non-scaling-stroke;pointer-events:none}',
      '#amenti-map .gl-pin{fill:#5fd0e8;fill-opacity:.9}',
      /* a name under the glass is the same claim as a name on the map, so it
         is the same colour and the same kind of mark — only further from its
         neighbours */
      '#amenti-map .gl-name{fill:#dbe8f5;font:400 6.2px ui-monospace,Menlo,monospace;',
      '  text-anchor:middle;paint-order:stroke;stroke:#070c14;stroke-width:1.9px;',
      '  stroke-linejoin:round}',
      '#amenti-map .gl-glyph{fill:#a9d6ea;font:400 6.4px ui-monospace,Menlo,monospace;',
      '  text-anchor:middle}',
      /* the hairline home: the glass has MOVED a position and must say so */
      '#amenti-map .gl-hair{stroke:#5fd0e8;stroke-width:.4;opacity:.22}',
      '#amenti-map .gl-count{fill:#5fd0e8;font:400 7px ui-monospace,Menlo,monospace;',
      '  text-anchor:middle;opacity:.7;pointer-events:none}',
      '#amenti-map .mp-glass-layer{pointer-events:none}',
      '#amenti-map .gl-ground-mark .nr-gate{stroke:#8a9bb0;stroke-width:.9;opacity:.9}',
      '#amenti-map .gl-ground-mark .nr-forbid{opacity:.65}',
      '#amenti-map .gl-faint{opacity:.4}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function build() {
    style();
    layer = document.createElementNS(SVGNS, 'g');
    layer.setAttribute('class', 'mp-glass-layer');
    layer.innerHTML =
      '<defs><clipPath id="' + uid + '-clip">' +
        '<circle class="gl-clip" r="' + R + '"/></clipPath></defs>' +
      '<circle class="gl-ground" r="' + R + '"/>' +
      '<g class="gl-body" clip-path="url(#' + uid + '-clip)"></g>' +
      '<circle class="gl-rim" r="' + R + '"/>' +
      '<text class="gl-count"></text>';
    svg.appendChild(layer);
    body  = layer.querySelector('.gl-body');
    count = layer.querySelector('.gl-count');
  }

  /* the map's camera, READ rather than assumed — it is the map's number and
     this file has no business keeping its own copy */
  function camera() {
    var v = document.querySelector('#amenti-map .mp-view');
    var t = (v && v.getAttribute('transform')) || '';
    var k = parseFloat((t.match(/scale\(([-\d.]+)\)/) || [])[1] || '1');
    var p = (t.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/) || []);
    return { K: k, TX: parseFloat(p[1] || '0'), TY: parseFloat(p[2] || '0') };
  }

  function draw() {
    if (!open || !layer) return;
    var cam = camera();
    ['.gl-clip', '.gl-ground', '.gl-rim'].forEach(function (sel) {
      var n = layer.querySelector(sel);
      n.setAttribute('r', R);
      n.setAttribute('cx', cx.toFixed(1));
      n.setAttribute('cy', cy.toFixed(1));
    });
    count.setAttribute('x', cx.toFixed(1));
    count.setAttribute('y', (cy + R + 11).toFixed(1));

    var seats = document.querySelectorAll('#amenti-map .mp-pins .mp-seat');
    var h = '', inside = 0, recovered = 0, gather = R / M;

    for (var i = 0; i < seats.length; i++) {
      var g = seats[i];
      if (g.classList.contains('mp-out')) continue;
      if (g.getAttribute('display') === 'none') continue;
      var c = g.querySelector('circle');
      if (!c) continue;

      /* where this seat sits ON SCREEN right now, in viewBox units */
      var sx = parseFloat(c.getAttribute('cx')) * cam.K + cam.TX;
      var sy = parseFloat(c.getAttribute('cy')) * cam.K + cam.TY;
      if (isNaN(sx) || isNaN(sy)) continue;
      var dx = sx - cx, dy = sy - cy;
      if (Math.hypot(dx, dy) > gather) continue;
      inside++;

      /* THE SPACE IS PULLED, THE MARK IS NOT. Position multiplies out from the
         centre; radius and font-size are constants. That one line is the whole
         difference between this instrument and a zoom. */
      var gx = cx + dx * M, gy = cy + dy * M;
      var r = parseFloat(c.getAttribute('r')) * cam.K;
      r = Math.max(1.1, Math.min(3.2, isNaN(r) ? 1.6 : r));

      var nameEl  = g.querySelector('.mp-name');
      var glyphEl = g.querySelector('.mp-glyph');
      var label = nameEl ? String(nameEl.textContent || '').trim() : '';
      var glyph = glyphEl ? String(glyphEl.textContent || '').trim() : '';
      /* A NAME THE CULL DROPPED IS THE WHOLE POINT of this instrument, so it
         is shown here AND COUNTED — a reader should know how much of what they
         are looking at was hidden a moment ago. */
      if (label && !g.classList.contains('mp-named')) recovered++;

      /* the hairline home. The glass has deliberately moved this seat away
         from its true position; leaving that unsaid would make the instrument
         a liar about the one thing the map is careful about. */
      h += '<line class="gl-hair" x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) +
           '" x2="' + gx.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>' +
           '<circle class="gl-pin" cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) +
           '" r="' + r.toFixed(2) + '"/>';
      if (glyph) h += '<text class="gl-glyph" x="' + gx.toFixed(1) + '" y="' +
                      (gy + 2.6).toFixed(1) + '">' + esc(glyph) + '</text>';
      if (label) h += '<text class="gl-name" x="' + gx.toFixed(1) + '" y="' +
                      (gy - 4.3).toFixed(1) + '">' + esc(label) + '</text>';
    }
    /* ── THE GROUND UNDER THE GLASS · added 7 Sep ────────────────────────
       The glass was written before amenti-narrows.js existed, so it queried
       .mp-pins and nothing else: gates and hatched ground passed underneath it
       untouched, and a reader magnifying Thermopylae saw seats floating over
       nothing. A magnifier over a map should show what is ON the map.

       These are DRAWN, NOT SPREAD. A seat is a point and can be moved apart
       from its neighbours; a pass is a place and a marsh is an area, and
       pulling either away from where it sits would move the ground itself.
       So they are magnified about the centre — which is what a glass over
       paper does, and correct here because the claim is about extent rather
       than position. */
    var nl = document.querySelector('#amenti-map .nr-layer');
    if (nl) {
      var gates = nl.querySelectorAll('.nr-gate, .nr-forbid');
      for (var q = 0; q < gates.length; q++) {
        var b;
        try { b = gates[q].getBBox(); } catch (e) { continue; }
        var bx = (b.x + b.width / 2) * cam.K + cam.TX;
        var by = (b.y + b.height / 2) * cam.K + cam.TY;
        if (Math.hypot(bx - cx, by - cy) > gather) continue;
        var nx = cx + (bx - cx) * M, ny = cy + (by - cy) * M;
        var cls = gates[q].getAttribute('class') || '';
        var faint = /nr-unconfirmed/.test(gates[q].parentNode &&
                    (gates[q].parentNode.getAttribute('class') || ''));
        h += '<g class="gl-ground-mark' + (faint ? ' gl-faint' : '') +
             '" transform="translate(' + nx.toFixed(1) + ' ' + ny.toFixed(1) +
             ') scale(' + (M * cam.K).toFixed(3) + ') translate(' +
             (-(b.x + b.width / 2)).toFixed(1) + ' ' + (-(b.y + b.height / 2)).toFixed(1) + ')">' +
             gates[q].outerHTML + '</g>';
      }
    }

    body.innerHTML = h;
    count.textContent = inside
      ? inside + ' seat' + (inside === 1 ? '' : 's') +
        (recovered ? ' \u00b7 ' + recovered + ' name' + (recovered === 1 ? '' : 's') +
                     ' the cull had dropped' : '') +
        (frozen ? ' \u00b7 held' : '')
      : '';
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  function onMove(e) {
    if (!open || frozen) return;
    var r = svg.getBoundingClientRect();
    if (!r.width) return;
    cx = (e.clientX - r.left) / r.width * 1000;
    cy = (e.clientY - r.top) / r.height * 500;
    draw();
  }
  function onKey(e) {
    if (!open) return;
    if (e.key === 'Shift') { frozen = !frozen; draw(); }
    else if (e.key === 'Escape' && frozen) { frozen = false; draw(); }
  }

  function show() {
    var gap = missing();
    if (gap) {
      /* RULE 3, APPLIED TO A COUPLING. It cannot see, so it says which shape it
         could not find rather than opening onto an empty circle and letting a
         reader conclude the map has nothing there. */
      console.log('THE GLASS CANNOT OPEN \u2014 ' + gap[1] + ' (' + gap[0] + ') is not on ' +
                  'the page.\n  The map may be closed, or amenti-map.js may have ' +
                  'changed the shape this file reads.');
      return false;
    }
    el  = document.querySelector('#amenti-map');
    svg = document.querySelector('#amenti-map svg');
    if (!layer || !svg.contains(layer)) build();
    open = true; frozen = false;
    el.addEventListener('pointermove', onMove);
    document.addEventListener('keydown', onKey);
    draw();
    return true;
  }

  function hide() {
    open = false;
    if (el) el.removeEventListener('pointermove', onMove);
    document.removeEventListener('keydown', onKey);
    if (layer) { layer.remove(); layer = null; }
  }

  function toggle() { return open ? (hide(), false) : show(); }

  /* a lens on a stem — a magnifier, not a circle, so it cannot be read as one
     of the marks the map already draws */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L21 21"/>' +
    '<path d="M7.4 10.5h6.2"/></svg>';

  /* ── JOINING THE RAIL · the map's own exported door ───────────────────────
     addFaculty was written so the graph could arrive without touching this
     file or hall.html. The glass uses the same door for the same reason. The
     map is never edited; the rail simply gains a button. */
  function join() {
    if (!window.AmentiMap || !window.AmentiMap.addFaculty) return false;
    window.AmentiMap.addFaculty('fac-glass', 'glass', ICON, toggle, function () {
      return open;
    });
    return true;
  }

  /* the map mounts its rail on load; if this file arrives first, wait for it
     rather than failing silently */
  function arrive(tries) {
    if (join()) return;
    if ((tries || 0) > 40) {
      console.log('THE GLASS did not join the rail \u2014 AmentiMap.addFaculty was never ' +
                  'exported.\n  amenti-glass.js needs amenti-map.js loaded before it.');
      return;
    }
    setTimeout(function () { arrive((tries || 0) + 1); }, 250);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  else arrive(0);

  /* Closing the map must close the glass, or its layer sits in a surface that
     is no longer showing. The map has no idea this file exists, so this file
     watches rather than being told. */
  new MutationObserver(function () {
    if (open && !document.body.classList.contains('scene-map')) {
      hide();
      if (window.AmentiMap && window.AmentiMap.syncRail) window.AmentiMap.syncRail();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiGlass = {
    show: show, hide: hide, toggle: toggle,
    isOpen: function () { return open; },
    /* THE PAIR IS UNSETTLED AND SAYS SO. Set it and move the pointer:
           AmentiGlass.set({ R: 90, M: 5 })
       Ten times the room is not enough over the Rhone. When a pair is found
       that works there, it can be baked in with a measurement behind it. */
    set: function (o) {
      if (o && o.R > 0) R = o.R;
      if (o && o.M > 1) M = o.M;
      draw();
      return { R: R, M: M, gathers: +(R / M).toFixed(1) };
    }
  };
})();
