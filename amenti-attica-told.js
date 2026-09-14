/* ============================================================================
   amenti-attica-told.js  →  Amenti.live/amenti-attica-told.js
   ----------------------------------------------------------------------------
   THE BACK STORY, ON THE GROUND ITSELF

   amenti-attica-prologue.js told this story on a map it drew for itself: its
   own projection, its own places, its own routes, key, scale bar, compass,
   inset and far chart. TWO THOUSAND LINES, AND THE MAP HALF OF IT WAS A WORSE
   COPY OF THE SURFACE UNDERNEATH.

   Worse in a way that can be measured. The prologue draws REGION.jpg at 240
   pixels per degree and cannot zoom. The ground draws ATTICA.jpg at about
   2,840 — Copernicus 30 m land and ETOPO sea — over fifteen frames, with a
   glass that turns amber when the image is spent. The reader was being handed
   the thumbnail while the photograph sat behind it.

   ── SO THIS ONE DRIVES RATHER THAN DRAWS ─────────────────────────────────
   The ground already published everything a story needs, and said why:

       `A TOUR IS A SEQUENCE OF REGISTER STATES, NOT A SCRIPT. These do exactly
        what the legend, the period buttons and the year scrub already do by
        hand, and NOTHING ELSE. If a tour cannot be driven by these, it wants
        to say something the surface cannot show, and the tour is wrong rather
        than the API being short.`

   So a slide is a row of register states: frame, camera, period, year, marks.
   This layer sets them and writes the prose. It computes no projection, holds
   no places, and owns no map.

   ── THE ONE THING IT STILL DRAWS, AND WHERE ──────────────────────────────
   A COURSE IS NOT A REGISTER STATE. The ground's move layer draws a zigzag
   between two recorded ends and says in its own comment that the bow is a
   drawing convention and not a claim — that is a different assertion from a
   fleet working along a coast, and the prologue's walked courses are the one
   piece of its map work worth keeping.

   They are appended to `AmentiAttica.plane()`, which is the group carrying the
   camera transform, so they PAN AND ZOOM WITH THE TERRAIN and need no
   transform of their own. The projection is borrowed with `AmentiAttica.proj`
   for the same reason the ground lends it: two functions computing the same
   thing from the same box agree until one frame changes, and then disagree by
   a few pixels for ever with nothing on the surface to show it.

   ── WHAT IS NOT HERE, ON PURPOSE ─────────────────────────────────────────
   No key — the ground has one and counts its own marks. No scale bar, no
   compass, no ground labels, no place list: all of those exist below and are
   better. No inset — the ground zooms, which is what an inset was standing in
   for. The far chart is the one panel worth carrying over and it is not in
   this first version.

   IT DOES NOT RESIZE THE GROUND. Putting the terrain in a band and the words
   beneath it means one owner for the layout and a change to amenti-attica.js,
   and that is the next step rather than this one. Here the ground stays where
   it is and the words sit over it, which is how the campaign layer already
   works and is known to hold.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var SCENE = 'https://amenti-proxy.ingram-ian.workers.dev/scene/';

  var slides = null, err = null, el = null, at = -1, tried = {}, figures = null;
  var speeches = null, shown = {};

  function A() { return window.AmentiAttica; }

  /* ── the registers, read the way every other layer reads them ────────── */
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
      for (var j = 0; j < cols.length; j++) {
        o[cols[j]] = (c[j] == null ? '' : c[j]).trim();
      }
      out.push(o);
    }
    return out;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function get(file) {
    return fetch(RAW + file + '?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .catch(function () { return null; });
  }

  /* ── the emphasis markup, unchanged: it is the register's, not the map's ─ */
  var NAMES = {}, NOTNAME = {};
  ('the a an and or but of in on at to from for with by as is was were it its ' +
   'this that these those he she they his her their who what when where why ' +
   'not no so then than there here all every each both one two three')
    .split(' ').forEach(function (w) { NOTNAME[w] = 1; });
  'greece greeks greek asia europe persia persians persian hellas hellenes'
    .split(' ').forEach(function (n) { NAMES[n] = 1; });
  function learn(t) {
    String(t == null ? '' : t).replace(
      /[A-Z\u00c0-\u00de][a-z\u00df-\u00ff\u00ef'\u2019-]+/g, function (w) {
        var k = w.toLowerCase();
        if (!NOTNAME[k]) { NAMES[k] = 1; }
        return w;
      });
  }
  function harvest() {
    (slides || []).forEach(function (s) {
      (s.prose || '').replace(/\*\*([^*]+)\*\*/g, function (m, i) { learn(i); return m; });
      (s.places || '').split(';').forEach(function (p) { learn(p.split('|')[0]); });
      learn(s.title);
    });
  }
  function render(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<i class="td-n">$1</i>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
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

  /* ── THE COURSE, DRAWN INTO THE GROUND'S OWN PLANE ─────────────────────
     Everything else on a slide is a register state the surface already knows
     how to set. This is the exception: a walked course over water, which the
     move layer deliberately does not draw.

     It goes into `plane()`, so it zooms with the terrain. Nothing here derives
     a projection — `A().proj` is the surface's own, borrowed rather than
     copied, which is the whole reason it is lent out. */
  var LAYER = null;
  function clearCourse() {
    if (LAYER && LAYER.parentNode) { LAYER.parentNode.removeChild(LAYER); }
    LAYER = null;
  }
  function course(s) {
    clearCourse();
    var a = A();
    if (!a || !a.plane) { return; }
    var plane = a.plane();
    if (!plane) { return; }
    LAYER = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    LAYER.setAttribute('class', 'td-course');
    plane.appendChild(LAYER);

    ['route', 'route_land'].forEach(function (col) {
      (s[col] || '').split(';').forEach(function (spec) {
        if (!spec.trim()) { return; }
        var pts = spec.split('>').map(function (q) {
          var c = q.split('|');
          return a.proj(parseFloat(c[0]), parseFloat(c[1]));
        }).filter(function (p) { return p && !isNaN(p.x); });
        if (pts.length < 2) { return; }
        var sea = col === 'route';
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', pts.map(function (q, i) {
          return (i ? 'L' : 'M') + q.x.toFixed(2) + ' ' + q.y.toFixed(2);
        }).join(' '));
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', '#c9503f');
        /* non-scaling, so a course does not thicken as the reader zooms —
           the line is a claim about a route and not about a width */
        p.setAttribute('stroke-width', sea ? '2' : '1.8');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        p.setAttribute('opacity', '.95');
        if (!sea) { p.setAttribute('stroke-dasharray', '5 4'); }
        LAYER.appendChild(p);
      });
    });
  }

  /* ── the slide sets the surface, and then says its piece ───────────────── */
  function drive(s) {
    var a = A();
    if (!a) { return; }
    if (s.frame_key && a.frame) { a.frame(s.frame_key.trim()); }
    if (s.period && a.period) { a.period(s.period.trim()); }
    if (a.year) { a.year(s.year_at === '' || s.year_at == null ? null : +s.year_at); }
    if (s.marks && a.marks) { a.marks(s.marks.trim()); }
    if (s.camera && a.camera) {
      var c = s.camera.split('|');
      a.camera(parseFloat(c[0]), parseFloat(c[1]), c[2] ? parseFloat(c[2]) : undefined);
    }
    course(s);
  }

  function style() {
    if (document.getElementById('told-css')) { return; }
    var st = document.createElement('style');
    st.id = 'told-css';
    st.textContent = [
      '#amenti-told{position:absolute;inset:0;z-index:9;pointer-events:none;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace}',
      '#amenti-told .td-sc{position:absolute;inset:0;background-size:contain;',
      '  background-repeat:no-repeat;background-position:center;',
      '  background-color:#05080e;opacity:0;transition:opacity .6s}',
      '#amenti-told.td-bare .td-sc{opacity:1}',
      /* the words: a column over the ground, the way the campaign's panel is.
         The ground keeps its own furniture and this claims none of it. */
      '#amenti-told .td-tx{position:absolute;left:24px;bottom:96px;',
      '  width:min(430px,34%);max-height:62%;overflow-y:auto;pointer-events:auto;',
      '  background:rgba(5,8,14,.90);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:4px;padding:14px 16px}',
      '#amenti-told .td-hd{color:#5d6e84;letter-spacing:.1em;font-size:9.5px;',
      '  margin-bottom:9px;text-transform:uppercase}',
      '#amenti-told .td-ti{color:#e0913f;font-size:17px;line-height:1.3;',
      '  margin-bottom:12px}',
      '#amenti-told .td-pr{color:#c3d3e6;font-size:12.5px;line-height:1.75}',
      '#amenti-told .td-pr b{color:#dbe8f5;font-weight:400}',
      '#amenti-told .td-pr .td-n{color:#7fd8f0;font-style:normal}',
      '#amenti-told .td-pr em{color:#9db0c6;font-style:italic}',
      '#amenti-told .td-q{margin-top:12px;padding-left:12px;',
      '  border-left:2px solid #6a5330}',
      '#amenti-told .td-who{color:#e0913f;font-size:10px;letter-spacing:.06em}',
      '#amenti-told blockquote{margin:5px 0 0;color:#dbe8f5;font-size:12.5px;',
      '  line-height:1.7;font-style:italic}',
      '#amenti-told .td-ft{color:#4d5c70;font-size:9px;margin-top:13px;',
      '  padding-top:8px;border-top:1px solid rgba(43,58,80,.5);line-height:1.6}',
      /* who this is — the one panel the ground has no place for */
      '#amenti-told .td-fig{position:absolute;right:24px;bottom:96px;',
      '  width:min(250px,20%);pointer-events:auto;',
      '  background:rgba(5,8,14,.90);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:4px;padding:12px 14px}',
      '#amenti-told .td-fig h4{margin:0 0 8px;color:#5d6e84;font-size:8.5px;',
      '  font-weight:400;letter-spacing:.16em;text-transform:uppercase}',
      '#amenti-told .td-fig .nm{color:#e0913f;font-size:14px;line-height:1.3}',
      '#amenti-told .td-fig .ti{color:#9db0c6;font-size:10px;margin:2px 0 9px}',
      '#amenti-told .td-fig .wh{color:#c3d3e6;font-size:11px;line-height:1.65}',
      '#amenti-told .td-nav{position:absolute;left:24px;bottom:52px;',
      '  display:flex;gap:6px;pointer-events:auto}',
      '#amenti-told .td-nav button{background:rgba(5,8,14,.92);',
      '  border:1px solid rgba(43,58,80,.6);border-radius:3px;color:#7d8ea6;',
      '  padding:4px 13px;cursor:pointer;font:inherit;letter-spacing:.05em}',
      '#amenti-told .td-nav button:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-told.td-bare .td-tx,#amenti-told.td-bare .td-fig{',
      '  background:rgba(5,8,14,.72)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function mount() {
    var host = document.getElementById('amenti-attica');
    if (!host || el) { return !!el; }
    style();
    el = document.createElement('div');
    el.id = 'amenti-told';
    el.innerHTML =
      '<div class="td-sc"></div>' +
      '<div class="td-tx"><div class="td-hd"></div><div class="td-ti"></div>' +
      '<div class="td-pr"></div><div class="td-said"></div>' +
      '<div class="td-ft"></div></div>' +
      '<div class="td-fig"></div>' +
      '<div class="td-nav">' +
      '<button type="button" data-go="-1">\u25c0</button>' +
      '<button type="button" data-go="1">next \u25b6</button>' +
      '<button type="button" data-go="skip">to the campaign</button>' +
      '</div>';
    host.appendChild(el);
    el.querySelectorAll('.td-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-go');
        if (g === 'skip') { finish(); return; }
        show(at + (+g));
      });
    });
    return true;
  }

  function scene(tag) {
    var box = el.querySelector('.td-sc');
    box.style.backgroundImage = '';
    el.classList.remove('td-bare');
    if (!tag || tried[tag] === false) { return; }
    var urls = [RAW + 'img/scene/' + tag + '.jpg', SCENE + tag + '.jpg'];
    (function attempt(i) {
      if (i >= urls.length) { tried[tag] = false; return; }
      var img = new Image();
      img.onload = function () {
        tried[tag] = true;
        if (slides[at] && slides[at].scene === tag && !shown[at]) {
          box.style.backgroundImage = 'url("' + urls[i] + '")';
          el.classList.add('td-bare');
        }
      };
      img.onerror = function () { attempt(i + 1); };
      img.src = urls[i];
    })(0);
  }

  function said(s) {
    var box = el.querySelector('.td-said');
    var mine = (speeches || []).filter(function (q) { return q.chapter === s.chapter; });
    box.innerHTML = mine.map(function (q) {
      return '<div class="td-q"><div class="td-who">' + esc(q.speaker) +
        (q.who ? ', ' + esc(q.who) : '') + '</div>' +
        '<blockquote>' + esc(q.words) + '</blockquote></div>';
    }).join('');
  }

  function who(s) {
    var box = el.querySelector('.td-fig');
    var f = (figures || []).filter(function (x) {
      return x.key && s.figure && x.key === s.figure.trim();
    })[0];
    box.style.display = f ? '' : 'none';
    if (!f) { box.innerHTML = ''; return; }
    box.innerHTML = '<h4>who this is</h4><div class="nm">' + esc(f.name) +
      '</div>' + (f.title ? '<div class="ti">' + esc(f.title) + '</div>' : '') +
      '<div class="wh">' + render(f.what) + '</div>';
  }

  function show(n) {
    if (!slides || !slides.length) { return; }
    if (n < 0) { n = 0; }
    if (n >= slides.length) { finish(); return; }
    at = n;
    var s = slides[n];
    el.querySelector('.td-hd').textContent =
      yr(s.year) + '  \u00b7  HERODOTUS ' + s.chapter +
      '  \u00b7  ' + (n + 1) + ' of ' + slides.length;
    el.querySelector('.td-ti').textContent = s.title;
    el.querySelector('.td-pr').innerHTML = render(s.prose);
    el.querySelector('.td-ft').innerHTML =
      esc(s.source) + '  \u00b7  ' + esc(s.room);
    said(s);
    who(s);
    drive(s);
    scene(s.scene);
    var tx = el.querySelector('.td-tx');
    if (tx) { tx.scrollTop = 0; }
  }

  function finish() {
    clearCourse();
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    el = null; at = -1;
    if (window.AmentiCampaign && window.AmentiCampaign.start) {
      window.AmentiCampaign.start();
    }
  }

  function start() {
    var a = A();
    if (!a || !a.isOpen || !a.isOpen()) {
      console.log('THE TOLD LAYER: the ground is not open. AmentiAttica.show() first.');
      return Promise.resolve();
    }
    return Promise.all([
      get('ATTICA-PROLOGUE.csv'), get('FIGURES.csv'), get('ATTICA-SPEECHES.csv')
    ]).then(function (r) {
      if (!r[0]) { err = 'ATTICA-PROLOGUE.csv could not be read'; console.log(err); return; }
      slides = parse(r[0]).filter(function (x) { return x.prose; })
                          .sort(function (x, y) { return (+x.seq) - (+y.seq); });
      figures = r[1] ? parse(r[1]) : [];
      speeches = r[2] ? parse(r[2]) : [];
      harvest();
      if (!mount()) { return; }
      show(0);
    });
  }

  window.AmentiTold = {
    start: start,
    at: function (n) { show(n); return at; },
    stop: function () { clearCourse();
      if (el && el.parentNode) { el.parentNode.removeChild(el); } el = null; at = -1; },
    slides: function () { return slides; }
  };
})();
