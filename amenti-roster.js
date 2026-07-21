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

  /* ---- one figure ------------------------------------------------------- */
  function row(f, i) {
    var state = f.awaiting ? 'awaiting' : (f.weighed ? 'weighed' : 'open');
    var mark  = f.awaiting ? '' : heart(f.weighed);
    var note  = f.awaiting ? 'not yet set for trial'
              : (f.weighed ? 'weighed'
                 : f.quizzes + (f.quizzes === 1 ? ' gate' : ' gates'));
    return '<div class="rv-row ' + state + '" data-figure="' + esc(f.figure) + '"'
      + ' style="background:#0a0b11;border:1px solid '
      + (state === 'weighed' ? '#2f6b4c' : state === 'awaiting' ? '#232838' : '#8a6510')
      + ';color:#8f95ab">'
      +   '<span class="rv-n">' + (i + 1) + '</span>'
      +   '<span class="rv-m">' + mark + '</span>'
      +   '<span class="rv-f">' + esc(f.figure) + '</span>'
      +   '<span class="rv-s">' + note + '</span>'
      /* THE CHROME IS INLINE, NOT ONLY IN THE STYLESHEET.
         A <button> with no CSS gets the browser's default appearance — grey,
         raised, system font. Twenty-five of them down a panel and the whole
         thing washes white, which is exactly what happened to the arena
         earlier today when a stylesheet failed to inject. The class still
         carries hover and colour; these four properties carry the difference
         between a dark panel and a page of grey boxes. */
      +   '<button class="rv-x" data-drop="' + esc(f.figure) + '"'
      +     ' style="background:none;border:none;color:#39434f;font-family:inherit;'
      +     'font-size:15px;line-height:1;padding:0;cursor:pointer"'
      +     ' title="Remove from this roster">&#215;</button>'
      + '</div>';
  }

  /* ---- the panel -------------------------------------------------------- */
  function draw() {
    if (!host) return;
    if (!data || !data.length) {
      host.innerHTML = '<div class="rv-dark"><b>No roster yet.</b><br>'
        + 'Sign in and one will be waiting &mdash; twenty-five to begin with, '
        + 'and every one of them yours to remove.</div>';
      return;
    }
    var r = data[Math.min(active, data.length - 1)];

    /* UNWEIGHED FIRST. That is the useful order — a study set should open on
       the work rather than the trophies — and the header says so, because a
       list that reorders itself without saying is a list you cannot trust. */
    var figs = r.figures.slice().sort(function (a, b) {
      var ra = a.weighed ? 2 : (a.awaiting ? 1 : 0);
      var rb = b.weighed ? 2 : (b.awaiting ? 1 : 0);
      return ra - rb;
    });

    var tabs = data.map(function (x, i) {
      return '<button class="rv-tab' + (i === active ? ' on' : '') + '" data-tab="' + i + '"'
        + ' style="background:#0a0b11;border:1px solid '
        + (i === active ? '#d4a017' : '#232838')
        + ';color:' + (i === active ? '#f5c542' : '#8f95ab')
        + ';font-family:inherit;border-radius:12px;padding:4px 11px;cursor:pointer">'
        + esc(x.name) + '</button>';
    }).join('');

    var pct = r.count ? Math.round(r.weighed / r.count * 100) : 0;

    host.innerHTML =
        '<div class="rv-head">'
      +   '<div class="rv-tabs">' + tabs + '</div>'
      +   '<div class="rv-count"><b>' + r.weighed + '</b> of ' + r.count + ' weighed</div>'
      + '</div>'
      + '<div class="rv-bar"><i style="width:' + pct + '%"></i></div>'
      + '<p class="rv-note">Unweighed first. ' + (r.count) + ' of ' + r.of + ' places filled.</p>'
      + '<div class="rv-list">' + figs.map(row).join('') + '</div>'
      + '<p class="rv-foot">A roster holds twenty-five. It is meant to be a choice.</p>';

    Array.prototype.forEach.call(host.querySelectorAll('.rv-tab'), function (b) {
      b.addEventListener('click', function () { active = +b.getAttribute('data-tab'); draw(); });
    });
    Array.prototype.forEach.call(host.querySelectorAll('.rv-x'), function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        drop(r.id, b.getAttribute('data-drop'));
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('.rv-row'), function (el) {
      el.addEventListener('click', function () {
        var f = el.getAttribute('data-figure');
        try {
          var card = document.querySelector('.roster-card[data-figure="' + f.replace(/"/g, '') + '"]');
          if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.add('rv-lit');
                      setTimeout(function () { card.classList.remove('rv-lit'); }, 1600); }
        } catch (e) {}
      });
    });
  }

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
      '#amenti-roster-view{max-width:760px;margin:34px auto;padding:0 18px;font-family:var(--body,sans-serif)}'
    + '.rv-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px;margin-bottom:9px}'
    + '.rv-tabs{display:flex;gap:6px;flex-wrap:wrap}'
    + '.rv-tab{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.14em;text-transform:uppercase;'
    +   'background:#0a0b11;border:1px solid #232838;color:#8f95ab;border-radius:12px;padding:4px 11px;cursor:pointer}'
    + '.rv-tab.on{border-color:#d4a017;color:#f5c542}'
    + '.rv-count{margin-left:auto;font-family:var(--mono,monospace);font-size:11px;'
    +   'letter-spacing:.12em;text-transform:uppercase;color:#8f95ab}'
    + '.rv-count b{color:#57c98a;font-size:15px}'
    + '.rv-bar{height:3px;background:#161c27;border-radius:2px;overflow:hidden}'
    + '.rv-bar i{display:block;height:100%;background:linear-gradient(90deg,#2f6b4c,#57c98a)}'
    + '.rv-note{font-family:var(--mono,monospace);font-size:9.5px;letter-spacing:.1em;'
    +   'text-transform:uppercase;color:#6b7180;margin:7px 0 12px}'
    + '.rv-list{display:flex;flex-direction:column;gap:3px}'
    + '.rv-row{display:grid;grid-template-columns:20px 14px 1fr auto 22px;align-items:center;gap:9px;'
    +   'border-radius:4px;padding:6px 9px;cursor:pointer;transition:.15s}'
    + '.rv-row:hover{border-color:#d4a017 !important;background:#12141d !important}'
    + '.rv-row.weighed .rv-f{color:#6b7180}'
    + '.rv-row.awaiting{opacity:.62}'
    + '.rv-n{font-family:var(--mono,monospace);font-size:8.5px;color:#4a5260;text-align:right}'
    + '.rv-m{display:flex;align-items:center;line-height:0}'
    + '.rv-f{font-size:14px;color:#c8ccdc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.rv-s{font-family:var(--mono,monospace);font-size:8.5px;letter-spacing:.09em;'
    +   'text-transform:uppercase;color:#6b7180}'
    + '.rv-row.weighed .rv-s{color:#57c98a}'
    + '.rv-x{background:none;border:none;color:#39434f;font-size:15px;cursor:pointer;line-height:1;padding:0}'
    + '.rv-x:hover{color:#f87171}'
    + '.rv-foot{font-family:var(--mono,monospace);font-size:9px;letter-spacing:.12em;'
    +   'text-transform:uppercase;color:#4a5260;text-align:center;margin-top:14px}'
    + '.rv-dark{border:1px solid rgba(248,113,113,.36);background:rgba(248,113,113,.05);'
    +   'border-radius:8px;padding:16px 18px;color:#c8ccdc;font-size:15px;line-height:1.6}'
    + '.rv-dark b{color:#e08060}'
    + '.roster-card.rv-lit{outline:1px solid #d4a017;outline-offset:3px}';
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
