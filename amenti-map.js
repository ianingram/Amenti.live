/* ============================================================================
   MAP PROBE · the architecture, not the drawing
   ----------------------------------------------------------------------------
   Paste into the browser console on hall.html with the map OPEN.

   WHAT THIS IS NOT. hall-probe asks whether the page drew what the files say.
   That question is answered. This one asks a different thing:

       WHAT IS THIS SURFACE ACTUALLY BUILT ON, AND WHAT WILL BEAR WEIGHT?

   It is the groundwork survey for two instruments that do not exist yet — a
   DEGREE FRAME on the long and short edges, and a CHART GLASS that magnifies
   the space between marks without magnifying the marks. Both need facts nobody
   has measured: what moves with the world and what does not, whether a mark
   truly holds its size across zoom, whether the label cull's claim survives
   contact with the screen, and WHERE the clumping actually is.

   ── IT IS WRITTEN TO THE DOCTRINE ────────────────────────────────────────
   1 · REAL DATA. Every number below is read off the live DOM at the zoom and
       year you are standing in. Nothing is simulated and nothing is assumed
       from the source.
   2 · ATTRIBUTE, NEVER INFER. Where a measurement disagrees with an intention,
       this names WHICH MECHANISM WON — not merely that something is wrong.
   3 · A MISSING SIGNAL IS NOT A RED LIGHT. Anything it cannot measure is
       reported UNREAD, with the reason. It never converts blindness to a fault.
   4 · RETURN TEN TIMES WHAT IT COST. It reports nothing that was asked for.
       No "the coastline drew". Only the unasked column.

   It reads only. It clicks nothing and changes nothing.
   ========================================================================== */
(function mapProbe() {
  var L = [], UNREAD = [];
  var say   = function (m) { L.push(m); };
  var head  = function (m) { L.push(''); L.push('\u2500\u2500 ' + m + ' ' + '\u2500'.repeat(Math.max(0, 62 - m.length))); };
  var blind = function (what, why) { UNREAD.push(what + '  \u2014 ' + why); };
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var n2 = function (v) { return (Math.round(v * 100) / 100); };

  var el = $('#amenti-map');
  if (!el) return '\n  UNREAD \u2014 no #amenti-map on this page. Open hall.html.\n';
  if (!document.body.classList.contains('scene-map'))
    return '\n  UNREAD \u2014 the map is CLOSED. Press the globe in the faculty rail, then run this again.\n' +
           '  Nothing below can be measured on a surface that is not rendering.\n';

  var svg  = $('svg', el);
  var view = $('.mp-view', el);
  if (!svg || !view) return '\n  UNREAD \u2014 no <svg> or .mp-view. The surface mounted but did not build.\n';

  /* the transform the world is under, read rather than assumed */
  var tf = view.getAttribute('transform') || '';
  var K  = parseFloat((tf.match(/scale\(([-\d.]+)\)/) || [])[1] || '1');
  var TT = (tf.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/) || []);
  var TX = parseFloat(TT[1] || '0'), TY = parseFloat(TT[2] || '0');
  var box = svg.getBoundingClientRect();
  var vb  = (svg.getAttribute('viewBox') || '0 0 1000 500').split(/\s+/).map(Number);
  var VW  = vb[2], VH = vb[3];
  /* viewBox units per screen pixel, at the CURRENT fit — the number every
     screen-space claim below has to pass through */
  var uPerPx = VW / (box.width || 1);

  say('zoom K ' + n2(K) + '   pan ' + n2(TX) + ',' + n2(TY) +
      '   viewBox ' + VW + '\u00d7' + VH + '   on screen ' + Math.round(box.width) + '\u00d7' + Math.round(box.height) + 'px');

  /* ══ 1 · THE TRANSFORM CENSUS ═══════════════════════════════════════════
     WHICH LAYERS MOVE WITH THE WORLD. This is the first thing a glass needs
     and it has never been written down. Anything inside .mp-view is
     geographic and can be re-drawn at another scale. Anything outside is
     chrome or sky, and a glass passing over it would be magnifying a diagram.

     It is read from the DOM's own parentage, not from the source, because the
     source is what someone INTENDED and the tree is what shipped. */
  head('WHAT MOVES WITH THE WORLD');
  var layers = ['.mp-sea', '.mp-graticule', '.mp-relief', '.mp-land', '.mp-coast',
                '.mp-regions', '.mp-lakes', '.mp-sites', '.mp-journeys', '.mp-rivers',
                '.mp-peaks', '.mp-events', '.mp-washes', '.mp-pins', '.mp-skygeo', '.mp-sky'];
  var inside = [], outside = [], missing = [];
  layers.forEach(function (sel) {
    var n = $(sel, el);
    if (!n) { missing.push(sel); return; }
    (view.contains(n) ? inside : outside).push(sel.replace('.mp-', ''));
  });
  say('  geographic (redrawable at another scale)   ' + inside.join(' '));
  say('  fixed      (a glass must not magnify it)   ' + outside.join(' '));
  if (missing.length) blind('layers not on the page: ' + missing.join(' '),
                            'absent, which may be correct for this window');

  /* ══ 2 · THE COUNTER-SCALE AUDIT ════════════════════════════════════════
     THE WHOLE ZOOM DEPENDS ON ONE PROPERTY and until 6 Sep nothing checked it.
     A label is meant to hold its SCREEN size while the world grows between
     labels, so its font-size must be base/K. Two mechanisms can set it — a
     stylesheet rule and an inline style — and in SVG the stylesheet beats a
     presentation attribute. That is not a theory; it is the fault that made
     every name draw K times too large at every zoom since 4 September.

     RULE 2: this does not say "wrong". It names WHICH MECHANISM WON. */
  head('THE COUNTER-SCALE \u2014 does the zoom reach the type');
  var scaled = [['.mp-name', 5.6], ['.mp-glyph', 6.4], ['.mp-washlabel', 7.5],
                ['.mp-over', 7.0], ['.mp-obslabel', 5.0], ['.mp-peaklab', 5.0],
                ['.mp-sitelab', 5.0], ['.mp-evlab', 5.2]];
  var bad = 0, checked = 0;
  scaled.forEach(function (p) {
    var sel = p[0], base = p[1], node = $(sel, el);
    if (!node) { blind(sel, 'none drawn in this window'); return; }
    var got = parseFloat(getComputedStyle(node).fontSize);
    if (!(got > 0)) { blind(sel, 'computed font-size unreadable'); return; }
    checked++;
    var want = base / K, ratio = got / want;
    var verdict;
    if (Math.abs(ratio - 1) < 0.12) verdict = 'ok';
    else if (Math.abs(got - base) < base * 0.12 && K > 1.1) {
      verdict = 'STYLESHEET WON \u2014 the counter-scale was computed and overruled';
      bad++;
    } else { verdict = 'neither base nor base/K \u2014 a third thing is setting it'; bad++; }
    say('  ' + sel.replace('.mp-', '').padEnd(12) +
        'want ' + n2(want) + '  got ' + n2(got) + '   ' + verdict);
  });
  if (K <= 1.1)
    say('  \u2014 at K=1 base and base/K are the same number, so this test CANNOT ' +
        'SEE a fault.\n     Zoom to \u00d73 or more and run again. (Rule 3: that is ' +
        'blindness, not a pass.)');

  /* ══ 3 · IS A MARK STILL A MARK ═════════════════════════════════════════
     THE ONE LAW OF THE FILE is that a pin and a wash are never mistaken for
     one another, and the zoom note adds that a mark holds its size while the
     world grows. Both are claims about SCREEN pixels, and neither has ever
     been measured in screen pixels. */
  head('A MARK AT THIS ZOOM \u2014 measured on screen, not in the source');
  var pin = $('.mp-pin', el);
  if (!pin) blind('.mp-pin', 'no seat drawn in this window');
  else {
    var r = pin.r ? pin.r.baseVal.value : parseFloat(pin.getAttribute('r'));
    var onScreen = r * K / uPerPx;
    say('  pin radius   ' + n2(r) + ' user units  \u00d7 K  \u00f7 fit  =  ' +
        n2(onScreen) + ' screen px');
    say('  \u2014 this number should be the SAME at every zoom. Note it, zoom, run again.');
  }
  var wash = $('.mp-wash', el);
  if (!wash) blind('.mp-wash', 'no territory drawn in this window');
  else {
    var wb; try { wb = wash.getBBox(); } catch (e) { wb = null; }
    if (!wb) blind('.mp-wash geometry', 'getBBox threw');
    else say('  smallest wash on screen  ' + Math.round(wb.width * K / uPerPx) + '\u00d7' +
             Math.round(wb.height * K / uPerPx) + ' px' +
             (wb.width * K / uPerPx < 14 ? '   \u2190 A WASH THIS SMALL READS AS A DOT' : ''));
  }

  /* ══ 4 · THE CULL'S CLAIM, TESTED ═══════════════════════════════════════
     The label cull decides what fits using an ESTIMATE — label.length * 1.45 —
     and the file's own note warns this is the trap the timeline named: the
     test and the placement share one number, so they agree with each other
     whether or not either is right. Nothing has ever compared the estimate to
     the screen. This does, with getBBox, which is the screen's own answer. */
  head('THE CULL \u2014 do the labels it KEPT actually fit');
  var named = $$('.mp-seat.mp-named .mp-name', el).filter(function (t) {
    return (t.textContent || '').trim();
  });
  if (!named.length) blind('kept labels', 'none marked .mp-named in this window');
  else {
    var rects = [], over = 0, worst = [];
    named.forEach(function (t) {
      var b; try { b = t.getBBox(); } catch (e) { return; }
      if (b && b.width) rects.push({ b: b, t: t.textContent.trim() });
    });
    for (var i = 0; i < rects.length; i++)
      for (var j = i + 1; j < rects.length; j++) {
        var a = rects[i].b, c = rects[j].b;
        if (a.x < c.x + c.width && c.x < a.x + a.width &&
            a.y < c.y + c.height && c.y < a.y + a.height) {
          over++;
          if (worst.length < 6) worst.push(rects[i].t + '  ><  ' + rects[j].t);
        }
      }
    say('  ' + rects.length + ' labels kept \u00b7 ' + over + ' OVERLAPPING PAIRS');
    if (over) {
      say('  \u2014 the cull asserted every one of these fits. The screen disagrees.');
      worst.forEach(function (w) { say('      ' + w); });
    }
    /* and the estimate against the truth, which is the whole trap */
    var est = 0, real = 0;
    rects.forEach(function (o) { est += o.t.length * 1.45 * 2; real += o.b.width; });
    if (real) say('  estimated width vs measured width   \u00d7' + n2(est / real) +
                  (Math.abs(est / real - 1) > 0.25
                    ? '   \u2190 THE CULL IS MEASURING A DIFFERENT LABEL THAN THE SCREEN DRAWS'
                    : ''));
  }

  /* ══ 5 · WHERE THE GLASS WOULD PAY ══════════════════════════════════════
     THE GROUNDWORK, and the reason this probe exists. A chart glass is worth
     building only where the clumping actually is, and nobody has counted it.

     For a glass of a given radius, this finds the densest neighbourhoods on
     the current view: how many seats fall under one glass, and how many of
     their names the cull has already dropped there. That second number is the
     payload — a dropped name is a name a reader cannot see, and a glass gives
     it back without making them leave the world view.

     The radius is in VIEWBOX UNITS, so it is a fixed circle on the world, not
     on the screen. Change GLASS_R and re-run to size the instrument. */
  head('WHERE A CHART GLASS WOULD PAY \u2014 the clumping, counted');
  var GLASS_R = 40;
  var seats = $$('.mp-seat', el).filter(function (g) {
    return !g.classList.contains('mp-out');
  });
  if (!seats.length) blind('seat density', 'no seats drawn in this window');
  else {
    /* ACCUSED 7 Sep. At K=14 this reported 27 seats under a glass over Athens
       while Athens was OFF SCREEN — the view spanned 33° to 59° east and Athens
       is at 23.7°. It was measuring the world and calling it the view, which is
       the same class of error as a probe reading a file that is not the one
       being served. The glass sits on what a reader is looking at, so only what
       a reader is looking at may be counted. */
    var visL = (0 - TX) / K, visR = (VW - TX) / K,
        visT = (0 - TY) / K, visB = (VH - TY) / K;
    var pts = [], offscreen = 0;
    seats.forEach(function (g) {
      var c = $('circle', g); if (!c) return;
      var x = parseFloat(c.getAttribute('cx')), y = parseFloat(c.getAttribute('cy'));
      if (isNaN(x) || isNaN(y)) return;
      if (x < visL || x > visR || y < visT || y > visB) { offscreen++; return; }
      var lives = (g.getAttribute('data-lives') || '').split(',').filter(Boolean).length;
      pts.push({ x: x, y: y, named: g.classList.contains('mp-named'), souls: lives || 1 });
    });
    var best = [];
    (pts || []).forEach(function (p) {
      var inR = 0, dropped = 0, souls = 0;
      pts.forEach(function (q) {
        if (Math.hypot(p.x - q.x, p.y - q.y) > GLASS_R) return;
        inR++; souls += q.souls; if (!q.named) dropped++;
      });
      best.push({ x: p.x, y: p.y, seats: inR, dropped: dropped, souls: souls });
    });
    best.sort(function (a, b) { return b.dropped - a.dropped || b.seats - a.seats; });
    /* de-duplicate: neighbourhoods that overlap are one neighbourhood */
    /* ACCUSED 7 Sep, BY ITS OWN OUTPUT. This rejected centres closer than ONE
       radius, but two circles 1.1 radii apart still overlap — so a dropped name
       in the overlap was counted by both and the total ran to 122% of its own
       denominator. A figure that exceeds what it is a fraction of is a figure
       nobody should read, and it was printed three times before anyone did.
       Two radii apart is disjoint, which is what the claim requires. */
    var picked = [];
    best.forEach(function (b) {
      if (picked.length >= 5) return;
      for (var i = 0; i < picked.length; i++)
        if (Math.hypot(b.x - picked[i].x, b.y - picked[i].y) < GLASS_R * 2) return;
      picked.push(b);
    });
    say('  glass radius ' + GLASS_R + ' viewBox units \u00b7 ' + pts.length +
        ' seats IN VIEW' + (offscreen ? ' \u00b7 ' + offscreen + ' drawn but off screen, not counted' : ''));
    if (!pts.length)
      blind('seat density', 'every seat drawn is off screen at this pan \u2014 fit the world and run again');
    if (picked.length)
    say('  ' + 'lat,lon'.padEnd(18) + 'seats  souls  NAMES DROPPED');
    picked.forEach(function (b) {
      var lon = b.x / VW * 360 - 180, lat = 90 - b.y / VH * 180;
      say('  ' + (n2(lat) + '\u00b0, ' + n2(lon) + '\u00b0').padEnd(18) +
          String(b.seats).padStart(4) + String(b.souls).padStart(7) +
          String(b.dropped).padStart(11));
    });
    var totalDropped = pts.filter(function (p) { return !p.named; }).length;
    var reach = picked.reduce(function (s, b) { return s + b.dropped; }, 0);
    if (picked.length)
    say('  ' + totalDropped + ' names dropped in this window \u00b7 ' + reach +
        ' of them (' + Math.round(reach / Math.max(1, totalDropped) * 100) +
        '%) sit under just ' + picked.length + ' glass positions.');
    if (picked.length)
    say('  \u2014 THAT PERCENTAGE IS THE CASE FOR THE INSTRUMENT. If it is low, the ' +
        'clumping is\n     spread thin and a glass buys little; if it is high, five ' +
        'placements recover\n     most of what the cull threw away.');
  }

  /* ══ 6 · WHAT THE FRAME WOULD HAVE TO SAY ═══════════════════════════════
     The graticule is drawn every 30 degrees so a reader can judge a wash
     against something — and it carries NO LABELS, so the judgement it exists
     for cannot actually be made. A degree frame fixes that. These are the
     numbers it would have to print at this zoom. */
  head('THE DEGREE FRAME \u2014 what the edges would read right now');
  var lonL = (0 - TX) / K / VW * 360 - 180, lonR = (VW - TX) / K / VW * 360 - 180;
  var latT = 90 - (0 - TY) / K / VH * 180, latB = 90 - (VH - TY) / K / VH * 180;
  say('  visible  lon ' + n2(lonL) + '\u00b0 to ' + n2(lonR) + '\u00b0   lat ' +
      n2(latT) + '\u00b0 to ' + n2(latB) + '\u00b0');
  var degPerPx = (lonR - lonL) / (box.width || 1);
  var ladder = [30, 10, 5, 1, 0.5, 0.1], tick = 30;
  for (var t = 0; t < ladder.length; t++) if (ladder[t] / degPerPx > 55) tick = ladder[t];
  say('  a tick every ' + tick + '\u00b0 keeps labels \u2265 55px apart at this zoom ' +
      '(' + n2(degPerPx * 100) / 100 + '\u00b0 per px)');
  say('  graticule is drawn every 30\u00b0 and carries NO LABELS \u2014 so the comparison ' +
      'it exists\n     for cannot be made. That is the gap the frame closes.');

  /* ══ 7 · WHAT CANNOT BE MAGNIFIED, AND WHY ══════════════════════════════ */
  head('WHAT A GLASS COULD NOT CARRY');
  var land = $('.mp-land', el), coast = $('.mp-coast', el);
  var landD = land ? (land.getAttribute('d') || '').length : -1;
  var coastD = coast ? (coast.getAttribute('d') || '').length : -1;
  say('  .mp-land  ' + landD + ' chars   WORLD.json \u2014 SCREEN COORDINATES, projection baked (#65)');
  say('  .mp-coast ' + coastD + ' chars   COAST.json \u2014 lon/lat, re-projected live');
  say('  \u2014 a glass redrawing from source can carry the coast and every mark. It ' +
      'CANNOT\n     carry the land fill or the relief clipped to it until WORLD.json ' +
      'holds lon/lat.\n     Same blocker as the globe. One un-baking unlocks both.');

  /* ══ report ═════════════════════════════════════════════════════════════
     Returned as a string. The first version of the hall probe styled its
     output and Safari filed it under a hidden category: it ran perfectly and
     printed nothing a reader could see, which is the failure it existed to
     catch, committed by the probe itself. */
  var out = ['',
    '='.repeat(66),
    '  MAP PROBE \u00b7 the architecture  \u00b7  ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
    '='.repeat(66),
    L.join('\n')];
  out.push('');
  out.push('\u2500\u2500 UNREAD ' + '\u2500'.repeat(55));
  out.push(UNREAD.length
    ? '  ' + UNREAD.join('\n  ') +
      '\n  \u2014 these are things this probe COULD NOT SEE. None of them is a fault.'
    : '  nothing \u2014 every test above had something real to measure.');
  out.push('');
  out.push('='.repeat(66));
  var report = out.join('\n');

  /* ── IT HANDS BACK A FILE, NOT A SELECTION ────────────────────────────────
     A probe whose output must be scrolled, selected and copied out of a console
     costs the captain a minute every run, and by Rule 4 a probe does not get to
     spend the captain's minutes. So it writes a .txt and downloads it.

     THE DOCTRINE SAYS IT READS ONLY, AND THIS IS THE EDGE OF THAT. It still
     touches nothing on the map: it appends a detached anchor to <body>, clicks
     it, and removes it in the same tick. The surface, the registers and the DOM
     the map owns are untouched. Stated here rather than glossed, because the
     line is real and this is standing on it.

     RULE 3: if the download is refused — a sandbox, a blocked blob, a browser
     that will not — that is the instrument being prevented, not a fault. It
     says so and the text is returned anyway, so nothing is ever lost to it. */
  try {
    var stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
    var blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = 'map-probe-' + stamp + '-K' + n2(K) + '.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    report += '\n  ↓ written to ' + a.download + ' in your downloads folder.\n';
  } catch (e) {
    report += '\n  UNREAD — could not write the .txt (' +
              String(e.message || e).slice(0, 60) + ').\n' +
              '  The report above is complete; only the download was refused.\n';
  }
  return report;
})();
