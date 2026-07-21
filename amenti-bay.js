/* ===========================================================================
   amenti-bay.js — THE CARD BAY
   ---------------------------------------------------------------------------
   BUILT      2026-07-20 · 11:40 UTC
   AMENTI.LIVE · Ingram Manor LLC

   In Page1.html, after amenti-roster.js:
       <script src="amenti-bay.js" defer></script>

   WHAT THIS IS
     Where a figure's stack lives. Gate rows sat on the card and were right
     when a figure held two; at seven they are two hundred pixels of list on a
     tile that was two hundred tall, and the arena becomes a column of cards at
     wildly different heights. A grid cannot survive that.

     So the card keeps a count, and the depth moves here.

   THE STRIP IS THE ARGUMENT, AND THAT IS NOT A LAYOUT CLAIM
     Jefferson's bay reads: the Declaration · Monticello · the Louisiana
     Purchase · Sally Hemings. That fourth title tells a seeker what kind of
     place this is BEFORE they answer a single question.

     A library that holds Jefferson and does not hold Hemings has made a
     choice; so has one that does. You cannot say that by paging — they would
     have to earn their way to it, and by then it is a reveal rather than a
     promise.

     So LOCKED CARDS SHOW THEIR TITLES. Dimmed, unclickable, legible. Hiding
     one would be the platform flinching at its own premise.

   IT DERIVES NOTHING
     The roster has already grouped by figure, ordered by depth and looked up
     progress. This reads window.AMENTI_STACKS and window.AMENTI_PROGRESS —
     the same objects. A second surface that re-derived any of it would be a
     second source of truth for the same fact, which is the fault this whole
     build keeps finding.
   =========================================================================== */
(function () {
  'use strict';

  var open = null;     // { figure, stack, index }
  var el = null;

  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c];
    });
  }

  function progress(id) {
    var P = window.AMENTI_PROGRESS;
    return (P && P[id]) || null;
  }

  /* the same faceted token the card and the roster use — one object, three
     surfaces, drawn the same way in each */
  function mark(kind, filled) {
    var inner = kind === 'quill'
      ? (filled
          ? '<path d="M19 4 C12 6 7 11 5 18 C10 16 15 12 18 8 Z" fill="#c4a5ff" fill-opacity=".22"'
            + ' stroke="#c4a5ff" stroke-width="1.3"/><path d="M5 18 L3 23" stroke="#c4a5ff"'
            + ' stroke-width="1.4" stroke-linecap="round" fill="none"/>'
          : '<path d="M19 4 C12 6 7 11 5 18 C10 16 15 12 18 8" fill="none" stroke="#39434f"'
            + ' stroke-width="1.4" stroke-dasharray="2 2.4"/>')
      : (filled
          ? '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
            + ' fill="#0c4a2e" stroke="#d4a017" stroke-width="1.1"/>'
            + '<path d="M12 7 C11 4.5 8 3 5 6 L12 11 Z" fill="#57c98a"/>'
            + '<path d="M12 7 C13 4.5 16 3 19 6 L12 11 Z" fill="#4ab77c"/>'
            + '<path d="M12 11 L16 15 L12 20 L8 15 Z" fill="#e0563a"/>'
          : '<path d="M12 24 C3 16 1 10 5 6 C8 3 11 4.5 12 7 C13 4.5 16 3 19 6 C23 10 21 16 12 24 Z"'
            + ' fill="none" stroke="#39434f" stroke-width="1.4" stroke-dasharray="2 2.4"/>');
    /* size on the element, never only in CSS */
    return '<svg viewBox="0 0 24 26" width="12" height="13" style="width:12px;height:13px;'
      + 'display:block;flex:0 0 auto;background:none" aria-hidden="true">' + inner + '</svg>';
  }

  function marksFor(t) {
    var p = progress(t.id);
    var hOf = p ? p.heartsOf : Math.max(0, (t.questions || 0) - 2);
    var wOf = p ? p.quillsOf : ((t.questions || 0) >= 6 ? 2 : 0);
    var h = p ? p.hearts.length : 0, w = p ? p.quills.length : 0;
    var out = '';
    for (var i = 0; i < hOf; i++) out += mark('heart', i < h);
    for (var j = 0; j < wOf; j++) out += mark('quill', j < w);
    return { html: out, held: h + w, of: hOf + wOf, passed: !!(p && p.gateOpen) };
  }

  /* a gate is reachable when the one before it has been passed. The first
     always is. This is the only rule the bay enforces. */
  function states(stack) {
    var opened = true;
    return stack.map(function (t) {
      var m = marksFor(t);
      var st = m.passed ? 'passed' : (opened ? 'current' : 'locked');
      if (!m.passed) opened = false;
      return st;
    });
  }

  function draw() {
    if (!el || !open) return;
    var stack = open.stack, st = states(stack);
    var i = Math.min(open.index, stack.length - 1);
    var t = stack[i], m = marksFor(t), state = st[i];
    var art = null;
    try {
      var rec = (window.AMENTI_CHARS || []).filter(function (c) {
        return c && c.name && String(c.name).toLowerCase().indexOf(
          String(open.figure).split(/\s+/).pop().toLowerCase()) !== -1; })[0];
      if (rec && window.AMENTI_SVG && window.AMENTI_SVG[rec.key])
        art = window.AMENTI_SVG[rec.key]();
    } catch (e) {}

    el.querySelector('.bay-inner').innerHTML =
        '<button class="bay-x" style="background:none;border:none;color:#6b7180;font-size:24px;'
      +   'line-height:1;cursor:pointer;font-family:inherit">&#215;</button>'
      + '<p class="bay-fig">' + esc(open.figure) + '</p>'
      + '<div class="bay-open">'
      +   '<div class="bay-art">' + (art || '<div class="bay-noart">no portrait yet</div>') + '</div>'
      +   '<div class="bay-meta">'
      +     '<p class="bay-depth">DEPTH ' + (t.depth || 1) + ' &#183; '
      +       (state === 'passed' ? 'PASSED' : state === 'locked' ? 'LOCKED' : 'OPEN') + '</p>'
      +     '<h3 class="bay-title">' + esc(t.label || t.title || t.id) + '</h3>'
      +     '<p class="bay-sub">' + esc(t.title || '') + '</p>'
      +     '<div class="bay-marks">' + m.html
      +       '<span class="bay-count">' + m.held + ' of ' + m.of + '</span></div>'
      +     (state === 'locked'
            ? '<p class="bay-locked">Pass the gate before this one.</p>'
            : '<button class="bay-go" data-topic="' + esc(t.id) + '"'
              + ' style="background:#d4a017;border:none;color:#08090e;font-family:inherit;'
              + 'font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:12px;'
              + 'padding:10px 20px;border-radius:4px;cursor:pointer">'
              + (state === 'passed' ? 'Read it again' : 'Begin') + '</button>')
      +   '</div>'
      + '</div>'
      + '<p class="bay-striplab">' + stack.length + ' gate' + (stack.length === 1 ? '' : 's')
      +   ' &#183; every one named, whether or not it is open</p>'
      + '<div class="bay-strip">'
      +   stack.map(function (q, n) {
            var mm = marksFor(q), s2 = st[n];
            return '<button class="bay-card ' + s2 + (n === i ? ' on' : '') + '" data-i="' + n + '"'
              + ' style="background:#0a0b11;border:1px solid '
              + (n === i ? '#d4a017' : s2 === 'passed' ? '#2f6b4c' : s2 === 'current' ? '#8a6510' : '#232838')
              + ';color:#8f95ab;font-family:inherit;cursor:' + (s2 === 'locked' ? 'default' : 'pointer') + '">'
              +   '<span class="bay-card-d">d' + (q.depth || 1) + '</span>'
              +   '<span class="bay-card-t">' + esc(q.label || q.title || q.id) + '</span>'
              +   '<span class="bay-card-m">' + mm.html + '</span>'
              + '</button>';
          }).join('')
      + '</div>';

    el.querySelector('.bay-x').addEventListener('click', close);
    Array.prototype.forEach.call(el.querySelectorAll('.bay-card'), function (b) {
      b.addEventListener('click', function () {
        var n = +b.getAttribute('data-i');
        if (st[n] === 'locked') return;      // shown, named, and not openable
        open.index = n; draw();
      });
    });
    var go = el.querySelector('.bay-go');
    if (go) go.addEventListener('click', function () {
      var id = go.getAttribute('data-topic');
      close();
      try { if (window.amentiQuiz && window.amentiQuiz.open) window.amentiQuiz.open(id); } catch (e) {}
    });
  }

  function show(figure) {
    var stacks = window.AMENTI_STACKS || {};
    var stack = stacks[figure];
    if (!stack || !stack.length) return false;
    open = { figure: figure, stack: stack, index: 0 };
    /* open on the first gate not yet passed — the work, not the trophies */
    var st = states(stack);
    for (var i = 0; i < st.length; i++) if (st[i] === 'current') { open.index = i; break; }
    mount();
    el.classList.add('on');
    document.documentElement.style.overflow = 'hidden';
    draw();
    return true;
  }

  function close() {
    if (!el) return;
    el.classList.remove('on');
    document.documentElement.style.overflow = '';
    open = null;
  }

  function css() {
    if (document.getElementById('amenti-bay-css')) return;
    var s = document.createElement('style');
    s.id = 'amenti-bay-css';
    s.textContent =
      '#amenti-bay{position:fixed;inset:0;z-index:9000;background:rgba(5,6,10,.94);'
    +   'display:none;overflow-y:auto;padding:4vh 16px}'
    + '#amenti-bay.on{display:block}'
    + '.bay-inner{max-width:820px;margin:0 auto;position:relative}'
    + '.bay-x{position:absolute;right:0;top:-6px}'
    + '.bay-fig{font-family:var(--amenti,serif);font-size:clamp(24px,5vw,40px);color:#f5c542;'
    +   'margin:0 0 18px;letter-spacing:.02em}'
    + '.bay-open{display:grid;grid-template-columns:170px 1fr;gap:22px;align-items:start;'
    +   'border:1px solid #232838;border-radius:10px;background:#0d0f17;padding:18px}'
    + '@media(max-width:620px){.bay-open{grid-template-columns:1fr}}'
    + '.bay-art{background:#0a0b11;border-radius:6px;overflow:hidden;aspect-ratio:320/460}'
    + '.bay-art svg{width:100%;height:100%;display:block}'
    + '.bay-noart{display:flex;align-items:center;justify-content:center;height:100%;'
    +   'font-family:var(--mono,monospace);font-size:9px;letter-spacing:.14em;'
    +   'text-transform:uppercase;color:#39434f}'
    + '.bay-depth{font-family:var(--mono,monospace);font-size:9px;letter-spacing:.2em;color:#6b7180;margin:0}'
    + '.bay-title{font-family:var(--amenti,serif);font-size:26px;color:#fff;margin:6px 0 4px}'
    + '.bay-sub{font-size:14px;color:#8f95ab;margin:0 0 14px;line-height:1.5}'
    + '.bay-marks{display:flex;align-items:center;gap:3px;margin-bottom:16px}'
    + '.bay-count{font-family:var(--mono,monospace);font-size:9px;letter-spacing:.12em;'
    +   'text-transform:uppercase;color:#6b7180;margin-left:8px}'
    + '.bay-locked{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.1em;'
    +   'text-transform:uppercase;color:#4a5260;margin:0}'
    + '.bay-striplab{font-family:var(--mono,monospace);font-size:9px;letter-spacing:.12em;'
    +   'text-transform:uppercase;color:#6b7180;margin:18px 0 8px}'
    + '.bay-strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}'
    + '.bay-card{display:flex;flex-direction:column;gap:6px;border-radius:6px;padding:10px;'
    +   'text-align:left;transition:.15s}'
    + '.bay-card:hover:not(.locked){border-color:#d4a017 !important;background:#12141d !important}'
    /* LOCKED IS DIMMED, NEVER HIDDEN. The title is the argument. */
    + '.bay-card.locked{opacity:.5}'
    + '.bay-card.on{background:#12141d !important}'
    + '.bay-card-d{font-family:var(--mono,monospace);font-size:7.5px;color:#4a5260}'
    + '.bay-card-t{font-size:12.5px;color:#c8ccdc;line-height:1.3}'
    + '.bay-card.locked .bay-card-t{color:#6b7180}'
    + '.bay-card-m{display:flex;gap:2px;line-height:0}';
    document.head.appendChild(s);
  }

  function mount() {
    css();
    if (el) return;
    el = document.createElement('div');
    el.id = 'amenti-bay';
    el.innerHTML = '<div class="bay-inner"></div>';
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    document.body.appendChild(el);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* a card with more than one gate opens the bay instead of a quiz */
  function wire() {
    var stacks = window.AMENTI_STACKS || {};
    Array.prototype.forEach.call(document.querySelectorAll('.roster-card[data-figure]'), function (c) {
      if (c.getAttribute('data-bay') === '1') return;
      var f = c.getAttribute('data-figure');
      if (!stacks[f] || stacks[f].length < 2) return;
      c.setAttribute('data-bay', '1');
      c.addEventListener('click', function (e) {
        if (show(f)) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    });
  }

  document.addEventListener('amenti:stacks', wire);
  window.amentiBay = { open: show, close: close };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { css(); wire(); });
  else { css(); wire(); }
})();
