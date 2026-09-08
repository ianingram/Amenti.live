/* ============================================================================
   amenti-attica-glass.js  ·  THE GLASS OVER ATTICA
   ----------------------------------------------------------------------------
   A magnifier that slides over the Attica surface, showing the ground at the
   resolution it was rendered at rather than the resolution the screen happens
   to be showing.

   ── WHY THIS ONE MAGNIFIES AND THE WORLD MAP'S DOES NOT ───────────────────
   amenti-glass.js was built on 6 September and does one honest thing: it
   SPREADS SEATS APART so the names the cull dropped can be read. It cannot
   magnify, because there is nothing under the world map to magnify \u2014 a 110 m
   coastline, a flat land fill, and a pin that is a pin at every scale. A
   magnifier over that has no finer information to bring up.

   HERE THERE IS. Measured:

       ATTICA.jpg   8192 px across 320 km  =  39 m a pixel
       at K=1       one screen pixel is 320 m \u2014 THE IMAGE HOLDS 8.2x MORE
       at K=4                        80 m \u2014                       2.0x
       at K=8                        40 m \u2014                       1.0x, spent

   So between x1 and x8 there is real ground under the surface that is not
   being shown, and this brings it up. PAST x8 IT RUNS OUT and the glass says
   so rather than enlarging pixels and calling it detail.

   ── AND IT MAGNIFIES THE GROUND, NOT THE MARKS ────────────────────────────
   The same law the chart glass keeps, for the same reason: A MARK STANDS FOR A
   CLAIM AND A CLAIM DOES NOT GET BIGGER. Inside the circle the ground is drawn
   at higher resolution and the pins, gables and crescents stay the size they
   are outside it. What changes is how much of the earth you can see, not how
   loudly the register asserts anything.

   AND THE LABELS GROW ONLY SO FAR. A label is text to be read rather than a
   claim about the world, so unlike a mark it may get bigger — but the growth
   was left uncapped and at x36 "Mine of Laureion" was a billboard across the
   circle. PAST LEGIBILITY, LARGER TYPE STOPS BEING READABILITY AND STARTS
   BEING EMPHASIS, and emphasis is a claim about importance that no register
   made. Capped at 1.9x, which is enough to read comfortably and not enough to
   shout.

   ── A MODULE, AND IT READS ITS HOST ───────────────────────────────────────
   One script tag, no edit to amenti-attica.js. It reads that surface's camera
   off the .at-view transform and its box off AmentiAttica, and it refuses to
   open \u2014 naming what is missing \u2014 rather than drawing an empty circle.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var R = 88;        /* the circle drawn, in viewBox units */
  var M = 3.0;       /* how much more ground per pixel inside it */
  var SPENT = 8.0;   /* past this total magnification the image has no more */

  var layer = null, svg = null, host = null;
  var cx = -9999, cy = -9999, open = false, frozen = false;

  var NEEDS = [
    ['#amenti-attica',            'the Attica surface'],
    ['#amenti-attica svg',        'its canvas'],
    ['#amenti-attica .at-view',   'the camera group'],
    ['#amenti-attica .at-ground', 'the ground image \u2014 there is nothing to magnify without it']
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
    var k = parseFloat((t.match(/scale\(([-\d.]+)\)/) || [])[1] || '1');
    var p = (t.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/) || []);
    return { K: k, TX: parseFloat(p[1] || '0'), TY: parseFloat(p[2] || '0') };
  }

  function style() {
    if (document.getElementById('atg-css')) { return; }
    var s = document.createElement('style');
    s.id = 'atg-css';
    s.textContent = [
      '#amenti-attica .atg-layer{pointer-events:none}',
      /* NO GROUND FILL. The chart glass shipped at .93 opacity and blacked out
         the very chart it existed to serve; that was corrected to .16 and the
         lesson travels. Here there is no tint at all \u2014 the whole point is to
         see MORE of the ground, so nothing is laid over it. The rim does the
         work of saying where the glass is. */
      '#amenti-attica .atg-rim{fill:none;stroke:#5fd0e8;stroke-width:1.1;',
      '  opacity:.55;vector-effect:non-scaling-stroke}',
      '#amenti-attica .atg-rim2{fill:none;stroke:#05080e;stroke-width:2.4;',
      '  opacity:.5;vector-effect:non-scaling-stroke}',
      '#amenti-attica .atg-read{fill:#5fd0e8;font:400 7px ui-monospace,Menlo,monospace;',
      '  text-anchor:middle;opacity:.75}',
      '#amenti-attica .atg-spent{fill:#c99a4e}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function build() {
    style();
    layer = document.createElementNS(SVGNS, 'g');
    layer.setAttribute('class', 'atg-layer');
    layer.innerHTML =
      '<defs><clipPath id="atg-clip"><circle class="atg-c" r="' + R + '"/></clipPath></defs>' +
      '<g class="atg-body" clip-path="url(#atg-clip)"></g>' +
      '<circle class="atg-rim2 atg-c" r="' + R + '"/>' +
      '<circle class="atg-rim atg-c" r="' + R + '"/>' +
      '<text class="atg-read"></text>';
    svg.appendChild(layer);
  }

  function draw() {
    if (!open || !layer) { return; }
    var cam = camera();
    var ground = document.querySelector('#amenti-attica .at-ground');
    var href = ground ? (ground.getAttribute('href') || ground.getAttribute('xlink:href')) : '';

    layer.querySelectorAll('.atg-c').forEach(function (n) {
      n.setAttribute('r', R);
      n.setAttribute('cx', cx.toFixed(1));
      n.setAttribute('cy', cy.toFixed(1));
    });

    /* ── THE GROUND, DRAWN AGAIN AND BIGGER ───────────────────────────────
       The same image, redrawn scaled about the glass centre and clipped to the
       circle. The browser samples it at the larger size, so pixels that were
       averaged away at this zoom come back. That is the whole trick, and it
       only works because the file genuinely holds them. */
    var K = cam.K, S = K * M;
    var w = 1000 * S, h = 1000 * S;
    var gx = cx - (cx - cam.TX) / K * S;
    var gy = cy - (cy - cam.TY) / K * S;
    var body = '<image x="' + gx.toFixed(2) + '" y="' + gy.toFixed(2) +
               '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) +
               '" preserveAspectRatio="none" href="' + href + '"/>';

    /* ── THE MARKS ARE CARRIED, NOT GROWN ─────────────────────────────────
       Each mark inside the gather radius is redrawn at its magnified position
       AT ITS ORIGINAL SIZE. A pin means "here" whether or not a reader is
       holding a lens over it. The names DO grow, because a name is text to
       read and not a claim about the world. */
    /* ── THE TYPE IS COUNTER-SCALED INSIDE THE GLASS ──────────────────────
       Everything in the copied group is multiplied by M, which is right for
       position and wrong for text. The label carries a factor that undoes most
       of it: the ground magnifies fully, the type grows to TEXT_CAP and no
       further. Written into the style attribute rather than a class, because
       the markup is a COPY and a class would style the original too. */
    var TEXT_CAP = 1.9;
    var undo = Math.min(1, TEXT_CAP / M);

    var gather = R / M, seen = 0;
    var seats = document.querySelectorAll('#amenti-attica .at-pins .at-seat');
    for (var i = 0; i < seats.length; i++) {
      var g = seats[i], box;
      try { box = g.getBBox(); } catch (e) { continue; }
      var bx = (box.x + box.width / 2) * K + cam.TX;
      var by = (box.y + box.height / 2) * K + cam.TY;
      if (Math.hypot(bx - cx, by - cy) > gather) { continue; }
      seen++;
      var nx = cx + (bx - cx) * M, ny = cy + (by - cy) * M;
      body += '<g transform="translate(' + nx.toFixed(2) + ' ' + ny.toFixed(2) +
              ') scale(' + M.toFixed(3) + ') translate(' +
              (-bx).toFixed(2) + ' ' + (-by).toFixed(2) + ')">' +
              '<g transform="translate(' + cam.TX.toFixed(2) + ' ' + cam.TY.toFixed(2) +
              ') scale(' + K.toFixed(4) + ')">' + capText(g.outerHTML, undo) +
              '</g></g>';
    }
    layer.querySelector('.atg-body').innerHTML = body;

    /* ── AND IT SAYS WHEN THE IMAGE IS SPENT ──────────────────────────────
       ATTICA.jpg is 39 m a pixel. Past about x8 total there is nothing left in
       it, and enlarging further shows bigger pixels rather than more ground.
       An instrument that keeps magnifying past its source is lying quietly. */
    var t = layer.querySelector('.atg-read');
    var total = K * M;
    t.setAttribute('x', cx.toFixed(1));
    t.setAttribute('y', (cy + R + 12).toFixed(1));
    if (total > SPENT) {
      t.setAttribute('class', 'atg-read atg-spent');
      t.textContent = '\u00d7' + total.toFixed(1) + ' \u00b7 the image is spent at \u00d7' +
                      SPENT + ' \u2014 this is bigger pixels, not more ground';
    } else {
      t.setAttribute('class', 'atg-read');
      t.textContent = '\u00d7' + total.toFixed(1) + ' \u00b7 ' +
                      Math.round(320000 / (1000 * total)) + ' m a pixel \u00b7 ' +
                      seen + ' place' + (seen === 1 ? '' : 's') + (frozen ? ' \u00b7 held' : '');
    }
  }

  /* multiply every inline font-size and stroke-width in a copied mark by f.
     THE PAIR MOVES TOGETHER — the world map corrected a font on 6 September
     and left its outline behind, and every name drew as a black lozenge at
     x14. One factor, both numbers. */
  function capText(html, f) {
    if (f >= 1) { return html; }
    return html.replace(/font-size:\s*([\d.]+)px/g, function (m0, v) {
      return 'font-size:' + (parseFloat(v) * f).toFixed(4) + 'px';
    }).replace(/stroke-width:\s*([\d.]+)px/g, function (m0, v) {
      return 'stroke-width:' + (parseFloat(v) * f).toFixed(4) + 'px';
    });
  }

  function onMove(e) {
    if (!open || frozen) { return; }
    var r = svg.getBoundingClientRect();
    if (!r.width) { return; }
    cx = (e.clientX - r.left) / r.width * 1000;
    cy = (e.clientY - r.top) / r.height * 1000;
    draw();
  }
  function onKey(e) {
    if (!open) { return; }
    if (e.key === 'Shift') {
      frozen = !frozen;
      draw();
    } else if (e.key === 'Escape' && frozen) {
      frozen = false;
      draw();
    }
  }

  function show() {
    var gap = missing();
    if (gap) {
      console.log('THE ATTICA GLASS CANNOT OPEN \u2014 ' + gap[1] + ' (' + gap[0] + ') is not ' +
                  'on the page. Open Attica first.');
      return false;
    }
    host = document.querySelector('#amenti-attica');
    svg = host.querySelector('svg');
    if (!layer || !svg.contains(layer)) { build(); }
    open = true; frozen = false;
    host.addEventListener('pointermove', onMove);
    document.addEventListener('keydown', onKey);
    /* the surface redraws on pan, zoom and period; the glass follows rather
       than being told, because amenti-attica.js does not know this file exists */
    mo.observe(host.querySelector('.at-view'), { attributes: true,
               attributeFilter: ['transform'] });
    draw();
    return true;
  }
  function hide() {
    open = false;
    if (host) { host.removeEventListener('pointermove', onMove); }
    document.removeEventListener('keydown', onKey);
    mo.disconnect();
    if (layer) { layer.remove(); layer = null; }
  }
  function toggle() { return open ? (hide(), false) : show(); }

  var mo = new MutationObserver(function () { if (open) { draw(); } });

  /* a lens with a contour inside it \u2014 a magnifier over ground, which is what
     distinguishes it from the chart glass on the world map */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L21 21"/>' +
    '<path d="M6.5 12.5c1.5-2.5 2.5-1 4-3s2.5-.5 3.5-1.5"/></svg>';

  function join() {
    if (!window.AmentiMap || !window.AmentiMap.addFaculty) { return false; }
    window.AmentiMap.addFaculty('fac-attica-glass', 'attica glass', ICON, toggle,
                                function () { return open; });
    return true;
  }
  function arrive(n) {
    if (join()) { return; }
    if ((n || 0) > 40) {
      console.log('THE ATTICA GLASS did not join the rail \u2014 AmentiMap.addFaculty was ' +
                  'never exported.');
      return;
    }
    setTimeout(function () { arrive((n || 0) + 1); }, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  } else {
    arrive(0);
  }

  /* leaving Attica closes it, or its layer sits in a surface nobody is looking at */
  new MutationObserver(function () {
    if (open && !document.body.classList.contains('scene-attica')) {
      hide();
      if (window.AmentiMap && window.AmentiMap.syncRail) { window.AmentiMap.syncRail(); }
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiAtticaGlass = {
    show: show, hide: hide, toggle: toggle,
    isOpen: function () { return open; },
    /* THE PAIR IS TUNABLE AND STATED AS UNSETTLED. R is the circle, R/M the
       patch of world it gathers, and K*M is what the image is asked for.
           AmentiAtticaGlass.set({ R: 110, M: 4 }) */
    set: function (o) {
      if (o && o.R > 0) { R = o.R; }
      if (o && o.M > 1) { M = o.M; }
      if (layer) { layer.querySelectorAll('.atg-c').forEach(function (n) {
        n.setAttribute('r', R); }); }
      draw();
      return { R: R, M: M, gathers: +(R / M).toFixed(1) };
    }
  };
})();
