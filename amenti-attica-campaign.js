/* ============================================================================
   amenti-attica-campaign.js  →  Amenti.live/amenti-attica-campaign.js
   ----------------------------------------------------------------------------
   THE CAMPAIGN · step one of three · the sequence, without motion

   Ten legs of the Marathon campaign, in the order Herodotus put them, stepped
   through one at a time. NOTHING MOVES YET. That is deliberate and it is the
   whole point of building this step on its own:

   > IF THE SEQUENCE DOES NOT READ WITHOUT MOTION, MOTION WILL NOT SAVE IT.

   ── THE CLOCK IS IN THE REGISTER ─────────────────────────────────────────
   All ten legs are dated -490 and THE YEAR SCRUB CANNOT SEPARATE THEM. That
   looked like a blocker and is not: the `chapter` column holds 6.97 through
   6.116, which is the order the witness put them in. Not authored, not
   inferred, not a guess about months.

   AND TWO PAIRS SHARE A CHAPTER. 6.115 is the Persians re-embarking while the
   fleet rounds Sunion; 6.116 is the army marching back while the fleet turns
   away. THOSE ARE NOT COLLISIONS TO RESOLVE \u2014 THEY ARE THE RACE, and they are
   shown together because the passage says they happened together.

   ── WHAT IT DRAWS AND WHAT IT REFUSES ────────────────────────────────────
   A leg is two points and a break-line between them. THE ZIGZAG IS NOT
   DECORATION: a bow was drawn on this surface once and replaced, because a bow
   looks like a plausible route. The break symbol says `these two points, and
   nothing between them`, which is exactly what the register holds.

   It draws the seven ships at 6.115, because seven is a number the passage
   gives. IT DRAWS NO OTHER NUMBER. Not how many ships in the fleet, not how
   many men in the line, not where anything was on the water. The register's
   own header states this and the layer obeys it.

   ── AND IT IS A SHEET OVER THE GROUND ────────────────────────────────────
   It draws above the marks and touches no register. Same contract as the cue
   pane: the layer underneath is checkable, this one is expressive, and if this
   is wrong nothing checkable is wrong.

   ── IT BORROWS AND GIVES BACK ────────────────────────────────────────────
   The tour learned this on 9 September: a module that takes the reader's
   switches and does not return them describes a healthy register behind an
   empty screen. This sets the frame and the period it needs, and puts them
   back when it closes.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var legs = null, err = null;
  var el = null, svg = null, step = -1, borrowed = null;

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

  /* ── THE ORDERING KEY ────────────────────────────────────────────────────
     `6.100 \u2014 6.101` is a span and sorts on its first number. A row with no
     parsable chapter RUNS LAST AND SAYS SO rather than being given a position
     in the sequence that nobody chose for it. */
  function chapterOf(row) {
    var m = String(row.chapter || '').match(/(\d+)\.(\d+)/);
    return m ? +m[1] * 1000 + +m[2] : null;
  }

  function load() {
    if (legs || err) { return Promise.resolve(); }
    return fetch(RAW + 'ATTICA-MOVES.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { err = 'ATTICA-MOVES.csv could not be read'; return; }
        var rows = parse(t).filter(function (r) { return r.from_lat && r.to_lat; });
        rows.forEach(function (r) { r._ch = chapterOf(r); });
        var known = rows.filter(function (r) { return r._ch !== null; })
                        .sort(function (a, b) { return a._ch - b._ch; });
        var unknown = rows.filter(function (r) { return r._ch === null; });
        /* group by chapter: a group is ONE STEP, and a group of two is
           two things happening at once */
        var groups = [], last = null;
        known.forEach(function (r) {
          if (last && last.ch === r._ch) { last.rows.push(r); return; }
          last = { ch: r._ch, label: r.chapter, rows: [r] };
          groups.push(last);
        });
        if (unknown.length) {
          groups.push({ ch: null, label: 'unplaced', rows: unknown, unplaced: true });
        }
        legs = groups;
      })
      .catch(function (e) { err = e.message; });
  }

  /* ── THE BREAK-LINE ──────────────────────────────────────────────────────
     Four segments with the middle two offset perpendicular to the run. It is
     the drafting symbol for `something omitted here`, and that is the claim:
     a departure, an arrival, and no assertion about the water between. */
  function zig(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var a = 6;
    var p = [[x1, y1]];
    [0.42, 0.5, 0.58].forEach(function (t, i) {
      var s = (i === 1) ? 0 : (i === 0 ? a : -a);
      p.push([x1 + dx * t + nx * s, y1 + dy * t + ny * s]);
    });
    p.push([x2, y2]);
    return p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
  }

  /* ── THE SURFACE OWNS THE PROJECTION AND THE CAMERA ─────────────────────
     Both are borrowed. Re-deriving the projection here would agree with the
     surface until the day a frame changed, and then disagree by a few pixels
     for ever with nothing to show it.

     And the drawing goes INSIDE `.at-view`, the group the camera transform is
     written to, so it pans and zooms with the ground and carries no transform
     of its own. A sheet that had to be told where the camera was would be one
     more thing to keep in step. */
  function project(lat, lon) {
    var A = window.AmentiAttica;
    return (A && A.proj) ? A.proj(+lat, +lon) : null;
  }
  /* ── A MARK DOES NOT GET BIGGER · 10 Sep 2026 ───────────────────────────
     THE FIRST RUN OF THE TRAVEL DREW ONE LARGE BLOB. The marks live inside
     `.at-view`, which carries the camera's `scale(K)` — so at ×3 they were
     three times the size and had merged into each other.

     The surface has obeyed this rule since it was written: every pin is
     counter-scaled by 1/K, and a LABEL is the stated exception because a label
     is text to read rather than a claim about the world. A fleet mark is a
     claim about a position, so it takes the rule.

     The scatter takes it too. The spread here is not an assertion of extent —
     it exists so a force reads as many rather than as one — so it should hold
     its size on the screen, not on the ground.

     K is read from the transform the surface already writes, rather than asked
     for, so there is nothing new to keep in step. */
  function zoom() {
    var pl = plane();
    if (!pl) { return 1; }
    var m = String(pl.getAttribute('transform') || '').match(/scale\(([\d.]+)\)/);
    return m ? (+m[1] || 1) : 1;
  }

  function plane() {
    var A = window.AmentiAttica;
    return (A && A.plane) ? A.plane() : null;
  }

  /* ── THE CLUSTER IS A TOKEN AND NOT A COUNT · 10 Sep 2026 ───────────────
     Herodotus gives SIX HUNDRED TRIREMES at 6.95 — and that is the fleet
     sailing from Ionia, before Delos, before the islands, before hostages and
     garrisons and Eretria. NOTHING IN THE PASSAGE SAYS SIX HUNDRED WERE AT
     MARATHON.

     So the marks are a token. Enough to read as a fleet rather than a boat,
     the same number on every fleet leg, AND THE NUMBER MEANS NOTHING. The
     count Herodotus gives is spoken in the caption, where it can carry the
     qualification a picture cannot.

     THE ONE EXCEPTION IS SEVEN. `count` on a row is a number the passage
     itself gives — seven ships taken at the water's edge — and seven is small
     enough to draw as seven individuals truthfully. That is the whole of the
     numeric licence and the register's own header says so.

     AND THE SCATTER IS SET BY THE WATER. A cluster bunched in a harbour and
     spread in open sea would be a claim about formation, which the sources
     give almost nowhere. The spread here is fixed per kind and DOES NOT
     ANIMATE — a cluster that tightens entering a strait is drawing a manoeuvre
     nobody recorded, which is the same rule amenti-attica-cues.js keeps for
     its own spreads and says why. */
  var TOKEN  = { fleet: 400, army: 120, flight: 300 };
  /* ── THE FIELD WAS FIVE PIXELS WIDE · 10 Sep 2026 ────────────────────────
     Four hundred marks were drawn into a spread of 5.5 units — half a square
     unit each — and read as ONE DOT WITH A FEW BEHIND IT. The count was right
     and the room was not.

     One viewBox unit is 320 metres on this frame. Twenty-two units is about
     seven kilometres of water, which is the width a fleet of that order
     occupies and it gives each mark room to be seen as itself.

     THE SPREAD IS IN GROUND UNITS AND DOES NOT COUNTER-SCALE. The marks do,
     because a mark is a claim about a position. The field does not, because
     seven kilometres of water is seven kilometres at any zoom — and a field
     that held its screen size would be claiming a different stretch of sea
     every time the reader zoomed. */
  var SPREAD = { fleet: 11, army: 5, flight: 12 };
  /* ── THE WATER SETS THE SHAPE, AND THIS WATER IS A CHANNEL · 10 Sep ──────
     Three versions of this and each was wrong in a different way. First a
     column strung down 42% of the lane — GALLEYS DO NOT DO THAT IN OPEN SEA.
     Then a body 22 km broad — WHICH SPILLED ONTO EUBOEA AND OVER THE ATTIC
     COAST, because the Euboean channel is nothing like 22 km wide.

     Both were the same fault: a constant where the design always said the
     water decides. A fleet is broad in open sea AND NARROW IN A STRAIT, and
     the whole Marathon run is a strait — down the channel inside Euboea and
     across to the bay. So it is narrow here, and it hugs the lane.

     THIS IS STILL A CONSTANT AND STILL NOT THE WATER. Doing it properly wants
     the coastline the surface already draws, measured across the lane at every
     point, and this layer does not have it. What is here is a number chosen to
     fit the narrowest water on this campaign, and the next frame will need it
     chosen again — which is the honest state and is written down rather than
     hidden in a good-looking default. */
  var TRAIL  = { fleet: 0.50, army: 0.40, flight: 0.44 };
  /* ── MOORED, IN ROWS · 10 Sep 2026 ───────────────────────────────────────
     THE TEXT SAYS `MOORED` AND SAYS NOTHING ELSE. Herodotus 6.107: `as the
     ships came in to shore at Marathon, he moored them there, and after the
     Barbarians had come from their ships to land, he was engaged in disposing
     them in their places`. Moored — not beached, not drawn up.

     Rows are a rendering of that word and not a recorded formation. What the
     rows are FAITHFUL to is the geometry: ships at a shore lie along it rather
     than in a heap offshore, and they lie facing out. WHAT THEY ARE NOT is a
     claim that anyone arranged them for a fast departure.

     Though the departure was fast. At 6.115 the Barbarians `pushed off from
     land` and the Athenians took seven at the water's edge — so the outcome
     records a quick re-embarkation even where the arrangement does not. */
  var ROWS = { fleet: 8, flight: 6 };

  /* ── THE EIGHT FURLONGS · 10 Sep 2026 ────────────────────────────────────
     Herodotus 6.112: `the space between the armies was not less than eight
     furlongs`, and the Athenians ran it. IT IS A FLOOR, NOT A MEASUREMENT —
     `not less than` — and Macaulay has quietly converted: the Greek is stades
     at about 178 m and a furlong is 201, so the same eight units is 1,420 m or
     1,610 m depending which you take.

     IT IS DRAWN AS A SCALE AND NOT AS A CONNECTOR. The passage gives a
     distance, not two positions, and the register holds only one of the two
     armies' ground. A line between them would be inventing where each stood.
     So the bar lies on the plain, anchored at Marathon and running inland,
     and it measures rather than joins.

     AND THE GROUND CANNOT CHECK IT. The register's Marathon is the DEME — the
     town — and the Persians were on the beach east of it; the Herakleion is
     2.86 km from that point, which is not a disagreement with 1.4 km because
     it is not the same two things. Nothing here claims the figure is
     confirmed. */
  var FURLONGS = 4.4;              /* 8 stades in viewBox units, 320 m each */
  var MARATHON = { lat: 38.14655, lon: 23.97015 };
  /* the sanctuary the Athenians were drawn up in — 6.108, `the sacred enclosure
     of Heracles`, and it is in ATTICA.csv by name */
  var HERAKLEION = { lat: 38.12131, lon: 23.97614 };
  /* ── THE SAME SIZE AS A PLACE PIN · 10 Sep 2026 ──────────────────────────
     `0.85 * iv` was picked by eye and was less than half a pin. THE SURFACE
     DRAWS EVERY PLACE AT `1.9 * iv` — read out of amenti-attica.js rather than
     matched by eye, because two numbers meaning `the size of a mark` will
     drift apart the first time one of them is tuned.

     A fleet mark is slightly under a place pin on purpose: a place is a
     standing claim and a ship is a token in a field of four hundred. Close
     enough to read as the same kind of thing, small enough not to shout over
     the ground. */
  var PIN    = 1.9;
  var DOT    = { fleet: PIN * 0.8, army: PIN * 0.55, flight: PIN * 0.8 };

  /* ── LETTERS, NOT DOTS · 10 Sep 2026 ─────────────────────────────────────
     x for the Persians, o for the Athenians, p for the Plataians.

     A LETTER NEEDS ROOM A DOT DOES NOT. A place pin is 1.9 units and a glyph
     is illegible below about three, so these are drawn at 3.4 — nearly twice a
     pin. In open water that is fine, because a force strung along 42% of a
     long lane has space to spare. IN THE MOORAGE IT OVERLAPS HEAVILY and that
     is left alone: four hundred ships in a five-kilometre bay is a solid band
     whatever glyph is drawn, and a texture of overlapping x is a truer picture
     of it than four hundred separated marks would be.

     THE MAP ALREADY DRAWS X FOR `worked` — the mines and quarries, and Laureion
     is a field of them in the same frame. So the campaign turns that switch
     off while it runs and gives it back on close, the same borrow it already
     makes for the period and the moves. TWO THINGS MEANING DIFFERENT THINGS
     WITH THE SAME MARK IS THE ONE COLLISION A MAP CANNOT TALK ITS WAY OUT OF. */
  /* ── TRIANGLES, AND SMALL ENOUGH TO SEE WATER · 10 Sep 2026 ──────────────
     The glyphs at 3.4 covered FIVE TIMES the area available to them, and the
     fleet drew as one solid mass with no sea in it. A field with no gaps is
     not a fleet, it is a stain.

     Measured: 400 marks in a field ±11 units across and half a lane long get
     about five square units each. A triangle 1.2 across covers a fifth of that
     — water showing between ships — and ±11 units is 7 km, inside the channel
     rather than lying over Euboea.

     A TRIANGLE, NOT A LETTER. It reads at 1.2 units where a letter needs
     three, it has a bow so it can point down the lane, and it does not collide
     with the X the map already draws for mines. */
  var SIZE   = { fleet: 1.2, army: 1.0, flight: 1.2 };
  var HUE    = { fleet: '#c9503f', army: '#c9d6a8', flight: '#e0913f' };
  var LEG_MS = 2600;          /* the same for every leg: see travel() */

  var COLOUR = {
    unopposed: '#7fd8f0', taken: '#e0913f', landed: '#e0913f',
    arrived: '#8fd08f', lost: '#d05f5f', sailing: '#7fd8f0', withdrew: '#5d6e84'
  };

  /* ── A POINT ALONG THE BREAK-LINE ───────────────────────────────────────
     Marks travel the ZIGZAG, not a straight line and not a curve. A bow was
     drawn on this surface once and replaced because A BOW LOOKS LIKE A
     PLAUSIBLE ROUTE; a straight line is the same claim with less confidence.
     The break symbol says `these two points and nothing between them`, and
     marks moving along it inherit that — no fleet ever sailed a zigzag, so
     nobody reads it as a course. */
  function along(pts, t) {
    var seg = [], total = 0, i;
    for (i = 0; i < pts.length - 1; i++) {
      var d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(d); total += d;
    }
    var want = total * Math.max(0, Math.min(1, t)), run = 0;
    for (i = 0; i < seg.length; i++) {
      if (run + seg[i] >= want) {
        var u = seg[i] ? (want - run) / seg[i] : 0;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u,
                pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
      }
      run += seg[i];
    }
    return pts[pts.length - 1];
  }
  function points(x1, y1, x2, y2) {
    return zig(x1, y1, x2, y2).split(' ').map(function (p) {
      var q = p.split(','); return [+q[0], +q[1]];
    });
  }

  /* ── A FIELD, NOT A CLUSTER · 10 Sep 2026 ────────────────────────────────
     Fourteen marks read as one blob and moved as one thing. FOUR HUNDRED READ
     AS A FLEET.

     THE NUMBER IS STILL NOT A COUNT. Herodotus gives six hundred triremes at
     6.95 sailing from Ionia, before Delos and the islands and Eretria, and
     nothing says how many were at Marathon. Four hundred is chosen to look
     like what it was — water crowded with ships — and the caption carries the
     number the passage actually gives, where it can be qualified.

     Each mark holds a LAG along the lane and a small offset across it. The lag
     strings the force out so the van is arriving while the rear has not left;
     the offset is lateral only, so the field follows the lane rather than
     smearing around it. Both are fixed per mark: nothing shimmers, and NOTHING
     ABOUT THE SHAPE CHANGES WHILE IT MOVES, which would be drawing a
     manoeuvre. */
  function field(n, spread, trail, seed) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var u = (i + 0.5) / n;
      /* a low-discrepancy sequence, so the field is even without being a grid */
      var j = ((i * 0.7548776662 + seed * 0.113) % 1);
      var k = ((i * 0.5698402909 + seed * 0.317) % 1);
      out.push({
        lag: trail * (0.15 + 0.85 * u),
        across: (j - 0.5) * 2 * spread,
        along: (k - 0.5) * spread * 0.9
      });
    }
    return out;
  }

  /* the unit vectors of the lane at a given point, so `across` means across */
  function frame(pts, t) {
    var e = Math.min(0.999, Math.max(0.001, t));
    var p = along(pts, e), q = along(pts, Math.min(1, e + 0.01));
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
    return { p: p, tx: dx / L, ty: dy / L, nx: -dy / L, ny: dx / L };
  }

  function draw() {
    if (!svg || !legs) { return; }
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    moving = [];
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    if (step < 0 || step >= legs.length) { return; }
    var g = legs[step];

    g.rows.forEach(function (r) {
      var a = project(r.from_lat, r.from_lon), b = project(r.to_lat, r.to_lon);
      if (!a || !b) { return; }
      var col = COLOUR[r.outcome] || '#7d8ea6';

      var line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('points', zig(a.x, a.y, b.x, b.y));
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', col);
      line.setAttribute('stroke-width', (1.2 / zoom()).toFixed(2));
      line.setAttribute('opacity', '.85');
      svg.appendChild(line);

      var z = 1 / zoom();
      [[a, 2.2], [b, 3.2]].forEach(function (p) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p[0].x); c.setAttribute('cy', p[0].y);
        c.setAttribute('r', (p[1] * z).toFixed(2));
        c.setAttribute('fill', col);
        svg.appendChild(c);
      });

      /* SEVEN, BECAUSE THE PASSAGE SAYS SEVEN. The only number in ten rows,
         and the only one this layer may draw. */
      var n = parseInt(r.count, 10);
      if (n > 0 && n < 40) {
        for (var i = 0; i < n; i++) {
          var ang = (i / n) * Math.PI * 2;
          var m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          var zz = 1 / zoom();
          m.setAttribute('cx', (b.x + Math.cos(ang) * 9 * zz).toFixed(1));
          m.setAttribute('cy', (b.y + Math.sin(ang) * 9 * zz).toFixed(1));
          m.setAttribute('r', (1.6 * zz).toFixed(2));
          m.setAttribute('fill', '#d05f5f');
          svg.appendChild(m);
        }
      }

      /* the force itself, at the departure, waiting to be told to go */
      var kind = r.kind || 'fleet';
      var host = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      host.setAttribute('class', 'ac-force');
      var iv = 1 / zoom();
      var pts = points(a.x, a.y, b.x, b.y);
      var off = field(TOKEN[kind] || 200, SPREAD[kind] || 12,
                      TRAIL[kind] || 0.35, g.ch % 97);
      /* ── PARTIALLY COUNTER-SCALED · 10 Sep 2026 ─────────────────────────
         FULL counter-scale makes a mark GROW as the ground shrinks. Zoomed
         out, Marathon bay is a few units wide and four hundred marks at full
         screen size became A SOLID RED RECTANGLE — the fleet had arrived and
         the picture said `a block`.

         A pin can afford full counter-scale because there is one of it. A
         field of four hundred cannot: the marks have to give way to each other
         as the ground they sit on gets smaller.

         So iv^0.55. Zoomed out they shrink but stay visible; zoomed in they
         hold enough size to be individual ships. IT IS NOT THE PIN RULE AND
         DOES NOT PRETEND TO BE — a fleet is a texture and a pin is a claim. */
      var sz = (SIZE[kind] || 1.2) * Math.pow(iv, 0.55);
      var tri = 'M0,' + (-sz).toFixed(2) + 'L' + (sz * 0.78).toFixed(2) + ',' +
                (sz * 0.72).toFixed(2) + 'L' + (-sz * 0.78).toFixed(2) + ',' +
                (sz * 0.72).toFixed(2) + 'Z';
      var frag = document.createDocumentFragment();
      off.forEach(function () {
        var m = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        m.setAttribute('d', tri);
        m.setAttribute('fill', HUE[kind] || col);
        m.setAttribute('opacity', '.85');
        frag.appendChild(m);
      });
      host.appendChild(frag);
      svg.appendChild(host);
      /* ── AN ARMY RESTS WHERE THE TEXT PUTS IT · 10 Sep ──────────────────
         The Athenians and the Plataians both arrive at Marathon, and both were
         `drawn up in the sacred enclosure of Heracles`. The register holds the
         Herakleion, so the army marks settle there rather than on the deme
         point the leg was drawn to — A PLACE THE PASSAGE NAMES BEATS A
         COORDINATE THE LEG HAPPENED TO END ON.

         They rest as a block, not a line. Herodotus gives the battle order at
         6.111 — Callimachos on the right, the tribes numbered, the Plataians
         on the left — and that is the ORDER OF BATTLE, not the shape of a camp,
         and this step is the camp. */
      var rec = { g: host, off: off, pts: pts, outcome: r.outcome, iv: iv, kind: kind };
      if (kind === 'army' && /marathon/i.test(r.to_name || '')) {
        var h = project(HERAKLEION.lat, HERAKLEION.lon);
        if (h) { rec.at = h; }
      }
      /* a force that arrives somewhere it stays takes a resting shape; one
         that is leaving does not */
      if (r.outcome !== 'withdrew' && r.outcome !== 'sailing') {
        rec.rest = rec.at ? camp(rec, kind) : moorage(rec, kind);
      }
      moving.push(rec);
    });
    /* a ring on every place this step arrived at and changed */
    g.rows.forEach(function (r) {
      if (['taken', 'landed', 'unopposed'].indexOf(r.outcome) < 0) { return; }
      pulse(project(r.to_lat, r.to_lon),
            r.outcome === 'unopposed' ? '#7fd8f0' : '#d0402f');
    });

    /* the measure appears once the force is on the ground it measures */
    if (g.rows.some(function (r) { return /marathon/i.test(r.to_name || ''); })) {
      furlongs();
    }
    caption(g);
    travel();
  }

  /* ── THE TRAVEL · step two · 10 Sep 2026 ─────────────────────────────────
     EVERY LEG TAKES THE SAME TIME ON SCREEN, whatever its length. The register
     holds no duration and no speed, and giving a long crossing more seconds
     than a short hop would be inventing one. What is being shown is SEQUENCE
     and SIMULTANEITY, not pace — which is what a sequence diagram does, and it
     is honest about it.

     Legs that share a chapter start together and finish together, because that
     is what sharing a chapter means in this register: the fleet rounding
     Sunion while the army marches back overland.

     AND THE ARRIVAL IS WHERE THE OUTCOME LANDS. `withdrew` leaves the frame.
     `taken` stops and stays. Nothing else changes, because nothing else is in
     the register. */
  var moving = [], raf = null, t0 = 0;

  /* the field's resting shape at the arrival: rows across the approach, so the
     force lies along the shore it came to rather than piled on the point */
  function moorage(m, kind) {
    var f = frame(m.pts, 0.999);
    /* THE MOORAGE FILLS THE BAY. The first one drew a dense block off the
       point; Marathon is five kilometres of shore and the fleet lay along it. */
    var n = m.off.length, rows = (kind === 'fleet' ? 12 : (ROWS[kind] || 8));
    var per = Math.ceil(n / rows);
    /* ── SIZED TO THE BAY, NOT TO THE MARKS · 10 Sep 2026 ─────────────────
       The first moorage put fifty ships to a row at a spacing that came out
       FORTY-NINE KILOMETRES WIDE — wider than Attica. It had been derived from
       the travelling spread, which is a number chosen so marks can be told
       apart, and that is not a measurement of anything.

       One viewBox unit is 320 metres on this frame. Marathon bay is about five
       kilometres of usable beach, so the whole moorage is FIFTEEN UNITS and
       four hundred ships in it sit a hundred metres apart.

       WHICH MEANS THE MARKS OVERLAP AT EVERY ZOOM BELOW ABOUT x5, AND THAT IS
       THE PICTURE. Four hundred ships in five kilometres is a solid band, and
       a rendering that spaced them out so each could be seen would be drawing
       a fleet four times the size of the bay it moored in. The density is the
       truthful part. */
    var BAY = 15.6;                            /* 5 km, in viewBox units */
    /* 8 rows about 100 m apart is 800 m of water off the beach — deep enough
       to hold four hundred hulls, shallow enough not to be a claim about a
       fleet anchored a kilometre out */
    var gapA = 0.9;                            /* one row behind another, ~290 m */
    var gapB = BAY / Math.max(1, per - 1);     /* along the shore, edge to edge */
    return m.off.map(function (o, i) {
      var row = Math.floor(i / per), col = i % per;
      /* a little jitter, fixed per ship: MOORED IS NOT PARKED, and a perfect
         lattice would be a claim about discipline nobody recorded */
      var j1 = ((i * 0.7548776662) % 1) - 0.5;
      var j2 = ((i * 0.5698402909) % 1) - 0.5;
      var da = -(row - (rows - 1) / 2) * gapA + j1 * gapA * 0.4;
      var db = (col - (per - 1) / 2) * gapB + j2 * gapB * 0.5;
      return [f.p[0] + f.tx * da + f.nx * db,
              f.p[1] + f.ty * da + f.ny * db];
    });
  }

  /* a camp is a mass with a little room in it, not a formation */
  function camp(m, kind) {
    var c = m.at, n = m.off.length;
    var r = (SPREAD[kind] || 9) * 0.55;
    return m.off.map(function (o, i) {
      var a = (i * 2.399963) % (Math.PI * 2);
      var d = r * Math.sqrt((i + 0.5) / n);
      var j = ((i * 0.7548776662) % 1) - 0.5;
      return [c.x + Math.cos(a) * d + j * r * 0.18,
              c.y + Math.sin(a) * d * 0.75 + j * r * 0.18];
    });
  }

  /* ── WHAT WAS TAKEN, AND WHERE THEY LANDED · 10 Sep 2026 ────────────────
     A ring at the arrival of any leg that ended in something happening to the
     place — Naxos and Karystos and Eretria reduced, Marathon landed on. It
     pulses, because a place that has just been taken is not the same as a
     place on a register, and the eye should go there.

     IT MARKS THE ARRIVAL AND NOT THE EVENT. The register says a leg ended
     `taken` and the ring says the leg ended there; what was done is in the
     caption, where the passage's own words are. A ring cannot say `plundered,
     the temples burned in retribution for Sardis, the people enslaved on
     Darius's orders` — 6.101 can, and does. */
  function pulse(p, hue) {
    if (!p || !svg) { return; }
    var z = 1 / zoom();
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'ac-pulse');
    g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    [0, 1].forEach(function (i) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', ((i ? 7.5 : 3.4) * z).toFixed(2));
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', hue);
      c.setAttribute('stroke-width', ((i ? 0.7 : 1.1) * z).toFixed(2));
      c.setAttribute('class', i ? 'ac-ring2' : 'ac-ring1');
      g.appendChild(c);
    });
    svg.appendChild(g);
  }

  /* the measure on the plain — a bar, and its name */
  function furlongs() {
    var p = project(MARATHON.lat, MARATHON.lon);
    if (!p || !svg) { return; }
    var z = 1 / zoom();
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'ac-scale');
    var y0 = p.y + 2, y1 = p.y + 2 + FURLONGS;
    var bar = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bar.setAttribute('d',
      'M' + (p.x - 1.6 * z) + ' ' + y0 + 'h' + (3.2 * z) +
      'M' + p.x + ' ' + y0 + 'V' + y1 +
      'M' + (p.x - 1.6 * z) + ' ' + y1 + 'h' + (3.2 * z));
    bar.setAttribute('fill', 'none');
    bar.setAttribute('stroke', '#c9d6a8');
    bar.setAttribute('stroke-width', (0.9 * z).toFixed(2));
    bar.setAttribute('opacity', '.7');
    g.appendChild(bar);
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', (p.x + 3 * z).toFixed(1));
    t.setAttribute('y', ((y0 + y1) / 2).toFixed(1));
    t.setAttribute('fill', '#c9d6a8');
    t.setAttribute('opacity', '.65');
    t.setAttribute('font-size', (5.5 * z).toFixed(2));
    t.setAttribute('font-family', 'ui-monospace,Menlo,monospace');
    t.textContent = 'marathon';
    g.appendChild(t);
    svg.appendChild(g);
  }

  function travel() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (!moving.length) { return; }
    t0 = 0;
    var tick = function (now) {
      if (!t0) { t0 = now; }
      /* the trail means the rear is still moving after the van has arrived, so
         the leg runs longer than the head's own crossing */
      var t = Math.min(1, (now - t0) / (LEG_MS * 1.6));
      /* eased at both ends: a force does not start and stop instantly, and
         easing asserts nothing about the water in between */
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      moving.forEach(function (m) {
        var kids = m.g.childNodes;
        for (var i = 0; i < kids.length; i++) {
          var o = m.off[i];
          /* the van leads by its lag; the rear has not left until the head is
             well down the lane */
          /* ── AND THE COLUMN MUST NOT COLLAPSE AT EITHER END ──────────────
             `e * (1 + lag) - lag` puts every mark at 0 when e is 0 and at 1
             when e is 1, so the force STACKED AT THE DEPARTURE AND STACKED
             AGAIN AT THE ARRIVAL and was a column only in between. A fleet
             does not arrive on a single point.

             A plain subtraction keeps the interval: the van reaches the
             arrival while the rear is still a third of the lane behind, and
             the run is long enough that everyone gets there. */
          var f = frame(m.pts, e * (1 + (TRAIL[m.kind] || 0.35)) - o.lag);
          var px = f.p[0] + f.nx * o.across + f.tx * o.along;
          var py = f.p[1] + f.ny * o.across + f.ty * o.along;
          var deg = Math.atan2(f.ty, f.tx) * 180 / Math.PI + 90;
          kids[i].setAttribute('transform',
            'translate(' + px.toFixed(2) + ' ' + py.toFixed(2) + ') rotate(' + deg.toFixed(1) + ')');
        }
        /* ── AND THEN THEY MOOR ────────────────────────────────────────────
           The last fifth of the run eases the field out of its column and into
           its rows, so the arrival is a change of shape rather than a stop.
           It is the one place the shape is allowed to change, because coming
           to a shore IS a change of shape and the passage names it. */
        if (t > 0.8 && m.rest) {
          var u = (t - 0.8) / 0.2, w = u * u * (3 - 2 * u);
          for (var k = 0; k < kids.length; k++) {
            var tr = String(kids[k].getAttribute('transform') || '');
            var mm = tr.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/);
            if (!mm) { continue; }
            var cx = +mm[1], cy = +mm[2];
            kids[k].setAttribute('transform',
              'translate(' + (cx + (m.rest[k][0] - cx) * w).toFixed(2) + ' ' +
              (cy + (m.rest[k][1] - cy) * w).toFixed(2) + ') rotate(' + mm[3] + ')');
          }
        }
        if (t >= 1 && m.outcome === 'withdrew') {
          m.g.setAttribute('opacity', '0');
          m.g.setAttribute('style', 'transition:opacity 1.1s');
        }
      });
      if (t < 1) { raf = requestAnimationFrame(tick); }
      else { raf = null; }
    };
    raf = requestAnimationFrame(tick);
  }

  function caption(g) {
    var c = el.querySelector('.ac-cap');
    if (!c) { return; }
    var rows = g.rows.map(function (r) {
      return '<div class="ac-leg"><b>' + esc(r.name) + '</b>' +
        '<span class="ac-out">' + esc(r.outcome) +
        (r.count ? ' \u00b7 ' + esc(r.count) : '') + '</span>' +
        '<div class="ac-says">' + esc(r.says || r.note || '') + '</div></div>';
    }).join('');
    c.innerHTML =
      '<div class="ac-ch">' + esc(g.label) +
      (g.rows.length > 1 ? ' \u00b7 <b>at the same time</b>' : '') +
      (g.unplaced ? ' \u00b7 no chapter on this row, so it runs last' : '') +
      '</div>' + rows +
      '<div class="ac-step">' + (step + 1) + ' of ' + legs.length + '</div>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function style() {
    if (document.getElementById('campaign-css')) { return; }
    var s = document.createElement('style');
    s.id = 'campaign-css';
    s.textContent = [
      '#amenti-campaign{position:absolute;inset:0;pointer-events:none;z-index:6}',
      '@keyframes ac-beat{0%,100%{opacity:.85}50%{opacity:.16}}',
      '@keyframes ac-beat2{0%{opacity:.5;transform:scale(.55)}',
      '  70%{opacity:0;transform:scale(1.25)}100%{opacity:0;transform:scale(1.25)}}',
      '#amenti-attica .ac-ring1{animation:ac-beat 1.5s ease-in-out infinite}',
      '#amenti-attica .ac-ring2{animation:ac-beat2 1.5s ease-out infinite;',
      '  transform-box:fill-box;transform-origin:center}',
      /* ── THE REGISTER'S OWN MOVES DIM, THEY DO NOT GO · 10 Sep ────────────
         Turning every switch on turns on the `moves` layer, which draws all
         ten legs at once — and the campaign's step was lost inside its own
         register drawn whole. SWITCHING IT OFF WOULD BE WORSE: the ten legs
         are the shape of the campaign, and a reader stepping through them
         should see where this step sits in the whole.

         AND THE FIRST RULE WAS WRITTEN AGAINST THE GROUP AND DID NOTHING.
         Each leg carries an inline `style="opacity:..."`, computed per leg
         from the year scrub, and an inline style beats a class rule on the
         parent. So this reaches the legs themselves and takes `!important` —
         which is not a preference here, it is the only thing that beats an
         inline value. It is scoped to a class this file adds and removes. */
      '#amenti-attica.ac-dim-moves .at-mvg{opacity:.1 !important;transition:opacity .3s}',
      '#amenti-attica.ac-dim-moves .at-mvg:hover{opacity:.55 !important}',
      /* ── MEASURED, NOT ASSUMED · 10 Sep ──────────────────────────────
         `bottom:96px` was a guess and it landed the caption on the note and
         the year scrub. FOUR COLLISIONS WERE FIXED ON THIS SURFACE ON 9
         SEPTEMBER AND EVERY ONE WAS A FIXED PROPORTION USED WHERE THE SPACE
         HAD TO BE MEASURED. The floor is computed in place() from whatever is
         actually down there. */
      '#amenti-campaign .ac-cap{position:absolute;left:50%;transform:translateX(-50%);',
      '  width:min(560px,80%);pointer-events:auto;',
      '  background:rgba(5,8,14,.92);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:4px;padding:10px 13px;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#c3d3e6}',
      '#amenti-campaign .ac-ch{color:#5d6e84;letter-spacing:.06em;font-size:9.5px;',
      '  margin-bottom:6px}',
      '#amenti-campaign .ac-ch b{color:#e0913f;font-weight:400}',
      '#amenti-campaign .ac-leg{margin-bottom:5px}',
      '#amenti-campaign .ac-out{color:#5d6e84;margin-left:.6em;font-size:9.5px;',
      '  text-transform:uppercase;letter-spacing:.05em}',
      '#amenti-campaign .ac-says{color:#7d8ea6;font-size:10px;margin-top:1px}',
      '#amenti-campaign .ac-step{color:#4d5c70;font-size:9px;margin-top:7px;',
      '  padding-top:5px;border-top:1px solid rgba(43,58,80,.4)}',
      '#amenti-campaign .ac-nav{position:absolute;left:50%;transform:translateX(-50%);',
      '  pointer-events:auto;display:flex;gap:6px}',
      '#amenti-campaign .ac-nav button{background:rgba(5,8,14,.9);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:3px;color:#7d8ea6;',
      '  padding:3px 11px;cursor:pointer;font:inherit;letter-spacing:.05em}',
      '#amenti-campaign .ac-nav button:hover{color:#dbe8f5;border-color:#4b647d}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function mount() {
    var host = document.getElementById('amenti-attica');
    if (!host) { return false; }
    if (el) { return true; }
    style();
    el = document.createElement('div');
    el.id = 'amenti-campaign';
    el.innerHTML =
      '<div class="ac-cap"></div>' +
      '<div class="ac-nav">' +
      '<button type="button" data-go="-1">\u25c0 back</button>' +
      '<button type="button" data-go="1">next \u25b6</button>' +
      '<button type="button" data-go="x">close</button>' +
      '</div>';
    host.appendChild(el);
    var pl = plane();
    if (!pl) { return false; }
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.setAttribute('class', 'ac-layer');
    pl.appendChild(svg);
    el.querySelectorAll('.ac-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-go');
        if (g === 'x') { stop(); return; }
        step = Math.max(0, Math.min(legs.length - 1, step + (+g)));
        draw();
      });
    });
    place();
    window.addEventListener('resize', place);
    return true;
  }

  /* THE FLOOR IS WHAT IS ALREADY DOWN THERE. The note, the clock and the
     period buttons all live at the bottom of this surface; the caption sits
     above the highest of them, measured from the host's own box. */
  function place() {
    if (!el) { return; }
    var host = document.getElementById('amenti-attica');
    if (!host) { return; }
    var hb = host.getBoundingClientRect(), floor = 12;
    ['.at-note', '.at-clock', '.at-ctl'].forEach(function (sel) {
      var n = host.querySelector(sel);
      if (!n) { return; }
      var b = n.getBoundingClientRect();
      if (b.height) { floor = Math.max(floor, hb.bottom - b.top + 10); }
    });
    var nav = el.querySelector('.ac-nav'), cap = el.querySelector('.ac-cap');
    if (nav) { nav.style.bottom = floor + 'px'; }
    var nh = nav ? nav.getBoundingClientRect().height : 24;
    if (cap) { cap.style.bottom = (floor + nh + 8) + 'px'; }
  }

  /* ── BORROW AND GIVE BACK ───────────────────────────────────────────────
     The campaign needs the Attica frame and a period that contains 490 BC.
     What the reader had is kept and restored on close. */
  function start() {
    return load().then(function () {
      if (err) { console.log('THE CAMPAIGN: ' + err); return; }
      if (!mount()) { console.log('THE CAMPAIGN: the ground is not open.'); return; }
      /* ── BORROWING IS TAKING AND RETURNING, NOT TAKING · 10 Sep ──────────
         THE FIRST RUN OF THIS OPENED ON AN EMPTY SURFACE. `A.marks()` was read
         to remember the reader's switches — and reading it with no argument
         TURNS EVERY SWITCH OFF, because marks() is a setter and an empty call
         means `show nothing`. The note said so plainly, in the sentence written
         for exactly this on 9 September: EVERY PLACE SWITCH IS OFF — 1,539
         places in this period and none drawn.

         The tour learned this same lesson the same week and this file repeated
         it. So: read the switches from the legend, not from the setter.

         AND THE PERIOD WAS WRONG. `arch` is 750–550 BC and the campaign is 490.
         `clas` is 550–330 and contains it. A layer that sets a period which
         excludes its own subject is drawing over a register filtered to the
         wrong centuries. */
      var A = window.AmentiAttica;
      if (A) {
        var host = document.getElementById('amenti-attica');
        var lit = [];
        if (host) {
          /* the legend rows carry data-m, not data-k — checked against the
             markup rather than assumed, because the first guess was wrong and
             would have restored an empty surface */
          host.querySelectorAll('.at-key div[data-m]').forEach(function (b) {
            if (b.getAttribute('aria-pressed') !== 'false') { lit.push(b.getAttribute('data-m')); }
          });
        }
        var per = host && host.querySelector('.at-ctl button[data-p][aria-pressed="true"]');
        /* ── AN EMPTY SURFACE IS NOT A STATE WORTH KEEPING · 10 Sep ────────
           If every switch is already off when this starts — because a previous
           run of this file left them off — remembering `off` as the reader's
           state means the surface CAN NEVER RECOVER ITSELF. One fault becomes
           permanent across every later run. So an empty set is read as `all`,
           which is what the surface opens with. */
        borrowed = { marks: lit.length ? lit.join('|') : '*',
                     period: per ? per.getAttribute('data-p') : null };
        /* AND THE CAMPAIGN NEEDS ITS OWN GROUND VISIBLE. It draws over places,
           and drawing legs across a blank chart shows a fleet sailing over
           nothing. It asks for what it needs and gives back what it took. */
        /* everything except `worked` — its X collides with the Persian glyph,
           and Laureion is a field of them in this same frame */
        if (A.marks) {
          A.marks(['settled', 'sacred', 'built', 'defence', 'harbour', 'games',
                   'buried', 'ground', 'other', 'events', 'moves'].join('|'));
        }
        if (host) { host.classList.add('ac-dim-moves'); }
        if (A.period) { A.period('clas'); }
      }
      step = 0;
      place();
      draw();
    });
  }
  function stop() {
    var h = document.getElementById('amenti-attica');
    if (h) { h.classList.remove('ac-dim-moves'); }
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    if (svg && svg.parentNode) { svg.parentNode.removeChild(svg); }
    el = null; svg = null; step = -1;
    var A = window.AmentiAttica;
    if (A && borrowed) {
      if (A.marks) { A.marks(borrowed.marks || '*'); }
      if (A.period && borrowed.period) { A.period(borrowed.period); }
    }
    borrowed = null;
  }

  window.AmentiCampaign = {
    start: start, stop: stop,
    replay: function () { travel(); },
    step: function (n) { if (legs) { step = Math.max(0, Math.min(legs.length - 1, n)); draw(); } return step; },
    legs: function () { return load().then(function () {
      return err ? { error: err } : legs.map(function (g) {
        return { chapter: g.label, at_once: g.rows.length > 1,
                 rows: g.rows.map(function (r) {
                   return { name: r.name, outcome: r.outcome, count: r.count, says: r.says };
                 }) };
      });
    }); },
    redraw: draw
  };
})();
