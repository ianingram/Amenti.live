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

  var slides = null, err = null, el = null, at = -1, tried = {};

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
  function render(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<i class="ap-n">$1</i>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\b([A-Z][A-Z ,'\u2019\u2014-]{9,})\b/g, function (m) {
        return '<b>' + m.charAt(0) + m.slice(1).toLowerCase() + '</b>';
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
      '#amenti-prologue .ap-sc{position:absolute;inset:0;background-size:cover;',
      '  background-position:center;opacity:0;transition:opacity .6s;',
      '  filter:saturate(.72) contrast(1.04)}',
      '#amenti-prologue .ap-sc.on{opacity:.34}',
      /* the scene, when there is one, must not swallow the words */
      '#amenti-prologue .ap-veil{position:absolute;inset:0;',
      '  background:radial-gradient(ellipse at center,rgba(5,8,14,.82) 0%,',
      '  rgba(5,8,14,.94) 70%)}',
      /* the map takes the upper half and the words the lower — the geography
         is read first and then explained, which is the order a reader wants */
      '#amenti-prologue .ap-map{position:absolute;left:50%;top:26px;',
      '  transform:translateX(-50%);width:min(760px,88%);aspect-ratio:2253/1161;',
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
      '#amenti-prologue .ap-off{position:absolute;right:8px;bottom:7px;',
      '  color:#5d6e84;font-size:8.5px;text-align:right;line-height:1.5}',
      '#amenti-prologue .ap-tx{position:absolute;left:50%;bottom:62px;',
      '  transform:translateX(-50%);width:min(760px,88%)}',
      '#amenti-prologue .ap-hd{color:#5d6e84;letter-spacing:.1em;font-size:10px;',
      '  margin-bottom:10px}',
      '#amenti-prologue .ap-ti{color:#e0913f;font-size:19px;line-height:1.3;',
      '  margin-bottom:14px}',
      '#amenti-prologue .ap-pr{color:#c3d3e6;font-size:13px;line-height:1.75}',
      '#amenti-prologue .ap-pr b{color:#dbe8f5;font-weight:400}',
      '#amenti-prologue .ap-pr .ap-n{color:#7fd8f0;font-style:normal}',
      '#amenti-prologue .ap-pr em{color:#9db0c6;font-style:italic}',
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

  function load() {
    if (slides || err) { return Promise.resolve(); }
    return fetch(RAW + 'ATTICA-PROLOGUE.csv?_=' + Date.now())
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (!t) { err = 'ATTICA-PROLOGUE.csv could not be read'; return; }
        slides = parse(t).filter(function (r) { return r.prose; })
                         .sort(function (a, b) { return (+a.seq) - (+b.seq); });
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
      '<div class="ap-map"><img alt=""><div class="ap-off"></div></div>' +
      '<div class="ap-tx">' +
      '<div class="ap-hd"></div><div class="ap-ti"></div>' +
      '<div class="ap-pr"></div><div class="ap-ft"></div></div>' +
      '<div class="ap-nav">' +
      '<button type="button" data-go="-1">\u25c0</button>' +
      '<button type="button" data-go="1">next \u25b6</button>' +
      '<button type="button" data-go="skip">skip to the map</button>' +
      '</div><div class="ap-dots"></div>';
    host.appendChild(el);
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
    var url = SCENE + tag + '.jpg';
    var img = new Image();
    img.onload = function () {
      tried[tag] = true;
      if (slides[at] && slides[at].scene === tag) {
        box.style.backgroundImage = 'url("' + url + '")';
        box.classList.add('on');
      }
    };
    img.onerror = function () { tried[tag] = false; };
    img.src = url;
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
    locator(s);
    scene(s.scene);
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
    box.querySelectorAll('.ap-mk,.ap-leg').forEach(function (n) { n.remove(); });

    var off = [];
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
      m.innerHTML = '<i></i><s>' + esc(name) +
                    (what ? '<em>' + esc(what) + '</em>' : '') + '</s>';
      box.appendChild(m);
    });

    if (s.leg) {
      var g = s.leg.split('|').map(parseFloat);
      if (g.length === 4 && !g.some(isNaN)) {
        var a = rproj(g[0], g[1]), b = rproj(g[2], g[3]);
        var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sv.setAttribute('class', 'ap-leg');
        sv.setAttribute('viewBox', '0 0 100 100');
        sv.setAttribute('preserveAspectRatio', 'none');
        sv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
                           'pointer-events:none';
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        var nx = -dy / L * 1.6, ny = dx / L * 1.6;
        var pts = [[a.x, a.y]];
        [[0.42, 1], [0.5, 0], [0.58, -1]].forEach(function (t) {
          pts.push([a.x + dx * t[0] + nx * t[1], a.y + dy * t[0] + ny * t[1]]);
        });
        pts.push([b.x, b.y]);
        var pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        pl.setAttribute('points', pts.map(function (p) {
          return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '));
        pl.setAttribute('fill', 'none');
        pl.setAttribute('stroke', '#c9503f');
        pl.setAttribute('stroke-width', '.5');
        pl.setAttribute('vector-effect', 'non-scaling-stroke');
        pl.setAttribute('opacity', '.85');
        sv.appendChild(pl);
        box.appendChild(sv);
      }
    }
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
      show(0);
    });
  }

  /* ── A BUTTON, NOT A CONSOLE LINE · 10 Sep 2026 ─────────────────────────
     An instrument that can only be started by typing its name is an instrument
     no visitor has. It joins the control row the period buttons live on, at
     the end, and it says what it does rather than what it is called.

     IT WAITS FOR THE SURFACE. The Attica ground mounts its own controls when
     it opens, so this looks for the row and tries again until it is there —
     and gives up quietly after a while rather than polling for ever. */
  function join() {
    var row = document.querySelector('#amenti-attica .at-ctl');
    if (!row) { return false; }
    if (row.querySelector('[data-prologue]')) { return true; }
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-prologue', '1');
    /* ── NOT THE RIGHT EDGE · 10 Sep 2026 ─────────────────────────────────
       `margin-left:auto` pushed it to the far right of the control row, which
       is exactly where the guide and the meter tabs sit — both fixed to the
       bottom corners, both drawn over this surface, and the button was UNDER
       THEM AND UNREADABLE.

       A row that ends where two other instruments begin has no right edge to
       spare. It goes after `fit`, in the gap in the middle, which is empty at
       every period and every zoom. */
    b.style.marginLeft = '18px';
    b.style.color = '#e0913f';
    b.style.borderColor = '#6a5330';
    b.textContent = '▶ the Marathon campaign';
    b.title = 'Six slides of back story, then ten legs on the ground — ' +
              'Herodotus 6.43 to 6.116';
    b.addEventListener('click', function () {
      if (window.AmentiCampaign && window.AmentiCampaign.stop) {
        window.AmentiCampaign.stop();
      }
      start();
    });
    row.appendChild(b);
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
