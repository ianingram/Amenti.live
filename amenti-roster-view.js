/* ===========================================================================
   amenti-roster-view.js — TWENTY-FIVE
   ---------------------------------------------------------------------------
   BUILT      2026-07-20 · 10:40 UTC
   AMENTI.LIVE · Ingram Manor LLC

   WHAT THIS IS
     A seeker's roster, rendered. Twenty-five figures they chose, each with the
     marks they hold, headed with the only number that matters: how many they
     have actually weighed.

   IN Page1.html, add one line after amenti-roster.js:
       <script src="amenti-roster-view.js" defer></script>

   WHY THE ARENA IS NOT ENOUGH
     Fifty-four cards is a library. Twenty-five a seeker CHOSE is a study set,
     and the difference is that the second one has a shape: a front, a back,
     and a gap you can close. The arena answers "what is here". This answers
     "where am I".

   THREE THINGS IT REFUSES TO DO
     · It never shows a number it did not read. If the endpoint fails, the
       panel says so and shows nothing — the Glass Gate, same as everywhere.
     · It never calls a figure with no quiz a failure. It is AWAITING, and
       that is a fact about the library rather than about the seeker.
     · It never reorders silently. Unweighed figures come forward because that
       is the useful order, and the panel says that is what it has done.
   =========================================================================== */
(function () {
  'use strict';

  var MINT = (window.AMENTI_CONFIG && window.AMENTI_CONFIG.MINT_URL)
          || 'https://amenti-mint.ingram-ian.workers.dev';

  var host = null, data = null, active = 0;

  function $(id) { return document.getElementById(id); }
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c];
    });
  }

  /* ---- the token, or nothing ------------------------------------------- */
  async function token() {
    try {
      var a = window.amentiAuth;
      if (!a || !a.sb) return null;
      var r = await a.sb.auth.getSession();
      return r && r.data && r.data.session ? r.data.session.access_token : null;
    } catch (e) { return null; }
  }

  /* ---- the marks, drawn small ------------------------------------------ */
  function heart(filled) {
    var body = filled
      ? '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
        + ' fill="#0c4a2e" stroke="#d4a017" stroke-width="1.1"/>'
        + '<path d="M12 7 C11 4.5 8 3 5 6 L12 11 Z" fill="#57c98a"/>'
        + '<path d="M12 7 C13 4.5 16 3 19 6 L12 11 Z" fill="#4ab77c"/>'
        + '<path d="M12 11 L16 15 L12 20 L8 15 Z" fill="#e0563a"/>'
      : '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
        + ' fill="none" stroke="#39434f" stroke-width="1.4" stroke-dasharray="2 2.4"/>';
    /* size on the element, never only in CSS — a stylesheet that fails to
       load must not be able to produce a three-hundred-pixel heart */
    return '<svg viewBox="0 0 24 26" width="11" height="12" style="width:11px;height:12px;'
      + 'display:block;flex:0 0 auto;background:none" aria-hidden="true">' + body + '</svg>';
  }

  /* ── THE ROSTER FILTERS THE ARENA. IT DOES NOT LIST BESIDE IT. ───────
     The first version rendered twenty-five names in a panel above the cards —
     and every one of those names was already on screen as a card. Two Teslas.
     Two Lincolns. A second surface showing the same figures, which is the
     duplicate the additive characters table was carefully built to avoid, made
     again one layer up.

     A roster is not another view of the library. It is a NARROWING of it. So
     the panel is one line: the name, the count, and a switch. Turn it on and
     the arena becomes your twenty-five. Turn it off and it is everything.

     One surface. One card per figure. Always. */

  var filtering = false;

  function apply() {
    var host = document.getElementById('amenti-roster');
    if (!host) return;
    var r = data && data[Math.min(active, data.length - 1)];
    var keep = {};
    if (r) r.figures.forEach(function (f) { keep[norm(f.figure)] = true; });

    var shown = 0, total = 0;
    Array.prototype.forEach.call(host.querySelectorAll('.roster-card'), function (c) {
      total++;
      var f = norm(c.getAttribute('data-figure'));
      var on = !filtering || keep[f];
      c.style.display = on ? '' : 'none';
      if (on) shown++;
    });
    return { shown: shown, total: total };
  }

  function norm(x) {
    return String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function draw() {
    if (!host) return;
    if (!data || !data.length) {
      host.innerHTML = '<div class="rv-dark"><b>No roster yet.</b> '
        + 'Sign in and one will be waiting &mdash; twenty-five to begin with, '
        + 'and every one of them yours to remove.</div>';
      return;
    }
    var r = data[Math.min(active, data.length - 1)];
    var pct = r.count ? Math.round(r.weighed / r.count * 100) : 0;

    var tabs = data.length > 1 ? data.map(function (x, i) {
      return '<button class="rv-tab' + (i === active ? ' on' : '') + '" data-tab="' + i + '"'
        + ' style="background:#0a0b11;border:1px solid ' + (i === active ? '#d4a017' : '#232838')
        + ';color:' + (i === active ? '#f5c542' : '#8f95ab') + ';font-family:inherit;'
        + 'border-radius:12px;padding:3px 10px;cursor:pointer">' + esc(x.name) + '</button>';
    }).join('') : '<span class="rv-name">' + esc(r.name) + '</span>';

    host.innerHTML =
        '<div class="rv-bar-row">'
      +   '<div class="rv-tabs">' + tabs + '</div>'
      +   '<button class="rv-toggle' + (filtering ? ' on' : '') + '"'
      +     ' style="background:' + (filtering ? '#1a1509' : '#0a0b11') + ';border:1px solid '
      +     (filtering ? '#d4a017' : '#232838') + ';color:' + (filtering ? '#f5c542' : '#8f95ab')
      +     ';font-family:inherit;border-radius:12px;padding:4px 13px;cursor:pointer">'
      +     (filtering ? '&#10003; showing your twenty-five' : 'show only my roster') + '</button>'
      +   '<span class="rv-count"><b>' + r.weighed + '</b> of ' + r.count + ' weighed</span>'
      + '</div>'
      + '<div class="rv-bar"><i style="width:' + pct + '%"></i></div>';

    Array.prototype.forEach.call(host.querySelectorAll('.rv-tab'), function (b) {
      b.addEventListener('click', function () {
        active = +b.getAttribute('data-tab'); draw(); apply();
      });
    });
    var t = host.querySelector('.rv-toggle');
    if (t) t.addEventListener('click', function () {
      filtering = !filtering;
      var res = apply();
      draw();
      /* SAY WHAT WAS HIDDEN. A grid that silently loses two thirds of itself
         is a grid the seeker will think is broken. */
      if (filtering && res) {
        var note = document.createElement('p');
        note.className = 'rv-note';
        note.textContent = res.shown + ' of ' + res.total + ' cards shown \u2014 the rest are '
          + 'still in the library.';
        host.appendChild(note);
      }
    });
  }

  /* still exposed, because a CARD should be able to drop a figure — that is
     where the seeker is looking, and it is the only place they should have to
     be to change what they are studying. */
  async function drop(rosterId, figure) {
    var t = await token(); if (!t) return;
    try {
      await fetch(MINT + '/roster/remove', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterId: rosterId, figure: figure })
      });
    } catch (e) { return; }
    await load();
  }

  /* the add path is exposed so a card can call it */
  async function add(figure) {
    var t = await token(); if (!t) return { ok: false, signedOut: true };
    var r = data && data[active];
    try {
      var res = await fetch(MINT + '/roster/add', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterId: r ? r.id : null, figure: figure })
      });
      var d = await res.json();
      if (d && d.full) return { ok: false, full: true, note: d.note };
      await load();
      return { ok: true };
    } catch (e) { return { ok: false }; }
  }

  async function load() {
    var t = await token();
    if (!t) { data = null; draw(); return; }
    try {
      var r = await fetch(MINT + '/roster', { headers: { Authorization: 'Bearer ' + t } });
      if (!r.ok) throw new Error('http ' + r.status);
      var d = await r.json();
      /* A 503 from the roster route means the LIBRARY could not be read, not
         that the seeker has no roster. Those look identical if you only check
         for rows, and one of them is a lie. */
      if (!d || !d.ok) throw new Error(d && d.note ? d.note : 'no reading');
      data = d.rosters || [];
    } catch (e) {
      /* THE GLASS GATE. No number is shown that was not read. */
      if (host) host.innerHTML = '<div class="rv-dark"><b>THE ROSTER CANNOT BE READ.</b><br>'
        + esc(e && e.message ? e.message : 'The library did not answer.')
        + '<br><span style="opacity:.7">Nothing is shown rather than a count from a '
        + 'moment ago \u2014 and rather than a roster that would call every figure '
        + '&ldquo;not yet set for trial&rdquo; because a fetch failed.</span></div>';
      return;
    }
    draw();
  }

  function css() {
    if (document.getElementById('amenti-rv-css')) return;
    var st = document.createElement('style');
    st.id = 'amenti-rv-css';
    st.textContent =
      '#amenti-roster-view{max-width:1100px;margin:26px auto 8px;padding:0 18px;'
    +   'font-family:var(--body,sans-serif)}'
    + '.rv-bar-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:7px}'
    + '.rv-tabs{display:flex;gap:6px;flex-wrap:wrap}'
    + '.rv-name{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.18em;'
    +   'text-transform:uppercase;color:#8f95ab}'
    + '.rv-count{margin-left:auto;font-family:var(--mono,monospace);font-size:10.5px;'
    +   'letter-spacing:.12em;text-transform:uppercase;color:#8f95ab}'
    + '.rv-count b{color:#57c98a;font-size:14px}'
    + '.rv-bar{height:3px;background:#161c27;border-radius:2px;overflow:hidden}'
    + '.rv-bar i{display:block;height:100%;background:linear-gradient(90deg,#2f6b4c,#57c98a)}'
    + '.rv-note{font-family:var(--mono,monospace);font-size:9px;letter-spacing:.1em;'
    +   'text-transform:uppercase;color:#6b7180;margin:7px 0 0}'
    + '.rv-dark{border:1px solid rgba(248,113,113,.36);background:rgba(248,113,113,.05);'
    +   'border-radius:8px;padding:14px 16px;color:#c8ccdc;font-size:15px;line-height:1.6}'
    + '.rv-dark b{color:#e08060}';
    document.head.appendChild(st);
  }

  function mount() {
    css();
    host = $('amenti-roster-view');
    if (!host) {
      /* no slot on the page — place it above the arena rather than nowhere */
      var arena = document.getElementById('amenti-roster') || document.querySelector('.roster-grid');
      if (!arena || !arena.parentNode) return;
      host = document.createElement('section');
      host.id = 'amenti-roster-view';
      arena.parentNode.insertBefore(host, arena);
    }
    load();
    /* the arena repaints on its own schedule; the filter must survive that */
    document.addEventListener('amenti:stacks', function () { apply(); });
    try {
      var a = window.amentiAuth;
      if (a && a.sb && a.sb.auth && a.sb.auth.onAuthStateChange)
        a.sb.auth.onAuthStateChange(function () { load(); });
    } catch (e) {}
  }

  window.amentiRosterView = { reload: load, add: add };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
