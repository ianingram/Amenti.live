/* ============================================================================
   amenti-attica-prologue.js  →  Amenti.live/amenti-attica-prologue.js
   ----------------------------------------------------------------------------
   THE BACK STORY, BECAUSE MOST OF IT CANNOT BE DRAWN

   Six slides before the map. They end at Herodotus 6.96 and the campaign layer
   begins at 6.97, so the first drawn leg arrives with nothing unexplained.

   ── WHY IT IS TOLD AND NOT SHOWN ─────────────────────────────────────────
   Three separate reasons, and each one is a limit of the surface rather than a
   preference:

     THE WRECK IS OFF THE MAP. Mount Athos is at 40.16 and the Attica frame
     stops at 39.42 \u2014 three quarters of a degree past the edge. The event that
     chose the route of the entire campaign cannot be drawn on the ground the
     campaign runs on.

     NAXOS BURNS BEFORE THE FIRST DRAWN LEG. It is inside the frame and it
     happens at 6.96, one chapter early.

     AND A FLEET BEING BUILT IS NOT A MOVEMENT AT ALL. Six hundred triremes and
     purpose-made horse-transports, ordered from the tributaries a year in
     advance, is the most consequential fact in the campaign and there is
     nothing to animate.

   ── A MISSING SCENE IS A STATE, NOT A FAULT ──────────────────────────────
   The register names a scene tag per slide and the Worker serves
   /scene/{tag}.jpg from R2. NOTHING HAS BEEN MADE FOR ANY OF THEM. A slide
   with no image shows its prose on plain ground and says so in the footer \u2014
   because a grey box where a picture should be teaches a reader that something
   is broken when nothing is.

   ── AND EVERY SLIDE NAMES ITS PASSAGE ────────────────────────────────────
   Chapter, standing and file, in the footer of each. `corpus` means the claim
   is in a named room of this library and a probe can open the file and check
   it. All six are corpus, which was IMPOSSIBLE BEFORE 10 SEPTEMBER \u2014 Book VI
   was not aboard and none of this could have been written with a source behind
   it.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var SCENE = 'https://amenti-proxy.ingram-ian.workers.dev/scene/';

  var slides = null, err = null, el = null, at = -1, tried = {}, region = null, ground = null;
  var speeches = null;

  /* ── THE THEATRE, CUT FROM THE WORLD'S OWN GROUND · 10 Sep 2026 ──────────
     REGION.jpg is a crop of GROUND.jpg — the same relief and bathymetry the
     world map draws — over lon 21.0 to 37.5 and lat 33.5 to 42.0.

     THE ATTICA FRAME IS A CORNER OF THIS. Athos, Thasos, Samos and Kilikia are
     all outside the ground the campaign runs on, which is the whole reason the
     back story is told here instead of drawn there. Seeing them on one map is
     the point of the slide: the reader learns how far away the wreck was
     before being told it chose the route.

     AND SOME PLACES ARE OFF EVEN THIS. Susa is eleven degrees east of the
     edge. The slide names it and does not draw it — a place named and not
     drawn is honest; a place shoved to the border is not. */
  var RLO0 = 21.0, RLO1 = 37.5, RLA0 = 33.5, RLA1 = 42.0;

  /* the frame is the theatre, on every slide. A detail goes in an inset,
     which keeps the reader's place · 12 Sep 2026 */
  var F = { lo0: RLO0, lo1: RLO1, la0: RLA0, la1: RLA1 };

  /* ── A FRAME, WHERE A SLIDE ASKS FOR ONE · 12 Sep 2026 ───────────────────
     Slide 4 happens in the top-left corner of the theatre and the marks were
     jammed against the edge. Fitting every frame automatically fixed that and
     took the theatre away from seven slides that wanted it — so the register
     asks, and a slide that says nothing gets the whole ground.

     Same shape as `inset`: two corners, squared to the box, clamped inside the
     ground that exists. The frame MOVES, it does not crop — the picture is the
     same file translated and scaled. */
  function squared(spec, asp) {
    var c = String(spec || '').split('>');
    if (c.length !== 2) { return null; }
    var a = c[0].split('|'), b = c[1].split('|');
    var la = [parseFloat(a[0]), parseFloat(b[0])];
    var lo = [parseFloat(a[1]), parseFloat(b[1])];
    if (la.some(isNaN) || lo.some(isNaN)) { return null; }
    var lo0 = Math.min.apply(null, lo), lo1 = Math.max.apply(null, lo);
    var la0 = Math.min.apply(null, la), la1 = Math.max.apply(null, la);
    var w = lo1 - lo0, h = la1 - la0;
    if (w / h > asp) { h = w / asp; } else { w = h * asp; }
    var cx = (lo0 + lo1) / 2, cy = (la0 + la1) / 2;
    return { lo0: cx - w / 2, lo1: cx + w / 2, la0: cy - h / 2, la1: cy + h / 2 };
  }
  function frameFor(spec) {
    var f = squared(spec, (RLO1 - RLO0) / (RLA1 - RLA0));
    if (!f) { return { lo0: RLO0, lo1: RLO1, la0: RLA0, la1: RLA1 }; }
    if (f.lo1 - f.lo0 >= RLO1 - RLO0) { f.lo0 = RLO0; f.lo1 = RLO1; }
    else if (f.lo0 < RLO0) { f.lo1 += RLO0 - f.lo0; f.lo0 = RLO0; }
    else if (f.lo1 > RLO1) { f.lo0 -= f.lo1 - RLO1; f.lo1 = RLO1; }
    if (f.la1 - f.la0 >= RLA1 - RLA0) { f.la0 = RLA0; f.la1 = RLA1; }
    else if (f.la0 < RLA0) { f.la1 += RLA0 - f.la0; f.la0 = RLA0; }
    else if (f.la1 > RLA1) { f.la0 -= f.la1 - RLA1; f.la1 = RLA1; }
    return f;
  }

  /* ── A SHIP DOES NOT CROSS A MOUNTAIN · 10 Sep 2026 ─────────────────────
     REGION.jpg is the same cut of GROUND.jpg the campaign samples, so the
     slide asks the ground the same way: read the pixel, and where a segment
     crosses land, bend it out to sea.

     IT IS NOT A COURSE AND MUST NOT LOOK LIKE ONE. The bend is the coarsest
     thing that keeps the line wet — a midpoint pushed off the land, recursively
     and no further. WHAT IS TRUE IS THE TWO ENDS AND THAT WATER WAS SAILED;
     the shape between them belongs to this file. */
  var SEA = (function () {
    var c = document.createElement('canvas'), data = null, W = 0, H = 0;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      W = c.width = img.width; H = c.height = img.height;
      try {
        var x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        data = x.getImageData(0, 0, W, H).data;
        if (slides && at >= 0) { show(at); }
      } catch (e) { data = null; }   /* tainted canvas: no mask, no bending */
    };
    img.src = RAW + 'REGION.jpg';
    return {
      ready: function () { return !!data; },
      at: function (px, py) {
        if (!data) { return true; }
        var a = Math.round(px / 100 * W), b = Math.round(py / 100 * H);
        if (a < 0 || b < 0 || a >= W || b >= H) { return true; }
        var i = (b * W + a) * 4;
        return (data[i + 2] - data[i]) > 22;
      }
    };
  })();

  function wet(a, b, depth) {
    if (!SEA.ready() || (depth || 0) > 3) { return [a, b]; }
    var dry = false, t;
    for (t = 0.12; t < 0.9; t += 0.08) {
      var s1 = toImg({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (!SEA.at(s1.x, s1.y)) { dry = true; break; }
    }
    if (!dry) { return [a, b]; }
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L;
    for (var d = 1.5; d <= 26; d += 1.5) {
      for (var sg = 0; sg < 2; sg++) {
        var sn = sg ? -1 : 1;
        var qx = mx + nx * d * sn, qy = my + ny * d * sn;
        var s2 = toImg({ x: qx, y: qy });
        if (!SEA.at(s2.x, s2.y)) { continue; }
        var m = { x: qx, y: qy };
        return wet(a, m, (depth || 0) + 1).concat(wet(m, b, (depth || 0) + 1).slice(1));
      }
    }
    return [a, b];   /* nowhere wet within reach — leave it, do not pretend */
  }

  /* ── A MARK THAT MOVES · 11 Sep 2026 ────────────────────────────────────
     A route is already a polyline of authored points. Walking it is a POSITION
     AND NOT A CLOCK — p from 0 to 1 along the whole line. A mark driven by
     elapsed time can only play; a mark that is a pure function of p can be
     paused on, scrubbed backwards, and handed a value by whatever ends up
     owning the sequence.

     IT WAS CALLED `at` AND SO IS THE SLIDE INDEX · 12 Sep 2026. Two things of
     the same name in one scope, and the var won — so the function was never
     callable and the collision was silent. */
  function along(pts, p) {
    if (!pts || pts.length < 2) { return null; }
    var seg = [], total = 0, i;
    for (i = 0; i < pts.length - 1; i++) {
      var d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      seg.push(d); total += d;
    }
    if (!total) { return null; }
    var want = Math.max(0, Math.min(1, p)) * total, run = 0;
    for (i = 0; i < seg.length; i++) {
      if (run + seg[i] >= want || i === seg.length - 1) {
        var t = seg[i] ? (want - run) / seg[i] : 0;
        var a = pts[i], b = pts[i + 1];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
                 ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
      }
      run += seg[i];
    }
    return null;
  }

  /* null means standing still, which is the default and the honest one */
  var POS = null, RAF = 0;
  /* which slides the reader has already opened the map on, so a scene
     arriving late cannot countermand a click */
  var shown = {};

  /* ── THE MARKS ───────────────────────────────────────────────────────────
     Thirteen. The first ten say WHAT HAPPENED TO A PLACE; gold, silver and
     grain say what a place PRODUCES, which is a different kind of claim and
     the one the campaign keeps turning on.

     STORM is not a place-state and that is why it was missing for so long. The
     north wind at 6.44 happened to a fleet at sea, so the wreck sat on Athos
     and the thing that caused it had nowhere to be drawn.

     CAMP IS NOT MUSTER. 6.95 is an army encamped on a plain; 6.43 is two
     forces gathering and parting. An assembly and a position held.

     AN EMOJI BRINGS ITS OWN PALETTE. A triangle does not mean fire; it was
     unambiguous at 13px, which is not the same thing. The colour of 🔥 is not
     ours and will differ between platforms — which for a city burning may be
     right, and is a decision rather than an accident.

     GA carries hue and size together, every mark stating both, because the old
     arrangement wrote a size only where it needed correcting and THE NUMBERS
     THAT WERE NOT THERE WERE THE HARDEST TO FIND. GS scales all of them; raise
     it for capture, where the small marks go first. */
  var GL = { wreck: '\u2715', battle: '\u2694',
             muster: '\u25a3', fleet: '\u25b8', city: '\u25cf', sacred: '\u25c7',
             storm: '\u224b', horse: '\u265e', camp: '\u2302',
             gold: '\u2b22', silver: '\u2b21', wheat: '\u03a8',
             fire: '\ud83d\udd25' };
  /* what each mark claims, for the key — one line, in the register's words */
  var GN = { fire: 'burnt', wreck: 'wrecked', battle: 'battle',
             muster: 'the army musters', fleet: 'the fleet', city: 'a city',
             sacred: 'spared, or sacred', storm: 'the wind',
             horse: 'the horses', camp: 'encamped',
             gold: 'gold', silver: 'silver', wheat: 'grain' };
  var GS = 1;
  var GA = {
    fire:   ['#ff7a3d', 12],
    wreck:  ['#ff5a45', 15],
    battle: ['#ffd166', 13],
    muster: ['#c9d6a8', 13],
    fleet:  ['#c9503f', 13],
    city:   ['#e0913f', 13],
    sacred: ['#7fd8f0', 13],
    storm:  ['#8fb4c6', 15],
    horse:  ['#c9a86a', 13],
    camp:   ['#b8a06a', 13],
    gold:   ['#f0c860', 11],
    silver: ['#c8d4dc', 11],
    wheat:  ['#b9c47a', 14]
  };
  function glyphCss() {
    return Object.keys(GA).map(function (k) {
      return '#amenti-prologue .ap-g-' + k + '{color:' + GA[k][0] +
             ';font-size:' + (GA[k][1] * GS).toFixed(1) + 'px}';
    }).join('\n');
  }

  function rproj(lat, lon) {
    return { x: (lon - F.lo0) / (F.lo1 - F.lo0) * 100,
             y: (F.la1 - lat) / (F.la1 - F.la0) * 100,
             inside: lon >= F.lo0 && lon <= F.lo1 && lat >= F.la0 && lat <= F.la1 };
  }
  /* the mask is a read of the WHOLE image, so a point in frame space has to
     be put back into image space before it is sampled */
  /* ── A DETAIL, WITHOUT LOSING THE PLACE · 12 Sep 2026 ────────────────────
     Athos and Acanthos are forty kilometres apart on a map fourteen hundred
     kilometres wide, and their marks sat on each other. Zooming the whole
     frame fixed that and TOOK THE THEATRE AWAY — a reader who does not know
     where Athos is learns nothing from a close-up of it.

     So the main map does not move. A pop-out shows the detail, a box on the
     ground shows where the pop-out is, and a hairline joins the two. The
     reader gets the wreck and keeps their bearings.

     The register gives it as `lat|lon>lat|lon`, two corners, and a slide with
     no inset draws none. */
  var IN = null;
  function iproj(lat, lon) {
    if (!IN) { return { x: 0, y: 0, inside: false }; }
    return { x: (lon - IN.lo0) / (IN.lo1 - IN.lo0) * 100,
             y: (IN.la1 - lat) / (IN.la1 - IN.la0) * 100,
             inside: lon >= IN.lo0 && lon <= IN.lo1 &&
                     lat >= IN.la0 && lat <= IN.la1 };
  }
  function insetFor(spec) {
    return squared(spec, (RLO1 - RLO0) / (RLA1 - RLA0));
  }

  function toImg(p) {
    return { x: ((F.lo0 + p.x / 100 * (F.lo1 - F.lo0)) - RLO0) / (RLO1 - RLO0) * 100,
             y: ((F.la1 - p.y / 100 * (F.la1 - F.la0)) - RLA1) / (RLA0 - RLA1) * 100 };
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
  function parse(t) {
    var lines = String(t).replace(/\r\n/g, '\n').split('\n');
    var cols = split(lines[0]).map(function (h) { return h.trim(); });
    var out = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim() || lines[i].charAt(0) === '#') { continue; }
      var c = split(lines[i]), o = {};
      for (var j = 0; j < cols.length; j++) { o[cols[j]] = (c[j] == null ? '' : c[j]).trim(); }
      out.push(o);
    }
    return out;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── ONE MARKUP ACROSS THE REGISTERS ────────────────────────────────────
     **double asterisks** on proper names and dates, which is what
     ATTICA-TOLD.csv uses and what the map's hover pane already renders in
     terminal blue. The same blue here, because a reader who learns what blue
     means on the ground should not have to learn it again on a slide.

     CAPITALS ARE EMPHASIS AND NOT NAMES. They render as weight rather than as
     shouting \u2014 a paragraph of capitals is unreadable at this length \u2014 and the
     first letter is kept so the sentence still reads as a sentence. */
  /* ── THE NAMES CAME FROM A LIST AND A LIST FALLS BEHIND · 11 Sep 2026 ──
     The emphasis transform needs to know which words are names. It was given
     about seventy of them, typed out — which is the same shape as the selector
     that enumerated what to delete and missed the thing added after it. Nine
     books are aboard now and the list was already short on the day it shipped.

     THE REGISTER ALREADY MARKS EVERY NAME. Every proper noun in the prose is
     written `**Sardis**`, `**Mardonios**`, `**Brygian Thracians**`, because
     that is how the slide links them. So the set is harvested from the marks
     themselves, plus the place columns and REGION-PLACES — all of it already
     in memory, none of it fetched. Write a new slide naming Leonidas and
     Thermopylai and they are known the moment it loads.

     A name nobody has marked is still unknown, and comes down like any other
     word. That is the old behaviour, and it is now the only gap. */
  var NAMES = {};
  function learn(t) {
    String(t == null ? '' : t).replace(/[A-Z\u00c0-\u00de][a-z\u00df-\u00ff\u00ef'\u2019-]+/g,
      function (w) { NAMES[w.toLowerCase()] = 1; return w; });
  }
  /* ── AND A FEW THAT ARE NEVER MARKS · 11 Sep 2026 ─────────────────────
     A harvest can only learn what something marks. `Greece`, `Asia`, `Persia`
     and the peoples named as wholes are never pinned on the map and never
     linked in the prose — there is nothing to pin — so they are seeded. THIS
     IS A LIST AND IT WILL FALL BEHIND, and it is kept to the things that by
     their nature cannot be harvested: continents, and peoples taken whole.
     Every place and every person is learnt, not typed. */
  'greece greeks greek asia europe persia persians persian hellas hellenes'
    .split(' ').forEach(function (n) { NAMES[n] = 1; });

  function harvest() {
    (slides || []).forEach(function (s) {
      (s.prose || '').replace(/\*\*([^*]+)\*\*/g, function (m, inner) { learn(inner); return m; });
      (s.places || '').split(';').forEach(function (p) { learn(p.split('|')[0]); });
      learn(s.title); learn(s.route_label); learn(s.route_land_label);
    });
    (region || []).forEach(function (r) { learn(r.name); });
    (ground || []).forEach(function (r) { learn(r.name); });
  }

  function render(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<i class="ap-n">$1</i>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      /* ── CAPS ARE EMPHASIS AND THE TRANSFORM ATE THE NAMES · 11 Sep 2026 ─
         A run in capitals is the register's emphasis mark, and it came down
         to sentence case so it would not shout on the page. But lowercasing
         everything after the first letter LOWERCASED THE PROPER NOUNS INSIDE
         IT: `WITHOUT REACHING GREECE` drew as `greece`, and `WHO THE
         ATHENIANS ARE` as `athenians`. The register was right both times.

         A name keeps its capital. The list is the theatre's own — the places
         and people this prologue names — and a name it does not know comes
         down like any other word, which is the old behaviour and no worse. */
      .replace(/\b([A-Z][A-Z ,'\u2019\u2014-]{9,})\b/g, function (m) {
        var body = m.slice(1).toLowerCase().replace(/\b[a-z\u00ef]+\b/g, function (w) {
          return NAMES[w] ? w.charAt(0).toUpperCase() + w.slice(1) : w;
        });
        return '<b>' + m.charAt(0) + body + '</b>';
      });
  }
  function yr(y) {
    var n = parseInt(y, 10);
    return isNaN(n) ? '' : (n < 0 ? Math.abs(n) + ' BC' : n + ' AD');
  }

  function style() {
    if (document.getElementById('prologue-css')) { return; }
    var s = document.createElement('style');
    s.id = 'prologue-css';
    s.textContent = [
      '#amenti-prologue{position:absolute;inset:0;z-index:9;background:#05080e;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace;overflow:hidden}',
      /* ── THE SCENE WAS INVISIBLE AND IT WAS NOT THE FETCH · 10 Sep 2026 ──
         The image loaded every time. It was drawn at 34% under a veil at 82 to
         94%, WHICH IS ABOUT FOUR PER CENT VISIBLE, and an hour went to looking
         for a broken URL.

         Two opacities multiply and neither one looked wrong on its own. The
         image now carries itself and the veil only protects the lower band
         where the words are — the picture is at the top where the map is, and
         a gradient that darkens downward serves both. */
      '#amenti-prologue .ap-sc{position:absolute;inset:0;background-size:cover;',
      '  background-position:center 28%;opacity:0;transition:opacity .7s;',
      '  filter:saturate(.8) contrast(1.05)}',
      '#amenti-prologue .ap-sc.on{opacity:.9}',
      '#amenti-prologue .ap-veil{position:absolute;inset:0;',
      '  background:linear-gradient(180deg,rgba(5,8,14,.30) 0%,',
      '  rgba(5,8,14,.55) 38%,rgba(5,8,14,.93) 62%,rgba(5,8,14,.98) 100%)}',
      /* the map takes the upper half and the words the lower — the geography
         is read first and then explained, which is the order a reader wants */
      /* ── THE MAP CAN STAND ASIDE · 10 Sep 2026 ──────────────────────────
         The scene is the better thing to look at and the map is the reference.
         A CLICK ANYWHERE THAT IS NOT THE MAP OR THE WORDS puts the map away
         and leaves the picture; a second click brings it back. Nothing is
         lost either way, which is why it can be a click and not a control. */
      /* ── BARE MEANS BARE · 10 Sep 2026 ──────────────────────────────────
         The first version hid the map and left the words, the nav and the
         veil, so the scene was still cropped and still half covered. IF THE
         POINT IS TO LOOK AT THE PICTURE, EVERYTHING GOES.

         And the image is `contain`, not `cover`. A scene cropped to fill the
         frame loses whatever the generator put at its edges — here, the whole
         upper hall and the arrow in it, which is the subject. */
      '#amenti-prologue.ap-bare .ap-legend,',
      '#amenti-prologue.ap-bare .ap-map,#amenti-prologue.ap-bare .ap-tx,',
      '#amenti-prologue.ap-bare .ap-nav,#amenti-prologue.ap-bare .ap-dots,',
      '#amenti-prologue.ap-bare .ap-big,#amenti-prologue.ap-bare .ap-veil{',
      '  opacity:0;pointer-events:none}',
      '#amenti-prologue.ap-bare .ap-sc{opacity:1;background-size:contain;',
      '  background-repeat:no-repeat;background-position:center;',
      '  background-color:#05080e}',
      '#amenti-prologue .ap-hint{position:absolute;left:50%;bottom:16px;',
      '  transform:translateX(-50%);color:#4d5c70;font-size:9px;',
      '  letter-spacing:.08em;pointer-events:none;z-index:9}',
      '#amenti-prologue .ap-tx,#amenti-prologue .ap-nav,',
      '#amenti-prologue .ap-dots,#amenti-prologue .ap-big,',
      '#amenti-prologue .ap-veil{transition:opacity .35s}',
      /* ── THE MAP AND THE WORDS STOP MEETING · 10 Sep 2026 ────────────────
         Both were positioned against opposite edges, so on a short window they
         met in the middle and the prose ran up through the sea. The map owns a
         band at the top; the words take what is under it AND SCROLL, which is
         what a passage of prose wants anyway. */
      ':root{--ap-band:min(37vh,calc(0.515 * min(760px,88vw)))}',
      '#amenti-prologue .ap-map{position:absolute;left:50%;top:22px;',
      '  transition:opacity .45s;height:var(--ap-band);',
      '  transform:translateX(-50%);width:min(760px,88%);',
      '  border:1px solid rgba(43,58,80,.55);border-radius:3px;overflow:hidden;',
      '  background:#070d16}',
      '#amenti-prologue .ap-map img{position:absolute;inset:0;width:100%;',
      '  height:100%;object-fit:cover;opacity:.72;',
      '  transition:transform .5s cubic-bezier(.4,0,.2,1)}',
      '#amenti-prologue .ap-mk{position:absolute;transform:translate(-50%,-50%);',
      '  pointer-events:none}',
      '#amenti-prologue .ap-mk i{display:block;width:6px;height:6px;',
      '  border-radius:50%;background:#e0913f;box-shadow:0 0 0 3px rgba(224,145,63,.18)}',
      '#amenti-prologue .ap-mk s{position:absolute;left:10px;top:-6px;',
      '  text-decoration:none;white-space:nowrap;color:#dbe8f5;font-size:9.5px}',
      '#amenti-prologue .ap-mk s em{display:block;color:#7d8ea6;font-style:normal;',
      '  font-size:8.5px}',
      /* the room, not the argument */
      '#amenti-prologue .ap-faint i{width:3px;height:3px;background:#4b647d;',
      '  box-shadow:none}',
      '#amenti-prologue .ap-faint s{color:#5d6e84;font-size:8.5px;left:7px;top:-4px}',
      '#amenti-prologue .ap-g{position:absolute;left:50%;top:50%;',
      '  transform:translate(-50%,-50%);text-decoration:none;font-size:13px;',
      '  line-height:1;text-shadow:0 0 8px rgba(0,0,0,.9)}',
      glyphCss(),
      '#amenti-prologue .ap-hasg s{left:13px}',

      '#amenti-prologue .ap-mv{position:absolute;transform:translate(-50%,-50%);',
      '  pointer-events:none;filter:drop-shadow(0 0 6px rgba(0,0,0,.9))}',
      /* the key: what the marks on this slide claim */
      '#amenti-prologue .ap-key{position:absolute;left:50%;',
      '  top:calc(9px + var(--ap-band));transform:translateX(-50%);',
      '  width:min(760px,88%);',
      'display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;',
      'font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;',
      'color:#6d7d92;pointer-events:none}',
      '#amenti-prologue .ap-key span{display:inline-flex;align-items:center;gap:5px}',
      '#amenti-prologue .ap-key b{display:inline-block;width:22px;height:0;',
      'border-top:1.5px solid #c9503f}',
      '#amenti-prologue .ap-key .ap-k-sea{border-top-style:dashed}',
      '#amenti-prologue .ap-key .ap-k-land{border-top-style:dotted}',
      '#amenti-prologue .ap-key .ap-k-wave{width:24px;height:8px;',
      '  color:#c9503f;overflow:visible;flex:0 0 auto}',
      '#amenti-prologue .ap-key .ap-k-thin{border-top-width:.5px}',
      /* the chart's furniture: a rose and a bar, both facts about the frame */
      '#amenti-prologue .ap-rose{position:absolute;right:12px;top:10px;',
      'pointer-events:none;color:#cfd6dd;opacity:.5;text-align:center;',
      'text-shadow:0 1px 3px rgba(0,0,0,.9)}',
      '#amenti-prologue .ap-rose svg{width:13px;height:17px;display:block;margin:0 auto}',
      '#amenti-prologue .ap-rose b{font-size:8.5px;font-weight:600;letter-spacing:.16em;',
      'display:block;margin-top:1px}',
      '#amenti-prologue .ap-scale{position:absolute;left:12px;bottom:10px;',
      'pointer-events:none;color:#cfd6dd;opacity:.5;',
      'text-shadow:0 1px 3px rgba(0,0,0,.9)}',
      '#amenti-prologue .ap-scale i{display:block;height:4px;border:1px solid currentColor;',
      'border-top:0;min-width:24px}',
      '#amenti-prologue .ap-scale s{display:block;text-decoration:none;font-size:8.5px;',
      'letter-spacing:.14em;margin-top:2px}',
      /* the ground: a label on a chart, not a pointer at a thing */
      '#amenti-prologue .ap-gr{position:absolute;transform:translate(-50%,-50%);',
      'pointer-events:none;white-space:nowrap;font-size:10px;font-weight:400;',
      'letter-spacing:.22em;text-transform:uppercase;opacity:.42;',
      'text-shadow:0 1px 3px rgba(0,0,0,.85)}',
      '#amenti-prologue .ap-gr-water{color:#8fb4c6;font-style:italic;letter-spacing:.3em}',
      '#amenti-prologue .ap-gr-land{color:#b9b3a4}',
      '#amenti-prologue .ap-gr-plain{color:#a8a291;font-size:9px;letter-spacing:.18em}',
      /* the pop-out and the box it magnifies */
      '#amenti-prologue .ap-inset{position:absolute;right:9px;bottom:9px;',
      '  width:34%;aspect-ratio:1.94;overflow:hidden;border-radius:3px;',
      '  border:1px solid rgba(201,80,63,.75);background:#070d16;',
      '  box-shadow:0 4px 22px rgba(0,0,0,.75)}',
      '#amenti-prologue .ap-inset img{position:absolute;inset:0;width:100%;',
      '  height:100%;object-fit:cover;opacity:.86}',
      '#amenti-prologue .ap-inloc{position:absolute;pointer-events:none;',
      '  border:1px solid rgba(201,80,63,.85);border-radius:2px;',
      '  box-shadow:0 0 0 1px rgba(5,8,14,.6)}',
      '#amenti-prologue .ap-incap{position:absolute;left:6px;bottom:4px;',
      '  color:#c3d3e6;font-size:8.5px;letter-spacing:.06em;',
      '  text-shadow:0 1px 3px rgba(0,0,0,.95);pointer-events:none}',
      /* the far chart: the theatre inside the world it sits in */
      '#amenti-prologue .ap-far{position:absolute;right:10px;',
      '  top:calc(22px + var(--ap-band) - 118px);width:190px;height:106px;',
      '  overflow:hidden;border-radius:3px;border:1px solid rgba(43,58,80,.7);',
      '  background:#070d16;pointer-events:none}',
      '#amenti-prologue .ap-far img{position:absolute;inset:0;width:100%;',
      '  height:100%;opacity:.5}',
      '#amenti-prologue .ap-far .ap-far-box{position:absolute;',
      '  border:1px solid rgba(224,145,63,.9);border-radius:1px;',
      '  background:rgba(224,145,63,.10)}',
      '#amenti-prologue .ap-far .ap-far-mk{position:absolute;width:3px;',
      '  height:3px;border-radius:50%;background:#5d6e84;',
      '  transform:translate(-50%,-50%)}',
      '#amenti-prologue .ap-far .ap-far-mk.on{background:#e0913f;width:4px;',
      '  height:4px;box-shadow:0 0 0 2px rgba(224,145,63,.25)}',
      '#amenti-prologue .ap-far .ap-far-mk s{position:absolute;left:6px;',
      '  top:-5px;text-decoration:none;white-space:nowrap;color:#9db0c6;',
      '  font-size:8px;letter-spacing:.06em;',
      '  text-shadow:0 1px 3px rgba(0,0,0,.95)}',
      '#amenti-prologue .ap-far .ap-far-mk.on s{color:#e0913f}',
      '#amenti-prologue .ap-far u{position:absolute;left:5px;bottom:3px;',
      '  right:5px;text-decoration:none;color:#5d6e84;font-size:7.5px;',
      '  letter-spacing:.05em;line-height:1.3;',
      '  text-shadow:0 1px 3px rgba(0,0,0,.95)}',
      /* there is only a margin to put it in when the window is wide */
      '@media (max-width:1180px){#amenti-prologue .ap-far{display:none}}',
      '#amenti-prologue .ap-rl{position:absolute;left:10px;top:8px;',
      '  color:#ffd166;font-size:9.5px;letter-spacing:.05em;',
      '  background:rgba(5,8,14,.74);padding:3px 9px;border-radius:2px;',
      '  pointer-events:none;display:flex;align-items:center;gap:7px}',
      '#amenti-prologue .ap-rl span{width:16px;height:0;',
      '  border-top:1.5px dashed #ffd166;display:inline-block}',
      /* ── THE OVERRIDE WAS OVERRIDDEN · 12 Sep 2026 ──────────────────────
         `.ap-rl-land{top:28px}` sat ABOVE `.ap-rl{top:8px}` in the sheet.
         Same specificity, later rule wins, so the land caption drew on top of
         the sea one and slide 1 read as two sentences in one line. A rule that
         exists to override another has to come after it. */
      '#amenti-prologue .ap-rl-land{top:30px;color:#c9503f;',
      '  border-color:#c9503f}',
      '#amenti-prologue .ap-rl-land span{border-top-style:dotted}',
      '#amenti-prologue .ap-legend{position:absolute;left:50%;',
      '  top:calc(30px + var(--ap-band));',
      '  transform:translateX(-50%);width:min(760px,88%);',
      '  display:flex;flex-wrap:wrap;gap:2px 20px;pointer-events:none}',
      '#amenti-prologue .ap-legend div{color:#7d8ea6;font-size:9.5px;',
      '  line-height:1.5;white-space:nowrap}',
      '#amenti-prologue .ap-legend b{color:#dbe8f5;font-weight:400}',
      '#amenti-prologue .ap-off{position:absolute;right:8px;bottom:7px;',
      '  color:#5d6e84;font-size:8.5px;text-align:right;line-height:1.5}',
      /* ── A NAME SET LARGE · 10 Sep 2026 ─────────────────────────────────
         Ornament, and nothing else. It carries no claim the prose does not
         already make and a surface that drops it loses nothing.

         AND IT IS NOT A SCRIPT. Achaemenid Persia wrote Old Persian cuneiform
         and Aramaic; Arabic is a thousand years later, and setting a Persian
         court in it would be the same class of error as drawing a fleet on a
         mountain. Large, spaced and thin is the effect. A wrong alphabet is a
         claim. */
      '#amenti-prologue .ap-big{position:absolute;left:0;right:0;top:34%;',
      '  text-align:center;pointer-events:none;color:#e0913f;opacity:.12;',
      '  font:200 clamp(38px,7.5vw,104px)/1 ui-monospace,Menlo,monospace;',
      '  letter-spacing:.24em;text-indent:.24em;white-space:nowrap;overflow:hidden}',
      '#amenti-prologue .ap-tx{position:absolute;left:50%;bottom:56px;',
      '  top:calc(62px + var(--ap-band));transform:translateX(-50%);',
      '  width:min(760px,88%);overflow-y:auto;padding-right:8px}',
      /* the column's own top edge, so a scrolled passage does not read as if
         it is running underneath the legend · 12 Sep 2026 */
      '#amenti-prologue .ap-tx{-webkit-mask-image:linear-gradient(180deg,',
      '  transparent 0,#000 14px);mask-image:linear-gradient(180deg,',
      '  transparent 0,#000 14px)}',
      '#amenti-prologue .ap-tx::-webkit-scrollbar{width:5px}',
      '#amenti-prologue .ap-tx::-webkit-scrollbar-thumb{',
      '  background:rgba(43,58,80,.85);border-radius:3px}',
      '#amenti-prologue .ap-hd{color:#5d6e84;letter-spacing:.1em;font-size:10px;',
      '  margin-bottom:10px}',
      '#amenti-prologue .ap-ti{color:#e0913f;font-size:19px;line-height:1.3;',
      '  margin-bottom:14px}',
      '#amenti-prologue .ap-pr{color:#c3d3e6;font-size:13px;line-height:1.75}',
      '#amenti-prologue .ap-pr b{color:#dbe8f5;font-weight:400}',
      '#amenti-prologue .ap-pr .ap-n{color:#7fd8f0;font-style:normal}',
      '#amenti-prologue .ap-pr em{color:#9db0c6;font-style:italic}',
      /* a quotation is set apart, because it is the only thing on the slide
         that nobody wrote */
      '#amenti-prologue .ap-said{margin-top:16px}',
      '#amenti-prologue .ap-q{margin-top:12px;padding-left:13px;',
      '  border-left:2px solid #6a5330}',
      '#amenti-prologue .ap-who{color:#e0913f;font-size:10px;letter-spacing:.06em}',
      '#amenti-prologue .ap-to{color:#5d6e84;margin-left:.7em;letter-spacing:.04em}',
      '#amenti-prologue .ap-nowhere{color:#4d5c70;margin-left:.7em;font-size:9px}',
      '#amenti-prologue blockquote{margin:5px 0 0;color:#dbe8f5;font-size:13px;',
      '  line-height:1.7;font-style:italic}',
      '#amenti-prologue .ap-set{color:#7d8ea6;font-size:10px;margin-top:5px;',
      '  line-height:1.6}',
      '#amenti-prologue .ap-ft{color:#4d5c70;font-size:9.5px;margin-top:16px;',
      '  padding-top:9px;border-top:1px solid rgba(43,58,80,.5);line-height:1.6}',
      '#amenti-prologue .ap-nav{position:absolute;left:50%;bottom:26px;',
      '  transform:translateX(-50%);display:flex;gap:6px}',
      '#amenti-prologue .ap-nav button{background:rgba(5,8,14,.9);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:3px;color:#7d8ea6;',
      '  padding:4px 13px;cursor:pointer;font:inherit;letter-spacing:.05em}',
      '#amenti-prologue .ap-nav button:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-prologue .ap-dots{position:absolute;left:50%;bottom:12px;',
      '  transform:translateX(-50%);display:flex;gap:5px}',
      '#amenti-prologue .ap-dots i{width:4px;height:4px;border-radius:50%;',
      '  background:#2b3a50;cursor:pointer}',
      '#amenti-prologue .ap-dots i.on{background:#e0913f}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── THE ROOM, AND THEN THE ARGUMENT · 10 Sep 2026 ──────────────────────
     The first slides drew only the places each one named, and the map read as
     three or four dots in an empty sea. A READER CANNOT PLACE A STORY ON A MAP
     WITH NOTHING ON IT.

     REGION-PLACES.csv is the standing geography of the theatre — thirty places
     so the space is legible. It draws FAINT, because it is the room and not
     the argument, and a slide's own places are drawn bright over the top of
     it. A place the slide names and the standing set also holds is drawn once,
     bright. */
  /* ── WHAT WAS SAID · 10 Sep 2026 ────────────────────────────────────────
     Every other register on this ship is somebody's sentence ABOUT something.
     A quotation is the thing itself: copied rather than composed, and a probe
     can diff it against its file character by character.

     A slide claims a speech by chapter. A speaker with nowhere to be drawn —
     SUSA IS ELEVEN DEGREES EAST OF THIS MAP — is still named and still quoted;
     what a surface must not do is move him somewhere he can be seen. */
  function loadSpeeches() {
    if (speeches) { return Promise.resolve(); }
    return fetch(RAW + 'ATTICA-SPEECHES.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) { speeches = t ? parse(t) : []; })
      .catch(function () { speeches = []; });
  }

  /* ── THE MAP WAS BARE · 11 Sep 2026 ───────────────────────────────────
     REGION-PLACES holds settlements — a position, a mark, a legend line. It
     could not answer `what water is this` or `what is that plain`, so a reader
     who did not already know the Aegean saw grey land and blue water with two
     dots on it.

     ATTICA-GROUND is the standing geography and it is drawn DIFFERENTLY ON
     PURPOSE: no mark, no legend, no click, light and tracked wide, the label
     written on the chart. A slide's places point at something; ground is what
     they point across, and it says the same on every slide because it was true
     before the campaign and stayed true after. */
  /* ── A REGISTER THAT IS NOT THERE MUST SAY SO · 12 Sep 2026 ─────────────
     REGION-PLACES.csv 404'd on every load since the standing-places layer was
     written. The loader caught it, set the list to empty, and DREW NOTHING
     WITHOUT SAYING SO — so the layer looked like a design decision rather than
     a missing file, and the handoff went on listing it as aboard and working.

     REGION.jpg failing writes a line the reader can see. A register failing
     wrote nothing. Same fault, same fix: what could not be read is named. */
  var missing = [];
  function loadCsv(file, set) {
    return fetch(RAW + file + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { missing.push(file); set([]); return; }
        set(parse(t)); harvest();
      })
      .catch(function () { missing.push(file); set([]); });
  }

  function loadGround() {
    if (ground) { return Promise.resolve(); }
    return loadCsv('ATTICA-GROUND.csv', function (v) { ground = v; });
  }

  function loadRegion() {
    if (region) { return Promise.resolve(); }
    return loadCsv('REGION-PLACES.csv', function (v) { region = v; });
  }

  function load() {
    if (slides || err) { return Promise.resolve(); }
    return fetch(RAW + 'ATTICA-PROLOGUE.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { err = 'ATTICA-PROLOGUE.csv could not be read'; return; }
        slides = parse(t).filter(function (r) { return r.prose; })
                         .sort(function (a, b) { return (+a.seq) - (+b.seq); });
        harvest();
      })
      .catch(function (e) { err = e.message; });
  }

  /* ── A ROSE AND A BAR · 11 Sep 2026 ───────────────────────────────────
     The projection is equirectangular and unrotated, so NORTH IS UP and a rose
     is a fact rather than an ornament. The bar is computed from the frame's own
     longitudes at the mid-latitude, not typed — change RLO0/RLO1 and the bar
     follows. It rounds DOWN to a clean distance so the number is readable and
     the bar is never longer than the distance it claims.

     Both are the chart's furniture. They belong to the map and not to any
     slide, so they are built once at mount and the clear routine leaves them
     where the image is left. */
  function fitScale() {
    var bar = el && el.querySelector('.ap-scale');
    if (!bar) { return; }
    var kmPerDeg = 111.32 * Math.cos((F.la0 + F.la1) / 2 * Math.PI / 180);
    var across = (F.lo1 - F.lo0) * kmPerDeg;
    var want = across * 0.14, step = [50, 100, 200, 250, 500, 1000], km = step[0];
    step.forEach(function (v) { if (v <= want) { km = v; } });
    bar.querySelector('i').style.width = (km / across * 100).toFixed(2) + '%';
    bar.querySelector('s').textContent = km + ' km';
  }

  /* ── ONCE, NOT ONCE PER OPENING · 12 Sep 2026 ───────────────────────────
     These were attached inside mount(). finish() drops `el`, so the next
     start() mounted again and added A SECOND PAIR — both closing over the same
     module-level `el`, so both fired and the prose scrolled twice as fast.
     Open it three times and it moved three times as far.

     They live here instead: attached once at load, keyed on `el`, dormant
     whenever the prologue is closed. */
  /* ── AND THE GROUND UNDERNEATH WAS EATING IT · 12 Sep 2026 ──────────────
     Only the scrollbar moved the passage. The wheel did nothing even with
     the cursor inside the column, which is not a scroll-container problem —
     THE SURFACE BELOW ZOOMS ON WHEEL and takes the event before the prose
     ever sees it.

     So this listens in the CAPTURE PHASE, on the window, and stops the
     event dead while the prologue is open. The prologue covers the ground
     completely; nothing underneath it should be reachable by a wheel. */
  window.addEventListener('wheel', function (e) {
    if (!el) { return; }
    /* ── AND WHILE BARE IT STILL MUST NOT REACH THE GROUND · 12 Sep 2026 ─
       Returning early here let the wheel fall through and zoom a map the
       reader cannot see. There is nothing to scroll while bare; there is
       still something to stop. */
    e.stopPropagation();
    e.preventDefault();
    if (el.classList.contains('ap-bare')) { return; }
    var tx = el.querySelector('.ap-tx');
    if (tx) { tx.scrollTop += e.deltaY; }
  }, { capture: true, passive: false });

  window.addEventListener('keydown', function (e) {
    if (!el || el.classList.contains('ap-bare')) { return; }
    if (/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ''))) { return; }
    var tx = el.querySelector('.ap-tx');
    var page = tx ? tx.clientHeight * 0.86 : 400;
    if (e.key === 'ArrowRight') { show(at + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { show(at - 1); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { tx.scrollTop += 60; e.preventDefault(); }
    else if (e.key === 'ArrowUp') { tx.scrollTop -= 60; e.preventDefault(); }
    else if (e.key === 'PageDown' || e.key === ' ') {
      tx.scrollTop += page; e.preventDefault(); }
    else if (e.key === 'PageUp') { tx.scrollTop -= page; e.preventDefault(); }
    else { return; }
    e.stopPropagation();
  }, { capture: true });


  /* ── THE KING IS OFF THE FRAME · 12 Sep 2026 ─────────────────────────────
     Susa is at 48 degrees east and the theatre stops at 37.5, so the man who
     orders all of this has never been drawable. `Susa is off this map to the
     east` was the honest answer and it is still true — but there is a wide
     dark margin beside the map doing nothing, and a reader who has never
     placed Susa learns more from seeing the distance than from being told it.

     A SMALLER MAP, NOT A WIDER ONE. Widening the theatre would shrink Greece
     to a corner to accommodate a place the campaign never reaches. This is a
     separate chart at a separate scale: the whole Near East, the theatre drawn
     as a box inside it, and the king where he actually sat.

     It is the chart's furniture, like the rose and the bar — the same on every
     slide, because the distance from Athens to Susa does not depend on which
     chapter you are reading. RELIEF.jpg is the world image the atlas already
     fetches, at its own full extent. */
  var WLO0 = 19.0, WLO1 = 53.0, WLA0 = 26.0, WLA1 = 45.0;
  function wproj(lat, lon) {
    return { x: (lon - WLO0) / (WLO1 - WLO0) * 100,
             y: (WLA1 - lat) / (WLA1 - WLA0) * 100 };
  }
  function bearings() {
    var host = el && el.querySelector('.ap-far');
    if (!host || host.getAttribute('data-built')) { return; }
    host.setAttribute('data-built', '1');
    var k = 360 / (WLO1 - WLO0);
    var dx = (WLO0 + 180) / 360 * 100;
    var dy = (90 - WLA1) / 180 * 100;
    var out = ['<img alt="" src="' + RAW + 'RELIEF.jpg" style="' +
      'transform-origin:0 0;transform:translate(' + (-dx * k).toFixed(3) + '%,' +
      (-dy * (180 / (WLA1 - WLA0))).toFixed(3) + '%) scale(' + k.toFixed(4) +
      ',' + (180 / (WLA1 - WLA0)).toFixed(4) + ')">'];

    /* the theatre, as a box */
    var a = wproj(RLA1, RLO0), b = wproj(RLA0, RLO1);
    out.push('<i class="ap-far-box" style="left:' + a.x.toFixed(2) + '%;top:' +
      a.y.toFixed(2) + '%;width:' + (b.x - a.x).toFixed(2) + '%;height:' +
      (b.y - a.y).toFixed(2) + '%"></i>');

    /* and the king, where he sat */
    [['Susa', 32.19, 48.26, 1], ['Sardis', 38.49, 28.04, 0],
     ['Athens', 37.98, 23.73, 0]].forEach(function (m) {
      var q = wproj(m[1], m[2]);
      out.push('<b class="ap-far-mk' + (m[3] ? ' on' : '') + '" style="left:' +
        q.x.toFixed(2) + '%;top:' + q.y.toFixed(2) + '%"><s>' + m[0] + '</s></b>');
    });
    out.push('<u>the king, eleven degrees east of the frame</u>');
    host.innerHTML = out.join('');
  }

  function mount() {
    var host = document.getElementById('amenti-attica');
    if (!host || el) { return !!el; }
    style();
    el = document.createElement('div');
    el.id = 'amenti-prologue';
    el.innerHTML =
      '<div class="ap-sc"></div><div class="ap-veil"></div>' +
      '<div class="ap-big"></div><div class="ap-hint"></div>' +
      '<div class="ap-map"><img alt=""><div class="ap-off"></div>' +
      '<div class="ap-rose"><svg viewBox="0 0 24 30" aria-hidden="true">' +
      '<path d="M12 1 L16.4 12 L12 9.6 L7.6 12 Z" fill="currentColor"/>' +
      '<path d="M12 9.6 L16.4 12 L12 23 L7.6 12 Z" fill="currentColor" opacity=".28"/>' +
      '</svg><b>N</b></div>' +
      '<div class="ap-scale"><i></i><s></s></div></div>' +
      '<div class="ap-far"></div>' +
      '<div class="ap-key"></div><div class="ap-legend"></div>' +
      '<div class="ap-tx">' +
      '<div class="ap-hd"></div><div class="ap-ti"></div>' +
      '<div class="ap-pr"></div><div class="ap-said"></div>' +
      '<div class="ap-ft"></div></div>' +
      '<div class="ap-nav">' +
      '<button type="button" data-go="-1">\u25c0</button>' +
      '<button type="button" data-go="1">next \u25b6</button>' +
      '<button type="button" data-go="skip">skip to the map</button>' +
      '</div><div class="ap-dots"></div>';
    host.appendChild(el);
    fitScale();
    bearings();
    el.addEventListener('click', function (e) {
      /* while bare, ANY click brings everything back — there is nothing else
         on the screen to click, and a reader should not have to find a target */
      if (el.classList.contains('ap-bare')) {
        el.classList.remove('ap-bare');
        el.querySelector('.ap-hint').textContent = '';
        shown[at] = 1;
        return;
      }
      if (e.target.closest('.ap-map,.ap-tx,.ap-nav,.ap-dots')) { return; }
      el.classList.add('ap-bare');
      el.querySelector('.ap-hint').textContent = 'click anywhere to come back';
    });
    /* ── THE WHEEL ONLY WORKED OVER THE COLUMN · 12 Sep 2026 ──────────────
       The prose pane scrolls, but it is 88% of a 760px column in the middle of
       a full-bleed surface, so a wheel anywhere else — over the scene, over
       the margins, over the map — landed on the backdrop and did nothing. The
       reader had to find the text before they could move it.

       THE WHOLE SURFACE SCROLLS THE PROSE. And the keys a reader already
       expects work too, because a passage this long wants a page-down. */
    el.querySelectorAll('.ap-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-go');
        if (g === 'skip') { finish(); return; }
        show(at + (+g));
      });
    });
    return true;
  }

  /* ── THE SCENE, IF THERE IS ONE ─────────────────────────────────────────
     Asked for once per tag and remembered. A tag with no image is not retried
     and not apologised for; the footer says it has not been made, which is
     true and is the end of it. */
  function scene(tag) {
    var box = el.querySelector('.ap-sc');
    box.classList.remove('on');
    box.style.backgroundImage = '';
    if (!tag || tried[tag] === false) { return; }
    /* ── THE REPOSITORY FIRST, THE WORKER SECOND · 10 Sep 2026 ────────────
       A scene may live in either place. img/scene/<tag>.jpg is under version
       control and can be diffed; the Worker serves /scene/<tag> out of R2,
       which is where a generated one lands. Everything else load-bearing here
       is plain text in a repository, and a scene that can be reviewed in a
       commit is worth more than one that cannot. */
    var urls = [RAW + 'img/scene/' + tag + '.jpg', SCENE + tag + '.jpg'];
    (function attempt(i) {
      if (i >= urls.length) { tried[tag] = false; return; }
      var img = new Image();
      img.onload = function () {
        tried[tag] = true;
        if (slides[at] && slides[at].scene === tag) {
          box.style.backgroundImage = 'url("' + urls[i] + '")';
          box.classList.add('on');
          if (!shown[at]) {
            el.classList.add('ap-bare');
            el.querySelector('.ap-hint').textContent =
              'click anywhere for the map';
          }
          /* the footer was written before the image answered, and said the
             scene had not been made while it was loading behind it */
          var ft = el.querySelector('.ap-ft');
          if (ft) { ft.innerHTML = ft.innerHTML.split('<br>')[0]; }
        }
      };
      img.onerror = function () { attempt(i + 1); };
      img.src = urls[i];
    })(0);
  }

  function show(n) {
    if (!slides || !slides.length) { return; }
    if (n < 0) { n = 0; }
    if (n >= slides.length) { finish(); return; }
    at = n;
    var s = slides[n];
    el.querySelector('.ap-hd').textContent =
      yr(s.year) + '  \u00b7  HERODOTUS ' + s.chapter +
      '  \u00b7  ' + (n + 1) + ' of ' + slides.length;
    el.querySelector('.ap-big').textContent = s.display || '';
    el.querySelector('.ap-ti').textContent = s.title;
    el.querySelector('.ap-pr').innerHTML = render(s.prose);
    el.querySelector('.ap-ft').innerHTML =
      esc(s.source) + '  \u00b7  ' + esc(s.standing) + '  \u00b7  ' + esc(s.room) +
      (tried[s.scene] === false || tried[s.scene] === undefined
        ? '<br>no scene has been made for \u201c' + esc(s.scene) + '\u201d yet'
        : '');
    var dots = el.querySelector('.ap-dots');
    dots.innerHTML = slides.map(function (_, i) {
      return '<i' + (i === n ? ' class="on"' : '') + ' data-i="' + i + '"></i>';
    }).join('');
    dots.querySelectorAll('i').forEach(function (d) {
      d.addEventListener('click', function () { show(+d.getAttribute('data-i')); });
    });
    said(s);
    locator(s);
    /* a new passage starts at its beginning, not where the last one was left */
    fitScale();
    var txb = el.querySelector('.ap-tx');
    if (txb) { txb.scrollTop = 0; }
    if (tried[s.scene] === true && !shown[n]) {
      el.classList.add('ap-bare');
      el.querySelector('.ap-hint').textContent = 'click anywhere for the map';
    } else if (tried[s.scene] === false) {
      /* no scene for this one — the map is all there is, so show it */
      el.classList.remove('ap-bare');
      el.querySelector('.ap-hint').textContent = '';
    }
    scene(s.scene);
  }

  /* the speeches this slide's chapter carries, under the speaker's name */
  function said(s) {
    var box = el.querySelector('.ap-said');
    var mine = (speeches || []).filter(function (q) { return q.chapter === s.chapter; });
    if (!mine.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = mine.map(function (q) {
      var off = rproj(+q.lat, +q.lon).inside ? '' :
        '<span class="ap-nowhere">not on this map</span>';
      return '<div class="ap-q">' +
        '<div class="ap-who">' + esc(q.speaker) +
        (q.who ? ', ' + esc(q.who) : '') +
        '<span class="ap-to">to ' + esc(q.to) + '</span>' + off + '</div>' +
        '<blockquote>' + esc(q.words) + '</blockquote>' +
        (q.setting ? '<div class="ap-set">' + render(q.setting) + '</div>' : '') +
        '</div>';
    }).join('');
  }

  /* ── THE LOCATOR ────────────────────────────────────────────────────────
     Every place the slide names, marked on the theatre, with one line each
     saying what it was. A leg, where the register gives one, draws as the same
     break-line the campaign uses: two points and nothing asserted about the
     water between them. */
  function locator(s) {
    var box = el.querySelector('.ap-map');
    var img = box.querySelector('img');

    if (img.getAttribute('src') !== RAW + 'REGION.jpg') {
      img.setAttribute('src', RAW + 'REGION.jpg');
      img.onerror = function () {
        box.style.background = '#070d16';
        el.querySelector('.ap-off').textContent =
          'REGION.jpg did not load — the places are still named below';
      };
    }
    /* ── CLEAR EVERYTHING THIS FUNCTION DRAWS · 10 Sep 2026 ────────────────
       The route caption was added on every slide and removed on none, so by
       the eighth there were SEVEN OLD DATES STACKED ACROSS THE MAP and the
       reader was looking at the whole prologue at once.

       A selector that lists what to remove has to list ALL of it, and it will
       fall behind every time something new is drawn. So it removes everything
       inside the map that is not the image — the map owns one child it did not
       make, and everything else is this function's to clean up. */
    [].slice.call(box.children).forEach(function (n) {
      if (n.tagName === 'IMG') { return; }
      if (n.classList.contains('ap-off')) { return; }
      /* the rose and the bar are the chart's furniture, not the slide's · 11 Sep 2026 */
      if (n.classList.contains('ap-rose') || n.classList.contains('ap-scale')) { return; }
      n.remove();
    });

    /* the ground first, beneath the room and beneath the slide */
    /* ── A LABEL EARNS ITS ROOM · 11 Sep 2026 ───────────────────────────
       Thirty-five ground labels on fixed anchors WILL COLLIDE — Lykia lands on
       Pamphylia at this frame and neither can be read. The register carries a
       `span`: the widest frame, in degrees of longitude, at which the label is
       worth drawing. A continent is worth it always; Bithynia only when the
       frame is close enough that there is room for the word.

       This is not a collision solver and does not pretend to be one. It is a
       decision about IMPORTANCE, made in the register by the person who knows
       which names the reader needs, and it costs nothing at draw time. */
    var span = F.lo1 - F.lo0;
    (ground || []).forEach(function (g) {
      var sp = parseFloat(g.span);
      if (!isNaN(sp) && span > sp) { return; }
      var q = rproj(+g.lat, +g.lon);
      if (!q.inside) { return; }
      var d = document.createElement('div');
      d.className = 'ap-gr ap-gr-' + (g.kind || 'land');
      d.style.left = q.x.toFixed(2) + '%';
      d.style.top = q.y.toFixed(2) + '%';
      d.textContent = g.name || '';
      box.appendChild(d);
    });

    /* the room next, underneath the slide */
    var mine = {};
    (s.places || '').split(';').forEach(function (p) {
      var q = p.split('|'); if (q[0]) { mine[q[0].trim().toLowerCase()] = 1; }
    });
    (region || []).forEach(function (r) {
      if (mine[(r.name || '').toLowerCase()]) { return; }
      var q = rproj(+r.lat, +r.lon);
      if (!q.inside) { return; }
      var m = document.createElement('div');
      m.className = 'ap-mk ap-faint';
      m.style.left = q.x.toFixed(2) + '%';
      m.style.top = q.y.toFixed(2) + '%';
      m.innerHTML = '<i></i><s>' + esc(r.name) + '</s>';
      box.appendChild(m);
    });

    var glyphs = {};
    (s.glyphs || '').split(';').forEach(function (g) {
      var q = g.split('='); if (q[0] && q[1]) { glyphs[q[0].trim().toLowerCase()] = q[1].trim(); }
    });

    var legend = [], off = [], used_g = {};
    (s.places || '').split(';').forEach(function (p) {
      if (!p.trim()) { return; }
      var q = p.split('|');
      var name = q[0], la = parseFloat(q[1]), lo = parseFloat(q[2]), what = q[3] || '';
      if (isNaN(la) || isNaN(lo)) { off.push(name.trim()); return; }
      var r = rproj(la, lo);
      if (!r.inside) { off.push(name + ' — off this map'); return; }
      var m = document.createElement('div');
      m.className = 'ap-mk';
      m.style.left = r.x.toFixed(2) + '%';
      m.style.top = r.y.toFixed(2) + '%';
      /* ── A GLYPH IS A CLAIM · 10 Sep ─────────────────────────────────
         Every one is in a passage: Sardis burnt at 5.101, Athos wrecked at
         6.44, the Brygians in the night at 6.45, the muster on the Aleïan
         plain at 6.95, Naxos burnt at 6.96, Delos spared at 6.97. A place
         with nothing recorded gets a plain dot, which is not a smaller claim
         but no claim at all. */
      /* ── THE MAP CARRIES NAMES, NOT SENTENCES · 10 Sep 2026 ────────────
         Every named place drew a line of prose under it, and on a map of the
         whole theatre those lines ran through each other and through the route
         label — FOUR SENTENCES IN A SPACE THAT HOLDS ONE.

         Names stay on the ground. What each place WAS goes to a legend under
         the map, in a column, where it can be read. A label is a pointer; a
         sentence is a paragraph, and they do not belong in the same space. */
      var gk = glyphs[name.trim().toLowerCase()] || '';
      m.innerHTML = (gk ? '<u class="ap-g ap-g-' + gk + '">' + GL[gk] + '</u>'
                        : '<i></i>') + '<s>' + esc(name) + '</s>';
      if (gk) { m.classList.add('ap-hasg'); used_g[gk] = 1; }
      if (what) { m.title = name + ' \u2014 ' + what; legend.push([name, what, gk, lo]); }
      box.appendChild(m);
    });

    /* ── GROUND WITH AN EDGE · 12 Sep 2026 ────────────────────────────────
       Every mark so far is a POINT. The Aleïan plain is not a point — it is
       the flat country behind the Gulf of Issos, and putting a dot in the
       middle of it says `here` about a thing whose whole character is `all of
       this`. An army encamps on ground, not at a coordinate.

       So a region draws as a region: a faint fill, a dashed edge, no label of
       its own. The places inside it keep their marks. IT IS DRAWN FIRST and
       sits under everything, because it is what the slide happens on rather
       than a thing the slide points at.

       THE OUTLINE IS DERIVED. Herodotus names the plain and gives no edges;
       these follow the coast and the foot of the Taurus, and the register says
       so on the row. */
    function drawArea(spec, proj, host) {
      if (!spec) { return; }
      var pts = spec.split('>').map(function (q) {
        var c = q.split('|'); return proj(parseFloat(c[0]), parseFloat(c[1]));
      }).filter(function (q) { return !isNaN(q.x); });
      if (pts.length < 3) { return; }
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sv.setAttribute('class', 'ap-area');
      sv.setAttribute('viewBox', '0 0 100 100');
      sv.setAttribute('preserveAspectRatio', 'none');
      sv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
                         'pointer-events:none';
      var pa = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pa.setAttribute('d', pts.map(function (p, i) {
        return (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
      }).join(' ') + ' Z');
      pa.setAttribute('fill', 'rgba(201,214,168,.10)');
      pa.setAttribute('stroke', '#c9d6a8');
      pa.setAttribute('stroke-width', '0.9');
      pa.setAttribute('stroke-dasharray', '2.4 2');
      pa.setAttribute('vector-effect', 'non-scaling-stroke');
      pa.setAttribute('opacity', '.7');
      sv.appendChild(pa);

      /* ── A HOST IS NOT A COUNT · 12 Sep 2026 ──────────────────────────
         `the army musters` drawn as one mark says an army was AT A POINT. It
         was not; it was spread over the plain, which is why the plain is the
         thing Herodotus names.

         So the ground inside the outline gets a scatter. IT MUST NOT LOOK
         COUNTABLE — Herodotus gives six hundred ships and NO NUMBER OF MEN, and
         a reader who counts dots and multiplies has been told something the
         passage does not say. The dots are irregular, unlabelled, of varying
         weight, and there are as many as the ground will hold rather than as
         many as anybody was.

         The placement is a hash of the index, so it is the same scatter every
         time. A crowd that reshuffles on every redraw is an animation nobody
         asked for. */
      if (s.host) {
        var xs = pts.map(function (p) { return p.x; });
        var ys = pts.map(function (p) { return p.y; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        function inPoly(px, py) {
          var c = false;
          for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            if (((pts[i].y > py) !== (pts[j].y > py)) &&
                (px < (pts[j].x - pts[i].x) * (py - pts[i].y) /
                      (pts[j].y - pts[i].y) + pts[i].x)) { c = !c; }
          }
          return c;
        }
        var seed = 1337, put = 0;
        for (var n = 0; n < 900 && put < 150; n++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          var rx = x0 + (seed / 0x7fffffff) * (x1 - x0);
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          var ry = y0 + (seed / 0x7fffffff) * (y1 - y0);
          if (!inPoly(rx, ry)) { continue; }
          var d = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          d.setAttribute('cx', rx.toFixed(2));
          d.setAttribute('cy', ry.toFixed(2));
          d.setAttribute('r', (0.22 + (n % 3) * 0.08).toFixed(2));
          d.setAttribute('fill', '#c9503f');
          d.setAttribute('opacity', (0.5 + (n % 4) * 0.12).toFixed(2));
          sv.appendChild(d);
          put++;
        }
      }
      host.insertBefore(sv, host.firstChild.nextSibling);
    }
    drawArea(s.area, rproj, box);

    /* ── THE POP-OUT ──────────────────────────────────────────────────────
       Same image, same marks, a closer frame. It is drawn last so it sits over
       the ground, and the box it magnifies is drawn on the ground so the two
       can be read together. */
    F = frameFor(s.frame);
    var fk = (RLO1 - RLO0) / (F.lo1 - F.lo0);
    var fdx = (F.lo0 - RLO0) / (RLO1 - RLO0) * 100;
    var fdy = (RLA1 - F.la1) / (RLA1 - RLA0) * 100;
    img.style.transformOrigin = '0 0';
    img.style.transform = 'translate(' + (-fdx * fk).toFixed(3) + '%,' +
                          (-fdy * fk).toFixed(3) + '%) scale(' + fk.toFixed(4) + ')';

    var mass = {};
    (s.mass || '').split(';').forEach(function (m) {
      var q = m.split('='); if (q[0] && q[1]) { mass[q[0].trim()] = q[1].trim(); }
    });

    IN = insetFor(s.inset);
    if (IN) {
      var q0 = rproj(IN.la1, IN.lo0), q1 = rproj(IN.la0, IN.lo1);
      var lc = document.createElement('div');
      lc.className = 'ap-inloc';
      lc.style.left = q0.x.toFixed(2) + '%';
      lc.style.top = q0.y.toFixed(2) + '%';
      lc.style.width = (q1.x - q0.x).toFixed(2) + '%';
      lc.style.height = (q1.y - q0.y).toFixed(2) + '%';
      box.appendChild(lc);

      var pane = document.createElement('div');
      pane.className = 'ap-inset';
      var ik = (RLO1 - RLO0) / (IN.lo1 - IN.lo0);
      var idx = (IN.lo0 - RLO0) / (RLO1 - RLO0) * 100;
      var idy = (RLA1 - IN.la1) / (RLA1 - RLA0) * 100;
      pane.innerHTML = '<img alt="" src="' + RAW + 'REGION.jpg" style="' +
        'transform-origin:0 0;transform:translate(' + (-idx * ik).toFixed(3) +
        '%,' + (-idy * ik).toFixed(3) + '%) scale(' + ik.toFixed(4) + ')">';

      (s.places || '').split(';').forEach(function (p) {
        if (!p.trim()) { return; }
        var c = p.split('|'), nm = c[0];
        var r = iproj(parseFloat(c[1]), parseFloat(c[2]));
        if (!r.inside) { return; }
        var gk = glyphs[nm.trim().toLowerCase()] || '';
        var m = document.createElement('div');
        m.className = 'ap-mk' + (gk ? ' ap-hasg' : '');
        m.style.left = r.x.toFixed(2) + '%';
        m.style.top = r.y.toFixed(2) + '%';
        m.innerHTML = (gk ? '<u class="ap-g ap-g-' + gk + '">' + GL[gk] + '</u>'
                          : '<i></i>') + '<s>' + esc(nm) + '</s>';
        pane.appendChild(m);
      });

      /* ── THE PANE IS GROUND TOO · 12 Sep 2026 ───────────────────────
         Ground labels drew on the main map only, so a name given a tight span
         — the Gulf of Issos at 9 — had nowhere to appear: too close for the
         theatre, and the pane was not asking. A pop-out that shows a plain and
         cannot name the water it lies behind is a close-up with no bearings.

         The pane gates on ITS OWN span, which is the whole point of the
         column: at nine degrees the gulf is worth the room, at sixteen it is
         not. */
      var pspan = IN.lo1 - IN.lo0;
      (ground || []).forEach(function (g) {
        var sp = parseFloat(g.span);
        if (!isNaN(sp) && pspan > sp) { return; }
        var q = iproj(+g.lat, +g.lon);
        if (!q.inside) { return; }
        var d = document.createElement('div');
        d.className = 'ap-gr ap-gr-' + (g.kind || 'land');
        d.style.left = q.x.toFixed(2) + '%';
        d.style.top = q.y.toFixed(2) + '%';
        d.textContent = g.name || '';
        pane.appendChild(d);
      });

      drawArea(s.area, iproj, pane);
      /* the leg, at fifteen times the scale, clipped by the pane itself */
      drawRoute(s.route, '', 'sea', mass.sea, iproj, pane, 1);
      (s.route_land || '').split(';').forEach(function (leg) {
        drawRoute(leg, '', 'land', mass.land, iproj, pane, 1);
      });

      var cap = document.createElement('div');
      cap.className = 'ap-incap';
      var ikm = 111.32 * Math.cos((IN.la0 + IN.la1) / 2 * Math.PI / 180) *
                (IN.lo1 - IN.lo0);
      cap.textContent = (s.inset_label || '') +
        (s.inset_label ? '  \u00b7  ' : '') + Math.round(ikm) + ' km across';
      pane.appendChild(cap);
      box.appendChild(pane);
    }

    /* ── THE ROUTE · 10 Sep 2026 ────────────────────────────────────────
       Dashed, with an arrowhead, and a date on it. A DIFFERENT MARK FROM THE
       CAMPAIGN'S BREAK-LINE on purpose: a break-line says `these two points
       and nothing between them`; a route with waypoints says the waypoints are
       where the passage put them. Neither draws a course — the segments run
       straight between named places and assert nothing about the water or the
       road in between. */
    /* ── TWO FORCES, TWO ROUTES · 10 Sep 2026 ───────────────────────────
       6.43 sends an army by road and a fleet by sea from the same place to the
       same place. ONE LINE CANNOT BE BOTH, and labelling a single line `by
       sea, the army by land` drew it as neither.

       The sea route is bent to the water. The land route is not — a road is a
       road, and the passage gives no route for either. */
    /* ── AN ARROW CARRIES MASS · 11 Sep 2026 ────────────────────────────
       A lone runner and six hundred triremes drew the same line, and a reader
       had no way to tell them apart. BROAD IS A FORCE AND NARROW IS ONE MAN.

       Mass, and not certainty — certainty has the note column, and a surface
       that spends its only remaining variable on something already recorded
       has nothing left for the thing Herodotus keeps saying. Pheidippides at
       6.105 is what this is for.

       The register gives it as `sea=broad;land=narrow`, the same shape as
       `glyphs`, and a leg that says nothing is a force. */
    /* ── A SLIDE CAN HAVE MORE THAN ONE MARCH · 12 Sep 2026 ─────────────
       6.45 has two movements on one ground: the army going into Macedonia, and
       the Brygians coming down on it in the night. ONE COLUMN COULD HOLD ONE
       OF THEM, so the attack was a sentence in the prose and nothing on the
       map.

       Semicolons separate legs. One leg is the ordinary case and reads exactly
       as before; the caption belongs to the first, because a caption is the
       slide's line and not the leg's. */
    drawRoute(s.route, s.route_label, 'sea', mass.sea);
    (s.route_land || '').split(';').forEach(function (leg, li) {
      drawRoute(leg, li ? '' : s.route_land_label, 'land', mass.land);
    });

    /* ── THE BLOCK WAS PASTED, NOT MOVED · 11 Sep 2026 ────────────────────
       When drawRoute() went in, the places loop and the OLD single-route
       block were left standing below it as well as above. Every place drew
       twice — `Sardis` under `Sardis`, `Kilikia` under `Kilikia` — and on
       slide 2 the old block's caption drew on top of the new one, two strings
       superimposed at different advances, which is why it read
       `Mardoniosbhimself,tbyosea`. Not a font fault and not a double render:
       one function drawing the same things twice.

       Both leftovers are cut. drawRoute() above owns the routes and their
       captions; the places loop above owns the marks and the legend. */
      /* ── THE SAME LEG, DRAWN TWICE · 12 Sep 2026 ──────────────────────
         The route was hardwired to the theatre's projection, so the pop-out
         could show places and nothing moving between them. It takes a
         projection and a host instead, and the pane draws its own copy of the
         leg at fifteen times the scale — where a ship is the right size for
         once and the wind can sit where the wind was.

         The pop-out HOLDS STILL while the mark moves through it. A pane that
         pans as well as magnifies is two motions at once, and the box on the
         ground would have to chase it. */
      function drawRoute(spec, label, kind, weight, proj, host, quiet) {
      var thin = weight === 'narrow';
      proj = proj || rproj; host = host || box;
      if (!spec) { return; }
      var pts = spec.split('>').map(function (q) {
        var c = q.split('|'); return proj(parseFloat(c[0]), parseFloat(c[1]));
      }).filter(function (q) { return !isNaN(q.x); });
      if (pts.length < 2) { return; }
      if (kind === 'sea' && proj === rproj) {
        var wp = [pts[0]];
        for (var wi = 0; wi < pts.length - 1; wi++) {
          wp = wp.concat(wet(pts[wi], pts[wi + 1], 0).slice(1));
        }
        pts = wp;
      }
      /* ── ONE FORCE, TWO MEANS · 11 Sep 2026 ──────────────────────────
         The army and the fleet are the same expedition, so both legs take the
         fleet glyph's red. Sea and land stay apart by DASH, not by hue —
         hue is a side, and there is only one side moving here. */
      var hue = '#c9503f';
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sv.setAttribute('class', 'ap-leg');
      sv.setAttribute('viewBox', '0 0 100 100');
      sv.setAttribute('preserveAspectRatio', 'none');
      sv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      var pa = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pa.setAttribute('d', pts.map(function (p, i) {
        return (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2); }).join(' '));
      pa.setAttribute('fill', 'none');
      pa.setAttribute('stroke', hue);
      pa.setAttribute('stroke-width', thin ? '0.7' : (kind === 'land' ? '1.1' : '1.4'));
      /* the dash is the MEDIUM and the weight is the MASS — long for water,
         fine for a road, and neither says anything about how many */
      pa.setAttribute('stroke-dasharray', kind === 'land' ? '1.5 2.6' : '4 2.6');
      pa.setAttribute('vector-effect', 'non-scaling-stroke');
      pa.setAttribute('opacity', kind === 'land' ? '.8' : '.92');
      sv.appendChild(pa);
      var p1 = pts[pts.length - 2], p2 = pts[pts.length - 1];
      var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      var hd = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      /* ── AND THE HEAD IS DRAWN IN A STRETCHED BOX · 12 Sep 2026 ───────
         preserveAspectRatio is `none` on a box far wider than it is tall, so
         every unit of x is worth more than a unit of y. Enlarging the broad
         head to 3.2 put a wedge the size of Lesbos on the map. Back to what
         worked, and narrow is smaller than broad rather than broad bigger. */
      hd.setAttribute('d', thin ? 'M0,0 L-1.9,0.7 L-1.9,-0.7 Z'
                                : 'M0,0 L-2.6,1.3 L-2.6,-1.3 Z');
      hd.setAttribute('fill', hue);
      hd.setAttribute('transform', 'translate(' + p2.x.toFixed(2) + ' ' +
                      p2.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
      sv.appendChild(hd);
      host.appendChild(sv);

      /* the mark, where the position says. No position, no mark. */
      if (POS !== null) {
        var q = along(pts, POS);
        if (q) {
          var gk = kind === 'land' ? 'horse' : 'fleet';
          var mv = document.createElement('div');
          mv.className = 'ap-mv';
          mv.style.left = q.x.toFixed(2) + '%';
          mv.style.top = q.y.toFixed(2) + '%';
          mv.innerHTML = '<u class="ap-g ap-g-' + gk + '">' + GL[gk] + '</u>';
          host.appendChild(mv);
        }
      }
      if (label && !quiet) {
        var lb = document.createElement('div');
        lb.className = 'ap-rl ap-rl-' + kind;
        lb.innerHTML = '<span style="border-color:' + hue + '"></span>' + esc(label);
        host.appendChild(lb);
      }
    }

  /* ── LABELS THAT WOULD LAND ON EACH OTHER · 10 Sep 2026 ──────────────
       Acanthos, Thasos and Athos are within a few kilometres on a map of the
       whole theatre, and their labels drew straight through one another —
       `Acanthos` and `Mount Athos` interleaved into one unreadable line.

       The mark stays where the place is; ONLY THE LABEL MOVES, and it is
       tethered by the dot it belongs to. A label is text to read, not a claim
       about the world — the same exception the ground surface makes when it
       lets a label grow with zoom while a pin may not. */
    (function () {
      var marks = [].slice.call(box.querySelectorAll('.ap-mk'));
      var used = [];
      marks.forEach(function (m) {
        var lab = m.querySelector('s');
        if (!lab) { return; }
        var x = parseFloat(m.style.left), y = parseFloat(m.style.top);
        var step = 0;
        while (step < 8) {
          var clash = used.some(function (u) {
            return Math.abs(u.x - x) < 13 && Math.abs(u.y - (y + step * 3.2)) < 2.6;
          });
          if (!clash) { break; }
          step++;
        }
        if (step) { lab.style.top = (-6 + step * 13) + 'px'; }
        /* and a label that would run off the right edge flips to the left */
        if (x > 74) { lab.style.left = 'auto'; lab.style.right = '10px';
                      lab.style.textAlign = 'right'; }
        used.push({ x: x, y: y + step * 3.2 });
      });
    })();

    /* ── THE LEGEND READS WEST TO EAST · 11 Sep 2026 ────────────────────
       The sentences came out in register order and the eye reads the map from
       the left, so the third line described the first place. Sorted by
       longitude the two agree, and a reader can follow the legend along the
       ground instead of hunting for each name. */
    legend.sort(function (a, b) { return a[3] - b[3]; });

    var kb = el.querySelector('.ap-legend');
    kb.innerHTML = legend.map(function (L) {
      return '<div>' + (L[2] ? '<u class="ap-g ap-g-' + L[2] +
             '" style="position:static;transform:none;font-size:10px">' +
             GL[L[2]] + '</u> ' : '') + '<b>' + esc(L[0]) + '</b> \u00b7 ' +
             esc(L[1]) + '</div>';
    }).join('');

    /* ── THE KEY, AND IT COUNTS WHAT IS THERE · 11 Sep 2026 ─────────────
       Five glyphs, two dashes and three weights of ground text went onto this
       map and NOTHING SAID WHAT ANY OF THEM MEANT. A reader who does not
       already know the campaign was given a picture, not a chart.

       The key is built from what this slide actually drew — the glyphs it
       used, and each route only if that route exists. A KEY THAT LISTS WHAT
       COULD BE THERE goes stale the moment a mark is added or dropped; this
       one cannot, because it is counted, not typed. */
    var kk = el.querySelector('.ap-key'), kbits = [];
    Object.keys(GN).forEach(function (g) {
      if (!used_g[g]) { return; }
      kbits.push('<span><u class="ap-g ap-g-' + g +
                 '" style="position:static;transform:none;font-size:9px">' +
                 GL[g] + '</u> ' + GN[g] + '</span>');
    });
    /* ── WATER IS A WAVE · 12 Sep 2026 ──────────────────────────────────
       A dashed swatch beside `by sea` and a dotted one beside `by road` are
       two lengths of dash and a reader has to be told which is which. A sine
       laid on its side is the chart's own idiom for water and needs no key of
       its own — WHICH IS WHAT A KEY ENTRY SHOULD BE.

       It is an IDIOM AND NOT A SAMPLE. The line on the map is still dashed;
       this says what the line means rather than what it looks like. */
    if (s.route) {
      kbits.push('<span><svg class="ap-k-wave" viewBox="0 0 26 8" ' +
        'aria-hidden="true"><path d="M1 4 q3 -3.4 6 0 t6 0 t6 0 t6 0" ' +
        'fill="none" stroke="currentColor" stroke-width="1.3" ' +
        'stroke-linecap="round"/></svg> by sea</span>');
    }
    if (s.route_land) { kbits.push('<span><b class="ap-k-land"></b> by road</span>'); }
    if (mass.sea === 'narrow' || mass.land === 'narrow') {
      kbits.push('<span><b class="ap-k-thin"></b> one man</span>');
    }
    if (kk) { kk.innerHTML = kbits.join(''); }

    /* ── WHAT THE FRAME LEAVES OUT · 11 Sep 2026 ────────────────────────
       `Susa is off this map to the east` was the best line on the surface and
       it was smuggled in as a place with no coordinates. It has its own column
       now. A frame that says what it excludes is telling the truth about its
       edges; one that just stops is not. */
    var edges = (s.edges || '').split(';').map(function (e) { return e.trim(); })
                               .filter(function (e) { return e; });
    if (missing.length) {
      edges = edges.concat(missing.map(function (f) {
        return f + ' could not be read';
      }));
    }
    el.querySelector('.ap-off').innerHTML =
      esc(off.concat(edges).join(' \u00b7 '));
  }

  /* the back story ends and the ground begins \u2014 6.96 to 6.97, which is the
     seam the register was cut at */
  /* the listeners are keyed on `el`, so dropping it hands the wheel and the
     keys straight back to the ground underneath */
  function finish() {
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    el = null; at = -1;
    if (window.AmentiCampaign && window.AmentiCampaign.start) {
      window.AmentiCampaign.start();
    }
  }

  function start() {
    return load().then(function () {
      if (err) { console.log('THE BACK STORY: ' + err); return; }
      if (!mount()) {
        console.log('THE BACK STORY: the ground is not open. AmentiAttica.show() first.');
        return;
      }
      Promise.all([loadRegion(), loadGround(), loadSpeeches()]).then(function () { show(0); });
    });
  }

  /* ── A BUTTON, NOT A CONSOLE LINE · 10 Sep 2026 ─────────────────────────
     An instrument that can only be started by typing its name is an instrument
     no visitor has. It joins the control row the period buttons live on, at
     the end, and it says what it does rather than what it is called.

     IT WAITS FOR THE SURFACE. The Attica ground mounts its own controls when
     it opens, so this looks for the row and tries again until it is there —
     and gives up quietly after a while rather than polling for ever. */
  /* ── ITS OWN PLACE, ABOVE THE KEY · 10 Sep 2026 ───────────────────────────
     Two attempts inside the control row and both landed under the guide and
     the meter, which are FIXED TO THE BOTTOM CORNERS AND DRAWN OVER THIS
     SURFACE. Pushing it left only moved it from under one tab to under both.

     A row that ends where two other instruments begin cannot be negotiated
     with. So the button leaves the row and takes the strip above the key —
     top left, between the frame title and the first legend line, empty at
     every period and every zoom, and the first thing in reading order rather
     than the last. */
  function join() {
    var host = document.getElementById('amenti-attica');
    if (!host) { return false; }
    if (host.querySelector('[data-prologue]')) { return true; }
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-prologue', '1');
    /* ── THE BAND UNDER THE TITLE · 10 Sep 2026 ───────────────────────────
       Three placements and the first two were both swallowed. The control row
       ends under the guide and the meter; the top-left strip is narrow and
       sits against the frame title. THE BAND BELOW THE TITLE AND ABOVE THE
       GROUND IS EMPTY AT EVERY PERIOD AND EVERY ZOOM, and it is the width of
       the surface.

       AND IT IS FILLED, NOT OUTLINED. Every other control here is a hairline
       box because every other control is a SETTING — a period, a zoom, a
       switch. This one starts a thing, and the one action on a surface of
       settings should not be dressed as another setting. */
    /* ── AND IT SITS CLEAR OF THE GROUND · 10 Sep 2026 ───────────────────
       Centred under the title it lay ON the map image, which is centred too.
       The right margin beside the map is empty at every zoom, and below the
       faculty rail there is room for it. FOURTH PLACEMENT, AND THE LESSON IS
       THAT EVERY EDGE OF THIS SURFACE IS SPOKEN FOR — the bottom by the guide
       and the meter, the top right by the rail, the left by the key. What is
       free is the margin the map does not fill. */
    /* ── FIFTH AND LAST · 10 Sep 2026 ─────────────────────────────────────
       The control row is under the guide and the meter. Centred under the
       title is on the map image. The right margin is on the place list. THE
       STRIP ABOVE THE KEY IS THE ONE PLACE NOTHING ELSE CLAIMS — the key starts
       at top:52 and the title is centred, so left:26 top:14 is free at every
       zoom and every period.

       It was here on the second attempt and was moved for being too quiet.
       Filled amber answers that without moving it again. */
    b.style.cssText = 'position:absolute;left:26px;top:14px;z-index:8;' +
      'background:#e0913f;color:#0a0e15;' +
      'border:0;border-radius:3px;padding:7px 20px;cursor:pointer;' +
      'font:400 12px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.06em;' +
      'box-shadow:0 2px 18px rgba(224,145,63,.28)';
    b.textContent = '\u25b6 the Marathon campaign';
    b.title = 'Six slides of back story, then ten legs on the ground \u2014 ' +
              'Herodotus 6.43 to 6.116';
    b.addEventListener('mouseenter', function () { b.style.background = '#ffd166'; });
    b.addEventListener('mouseleave', function () { b.style.background = '#e0913f'; });
    b.addEventListener('click', function () {
      if (window.AmentiCampaign && window.AmentiCampaign.stop) {
        window.AmentiCampaign.stop();
      }
      start();
    });
    host.appendChild(b);
    return true;
  }

  var tries = 0;
  (function wait() {
    if (join()) { return; }
    if (++tries > 60) {
      console.log('THE BACK STORY: no .at-ctl to join after 30 seconds. ' +
                  'Open the ground and it will attach on the next look.');
      tries = 0;
      setTimeout(wait, 4000);
      return;
    }
    setTimeout(wait, 500);
  })();

  /* ── AND IT CAN BE TRIED WITHOUT AN UPLOAD · 11 Sep 2026 ────────────────
     Tuning a glyph meant an edit, a commit, a Pages build and a hard reload,
     which is four minutes for a number that wants six tries. `marks()` rewrites
     the stylesheet in place: AmentiPrologue.marks(1.4) scales every mark, and
     AmentiPrologue.marks({gold: 15}) moves one. Nothing is saved — what looks
     right here still has to be written into GA. */
  function marks(arg) {
    if (typeof arg === 'number') { GS = arg; }
    else if (arg) { Object.keys(arg).forEach(function (k) {
      if (GA[k]) { GA[k][1] = arg[k]; } }); }
    var old = document.getElementById('prologue-glyph-css');
    if (old) { old.remove(); }
    var st = document.createElement('style');
    st.id = 'prologue-glyph-css';
    st.textContent = glyphCss();
    document.head.appendChild(st);
    return { scale: GS, marks: GA };
  }

  /* set a position and redraw; play() is a loop that sets positions, and it
     is deliberately the thin thing on top rather than the other way round */
  function pos(p) {
    POS = (p === null || p === undefined) ? null : Math.max(0, Math.min(1, p));
    if (slides && at >= 0) { locator(slides[at]); }
    return POS;
  }
  function play(seconds) {
    stopPlay();
    var t0 = performance.now(), ms = (seconds || 8) * 1000;
    (function step(now) {
      var p = (now - t0) / ms;
      if (p >= 1) { pos(1); RAF = 0; return; }
      pos(p);
      RAF = requestAnimationFrame(step);
    })(t0);
  }
  function stopPlay() {
    if (RAF) { cancelAnimationFrame(RAF); RAF = 0; }
  }

  window.AmentiPrologue = {
    pos: pos,
    play: play,
    stop_play: function () { stopPlay(); pos(null); },
    marks: marks,
    join: join,
    start: start,
    stop: function () { if (el && el.parentNode) { el.parentNode.removeChild(el); } el = null; at = -1; },
    at: function (n) { show(n); return at; },
    slides: function () { return load().then(function () {
      return err ? { error: err } : slides.map(function (s) {
        return { seq: s.seq, chapter: s.chapter, title: s.title,
                 scene: s.scene, made: tried[s.scene] === true };
      });
    }); }
  };
})();
