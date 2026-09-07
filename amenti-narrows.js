/* ============================================================================
   amenti-narrows.js  ·  THE GROUND THAT FORCES A CHOICE          SLIP #74
   ----------------------------------------------------------------------------
   Draws NARROWS.csv over the map: the passes, straits and defiles everyone came
   through, and the bogs, marshes and sand seas nobody came through at all.

   ── A MODULE, AND IT STAYS ONE ────────────────────────────────────────────
   One script tag in hall.html and NO EDIT TO amenti-map.js. It joins the
   faculty rail through AmentiMap.addFaculty, the door the map exported so a
   third instrument could arrive without either file learning about the other.

   That is not tidiness. On 6 September five reasoned changes to amenti-map.js
   each had to be reverted; the glass, built the same night as a module, never
   once put the map at risk — because it cannot. A file that only ever ADDS a
   layer cannot take the map down with it.

   ── TWO KINDS, AND THEY MUST NOT LOOK ALIKE ───────────────────────────────
       FUNNEL   a gate mark — two brackets facing each other, closing
       FORBID   cross-hatch — an area you cannot walk through

   Neither may borrow a mark already spoken for. A soul is a filled cyan disc,
   a territory a soft slate rectangle, an event an ember burst, the sky an
   amber diamond, a site a small open square, a summit a triangle. And GOLD IS
   A VERIFIED QUOTE and is not spent here.

   A FORBIDDING PLACE IS AN AREA AND IS HATCHED, NEVER FILLED. A soft fill is
   what a territory wash uses to say "somewhere in here" about a soul; a bog is
   not a guess about where someone was, it is a statement about ground. Hatch
   says impassable; fill would say uncertain, which is a different claim.

   ── AND A DRAINED FEN IS NOT DRAWN ────────────────────────────────────────
   The Fens were drained in the 1600s and the Pontine Marshes in the 1930s.
   Drawn across a map that scrubs to 4000 BC they put modern farmland under a
   Norman battle. This is the made-lakes rule turned round: a reservoir is not
   drawn BEFORE it was impounded, and a fen is not drawn AFTER it was drained.

   ── WHAT IT READS, AND WHAT IT DOES WHEN IT CANNOT ────────────────────────
   It keeps its own copy of the projection, because amenti-map.js does not
   export proj(). TWO FILES HOLDING ONE PROJECTION IS A DRIFT WAITING TO
   HAPPEN — the map's own comment warns of exactly this. So it does not assume
   they agree: it projects Giza, compares against where the map actually drew
   the Giza mark, and reports the disagreement rather than drawing a register
   onto a projection that has moved underneath it.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var VB_W = 1000, VB_H = 500;
  var GIZA = [29.9792, 31.1342];

  /* THE MAP'S OWN PROJECTION, COPIED — and verified below rather than trusted.
     If the coastline is ever regenerated on another projection these two
     numbers are what must move, in both files. */
  function proj(lat, lon) {
    return [(lon + 180) / 360 * VB_W, (90 - lat) / 180 * VB_H];
  }

  var rows = null, layer = null, open = false, drift = null, loadErr = null;
  var terrain = {};   /* key -> what the ground measured. Optional; see below. */

  /* ── READING THE REGISTER ───────────────────────────────────────────────
     Its preamble is padded to ten fields so GitHub will preview it, which
     means a naive parser sees the comments as data. Skipped by their '#'. */
  function parse(text) {
    var lines = String(text).replace(/\r\n/g, '\n').split('\n');
    var cols = split(lines[0]);
    var out = [];
    lines.slice(1).forEach(function (l) {
      if (!l.trim() || l.trimStart().charAt(0) === '#') return;
      var c = split(l), o = {};
      cols.forEach(function (k, i) { o[k] = c[i] == null ? '' : c[i]; });
      o.lat = +o.lat; o.lon = +o.lon;
      o.lat2 = o.lat2 === '' ? null : +o.lat2;
      o.lon2 = o.lon2 === '' ? null : +o.lon2;
      o.drained = o.drained === '' ? null : +o.drained;
      if (!isNaN(o.lat) && !isNaN(o.lon)) out.push(o);
    });
    return out;
  }
  function split(line) {
    var c = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { c.push(cur); cur = ''; continue; }
      cur += ch;
    }
    c.push(cur); return c;
  }

  function style() {
    if (document.getElementById('mp-narrows-css')) return;
    var s = document.createElement('style');
    s.id = 'mp-narrows-css';
    s.textContent = [
      '#amenti-map .nr-layer{pointer-events:none}',
      /* A GATE. Two brackets closing on each other — a constriction, and a mark
         no other layer uses. Stone, not cyan: this is ground, not a soul. */
      '#amenti-map .nr-gate{fill:none;stroke:#8a9bb0;stroke-width:.9;opacity:.85;',
      '  stroke-linecap:round;vector-effect:non-scaling-stroke}',
      /* HATCH, NEVER FILL. A soft fill is what a territory uses to say
         "somewhere in here"; a bog is not a guess, it is ground. */
      '#amenti-map .nr-forbid{fill:url(#nr-hatch);stroke:#5c6f5a;stroke-width:.6;',
      '  stroke-dasharray:2 2;vector-effect:non-scaling-stroke;opacity:.75}',
      '#amenti-map .nr-lab{fill:#a4b3c4;text-anchor:middle;pointer-events:none;',
      '  paint-order:stroke;stroke:#070b12;stroke-width:1.6px;stroke-linejoin:round;',
      '  letter-spacing:.04em}',
      '#amenti-map .nr-forbidlab{fill:#8ea08c}',
      '#amenti-map .nr-hit{pointer-events:all;fill:transparent;cursor:help}',
      /* the ground did not corroborate this one: still drawn, plainly weaker */
      '#amenti-map .nr-unconfirmed{opacity:.42}',
      '#amenti-map .nr-unconfirmed .nr-gate{stroke-dasharray:2 2}',
      '#amenti-map .nr-drift{fill:#e0794a;font:400 6px ui-monospace,Menlo,monospace}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── THE CAMERA, READ NOT KEPT ──────────────────────────────────────────── */
  function camera() {
    var v = document.querySelector('#amenti-map .mp-view');
    var t = (v && v.getAttribute('transform')) || '';
    var k = parseFloat((t.match(/scale\(([-\d.]+)\)/) || [])[1] || '1');
    var p = (t.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/) || []);
    return { K: k, TX: parseFloat(p[1] || '0'), TY: parseFloat(p[2] || '0'), t: t };
  }

  /* ── THE LEADING EDGE, READ OFF THE MAP'S OWN READOUT ────────────────────
     There is no other way in: the aperture and the year live inside
     amenti-map.js and are not exported. So this parses the year the map is
     PRINTING, which is at least the number a reader is looking at. If the
     readout ever changes shape this returns null and the drained rule is
     stated as unenforced rather than silently skipped. */
  function leadingYear() {
    var n = document.querySelector('#amenti-map .mp-read');
    var t = n ? n.textContent : '';
    var m = t.match(/(\d+)\s*(BC|AD)?\s*$/i);
    if (!m) return null;
    var y = +m[1];
    return /BC/i.test(t.slice(t.lastIndexOf('\u2014'))) ? -y : y;
  }

  /* ── VERIFY THE PROJECTION RATHER THAN ASSUME IT ─────────────────────────
     The map draws an amber diamond at Giza — the observer, the one honest
     coordinate for a sky event. Project Giza here, ask where the map actually
     put it, and compare. Two files holding one projection will drift; this is
     how the drift announces itself instead of quietly misplacing a register. */
  function verify() {
    var obs = document.querySelector('#amenti-map .mp-obs');
    if (!obs) return { ok: null, why: 'the Giza mark is not drawn in this window' };
    var b;
    try { b = obs.getBBox(); } catch (e) { return { ok: null, why: 'getBBox refused' }; }
    var cam = camera();
    var mine = proj(GIZA[0], GIZA[1]);
    var theirs = [b.x + b.width / 2, b.y + b.height / 2];
    var d = Math.hypot(mine[0] - theirs[0], mine[1] - theirs[1]);
    return { ok: d < 2, off: d, why: null };
  }

  function draw() {
    if (!open || !layer || !rows) return;
    var cam = camera();
    layer.setAttribute('transform', cam.t);      /* ride the map's camera */
    var iv = 1 / cam.K, year = leadingYear();
    var h = '', shown = 0, gone = 0;

    rows.forEach(function (r) {
      /* A DRAINED FEN IS NOT DRAWN. Same rule as a reservoir, other way round. */
      if (r.drained != null && year != null && year > r.drained) { gone++; return; }
      shown++;

      if (r['class'] === 'forbid' && r.lat2 != null && r.lon2 != null) {
        var a = proj(r.lat2, r.lon), b = proj(r.lat, r.lon2);
        var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
        var w = Math.abs(b[0] - a[0]), ht = Math.abs(b[1] - a[1]);
        h += '<rect class="nr-forbid" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
             '" width="' + w.toFixed(1) + '" height="' + ht.toFixed(1) + '" rx="2"/>' +
             '<rect class="nr-hit" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
             '" width="' + w.toFixed(1) + '" height="' + ht.toFixed(1) + '">' +
             '<title>' + esc(r.name) + ' \u2014 ' + esc(r.kind) +
             '\n' + esc(r.why) +
             (r.drained ? '\ndrained ' + r.drained + ' \u2014 not drawn after that year' : '') +
             (terrain[r.key] ? '\n\n\u2014 the ground, Copernicus 30 m:\n   ' +
                               esc(terrain[r.key].reads) : '') +
             '</title></rect>' +
             '<text class="nr-lab nr-forbidlab" x="' + (x + w / 2).toFixed(1) + '" y="' +
             (y + ht / 2).toFixed(1) + '" font-size="' + (6.4 * iv).toFixed(3) +
             '" style="stroke-width:' + (1.6 * iv).toFixed(3) + 'px">' +
             esc(r.name.toLowerCase()) + '</text>';
        return;
      }

      /* A FUNNEL. A point, or a line where the crossing has two ends. The mark
         is two brackets closing on each other: ground narrowing, and nothing
         else on this surface draws it. */
      var p = proj(r.lat, r.lon);
      var mx = p[0], my = p[1], ang = 0;
      if (r.lat2 != null && r.lon2 != null) {
        var q = proj(r.lat2, r.lon2);
        mx = (p[0] + q[0]) / 2; my = (p[1] + q[1]) / 2;
        ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI + 90;
      }
      /* ── THE GATE FACES THE WAY THE GROUND NARROWS ────────────────────────
         A bearing typed by hand is a guess about terrain. A bearing measured
         off 30 m radar is the terrain. Where the harvest found a crossing, its
         axis wins — the brackets close across the gap rather than across
         whatever direction the two authored endpoints happened to lie on. */
      var t = terrain[r.key];
      var measured = t && t.crossing_bearing !== '' && t.crossing_m !== '';
      var unconfirmed = t && /open ground|WIDER THAN|no crossing/.test(t.reads || '');
      if (measured && !unconfirmed) ang = (+t.crossing_bearing) + 90;
      /* AN UNCONFIRMED GATE IS DRAWN FAINTLY AND SAYS SO. The register still
         claims the place; the ground did not corroborate it. Neither half of
         that may be hidden — dropping the mark would bury an authored claim,
         and drawing it solid would borrow a confidence the terrain refused. */
      var s = 4.2 * iv, g = 1.5 * iv;
      h += '<g class="' + (unconfirmed ? 'nr-unconfirmed' : '') +
           '" transform="translate(' + mx.toFixed(2) + ' ' + my.toFixed(2) +
           ') rotate(' + ang.toFixed(1) + ')">' +
           '<path class="nr-gate" d="M' + (-s).toFixed(2) + ' ' + (-s).toFixed(2) +
             'L' + (-g).toFixed(2) + ' 0L' + (-s).toFixed(2) + ' ' + s.toFixed(2) + '"/>' +
           '<path class="nr-gate" d="M' + s.toFixed(2) + ' ' + (-s).toFixed(2) +
             'L' + g.toFixed(2) + ' 0L' + s.toFixed(2) + ' ' + s.toFixed(2) + '"/>' +
           '<rect class="nr-hit" x="' + (-s * 1.4).toFixed(2) + '" y="' + (-s * 1.4).toFixed(2) +
             '" width="' + (s * 2.8).toFixed(2) + '" height="' + (s * 2.8).toFixed(2) + '">' +
           '<title>' + esc(r.name) + ' \u2014 ' + esc(r.kind) + '\n' + esc(r.why) +
           (t ? '\n\n\u2014 the ground, Copernicus 30 m:\n' +
                (t.crossing_m ? '   crossing ' + (+t.crossing_m / 1000).toFixed(1) +
                                ' km on ' + t.crossing_bearing + '\u00b0\n' : '') +
                '   floor ' + t.floor_m + ' m \u00b7 relief ' + t.relief_m + ' m\n' +
                '   ' + esc(t.reads) : '') +
           '</title></rect></g>' +
           '<text class="nr-lab" x="' + mx.toFixed(2) + '" y="' + (my - 6.5 * iv).toFixed(2) +
           '" font-size="' + (5.6 * iv).toFixed(3) +
           '" style="stroke-width:' + (1.6 * iv).toFixed(3) + 'px">' +
           esc(r.name) + '</text>';
    });

    /* the projection check, stated on the surface rather than in a console */
    if (drift && drift.ok === false)
      h += '<text class="nr-drift" x="8" y="' + (VB_H - 6) + '">\u26a0 narrows are ' +
           drift.off.toFixed(1) + ' units off the map\u2019s own Giza \u2014 the two ' +
           'projections have drifted</text>';

    layer.innerHTML =
      '<defs><pattern id="nr-hatch" width="6" height="6" patternUnits="userSpaceOnUse" ' +
        'patternTransform="rotate(45)">' +
        '<line x1="0" y1="0" x2="0" y2="6" stroke="#5c6f5a" stroke-width="1.1" ' +
        'opacity=".5"/></pattern></defs>' + h;
    layer._shown = shown; layer._gone = gone;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function show() {
    var map = document.querySelector('#amenti-map');
    var svg = map && map.querySelector('svg');
    var view = map && map.querySelector('.mp-view');
    if (!svg || !view) {
      console.log('THE NARROWS CANNOT OPEN \u2014 the map is closed, or has not drawn yet.');
      return false;
    }
    if (loadErr) {
      console.log('THE NARROWS CANNOT OPEN \u2014 NARROWS.csv did not load (' + loadErr + ').');
      return false;
    }
    if (!rows) { console.log('THE NARROWS are still loading \u2014 press again in a moment.'); return false; }
    style();
    if (!layer || !svg.contains(layer)) {
      layer = document.createElementNS(SVGNS, 'g');
      layer.setAttribute('class', 'nr-layer');
      /* AFTER .mp-view so it sits above the ground and below nothing else it
         needs to. It is not INSIDE .mp-view — this file appends no child to a
         group the map owns; it copies the transform instead. */
      svg.appendChild(layer);
    }
    drift = verify();
    if (drift.ok === false)
      console.log('THE NARROWS: this file\u2019s projection puts Giza ' + drift.off.toFixed(2) +
                  ' units from where the map drew it. Drawing anyway, and saying so on ' +
                  'the surface. One of the two projections has changed.');
    else if (drift.ok === null)
      console.log('THE NARROWS: could not verify the projection \u2014 ' + drift.why +
                  '. That is blindness, not a fault.');
    open = true;
    draw();
    return true;
  }

  function hide() {
    open = false;
    if (layer) { layer.remove(); layer = null; }
  }
  function toggle() { return open ? (hide(), false) : show(); }

  /* two brackets closing — the same mark the layer draws, so the rail says
     what it opens */
  var ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M6 4L10 12L6 20"/><path d="M18 4L14 12L18 20"/></svg>';

  function join() {
    if (!window.AmentiMap || !window.AmentiMap.addFaculty) return false;
    window.AmentiMap.addFaculty('fac-narrows', 'narrows', ICON, toggle,
                                function () { return open; });
    return true;
  }
  function arrive(n) {
    if (join()) return;
    if ((n || 0) > 40) {
      console.log('THE NARROWS did not join the rail \u2014 AmentiMap.addFaculty was never ' +
                  'exported. amenti-narrows.js needs amenti-map.js loaded first.');
      return;
    }
    setTimeout(function () { arrive((n || 0) + 1); }, 250);
  }

  /* ── THE GROUND, IF IT HAS BEEN MEASURED ────────────────────────────────
     NARROWS-terrain.csv is what harvest-narrows-terrain.py read off the
     Copernicus 30 m surface model: the width of the constriction, the bearing
     it runs on, and a plain-words verdict.

     IT IS OPTIONAL AND IT IS EVIDENCE, NOT TRUTH. Without it every gate still
     draws, facing the axis the register authored. With it, a gate faces the way
     the ground ACTUALLY narrows and its tooltip says what the terrain found —
     including where the terrain found nothing, which is the reading that
     matters most: an authored coordinate the earth does not agree with. */
  fetch(RAW + 'NARROWS-terrain.csv?_=' + Date.now())
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (t) {
      if (!t) return;
      var lines = t.replace(/\r\n/g, '\n').split('\n');
      var cols = split(lines[0]);
      lines.slice(1).forEach(function (l) {
        if (!l.trim()) return;
        var c = split(l), o = {};
        cols.forEach(function (k, i) { o[k] = c[i] == null ? '' : c[i]; });
        if (o.key) terrain[o.key] = o;
      });
      if (open) draw();
    })
    .catch(function () { /* Rule 3: no measurements is not a fault */ });

  fetch(RAW + 'NARROWS.csv?_=' + Date.now())
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (t) { rows = parse(t); if (open) draw(); })
    .catch(function (e) { loadErr = e.message; rows = null; });

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { arrive(0); });
  else arrive(0);

  /* The map redraws on every zoom, pan and year — and never tells anyone. So
     this watches the camera and the readout rather than being told. */
  var mo = new MutationObserver(function () { if (open) draw(); });
  function watch() {
    var v = document.querySelector('#amenti-map .mp-view');
    var rd = document.querySelector('#amenti-map .mp-read');
    if (v) mo.observe(v, { attributes: true, attributeFilter: ['transform'] });
    if (rd) mo.observe(rd, { childList: true, characterData: true, subtree: true });
    if (!v || !rd) setTimeout(watch, 400);
  }
  watch();

  new MutationObserver(function () {
    if (open && !document.body.classList.contains('scene-map')) {
      hide();
      if (window.AmentiMap && window.AmentiMap.syncRail) window.AmentiMap.syncRail();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  window.AmentiNarrows = {
    show: show, hide: hide, toggle: toggle,
    isOpen: function () { return open; },
    count: function () {
      return rows ? { entries: rows.length, drawn: layer ? layer._shown : 0,
                      hiddenByDrainage: layer ? layer._gone : 0 } : null;
    },
    /* so a reader can check the coupling without reading this file */
    check: function () { return verify(); }
  };
})();
