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
  var lo = YEAR_MIN, hi = YEAR_MAX;

  var geo = null, world = null, mounted = null;
  var SVG = 'http://www.w3.org/2000/svg';
  var lastShown = 0, lastHidden = 0;

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
      get(RAW + 'WORLD.json', true).then(function (d) { world = d; })
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

      '#amenti-map .mp-foot{display:flex;align-items:center;gap:14px;margin-top:10px;font-size:12px;flex:0 0 auto}',
      '#amenti-map .mp-foot input[type=range]{flex:1;accent-color:#5fd0e8}',
      '#amenti-map .mp-read{color:#dbe4f0;min-width:190px}',
      '#amenti-map .mp-note{color:#6f8098;font-size:11px;margin-top:6px;line-height:1.5;flex:0 0 auto}',
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
          '</div>' +
        '</div>' +
        '<svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">' +
          '<g class="mp-graticule"></g><path class="mp-land"></path>' +
          '<g class="mp-washes"></g><g class="mp-pins"></g>' +
        '</svg>' +
        '<div class="mp-foot">' +
          '<span class="mp-read"></span>' +
          '<input type="range" class="mp-slider" min="-4000" max="' + YEAR_MAX + '" step="10" value="' + YEAR_MAX + '">' +
        '</div>' +
        '<div class="mp-note"></div>' +
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
      (bySeat[k] || (bySeat[k] = { lat: s.lat, lon: s.lon, place: s.place, who: [] })).who.push(s.n);
    });

    var gp = el.querySelector('.mp-pins');
    var live = {};

    Object.keys(bySeat).forEach(function (k) {
      var p = bySeat[k], xy = proj(p.lat, p.lon);
      var r = Math.min(4.2, 1.15 + Math.log(p.who.length + 1) * 0.72);
      var g = gp.querySelector('[data-seat="' + CSS.escape(k) + '"]');
      if (!g) {
        g = document.createElementNS(SVG, 'g');
        g.setAttribute('data-seat', k);
        g.setAttribute('class', 'mp-seat mp-in');
        g.innerHTML = '<circle class="mp-pin"/><text class="mp-name"/>';
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
      var label = p.who.length === 1 ? p.who[0] : p.place + ' \u00b7 ' + p.who.length;
      var t = g.querySelector('text');
      t.textContent = label;
      t.setAttribute('x', xy[0].toFixed(1));
      t.setAttribute('y', (xy[1] - r - 2.2).toFixed(1));
      /* HALF-WIDTH, MEASURED NOT GUESSED. At font-size 5.6px a character
         occupies roughly 2.8px, so half of a label is length * 1.4. The first
         value here was 2.5 — nearly double — and it culled 6 of 11 labels in
         a 500 BC window that had ample room. This is the trap the timeline's
         axis note names: the collision test and the placement share this one
         number, so they will agree with each other whether or not it is
         right. It is checked against the font, and the screen is the judge. */
      g._w = label.length * 1.45;
      g._x = xy[0]; g._y = xy[1] - r - 2.2;
      g._rank = p.who.length;

      var title = g.querySelector('title') || g.appendChild(document.createElementNS(SVG, 'title'));
      title.textContent = p.place + ' \u2014 ' + p.who.slice(0, 8).join(', ') +
                          (p.who.length > 8 ? ' \u2026 (' + p.who.length + ')' : '');
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

    /* THE READOUT NAMES THE SILENCE. */
    var t = geo.totals;
    el.querySelector('.mp-read').textContent = yr(lo) + ' \u2014 ' + yr(hi);
    el.querySelector('.mp-note').textContent =
      pins.length + ' seats drawn \u00b7 ' + lastShown + ' named' +
      (lastHidden ? ', ' + lastHidden + ' name(s) with no room \u2014 hover the pin' : '') +
      ' \u00b7 ' + washes.length + ' souls shown as territory \u00b7 ' +
      (t.silent + t.unplaced) + ' of ' + t.souls + ' carry no place this map can honestly draw ' +
      '(' + t.silent + ' myth or unrecorded, ' + t.unplaced + ' named but unresolved) \u2014 they are not on it. ' +
      'Seats from GeoNames (CC BY 4.0); coastline Natural Earth.';
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
        sl.addEventListener('input', function () {
          hi = +sl.value; lo = hi - 400;   /* a moving 400-year window */
          draw();
        });
      }
      if (opts && typeof opts.year === 'number') { hi = opts.year; lo = hi - 400; sl.value = hi; }
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

  /* The trigger mounts itself the moment the file loads, so wiring the map
     into hall.html is ONE script tag and no edit to its logic. */
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', trigger);
  else trigger();

  /* addFaculty is exported so the GRAPH can join the rail when it is ready,
     without touching this file or hall.html:
         AmentiMap.addFaculty('fac-graph','who',svg,toggleFn,isOpenFn)  */
  window.AmentiMap = { open: open, close: close, trigger: trigger,
                       addFaculty: addFaculty, syncRail: syncRail };
})();
