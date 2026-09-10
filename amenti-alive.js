/* ============================================================================
   amenti-alive.js  →  Amenti.live/amenti-alive.js
   ----------------------------------------------------------------------------
   WHO WAS ALIVE WHILE THIS WAS HAPPENING

   The ground shows one place through time. This says who was standing in the
   world at the year the clock is on \u2014 twenty to thirty souls at any moment,
   out of two thousand and forty-three.

   In 490 BC, while the Persians were landing at Marathon, GAUTAMA BUDDHA AND
   CONFUCIUS WERE ALIVE. Neither is in this frame and neither is in EVENTS.csv,
   and the surface had no way to say so.

   ── WHY THE ROSTER AND NOT THE EVENT REGISTER ────────────────────────────
   EVENTS.csv was tried first and is too thin for this. 536 world events across
   eleven thousand years is one every twenty, and the two nearest Marathon are
   Marathon and Thermopylae \u2014 both already drawn on the surface a reader is
   looking at. A panel that answers `what else was happening` with `the thing
   you are looking at` is worse than none.

   The roster is dense where the event register is sparse: 2,043 souls with
   dates, twenty to thirty of them alive in any given year.

   ── IT IS A COLLISION, NOT A RECORD ──────────────────────────────────────
   NOBODY WROTE DOWN THAT BUDDHA AND MILTIADES WERE CONTEMPORARIES. It is
   arithmetic on two lifespans, and it is exactly as true as its two parents
   and no truer. A soul whose dates are a scholarly guess contributes that
   guess to every year it touches.

   So the panel says `alive at the same time` and never `met`, `knew`, or
   `influenced`. The join is a coincidence of dates and the reader is told it
   is one.

   ── AND ROOMS COME FIRST ─────────────────────────────────────────────────
   Of 2,043 souls, 55 have a reading room and 54 have a plate. Those are the
   ones a reader can actually go and read, so they sort first. THE ORDER IS
   WHAT THIS LIBRARY CAN GIVE YOU, not a ranking of who mattered \u2014 which the
   register does not hold and this must not invent.

   ── IT COSTS NOTHING ─────────────────────────────────────────────────────
   One JSON, already on the page, filtered in the browser. No model, no call.

   ── AND IT READS THE SCRUB, NOT THE SETTER ───────────────────────────────
   AmentiAttica.year() IS A SETTER THAT LOOKS LIKE A GETTER: called with no
   argument it sets the year to null and turns the clock off. Anything reading
   the year through it would silently change what it was measuring. So this
   reads the scrub element and the clock's own off state.
   ========================================================================== */
(function () {
  'use strict';

  var RAW = 'https://raw.githubusercontent.com/ianingram/Amenti.live/main/';
  var souls = null, err = null, loading = null;
  var panel = null, open = false, timer = null, seen = 'x';

  function load() {
    if (souls || err) { return Promise.resolve(); }
    if (loading) { return loading; }
    loading = fetch(RAW + 'ROSTER-INDEX.json?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var rows = Array.isArray(j) ? j : (j && (j.souls || j.rows)) || null;
        if (!rows) { err = 'ROSTER-INDEX.json did not parse'; return; }
        souls = rows.filter(function (x) {
          return x && typeof x.b === 'number' && typeof x.d === 'number';
        });
      })
      .catch(function (e) { err = e.message; });
    return loading;
  }

  /* b and d are birth and death. A soul with either missing is not counted and
     is not guessed at \u2014 a lifespan invented to fill a column would put people
     in years they may never have seen. */
  function at(year) {
    if (!souls || year === null || year === undefined) { return []; }
    var y = +year;
    return souls.filter(function (x) { return x.b <= y && y <= x.d; })
      .sort(function (a, b) {
        /* a room first, then a plate, then by how long they had left \u2014 which
           is not importance and is not claimed to be */
        var ar = (a.r ? 2 : 0) + (a.p ? 1 : 0), br = (b.r ? 2 : 0) + (b.p ? 1 : 0);
        if (ar !== br) { return br - ar; }
        return (b.d - y) - (a.d - y);
      });
  }

  function yr(y) {
    return y < 0 ? Math.abs(y) + ' BC' : String(y) + (y < 1000 ? ' AD' : '');
  }

  /* the clock, read from its own controls */
  function clock() {
    var host = document.getElementById('amenti-attica');
    if (!host) { return { on: false, year: null, absent: true }; }
    var sc = host.querySelector('.at-scrub');
    var off = host.querySelector('.at-clockoff');
    if (!sc) { return { on: false, year: null, absent: true }; }
    var isOff = off && off.getAttribute('aria-pressed') === 'true';
    return { on: !isOff, year: isOff ? null : +sc.value, absent: false };
  }

  function style() {
    if (document.getElementById('alive-css')) { return; }
    var s = document.createElement('style');
    s.id = 'alive-css';
    s.textContent = [
      '#amenti-alive{position:fixed;left:14px;bottom:14px;z-index:9997;',
      '  font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#7d8ea6}',
      '#amenti-alive .al-tab{background:rgba(5,8,14,.86);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:3px;padding:3px 9px;cursor:pointer;color:#5d6e84;',
      '  letter-spacing:.05em;font:inherit}',
      '#amenti-alive .al-tab:hover{color:#dbe8f5;border-color:#4b647d}',
      '#amenti-alive .al-tab b{color:#7fd8f0;font-weight:400}',
      '#amenti-alive .al-body{background:rgba(5,8,14,.94);border:1px solid rgba(43,58,80,.6);',
      '  border-radius:4px;padding:10px 12px;margin-bottom:6px;width:250px;',
      '  max-height:52vh;overflow:auto;box-sizing:border-box}',
      '#amenti-alive .al-h{color:#5d6e84;letter-spacing:.08em;font-size:9.5px;',
      '  padding-bottom:5px;margin-bottom:6px;border-bottom:1px solid rgba(43,58,80,.6)}',
      '#amenti-alive .al-n{display:flex;justify-content:space-between;gap:8px;',
      '  padding:1px 0;color:#c3d3e6}',
      '#amenti-alive .al-n em{font-style:normal;color:#4d5c70;font-size:9px;',
      '  white-space:nowrap}',
      '#amenti-alive .al-room{color:#7fd8f0}',
      '#amenti-alive .al-sub{color:#4d5c70;font-size:9px;margin-top:8px;padding-top:6px;',
      '  border-top:1px solid rgba(43,58,80,.4);line-height:1.5}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function mount() {
    if (panel) { return; }
    style();
    panel = document.createElement('div');
    panel.id = 'amenti-alive';
    panel.innerHTML = '<div class="al-body" style="display:none"></div>' +
                      '<button type="button" class="al-tab">who else</button>';
    document.body.appendChild(panel);
    panel.querySelector('.al-tab').addEventListener('click', function () {
      open = !open;
      panel.querySelector('.al-body').style.display = open ? '' : 'none';
      seen = 'x';
      if (open) { load().then(tick); watch(); } else { unwatch(); }
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function tick() {
    if (!panel || !open) { return; }
    var c = clock();
    var key = c.absent ? 'absent' : (c.on ? String(c.year) : 'off');
    if (key === seen) { return; }
    seen = key;
    var b = panel.querySelector('.al-body'), tab = panel.querySelector('.al-tab');

    if (err) {
      tab.textContent = 'who else';
      b.innerHTML = '<div class="al-sub">' + esc(err) + ' \u2014 nothing can be read.</div>';
      return;
    }
    if (c.absent) {
      tab.textContent = 'who else';
      b.innerHTML = '<div class="al-h">the ground is not open</div>' +
        '<div class="al-sub">This follows the year on the map. Open the ground ' +
        'and set the clock, and it will say who was alive in that year.</div>';
      return;
    }
    if (!c.on) {
      tab.textContent = 'who else';
      b.innerHTML = '<div class="al-h">the clock is off</div>' +
        '<div class="al-sub">THIS NEEDS A YEAR. With the clock off the map is ' +
        'showing a whole period, and nobody is alive in a period \u2014 they are ' +
        'alive in a year. Set the temporal toggle and this fills.</div>';
      return;
    }

    var list = at(c.year);
    tab.innerHTML = 'who else \u00b7 <b>' + list.length + '</b>';
    var rows = list.slice(0, 40).map(function (x) {
      return '<div class="al-n"><span' + (x.r ? ' class="al-room"' : '') + '>' +
        esc(x.n) + '</span><em>' + yr(x.b) + '\u2013' + yr(x.d) +
        (x.r ? ' \u00b7 room' : '') + '</em></div>';
    }).join('');

    b.innerHTML =
      '<div class="al-h">alive in ' + yr(c.year) + ' \u00b7 ' + list.length + ' souls</div>' +
      (rows || '<div class="al-sub">nobody on the roster spans this year.</div>') +
      (list.length > 40 ? '<div class="al-sub">' + (list.length - 40) +
        ' more, not listed.</div>' : '') +
      '<div class="al-sub">ALIVE AT THE SAME TIME, AND NOTHING MORE. This is ' +
      'two dates overlapping, not a record that anyone met or knew of anyone. ' +
      'It is exactly as true as the dates it rests on. Blue names have a ' +
      'reading room and can be read.</div>';
  }

  /* the scrub fires no event this can listen for, so it looks. Only while
     open, and it redraws only when the year actually changes. */
  function watch() { if (!timer) { timer = setInterval(tick, 400); } }
  function unwatch() { if (timer) { clearInterval(timer); timer = null; } }

  function arrive() {
    if (!document.body) { setTimeout(arrive, 200); return; }
    mount();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrive);
  } else { arrive(); }

  window.AmentiAlive = {
    at: function (y) { return load().then(function () {
      return at(y).map(function (x) {
        return { name: x.n, key: x.k, born: x.b, died: x.d, room: !!x.r, plate: !!x.p };
      });
    }); },
    count: function (y) { return load().then(function () { return at(y).length; }); },
    open: function () { if (!open) { panel.querySelector('.al-tab').click(); } }
  };
})();
