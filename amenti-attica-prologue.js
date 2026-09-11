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

  var slides = null, err = null, el = null, at = -1, tried = {}, region = null;
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

  /* ── A SHIP DOES NOT CROSS A MOUNTAIN · 10 Sep 2026 ─────────────────────
     The routes were straight lines between named places, so Kilikia to Samos
     ran over Anatolia and Thasos to Athos cut across the peninsula. On a map
     whose whole argument is that the ground decides, THAT IS THE WORST
     POSSIBLE ERROR — the fleet-on-a-mountain fault, drawn deliberately.

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
      if (!SEA.at(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) { dry = true; break; }
    }
    if (!dry) { return [a, b]; }
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L;
    for (var d = 1.5; d <= 26; d += 1.5) {
      for (var sg = 0; sg < 2; sg++) {
        var sn = sg ? -1 : 1;
        var qx = mx + nx * d * sn, qy = my + ny * d * sn;
        if (!SEA.at(qx, qy)) { continue; }
        var m = { x: qx, y: qy };
        return wet(a, m, (depth || 0) + 1).concat(wet(m, b, (depth || 0) + 1).slice(1));
      }
    }
    return [a, b];   /* nowhere wet within reach — leave it, do not pretend */
  }
  var GL = { fire: '\u25b2', wreck: '\u2715', battle: '\u2694',
             muster: '\u25a3', fleet: '\u25b8', city: '\u25cf', sacred: '\u25c7' };
  function rproj(lat, lon) {
    return { x: (lon - RLO0) / (RLO1 - RLO0) * 100,
             y: (RLA1 - lat) / (RLA1 - RLA0) * 100,
             inside: lon >= RLO0 && lon <= RLO1 && lat >= RLA0 && lat <= RLA1 };
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
      '  height:100%;object-fit:cover;opacity:.72}',
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
      '#amenti-prologue .ap-g-fire{color:#ff7a3d}',
      '#amenti-prologue .ap-g-wreck{color:#ff5a45;font-size:15px}',
      '#amenti-prologue .ap-g-battle{color:#ffd166}',
      '#amenti-prologue .ap-g-muster{color:#c9d6a8}',
      '#amenti-prologue .ap-g-fleet{color:#c9503f}',
      '#amenti-prologue .ap-g-city{color:#e0913f}',
      '#amenti-prologue .ap-g-sacred{color:#7fd8f0}',
      '#amenti-prologue .ap-hasg s{left:13px}',
      '#amenti-prologue .ap-rl-land{top:28px;color:#c9503f}',
      '#amenti-prologue .ap-rl{position:absolute;left:10px;top:8px;',
      '  color:#ffd166;font-size:9.5px;letter-spacing:.05em;',
      '  background:rgba(5,8,14,.74);padding:3px 9px;border-radius:2px;',
      '  pointer-events:none;display:flex;align-items:center;gap:7px}',
      '#amenti-prologue .ap-rl span{width:16px;height:0;',
      '  border-top:1.5px dashed #ffd166;display:inline-block}',
      '#amenti-prologue .ap-legend{position:absolute;left:50%;',
      '  top:calc(28px + var(--ap-band));',
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

  function loadRegion() {
    if (region) { return Promise.resolve(); }
    return fetch(RAW + 'REGION-PLACES.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) { region = t ? parse(t) : []; harvest(); })
      .catch(function () { region = []; });
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

  function mount() {
    var host = document.getElementById('amenti-attica');
    if (!host || el) { return !!el; }
    style();
    el = document.createElement('div');
    el.id = 'amenti-prologue';
    el.innerHTML =
      '<div class="ap-sc"></div><div class="ap-veil"></div>' +
      '<div class="ap-big"></div><div class="ap-hint"></div>' +
      '<div class="ap-map"><img alt=""><div class="ap-off"></div></div>' +
      '<div class="ap-legend"></div>' +
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
    el.addEventListener('click', function (e) {
      /* while bare, ANY click brings everything back — there is nothing else
         on the screen to click, and a reader should not have to find a target */
      if (el.classList.contains('ap-bare')) {
        el.classList.remove('ap-bare');
        el.querySelector('.ap-hint').textContent = '';
        return;
      }
      if (e.target.closest('.ap-map,.ap-tx,.ap-nav,.ap-dots')) { return; }
      el.classList.add('ap-bare');
      el.querySelector('.ap-hint').textContent = 'click anywhere to come back';
    });
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
      if (n.tagName !== 'IMG' && !n.classList.contains('ap-off')) { n.remove(); }
    });

    /* the room first, underneath everything */
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

    var legend = [], off = [];
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
      if (gk) { m.classList.add('ap-hasg'); }
      if (what) { m.title = name + ' \u2014 ' + what; legend.push([name, what, gk]); }
      box.appendChild(m);
    });

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
    drawRoute(s.route, s.route_label, 'sea');
    drawRoute(s.route_land, s.route_land_label, 'land');

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
      function drawRoute(spec, label, kind) {
      if (!spec) { return; }
      var pts = spec.split('>').map(function (q) {
        var c = q.split('|'); return rproj(parseFloat(c[0]), parseFloat(c[1]));
      }).filter(function (q) { return !isNaN(q.x); });
      if (pts.length < 2) { return; }
      if (kind === 'sea') {
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
      pa.setAttribute('stroke-width', kind === 'land' ? '1.1' : '1.4');
      pa.setAttribute('stroke-dasharray', kind === 'land' ? '1.5 2.6' : '4 2.6');
      pa.setAttribute('vector-effect', 'non-scaling-stroke');
      pa.setAttribute('opacity', kind === 'land' ? '.8' : '.92');
      sv.appendChild(pa);
      var p1 = pts[pts.length - 2], p2 = pts[pts.length - 1];
      var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      var hd = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hd.setAttribute('d', 'M0,0 L-2.6,1.3 L-2.6,-1.3 Z');
      hd.setAttribute('fill', hue);
      hd.setAttribute('transform', 'translate(' + p2.x.toFixed(2) + ' ' +
                      p2.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
      sv.appendChild(hd);
      box.appendChild(sv);
      if (label) {
        var lb = document.createElement('div');
        lb.className = 'ap-rl ap-rl-' + kind;
        lb.innerHTML = '<span style="border-color:' + hue + '"></span>' + esc(label);
        box.appendChild(lb);
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

    var kb = el.querySelector('.ap-legend');
    kb.innerHTML = legend.map(function (L) {
      return '<div>' + (L[2] ? '<u class="ap-g ap-g-' + L[2] +
             '" style="position:static;transform:none;font-size:10px">' +
             GL[L[2]] + '</u> ' : '') + '<b>' + esc(L[0]) + '</b> \u00b7 ' +
             esc(L[1]) + '</div>';
    }).join('');

    el.querySelector('.ap-off').innerHTML = off.length
      ? esc(off.join(' · ')) : '';
  }

  /* the back story ends and the ground begins \u2014 6.96 to 6.97, which is the
     seam the register was cut at */
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
      Promise.all([loadRegion(), loadSpeeches()]).then(function () { show(0); });
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

  window.AmentiPrologue = {
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
