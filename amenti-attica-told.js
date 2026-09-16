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
  var speeches = null;

  /* ── A SCENE IS A STEP, NOT A BACKDROP · 13 Sep 2026 ────────────────────
     The first version drew the picture behind the words and put the map under
     both, so a reader met three things at once and the scene was the one they
     could see least of.

     A scene is where the story is TOLD and the map is where it is SHOWN, and
     those are two moments. So a slide with a picture has two steps: the scene
     with its prose beside it, then the ground with the leg on it. `next` walks
     both. A slide with no picture has one step and reads exactly as before —
     six of the eight have none, and that is the honest default rather than a
     grey box where a photograph should be. */
  var STAGE = 'map';        /* 'scene' | 'map' */

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
      '  background-color:#05080e;opacity:0;transition:opacity .6s;',
      '  pointer-events:none}',
      '#amenti-told.td-scene .td-sc{opacity:1}',
      /* ── AND THE MARGINS BESIDE IT ARE WHERE THE WORDS GO ───────────────
         `contain` leaves a broad dark band either side of the picture on any
         wide window. The scene and its sentence are one thing, so the column
         moves into that band instead of sitting on top of the image. */
      /* ── THE BANDS EITHER SIDE, AND NOTHING CLEVERER · 13 Sep 2026 ──────
         Three attempts and each one let something centre itself. `contain`
         centres the picture inside whatever box it is given, so reserving a
         margin does not reserve it — the picture simply sits in the middle of
         the larger box and the band moves.

         THE PICTURE GETS THE MIDDLE HALF AND THE COLUMNS GET THE QUARTERS.
         Fixed shares, no fitting, nothing to compute. The picture is smaller
         than it could be at some window shapes and that is the price of a
         layout that cannot overlap. */
      '#amenti-told.td-scene .td-sc{left:4%;right:24%}',
      /* The figure panel was drawn on BOTH steps of a slide, so a reader met
         the same paragraph one `next` apart, beside a passage that had just
         said it. It stays on the map, where the words are all there is to say
         who this is; on the scene the picture and the passage are the surface. */
      /* ── THE FIGURE PANEL IS OFF · 15 Sep 2026 ─────────────────────────
         It carried a bio of the slide's figure, which on the slides that have
         one retold the passage beside it — the same paragraph twice, on both
         steps. The passage says who these people are; a box repeating it in
         other words was not a second thing to read, it was the same thing
         again, over the register.
         who() and the markup are left in place: the panel is one rule away
         from coming back if it is ever given something the prose does not
         already say. */
      '#amenti-told .td-fig{display:none}',
      '#amenti-told.td-scene .td-tx{right:0;left:auto;top:0;bottom:0;',
      '  height:auto;max-height:none;width:24%;',
      '  background:none;border:0;overflow-y:auto;',
      '  display:flex;flex-direction:column;justify-content:center;',
      '  padding:9vh 26px 0 18px}',
      '@media (max-width:1100px){',
      '  #amenti-told.td-scene .td-sc{left:0;right:0}',
      '  #amenti-told.td-scene .td-tx{',
      '    width:min(340px,42%);background:rgba(5,8,14,.90);',
      '    border:1px solid rgba(43,58,80,.6);border-radius:4px;',
      '    padding:12px 14px;height:auto;top:auto;bottom:96px}}',
      /* ── AND THE GROUND HAS TO GO DARK · 13 Sep 2026 ─────────────────────
         The scene drew over the surface and the surface kept drawing: its
         frames list, its register, its key and its census read straight
         through both columns and the picture. UNREADABLE, and the fault was an
         omission — the prologue turned the ground off with `ap-bare` and the
         rewrite did not.

         The whole surface dims rather than any listed part of it. A rule that
         enumerates what to hide falls behind the first thing added after it,
         which is a lesson this ship has already paid for twice. */
      'body.td-showing #amenti-attica > *:not(#amenti-told){',
      '  opacity:0;pointer-events:none;transition:opacity .4s}',
      '#amenti-told.td-scene .td-mast{opacity:.85}',
      '#amenti-told .td-mast{position:absolute;left:38px;top:34px;',
      '  color:#e0913f;font-size:11.5px;letter-spacing:.2em;opacity:0;',
      '  text-transform:uppercase;transition:opacity .5s;pointer-events:none;',
      '  text-shadow:0 1px 5px rgba(0,0,0,.95)}',
      /* the words: a column over the ground, the way the campaign's panel is.
         The ground keeps its own furniture and this claims none of it. */
      '#amenti-told.td-scene .td-tx{overflow-y:auto}',
      '#amenti-told .td-tx{position:absolute;left:24px;bottom:96px;',
      '  width:min(430px,34%);max-height:62%;overflow-y:auto;pointer-events:auto;',
      '  background:rgba(5,8,14,.90);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:4px;padding:14px 16px}',
      /* WHERE, AND WHO. The passage opens mid-scene — a king is told something
         — and a reader arriving at slide 1 has no way to know whose room they
         are standing in. This says it once, above everything, from the slide's
         own room and figure. */
      /* WHOSE PAGE THIS IS. The picture is a king in his own hall; the name
         is the title of the page and is set like one. The rank runs under it,
         quieter and on its own line — a subtitle, not a continuation. */
      '#amenti-told .td-where{color:#e0913f;font-size:30px;line-height:1.08;',
      '  letter-spacing:.06em;margin-bottom:12px;text-transform:uppercase}',
      '#amenti-told .td-where span{display:block;color:#9db0c6;font-size:12px;',
      '  text-transform:none;letter-spacing:.04em;margin-top:5px}',
      '@media (max-width:1100px){',
      '  #amenti-told .td-where{font-size:22px}}',
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
    /* ── THE STORY NEEDS THE COLUMN, THE GROUND ALONE DOES NOT · 15 Sep ──
       The map is square, so it takes the whole height and as much width as
       that gives it — which at a normal window leaves no room beside it for a
       passage. Reading the ground on its own, that is right. Reading the
       story, the prose is the point and four words to a line is not reading.
       This marks the body while the told layer is mounted; the ground's own
       stylesheet widens its right reserve against it, and takes the width
       back the moment the layer is gone. */
    document.body.classList.add('td-live');
    el = document.createElement('div');
    el.id = 'amenti-told';
    el.innerHTML =
      '<div class="td-sc"></div>' +
      '<div class="td-mast">The Attica Campaign</div>' +
      '<div class="td-tx"><div class="td-where"></div>' +
      '<div class="td-hd"></div><div class="td-ti"></div>' +
      '<div class="td-pr"></div><div class="td-said"></div>' +
      '<div class="td-ft"></div></div>' +
      '<div class="td-fig"></div>' +
      '<div class="td-nav">' +
      '<button type="button" data-go="-1">\u25c0</button>' +
      '<button type="button" data-go="1">next \u25b6</button>' +
      '<button type="button" data-go="skip">skip to the campaign</button>' +
      '</div>';
    host.appendChild(el);
    window.addEventListener('resize', place);
    el.querySelectorAll('.td-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-go');
        if (g === 'skip') { toCampaign(0); return; }
        step(+g);
      });
    });
    return true;
  }

  /* asked for once per tag and remembered; a tag with no picture is not
     retried and the slide simply has one step instead of two */
  function scene(tag, then) {
    if (!tag) { then(false); return; }
    if (tried[tag] === false) { then(false); return; }
    if (tried[tag]) { then(true, tried[tag]); return; }
    var urls = [RAW + 'img/scene/' + tag + '.jpg', SCENE + tag + '.jpg'];
    (function attempt(i) {
      if (i >= urls.length) { tried[tag] = false; then(false); return; }
      var img = new Image();
      img.onload = function () { tried[tag] = urls[i]; then(true, urls[i]); };
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

  /* ── WALKING TWO STEPS PER SLIDE · 13 Sep 2026 ──────────────────────────
     `next` from a scene goes to that slide's map; from a map it goes to the
     next slide's scene, or to its map if it has none. Back walks the same
     path in reverse, so a reader can return to a picture they have passed. */
  /* ── ONE SEQUENCE, TWO RENDERERS · 14 Sep 2026 ─────────────────────────
     The story did not end at slide 8; it handed off to another program with
     its own arrows, and a reader met TWO SETS OF CONTROLS for one story.

     It is one walk now. Past the last slide the arrows step the campaign's
     legs instead of these slides, and back from its first leg returns here.
     The campaign keeps everything it DRAWS — the fleet spread in ground units,
     the moorings, the pulse — and gives up only the steering.

     CAMP is -1 while the slides are running and a leg index after that. It is
     the only state the handoff needs, which is the test of whether the split
     was in the right place. */
  var CAMP = -1, CAMP_N = 0;

  function toCampaign(i) {
    var C = window.AmentiCampaign;
    if (!C || !C.start) { finish(); return; }
    if (el) { el.style.display = 'none'; }     /* its renderer, its panel */
    document.body.classList.remove('td-showing');
    clearCourse();
    if (CAMP < 0) {
      C.start();
      if (C.driven) { C.driven(true); }
      if (C.legs) {
        C.legs().then(function (L) {
          CAMP_N = (L && L.length) || (C.count ? C.count() : 0);
        });
      }
    }
    CAMP = i;
    if (C.step) { C.step(i); }
    navFor();
  }

  function fromCampaign() {
    var C = window.AmentiCampaign;
    if (C && C.stop) { C.stop(); }
    if (C && C.driven) { C.driven(false); }
    CAMP = -1;
    if (el) { el.style.display = ''; }
    show(slides.length - 1, 'map');
  }

  /* the arrows belong to the sequence, so they say where they are in it */
  function navFor() {
    if (!el) { return; }
    var nx = el.querySelector('[data-go="1"]');
    if (!nx) { return; }
    nx.textContent = CAMP >= 0 ? 'next \u25b6'
      : (STAGE === 'scene' ? 'to the map \u25b6' : 'next \u25b6');
  }

  function step(dir) {
    if (CAMP >= 0) {
      if (dir > 0) {
        if (CAMP + 1 >= CAMP_N && CAMP_N) { return; }
        toCampaign(CAMP + 1); return;
      }
      if (CAMP === 0) { fromCampaign(); return; }
      toCampaign(CAMP - 1); return;
    }
    var s = slides[at];
    if (dir > 0) {
      if (STAGE === 'scene') { show(at, 'map'); return; }
      if (at + 1 >= slides.length) { toCampaign(0); return; }
      show(at + 1, 'scene'); return;
    }
    if (STAGE === 'map' && tried[s && s.scene]) { show(at, 'scene'); return; }
    /* ── BACK COULD NOT REACH THE BEGINNING · 14 Sep 2026 ────────────────
       From slide 1's map this asked for show(-1, 'map'). show() clamps a
       negative index to 0 but KEEPS THE STAGE IT WAS GIVEN, so it landed on
       slide 1's map again — the same place it started — and the opening scene
       became unreachable the moment a reader left it.

       A clamp that fixes the number and not the intent is the fault: it
       cannot fail, so it says nothing, and the button just stops working. */
    if (at <= 0) {
      var first = slides[0];
      if (tried[first && first.scene]) { show(0, 'scene'); }
      return;
    }
    var prev = slides[at - 1];
    show(at - 1, tried[prev && prev.scene] ? 'scene' : 'map');
  }

  /* ── THE ALLEY BESIDE THE MAP · 14 Sep 2026 ────────────────────────────
     On the map step the prose sat bottom-left, over the ground, in a box 34%
     wide and capped at 62% height — so a passage scrolled in a letterbox while
     A TALL BLACK COLUMN STOOD EMPTY to the right of the map.

     The map is square and centred in a wrap that reserves the right-hand side
     for the register, so on any wide window there is a real alley between the
     two. It is MEASURED and not assumed: the campaign layer learned that the
     hard way — three placements by eye, two of them behind furniture that was
     already there.

     If the alley is too narrow to read in, the panel stays where it was. A
     column of prose 180px wide is worse than a panel over the map. */
  /* ── MEASURED BEFORE THE SURFACE HAD MOVED · 14 Sep 2026 ───────────────
     place() ran in the same tick as drive(), and drive() changes the FRAME —
     which makes the ground drop its registers, fetch new ones and redraw. So
     the measurement was taken against the previous frame's geometry, or
     against an element that had not been laid out yet, and the alley came out
     too narrow to use. The panel then stayed where it was.

     It showed on the last slide and nowhere else, because that is the one
     slide whose frame does not change: nothing moved, so nothing was stale.

     Measuring on the next frame is not a delay for its own sake. It is the
     difference between asking the DOM what is there and asking it what was
     there a moment ago. */
  function place() {
    if (!el) { return; }
    var tx = el.querySelector('.td-tx');
    var host = document.getElementById('amenti-attica');
    if (!tx || !host || el.classList.contains('td-scene')) { return; }
    var hb = host.getBoundingClientRect();
    /* `.at-ground` is the <image> INSIDE g.at-view, the group carrying the
       camera transform — its right edge is a camera position, not a layout
       edge, and it read 941, 589 and 542 on three consecutive slides. The svg
       IS the map. */
    var g = host.querySelector('svg');
    var lst = host.querySelector('.at-list');
    var gb = g && g.getBoundingClientRect();
    var lb = lst && lst.getBoundingClientRect();
    if (!gb || !gb.width) { return; }
    /* ── THE ALLEY, WHATEVER WIDTH IT IS · 14 Sep 2026 ──────────────────
       Two wrong answers before this one. The first put the prose OVER THE
       REGISTER because 210px looked too narrow — text on top of text. The
       second forced full bleed to widen the alley, which moves the whole
       surface to avoid a scrollbar.

       THE COLUMN SCROLLS. It always did. 210px is narrow and it is where the
       words were asked to go, and a narrow column of prose that scrolls is an
       ordinary thing, not a problem to engineer around.

       Nothing is drawn over the register, and nothing else on the surface
       moves to make room. */
    var left = gb.right - hb.left + 16;
    var right = (lb && lb.width && lb.left > gb.right)
      ? hb.right - lb.left + 14 : 18;
    if (hb.width - left - right < 150) { tx.style.cssText = ''; return; }
    tx.style.left = left + 'px';
    tx.style.right = right + 'px';
    tx.style.width = 'auto';
    tx.style.top = Math.max(16, gb.top - hb.top) + 'px';
    tx.style.bottom = '58px';
    tx.style.maxHeight = 'none';
    tx.style.overflowY = 'auto';
  }

  /* twice: once after layout, once after the ground has had a beat to load
     the new frame's registers and settle its own size */
  function placeSoon() {
    requestAnimationFrame(function () {
      place();
      setTimeout(place, 260);
    });
  }

  function show(n, want) {
    if (!slides || !slides.length) { return; }
    if (n < 0) { n = 0; }
    if (n >= slides.length) { toCampaign(0); return; }
    at = n;
    var s = slides[n];
    el.querySelector('.td-hd').textContent =
      yr(s.year) + '  \u00b7  HERODOTUS ' + s.chapter +
      '  \u00b7  ' + (n + 1) + ' of ' + slides.length;
    var where = el.querySelector('.td-where');
    var f = (figures || []).filter(function (x) {
      return x.key && s.figure && x.key === s.figure.trim();
    })[0];
    /* `room` is a source path — herodotus/12-sardis.md — not a place, and
       `host` and `area` are empty on every row, so there is no location in
       this data to print. The figure is what there is. */
    where.innerHTML = (f && f.name)
      ? esc(f.name) + (f.title ? '<span>' + esc(f.title) + '</span>' : '')
      : '';
    where.style.display = (f && f.name) ? '' : 'none';
    el.querySelector('.td-ti').textContent = s.title;
    el.querySelector('.td-pr').innerHTML = render(s.prose);
    el.querySelector('.td-ft').innerHTML =
      esc(s.source) + '  \u00b7  ' + esc(s.room);
    said(s);
    who(s);
    var tx = el.querySelector('.td-tx');
    if (tx) { tx.scrollTop = 0; }
    placeSoon();

    /* the map is drawn either way — a reader stepping back from a scene
       should not wait for the ground to be set up again */
    drive(s);

    scene(s.scene, function (has, url) {
      /* the slide may have moved on while the picture was loading */
      if (!el || slides[at] !== s) { return; }
      var box = el.querySelector('.td-sc');
      var wantScene = has && want !== 'map';
      STAGE = wantScene ? 'scene' : 'map';
      box.style.backgroundImage = has ? 'url("' + url + '")' : '';
      el.classList.toggle('td-scene', wantScene);
      document.body.classList.toggle('td-showing', wantScene);
      /* the scene owns the whole surface; the map step has an alley */
      if (wantScene) { el.querySelector('.td-tx').style.cssText = ''; }
      else { placeSoon(); }
      var nx = el.querySelector('[data-go="1"]');
      if (nx) {
        nx.textContent = wantScene ? 'to the map \u25b6' : 'next \u25b6';
      }
    });
  }

  function finish() {
    var hst = document.getElementById('amenti-attica');
    document.body.classList.remove('td-showing');
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
      /* the story opens on the picture when there is one — the king at his
         table before any ground is drawn · 13 Sep 2026 */
      show(0, 'scene');
    });
  }

  /* ── ITS OWN WAY IN · 14 Sep 2026 ──────────────────────────────────────
     The prologue drew its own button and waited for the ground to exist before
     attaching it. This does the same, so that removing the prologue's script
     tag removes the prologue's button with it and there is no third file to
     edit for the changeover.

     WHILE BOTH ARE LOADED THEY WOULD SIT ON TOP OF EACH OTHER. The prologue
     takes left:26 top:14 — the one strip nothing else claims, by its own note
     — so this drops below it while that button exists, and moves up to the
     proper place the moment it does not. A changeover a reader can see is
     better than one that hides a control under another. */
  function join() {
    var host = document.getElementById('amenti-attica');
    if (!host || !host.querySelector('.at-ctl')) { return false; }
    if (host.querySelector('.td-open')) { return true; }

    var old = Array.prototype.filter.call(host.children, function (n) {
      return n.tagName === 'BUTTON' &&
             /Marathon campaign/.test(n.textContent || '');
    }).length;

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'td-open';
    b.style.cssText = 'position:absolute;left:26px;top:' + (old ? 56 : 14) +
      'px;z-index:8;background:#e0913f;color:#0a0e15;border:0;border-radius:3px;' +
      'padding:7px 20px;cursor:pointer;letter-spacing:.06em;' +
      'font:400 12px/1.4 ui-monospace,Menlo,monospace;' +
      'box-shadow:0 2px 18px rgba(224,145,63,.28)';
    b.textContent = '\u25b6 the Marathon campaign';
    b.title = 'Herodotus 5.105 to 6.95 \u2014 the back story, told on the ground';
    b.addEventListener('mouseenter', function () { b.style.background = '#ffd166'; });
    b.addEventListener('mouseleave', function () { b.style.background = '#e0913f'; });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.AmentiCampaign && window.AmentiCampaign.stop) {
        window.AmentiCampaign.stop();
      }
      if (window.AmentiPrologue && window.AmentiPrologue.stop) {
        window.AmentiPrologue.stop();
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
      console.log('THE TOLD LAYER: no .at-ctl to join after 30 seconds. ' +
                  'Open the ground and it will attach on the next look.');
      tries = 0;
    }
    setTimeout(wait, 500);
  })();

  window.AmentiTold = {
    join: join,
    start: start,
    at: function (n) { show(n); return at; },
    stop: function () { document.body.classList.remove('td-showing', 'td-live'); clearCourse();
      if (el && el.parentNode) { el.parentNode.removeChild(el); } el = null; at = -1; },
    slides: function () { return slides; }
  };
})();
