/* ============================================================================
   amenti-timeline.js  ·  WHERE YOU ARE IN TIME
   ----------------------------------------------------------------------------
   A SHARED SCRIPT, NOT A PAGE. Like library.js, it is never visited directly.
   Any surface includes it and calls:

       window.AmentiTimeline.place('brutus')          // one room key
       window.AmentiTimeline.place(['brutus','livy']) // several; the FIRST wins
       window.AmentiTimeline.clear()

   It mounts itself once, on first use, and thereafter redraws in place.

   ── WHY IT EXISTS ────────────────────────────────────────────────────────
   Narrative history hides simultaneity. It is organised by subject, and a
   time-slice cuts across every subject at once, so reading about Cleopatra
   never gives you who else was breathing. The roster already contains those
   relationships \u2014 1,011 souls with a birth and a death \u2014 and until now
   nothing displayed them.

   The reading that made the case: at 509 BC, while Brutus expels the Tarquins,
   the Buddha, Confucius and Sun Tzu are all alive. That reorganises a period
   in one glance and it needs no citation, because it is a fact about the
   ship's own register.

   ── WHERE IT LIVES, AND WHY THAT IS THE DESIGN ───────────────────────────
   The hall has a second state: a click anywhere that is not a control toggles
   `body.scene-bare`, which hides #hall-main and leaves the image.

   THIS BUILDS BEHIND THE READING, WHILE YOU READ. It is not summoned and it
   does not load on click. When the reading goes, the timeline is REVEALED \u2014
   which says something a summoned panel cannot: the position was always true.
   You were reading Josephus at AD 37\u2013100 the whole time.

   Because scene-bare hides #hall-main entirely, this cannot live inside it.
   It mounts as a sibling of the page body and shows the way #scene-hint does.

   ── THE FIXED WINDOW ─────────────────────────────────────────────────────
   200 years, always, centred on the MIDPOINT of the anchor figure.

   FIXED so the scale never changes. A reader learns what a century looks like
   once, and every answer afterwards reads against the same ruler \u2014 Brutus at
   509 BC becomes directly comparable to Josephus at AD 37. A window sized to
   each figure would quietly destroy that.

   MIDPOINT, not birth. Josephus centred on his midpoint runs about \u221232 to
   168: Actium and Cleopatra at the left edge, Tacitus and Plutarch at the
   right. Centred on birth it would run 37\u2013237 \u2014 everything after him and
   nothing before, losing the world he was born into, which is half of what
   makes the reading work.

   ── ORDERED BY DEATH YEAR, BECAUSE THE HELIX IS ──────────────────────────
   Page2 computes: anchorYear = !isNaN(effectiveDeath) ? effectiveDeath
                                                      : birthYear
   This matches it EXACTLY, fallback included. Not because ordering by death
   reads better, but because THE TWO VIEWS MUST AGREE: scroll to a year here
   and the same figures must sit where the helix puts them. Order by birth and
   they diverge subtly, which is the drift this yard spends its time removing.
   The roster has no soul without a death year today; the fallback is here so
   that the day one appears, the two views still agree.
   ========================================================================== */

(function () {
  'use strict';

  var RAW        = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var SPAN       = 200;     /* years in the window. FIXED. See the header. */
  var PX_PER_YR  = 6;       /* rail scale; SPAN * PX_PER_YR = the viewport */
  var ROW_H      = 34;
  var BAR_H      = 26;
  var AXIS_H     = 76;
  var LABEL_MIN  = 130;     /* below this a bar cannot hold its own name */
  var PAD        = 20;

  /* An "eternal" is a god, not a person with a very long life. Apollo runs
     \u221210000 to \u22123000 \u2014 a 7,000-year bar that would cross any window with no
     ends and dominate it. The roster is not wrong; they are a different KIND
     of entry, and a timeline that treats one as a person is making a category
     error the register did not make. Kept off the person axis entirely. */
  var ETERNAL_YEARS = 1000;

  /* A death year at or beyond the current year means LIVING, not dead \u2014 200
     souls of 1,011 carry it. Drawing an end mark there would state something
     false about a fifth of the roster. Their bars run open. */
  var THIS_YEAR = new Date().getUTCFullYear();

  var souls = null, byKey = null, events = null, mounted = null, anchorKey = null;

  /* ── the registers ────────────────────────────────────────────────────── */

  function get(url, asJson) {
    return fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(url.split('/').pop() + ' \u2014 ' + r.status);
        return asJson ? r.json() : r.text();
      });
  }

  function load() {
    if (souls && events) return Promise.resolve();
    return Promise.all([
      get(RAW + 'ROSTER-INDEX.json', true).then(function (d) {
        souls = (d.souls || []).filter(function (s) {
          return typeof s.b === 'number' && typeof s.d === 'number';
        });
        byKey = {};
        souls.forEach(function (s) {
          byKey[s.k] = s;
          (s.keys || []).forEach(function (k) { byKey[k] = s; });
        });
      }),
      /* EVENTS.csv is the anchors. If it cannot be read the timeline still
         draws people and says so \u2014 an axis with no ticks is a smaller loss
         than no timeline, and a silent one would be a lie. */
      get(RAW + 'EVENTS.csv', false).then(function (t) { events = parseEvents(t); },
                                          function ()  { events = null; })
    ]);
  }

  /* The same tolerant shape Page2's ingestCsvText uses: quotes stripped,
     commas honoured inside them, header skipped when cell one is not a number. */
  function parseEvents(text) {
    var out = [], lines = String(text).replace(/\r\n/g, '\n').split('\n');
    lines.forEach(function (line, n) {
      if (!line.trim()) return;
      var cells = [], cur = '', q = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { cells.push(cur); cur = ''; continue; }
        cur += c;
      }
      cells.push(cur);
      cells = cells.map(function (x) { return x.trim(); });
      var y = parseFloat(cells[0]);
      if (isNaN(y)) return;                       /* header, or a bad row */
      out.push({ y: y, name: cells[1] || '', cat: cells[2] || 'event' });
    });
    return out;
  }

  /* ── the frame ────────────────────────────────────────────────────────── */

  function mount() {
    if (mounted) return mounted;

    var css = document.createElement('style');
    css.textContent = [
      /* Hidden with the same shape #scene-hint uses, so it appears exactly
         when the reading leaves and by the same rule. */
      '#amenti-timeline{position:fixed;inset:0;z-index:3;opacity:0;visibility:hidden;',
      '  transition:opacity .45s ease .15s, visibility .45s;',
      '  font:400 12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#93a1b8}',
      'body.scene-bare #amenti-timeline{opacity:1;visibility:visible}',
      /* A scrim, not a plate behind every row. Outlined bars put their labels
         straight onto the photograph; over a dark sky that is fine, over a lit
         pyramid it is not. */
      '#amenti-timeline .tl-scrim{position:absolute;inset:0;background:rgba(6,7,14,.72);pointer-events:none}',
      '#amenti-timeline .tl-axis{position:absolute;left:0;right:0;top:0;height:' + AXIS_H + 'px;',
      '  overflow:hidden;pointer-events:none;z-index:2}',
      '#amenti-timeline .tl-rail{position:absolute;left:0;right:0;top:' + AXIS_H + 'px;bottom:52px;',
      '  overflow:auto;cursor:grab;overscroll-behavior:contain;',
      '  scrollbar-width:thin;scrollbar-color:#2a3346 transparent}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar{width:7px;height:7px}',
      '#amenti-timeline .tl-rail::-webkit-scrollbar-thumb{background:#2a3346;border-radius:4px}',
      '#amenti-timeline .tl-foot{position:absolute;left:0;right:0;bottom:26px;',
      '  display:flex;justify-content:space-between;padding:0 ' + PAD + 'px;',
      '  letter-spacing:.06em;color:#4f5a6d;pointer-events:none}',
      '#amenti-timeline .tl-back{pointer-events:auto;cursor:pointer;color:#c9a227;',
      '  background:none;border:0;font:inherit;letter-spacing:.06em;opacity:0;transition:opacity .3s}',
      '#amenti-timeline .tl-back.on{opacity:1}',
      '#amenti-timeline text{cursor:default}',
      '#amenti-timeline .room{cursor:pointer}'
    ].join('');
    document.head.appendChild(css);

    var root = document.createElement('div');
    root.id = 'amenti-timeline';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="tl-scrim"></div>' +
      '<div class="tl-axis"><svg class="tl-axis-svg"></svg></div>' +
      '<div class="tl-rail"><svg class="tl-rows"></svg></div>' +
      '<div class="tl-foot"><span class="tl-win"></span>' +
      '<button class="tl-back" type="button">\u2039 back to the figure</button>' +
      '<span class="tl-count"></span></div>';
    document.body.appendChild(root);

    var rail = root.querySelector('.tl-rail');
    var axis = root.querySelector('.tl-axis');

    /* The axis must not scroll away vertically \u2014 a reader three hundred rows
       down is looking at bars with no idea when. It is a separate layer and
       follows the rail HORIZONTALLY only. */
    rail.addEventListener('scroll', function () {
      axis.scrollLeft = rail.scrollLeft;
      axis.firstChild.style.transform = 'translateX(' + (-rail.scrollLeft) + 'px)';
      onScroll();
    });

    var down = false, x0 = 0, y0 = 0, sx = 0, sy = 0;
    rail.addEventListener('pointerdown', function (e) {
      down = true; x0 = e.clientX; y0 = e.clientY; sx = rail.scrollLeft; sy = rail.scrollTop;
      rail.style.cursor = 'grabbing';
    });
    window.addEventListener('pointerup', function () { down = false; rail.style.cursor = 'grab'; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      rail.scrollLeft = sx - (e.clientX - x0);
      rail.scrollTop  = sy - (e.clientY - y0);
    });

    root.querySelector('.tl-back').addEventListener('click', function (e) {
      e.stopPropagation();               /* do not toggle scene-bare */
      if (anchorKey) centreOn(anchorKey);
    });

    mounted = root;
    return root;
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */

  var state = { rows: [], min: 0, max: 0, centre: 0 };

  function yearLabel(y) {
    y = Math.round(y);
    return y < 0 ? Math.abs(y) + ' bc' : (y === 0 ? '1 bc' : 'ad ' + y);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function draw(anchor) {
    var root = mount();
    var eternal = function (s) { return (s.d - s.b) >= ETERNAL_YEARS; };

    /* Everyone but the gods, ordered by DEATH \u2014 the ship's convention, with
       Page2's own fallback to birth for a soul that somehow has no death. */
    var rows = souls.filter(function (s) { return !eternal(s); })
                    .sort(function (a, b) {
                      var A = typeof a.d === 'number' ? a.d : a.b;
                      var B = typeof b.d === 'number' ? b.d : b.b;
                      return A - B || a.b - b.b;
                    });

    state.rows = rows;
    state.min = rows.length ? Math.min.apply(null, rows.map(function (s) { return s.b; })) : -1000;
    state.max = rows.length ? Math.max.apply(null, rows.map(function (s) { return s.d; })) : THIS_YEAR;

    var W = (state.max - state.min) * PX_PER_YR;
    var H = rows.length * ROW_H + 40;
    var X = function (y) { return (y - state.min) * PX_PER_YR; };

    /* rows */
    var svg = root.querySelector('.tl-rows');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    var p = [];
    rows.forEach(function (s, i) {
      var y = 12 + i * ROW_H;
      var x = X(s.b), w = Math.max(4, (s.d - s.b) * PX_PER_YR);
      var living = s.d >= THIS_YEAR;
      var isAnchor = anchor && (s.k === anchor.k);
      var stroke = isAnchor ? '#c9a227' : (s.r ? '#4a8f9e' : '#5a6a82');
      var sw     = isAnchor ? 1.5 : (s.r ? 1.25 : 0.75);
      var fill   = isAnchor ? '#c9a227' : (s.r ? '#5fb3c4' : '#93a1b8');

      p.push('<g class="' + (s.r ? 'room' : '') + '"' +
             (s.r ? ' data-key="' + esc(s.k) + '"' : '') + '>');
      p.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + BAR_H +
             '" rx="4" fill="none" stroke="' + stroke + '" stroke-width="' + sw +
             (living ? '" stroke-dasharray="1 0 1 0' : '') + '"/>');
      /* A living soul's bar has no closing edge \u2014 it has not ended. */
      if (living) p.push('<rect x="' + (x + w - 2) + '" y="' + (y - 1) + '" width="4" height="' +
                         (BAR_H + 2) + '" fill="rgba(6,7,14,.85)"/>');

      var name = esc(s.n);
      if (w >= LABEL_MIN) {
        p.push('<text x="' + (x + 12) + '" y="' + (y + 17) + '" fill="' + fill + '">' + name + '</text>');
        if (w >= LABEL_MIN + 90)
          p.push('<text x="' + (x + w - 12) + '" y="' + (y + 17) + '" text-anchor="end" fill="' +
                 (isAnchor ? '#8a7430' : '#5f6b80') + '">' +
                 s.b + '\u2014' + (living ? '' : s.d) + '</text>');
      } else {
        /* Below LABEL_MIN the bar cannot hold its own name. Outside, at a
           consistent distance, so the mixed treatment still reads as one rule. */
        p.push('<text x="' + (x + w + 10) + '" y="' + (y + 17) + '" fill="' + fill + '">' + name + '</text>');
      }
      p.push('</g>');
    });
    svg.innerHTML = p.join('');

    svg.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('.room');
      if (!g) return;
      e.stopPropagation();
      var k = g.getAttribute('data-key');
      if (window.Amenti && typeof window.Amenti.openReadingRoom === 'function') {
        try { window.Amenti.openReadingRoom(k); return; } catch (err) {}
      }
      window.location.href = 'Page1.html#terminal/' + k;
    });

    /* axis: the years, and the events as ticks. Events are a MOMENT, not a
       span, so they live on the axis and never among the rows \u2014 in a row they
       would read as very short lives. */
    var a = [], step = 50;
    for (var yr = Math.ceil(state.min / step) * step; yr <= state.max; yr += step) {
      a.push('<line x1="' + X(yr) + '" y1="52" x2="' + X(yr) + '" y2="' + AXIS_H + '" stroke="#2a3346" stroke-width="0.5"/>');
      a.push('<text x="' + X(yr) + '" y="46" text-anchor="middle" fill="#4f5a6d">' + yearLabel(yr) + '</text>');
    }
    if (events) events.forEach(function (ev) {
      if (ev.y < state.min || ev.y > state.max) return;
      a.push('<line x1="' + X(ev.y) + '" y1="' + (AXIS_H - 16) + '" x2="' + X(ev.y) + '" y2="' + AXIS_H + '" stroke="#c9a227" stroke-width="0.75"/>');
      a.push('<text x="' + X(ev.y) + '" y="' + (AXIS_H - 20) + '" text-anchor="middle" fill="#7d6618">' + esc(ev.name) + '</text>');
    });
    var asvg = root.querySelector('.tl-axis-svg');
    asvg.setAttribute('width', W); asvg.setAttribute('height', AXIS_H);
    asvg.innerHTML = a.join('');
  }

  function centreOn(key) {
    var s = byKey[key];
    if (!s || !mounted) return;
    var mid  = s.b + (s.d - s.b) / 2;
    var rail = mounted.querySelector('.tl-rail');
    var vw   = rail.clientWidth || (SPAN * PX_PER_YR);
    rail.scrollLeft = (mid - state.min) * PX_PER_YR - vw / 2;
    var i = state.rows.indexOf(s);
    if (i > -1) rail.scrollTop = Math.max(0, 12 + i * ROW_H - rail.clientHeight / 2);
    state.centre = mid;
    onScroll();
  }

  function onScroll() {
    if (!mounted) return;
    var rail = mounted.querySelector('.tl-rail');
    var vw   = rail.clientWidth || (SPAN * PX_PER_YR);
    var from = state.min + rail.scrollLeft / PX_PER_YR;
    var to   = from + vw / PX_PER_YR;

    var alive = state.rows.filter(function (s) { return s.b <= to && s.d >= from; }).length;
    var evs   = events ? events.filter(function (e) { return e.y >= from && e.y <= to; }).length : 0;

    mounted.querySelector('.tl-win').textContent =
      yearLabel(from) + ' \u2014 ' + yearLabel(to) + ' \u00b7 ' + Math.round(to - from) + ' years';
    mounted.querySelector('.tl-count').textContent =
      alive + ' alive here \u00b7 ' + (events ? evs + ' events' : 'events could not be read');

    /* The anchor can be scrolled away from. Say so, and offer the way back \u2014
       a view you can get lost in with no return is a trap, which is the same
       reason #scene-hint exists. */
    var back = mounted.querySelector('.tl-back');
    var a = anchorKey && byKey[anchorKey];
    var away = a && (a.d < from || a.b > to);
    back.classList.toggle('on', !!away);
  }

  /* ── the public surface ───────────────────────────────────────────────── */

  window.AmentiTimeline = {
    /* Called with whatever the answer opened. The FIRST key wins: the router
       ranks by relevance, so room one is the question's subject and the rest
       are supporting. Rooms in other centuries fall off-screen, which is
       honest \u2014 the answer's own coverage line states which were opened. */
    place: function (keys) {
      var list = [].concat(keys || []).filter(Boolean);
      return load().then(function () {
        var anchor = null;
        for (var i = 0; i < list.length && !anchor; i++) {
          var cand = byKey[list[i]];
          /* FOUND BY ATTACK. place('apollo') used to return TRUE and centre on
             −6500, where nothing lives — an empty screen the caller believed
             had worked. The gods are deliberately off the person axis, so there
             is no position to show. Skip them and try the next key; if none of
             the keys is placeable, say so rather than drawing emptiness. */
          if (cand && (cand.d - cand.b) < ETERNAL_YEARS) anchor = cand;
        }
        if (!anchor) return false;      /* nothing placeable: draw nothing */
        anchorKey = anchor.k;
        draw(anchor);
        centreOn(anchor.k);
        return true;
      }, function () { return false; });
    },
    clear: function () { if (mounted) mounted.remove(); mounted = null; anchorKey = null; },
    _souls: function () { return souls; }
  };
})();
