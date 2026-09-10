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
  function plane() {
    var A = window.AmentiAttica;
    return (A && A.plane) ? A.plane() : null;
  }

  var COLOUR = {
    unopposed: '#7fd8f0', taken: '#e0913f', landed: '#e0913f',
    arrived: '#8fd08f', lost: '#d05f5f', sailing: '#7fd8f0', withdrew: '#5d6e84'
  };

  function draw() {
    if (!svg || !legs) { return; }
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
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('opacity', '.85');
      svg.appendChild(line);

      [[a, 2.2], [b, 3.2]].forEach(function (p) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p[0].x); c.setAttribute('cy', p[0].y);
        c.setAttribute('r', p[1]);
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
          m.setAttribute('cx', (b.x + Math.cos(ang) * 9).toFixed(1));
          m.setAttribute('cy', (b.y + Math.sin(ang) * 9).toFixed(1));
          m.setAttribute('r', '1.6');
          m.setAttribute('fill', '#d05f5f');
          svg.appendChild(m);
        }
      }
    });
    caption(g);
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
      '#amenti-campaign .ac-cap{position:absolute;left:50%;transform:translateX(-50%);',
      '  bottom:96px;width:min(560px,80%);pointer-events:auto;',
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
      '  bottom:64px;pointer-events:auto;display:flex;gap:6px}',
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
    return true;
  }

  /* ── BORROW AND GIVE BACK ───────────────────────────────────────────────
     The campaign needs the Attica frame and a period that contains 490 BC.
     What the reader had is kept and restored on close. */
  function start() {
    return load().then(function () {
      if (err) { console.log('THE CAMPAIGN: ' + err); return; }
      if (!mount()) { console.log('THE CAMPAIGN: the ground is not open.'); return; }
      var A = window.AmentiAttica;
      if (A) {
        borrowed = { marks: A.marks ? A.marks() : null };
        if (A.period) { A.period('arch'); }
      }
      step = 0;
      draw();
    });
  }
  function stop() {
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    if (svg && svg.parentNode) { svg.parentNode.removeChild(svg); }
    el = null; svg = null; step = -1;
    var A = window.AmentiAttica;
    if (A && borrowed && borrowed.marks && A.marks) { A.marks(borrowed.marks); }
    borrowed = null;
  }

  window.AmentiCampaign = {
    start: start, stop: stop,
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
